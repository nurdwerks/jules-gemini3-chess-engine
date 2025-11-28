const Evaluation = require('./Evaluation');
const SEE = require('./SEE');
const MoveSorter = require('./MoveSorter');

function quiescence(search, alpha, beta) {
    search.nodes++;

    if (search.stopFlag) return alpha;
    if (search.checkLimits && search.checkLimits()) return alpha;

    const currentAccumulator = search.accumulatorStack.length > 0 ? search.accumulatorStack[search.accumulatorStack.length - 1] : null;
    const standPat = (search.options && search.options.UCI_UseNNUE && search.nnue && search.nnue.network)
      ? search.nnue.evaluate(search.board, currentAccumulator)
      : Evaluation.evaluate(search.board);

    if (standPat >= beta) {
        return beta;
    }

    // Delta Pruning
    const safetyMargin = 975;
    if (standPat < alpha - safetyMargin) {
       if (!search.board.isInCheck()) {
          return alpha;
       }
    }
    if (alpha < standPat) {
        alpha = standPat;
    }

    const moves = search.board.generateMoves();
    // Filter for captures and promotions
    const interestingMoves = moves.filter(m => m.flags.includes('c') || m.flags.includes('p'));

    MoveSorter.sortCaptures(interestingMoves);

    for (const move of interestingMoves) {
        // SEE Pruning
        if (move.flags.includes('c') && SEE.see(search.board, move) < 0) continue;

        const state = search.board.applyMove(move);

        if (search.options.UCI_UseNNUE && search.nnue && search.nnue.network) {
            const newAccumulator = search.accumulatorStack[search.accumulatorStack.length - 1].clone();
            const changes = search.nnue.getChangedIndices(search.board, move, state.capturedPiece);
            if (changes[move.piece.color].refresh) {
                const tempBoard = search.board.clone();
                tempBoard.applyMove(move);
                search.nnue.refreshAccumulator(newAccumulator, tempBoard);
            } else {
                search.nnue.updateAccumulator(newAccumulator, changes);
            }
            search.accumulatorStack.push(newAccumulator);
        }

        const score = -quiescence(search, -beta, -alpha);
        search.board.undoApplyMove(move, state);

        if (search.options.UCI_UseNNUE && search.nnue && search.nnue.network) {
            search.accumulatorStack.pop();
        }

        if (search.stopFlag) return alpha;

        if (score >= beta) {
            return beta;
        }
        if (score > alpha) {
            alpha = score;
        }
    }
    return alpha;
}

module.exports = quiescence;
