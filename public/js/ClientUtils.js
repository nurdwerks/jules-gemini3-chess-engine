window.ClientUtils = {
  coordsToAlgebraic: (row, col) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const rank = 8 - row
    return files[col] + rank
  },

  generate960Fen: () => {
    const pieces = new Array(8).fill(null)
    const lightSquares = [1, 3, 5, 7]
    const darkSquares = [0, 2, 4, 6]

    const bishop1Pos = darkSquares[Math.floor(Math.random() * 4)]
    const bishop2Pos = lightSquares[Math.floor(Math.random() * 4)]

    pieces[bishop1Pos] = 'b'
    pieces[bishop2Pos] = 'b'

    const emptyIndices = () => pieces.map((p, i) => p === null ? i : null).filter(i => i !== null)
    let empty = emptyIndices()
    const queenPos = empty[Math.floor(Math.random() * empty.length)]
    pieces[queenPos] = 'q'

    empty = emptyIndices()
    const knight1Pos = empty[Math.floor(Math.random() * empty.length)]
    pieces[knight1Pos] = 'n'

    empty = emptyIndices()
    const knight2Pos = empty[Math.floor(Math.random() * empty.length)]
    pieces[knight2Pos] = 'n'

    empty = emptyIndices()
    pieces[empty[0]] = 'r'
    pieces[empty[1]] = 'k'
    pieces[empty[2]] = 'r'

    const whitePieces = pieces.map(p => p.toUpperCase()).join('')
    const blackPieces = pieces.join('')
    const castling = '-'

    return `${blackPieces}/pppppppp/8/8/8/8/PPPPPPPP/${whitePieces} w ${castling} - 0 1`
  },

  parseInfo: (msg) => {
    const parts = msg.split(' ')
    const info = {}
    const getVal = (key) => {
      const idx = parts.indexOf(key)
      if (idx !== -1 && idx + 1 < parts.length) return parts[idx + 1]
      return null
    }
    info.depth = getVal('depth')
    info.nodes = getVal('nodes')
    info.nps = getVal('nps')
    const scoreCp = getVal('cp')
    const scoreMate = getVal('mate')
    if (scoreMate) info.score = { type: 'mate', value: parseInt(scoreMate) }
    else if (scoreCp) info.score = { type: 'cp', value: parseInt(scoreCp) }
    const pvIdx = parts.indexOf('pv')
    if (pvIdx !== -1) info.pv = parts.slice(pvIdx + 1)
    const wdlIdx = parts.indexOf('wdl')
    if (wdlIdx !== -1) info.wdl = [parts[wdlIdx + 1], parts[wdlIdx + 2], parts[wdlIdx + 3]]
    return info.depth || info.score || info.pv ? info : null
  },

  getHandicapFen: (handicap) => {
    const map = {
      'knight-b1': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R1BQKBNR w KQkq - 0 1',
      'knight-g1': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKB1R w KQkq - 0 1',
      'rook-a1': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/1NBQKBNR w KQkq - 0 1',
      'rook-h1': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBN1 w KQkq - 0 1',
      queen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1',
      'pawn-f2': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPP1PP/RNBQKBNR w KQkq - 0 1'
    }
    return map[handicap]
  }
}
