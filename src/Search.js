const Evaluation = require('./Evaluation');
const { TranspositionTable, TT_FLAG } = require('./TranspositionTable');

class Search {
  constructor(board, tt = null) {
    this.board = board;
    this.nodes = 0;
    this.tt = tt || new TranspositionTable(64); // Use passed TT or default
    this.timer = null;
    this.stopFlag = false;

    // Move Ordering Heuristics
    this.killerMoves = new Array(64).fill(null).map(() => []); // [depth][0..1]
    this.history = new Array(2).fill(null).map(() =>
        new Array(128).fill(0) // [color][to] - Simplified History (Butterfly)
    );
    // Better history: [side][from][to] or [piece][to].
    // Common is [side][from][to] or [piece][to].
    // 0x88 board is 128 squares.
    // Let's use [side][from][to] -> 2 * 128 * 128.
    // To avoid large arrays, let's use 1D array of size 2 * 128 * 128 = 32k integers.
    this.history = new Int32Array(2 * 128 * 128);
  }

  getHistoryScore(side, from, to) {
      const colorIdx = side === 'w' ? 0 : 1;
      return this.history[colorIdx * 128 * 128 + from * 128 + to];
  }

  addHistoryScore(side, from, to, depth) {
      const colorIdx = side === 'w' ? 0 : 1;
      const idx = colorIdx * 128 * 128 + from * 128 + to;
      const bonus = depth * depth;
      this.history[idx] += bonus;
      if (this.history[idx] > 1000000) { // Cap/Age
          for(let i=0; i<this.history.length; i++) this.history[i] >>= 1;
      }
  }

  // Iterative Deepening Search
  search(maxDepth = 5, timeLimits = { hardLimit: 1000, softLimit: 1000 }) {
    // Backward compatibility: if timeLimits is a number, treat as hardLimit
    if (typeof timeLimits === 'number') {
        timeLimits = { hardLimit: timeLimits, softLimit: timeLimits };
    }

    this.nodes = 0;
    this.stopFlag = false;
    // Reset Heuristics?
    // Killers should be reset. History can persist or age.
    this.killerMoves = new Array(64).fill(null).map(() => []);
    // Age history
    for(let i=0; i<this.history.length; i++) this.history[i] >>= 1;

    // this.tt.clear(); // Preserve TT across searches for efficiency

    const startTime = Date.now();
    let bestMove = null;
    let bestScore = -Infinity;

    // Timer check function
    const checkTime = () => {
        // We only check hard limit here to force stop
        // Soft limit is checked inside loop to stop if "good enough" or between depths
        if (timeLimits.hardLimit !== Infinity) {
             if (Date.now() - startTime >= timeLimits.hardLimit) {
                 this.stopFlag = true;
             }
        }
    };

    // Main Iterative Deepening Loop
    for (let depth = 1; depth <= maxDepth; depth++) {
        // Periodically check time inside search?
        // Right now we only check between depths. For deep searches, we need checks inside nodes.
        // We will pass `checkTime` down or check periodically based on node count.

        // Capture score from rootAlphaBeta? It currently only returns move.
        // We need to update rootAlphaBeta to return { move, score }.
        // Or probe TT.
        const entry = this.tt.probe(this.board.zobristKey);
        const score = entry && entry.depth === depth ? entry.score : -Infinity;

        const move = this.rootAlphaBeta(depth, -Infinity, Infinity, () => {
            if ((this.nodes & 2047) === 0) checkTime();
            return this.stopFlag;
        });

        // After depth complete
        checkTime();

        // Soft limit check
        if (timeLimits.softLimit !== Infinity && !this.stopFlag) {
             const elapsed = Date.now() - startTime;
             let limit = timeLimits.softLimit;

             // Panic logic:
             // If we have a previous best score (from bestScore variable), and current score is much worse?
             // 'bestScore' tracks score from PREVIOUS depths.
             // 'score' (probed above) was before this depth ran, so it's useless.
             // We need score AFTER this depth.
             const newEntry = this.tt.probe(this.board.zobristKey);
             const currentScore = newEntry && newEntry.depth === depth ? newEntry.score : -Infinity;

             // If we dropped > 60cp (approx 0.6 pawn) from previous best, extend time.
             if (depth > 1 && bestScore > -10000 && currentScore > -10000) {
                 if (bestScore - currentScore > 60) {
                     // Panic! Extend soft limit to hard limit (or halfway)
                     limit = Math.min(timeLimits.hardLimit, limit * 2);
                 }
             }

             if (elapsed >= limit) {
                 this.stopFlag = true;
             }

             // Update bestScore for next depth comparison
             if (newEntry && newEntry.flag === TT_FLAG.EXACT) {
                 bestScore = newEntry.score;
             }
        }

        if (this.stopFlag) {
            // If we completed the depth, use the result.
            // If we aborted in the middle (rootAlphaBeta returned null or partial), use previous best.
            // My rootAlphaBeta returns valid move even if aborted? No, it might be partial.
            // However, rootAlphaBeta logic:
            // "if (this.stopFlag) return bestMove;" -> returns best move found SO FAR in that depth.
            // This is safer than returning null.
            if (move) bestMove = move;
            else if (!bestMove) bestMove = move; // If depth 1 failed?
            break;
        }

        bestMove = move;
        // Update bestScore if not stopped (redundant with above but safe)
        const endEntry = this.tt.probe(this.board.zobristKey);
        if (endEntry) bestScore = endEntry.score;
        // Retrieve score from TT or return from rootAlphaBeta?
        // rootAlphaBeta doesn't return score currently.
        // We can probe TT for score or modify rootAlphaBeta.
        // For UCI output 'info score ...'
    }

    return bestMove;
  }

  rootAlphaBeta(depth, alpha, beta, shouldStopCallback) {
      // Similar to alphaBeta but returns the Move
      let bestMove = null;
      let bestScore = -Infinity;

      // TT Probe for ordering
      const ttEntry = this.tt.probe(this.board.zobristKey);
      let ttMove = ttEntry ? ttEntry.move : null;

      const moves = this.board.generateMoves();
      if (moves.length === 0) return null;

      // Move Ordering
      this.orderMoves(moves, ttMove, depth);

      for (const move of moves) {
          // Check stop condition
          if (shouldStopCallback && shouldStopCallback()) return bestMove;

          const state = this.board.applyMove(move);
          const score = -this.alphaBeta(depth - 1, -beta, -alpha, shouldStopCallback);
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

  alphaBeta(depth, alpha, beta, shouldStopCallback) {
      this.nodes++;

      // Periodically check stop (every 2048 nodes handled by caller, but we should call the callback if it exists)
      if (shouldStopCallback && (this.nodes & 2047) === 0) {
          if (shouldStopCallback()) return alpha; // Return alpha on abort? Or 0?
      }
      if (this.stopFlag) return alpha;

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
      this.orderMoves(moves, ttMove, depth);

      let flag = TT_FLAG.UPPERBOUND; // Default: we fail low (all moves < alpha)
      let bestScore = -Infinity;
      let bestMove = null;
      let movesSearched = 0;

      for (const move of moves) {
          const state = this.board.applyMove(move);
          let score;

          // Principal Variation Search (PVS)
          if (movesSearched === 0) {
              // Full window search for the first move
              score = -this.alphaBeta(depth - 1, -beta, -alpha, shouldStopCallback);
          } else {
              // Null window search (prove move is worse than alpha)
              // Search with beta = alpha + 1 (or just -alpha as beta)
              score = -this.alphaBeta(depth - 1, -alpha - 1, -alpha, shouldStopCallback);

              // If score > alpha, it might be a new best move, re-search with full window
              if (score > alpha && score < beta) {
                  score = -this.alphaBeta(depth - 1, -beta, -alpha, shouldStopCallback);
              }
          }

          this.board.undoApplyMove(move, state);
          movesSearched++;

          if (this.stopFlag) return alpha;

          if (score >= beta) {
              // Fail high (Lowerbound)
              this.tt.save(this.board.zobristKey, score, depth, TT_FLAG.LOWERBOUND, move);

              // Update Killers and History for quiet moves
              if (!move.flags.includes('c')) {
                  this.storeKiller(depth, move);
                  this.addHistoryScore(this.board.activeColor, move.from, move.to, depth);
              }

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

  storeKiller(depth, move) {
      if (depth >= 64) return;
      // Store up to 2 killer moves
      const killers = this.killerMoves[depth];
      // Check if already present
      if (killers.some(k => k.from === move.from && k.to === move.to)) return;

      // Shift
      if (killers.length >= 2) {
          killers.pop();
      }
      killers.unshift(move);
  }

  orderMoves(moves, ttMove, depth = 0) {
      moves.sort((a, b) => {
        // 1. TT Move (Best Move)
        if (ttMove) {
            const isA = (a.from === ttMove.from && a.to === ttMove.to);
            const isB = (b.from === ttMove.from && b.to === ttMove.to);
            if (isA) return -1;
            if (isB) return 1;
        }

        const scoreMove = (m) => {
             // Captures: MVV-LVA
             if (m.flags.includes('c')) {
                 const victim = m.captured ? this.getPieceValue(m.captured) : 0;
                 const attacker = this.getPieceValue(m.piece);
                 return 1000000 + victim * 10 - attacker;
             }

             // Quiet Moves
             // Killers
             if (depth < 64) {
                 const killers = this.killerMoves[depth];
                 if (killers && killers.some(k => k.from === m.from && k.to === m.to)) {
                     return 900000; // High score for killer
                 }
             }

             // History
             const historyScore = this.getHistoryScore(this.board.activeColor, m.from, m.to);
             return historyScore;
        };

        const scoreA = scoreMove(a);
        const scoreB = scoreMove(b);

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
