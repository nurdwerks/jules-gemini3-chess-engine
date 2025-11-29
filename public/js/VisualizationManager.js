/* global ArrowManager, ClientUtils, Chess */

window.VisualizationManager = (() => {
  let highlights = {}
  let lines = []
  let opacities = {}

  const getToggles = () => ({
    kingSafety: document.getElementById('viz-king-safety'),
    mobility: document.getElementById('viz-mobility'),
    utilization: document.getElementById('viz-utilization'),
    pieceTracker: document.getElementById('viz-piece-tracker'),
    outpost: document.getElementById('viz-outpost'),
    weakSquare: document.getElementById('viz-weak-square'),
    battery: document.getElementById('viz-battery'),
    xray: document.getElementById('viz-xray'),
    pin: document.getElementById('viz-pin'),
    fork: document.getElementById('viz-fork'),
    discovered: document.getElementById('viz-discovered')
  })

  const _addHighlight = (alg, className) => {
    if (!highlights[alg]) highlights[alg] = []
    if (!highlights[alg].includes(className)) highlights[alg].push(className)
  }

  const _checkRay = (board, r, c, d, callback) => {
    let r2 = r + d[0]
    let c2 = c + d[1]
    while (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8) {
      if (callback(r2, c2, board[r2][c2])) break
      r2 += d[0]
      c2 += d[1]
    }
  }

  const _getKingPos = (board, turn) => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c]
        if (p && p.type === 'k' && p.color === turn) return { r, c }
      }
    }
    return null
  }

  const _forEachSquare = (board, cb) => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        cb(r, c, board[r][c])
      }
    }
  }

  const _isSlider = (p, d) => {
    const isOrtho = (d[0] === 0 || d[1] === 0)
    const isDiag = (d[0] !== 0 && d[1] !== 0)
    return (isOrtho && (p.type === 'r' || p.type === 'q')) || (isDiag && (p.type === 'b' || p.type === 'q'))
  }

  const _calcUtilization = (game) => {
    const counts = {}
    const history = game.history({ verbose: true })
    history.forEach(m => {
      counts[m.from] = (counts[m.from] || 0) + 1
      counts[m.to] = (counts[m.to] || 0) + 1
    })
    const max = Math.max(...Object.values(counts), 1)
    Object.keys(counts).forEach(alg => {
      const val = counts[alg]
      _addHighlight(alg, 'viz-utilization')
      opacities[alg] = { value: Math.min((val / max) * 0.8 + 0.1, 0.9), color: 'red' }
    })
  }

  const _calcPieceTracker = (game, selectedSquare) => {
    if (!selectedSquare) return
    const alg = ClientUtils.coordsToAlgebraic(selectedSquare.row, selectedSquare.col)
    let current = alg
    const history = game.history({ verbose: true })
    for (let i = history.length - 1; i >= 0; i--) {
      const m = history[i]
      if (m.to === current) {
        lines.push({ from: m.from, to: m.to, className: 'viz-line-tracker' })
        current = m.from
      }
    }
  }

  const _calcKingSafety = (game) => {
    const board = game.board()
    const turn = game.turn()
    const kingPos = _getKingPos(board, turn)
    if (kingPos) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = kingPos.r + dr
          const c = kingPos.c + dc
          if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const alg = ClientUtils.coordsToAlgebraic(r, c)
            _addHighlight(alg, 'highlight-red')
            opacities[alg] = { value: 0.4, color: 'red' }
          }
        }
      }
    }
  }

  const _calcMobility = (game) => {
    const moves = game.moves({ verbose: true })
    const counts = {}
    moves.forEach(m => {
      counts[m.to] = (counts[m.to] || 0) + 1
    })
    const max = 5
    Object.keys(counts).forEach(alg => {
      _addHighlight(alg, 'viz-mobility')
      opacities[alg] = { value: Math.min((counts[alg] / max) * 0.5, 0.6), color: 'blue' }
    })
  }

  const _calcOutposts = (game) => {
    const board = game.board()
    _forEachSquare(board, (r, c, p) => {
      if (p && (p.type === 'n' || p.type === 'b')) {
        const isWhite = p.color === 'w'
        const rank = 8 - r
        if ((isWhite && rank >= 4 && rank <= 6) || (!isWhite && rank >= 3 && rank <= 5)) {
          const alg = ClientUtils.coordsToAlgebraic(r, c)
          _addHighlight(alg, 'viz-outpost')
        }
      }
    })
  }

  const _isSquareThreatened = (alg, game) => {
    // Simple check: can opponent move to alg?
    // Note: this modifies game or clones it.
    // Let's try to not modify if possible or clone.
    // Cloning cheap?
    // game.fen() is fast?
    const fen = game.fen()
    const tokens = fen.split(' ')
    const turn = tokens[1]
    const opponent = turn === 'w' ? 'b' : 'w'
    tokens[1] = opponent
    tokens[3] = '-'
    const tempFen = tokens.join(' ')
    // We need chess.js constructor. We don't have it unless global 'Chess' is available.
    if (typeof Chess !== 'undefined') {
      const tempGame = new Chess(tempFen)
      const moves = tempGame.moves({ verbose: true })
      return moves.some(m => m.to === alg)
    }
    return false
  }

  const _calcWeakSquaresImpl = (game) => {
    const board = game.board()
    const turn = game.turn()
    const kingPos = _getKingPos(board, turn)
    if (!kingPos) return
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const r = kingPos.r + dr
        const c = kingPos.c + dc
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const alg = ClientUtils.coordsToAlgebraic(r, c)
          if (_isSquareThreatened(alg, game)) {
            _addHighlight(alg, 'viz-weak-square')
          }
        }
      }
    }
  }

  const _calcBattery = (game) => {
    const board = game.board()
    const turn = game.turn()
    _forEachSquare(board, (r, c, p) => {
      if (p && p.color === turn && (p.type === 'q' || p.type === 'r' || p.type === 'b')) {
        const dirs = []
        if (p.type !== 'b') dirs.push([-1, 0], [1, 0], [0, -1], [0, 1])
        if (p.type !== 'r') dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1])
        dirs.forEach(d => _checkRay(board, r, c, d, (r2, c2, p2) => {
          if (p2) {
            if (p2.color === turn && _isSlider(p2, d)) {
              lines.push({ from: ClientUtils.coordsToAlgebraic(r, c), to: ClientUtils.coordsToAlgebraic(r2, c2), className: 'viz-line-battery' })
            }
            return true
          }
          return false
        }))
      }
    })
  }

  const _calcPins = (game) => {
    const board = game.board()
    const turn = game.turn()
    const kingPos = _getKingPos(board, turn)
    if (!kingPos) return
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]
    dirs.forEach(d => {
      let friendly = null
      _checkRay(board, kingPos.r, kingPos.c, d, (r2, c2, p) => {
        if (p) {
          if (p.color === turn) {
            if (friendly) return true
            friendly = { r: r2, c: c2 }
            return false
          } else {
            if (friendly && _isSlider(p, d)) {
              lines.push({ from: ClientUtils.coordsToAlgebraic(p.r || r2, p.c || c2), to: ClientUtils.coordsToAlgebraic(kingPos.r, kingPos.c), className: 'viz-line-pin' })
            }
            return true
          }
        }
        return false
      })
    })
  }

  const _calcForks = (game) => {
    const board = game.board()
    const turn = game.turn()
    _forEachSquare(board, (r, c, p) => {
      if (p && p.color === turn) {
        const alg = ClientUtils.coordsToAlgebraic(r, c)
        const moves = game.moves({ square: alg, verbose: true })
        const targets = new Set()
        moves.forEach(m => {
          if (m.flags.includes('c') || m.flags.includes('e')) targets.add(m.to)
        })
        if (targets.size >= 2) {
          _addHighlight(alg, 'viz-fork-source')
          targets.forEach(t => _addHighlight(t, 'viz-fork-target'))
        }
      }
    })
  }

  const _calcDiscovered = (game) => {
    // Placeholder
  }

  const visualizers = [
    { id: 'utilization', fn: _calcUtilization },
    { id: 'pieceTracker', fn: _calcPieceTracker },
    { id: 'kingSafety', fn: _calcKingSafety },
    { id: 'mobility', fn: _calcMobility },
    { id: 'outpost', fn: _calcOutposts },
    { id: 'weakSquare', fn: _calcWeakSquaresImpl },
    { id: 'battery', fn: _calcBattery },
    { id: 'xray', fn: (g) => {} },
    { id: 'pin', fn: _calcPins },
    { id: 'fork', fn: _calcForks },
    { id: 'discovered', fn: _calcDiscovered }
  ]

  const calculate = (game, selectedSquare) => {
    highlights = {}
    lines = []
    opacities = {}
    if (!game) return
    const toggles = getToggles()
    visualizers.forEach(v => {
      if (toggles[v.id] && toggles[v.id].checked) v.fn(game, selectedSquare)
    })
    if (ArrowManager) ArrowManager.setVizLines(lines)
  }

  return {
    calculate,
    getHighlights: (alg) => highlights[alg] || [],
    getOpacity: (alg) => opacities[alg]
  }
})()
