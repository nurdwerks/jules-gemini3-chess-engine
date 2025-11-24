const Evaluation = require('./Evaluation');

class Search {
  constructor(board) {
    this.board = board;
    this.nodes = 0;
  }

  // Basic Minimax with Alpha-Beta Pruning
  search(depth) {
    this.nodes = 0;
    let alpha = -Infinity;
    let beta = Infinity;

    // We want to return the best move, not just score
    let bestMove = null;
    let bestScore = -Infinity;

    const moves = this.board.generateMoves();
    if (moves.length === 0) return null; // Mate or stalemate

    // Simple move ordering: Captures first (could add MVV-LVA later)
    moves.sort((a, b) => {
        const scoreA = (a.flags.includes('c')) ? 10 : 0;
        const scoreB = (b.flags.includes('c')) ? 10 : 0;
        return scoreB - scoreA;
    });

    for (const move of moves) {
        const state = this.board.applyMove(move);
        const score = -this.alphaBeta(depth - 1, -beta, -alpha);
        this.board.undoApplyMove(move, state);

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
        if (score > alpha) {
            alpha = score; // Note: In root, we don't really use updated alpha for pruning in this loop unless we have window
        }
    }

    return bestMove;
  }

  alphaBeta(depth, alpha, beta) {
      this.nodes++;

      const moves = this.board.generateMoves();

      // Check for Mate/Stalemate BEFORE checking depth=0?
      // No, because generating moves is expensive.
      // But if we are mated at depth 0, we must report it, otherwise quiescence will return a material score (ignoring mate).
      // If we are checkmated, moves.length is 0.

      if (moves.length === 0) {
          // Checkmate or Stalemate
          const kingColor = this.board.activeColor === 'w' ? 'white' : 'black';
          let kingIndex = -1;
          for(let i=0; i<128; i++) {
              if (this.board.isValidSquare(i)) {
                  const p = this.board.squares[i];
                  if (p && p.type === 'king' && p.color === kingColor) {
                      kingIndex = i;
                      break;
                  }
              }
          }
          const opponent = this.board.activeColor === 'w' ? 'black' : 'white';
          if (kingIndex !== -1 && this.board.isSquareAttacked(kingIndex, opponent)) {
              return -20000 + (100 - depth); // Prefer faster mates
          } else {
              return 0; // Stalemate
          }
      }

      if (depth === 0) {
          return this.quiescence(alpha, beta);
      }

      // Move ordering
      moves.sort((a, b) => {
        const scoreA = (a.flags.includes('c')) ? 10 : 0;
        const scoreB = (b.flags.includes('c')) ? 10 : 0;
        return scoreB - scoreA;
      });

      for (const move of moves) {
          const state = this.board.applyMove(move);
          const score = -this.alphaBeta(depth - 1, -beta, -alpha);
          this.board.undoApplyMove(move, state);

          if (score >= beta) {
              return beta; // Fail hard
          }
          if (score > alpha) {
              alpha = score;
          }
      }
      return alpha;
  }

  quiescence(alpha, beta) {
      this.nodes++;
      const standPat = Evaluation.evaluate(this.board);
      if (standPat >= beta) {
          return beta;
      }
      if (alpha < standPat) {
          alpha = standPat;
      }

      // Generate only captures
      const moves = this.board.generateMoves();
      // Filter for captures only
      const captures = moves.filter(m => m.flags.includes('c'));

      // Sort captures (MVV-LVA simplified: just capture high value piece)
      captures.sort((a, b) => {
          // captured piece value
          const valA = a.captured ? this.getPieceValue(a.captured) : 0;
          const valB = b.captured ? this.getPieceValue(b.captured) : 0;
          return valB - valA;
      });

      for (const move of captures) {
          const state = this.board.applyMove(move);
          const score = -this.quiescence(-beta, -alpha);
          this.board.undoApplyMove(move, state);

          if (score >= beta) {
              return beta;
          }
          if (score > alpha) {
              alpha = score;
          }
      }
      return alpha;
  }

  getPieceValue(piece) {
      const values = { 'pawn': 100, 'knight': 320, 'bishop': 330, 'rook': 500, 'queen': 900, 'king': 20000 };
      return values[piece.type] || 0;
  }
}

module.exports = Search;
