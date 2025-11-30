/* eslint-env browser */
/* global Chess */

window.TrainingManager = class TrainingManager {
  constructor (game, boardRenderer, callbacks) {
    this.game = game
    this.boardRenderer = boardRenderer
    this.callbacks = callbacks || {}

    // Memory
    this.isMemoryTraining = false
    this.memoryTargetFen = ''
    this.memoryTimerInterval = null
    this.selectedPalettePiece = null
    this.memoryFens = [
      'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
      'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      'rnbqkb1r/pppppppp/5n2/8/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2',
      'r1bq1rk1/ppp2ppp/2n2n2/3pp3/1b1P4/2N1PN2/PPP1BPPP/R1BQ1RK1 w - - 0 7'
    ]

    // Tactics
    this.isTacticsMode = false
    this.currentPuzzle = null
    this.currentPuzzleMoveIndex = 0
    this.tacticsPuzzles = []

    // Endgame
    this.endgameConfigs = {
      'kp-vs-k': { fen: '8/4k3/8/8/4P3/8/4K3/8 w - - 0 1', userColor: 'w' },
      'kq-vs-k': { fen: '8/8/8/8/8/8/Q7/4k2K w - - 0 1', userColor: 'w' },
      'kr-vs-k': { fen: '8/8/8/8/8/8/R7/4k2K w - - 0 1', userColor: 'w' },
      lucena: { fen: '1r6/4P3/3K4/8/8/8/k7/8 w - - 0 1', userColor: 'w' },
      philidor: { fen: '8/8/1k6/2P5/8/2R5/8/4K3 w - - 0 1', userColor: 'b' }
    }
  }

  // --- Memory Training ---

  startMemoryTraining () {
    this.isMemoryTraining = true
    this.selectedPalettePiece = null
    const fen = this.memoryFens[Math.floor(Math.random() * this.memoryFens.length)]
    this.memoryTargetFen = fen

    this.game.load(fen)
    this.boardRenderer.render({ board: this.game.board(), chess: this.game, currentViewIndex: -1 })

    if (this.callbacks.onMemoryStart) this.callbacks.onMemoryStart(fen)

    let timeLeft = 5
    if (this.memoryTimerInterval) clearInterval(this.memoryTimerInterval)
    this.memoryTimerInterval = setInterval(() => {
      timeLeft--
      if (this.callbacks.onMemoryTick) this.callbacks.onMemoryTick(timeLeft)
      if (timeLeft <= 0) {
        clearInterval(this.memoryTimerInterval)
        this._startMemoryReconstruction()
      }
    }, 1000)
  }

  _startMemoryReconstruction () {
    this.game.clear()
    this.boardRenderer.render({ board: this.game.board(), chess: this.game, currentViewIndex: -1 })
    this.renderPalette()
    if (this.callbacks.onMemoryReconstructionStart) this.callbacks.onMemoryReconstructionStart()
  }

  renderPalette () {
    const palette = document.getElementById('piece-palette')
    if (!palette) return
    palette.innerHTML = ''
    const pieces = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK']
    pieces.forEach(p => {
      const color = p[0]
      const type = p[1].toLowerCase()
      const div = document.createElement('div')
      div.classList.add('palette-piece')
      const img = document.createElement('img')
      img.src = `images/${this.boardRenderer.currentPieceSet}/${color}${type}.svg`
      div.appendChild(img)
      div.addEventListener('click', () => {
        document.querySelectorAll('.palette-piece').forEach(el => el.classList.remove('selected'))
        div.classList.add('selected')
        this.selectPalettePiece(color, type)
      })
      palette.appendChild(div)
    })
  }

  handleMemoryClick (row, col, alg) {
    if (this.selectedPalettePiece) {
      this.game.put({ type: this.selectedPalettePiece.type, color: this.selectedPalettePiece.color }, alg)
    } else {
      const piece = this.game.get(alg)
      if (piece) {
        this.game.remove(alg)
      }
    }
    this.boardRenderer.render({ board: this.game.board(), chess: this.game, currentViewIndex: -1 })
  }

  selectPalettePiece (color, type) {
    this.selectedPalettePiece = { color, type }
  }

  stopMemoryTraining () {
    this.isMemoryTraining = false
    if (this.memoryTimerInterval) clearInterval(this.memoryTimerInterval)
  }

  checkMemoryResult () {
    const currentBoard = this.game.board()
    const targetGame = new Chess(this.memoryTargetFen)
    const targetBoard = targetGame.board()

    let correct = 0
    let total = 0

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const t = targetBoard[r][c]
        const cur = currentBoard[r][c]
        if (t) {
          total++
          if (cur && cur.type === t.type && cur.color === t.color) {
            correct++
          }
        }
      }
    }

    const score = total > 0 ? Math.round((correct / total) * 100) : 0
    if (score === 100) this.stopMemoryTraining()
    return { score, correct, total }
  }

  // --- Tactics Trainer ---

  async startTacticsTrainer () {
    if (this.tacticsPuzzles.length === 0) {
      try {
        const res = await fetch('puzzles.json')
        if (res.ok) {
          this.tacticsPuzzles = await res.json()
        }
      } catch (e) {}
    }
    this.isTacticsMode = true
    this.isMemoryTraining = false
    this.nextTacticsPuzzle()
  }

  nextTacticsPuzzle () {
    if (this.tacticsPuzzles.length === 0) return
    const puzzle = this.tacticsPuzzles[Math.floor(Math.random() * this.tacticsPuzzles.length)]
    this._loadPuzzle(puzzle)
  }

  async startDailyPuzzle () {
    try {
      const res = await fetch('https://lichess.org/api/puzzle/daily')
      if (res.ok) {
        const data = await res.json()
        const tempGame = new Chess()
        tempGame.load_pgn(data.game.pgn)
        const history = tempGame.history({ verbose: true })
        tempGame.reset()
        for (let i = 0; i < data.puzzle.initialPly; i++) {
          tempGame.move(history[i])
        }
        const puzzle = {
          fen: tempGame.fen(),
          moves: data.puzzle.solution,
          description: `Daily Puzzle (Rating: ${data.puzzle.rating})`
        }
        this.tacticsPuzzles = [puzzle]
        this.isTacticsMode = true
        this._loadPuzzle(puzzle)
      }
    } catch (e) {
      console.error(e)
    }
  }

  _loadPuzzle (puzzle) {
    this.currentPuzzle = puzzle
    this.currentPuzzleMoveIndex = 0
    this.game.load(puzzle.fen)
    if (this.callbacks.onTacticsLoad) this.callbacks.onTacticsLoad(puzzle)
  }

  handleTacticsMove (move) {
    if (!this.currentPuzzle) return false
    const expected = this.currentPuzzle.moves[this.currentPuzzleMoveIndex]
    let uci = move.from + move.to
    if (move.promotion) uci += move.promotion

    if (uci === expected) {
      this.game.move(move)
      this.currentPuzzleMoveIndex++
      // If opponent replies exist
      if (this.currentPuzzleMoveIndex < this.currentPuzzle.moves.length) {
        setTimeout(() => {
          this._playOpponentTacticsMove()
        }, 500)
      } else {
        if (this.callbacks.onTacticsSolved) this.callbacks.onTacticsSolved()
      }
      return true
    }
    return false
  }

  _playOpponentTacticsMove () {
    const oppMoveStr = this.currentPuzzle.moves[this.currentPuzzleMoveIndex]
    const oppMove = {
      from: oppMoveStr.substring(0, 2),
      to: oppMoveStr.substring(2, 4),
      promotion: oppMoveStr.length > 4 ? oppMoveStr[4] : undefined
    }
    this.game.move(oppMove)
    this.currentPuzzleMoveIndex++
    this.boardRenderer.render({ board: this.game.board(), chess: this.game, currentViewIndex: -1 })
    if (this.callbacks.onMoveMade) this.callbacks.onMoveMade() // To update sound/history

    if (this.currentPuzzleMoveIndex >= this.currentPuzzle.moves.length) {
      if (this.callbacks.onTacticsSolved) this.callbacks.onTacticsSolved()
    }
  }

  // --- Endgame ---

  startEndgame (type) {
    const config = this.endgameConfigs[type]
    if (config) {
      this.game.load(config.fen)
      this.isTacticsMode = false
      this.isMemoryTraining = false
      if (this.callbacks.onEndgameStart) this.callbacks.onEndgameStart(config)
      return config
    }
    return null
  }
}
