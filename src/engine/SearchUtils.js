const San = require('./San')

class SearchUtils {
  static moveToString (board, move) {
    return San.moveToString(board, move)
  }

  static isSameMove (m1, m2) {
    return m1.from === m2.from && m1.to === m2.to && m1.promotion === m2.promotion
  }

  static getPVLine (board, tt, depth, firstMove) {
    const pv = []
    const movesMade = []
    try {
      if (firstMove) {
        pv.push(firstMove)
        const state = board.applyMove(firstMove)
        movesMade.push({ move: firstMove, state })
      }
      let currentDepth = firstMove ? 1 : 0
      const seenKeys = new Set()
      seenKeys.add(board.zobristKey)
      while (currentDepth < depth) {
        const entry = tt.probe(board.zobristKey)
        if (!entry || !entry.move) break
        const move = entry.move
        const legalMoves = board.generateMoves()
        const realMove = legalMoves.find(m => m.from === move.from && m.to === move.to && m.promotion === move.promotion)
        if (!realMove) break
        pv.push(realMove)
        const state = board.applyMove(realMove)
        movesMade.push({ move: realMove, state })
        if (seenKeys.has(board.zobristKey)) break
        seenKeys.add(board.zobristKey)
        currentDepth++
      }
    } finally {
      while (movesMade.length > 0) {
        const { move, state } = movesMade.pop()
        board.undoApplyMove(move, state)
      }
    }
    return pv
  }

  static checkPV (board, pv) {
    const movesMade = []
    let valid = true
    for (const move of pv) {
      const legalMoves = board.generateMoves()
      const isLegal = legalMoves.some(m => m.from === move.from && m.to === move.to && m.promotion === move.promotion)
      if (!isLegal) {
        console.error(`PV Consistency Error: Illegal move ${SearchUtils.moveToString(board, move)}`)
        valid = false
        break
      }
      const realMove = legalMoves.find(m => m.from === move.from && m.to === move.to && m.promotion === move.promotion)
      const state = board.applyMove(realMove)
      movesMade.push({ move: realMove, state })
    }
    while (movesMade.length > 0) {
      const { move, state } = movesMade.pop()
      board.undoApplyMove(move, state)
    }
    if (!valid) throw new Error('PV Consistency Check Failed')
  }
}

module.exports = SearchUtils
