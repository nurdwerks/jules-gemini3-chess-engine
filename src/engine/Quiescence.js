const Evaluation = require('./Evaluation')
const SEE = require('./SEE')
const MoveSorter = require('./MoveSorter')

function updateNNUE (search, move, capturedPiece) {
  if (search.options.UCI_UseNNUE && search.nnue && search.nnue.network) {
    const newAccumulator = search.accumulatorStack[search.accumulatorStack.length - 1].clone()
    const changes = search.nnue.getChangedIndices(search.board, move, capturedPiece)
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

function quiescence (search, alpha, beta) {
  search.nodes++
  if (_checkLimits(search)) return alpha

  const standPat = _getStandPat(search)

  if (standPat >= beta) return beta

  if (_shouldPruneDelta(standPat, alpha, search.board.isInCheck())) return alpha
  if (alpha < standPat) alpha = standPat

  const moves = search.board.generateMoves()
  const interestingMoves = moves.filter(m => m.flags.includes('c') || m.flags.includes('p'))
  MoveSorter.sortCaptures(interestingMoves)

  for (const move of interestingMoves) {
    const score = _processCapture(search, move, alpha, beta)
    if (search.stopFlag) return alpha
    if (score >= beta) return beta
    if (score > alpha) alpha = score
  }
  return alpha
}

function _checkLimits (search) {
  if (search.stopFlag) return true
  if (search.checkLimits && search.checkLimits()) return true
  return false
}

function _processCapture (search, move, alpha, beta) {
  if (move.flags.includes('c') && SEE.see(search.board, move) < 0) return alpha

  const state = search.board.applyMove(move)
  updateNNUE(search, move, state.capturedPiece)

  const score = -quiescence(search, -beta, -alpha)

  search.board.undoApplyMove(move, state)
  restoreNNUE(search)
  return score
}

function _getStandPat (search) {
  const currentAccumulator = search.accumulatorStack.length > 0 ? search.accumulatorStack[search.accumulatorStack.length - 1] : null
  return (search.options && search.options.UCI_UseNNUE && search.nnue && search.nnue.network)
    ? search.nnue.evaluate(search.board, currentAccumulator)
    : Evaluation.evaluate(search.board)
}

function _shouldPruneDelta (standPat, alpha, inCheck) {
  const safetyMargin = 975
  return standPat < alpha - safetyMargin && !inCheck
}

module.exports = quiescence
