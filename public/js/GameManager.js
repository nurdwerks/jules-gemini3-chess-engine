/* eslint-env browser */
/* global SoundManager, GraphManager */

window.GameManager = class GameManager {
  constructor (game, socketHandler, callbacks) {
    this.game = game
    this.socketHandler = socketHandler
    this.callbacks = callbacks || {}

    // Game State
    this.gameStarted = false
    this.gameMode = 'pve' // pve, pvp, guess, vote
    this.isSelfPlay = false
    this.isDuelActive = false
    this.isArmageddon = false
    this.startingFen = 'startpos'
    this.currentViewIndex = -1 // -1 means live

    // Clock
    this.whiteTime = 300000
    this.blackTime = 300000
    this.whiteIncrement = 0
    this.blackIncrement = 0
    this.clockInterval = null
    this.lastFrameTime = 0
    this.moveStartTime = 0

    // History Stats
    this.evalHistory = []
    this.materialHistory = []
    this.timeHistory = []
    this.npsHistory = []
    this.tensionHistory = []
    this.moveMetadata = [] // { comment, nag, annotation } per move

    // Engine Configs
    this.engineAConfig = { name: 'Engine A', elo: 1500, limitStrength: true }
    this.engineBConfig = { name: 'Engine B', elo: 2000, limitStrength: true }

    // Misc
    this.premove = null
    this.pendingConfirmationMove = null
    this.lastEngineEval = 0
  }

  startNewGame (fen = 'startpos', timeBase = 5, timeInc = 0) {
    this.game.reset()
    this.startingFen = fen

    if (this.startingFen === 'startpos') {
      this.game.reset()
    } else {
      const valid = this.game.load(this.startingFen)
      if (!valid) {
        this.startingFen = 'startpos'
        this.game.reset()
      }
    }

    this.whiteTime = timeBase * 60 * 1000
    this.blackTime = timeBase * 60 * 1000
    this.whiteIncrement = timeInc * 1000
    this.blackIncrement = timeInc * 1000

    this.isSelfPlay = false
    this.isDuelActive = false
    this.isArmageddon = false
    this.gameStarted = true
    this.currentViewIndex = -1
    this.premove = null
    this.pendingConfirmationMove = null

    this._resetStats()

    // Clock starts lazily on first move or whenever performMove is called
    // this.startClock()

    if (this.callbacks.onGameStart) this.callbacks.onGameStart()

    // Send ucinewgame
    this.socketHandler.send('ucinewgame')
  }

  _resetStats () {
    this.evalHistory = []
    this.materialHistory = []
    this.timeHistory = []
    this.npsHistory = []
    this.tensionHistory = []
    this.moveMetadata = []
    if (GraphManager) {
      GraphManager.renderEvalGraph([])
      GraphManager.renderMaterialGraph([])
      GraphManager.renderTimeGraph([])
      GraphManager.renderTensionGraph([])
      GraphManager.renderNpsGraph([])
    }
  }

  startClock () {
    if (this.clockInterval) clearInterval(this.clockInterval)
    this.lastFrameTime = Date.now()
    this.moveStartTime = Date.now()
    this.clockInterval = setInterval(() => {
      this._updateClock()
    }, 100)
  }

  _updateClock () {
    if (this.game.game_over() || !this.gameStarted) return

    const now = Date.now()
    const delta = now - this.lastFrameTime
    this.lastFrameTime = now

    const color = this.game.turn() === 'w' ? 'white' : 'black'
    this._updatePlayerClock(color, delta)

    if (this.callbacks.onClockUpdate) this.callbacks.onClockUpdate()

    if (this.whiteTime <= 0 || this.blackTime <= 0) {
      this.checkGameOver()
    }
  }

  _updatePlayerClock (color, delta) {
    if (color === 'white') {
      const prev = this.whiteTime
      this.whiteTime = Math.max(0, this.whiteTime - delta)
      this._checkSound(prev, this.whiteTime)
    } else {
      const prev = this.blackTime
      this.blackTime = Math.max(0, this.blackTime - delta)
      this._checkSound(prev, this.blackTime)
    }
  }

  _checkSound (prev, current) {
    if (current < 10000 && Math.floor(prev / 1000) !== Math.floor(current / 1000)) {
      if (SoundManager) SoundManager.playTick()
    }
  }

  checkGameOver () {
    let outcome = null
    if (this.whiteTime <= 0) {
      outcome = { winner: 'black', reason: 'Timeout (White)' }
    } else if (this.blackTime <= 0) {
      outcome = { winner: 'white', reason: 'Timeout (Black)' }
    } else if (this.game.game_over()) {
      outcome = this._handleGameRulesEnd()
    }

    if (outcome) {
      if (this.callbacks.onGameOver) this.callbacks.onGameOver(outcome)
      this.gameStarted = false
      if (this.clockInterval) clearInterval(this.clockInterval)
      this.isSelfPlay = false
    }
  }

  _handleGameRulesEnd () {
    if (this.game.in_checkmate()) {
      return { winner: this.game.turn() === 'w' ? 'black' : 'white', reason: 'Checkmate' }
    } else if (this.game.in_draw()) {
      let reason = 'Draw'
      if (this.game.in_stalemate()) reason = 'Stalemate'
      else if (this.game.in_threefold_repetition()) reason = 'Repetition'
      else if (this.game.insufficient_material()) reason = 'Insufficient Material'
      else reason = '50-Move Rule'

      if (this.isArmageddon) return { winner: 'black', reason: `Armageddon (${reason})` }
      return { winner: 'draw', reason }
    }
    return { winner: 'draw', reason: 'Unknown' }
  }

  performMove (moveObj, isHuman = false) {
    if (!this.clockInterval && this.gameStarted) {
      this.startClock()
    }

    // moveObj: { from, to, promotion }
    // Sync metadata with current history length (truncate if we undid)
    const currentPly = this.game.history().length
    if (this.moveMetadata.length > currentPly) {
      this.moveMetadata = this.moveMetadata.slice(0, currentPly)
    }

    const result = this.game.move(moveObj)
    if (result) {
      // Add metadata for new move
      this.moveMetadata.push({ comment: '', nag: '', annotation: '' })

      if (SoundManager) SoundManager.playSound(result, this.game)

      // Time Increment
      if (result.color === 'w') this.whiteTime += this.whiteIncrement
      else this.blackTime += this.blackIncrement

      // Stats
      const now = Date.now()
      const timeTaken = now - this.moveStartTime
      this.moveStartTime = now
      this.timeHistory.push({ ply: this.game.history().length, time: timeTaken })
      if (GraphManager) GraphManager.renderTimeGraph(this.timeHistory)

      this._updateTensionHistory()
      this._updateMaterialHistory()

      this.currentViewIndex = -1
      if (this.callbacks.onMove) this.callbacks.onMove(result)

      this.checkGameOver()
    }
    return result
  }

  undo () {
    this.game.undo()
    this.currentViewIndex = -1
    if (this.callbacks.onMove) this.callbacks.onMove(null) // Refresh
  }

  _updateTensionHistory () {
    // Simply count captures/checks available
    const moves = this.game.moves({ verbose: true })
    const count = moves.filter(m => m.flags.includes('c') || m.flags.includes('e')).length
    this.tensionHistory.push({ ply: this.game.history().length, value: count })
    if (GraphManager) GraphManager.renderTensionGraph(this.tensionHistory)
  }

  _updateMaterialHistory () {
    // Calculate material
    // Simplification: Iterate board
    const board = this.game.board()
    let wMat = 0
    let bMat = 0
    const val = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c]
        if (p) {
          if (p.color === 'w') wMat += val[p.type]
          else bMat += val[p.type]
        }
      }
    }
    this.materialHistory.push({ ply: this.game.history().length, w: wMat, b: bMat })
    if (GraphManager) GraphManager.renderMaterialGraph(this.materialHistory)
  }

  sendPositionAndGo (isAnalysisMode = false, isAnalyzing = false) {
    let cmd = 'position '
    if (this.startingFen === 'startpos') {
      cmd += 'startpos'
    } else {
      cmd += `fen ${this.startingFen}`
    }

    const history = this.game.history({ verbose: true })
    if (history.length > 0) {
      const uciMoves = history.map(m => {
        let uci = m.from + m.to
        if (m.promotion) uci += m.promotion
        return uci
      })
      cmd += ` moves ${uciMoves.join(' ')}`
    }

    if (isAnalysisMode) {
      // Handled by AnalysisManager or caller usually, but if here:
      if (isAnalyzing) {
        this.socketHandler.send('stop')
        // Caller handles re-sending go infinite
      } else {
        this.socketHandler.send(cmd)
        this.socketHandler.send('go infinite')
      }
    } else {
      this.socketHandler.send(cmd)
      this.socketHandler.send(`go wtime ${Math.floor(this.whiteTime)} btime ${Math.floor(this.blackTime)} winc ${Math.floor(this.whiteIncrement)} binc ${Math.floor(this.blackIncrement)}`)
    }
    return cmd // Return for reference
  }
}
