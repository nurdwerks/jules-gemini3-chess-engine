const SEE = require('./SEE')

class MoveSorter {
  static sort (moves, board, ttMove, depth, prevMove, heuristics, options) {
    const getPieceValue = (piece) => {
      const values = { pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 20000 }
      return values[piece.type] || 0
    }

    const scoreMove = (m) => {
      // Captures
      if (m.flags.includes('c')) {
        const seeScore = SEE.see(board, m)
        if (seeScore < 0) {
          return -1000000 + seeScore
        }
        const victim = m.captured ? getPieceValue(m.captured) : 0
        const attacker = getPieceValue(m.piece)
        let score = 1000000 + victim * 10 - attacker + seeScore

        if (heuristics && options && options.UseCaptureHistory && m.captured) {
          score += heuristics.getCaptureHistory(m.piece.type, m.to, m.captured.type)
        }

        return score
      }

      // Killers
      if (depth < 64 && heuristics) {
        const killers = heuristics.getKillers(depth)
        if (killers && killers.some(k => k.from === m.from && k.to === m.to)) {
          return 900000
        }
      }

      // Countermove
      if (prevMove && heuristics) {
        const cm = heuristics.getCounterMove(board.activeColor, prevMove.from, prevMove.to)
        if (cm && cm.from === m.from && cm.to === m.to) {
          return 800000
        }
      }

      // History
      if (options && options.UseHistory && heuristics) {
        return heuristics.getHistoryScore(board.activeColor, m.from, m.to)
      }
      return 0
    }

    moves.sort((a, b) => {
      if (ttMove) {
        const isA = (a.from === ttMove.from && a.to === ttMove.to)
        const isB = (b.from === ttMove.from && b.to === ttMove.to)
        if (isA) return -1
        if (isB) return 1
      }
      const scoreA = scoreMove(a)
      const scoreB = scoreMove(b)
      return scoreB - scoreA
    })
  }

  static sortCaptures (moves) {
    const getPieceValue = (piece) => {
      const values = { pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 20000 }
      return values[piece.type] || 0
    }
    moves.sort((a, b) => {
      const valA = (a.promotion ? 900 : 0) + (a.captured ? getPieceValue(a.captured) : 0)
      const valB = (b.promotion ? 900 : 0) + (b.captured ? getPieceValue(b.captured) : 0)
      return valB - valA
    })
  }
}

module.exports = MoveSorter
