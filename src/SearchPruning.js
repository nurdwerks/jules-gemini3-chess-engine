class SearchPruning {
  static tryNullMovePruning(search, depth, beta, inCheck) {
    if (depth >= 3 && !inCheck) {
      const state = search.board.makeNullMove();
      const R = 2; // Reduction
      const score = -search.alphaBeta(depth - 1 - R, -beta, -beta + 1);
      search.board.undoNullMove(state);

      if (search.stopFlag) return 'STOP';

      if (score >= beta) {
        search.stats.pruning.nullMove++;
        return beta; // Cutoff
      }
    }
    return null;
  }

  static tryRazoring(search, depth, alpha, beta, staticEval, inCheck) {
    if (depth <= 3 && !inCheck && staticEval + 300 + 100 * depth <= alpha) {
      const qScore = search.quiescence(alpha, beta);
      if (qScore <= alpha) {
        return alpha;
      }
    }
    return null;
  }

  static tryFutilityPruning(search, depth, alpha, staticEval, inCheck) {
    if (depth <= 3 && !inCheck) {
      const margin = 100 * depth;
      if (staticEval + margin <= alpha) {
        search.stats.pruning.futility++;
        return alpha;
      }
    }
    return null;
  }

  static tryProbCut(search, depth, beta, inCheck, prevMove) {
    if (depth >= 5 && !inCheck && Math.abs(beta) < 20000) {
      const PROBCUT_MARGIN = 200;
      const PROBCUT_REDUCTION = 4;

      // Shallow search with a widened window
      const probCutBeta = beta + PROBCUT_MARGIN;

      const score = search.alphaBeta(depth - PROBCUT_REDUCTION, probCutBeta - 1, probCutBeta, prevMove);

      if (score >= probCutBeta) {
        search.stats.pruning.probCut++;
        return beta;
      }
    }
    return null;
  }
}

module.exports = SearchPruning;
