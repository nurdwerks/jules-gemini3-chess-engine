const Evaluation = require('./Evaluation')
const { TranspositionTable, TT_FLAG } = require('./TranspositionTable')
const { Accumulator } = require('./NNUE')
const Syzygy = require('./Syzygy')
const SearchHeuristics = require('./SearchHeuristics')
const MoveSorter = require('./MoveSorter')
const Quiescence = require('./Quiescence')
const SearchPruning = require('./SearchPruning')
const StrengthLimiter = require('./StrengthLimiter')
const SearchUtils = require('./SearchUtils')
const SearchDebug = require('./SearchDebug')

class Search {
  constructor (board, tt = null, nnue = null) {
    this.board = board
    this.nnue = nnue
    this.nodes = 0
    this.tt = tt || new TranspositionTable(64)
    this.timer = null
    this.stopFlag = false
    this.accumulatorStack = []
    this.syzygy = new Syzygy()
    this.heuristics = new SearchHeuristics()
    this.stats = { nodes: 0, pruning: { nullMove: 0, futility: 0, probCut: 0 } }
  }

  resetSearchState (options, timeLimits) {
    this.options = options
    this.stopSignal = options.stopSignal || null
    this.isStable = false
    this.timeLimits = typeof timeLimits === 'number' ? { hardLimit: timeLimits, softLimit: timeLimits } : timeLimits
    this.startTime = Date.now()
    this.stopFlag = false
    this.nodes = 0
    this._initNNUE()
    this._initMaxNodes(options)

    this.debugMode = options.debug || false
    this.debugTree = { depth: 0, nodes: [] }
    this.debugFile = options.debugFile || 'search_tree.json'
    this.currentDebugNode = this.debugTree
    this.heuristics.clearKillers()
    this.heuristics.ageHistory()
    this.bestMove = null
    this.bestScore = -Infinity
    this.persistentBestMove = null
    this.lastBestMove = null
    this.stableMoveCount = 0
  }

  _initNNUE () {
    if (this.options.UCI_UseNNUE && this.nnue && this.nnue.network) {
      this.accumulatorStack = [new Accumulator()]
      this.nnue.refreshAccumulator(this.accumulatorStack[0], this.board)
    }
  }

  _initMaxNodes (options) {
    this.maxNodes = Infinity
    if (options.nodes) {
      this.maxNodes = options.nodes
    } else if (options.UCI_LimitStrength && options.UCI_Elo) {
      this.maxNodes = StrengthLimiter.getNodesForElo(options.UCI_Elo)
    }
  }

  checkLimits () {
    if (this.stopSignal && Atomics.load(this.stopSignal, 0) === 1) {
      this.stopFlag = true
      return true
    }
    if (this.nodes >= this.maxNodes) {
      this.stopFlag = true
      return true
    }
    if ((this.nodes & 2047) !== 0) return false
    if (this.timeLimits.hardLimit !== Infinity) {
      if (Date.now() - this.startTime >= this.timeLimits.hardLimit) {
        this.stopFlag = true
        return true
      }
    }
    return false
  }

  search (maxDepth = 5, timeLimits = { hardLimit: 1000, softLimit: 1000 }, options = {}, timeManager = null) {
    this.resetSearchState(options, timeLimits)
    const multiPV = options.MultiPV || 1
    for (let depth = 1; depth <= maxDepth; depth++) {
      if (this.debugMode) {
        this.debugTree.nodes = []
        this.debugTree.iteration = depth
      }
      this.searchIteration(depth, multiPV)
      this.checkTimeSoftLimit(depth, timeManager)
      if (this.bestMove) this.persistentBestMove = this.bestMove
      if (this.stopFlag) break
      StrengthLimiter.injectError(this)
      SearchDebug.writeDebugTree(this)
      SearchDebug.verifyPV(this, depth)
    }
    if (this.debugMode) console.log(`Search Stats: Nodes=${this.nodes} NullMove=${this.stats.pruning.nullMove}`)
    return this.persistentBestMove || this.bestMove
  }

  searchIteration (depth, multiPV) {
    const excludedMoves = []
    for (let pvIdx = 0; pvIdx < multiPV; pvIdx++) {
      if (this._runPVIteration(depth, pvIdx, excludedMoves)) break
    }
  }

  _runPVIteration (depth, pvIdx, excludedMoves) {
    const { alpha, beta } = this._getAspirationWindow(depth, pvIdx)
    const result = this.runAspirationSearch(depth, alpha, beta, excludedMoves)
    if (this.stopFlag) {
      if (pvIdx === 0 && result && result.move) this.bestMove = result.move
      return true
    }
    if (!result || !result.move) return true
    this._handleIterationResult(depth, pvIdx, result, excludedMoves)
    return false
  }

  _getAspirationWindow (depth, pvIdx) {
    let alpha = -Infinity
    let beta = Infinity
    const windowSize = this.options.AspirationWindow || 50
    if (depth > 1 && pvIdx === 0) {
      alpha = this.bestScore - windowSize
      beta = this.bestScore + windowSize
    }
    return { alpha, beta }
  }

  _handleIterationResult (depth, pvIdx, result, excludedMoves) {
    if (pvIdx === 0) {
      this.bestMove = result.move
      this.bestScore = result.score
    }
    this.reportPV(depth, pvIdx, result.score, result.move)
    excludedMoves.push(result.move)
  }

  runAspirationSearch (depth, alpha, beta, excludedMoves) {
    let result = null
    while (true) {
      result = this.rootAlphaBeta(depth, alpha, beta, excludedMoves)
      if (this.stopFlag) break
      if (!result || result.score === null) break
      if (result.score <= alpha) {
        if (alpha === -Infinity) break
        alpha = -Infinity
        continue
      }
      if (result.score >= beta) {
        if (beta === Infinity) break
        beta = Infinity
        continue
      }
      break
    }
    return result
  }

  reportPV (depth, pvIdx, score, move) {
    if (this.options.onInfo) {
      const elapsed = Date.now() - this.startTime
      const nps = elapsed > 0 ? Math.floor(this.nodes / (elapsed / 1000)) : 0
      const hashFull = this.tt.getHashFull()
      const pvLine = SearchUtils.getPVLine(this.board, this.tt, depth, move)
      const pvString = pvLine.map(m => SearchUtils.moveToString(this.board, m)).join(' ')
      let scoreString = `cp ${score}`
      if (Math.abs(score) > 10000) {
        const mateIn = Math.ceil((20000 - Math.abs(score)) / 2) * (score > 0 ? 1 : -1)
        scoreString = `mate ${mateIn}`
      }
      this.options.onInfo(`depth ${depth} multipv ${pvIdx + 1} score ${scoreString} nodes ${this.nodes} nps ${nps} hashfull ${hashFull} time ${elapsed} pv ${pvString}`)
    }
  }

  checkTimeSoftLimit (depth, timeManager) {
    this.checkLimits()
    if (this.timeLimits.softLimit === Infinity || this.stopFlag) return

    const elapsed = Date.now() - this.startTime
    let limit = this.timeLimits.softLimit
    this.updateStability()

    if (this._shouldExtendSoftLimit(depth)) {
      limit = Math.min(this.timeLimits.hardLimit, limit * 2)
      this.isStable = false
    }

    if (timeManager) {
      if (timeManager.shouldStop(elapsed, limit, this.isStable)) this.stopFlag = true
    } else {
      if ((elapsed >= limit && this.isStable) || elapsed >= this.timeLimits.hardLimit) this.stopFlag = true
    }
  }

  _shouldExtendSoftLimit (depth) {
    const newEntry = this.tt.probe(this.board.zobristKey)
    const currentScore = newEntry && newEntry.depth === depth ? newEntry.score : -Infinity
    if (depth > 1 && this.bestScore > -10000 && currentScore > -10000) {
      if (this.bestScore - currentScore > 60) {
        return true
      }
    }
    return false
  }

  updateStability () {
    if (this.lastBestMove && this.bestMove && this.lastBestMove.from === this.bestMove.from && this.lastBestMove.to === this.bestMove.to) {
      this.stableMoveCount++
    } else {
      this.stableMoveCount = 0
    }
    this.lastBestMove = this.bestMove
    this.isStable = this.stableMoveCount >= 2
  }

  rootAlphaBeta (depth, alpha, beta, excludedMoves = []) {
    const ttEntry = this.tt.probe(this.board.zobristKey)
    const ttMove = ttEntry ? ttEntry.move : null
    const moves = this._getFilteredRootMoves(excludedMoves)

    if (moves.length === 0) return { move: null, score: -Infinity }

    this.orderMoves(moves, ttMove, depth, null)

    return this._searchRootMoves(moves, depth, alpha, beta, excludedMoves)
  }

  _getFilteredRootMoves (excludedMoves) {
    let moves = this.board.generateMoves()
    if (moves.length === 0) return []

    if (excludedMoves && excludedMoves.length > 0) {
      moves = moves.filter(m => !excludedMoves.some(em => em.from === m.from && em.to === m.to && em.promotion === m.promotion))
    }
    if (moves.length === 0) return []

    if (this.options.searchMoves && this.options.searchMoves.length > 0) {
      moves = moves.filter(m => this.options.searchMoves.includes(SearchUtils.moveToString(this.board, m)))
    }
    return moves
  }

  _searchRootMoves (moves, depth, alpha, beta, excludedMoves) {
    let bestMove = null
    let bestScore = -Infinity

    for (const move of moves) {
      if (this.checkLimits()) return { move: bestMove, score: bestScore }
      const score = this.searchRootMove(move, depth, alpha, beta)
      if (this.stopFlag) return { move: bestMove, score: bestScore }
      if (score > bestScore) {
        bestScore = score
        bestMove = move
      }
      if (score > alpha) alpha = score
    }

    if (!this.stopFlag && bestMove && (!excludedMoves || excludedMoves.length === 0)) {
      this.tt.save(this.board.zobristKey, bestScore, depth, TT_FLAG.EXACT, bestMove)
    }
    return { move: bestMove, score: bestScore }
  }

  searchRootMove (move, depth, alpha, beta) {
    let extension = this._getPassedPawnExtension(move)
    const state = this.board.applyMove(move)
    if (this.board.isInCheck()) extension = Math.max(extension, 1)

    const { debugNode, prevDebugNode } = SearchDebug.startRootMoveDebug(this, move, alpha, beta, depth)

    const score = -this.alphaBeta(depth - 1 + extension, -beta, -alpha, move, 1, null)
    this.board.undoApplyMove(move, state)

    SearchDebug.endMoveDebug(this, debugNode, prevDebugNode, score)

    return score
  }

  _getPassedPawnExtension (move) {
    if (move.piece.type === 'pawn') {
      const toRow = move.to >> 4
      const color = move.piece.color
      if ((color === 'white' && toRow <= 2) || (color === 'black' && toRow >= 5)) {
        if (Evaluation.isPassedPawn(this.board, move.from)) return 1
      }
    }
    return 0
  }

  probeTT (depth, alpha, beta) {
    const entry = this.tt.probe(this.board.zobristKey)
    if (!entry) return { ttMove: null, ttScore: null }
    let score = null
    if (entry.depth >= depth) {
      if (entry.flag === TT_FLAG.EXACT) score = entry.score
      else if (entry.flag === TT_FLAG.LOWERBOUND && entry.score >= beta) score = entry.score
      else if (entry.flag === TT_FLAG.UPPERBOUND && entry.score <= alpha) score = entry.score
    }
    return { ttMove: entry.move, ttScore: score }
  }

  getStaticEval () {
    const currentAccumulator = this.accumulatorStack.length > 0 ? this.accumulatorStack[this.accumulatorStack.length - 1] : null
    return (this.options.UCI_UseNNUE && this.nnue && this.nnue.network)
      ? this.nnue.evaluate(this.board, currentAccumulator)
      : Evaluation.evaluate(this.board)
  }

  alphaBeta (depth, alpha, beta, prevMove = null, ply = 0, excludedMove = null) {
    if (this._shouldStopSearch()) return alpha

    const { alpha: newAlpha, beta: newBeta, returnAlpha } = this._adjustMateScore(alpha, beta, ply)
    if (returnAlpha) return newAlpha
    alpha = newAlpha; beta = newBeta

    if (this._isDraw(ply)) return -(this.options.Contempt || 0)

    const inCheck = this.board.isInCheck()
    const nm = this._tryNullMove(depth, beta, inCheck, ply)
    if (nm === 'STOP') return alpha
    if (nm !== null) return nm

    return this._alphaBetaBody(depth, alpha, beta, prevMove, ply, excludedMove, inCheck)
  }

  _shouldStopSearch () {
    this.nodes++
    return this.stopFlag || (this.checkLimits && this.checkLimits())
  }

  _alphaBetaBody (depth, alpha, beta, prevMove, ply, excludedMove, inCheck) {
    const { ttMove, ttScore } = this.probeTT(depth, alpha, beta)
    if (ttScore !== null && !excludedMove) return ttScore

    this._performIID(depth, ttMove, alpha, beta, prevMove, ply, excludedMove)

    const pruning = this.applyPruning(depth, alpha, beta, this.getStaticEval(), inCheck, prevMove, ply)
    if (pruning !== null) return pruning

    const singularExtension = this.checkSingularExtension(depth, ttMove, excludedMove, ply, prevMove)

    return this._generateAndSearch(depth, alpha, beta, ply, inCheck, singularExtension, excludedMove, prevMove, ttMove)
  }

  _generateAndSearch (depth, alpha, beta, ply, inCheck, singularExtension, excludedMove, prevMove, ttMove) {
    const moves = this.board.generateMoves()
    if (moves.length === 0) return inCheck ? -20000 + ply : 0
    if (depth === 0) return this.quiescence(alpha, beta)

    this.orderMoves(moves, ttMove, depth, prevMove)
    return this.searchMoves(moves, depth, alpha, beta, ply, inCheck, singularExtension, excludedMove, prevMove, ttMove)
  }

  _performIID (depth, ttMove, alpha, beta, prevMove, ply, excludedMove) {
    if (depth > 3 && !ttMove) this.alphaBeta(depth - 2, alpha, beta, prevMove, ply, excludedMove)
  }

  _adjustMateScore (alpha, beta, ply) {
    const mateScore = 20000 - ply
    if (alpha < mateScore - 1) alpha = Math.max(alpha, -mateScore)
    if (beta > mateScore) beta = Math.min(beta, mateScore)
    if (alpha >= beta) return { alpha, beta, returnAlpha: true }
    return { alpha, beta, returnAlpha: false }
  }

  _tryNullMove (depth, beta, inCheck, ply) {
    if (!inCheck) {
      return SearchPruning.tryNullMovePruning(this, depth, beta, inCheck, ply)
    }
    return null
  }

  _isDraw (ply) {
    return this.board.isDrawBy50Moves() || this.board.isDrawByRepetition()
  }

  checkSingularExtension (depth, ttMove, excludedMove, ply, prevMove) {
    if (!excludedMove && depth >= 8 && ttMove) {
      const entry = this.tt.probe(this.board.zobristKey)
      if (entry && entry.depth >= depth - 3 && entry.flag !== TT_FLAG.UPPERBOUND && Math.abs(entry.score) < 10000) {
        const singularBeta = entry.score - 2 * depth
        if (this.alphaBeta((depth - 1) >> 1, singularBeta - 1, singularBeta, prevMove, ply, ttMove) < singularBeta) {
          return 1
        }
      }
    }
    return 0
  }

  searchMoves (moves, depth, alpha, beta, ply, inCheck, singularExtension, excludedMove, prevMove, ttMove) {
    let bestScore = -Infinity
    let bestMove = null
    let flag = TT_FLAG.UPPERBOUND
    let movesSearched = 0

    for (const move of moves) {
      if (excludedMove && SearchUtils.isSameMove(move, excludedMove)) continue
      if (this.shouldPruneLateMove(depth, movesSearched, inCheck, move)) continue

      const score = this.searchMove(move, depth, alpha, beta, ply, inCheck, singularExtension, movesSearched, ttMove)
      movesSearched++

      if (this.stopFlag) return alpha

      const result = this._processSearchMoveResult(score, alpha, beta, move, depth, prevMove, bestScore, bestMove, flag)
      if (result.cutoff) return beta

      bestScore = result.bestScore
      bestMove = result.bestMove
      alpha = result.alpha
      flag = result.flag
    }
    this.tt.save(this.board.zobristKey, bestScore, depth, flag, bestMove)
    return alpha
  }

  _processSearchMoveResult (score, alpha, beta, move, depth, prevMove, bestScore, bestMove, flag) {
    if (score >= beta) {
      this.tt.save(this.board.zobristKey, score, depth, TT_FLAG.LOWERBOUND, move)
      this.updateHeuristics(move, depth, prevMove, this.board.getPiece(move.to))
      return { cutoff: true }
    }

    if (score > bestScore) {
      bestScore = score
      bestMove = move
      if (score > alpha) {
        alpha = score
        flag = TT_FLAG.EXACT
      }
    }

    if (score <= alpha && this.options.UseHistory) {
      const isQuiet = !move.flags.includes('c') && !move.flags.includes('p')
      if (isQuiet) {
        this.heuristics.subtractHistoryScore(this.board.activeColor, move.from, move.to, depth)
      }
    }

    return { cutoff: false, bestScore, bestMove, alpha, flag }
  }

  updateHeuristics (move, depth, prevMove, capturedPiece) {
    const isCapture = move.flags.includes('c')
    if (!isCapture) {
      this.heuristics.storeKiller(depth, move)
      if (this.options.UseHistory) this.heuristics.addHistoryScore(this.board.activeColor, move.from, move.to, depth)
      if (prevMove) this.heuristics.storeCounterMove(this.board.activeColor, prevMove.from, prevMove.to, move)
    } else {
      if (this.options.UseCaptureHistory && capturedPiece) {
        this.heuristics.addCaptureHistory(move.piece.type, move.to, capturedPiece.type, depth)
      }
    }
  }

  searchMove (move, depth, alpha, beta, ply, inCheck, singularExtension, movesSearched, ttMove) {
    const { debugNode, prevDebugNode } = SearchDebug.startMoveDebug(this, move, depth, alpha, beta)

    const state = this.board.applyMove(move)
    this.updateNNUE(move, state.capturedPiece)

    const extension = this.calculateExtension(move, inCheck, singularExtension, ttMove)
    const reduction = this.calculateReduction(depth, movesSearched, move, inCheck, extension)
    const score = this.executePVS(depth, alpha, beta, ply, move, extension, reduction, movesSearched)

    this.restoreNNUE()
    this.board.undoApplyMove(move, state)

    SearchDebug.endMoveDebug(this, debugNode, prevDebugNode, score)

    return score
  }

  updateNNUE (move, capturedPiece) {
    if (this.options.UCI_UseNNUE && this.nnue && this.nnue.network) {
      const newAccumulator = this.accumulatorStack[this.accumulatorStack.length - 1].clone()
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

  restoreNNUE () {
    if (this.options.UCI_UseNNUE && this.nnue && this.nnue.network) {
      this.accumulatorStack.pop()
    }
  }

  calculateExtension (move, inCheck, singularExtension, ttMove) {
    let extension = inCheck ? 1 : 0
    extension = Math.max(extension, this._getPassedPawnExtension(move))
    if (singularExtension > 0 && ttMove && SearchUtils.isSameMove(move, ttMove)) {
      extension += singularExtension
    }
    return extension
  }

  calculateReduction (depth, movesSearched, move, inCheck, extension) {
    const isQuiet = !move.flags.includes('c') && !move.flags.includes('p')
    if (depth >= 3 && movesSearched > 1 && isQuiet && !inCheck) {
      const R = Math.floor(0.75 + (Math.log(depth) * Math.log(movesSearched)) / 2.25)
      return Math.min(Math.max(0, R), depth - 2 + extension)
    }
    return 0
  }

  executePVS (depth, alpha, beta, ply, move, extension, reduction, movesSearched) {
    const nextDepth = depth + extension - 1
    let score
    if (movesSearched === 0) {
      score = -this.alphaBeta(nextDepth, -beta, -alpha, move, ply + 1, null)
    } else {
      const lmrDepth = Math.max(0, nextDepth - reduction)
      score = -this.alphaBeta(lmrDepth, -alpha - 1, -alpha, move, ply + 1, null)
      if (reduction > 0 && score > alpha) {
        score = -this.alphaBeta(nextDepth, -alpha - 1, -alpha, move, ply + 1, null)
      }
      if (score > alpha && score < beta) {
        score = -this.alphaBeta(nextDepth, -beta, -alpha, move, ply + 1, null)
      }
    }
    return score
  }

  applyPruning (depth, alpha, beta, staticEval, inCheck, prevMove, ply) {
    const razoringResult = SearchPruning.tryRazoring(this, depth, alpha, beta, staticEval, inCheck)
    if (razoringResult !== null) return razoringResult
    const futilityResult = SearchPruning.tryFutilityPruning(this, depth, alpha, staticEval, inCheck)
    if (futilityResult !== null) return futilityResult
    const probCutResult = SearchPruning.tryProbCut(this, depth, beta, inCheck, prevMove, ply)
    if (probCutResult !== null) return probCutResult
    return null
  }

  shouldPruneLateMove (depth, movesSearched, inCheck, move) {
    const isQuiet = !move.flags.includes('c') && !move.flags.includes('p') && !move.flags.includes('k') && !move.flags.includes('q')
    if (depth <= 3 && !inCheck && isQuiet) {
      if (movesSearched >= (3 + depth * depth)) return true
      if (this.options.UseHistory) {
        const hScore = this.heuristics.getHistoryScore(this.board.activeColor, move.from, move.to)
        if (hScore < -4000 * depth) return true
      }
    }
    return false
  }

  orderMoves (moves, ttMove, depth = 0, prevMove = null) {
    MoveSorter.sort(moves, this.board, ttMove, depth, prevMove, this.heuristics, this.options)
  }

  quiescence (alpha, beta) {
    return Quiescence(this, alpha, beta)
  }
}

module.exports = Search
