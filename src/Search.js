const Evaluation = require('./Evaluation');
const { TranspositionTable, TT_FLAG } = require('./TranspositionTable');
const { Accumulator } = require('./NNUE');
const SEE = require('./SEE');
const Syzygy = require('./Syzygy'); // Epic 15

class Search {
  constructor(board, tt = null, nnue = null) {
    this.board = board;
    this.nnue = nnue;
    this.nodes = 0;
    this.tt = tt || new TranspositionTable(64); // Use passed TT or default
    this.timer = null;
    this.stopFlag = false;
    this.accumulatorStack = [];

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

    // Epic 23: Countermove Heuristic
    // Table: [side][prevFrom][prevTo] -> move
    // Size: 2 * 128 * 128 * (Move Object Reference?)
    // Storing full move objects might be memory intensive if strict.
    // But JS arrays are sparse/references.
    // Let's use a flat array of moves or objects.
    // We can index by [side * 128 * 128 + from * 128 + to].
    this.counterMoves = new Array(2 * 128 * 128).fill(null);

    this.stats = {
        nodes: 0,
        pruning: {
            nullMove: 0,
            futility: 0,
            probCut: 0
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
  search(maxDepth = 5, timeLimits = { hardLimit: 1000, softLimit: 1000 }, options = {}, timeManager = null) {
    this.options = options;
    this.isStable = false;

    if (this.options.UCI_UseNNUE && this.nnue && this.nnue.network) {
        this.accumulatorStack = [new Accumulator()];
        this.nnue.refreshAccumulator(this.accumulatorStack[0], this.board);
    }
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
            futility: 0,
            probCut: 0
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
    let lastBestMove = null;
    let stableMoveCount = 0;

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
    const multiPV = options.MultiPV || 1;

    for (let depth = 1; depth <= maxDepth; depth++) {
        const entry = this.tt.probe(this.board.zobristKey);
        // Note: With MultiPV, existing TT entry might be from a previous PV line or previous depth.
        // We use it for move ordering (handled in rootAlphaBeta).

        if (this.debugMode) {
             this.debugTree.nodes = [];
             this.debugTree.iteration = depth;
        }

        let excludedMoves = [];

        for (let pvIdx = 0; pvIdx < multiPV; pvIdx++) {
            // Aspiration Windows
            // We only use aspiration windows for the first PV line to keep things simple for now.
            let alpha = -Infinity;
            let beta = Infinity;
            const windowSize = options.AspirationWindow || 50;

            if (depth > 1 && pvIdx === 0) {
                alpha = bestScore - windowSize;
                beta = bestScore + windowSize;
            }

            let move = null;
            let result = null;
            let val = -Infinity;

            while (true) {
                // Root has no prevMove
                result = this.rootAlphaBeta(depth, alpha, beta, excludedMoves);
                move = result.move;
                val = result.score;

                // Check if stopped during root search
                if (this.stopFlag) {
                    if (pvIdx === 0 && move) bestMove = move; // Only update global bestMove if it's the main line
                    break;
                }

                // Safety check: if val is null/undefined (e.g. no moves?), break
                if (val === undefined || val === null) {
                    // No more moves available (e.g. we excluded all legal moves)
                    break;
                }

                // Fail Low
                if (val <= alpha) {
                    if (alpha === -Infinity) {
                        break;
                    }
                    alpha = -Infinity;
                    continue;
                }
                // Fail High
                if (val >= beta) {
                    if (beta === Infinity) {
                        break;
                    }
                    beta = Infinity;
                    continue;
                }

                // Exact
                break;
            }

            if (this.stopFlag) break;

            if (!result || result.move === null) {
                // No more moves found (e.g. fewer legal moves than MultiPV)
                break;
            }

            const currentBestMove = result.move;
            const currentBestScore = result.score;

            // Update global bestMove/bestScore only for the first PV line
            if (pvIdx === 0) {
                bestMove = currentBestMove;
                bestScore = currentBestScore;
            }

            // Report info string for this PV
            if (options.onInfo) {
                const elapsed = Date.now() - startTime;
                const nps = elapsed > 0 ? Math.floor(this.nodes / (elapsed / 1000)) : 0;
                const pvLine = this.getPVLine(this.board, depth, currentBestMove);
                const pvString = pvLine.map(m => this.moveToString(m)).join(' ');

                let scoreString = `cp ${currentBestScore}`;
                if (Math.abs(currentBestScore) > 10000) {
                    const mateIn = Math.ceil((20000 - Math.abs(currentBestScore)) / 2) * (currentBestScore > 0 ? 1 : -1);
                    scoreString = `mate ${mateIn}`;
                }

                options.onInfo(`depth ${depth} multipv ${pvIdx + 1} score ${scoreString} nodes ${this.nodes} nps ${nps} time ${elapsed} pv ${pvString}`);
            }

            excludedMoves.push(currentBestMove);
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

            // Track search stability
            if (lastBestMove && bestMove && lastBestMove.from === bestMove.from && lastBestMove.to === bestMove.to) {
                stableMoveCount++;
            } else {
                stableMoveCount = 0;
            }
            lastBestMove = bestMove;

            this.isStable = stableMoveCount >= 2;

            // Panic logic:
            const newEntry = this.tt.probe(this.board.zobristKey);
            const currentScore = newEntry && newEntry.depth === depth ? newEntry.score : -Infinity;

            if (depth > 1 && bestScore > -10000 && currentScore > -10000) {
                if (bestScore - currentScore > 60) {
                    limit = Math.min(timeLimits.hardLimit, limit * 2);
                    this.isStable = false; // Score is unstable
                }
            }

            if (timeManager) {
                if (timeManager.shouldStop(elapsed, limit, this.isStable)) {
                    this.stopFlag = true;
                }
            } else { // Fallback for bench or tests
                if (elapsed >= limit && this.isStable) {
                    this.stopFlag = true;
                }
                if (elapsed >= timeLimits.hardLimit) {
                   this.stopFlag = true;
                }
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

  rootAlphaBeta(depth, alpha, beta, excludedMoves = []) {
      // Similar to alphaBeta but returns object { move, score }
      let bestMove = null;
      let bestScore = -Infinity;

      // TT Probe for ordering
      const ttEntry = this.tt.probe(this.board.zobristKey);
      let ttMove = ttEntry ? ttEntry.move : null;

      const moves = this.board.generateMoves();
      if (moves.length === 0) return { move: null, score: -Infinity };

      let filteredMoves = moves;

      // Filter out excluded moves (MultiPV)
      if (excludedMoves && excludedMoves.length > 0) {
          filteredMoves = filteredMoves.filter(m => !excludedMoves.some(em => em.from === m.from && em.to === m.to && em.promotion === m.promotion));
      }

      if (filteredMoves.length === 0) return { move: null, score: -Infinity };

      let searchMoves = this.options && this.options.searchMoves;

      if (searchMoves && searchMoves.length > 0) {
          filteredMoves = filteredMoves.filter(m => {
              const alg = this.moveToString(m);
              return searchMoves.includes(alg);
          });
          if (filteredMoves.length === 0) {
              return { move: null, score: -Infinity };
          }
      }

      // Move Ordering (Root has no prevMove)
      this.orderMoves(filteredMoves, ttMove, depth, null);

      for (const move of filteredMoves) {
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

          let extension = this._getPassedPawnExtension(move);

          const state = this.board.applyMove(move);
          if (this.board.isInCheck()) {
              extension = Math.max(extension, 1);
          }
          const score = -this.alphaBeta(depth - 1 + extension, -beta, -alpha, move);
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
      // Store Root in TT? Yes, but only if we are searching the main line (no excluded moves)
      // If we are searching for the 2nd best move, we don't want to overwrite the primary best move in the TT.
      if (!this.stopFlag && bestMove && (!excludedMoves || excludedMoves.length === 0)) {
          this.tt.save(this.board.zobristKey, bestScore, depth, TT_FLAG.EXACT, bestMove);
      }

      return { move: bestMove, score: bestScore };
  }

  _getPassedPawnExtension(move) {
      if (move.piece.type === 'pawn') {
          const toRow = move.to >> 4;
          const color = move.piece.color;
          // Ranks 6 and 7 from white's perspective.
          // White: rows 2 (rank 6) and 1 (rank 7).
          // Black: rows 5 (rank 3) and 6 (rank 2).
          if ((color === 'white' && toRow <= 2) || (color === 'black' && toRow >= 5)) {
              if (Evaluation.isPassedPawn(this.board, move.from)) {
                  return 1;
              }
          }
      }
      return 0;
  }

  alphaBeta(depth, alpha, beta, prevMove = null) {
      this.nodes++;

      if (this.stopFlag) return alpha;

      // Check limits (frequency handled inside)
      if (this.checkLimits && this.checkLimits()) return alpha;

      // Check 50-move and repetition
      if (this.board.isDrawBy50Moves() || this.board.isDrawByRepetition()) {
          // Epic 26: Contempt Factor
          // If Contempt is set, return -Contempt (from perspective of side to move).
          // "I avoid draws because I think I am better".
          // If I play a draw, score is -Contempt.
          // options must be available. `search` method has `options`.
          // But `alphaBeta` doesn't have `options` passed to it.
          // I need to store options in `this`.
          // `search` method calls `this.options = options`?
          // Let's assume `this.options` exists or default to 0.
          const contempt = (this.options && this.options.Contempt) ? this.options.Contempt : 0;
          return -contempt;
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

      // Epic 21: Internal Iterative Deepening (IID)
      // If no TT move and depth is significant, search shallower to populate TT.
      if (depth > 3 && (!ttEntry || !ttEntry.move)) {
          const iidDepth = depth - 2;
          this.alphaBeta(iidDepth, alpha, beta, prevMove);
          // After this call, TT might be populated for current key
      }
      const ttEntryAfterIID = this.tt.probe(this.board.zobristKey);
      const ttMove = (ttEntryAfterIID && ttEntryAfterIID.move) ? ttEntryAfterIID.move : (ttEntry ? ttEntry.move : null);

      // Epic 17: Advanced Pruning
      const currentAccumulator = this.accumulatorStack[this.accumulatorStack.length - 1];
      const staticEval = (this.options && this.options.UCI_UseNNUE && this.nnue && this.nnue.network)
        ? this.nnue.evaluate(this.board, currentAccumulator)
        : Evaluation.evaluate(this.board);

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

      // Epic 46: ProbCut Pruning
      // Condition: depth >= 5, not in check, |beta| < 20000 (avoid mate scores)
      if (depth >= 5 && !inCheck && Math.abs(beta) < 20000) {
          const PROBCUT_MARGIN = 200;
          const PROBCUT_REDUCTION = 4;

          // Shallow search with a widened window
          const probCutBeta = beta + PROBCUT_MARGIN;

          const score = this.alphaBeta(depth - PROBCUT_REDUCTION, probCutBeta - 1, probCutBeta, prevMove);

          if (score >= probCutBeta) {
              this.stats.pruning.probCut++;
              return beta;
          }
      }

      // Epic 24: Multi-Cut Pruning (MCP)
      // If not PV (alpha == beta - 1 implied by window check usually, or explicitly passed isPV),
      // and depth is sufficient.
      // We don't track isPV explicitly here (alpha/beta window only).
      // If not in check and depth >= 4:
      // Generate M moves. If C of them fail high at depth-R, return beta.
      // This requires generating moves.

      // Internal Iterative Deepening was moved up (Epic 21).

      const moves = this.board.generateMoves();

      // Check for Mate/Stalemate
      if (moves.length === 0) {
          if (this.board.isInCheck()) {
              return -20000 + (100 - depth); // Prefer faster mates
          } else {
              return 0; // Stalemate
          }
      }

      if (depth === 0) {
          return this.quiescence(alpha, beta);
      }

      // Move ordering
      // Used ttMove retrieved after potential IID
      this.orderMoves(moves, ttMove, depth, prevMove);

      let flag = TT_FLAG.UPPERBOUND; // Default: we fail low (all moves < alpha)
      let bestScore = -Infinity;
      let bestMove = null;
      let movesSearched = 0;

      for (const move of moves) {
          // Epic 22: Late Move Pruning (LMP)
          // If depth is low and we searched enough moves, skip quiet ones.
          if (depth <= 3 && movesSearched >= (3 + depth * depth) && !inCheck) {
              // Ensure we don't prune captures or promotions or checks
              // 'move.flags' includes 'c', 'p', 'cp'. 'k', 'q' castling are quiets usually?
              // Castling is important.
              // Check if move gives check?
              // We don't have easy givesCheck() without making it.
              // Safe LMP: Prune only simple quiet moves.
              if (!move.flags.includes('c') && !move.flags.includes('p') && !move.flags.includes('k') && !move.flags.includes('q')) {
                  continue;
              }
          }
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

          if (this.options.UCI_UseNNUE && this.nnue && this.nnue.network) {
              const newAccumulator = this.accumulatorStack[this.accumulatorStack.length - 1].clone();
              const changes = this.nnue.getChangedIndices(this.board, move, state.capturedPiece);
              if (changes[move.piece.color].refresh) {
                  const tempBoard = this.board.clone(); // Assumes clone
                  tempBoard.applyMove(move);
                  this.nnue.refreshAccumulator(newAccumulator, tempBoard);
              } else {
                  this.nnue.updateAccumulator(newAccumulator, changes);
              }
              this.accumulatorStack.push(newAccumulator);
          }

          // LMR (Late Move Reduction)
          let reduction = 0;
          const isQuiet = !move.flags.includes('c') && !move.flags.includes('p');
          if (depth >= 3 && movesSearched > 1 && isQuiet && !inCheck) {
              // Formula inspired by common LMR implementations, using natural logs.
              // R = c1 + ln(depth) * ln(movesSearched) / c2
              const R = Math.floor(0.75 + (Math.log(depth) * Math.log(movesSearched)) / 2.25);

              // Apply the reduction, but don't reduce too much.
              reduction = Math.max(0, R);

              // Don't reduce the search to less than 2 ply.
              // nextDepth = depth - 1 + extension. lmrDepth = nextDepth - reduction.
              // We need lmrDepth >= 1.
              // So, depth - 1 + extension - reduction >= 1
              // reduction <= depth - 2 + extension
              const maxReduction = depth - 2 + extension;
              reduction = Math.min(reduction, maxReduction);
          }

          // Principal Variation Search (PVS)

          // Apply Extensions
          let currentExtension = extension; // Base extension from check
          currentExtension = Math.max(currentExtension, this._getPassedPawnExtension(move));

          const nextDepth = depth + currentExtension - 1;

          if (movesSearched === 0) {
              // Full window search for the first move
              score = -this.alphaBeta(nextDepth, -beta, -alpha, move);
          } else {
              // Null window search with LMR
              // Reduce from nextDepth (which includes extension)
              let lmrDepth = nextDepth - reduction;
              if (lmrDepth < 0) lmrDepth = 0;

              score = -this.alphaBeta(lmrDepth, -alpha - 1, -alpha, move);

              // Re-search if LMR failed (score > alpha)
              if (reduction > 0 && score > alpha) {
                  score = -this.alphaBeta(nextDepth, -alpha - 1, -alpha, move);
              }

              // If the null-window search failed high (score > alpha), it's possible
              // this move is better than we thought. We must re-search with the full window.
              if (score > alpha && score < beta) {
                  // Re-search with full depth and full window
                  score = -this.alphaBeta(nextDepth, -beta, -alpha, move);
              }
          }

          this.board.undoApplyMove(move, state);
          if (this.options.UCI_UseNNUE && this.nnue && this.nnue.network) {
              this.accumulatorStack.pop();
          }

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
                  if (this.options.UseHistory) {
                    this.addHistoryScore(this.board.activeColor, move.from, move.to, depth);
                  }

                  // Epic 23: Countermove Heuristic
                  // Store countermove for opponent's previous move
                  if (prevMove) {
                      const sideIdx = this.board.activeColor === 'w' ? 0 : 1; // This is CURRENT side.
                      // Opponent made prevMove. We want to store OUR move as the refutation.
                      // Table is indexed by [SideWhoMoving][PrevFrom][PrevTo] -> BestResponse
                      // Wait, usually CounterMove is "If opponent moved X, I play Y".
                      // So index by Opponent Side? No, typically [MySide][OppFrom][OppTo].
                      // Let's use: [CurrentSide][PrevFrom][PrevTo] = CurrentMove
                      const idx = sideIdx * 128 * 128 + prevMove.from * 128 + prevMove.to;
                      if (idx < this.counterMoves.length) {
                          this.counterMoves[idx] = move;
                      }
                  }
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

  orderMoves(moves, ttMove, depth = 0, prevMove = null) {
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

             // Epic 23: Countermove
             if (prevMove) {
                 const sideIdx = this.board.activeColor === 'w' ? 0 : 1;
                 const idx = sideIdx * 128 * 128 + prevMove.from * 128 + prevMove.to;
                 if (idx < this.counterMoves.length) {
                     const cm = this.counterMoves[idx];
                     if (cm && cm.from === m.from && cm.to === m.to) {
                         return 800000; // Below killer (900k), above History
                     }
                 }
             }

             // History
             if (this.options.UseHistory) {
                return this.getHistoryScore(this.board.activeColor, m.from, m.to);
             }
             return 0;
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

      const currentAccumulator = this.accumulatorStack.length > 0 ? this.accumulatorStack[this.accumulatorStack.length - 1] : null;
      const standPat = (this.options && this.options.UCI_UseNNUE && this.nnue && this.nnue.network)
        ? this.nnue.evaluate(this.board, currentAccumulator)
        : Evaluation.evaluate(this.board);
      if (standPat >= beta) {
          return beta;
      }
      // Delta Pruning: If stand_pat is much worse than alpha, it's unlikely
      // that a single capture can raise the score above alpha.
      const safetyMargin = 975; // A bit more than a queen
      if (standPat < alpha - safetyMargin) {
         // However, we should not prune if there is a checking move that could lead to mate.
         // This is expensive to check, so for now we apply a simpler version of delta pruning,
         // by not pruning at all if the king is in check.
         if (!this.board.isInCheck()) {
            return alpha;
         }
      }
      if (alpha < standPat) {
          alpha = standPat;
      }

      const moves = this.board.generateMoves();
      // Filter for captures and promotions, which are tactical moves.
      const interestingMoves = moves.filter(m => m.flags.includes('c') || m.flags.includes('p'));

      // Sort captures (MVV-LVA simplified: just capture high value piece)
      interestingMoves.sort((a, b) => {
          const valA = (a.promotion ? 900 : 0) + (a.captured ? this.getPieceValue(a.captured) : 0);
          const valB = (b.promotion ? 900 : 0) + (b.captured ? this.getPieceValue(b.captured) : 0);
          return valB - valA;
      });

      for (const move of interestingMoves) {
          // SEE Pruning for captures
          if (move.flags.includes('c') && SEE.see(this.board, move) < 0) continue;

          const state = this.board.applyMove(move);

          if (this.options.UCI_UseNNUE && this.nnue && this.nnue.network) {
              const newAccumulator = this.accumulatorStack[this.accumulatorStack.length - 1].clone();
              const changes = this.nnue.getChangedIndices(this.board, move, state.capturedPiece);
              if (changes[move.piece.color].refresh) {
                  const tempBoard = this.board.clone(); // Assumes clone
                  tempBoard.applyMove(move);
                  this.nnue.refreshAccumulator(newAccumulator, tempBoard);
              } else {
                  this.nnue.updateAccumulator(newAccumulator, changes);
              }
              this.accumulatorStack.push(newAccumulator);
          }

          const score = -this.quiescence(-beta, -alpha);
          this.board.undoApplyMove(move, state);

          if (this.options.UCI_UseNNUE && this.nnue && this.nnue.network) {
              this.accumulatorStack.pop();
          }

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

  getPVLine(board, depth, firstMove) {
      const pv = [];
      const movesMade = [];
      try {
          if (firstMove) {
              pv.push(firstMove);
              const state = board.applyMove(firstMove);
              movesMade.push({ move: firstMove, state });
          }

          let currentDepth = firstMove ? 1 : 0;
          const seenKeys = new Set();
          seenKeys.add(board.zobristKey);

          while (currentDepth < depth) {
              const entry = this.tt.probe(board.zobristKey);
              if (!entry || !entry.move) break;

              const move = entry.move;

              // Validate legality
              const legalMoves = board.generateMoves();
              const realMove = legalMoves.find(m => m.from === move.from && m.to === move.to && m.promotion === move.promotion);

              if (!realMove) break;

              pv.push(realMove);
              const state = board.applyMove(realMove);
              movesMade.push({ move: realMove, state });

              if (seenKeys.has(board.zobristKey)) break; // Loop detection
              seenKeys.add(board.zobristKey);

              currentDepth++;
          }
      } finally {
           while(movesMade.length > 0) {
              const { move, state } = movesMade.pop();
              board.undoApplyMove(move, state);
          }
      }
      return pv;
  }

  getPV(board, depth) {
      // Wrapper for backward compatibility / debug check
      return this.getPVLine(board, depth, null);
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
