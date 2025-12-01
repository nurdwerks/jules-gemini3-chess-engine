const PerftTT = require('./PerftTT')
const trace = require('./trace')

class BoardPerft {
  static perft (board, depth, tt = null) {
    trace(`perft(depth: ${depth})`)
    if (depth === 0) return 1

    if (!tt) {
      tt = new PerftTT(64)
    }

    const cached = tt.probe(board.zobristKey, depth)
    if (cached !== null) {
      return Number(cached)
    }

    const moves = board.generateMoves()

    if (depth === 1) {
      const count = moves.length
      tt.save(board.zobristKey, depth, count)
      return count
    }

    trace(`perft(depth: ${depth}, moves: ${moves.length})`)
    let nodes = 0
    for (const move of moves) {
      const state = board.applyMove(move)
      nodes += BoardPerft.perft(board, depth - 1, tt)
      board.undoApplyMove(move, state)
    }

    tt.save(board.zobristKey, depth, nodes)
    return nodes
  }
}

module.exports = BoardPerft
