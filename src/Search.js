const Evaluation = require('./Evaluation');
const { TranspositionTable, TT_FLAG } = require('./TranspositionTable');

class Search {
  constructor(board) {
    this.board = board;
    this.nodes = 0;
    this.tt = new TranspositionTable(64); // 64MB
    this.timer = null;
    this.stopFlag = false;
  }

  // Iterative Deepening Search
  search(maxDepth = 5, maxTime = 1000) {
    this.nodes = 0;
    this.stopFlag = false;
    this.tt.clear(); // Clear TT per new search or keep it? Usually keep it.
    // For repeatable tests, maybe clear. But for engine performance, keep.
    // Let's keep it but handle aging later.

    const startTime = Date.now();
    let bestMove = null;

    // Timer check function
    const checkTime = () => {
        if (Date.now() - startTime >= maxTime) {
            this.stopFlag = true;
        }
    };

    // Main Iterative Deepening Loop
    for (let depth = 1; depth <= maxDepth; depth++) {
        // Aspiration windows could go here

        const move = this.rootAlphaBeta(depth, -Infinity, Infinity);

        checkTime();
        if (this.stopFlag) {
            // Time up. If we didn't complete this depth, do we return previous best?
            // Usually yes. But if we found a move at this depth before stopping, is it better?
            // My rootAlphaBeta returns the best move found *so far* at that depth?
            // No, it returns when finished.
            // If stopped in middle, the result might be incomplete.
            // Safe bet: Return the best move from the last fully completed depth.
            // Unless depth 1 is incomplete (rare).
            if (!bestMove && move) bestMove = move; // Fallback
            break;
        }

        bestMove = move;

        // Output info ( UCI info depth ... score ... pv ...)
        // console.log(`info depth ${depth} nodes ${this.nodes}`);
    }

    return bestMove;
  }

  rootAlphaBeta(depth, alpha, beta) {
      // Similar to alphaBeta but returns the Move
      let bestMove = null;
      let bestScore = -Infinity;

      // TT Probe for ordering
      const ttEntry = this.tt.probe(this.board.zobristKey);
      let ttMove = ttEntry ? ttEntry.move : null;

      const moves = this.board.generateMoves();
      if (moves.length === 0) return null;

      // Move Ordering
      this.orderMoves(moves, ttMove);

      for (const move of moves) {
          const state = this.board.applyMove(move);
          const score = -this.alphaBeta(depth - 1, -beta, -alpha);
          this.board.undoApplyMove(move, state);

          if (this.stopFlag) return bestMove; // Abort

          if (score > bestScore) {
              bestScore = score;
              bestMove = move;
          }
          if (score > alpha) {
              alpha = score;
          }
      }

      // Store Root in TT? Yes
      if (!this.stopFlag && bestMove) {
          this.tt.save(this.board.zobristKey, bestScore, depth, TT_FLAG.EXACT, bestMove);
      }

      return bestMove;
  }

  alphaBeta(depth, alpha, beta) {
      this.nodes++;

      // Check 50-move and repetition
      if (this.board.isDrawBy50Moves() || this.board.isDrawByRepetition()) {
          return 0;
      }

      // TT Probe
      const ttEntry = this.tt.probe(this.board.zobristKey);
      if (ttEntry && ttEntry.depth >= depth) {
          if (ttEntry.flag === TT_FLAG.EXACT) return ttEntry.score;
          if (ttEntry.flag === TT_FLAG.LOWERBOUND && ttEntry.score >= beta) return ttEntry.score; // Beta cutoff
          if (ttEntry.flag === TT_FLAG.UPPERBOUND && ttEntry.score <= alpha) return ttEntry.score; // Alpha cutoff
      }

      // Internal Iterative Deepening? No, kept simple.

      const moves = this.board.generateMoves();

      // Check for Mate/Stalemate
      if (moves.length === 0) {
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
      let ttMove = ttEntry ? ttEntry.move : null;
      this.orderMoves(moves, ttMove);

      let flag = TT_FLAG.UPPERBOUND; // Default: we fail low (all moves < alpha)
      let bestScore = -Infinity;
      let bestMove = null;

      for (const move of moves) {
          const state = this.board.applyMove(move);
          const score = -this.alphaBeta(depth - 1, -beta, -alpha);
          this.board.undoApplyMove(move, state);

          if (this.stopFlag) return alpha; // Return alpha or previous best? Doesn't matter, result ignored.

          if (score >= beta) {
              // Fail high (Lowerbound)
              this.tt.save(this.board.zobristKey, score, depth, TT_FLAG.LOWERBOUND, move);
              return beta;
          }
          if (score > bestScore) {
              bestScore = score;
              bestMove = move;
              if (score > alpha) {
                  alpha = score;
                  flag = TT_FLAG.EXACT;
              }
          }
      }

      this.tt.save(this.board.zobristKey, bestScore, depth, flag, bestMove);
      return alpha;
  }

  orderMoves(moves, ttMove) {
      moves.sort((a, b) => {
        // 1. TT Move (Best Move)
        if (ttMove) {
            const isA = (a.from === ttMove.from && a.to === ttMove.to);
            const isB = (b.from === ttMove.from && b.to === ttMove.to);
            if (isA) return -1;
            if (isB) return 1;
        }

        // 2. Captures
        const scoreA = (a.flags.includes('c')) ? 10 : 0;
        const scoreB = (b.flags.includes('c')) ? 10 : 0;
        return scoreB - scoreA;
      });
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
