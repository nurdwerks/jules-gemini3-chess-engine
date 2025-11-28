const Evaluation = require('./Evaluation')
const SEE = require('./SEE')
const MoveSorter = require('./MoveSorter')

function quiescence (search, alpha, beta) {
  search.nodes++

  if (search.stopFlag) return alpha
  if (search.checkLimits && search.checkLimits()) return alpha

  const standPat = getStandPat(search)

  if (standPat >= beta) return beta

  // Delta Pruning
  if (shouldDeltaPrune(search, standPat, alpha)) return alpha

  if (alpha < standPat) alpha = standPat

  const moves = search.board.generateMoves()
  const interestingMoves = moves.filter(m => m.flags.includes('c') || m.flags.includes('p'))
  MoveSorter.sortCaptures(interestingMoves)

  return searchMoves(search, interestingMoves, alpha, beta)
}

function getStandPat (search) {
  const currentAccumulator = search.accumulatorStack.length > 0 ? search.accumulatorStack[search.accumulatorStack.length - 1] : null
  return (search.options && search.options.UCI_UseNNUE && search.nnue && search.nnue.network)
    ? search.nnue.evaluate(search.board, currentAccumulator)
    : Evaluation.evaluate(search.board)
}

function shouldDeltaPrune (search, standPat, alpha) {
  const safetyMargin = 975
  if (standPat < alpha - safetyMargin) {
    if (!search.board.isInCheck()) {
      return true
    }
  }
  return false
}

function searchMoves (search, moves, alpha, beta) {
  for (const move of moves) {
    if (move.flags.includes('c') && SEE.see(search.board, move) < 0) continue

    const state = search.board.applyMove(move)
    updateNNUE(search, move, state)

    const score = -quiescence(search, -beta, -alpha)

    search.board.undoApplyMove(move, state)
    restoreNNUE(search)

    if (search.stopFlag) return alpha

    if (score >= beta) return beta
    if (score > alpha) alpha = score
  }
  return alpha
}

function updateNNUE (search, move, state) {
  if (search.options.UCI_UseNNUE && search.nnue && search.nnue.network) {
    const newAccumulator = search.accumulatorStack[search.accumulatorStack.length - 1].clone()
    const changes = search.nnue.getChangedIndices(search.board, move, state.capturedPiece)
    if (changes[move.piece.color].refresh) {
      const tempBoard = search.board.clone()
      tempBoard.applyMove(move)
      search.nnue.refreshAccumulator(newAccumulator, tempBoard)
    } else {
      search.nnue.updateAccumulator(newAccumulator, changes)
    }
    search.accumulatorStack.push(newAccumulator)
  }
}

function restoreNNUE (search) {
  if (search.options.UCI_UseNNUE && search.nnue && search.nnue.network) {
    search.accumulatorStack.pop()
  }
}

module.exports = quiescence
