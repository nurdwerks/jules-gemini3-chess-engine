/* eslint-env browser */
/* global Chess */

window.AnalysisManager = class AnalysisManager {
  constructor (game, gameManager, socketHandler, callbacks) {
    this.game = game
    this.gameManager = gameManager
    this.socketHandler = socketHandler
    this.callbacks = callbacks || {}

    this.isFullAnalysis = false
    this.isAnalyzing = false
    this.analysisQueue = []
    this.analysisResults = []
    this.currentAnalysisInfo = {}
    this.startingFen = 'startpos'
  }

  startFullGameAnalysis (startingFen) {
    this.startingFen = startingFen || 'startpos'
    const history = this.game.history({ verbose: true })
    if (history.length === 0) {
      if (this.callbacks.onError) this.callbacks.onError('No game to analyze')
      return
    }

    this.isFullAnalysis = true
    this.analysisQueue = []
    this.analysisResults = []
    this.currentAnalysisInfo = {}

    const tempGame = new Chess()
    if (this.startingFen !== 'startpos') tempGame.load(this.startingFen)

    this.analysisQueue.push({
      fen: tempGame.fen(),
      playedMove: history[0],
      moveIndex: 1,
      san: history[0].san,
      turn: tempGame.turn()
    })

    for (let i = 0; i < history.length - 1; i++) {
      tempGame.move(history[i])
      this.analysisQueue.push({
        fen: tempGame.fen(),
        playedMove: history[i + 1],
        moveIndex: i + 2,
        san: history[i + 1].san,
        turn: tempGame.turn()
      })
    }

    if (this.callbacks.onStart) this.callbacks.onStart(this.analysisQueue.length)

    this.socketHandler.send('stop')
    this.socketHandler.send('setoption name MultiPV value 3')
    setTimeout(() => this._runNextAnalysis(), 100)
  }

  stopAnalysis () {
    this.isFullAnalysis = false
    this.socketHandler.send('setoption name MultiPV value 1')
  }

  handleInfo (info) {
    if (this.isFullAnalysis && info.score && info.pv) {
      const idx = info.multipv ? parseInt(info.multipv) : 1
      this.currentAnalysisInfo[idx] = {
        score: info.score,
        move: info.pv[0],
        pv: info.pv
      }
    }
  }

  handleBestMove () {
    if (this.isFullAnalysis) {
      this._processAnalysisStep()
    }
  }

  _runNextAnalysis () {
    if (!this.isFullAnalysis) return
    if (this.analysisQueue.length === 0) {
      this._finishAnalysis()
      return
    }

    const task = this.analysisQueue[0]
    this.currentAnalysisInfo = {}
    this.socketHandler.send(`position fen ${task.fen}`)
    this.socketHandler.send('go depth 12')
    this.isAnalyzing = true
  }

  _processAnalysisStep () {
    const task = this.analysisQueue.shift()
    if (!task) return

    const result = this._calculateAnalysisResult(task)
    this.analysisResults.push(result)

    if (this.callbacks.onStepComplete) {
      this.callbacks.onStepComplete(task, result, this.analysisResults.length, this.analysisResults.length + this.analysisQueue.length)
    }

    this._runNextAnalysis()
  }

  _calculateAnalysisResult (task) {
    const bestInfo = this.currentAnalysisInfo[1]
    const playedUCI = this._getPlayedUCI(task)
    const bestMoveUCI = bestInfo ? bestInfo.move : '?'
    const evalScore = bestInfo ? this._formatScore(bestInfo.score) : '?'

    const scores = this._getScores(playedUCI)
    const diff = scores.found ? (scores.bestScoreVal - scores.playedScoreVal) : '?'

    this._autoAnnotate(task, diff)

    return {
      move: task.moveIndex,
      san: task.san,
      played: playedUCI,
      best: bestMoveUCI,
      diff,
      eval: evalScore
    }
  }

  _getPlayedUCI (task) {
    let playedUCI = task.playedMove.from + task.playedMove.to
    if (task.playedMove.promotion) playedUCI += task.playedMove.promotion
    return playedUCI
  }

  _getScores (playedUCI) {
    const bestInfo = this.currentAnalysisInfo[1]
    let bestScoreVal = 0
    if (bestInfo && bestInfo.score) {
      bestScoreVal = this._scoreToValue(bestInfo.score)
    }

    let playedScoreVal = -99999
    let found = false

    Object.values(this.currentAnalysisInfo).forEach(info => {
      if (info.move === playedUCI) {
        playedScoreVal = this._scoreToValue(info.score)
        found = true
      }
    })
    return { bestScoreVal, playedScoreVal, found }
  }

  _scoreToValue (score) {
    return score.type === 'cp' ? score.value : (score.value > 0 ? 10000 : -10000)
  }

  _autoAnnotate (task, diff) {
    if (this.gameManager && typeof diff === 'number') {
      const moveIndex = task.moveIndex - 1
      while (this.gameManager.moveMetadata.length <= moveIndex) {
        this.gameManager.moveMetadata.push({})
      }
      const meta = this.gameManager.moveMetadata[moveIndex] || {}

      if (diff > 300) { meta.nag = '$4'; meta.annotation = '??' } else if (diff > 100) { meta.nag = '$2'; meta.annotation = '?' } else if (diff > 50) { meta.nag = '$6'; meta.annotation = '?!' }

      this.gameManager.moveMetadata[moveIndex] = meta
    }
  }

  _formatScore (score) {
    if (score.type === 'mate') {
      return '#' + score.value
    }
    const val = score.value / 100
    return (val > 0 ? '+' : '') + val.toFixed(2)
  }

  _finishAnalysis () {
    this.isFullAnalysis = false
    this.socketHandler.send('setoption name MultiPV value 1')
    if (this.callbacks.onComplete) this.callbacks.onComplete()
  }

  exportAnalysis () {
    return JSON.stringify(this.analysisResults, null, 2)
  }

  importAnalysis (json) {
    try {
      this.analysisResults = JSON.parse(json)
      if (this.callbacks.onStart) this.callbacks.onStart(this.analysisResults.length)
      this.analysisResults.forEach((res, i) => {
        const task = { moveIndex: res.move, san: res.san }
        if (this.callbacks.onStepComplete) {
          this.callbacks.onStepComplete(task, res, i + 1, this.analysisResults.length)
        }
      })
      if (this.callbacks.onComplete) this.callbacks.onComplete()
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }
}
