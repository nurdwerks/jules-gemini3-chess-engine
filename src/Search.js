const Evaluation = require('./Evaluation')
const { TranspositionTable, TT_FLAG } = require('./TranspositionTable')
const { Accumulator } = require('./NNUE')
const SEE = require('./SEE')
const Syzygy = require('./Syzygy') // Epic 15
const SearchHeuristics = require('./SearchHeuristics')
const MoveSorter = require('./MoveSorter')
const Quiescence = require('./Quiescence')
const SearchPruning = require('./SearchPruning')
const StrengthLimiter = require('./StrengthLimiter')
const fs = require('fs')

class Search {
  constructor (board, tt = null, nnue = null) {
    this.board = board
    this.nnue = nnue
    this.nodes = 0
    this.tt = tt || new TranspositionTable(64) // Use passed TT or default
    this.timer = null
    this.stopFlag = false
    this.accumulatorStack = []

    // Epic 15: Syzygy
    this.syzygy = new Syzygy()
    // Mock load for now or real if file exists
    // this.syzygy.loadTable('path/to/tb');

    // Move Ordering Heuristics
    this.heuristics = new SearchHeuristics()

    this.stats = {
      nodes: 0,
      pruning: {
        nullMove: 0,
        futility: 0,
        probCut: 0
      }
    }
  }

  /**
   * Performs an iterative deepening search to find the best move.
   * @param {number} [maxDepth=5] - The maximum depth to search.
   * @param {Object|number} [timeLimits] - Time constraints ({ hardLimit, softLimit }) or just hard limit in ms.
   * @param {Object} [options] - Search options (UCI options, debug flags, etc.).
   * @param {TimeManager} [timeManager] - Optional TimeManager instance for advanced time control.
   * @returns {Object|null} The best move found, or null if none.
   */
  search (maxDepth = 5, timeLimits = { hardLimit: 1000, softLimit: 1000 }, options = {}, timeManager = null) {
    this._initSearch(options, timeLimits)

    let bestMove = null
    let bestScore = -Infinity
    let persistentBestMove = null
    let lastBestMove = null
    let stableMoveCount = 0

    const multiPV = options.MultiPV || 1

    for (let depth = 1; depth <= maxDepth; depth++) {
      if (this.debugMode) {
        this.debugTree.nodes = []
        this.debugTree.iteration = depth
      }

      const { move: currentBestMove, score: currentBestScore } = this._searchDepth(depth, multiPV, bestScore)

      if (this.stopFlag && !currentBestMove) break

      if (currentBestMove) {
        bestMove = currentBestMove
        bestScore = currentBestScore
        persistentBestMove = bestMove
      }

      if (this.stopFlag) break

      this.checkLimits()
      if (this.timeLimits.softLimit !== Infinity && !this.stopFlag) {
        const result = this._checkSoftTimeLimit(timeManager, depth, bestScore, bestMove, lastBestMove, stableMoveCount)
        if (result.stop) {
          this.stopFlag = true
          break
        }
        lastBestMove = result.lastBestMove
        stableMoveCount = result.stableMoveCount
      }

      this._handleDebugSave()
    }

    bestMove = this._applyErrorInjection(bestMove)

    if (this.debugMode) {
      console.log(`Search Stats: Nodes=${this.nodes} NullMove=${this.stats.pruning.nullMove} Futility=${this.stats.pruning.futility}`)
    }

    return persistentBestMove || bestMove
  }

  _initSearch (options, timeLimits) {
    this.options = options
    this.isStable = false
    if (this.options.UCI_UseNNUE && this.nnue && this.nnue.network) {
      this.accumulatorStack = [new Accumulator()]
      this.nnue.refreshAccumulator(this.accumulatorStack[0], this.board)
    }

    if (typeof timeLimits === 'number') {
      this.timeLimits = { hardLimit: timeLimits, softLimit: timeLimits }
    } else {
      this.timeLimits = timeLimits
    }

    this.maxNodes = Infinity
    if (options.nodes) {
      this.maxNodes = options.nodes
    } else if (options.UCI_LimitStrength && options.UCI_Elo) {
      this.maxNodes = StrengthLimiter.getNodesForElo(options.UCI_Elo)
    }

    this.debugMode = options.debug || false
    this.debugTree = { depth: 0, nodes: [] }
    this.debugFile = options.debugFile || 'search_tree.json'
    this.currentDebugNode = this.debugTree

    this.nodes = 0
    this.stats = { nodes: 0, pruning: { nullMove: 0, futility: 0, probCut: 0 } }
    this.stopFlag = false

    this.heuristics.clearKillers()
    this.heuristics.ageHistory()

    this.startTime = Date.now()
    this.checkMask = 2047
  }

  checkLimits () {
    if (this.nodes >= this.maxNodes) {
      this.stopFlag = true
      return true
    }
    if ((this.nodes & this.checkMask) !== 0) return false

    if (this.timeLimits.hardLimit !== Infinity) {
      if (Date.now() - this.startTime >= this.timeLimits.hardLimit) {
        this.stopFlag = true
        return true
      }
    }
    return false
  }

  _searchDepth (depth, multiPV, bestScore) {
    const excludedMoves = []
    let depthBestMove = null
    let depthBestScore = bestScore

    for (let pvIdx = 0; pvIdx < multiPV; pvIdx++) {
      const { move, score } = this._searchPVLine(depth, pvIdx, depthBestScore, excludedMoves)

      if (this.stopFlag) break
      if (!move) break

      if (pvIdx === 0) {
        depthBestMove = move
        depthBestScore = score
      }

      this._reportInfo(depth, pvIdx, score, move)

      excludedMoves.push(move)
    }
    return { move: depthBestMove, score: depthBestScore }
  }

  _searchPVLine (depth, pvIdx, bestScore, excludedMoves) {
    let alpha = -Infinity
    let beta = Infinity
    const windowSize = this.options.AspirationWindow || 50

    if (depth > 1 && pvIdx === 0) {
      alpha = bestScore - windowSize
      beta = bestScore + windowSize
    }

    while (true) {
      const { move, score } = this.rootAlphaBeta(depth, alpha, beta, excludedMoves)

      if (this.stopFlag) return { move, score }
      if (score === undefined || score === null) return { move: null, score }

      if (score <= alpha) {
        if (alpha === -Infinity) break
        alpha = -Infinity
        continue
      }
      if (score >= beta) {
        if (beta === Infinity) break
        beta = Infinity
        continue
      }
      return { move, score }
    }
    return { move: null, score: -Infinity }
  }

  _reportInfo (depth, pvIdx, score, move) {
    if (this.options.onInfo) {
      const elapsed = Date.now() - this.startTime
      const nps = elapsed > 0 ? Math.floor(this.nodes / (elapsed / 1000)) : 0
      const pvLine = this.getPVLine(this.board, depth, move)
      const pvString = pvLine.map(m => this.moveToString(m)).join(' ')

      let scoreString = `cp ${score}`
      if (Math.abs(score) > 10000) {
        const mateIn = Math.ceil((20000 - Math.abs(score)) / 2) * (score > 0 ? 1 : -1)
        scoreString = `mate ${mateIn}`
      }

      this.options.onInfo(`depth ${depth} multipv ${pvIdx + 1} score ${scoreString} nodes ${this.nodes} nps ${nps} time ${elapsed} pv ${pvString}`)
    }
  }

  _checkSoftTimeLimit (timeManager, depth, bestScore, bestMove, lastBestMove, stableMoveCount) {
    const elapsed = Date.now() - this.startTime
    let limit = this.timeLimits.softLimit

    const stability = this._updateStability(bestMove, lastBestMove, stableMoveCount)
    lastBestMove = stability.lastBestMove
    stableMoveCount = stability.stableMoveCount
    this.isStable = stability.isStable

    limit = this._adjustLimitForInstability(depth, bestScore, limit)

    const stop = this._shouldStop(timeManager, elapsed, limit)

    return { stop, lastBestMove, stableMoveCount }
  }

  _updateStability (bestMove, lastBestMove, stableMoveCount) {
    if (lastBestMove && bestMove && lastBestMove.from === bestMove.from && lastBestMove.to === bestMove.to) {
      stableMoveCount++
    } else {
      stableMoveCount = 0
    }
    return { lastBestMove: bestMove, stableMoveCount, isStable: stableMoveCount >= 2 }
  }

  _adjustLimitForInstability (depth, bestScore, limit) {
    const newEntry = this.tt.probe(this.board.zobristKey)
    const currentScore = newEntry && newEntry.depth === depth ? newEntry.score : -Infinity

    if (depth > 1 && bestScore > -10000 && currentScore > -10000) {
      if (bestScore - currentScore > 60) {
        this.isStable = false
        return Math.min(this.timeLimits.hardLimit, limit * 2)
      }
    }
    return limit
  }

  _shouldStop (timeManager, elapsed, limit) {
    if (timeManager) {
      return timeManager.shouldStop(elapsed, limit, this.isStable)
    } else {
      if (elapsed >= limit && this.isStable) return true
      if (elapsed >= this.timeLimits.hardLimit) return true
    }
    return false
  }

  _handleDebugSave () {
    if (this.debugMode) {
      try {
        fs.writeFileSync(this.debugFile, JSON.stringify(this.debugTree, null, 2))
      } catch (e) {
        console.error('Failed to write debug tree:', e)
      }
    }
    if (this.debugMode) {
      const pv = this.getPV(this.board, this.debugTree.iteration || 1)
      this.checkPV(pv)
    }
  }

  _applyErrorInjection (bestMove) {
    if (this.options.UCI_LimitStrength && this.options.UCI_Elo && bestMove) {
      const elo = this.options.UCI_Elo
      if (elo < 2500) {
        const blunderChance = Math.max(0, (2500 - elo) / 5000)
        if (Math.random() < blunderChance) {
          const moves = this.board.generateMoves()
          if (moves.length > 1) {
            const otherMoves = moves.filter(m => !(m.from === bestMove.from && m.to === bestMove.to))
            if (otherMoves.length > 0) {
              const randomIdx = Math.floor(Math.random() * otherMoves.length)
              return otherMoves[randomIdx]
            }
          }
        }
      }
    }
    return bestMove
  }

  rootAlphaBeta (depth, alpha, beta, excludedMoves = []) {
    // Similar to alphaBeta but returns object { move, score }
    let bestMove = null
    let bestScore = -Infinity

    // TT Probe for ordering
    const ttEntry = this.tt.probe(this.board.zobristKey)
    const ttMove = ttEntry ? ttEntry.move : null

    const moves = this.board.generateMoves()
    if (moves.length === 0) return { move: null, score: -Infinity }

    let filteredMoves = moves

    // Filter out excluded moves (MultiPV)
    if (excludedMoves && excludedMoves.length > 0) {
      filteredMoves = filteredMoves.filter(m => !excludedMoves.some(em => em.from === m.from && em.to === m.to && em.promotion === m.promotion))
    }

    if (filteredMoves.length === 0) return { move: null, score: -Infinity }

    const searchMoves = this.options && this.options.searchMoves

    if (searchMoves && searchMoves.length > 0) {
      filteredMoves = filteredMoves.filter(m => {
        const alg = this.moveToString(m)
        return searchMoves.includes(alg)
      })
      if (filteredMoves.length === 0) {
        return { move: null, score: -Infinity }
      }
    }

    // Move Ordering (Root has no prevMove)
    this.orderMoves(filteredMoves, ttMove, depth, null)

    for (const move of filteredMoves) {
      // Check stop condition
      if (this.checkLimits()) return { move: bestMove, score: bestScore }

      // Debug Logging
      let debugNode = null
      if (this.debugMode) {
        debugNode = {
          move: this.moveToString(move),
          score: null,
          children: [],
          alpha,
          beta,
          depth
        }
        this.debugTree.nodes.push(debugNode)
      }

      const prevDebugNode = this.currentDebugNode
      if (this.debugMode) this.currentDebugNode = debugNode

      let extension = this._getPassedPawnExtension(move)

      const state = this.board.applyMove(move)
      if (this.board.isInCheck()) {
        extension = Math.max(extension, 1)
      }
      const score = -this.alphaBeta(depth - 1 + extension, -beta, -alpha, move, 1, null)
      this.board.undoApplyMove(move, state)

      if (this.debugMode) {
        debugNode.score = score
        this.currentDebugNode = prevDebugNode
      }
      if (this.stopFlag) return { move: bestMove, score: bestScore } // Abort

      if (score > bestScore) {
        bestScore = score
        bestMove = move
      }
      if (score > alpha) {
        alpha = score
      }
    }
    // Store Root in TT? Yes, but only if we are searching the main line (no excluded moves)
    // If we are searching for the 2nd best move, we don't want to overwrite the primary best move in the TT.
    if (!this.stopFlag && bestMove && (!excludedMoves || excludedMoves.length === 0)) {
      this.tt.save(this.board.zobristKey, bestScore, depth, TT_FLAG.EXACT, bestMove)
    }

    return { move: bestMove, score: bestScore }
  }

  _getPassedPawnExtension (move) {
    if (move.piece.type === 'pawn') {
      const toRow = move.to >> 4
      const color = move.piece.color
      // Ranks 6 and 7 from white's perspective.
      // White: rows 2 (rank 6) and 1 (rank 7).
      // Black: rows 5 (rank 3) and 6 (rank 2).
      if ((color === 'white' && toRow <= 2) || (color === 'black' && toRow >= 5)) {
        if (Evaluation.isPassedPawn(this.board, move.from)) {
          return 1
        }
      }
    }
    return 0
  }

  /**
   * The Alpha-Beta pruning search algorithm.
   * @param {number} depth - The remaining depth to search.
   * @param {number} alpha - The lower bound score.
   * @param {number} beta - The upper bound score.
   * @param {Object} [prevMove=null] - The move that led to this position (for heuristics).
   * @returns {number} The score of the position from the perspective of the side to move.
   */
  alphaBeta (depth, alpha, beta, prevMove = null, ply = 0, excludedMove = null) {
    this.nodes++
    if (this.stopFlag) return alpha

    // Mate Distance Pruning
    const MATE_SCORE = 20000
    alpha = Math.max(alpha, -MATE_SCORE + ply)
    beta = Math.min(beta, MATE_SCORE - ply - 1)
    if (alpha >= beta) return alpha

    if (this.checkLimits && this.checkLimits()) return alpha

    if (this.board.isDrawBy50Moves() || this.board.isDrawByRepetition()) {
      return this.options && this.options.Contempt ? -this.options.Contempt : 0
    }

    const inCheck = this.board.isInCheck()
    const extension = inCheck ? 1 : 0

    // Null Move Pruning
    const nmResult = SearchPruning.tryNullMovePruning(this, depth, beta, inCheck, ply)
    if (nmResult === 'STOP') return alpha
    if (nmResult !== null) return nmResult

    // TT Probe
    let ttEntry = this.tt.probe(this.board.zobristKey)
    if (ttEntry && ttEntry.depth >= depth) {
      if (ttEntry.flag === TT_FLAG.EXACT) return ttEntry.score
      if (ttEntry.flag === TT_FLAG.LOWERBOUND && ttEntry.score >= beta) return ttEntry.score
      if (ttEntry.flag === TT_FLAG.UPPERBOUND && ttEntry.score <= alpha) return ttEntry.score
    }

    // IID
    if (depth > 3 && (!ttEntry || !ttEntry.move)) {
      this.alphaBeta(depth - 2, alpha, beta, prevMove, ply, excludedMove)
      ttEntry = this.tt.probe(this.board.zobristKey)
    }
    const ttMove = (ttEntry && ttEntry.move) ? ttEntry.move : null

    // Pruning (Razoring, Futility, ProbCut)
    const pruningResult = this._performPruning(depth, alpha, beta, inCheck, prevMove, ply)
    if (pruningResult !== null) return pruningResult

    // Singular Extensions
    const singularExtension = this._getSingularExtension(depth, ttEntry, ttMove, prevMove, ply, excludedMove)

    const moves = this.board.generateMoves()

    if (moves.length === 0) {
      if (inCheck) return -20000 + ply
      return 0
    }

    if (depth === 0) return this.quiescence(alpha, beta)

    return this._searchMoves(moves, depth, alpha, beta, ply, prevMove, excludedMove, ttMove, inCheck, extension, singularExtension)
  }

  _performPruning (depth, alpha, beta, inCheck, prevMove, ply) {
    const currentAccumulator = this.accumulatorStack[this.accumulatorStack.length - 1]
    const staticEval = (this.options && this.options.UCI_UseNNUE && this.nnue && this.nnue.network)
      ? this.nnue.evaluate(this.board, currentAccumulator)
      : Evaluation.evaluate(this.board)

    const razoringResult = SearchPruning.tryRazoring(this, depth, alpha, beta, staticEval, inCheck)
    if (razoringResult !== null) return razoringResult

    const futilityResult = SearchPruning.tryFutilityPruning(this, depth, alpha, staticEval, inCheck)
    if (futilityResult !== null) return futilityResult

    const probCutResult = SearchPruning.tryProbCut(this, depth, beta, inCheck, prevMove, ply)
    if (probCutResult !== null) return probCutResult

    return null
  }

  _getSingularExtension (depth, ttEntry, ttMove, prevMove, ply, excludedMove) {
    if (!excludedMove && depth >= 8 && ttMove && ttEntry && ttEntry.depth >= depth - 3 && ttEntry.flag !== TT_FLAG.UPPERBOUND && Math.abs(ttEntry.score) < 10000) {
      const SE_MARGIN = 2 * depth
      const singularBeta = ttEntry.score - SE_MARGIN
      const reducedDepth = (depth - 1) >> 1
      const singularScore = this.alphaBeta(reducedDepth, singularBeta - 1, singularBeta, prevMove, ply, ttMove)
      if (singularScore < singularBeta) return 1
    }
    return 0
  }

  _searchMoves (moves, depth, alpha, beta, ply, prevMove, excludedMove, ttMove, inCheck, extension, singularExtension) {
    this.orderMoves(moves, ttMove, depth, prevMove)

    let flag = TT_FLAG.UPPERBOUND
    let bestScore = -Infinity
    let bestMove = null
    let movesSearched = 0

    for (const move of moves) {
      if (excludedMove && this._isSameMove(move, excludedMove)) continue
      if (this._shouldPruneMove(move, depth, movesSearched, inCheck)) continue

      let debugNode = null
      let prevDebugNode = null
      if (this.debugMode) {
        debugNode = {
          move: this.moveToString(move),
          score: null,
          children: [],
          alpha,
          beta,
          depth
        }
        this.currentDebugNode.children.push(debugNode)
        prevDebugNode = this.currentDebugNode
        this.currentDebugNode = debugNode
      }

      this._pushAccumulator(move)
      const score = this._pvs(move, depth, alpha, beta, ply, movesSearched, inCheck, extension, singularExtension, ttMove)
      this._popAccumulator()

      if (this.debugMode && debugNode) {
        debugNode.score = score
        this.currentDebugNode = prevDebugNode
      }

      movesSearched++

      if (this.stopFlag) return alpha

      if (score >= beta) {
        this.tt.save(this.board.zobristKey, score, depth, TT_FLAG.LOWERBOUND, move)
        this._updateHeuristics(move, prevMove, depth)
        return beta
      }
      if (score > bestScore) {
        bestScore = score
        bestMove = move
        if (score > alpha) {
          alpha = score
          flag = TT_FLAG.EXACT
        }
      }
    }

    this.tt.save(this.board.zobristKey, bestScore, depth, flag, bestMove)
    return alpha
  }

  _isSameMove (m1, m2) {
    return m1.from === m2.from && m1.to === m2.to && m1.promotion === m2.promotion
  }

  _shouldPruneMove (move, depth, movesSearched, inCheck) {
    if (depth <= 3 && movesSearched >= (3 + depth * depth) && !inCheck) {
      if (!move.flags.includes('c') && !move.flags.includes('p') && !move.flags.includes('k') && !move.flags.includes('q')) {
        return true
      }
    }
    return false
  }

  _pvs (move, depth, alpha, beta, ply, movesSearched, inCheck, extension, singularExtension, ttMove) {
    const state = this.board.applyMove(move)

    let currentExtension = extension
    currentExtension = Math.max(currentExtension, this._getPassedPawnExtension(move))
    if (ttMove && this._isSameMove(move, ttMove)) {
      currentExtension += singularExtension
    }

    const nextDepth = depth + currentExtension - 1
    let score

    if (movesSearched === 0) {
      score = -this.alphaBeta(nextDepth, -beta, -alpha, move, ply + 1, null)
    } else {
      const reduction = this._calculateLMR(depth, movesSearched, move, inCheck, extension)
      let lmrDepth = nextDepth - reduction
      if (lmrDepth < 0) lmrDepth = 0

      score = -this.alphaBeta(lmrDepth, -alpha - 1, -alpha, move, ply + 1, null)

      if (reduction > 0 && score > alpha) {
        score = -this.alphaBeta(nextDepth, -alpha - 1, -alpha, move, ply + 1, null)
      }

      if (score > alpha && score < beta) {
        score = -this.alphaBeta(nextDepth, -beta, -alpha, move, ply + 1, null)
      }
    }

    this.board.undoApplyMove(move, state)
    return score
  }

  _calculateLMR (depth, movesSearched, move, inCheck, extension) {
    const isQuiet = !move.flags.includes('c') && !move.flags.includes('p')
    if (depth >= 3 && movesSearched > 1 && isQuiet && !inCheck) {
      const R = Math.floor(0.75 + (Math.log(depth) * Math.log(movesSearched)) / 2.25)
      let reduction = Math.max(0, R)
      const maxReduction = depth - 2 + extension
      return Math.min(reduction, maxReduction)
    }
    return 0
  }

  _pushAccumulator (move) {
    if (this.options.UCI_UseNNUE && this.nnue && this.nnue.network) {
      const newAccumulator = this.accumulatorStack[this.accumulatorStack.length - 1].clone()
      const capturedPiece = this._getCapturedPiece(move)
      const changes = this.nnue.getChangedIndices(this.board, move, capturedPiece)
      if (changes[move.piece.color].refresh) {
        const tempBoard = this.board.clone()
        tempBoard.applyMove(move)
        this.nnue.refreshAccumulator(newAccumulator, tempBoard)
      } else {
        this.nnue.updateAccumulator(newAccumulator, changes)
      }
      this.accumulatorStack.push(newAccumulator)
    }
  }

  _popAccumulator () {
    if (this.options.UCI_UseNNUE && this.nnue && this.nnue.network) {
      this.accumulatorStack.pop()
    }
  }

  _updateHeuristics (move, prevMove, depth) {
    if (!move.flags.includes('c')) {
      this.heuristics.storeKiller(depth, move)
      if (this.options.UseHistory) {
        this.heuristics.addHistoryScore(this.board.activeColor, move.from, move.to, depth)
      }
      if (prevMove) {
        this.heuristics.storeCounterMove(this.board.activeColor, prevMove.from, prevMove.to, move)
      }
    } else {
      if (this.options.UseCaptureHistory) {
        const cap = this._getCapturedPiece(move)
        if (cap) {
          this.heuristics.addCaptureHistory(move.piece.type, move.to, cap.type, depth)
        }
      }
    }
  }

  _getCapturedPiece (move) {
    if (move.flags.includes('e')) {
      const captureSq = move.to + (move.piece.color === 'white' ? 16 : -16)
      return this.board.getPiece(captureSq)
    }
    return this.board.getPiece(move.to)
  }

  orderMoves (moves, ttMove, depth = 0, prevMove = null) {
    MoveSorter.sort(moves, this.board, ttMove, depth, prevMove, this.heuristics, this.options)
  }

  /**
   * Quiescence search to settle tactical possibilities (captures, promotions).
   * @param {number} alpha - The lower bound score.
   * @param {number} beta - The upper bound score.
   * @returns {number} The score of the position.
   */
  quiescence (alpha, beta) {
    return Quiescence(this, alpha, beta)
  }

  moveToString (move) {
    const { row: fromRow, col: fromCol } = this.board.toRowCol(move.from)
    const { row: toRow, col: toCol } = this.board.toRowCol(move.to)
    const fromAlg = `${String.fromCharCode('a'.charCodeAt(0) + fromCol)}${8 - fromRow}`
    const toAlg = `${String.fromCharCode('a'.charCodeAt(0) + toCol)}${8 - toRow}`
    const promo = move.promotion ? move.promotion : ''
    return `${fromAlg}${toAlg}${promo}`
  }

  getPVLine (board, depth, firstMove) {
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
        const entry = this.tt.probe(board.zobristKey)
        if (!entry || !entry.move) break

        const move = entry.move

        // Validate legality
        const legalMoves = board.generateMoves()
        const realMove = legalMoves.find(m => m.from === move.from && m.to === move.to && m.promotion === move.promotion)

        if (!realMove) break

        pv.push(realMove)
        const state = board.applyMove(realMove)
        movesMade.push({ move: realMove, state })

        if (seenKeys.has(board.zobristKey)) break // Loop detection
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

  getPV (board, depth) {
    // Wrapper for backward compatibility / debug check
    return this.getPVLine(board, depth, null)
  }

  checkPV (pv) {
    // Verify that the PV moves are pseudo-legal (or fully legal) in sequence
    // We need to clone board or make/unmake.
    // Since this function is called at end of search, we can use `this.board`?
    // YES, `search` finishes, board is at root.

    const movesMade = []
    let valid = true

    for (const move of pv) {
      const legalMoves = this.board.generateMoves()
      const isLegal = legalMoves.some(m => m.from === move.from && m.to === move.to && m.promotion === move.promotion)

      if (!isLegal) {
        console.error(`PV Consistency Error: Illegal move ${this.moveToString(move)}`)
        valid = false
        break
      }

      // Apply move to verify next one
      // We need the full move object from generateMoves to apply it correctly (flags etc)
      const realMove = legalMoves.find(m => m.from === move.from && m.to === move.to && m.promotion === move.promotion)
      const state = this.board.applyMove(realMove)
      movesMade.push({ move: realMove, state })
    }

    // Undo all
    while (movesMade.length > 0) {
      const { move, state } = movesMade.pop()
      this.board.undoApplyMove(move, state)
    }

    if (!valid) {
      throw new Error('PV Consistency Check Failed')
    }
  }
}

module.exports = Search
