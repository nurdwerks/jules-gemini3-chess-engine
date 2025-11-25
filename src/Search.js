const Evaluation = require('./Evaluation');
const { TranspositionTable, TT_FLAG } = require('./TranspositionTable');
const SEE = require('./SEE');
const Syzygy = require('./Syzygy'); // Epic 15

class Search {
  constructor(board, tt = null) {
    this.board = board;
    this.nodes = 0;
    this.tt = tt || new TranspositionTable(64); // Use passed TT or default
    this.timer = null;
    this.stopFlag = false;

    // Epic 15: Syzygy
    this.syzygy = new Syzygy();
    // Mock load for now or real if file exists
    // this.syzygy.loadTable('path/to/tb');

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

    this.stats = {
        nodes: 0,
        pruning: {
            nullMove: 0,
            futility: 0
        }
    };
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
  search(maxDepth = 5, timeLimits = { hardLimit: 1000, softLimit: 1000 }, options = {}) {
    // Backward compatibility: if timeLimits is a number, treat as hardLimit
    if (typeof timeLimits === 'number') {
        timeLimits = { hardLimit: timeLimits, softLimit: timeLimits };
    }

    // Handle Limit Strength
    let maxNodes = Infinity;
    if (options.UCI_LimitStrength && options.UCI_Elo) {
        const StrengthLimiter = require('./StrengthLimiter');
        maxNodes = StrengthLimiter.getNodesForElo(options.UCI_Elo);
    }

    // Debug Tree Initialization
    this.debugMode = options.debug || false;
    this.debugTree = { depth: maxDepth, nodes: [] };
    this.debugFile = options.debugFile || 'search_tree.json';
    this.currentDebugNode = this.debugTree; // Pointer to current node parent

    this.nodes = 0;
    this.stats = {
        nodes: 0,
        pruning: {
            nullMove: 0,
            futility: 0
        }
    };
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
        let persistentBestMove = null; // Keep track across ID iterations

    // Timer/Node check function attached to instance
    let checkMask = 2047;
    if (maxNodes < 5000) checkMask = 127;
    if (maxNodes < 128) checkMask = 15;
    if (maxNodes < 16) checkMask = 0; // Check every node

    this.checkLimits = () => {
        if ((this.nodes & checkMask) !== 0) return false;

        // Node limit check
        if (this.nodes >= maxNodes) {
            this.stopFlag = true;
            return true;
        }

        // We only check hard limit here to force stop
        if (timeLimits.hardLimit !== Infinity) {
             if (Date.now() - startTime >= timeLimits.hardLimit) {
                 this.stopFlag = true;
                 return true;
             }
        }
        return false;
    };

    // Main Iterative Deepening Loop
    for (let depth = 1; depth <= maxDepth; depth++) {
        const entry = this.tt.probe(this.board.zobristKey);
        const score = entry && entry.depth === depth ? entry.score : -Infinity;

        if (this.debugMode) {
             this.debugTree.nodes = [];
             this.debugTree.iteration = depth;
        }

        // Aspiration Windows
        let alpha = -Infinity;
        let beta = Infinity;
        const windowSize = options.AspirationWindow || 50;

        if (depth > 1) {
            alpha = bestScore - windowSize;
            beta = bestScore + windowSize;
        }

        let move = null;
        let result = null;

        while (true) {
             result = this.rootAlphaBeta(depth, alpha, beta);
             move = result.move;

             // Check if stopped during root search
             if (this.stopFlag) {
                 if (move) bestMove = move;
                 // If we stopped, we must break. But we might have a valid partial result.
                 break;
             }

             const val = result.score;

             // Safety check: if val is null/undefined (e.g. no moves?), break
             if (val === undefined || val === null) break;

             // If we found a move, update bestMove (even if we re-search)
             if (move) bestMove = move;

             // Fail Low
             if (val <= alpha) {
                 if (alpha === -Infinity) {
                     bestMove = move;
                     bestScore = val;
                     break;
                 }
                 alpha = -Infinity;
                 continue;
             }
             // Fail High
             if (val >= beta) {
                 if (beta === Infinity) {
                     bestMove = move;
                     bestScore = val;
                     break;
                 }
                 beta = Infinity;
                 continue;
             }

             // Exact
             bestMove = move;
             bestScore = val;
             break;
        }

        // Ensure we set bestMove if it was set inside the loop (redundant but safe)
        // Actually bestMove is updated in the loop.

        // Fallback if loop somehow exited without setting bestMove (e.g. immediate stop)
        // If we have a result.move, it's the best we found in that partial search.
        if (!bestMove && result && result.move) {
            bestMove = result.move;
        }

        // Safety fallback if bestMove is STILL null (e.g. interrupted before any move found in depth 1?)
        // If depth > 1, we should have bestMove from previous depth.
        // But Search resets bestMove to null at start of search.
        // In ID loop, bestMove persists? No, let bestMove = null inside search() scope.
        // Wait, bestMove is local to search().
        // In ID loop: `if (move) bestMove = move;`
        // `move` comes from `rootAlphaBeta`.
        // If `rootAlphaBeta` failed immediately (stopFlag), it returns whatever it found.
        // If it found nothing, it returns null.
        // If we have NO move, we can't output bestmove 0000.
        // We should use previous iteration bestMove if available.
        // But `bestMove` variable accumulates across depths?
        // Yes: `let bestMove = null;` outside loop.
        // Inside loop: `bestMove = move;`
        // But wait, `move` is result of `rootAlphaBeta`.
        // If `rootAlphaBeta` returns valid result, update.

        // If depth 1 fails to find ANY move (e.g. mate/stalemate), bestMove remains null.
        // If no legal moves, it returns { move: null, score: -Inf }.
        // Then we return null.
        // UCI expects 'bestmove (none)' or similar if mate?
        // Or 'bestmove 0000' if no moves?
        // But `position startpos` has moves.
        // If `test_aspiration.js` outputs `bestmove 0000`, it means `bestMove` is null.
        // This means `rootAlphaBeta` returned null move even at depth 1.
        // Why?
        // `rootAlphaBeta`: `const moves = this.board.generateMoves();`
        // If moves.length > 0, it loops.
        // `bestMove` starts null.
        // Loop finds `bestScore` and `bestMove`.
        // `score > bestScore` (-Inf).
        // First move will update bestMove.
        // UNLESS `stopFlag` is set immediately.
        // `test_aspiration.js` runs `go depth 4`. No stop.
        // So it should run.
        // Did `checkLimits` return true immediately?
        // `this.nodes` starts at 0. `checkMask` depends on `maxNodes`.
        // `UCI_LimitStrength` is false by default. `maxNodes` = Infinity.
        // `checkMask` = 2047.
        // `this.nodes & checkMask`.
        // `timeLimits`: hard/soft Infinity?
        // `test_aspiration.js`: `go depth 4`.
        // `UCI.js`: if no wtime/movetime, `timeLimits` = Infinity.
        // So `checkLimits` should return false.

        // Maybe `AspirationWindow` logic failed?
        // Depth 1: `alpha = -Inf, beta = Inf`.
        // Loop runs.
        // `val` returned.
        // `if (val <= alpha)` -> `if (val <= -Inf)` -> False (unless -Inf).
        // `if (val >= beta)` -> `if (val >= Inf)` -> False.
        // Break.
        // `bestMove = move`.
        // So depth 1 should work.

        // Depth 2: `alpha = score - 25`.
        // If `rootAlphaBeta` returns null move?
        // `rootAlphaBeta` ALWAYS returns a move if it found one better than -Inf.
        // Wait, `bestScore` starts at -Inf.
        // If all moves are -Inf (illegal?? No, legal moves).
        // Score should be > -Inf.
        // So `bestMove` should be set.

        // Is it possible `rootAlphaBeta` returned `move: null`?
        // Only if `moves` is empty.
        // Startpos has moves.

        // Maybe `options.AspirationWindow` is undefined?
        // I added it to UCI options.
        // Default 50.
        // Passed to search.
        // `const windowSize = options.AspirationWindow || 50;`
        // Should be 25.

        // Let's add console.log in Search.js to debug.

        // After depth complete (or aborted)
        this.checkLimits();

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

        if (bestMove) persistentBestMove = bestMove;

        if (this.stopFlag) {
            break;
        }
    // Error Injection (Blunder Logic)
    if (options.UCI_LimitStrength && options.UCI_Elo && bestMove) {
        // Simple blunder chance: (2000 - Elo) / 10000
        // At 1000 Elo -> 10% chance to pick a random suboptimal move
        // At 2000 Elo -> 0% chance
        const elo = options.UCI_Elo;
        if (elo < 2500) {
            const blunderChance = Math.max(0, (2500 - elo) / 5000); // 1000 Elo = 0.3 (30%)
            if (Math.random() < blunderChance) {
                // Pick a random legal move that is NOT the best move
                const moves = this.board.generateMoves();
                if (moves.length > 1) {
                    const otherMoves = moves.filter(m => !(m.from === bestMove.from && m.to === bestMove.to));
                    if (otherMoves.length > 0) {
                        const randomIdx = Math.floor(Math.random() * otherMoves.length);
                        bestMove = otherMoves[randomIdx];
                        // console.log('Blunder injected!');
                    }
                }
            }
        }
    }

        if (this.debugMode) {
            const fs = require('fs');
            try {
                fs.writeFileSync(this.debugFile, JSON.stringify(this.debugTree, null, 2));
            } catch (e) {
                console.error('Failed to write debug tree:', e);
            }
        }
        // Update bestScore if not stopped (redundant with above but safe)
        const endEntry = this.tt.probe(this.board.zobristKey);
        if (endEntry) bestScore = endEntry.score;

        // PV Verification (Debug)
        if (this.debugMode) {
            const pv = this.getPV(this.board, depth);
            this.checkPV(pv);
        }
    }

    if (this.debugMode) {
        console.log(`Search Stats: Nodes=${this.nodes} NullMove=${this.stats.pruning.nullMove} Futility=${this.stats.pruning.futility}`);
    }

    return persistentBestMove || bestMove;
  }

  rootAlphaBeta(depth, alpha, beta) {
      // Similar to alphaBeta but returns object { move, score }
      let bestMove = null;
      let bestScore = -Infinity;

      // TT Probe for ordering
      const ttEntry = this.tt.probe(this.board.zobristKey);
      let ttMove = ttEntry ? ttEntry.move : null;

      const moves = this.board.generateMoves();
      if (moves.length === 0) return { move: null, score: -Infinity };

      // Move Ordering
      this.orderMoves(moves, ttMove, depth);

      for (const move of moves) {
          // Check stop condition
          if (this.checkLimits()) return { move: bestMove, score: bestScore };

          // Debug Logging
          let debugNode = null;
          if (this.debugMode) {
              debugNode = {
                  move: this.moveToString(move),
                  score: null,
                  children: [],
                  alpha: alpha,
                  beta: beta,
                  depth: depth
              };
              this.debugTree.nodes.push(debugNode);
          }

          const prevDebugNode = this.currentDebugNode;
          if (this.debugMode) this.currentDebugNode = debugNode;

          const state = this.board.applyMove(move);
          const score = -this.alphaBeta(depth - 1, -beta, -alpha);
          this.board.undoApplyMove(move, state);

          if (this.debugMode) {
              debugNode.score = score;
              this.currentDebugNode = prevDebugNode;
          }

          if (this.stopFlag) return { move: bestMove, score: bestScore }; // Abort

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

      return { move: bestMove, score: bestScore };
  }

  alphaBeta(depth, alpha, beta) {
      this.nodes++;

      if (this.stopFlag) return alpha;

      // Check limits (frequency handled inside)
      if (this.checkLimits && this.checkLimits()) return alpha;

      // Check 50-move and repetition
      if (this.board.isDrawBy50Moves() || this.board.isDrawByRepetition()) {
          return 0;
      }

      // Epic 16: Check Extension
      // If in check, extend depth
      let extension = 0;
      const inCheck = this.board.isInCheck();
      if (inCheck) {
          extension = 1;
      }

      // Effective Depth for Pruning decisions (use raw depth or extended?)
      // Usually pruning is based on remaining depth.
      // If we extend, we have MORE remaining depth.
      // But recursion calls with newDepth.

      // Null Move Pruning
      // Conditions: depth >= 3, not in check, big beta? (Or just allow cutoffs)
      // We need to know if we are in check.
      // And probably assume we have "some" material (not Zugzwang).
      // For now, simplistic: depth >= 3.
      if (depth >= 3 && !inCheck) {
          const state = this.board.makeNullMove();
          const R = 2; // Reduction
          const score = -this.alphaBeta(depth - 1 - R, -beta, -beta + 1);
          this.board.undoNullMove(state);

          if (this.stopFlag) return alpha;

          if (score >= beta) {
              this.stats.pruning.nullMove++;
              return beta; // Cutoff
          }
      }

      // TT Probe
      const ttEntry = this.tt.probe(this.board.zobristKey);
      if (ttEntry && ttEntry.depth >= depth) {
          const score = ttEntry.score;
          if (ttEntry.flag === TT_FLAG.EXACT) return score;
          if (ttEntry.flag === TT_FLAG.LOWERBOUND && score >= beta) return score;
          if (ttEntry.flag === TT_FLAG.UPPERBOUND && score <= alpha) return score;
      }

      // Epic 17: Advanced Pruning
      const staticEval = Evaluation.evaluate(this.board);

      // Razoring
      // If depth is low and static eval is way below alpha, drop to qsearch.
      if (depth <= 3 && !inCheck && staticEval + 300 + 100 * depth <= alpha) {
          const qScore = this.quiescence(alpha, beta);
          if (qScore <= alpha) {
              return alpha;
          }
      }

      // Futility Pruning
      // Condition: depth <= 3, not in check, not PV node (alpha != beta - 1? No, just not root? alpha/beta window).
      // If eval + margin < alpha, we assume we can't raise alpha.
      // Margin: 100 * depth?
      if (depth <= 3 && !this.board.isInCheck()) {
          // const staticEval = Evaluation.evaluate(this.board); // Already computed
          const margin = 100 * depth;
          if (staticEval + margin <= alpha) {
              this.stats.pruning.futility++;
              return alpha;
          }
      }

      // Epic 17: ProbCut
      // If search with reduced depth and wider window fails high, prune.
      // Depth > 4, |beta| < infinity.
      if (depth > 4 && Math.abs(beta) < 20000) {
          const probBeta = beta + 200;
          const state = this.board.makeNullMove(); // Not null move, actually ProbCut uses shallow search.
          // Actually ProbCut requires a shallow search.
          // Search at depth - 4 with window [beta+200, inf].
          // If it fails high, we return beta.
          // We assume we have at least one move?
          // ProbCut usually runs BEFORE move generation.

          // Implementation complexity: recursive call.
          // Can trigger infinite loops if not careful with depth reduction.
          // Let's use reduced depth search.

          // Note: ProbCut typically uses the same move ordering/generation.
          // We recurse.
          /*
          const probDepth = depth - 4;
          const probScore = -this.alphaBeta(probDepth, -Infinity, -probBeta);
          if (probScore >= probBeta) {
              return beta;
          }
          */
          // Commented out to avoid stability issues without full testing in this step.
          // Razoring is safer for now.
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
          // Debug Logging
          let debugNode = null;
          if (this.debugMode && depth > 0) {
               debugNode = {
                   move: this.moveToString(move),
                   score: null,
                   children: [],
                   alpha: alpha,
                   beta: beta,
                   depth: depth
               };
               this.currentDebugNode.children.push(debugNode);
          }

          const prevDebugNode = this.currentDebugNode;
          if (this.debugMode) this.currentDebugNode = debugNode || this.currentDebugNode;

          const state = this.board.applyMove(move);
          let score;

          // LMR (Late Move Reduction)
          let reduction = 0;
          if (depth >= 3 && movesSearched > 3 && !move.flags.includes('c') && !this.board.isInCheck()) {
              reduction = 1;
              // If depth is high, reduce more?
              if (depth >= 6 && movesSearched > 8) reduction = 2;
          }

          // Principal Variation Search (PVS)

          // Apply Extension
          const nextDepth = depth + extension - 1;

          if (movesSearched === 0) {
              // Full window search for the first move
              score = -this.alphaBeta(nextDepth, -beta, -alpha);
          } else {
              // Null window search with LMR
              // Reduce from nextDepth (which includes extension)
              let lmrDepth = nextDepth - reduction;
              if (lmrDepth < 0) lmrDepth = 0;

              score = -this.alphaBeta(lmrDepth, -alpha - 1, -alpha);

              // Re-search if LMR failed (score > alpha)
              if (reduction > 0 && score > alpha) {
                  score = -this.alphaBeta(nextDepth, -alpha - 1, -alpha);
              }

              // Full window search if PVS failed (score > alpha and < beta)
              if (score > alpha && score < beta) {
                  score = -this.alphaBeta(nextDepth, -beta, -alpha);
              }
          }

          this.board.undoApplyMove(move, state);

          if (this.debugMode && debugNode) {
              debugNode.score = score;
              this.currentDebugNode = prevDebugNode;
          }

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
             // Captures: MVV-LVA and SEE
             if (m.flags.includes('c')) {
                 // SEE Score
                 const seeScore = SEE.see(this.board, m);
                 if (seeScore < 0) {
                     // Bad capture: Score low (below quiet moves but above pure losing moves?)
                     // Usually bad captures are ordered after killer/history.
                     return -1000000 + seeScore;
                 }

                 // Good capture
                 const victim = m.captured ? this.getPieceValue(m.captured) : 0;
                 const attacker = this.getPieceValue(m.piece);
                 return 1000000 + victim * 10 - attacker + seeScore; // Break ties with SEE
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

      if (this.stopFlag) return alpha;
      if (this.checkLimits && this.checkLimits()) return alpha;

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
          // SEE Pruning
          if (SEE.see(this.board, move) < 0) continue;
          const state = this.board.applyMove(move);
          const score = -this.quiescence(-beta, -alpha);
          this.board.undoApplyMove(move, state);

          if (this.stopFlag) return alpha;

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

  moveToString(move) {
      const { row: fromRow, col: fromCol } = this.board.toRowCol(move.from);
      const { row: toRow, col: toCol } = this.board.toRowCol(move.to);
      const fromAlg = `${String.fromCharCode('a'.charCodeAt(0) + fromCol)}${8 - fromRow}`;
      const toAlg = `${String.fromCharCode('a'.charCodeAt(0) + toCol)}${8 - toRow}`;
      const promo = move.promotion ? move.promotion : '';
      return `${fromAlg}${toAlg}${promo}`;
  }

  getPV(board, depth) {
      // Extract PV from TT
      const pv = [];
      let currentKey = board.zobristKey;
      // Clone board to simulate moves? Or just trust TT keys?
      // We need to make moves to update key.
      // BUT we cannot modify the actual board passed in search freely without undo.
      // We should use a clone or make/unmake carefully.
      // Actually, checking PV is best done by making moves.

      // Simple PV extraction (just for verification logic test)
      // This requires simulating the game forward.
      // Since this is debug/diag, we can assume it's expensive.

      // NOTE: We can't easily clone 'board' fully if it has complex state.
      // But we can use makeMove/unmakeMove if we track them.

      // For now, let's just try to retrieve the move sequence from TT
      // This is tricky without modifying board state to get next Zobrist key.

      // Placeholder: Just return the root move for now as PV[0]
      const entry = this.tt.probe(board.zobristKey);
      if (entry && entry.move) pv.push(entry.move);
      return pv;
  }

  checkPV(pv) {
      // Verify that the PV moves are pseudo-legal (or fully legal) in sequence
      // We need to clone board or make/unmake.
      // Since this function is called at end of search, we can use `this.board`?
      // YES, `search` finishes, board is at root.

      const movesMade = [];
      let valid = true;

      for (const move of pv) {
          const legalMoves = this.board.generateMoves();
          const isLegal = legalMoves.some(m => m.from === move.from && m.to === move.to && m.promotion === move.promotion);

          if (!isLegal) {
              console.error(`PV Consistency Error: Illegal move ${this.moveToString(move)}`);
              valid = false;
              break;
          }

          // Apply move to verify next one
          // We need the full move object from generateMoves to apply it correctly (flags etc)
          const realMove = legalMoves.find(m => m.from === move.from && m.to === move.to && m.promotion === move.promotion);
          const state = this.board.applyMove(realMove);
          movesMade.push({ move: realMove, state });
      }

      // Undo all
      while (movesMade.length > 0) {
          const { move, state } = movesMade.pop();
          this.board.undoApplyMove(move, state);
      }

      if (!valid) {
          throw new Error("PV Consistency Check Failed");
      }
  }
}

module.exports = Search;
