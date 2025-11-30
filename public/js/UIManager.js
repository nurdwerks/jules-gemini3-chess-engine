/* eslint-env browser */
/* global BoardInfoRenderer, UIOptionFactory, UIConstants */

window.UIManager = class UIManager {
  constructor (callbacks) {
    this.callbacks = callbacks || {}
    this.elements = this._cacheElements()
    this.boardInfoRenderer = new BoardInfoRenderer(this.elements)
    this.logHistory = []
    this._bindEvents()
  }

  _cacheElements () {
    return {
      status: document.getElementById('status'),
      engineOutput: document.getElementById('engine-output'),
      uciOptions: document.getElementById('uci-options'),
      uciPresetSelect: document.getElementById('uci-preset-select'),
      moveHistory: document.getElementById('move-history'),
      pvLines: document.getElementById('pv-lines'),
      systemLog: document.getElementById('system-log'),
      evalValue: document.getElementById('eval-value'),
      depthValue: document.getElementById('depth-value'),
      npsValue: document.getElementById('nps-value'),
      wdlValue: document.getElementById('wdl-value'),
      evalBarFill: document.getElementById('eval-bar-fill'),
      topPlayerName: document.getElementById('top-player-name'),
      topPlayerClock: document.getElementById('top-player-clock'),
      bottomPlayerName: document.getElementById('bottom-player-name'),
      bottomPlayerClock: document.getElementById('bottom-player-clock'),
      topCaptured: document.getElementById('top-captured-pieces'),
      bottomCaptured: document.getElementById('bottom-captured-pieces'),
      topMaterialDiff: document.getElementById('top-material-diff'),
      bottomMaterialDiff: document.getElementById('bottom-material-diff'),
      topMaterialBar: document.getElementById('top-material-bar'),
      bottomMaterialBar: document.getElementById('bottom-material-bar'),

      // Modals
      promotionModal: document.getElementById('promotion-modal'),
      pgnImportModal: document.getElementById('pgn-import-modal'),
      pgnSettingsModal: document.getElementById('pgn-settings-modal'),
      duelSetupModal: document.getElementById('duel-setup-modal'),
      leaderboardModal: document.getElementById('leaderboard-modal'),
      analysisReportModal: document.getElementById('analysis-report-modal'),
      importAnalysisFile: document.getElementById('import-analysis-file'),

      // Inputs
      fenInput: document.getElementById('fen-input'),
      pgnInputArea: document.getElementById('pgn-input-area'),
      pgnWhiteInput: document.getElementById('pgn-white'),
      pgnBlackInput: document.getElementById('pgn-black'),
      pgnEventInput: document.getElementById('pgn-event'),
      timeBaseInput: document.getElementById('time-base'),
      timeIncInput: document.getElementById('time-inc'),
      animationSpeedSelect: document.getElementById('animation-speed'),
      boardThemeSelect: document.getElementById('board-theme'),
      pieceSetSelect: document.getElementById('piece-set'),
      uiThemeSelect: document.getElementById('ui-theme'),

      // Panels
      memoryControls: document.getElementById('memory-training-controls'),
      tacticsControls: document.getElementById('tactics-controls'),
      endgameControls: document.getElementById('endgame-controls'),
      repertoireControls: document.getElementById('repertoire-controls'),
      piecePalette: document.getElementById('piece-palette'),
      analysisTable: document.getElementById('analysis-table') ? document.getElementById('analysis-table').querySelector('tbody') : null,
      analysisSummary: document.getElementById('analysis-summary'),
      analysisProgressBar: document.getElementById('analysis-progress-bar'),
      analysisProgressFill: document.getElementById('analysis-progress-fill'),
      leaderboardTable: document.getElementById('leaderboard-table') ? document.getElementById('leaderboard-table').querySelector('tbody') : null
    }
  }

  _bindEvents () {
    // Helpers
    const bindClick = (id, callback) => {
      const el = document.getElementById(id)
      if (el) el.addEventListener('click', callback)
    }

    const bindChange = (id, callback) => {
      const el = document.getElementById(id)
      if (el) el.addEventListener('change', (e) => callback(e))
    }

    bindClick('reset-engine-btn', () => this.callbacks.onResetEngine())
    bindClick('new-game-btn', () => this.callbacks.onNewGame())
    bindClick('new-960-btn', () => this.callbacks.onNew960())
    bindClick('flip-board-btn', () => this.callbacks.onFlipBoard())
    bindClick('self-play-btn', () => this.callbacks.onSelfPlayToggle())
    bindClick('fullscreen-btn', () => this._toggleFullscreen())
    bindClick('sidebar-toggle-btn', () => document.body.classList.toggle('sidebar-collapsed'))
    bindClick('streamer-mode-btn', () => document.body.classList.toggle('streamer-mode'))
    bindClick('resign-btn', () => this.callbacks.onResign())
    bindClick('offer-draw-btn', () => this.callbacks.onOfferDraw())
    bindClick('takeback-btn', () => this.callbacks.onTakeback())
    bindClick('force-move-btn', () => this.callbacks.onForceMove())
    bindClick('clear-analysis-btn', () => this.callbacks.onClearAnalysis())
    bindClick('replay-btn', () => this.callbacks.onReplayToggle())
    bindClick('load-fen-btn', () => this.callbacks.onLoadFen(this.elements.fenInput.value))
    bindClick('copy-fen-btn', () => this.callbacks.onCopyFen())
    bindClick('copy-fen-url-btn', () => this.callbacks.onCopyFenUrl())
    bindClick('import-pgn-btn', () => this.elements.pgnImportModal.classList.add('active'))
    bindClick('export-pgn-btn', () => this.callbacks.onExportPgn())
    bindClick('copy-pgn-btn', () => this.callbacks.onCopyPgn())
    bindClick('download-pgn-btn', () => this.callbacks.onDownloadPgn())
    bindClick('pgn-settings-btn', () => {
      // Pre-fill inputs if available via callback, or rely on persistence
      if (this.callbacks.onGetPgnSettings) {
        const settings = this.callbacks.onGetPgnSettings()
        if (settings) {
          this.elements.pgnWhiteInput.value = settings.White || 'White'
          this.elements.pgnBlackInput.value = settings.Black || 'Black'
          this.elements.pgnEventInput.value = settings.Event || 'Casual Game'
        }
      }
      this.elements.pgnSettingsModal.classList.add('active')
    })
    bindClick('save-pgn-settings-btn', () => {
      const settings = {
        White: this.elements.pgnWhiteInput.value,
        Black: this.elements.pgnBlackInput.value,
        Event: this.elements.pgnEventInput.value
      }
      this.callbacks.onSavePgnSettings(settings)
      this.elements.pgnSettingsModal.classList.remove('active')
    })
    bindClick('close-pgn-settings-modal', () => this.elements.pgnSettingsModal.classList.remove('active'))

    bindClick('close-pgn-modal', () => this.elements.pgnImportModal.classList.remove('active'))
    bindClick('load-pgn-confirm-btn', () => {
      this.callbacks.onLoadPgn(this.elements.pgnInputArea.value)
      this.elements.pgnImportModal.classList.remove('active')
    })
    bindClick('engine-duel-btn', () => this.elements.duelSetupModal.classList.add('active'))
    bindClick('close-duel-modal', () => this.elements.duelSetupModal.classList.remove('active'))
    bindClick('start-duel-btn', () => {
      this.callbacks.onStartDuel()
      this.elements.duelSetupModal.classList.remove('active')
    })
    bindClick('armageddon-btn', () => this.callbacks.onArmageddon())

    // Training Buttons
    bindClick('memory-training-btn', () => this.callbacks.onMemoryTraining())
    bindClick('memory-submit-btn', () => this.callbacks.onMemorySubmit())
    bindClick('memory-give-up-btn', () => this.callbacks.onMemoryGiveUp())
    bindClick('tactics-trainer-btn', () => this.callbacks.onTacticsTrainer())
    bindClick('tactics-next-btn', () => this.callbacks.onTacticsNext())
    bindClick('endgame-trainer-btn', () => this.callbacks.onEndgameTrainer())
    bindClick('start-endgame-btn', () => {
      const select = document.getElementById('endgame-select')
      this.callbacks.onStartEndgame(select.value)
    })
    bindClick('daily-puzzle-btn', () => this.callbacks.onDailyPuzzle())
    bindClick('analyze-game-btn', () => this.callbacks.onAnalyzeGame())
    bindClick('close-analysis-modal', () => {
      this.elements.analysisReportModal.classList.remove('active')
      this.callbacks.onStopAnalysis()
    })
    bindClick('export-analysis-btn', () => this.callbacks.onExportAnalysis())
    bindClick('import-analysis-btn', () => this.elements.importAnalysisFile.click())
    bindChange('import-analysis-file', (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (ev) => this.callbacks.onImportAnalysis(ev.target.result)
        reader.readAsText(file)
      }
    })
    bindClick('export-log-btn', () => {
      const text = this.logHistory.join('\n')
      const blob = new Blob([text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `engine_log_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    bindClick('leaderboard-btn', () => {
      this.elements.leaderboardModal.classList.add('active')
      this.callbacks.onShowLeaderboard()
    })
    bindClick('close-leaderboard-modal', () => this.elements.leaderboardModal.classList.remove('active'))
    bindClick('reset-leaderboard-btn', () => this.callbacks.onResetLeaderboard())
    bindClick('repertoire-builder-btn', () => this.callbacks.onRepertoireBuilder())
    bindClick('save-repertoire-btn', () => this.callbacks.onSaveRepertoire())

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'))
        btn.classList.add('active')
        const tabId = btn.dataset.tab
        const content = document.getElementById(`${tabId}-tab`)
        if (content) content.classList.add('active')
      })
    })

    // Checkboxes / Selects
    bindChange('auto-flip', (e) => this.callbacks.onAutoFlipChange(e.target.checked))
    bindChange('auto-queen', (e) => this.callbacks.onAutoQueenChange(e.target.checked))
    bindChange('move-confirmation', (e) => this.callbacks.onMoveConfirmChange(e.target.checked))
    bindChange('zen-mode', (e) => this._toggleZenMode(e.target.checked))
    bindChange('blindfold-mode', (e) => {
      const board = document.getElementById('chessboard')
      if (e.target.checked) board.classList.add('blindfold')
      else board.classList.remove('blindfold')
    })
    bindChange('blindfold-training', (e) => {
      const board = document.getElementById('chessboard')
      if (e.target.checked) board.classList.add('blindfold-training')
      else board.classList.remove('blindfold-training')
    })
    bindChange('show-coords', (e) => this.callbacks.onShowCoordsChange(e.target.checked))
    bindChange('show-arrow-last', (e) => this.callbacks.onShowArrowLastChange(e.target.checked))
    bindChange('show-threats', (e) => this.callbacks.onShowThreatsChange(e.target.checked))
    bindChange('analysis-mode', (e) => this.callbacks.onAnalysisModeChange(e.target.checked))
    bindChange('game-mode', (e) => this.callbacks.onGameModeChange(e.target.value))
    bindChange('uci-preset-select', (e) => this._applyPreset(e.target.value))
    bindChange('history-notation-toggle', (e) => this.callbacks.onHistoryNotationChange(e.target.value))

    // Theme & Styling
    bindChange('ui-theme', (e) => this._setUITheme(e.target.value))
    bindChange('board-theme', (e) => this.callbacks.onBoardThemeChange(e.target.value))
    bindChange('piece-set', (e) => this.callbacks.onPieceSetChange(e.target.value))
    bindChange('board-size', (e) => {
      document.getElementById('chessboard').style.setProperty('--board-max-width', `${e.target.value}px`)
    })
  }

  _toggleFullscreen () {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        this.showToast(`Error: ${err.message}`, 'error')
      })
    } else {
      document.exitFullscreen()
    }
  }

  _toggleZenMode (enable) {
    if (enable) document.body.classList.add('zen-mode')
    else document.body.classList.remove('zen-mode')
  }

  _setUITheme (theme) {
    if (theme === 'light') document.body.classList.add('light-mode')
    else document.body.classList.remove('light-mode')
    localStorage.setItem('ui-theme', theme)
  }

  logToOutput (msg) {
    const now = new Date()
    const time = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`
    const logLine = `${time} ${msg}`
    this.logHistory.push(logLine)
    const line = document.createElement('div')
    line.textContent = logLine
    if (this.elements.engineOutput) this.elements.engineOutput.prepend(line)
  }

  logSystemMessage (msg, type = 'info') {
    if (!this.elements.systemLog) return
    const now = new Date()
    const time = now.toLocaleTimeString()
    const line = document.createElement('div')
    line.textContent = `[${time}] ${msg}`
    if (type === 'error') line.style.color = '#F2495C'
    else if (type === 'success') line.style.color = '#9AC42A'
    this.elements.systemLog.prepend(line)
  }

  showToast (message, type = 'info') {
    const container = document.getElementById('toast-container')
    const toast = document.createElement('div')
    toast.classList.add('toast')
    if (type) toast.classList.add(type)
    toast.textContent = message
    container.appendChild(toast)

    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-out forwards'
      toast.addEventListener('animationend', () => {
        if (toast.parentNode) toast.parentNode.removeChild(toast)
      })
    }, 3000)
    this.logSystemMessage(message, type)
  }

  updateSearchStats (info) {
    if (info.depth) this.elements.depthValue.textContent = info.depth
    if (info.nps) this.elements.npsValue.textContent = this._formatNps(info.nps)
    if (info.wdl) {
      const [w, d, l] = info.wdl
      this.elements.wdlValue.textContent = `${(w / 10).toFixed(0)}-${(d / 10).toFixed(0)}-${(l / 10).toFixed(0)}%`
    }
    if (info.score) {
      this.elements.evalValue.textContent = this._formatScore(info.score)
      this._updateEvalBar(info.score, this.callbacks.getTurn ? this.callbacks.getTurn() : 'w')
    }
    if (info.pv) {
      this.elements.pvLines.textContent = info.pv.join(' ')
    }
  }

  _formatNps (nps) {
    const n = parseInt(nps)
    if (isNaN(n)) return '-'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
    return n
  }

  _formatScore (score) {
    if (score.type === 'mate') return '#' + score.value
    const val = score.value / 100
    return (val > 0 ? '+' : '') + val.toFixed(2)
  }

  _updateEvalBar (score, turn) {
    if (!this.elements.evalBarFill) return
    let percent = 50
    let val = score.value
    if (turn === 'b') val = -val

    if (score.type === 'mate') {
      percent = val > 0 ? 100 : 0
    } else {
      percent = (1 / (1 + Math.exp(-val / 300))) * 100
    }
    percent = Math.max(0, Math.min(100, percent))
    this.elements.evalBarFill.style.height = `${percent}%`
  }

  renderHistory (game, currentViewIndex, onHistoryClick, notation = 'san') {
    const history = game.history({ verbose: true })
    this.elements.moveHistory.innerHTML = ''
    const getStr = (m) => notation === 'lan' ? (m.from + m.to + (m.promotion || '')) : m.san

    for (let i = 0; i < history.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1
      const whiteMoveObj = history[i]
      const blackMoveObj = history[i + 1]

      const numDiv = document.createElement('div')
      numDiv.classList.add('move-number')
      numDiv.textContent = moveNum + '.'
      this.elements.moveHistory.appendChild(numDiv)

      const whiteDiv = document.createElement('div')
      whiteDiv.classList.add('move-san')
      whiteDiv.textContent = getStr(whiteMoveObj)
      if (currentViewIndex === i) whiteDiv.classList.add('active')
      whiteDiv.addEventListener('click', () => onHistoryClick(i))
      this.elements.moveHistory.appendChild(whiteDiv)

      if (blackMoveObj) {
        const blackDiv = document.createElement('div')
        blackDiv.classList.add('move-san')
        blackDiv.textContent = getStr(blackMoveObj)
        if (currentViewIndex === i + 1) blackDiv.classList.add('active')
        blackDiv.addEventListener('click', () => onHistoryClick(i + 1))
        this.elements.moveHistory.appendChild(blackDiv)
      }
    }
    if (currentViewIndex === -1) {
      this.elements.moveHistory.scrollTop = this.elements.moveHistory.scrollHeight
    }
  }

  showPromotionModal (color, pieceSet) {
    return new Promise((resolve, reject) => {
      this.elements.promotionModal.classList.add('active')
      const pieces = this.elements.promotionModal.querySelectorAll('.promo-piece')
      pieces.forEach(p => {
        const type = p.dataset.piece
        const img = p.querySelector('img')
        img.src = `images/${pieceSet}/${color}${type}.svg`

        const newEl = p.cloneNode(true)
        p.parentNode.replaceChild(newEl, p)
        newEl.addEventListener('click', () => {
          this.elements.promotionModal.classList.remove('active')
          resolve(type)
        })
      })

      const closeHandler = (e) => {
        if (e.target === this.elements.promotionModal) {
          this.elements.promotionModal.classList.remove('active')
          this.elements.promotionModal.removeEventListener('click', closeHandler)
          reject(new Error('Cancelled'))
        }
      }
      this.elements.promotionModal.addEventListener('click', closeHandler)
    })
  }

  parseOption (line, onSendOption) {
    const parts = line.split(' ')
    const nameIdx = parts.indexOf('name')
    const typeIdx = parts.indexOf('type')
    if (nameIdx === -1 || typeIdx === -1) return
    const name = parts.slice(nameIdx + 1, typeIdx).join(' ')
    const type = parts[typeIdx + 1]
    const getVal = (key) => {
      const start = parts.indexOf(key)
      if (start === -1) return null
      const keywords = ['name', 'type', 'default', 'min', 'max', 'var']
      let end = parts.length
      for (let i = start + 1; i < parts.length; i++) {
        if (keywords.includes(parts[i])) {
          end = i
          break
        }
      }
      return parts.slice(start + 1, end).join(' ')
    }
    const defaultValue = getVal('default')
    const min = getVal('min')
    const max = getVal('max')
    const vars = []
    parts.forEach((part, index) => {
      if (part === 'var') {
        const keywords = ['name', 'type', 'default', 'min', 'max', 'var']
        let end = parts.length
        for (let i = index + 1; i < parts.length; i++) {
          if (keywords.includes(parts[i])) {
            end = i
            break
          }
        }
        vars.push(parts.slice(index + 1, end).join(' '))
      }
    })

    this.createOptionUI(name, type, defaultValue, min, max, vars, onSendOption)
  }

  createOptionUI (name, type, defaultValue, min, max, vars, onSendOption) {
    const groupName = UIConstants.OPTION_GROUPS[name] || this._inferGroup(name)
    let group = this.elements.uciOptions.querySelector(`.option-group[data-group="${groupName}"]`)
    if (!group) {
      group = document.createElement('fieldset')
      group.classList.add('option-group')
      group.dataset.group = groupName
      const legend = document.createElement('legend')
      legend.textContent = groupName
      group.appendChild(legend)
      this.elements.uciOptions.appendChild(group)
    }

    const container = document.createElement('div')
    container.classList.add('option-item')
    const tooltip = UIConstants.OPTION_TOOLTIPS[name]
    if (tooltip) container.title = tooltip

    const label = document.createElement('label')
    label.textContent = name + ': '
    container.appendChild(label)

    let input = null
    const factory = UIOptionFactory
    const showToast = (m, t) => this.showToast(m, t)

    if (type === 'spin') input = factory.createSpinInput(min, max, defaultValue, onSendOption, name)
    else if (type === 'check') input = factory.createCheckInput(defaultValue, onSendOption, name)
    else if (type === 'string') input = factory.createStringInput(defaultValue, onSendOption, name, showToast)
    else if (type === 'button') input = factory.createButtonInput(onSendOption, name)
    else if (type === 'combo') input = factory.createComboInput(vars, defaultValue, onSendOption, name)

    if (input) {
      container.appendChild(input)
      group.appendChild(container)
    }
  }

  renderAnalysisRow (task, result) {
    if (!this.elements.analysisTable) return
    const tr = document.createElement('tr')
    tr.style.borderBottom = '1px solid var(--grafana-border)'

    let color = 'inherit'
    let annotation = ''
    const diff = result.diff

    if (typeof diff === 'number') {
      if (diff > 300) { color = '#F2495C'; annotation = '??' } else if (diff > 100) { color = '#EAB839'; annotation = '?' } else if (diff > 50) { color = '#33B5E5'; annotation = '?!' }
    } else {
      color = '#EAB839'; annotation = '?!'
    }

    const moveNum = Math.ceil(task.moveIndex / 2)
    const moveDots = task.moveIndex % 2 === 0 ? '..' : ''

    tr.innerHTML = `
      <td style="padding: 5px;">${moveNum}${moveDots}</td>
      <td style="padding: 5px; color: ${color}">${task.san} ${annotation}</td>
      <td style="padding: 5px; cursor: pointer; text-decoration: underline;" class="promote-btn" title="Promote (Play) this move">${result.best}</td>
      <td style="padding: 5px;">${typeof diff === 'number' ? (diff / 100).toFixed(2) : '> 0.50'}</td>
      <td style="padding: 5px;">${result.eval}</td>
    `
    const promoteBtn = tr.querySelector('.promote-btn')
    if (promoteBtn) {
      promoteBtn.addEventListener('click', () => {
        if (this.callbacks.onPromoteVariation) this.callbacks.onPromoteVariation(result.best)
      })
    }
    this.elements.analysisTable.appendChild(tr)
  }

  updateAnalysisProgress (current, total) {
    if (this.elements.analysisProgressBar) this.elements.analysisProgressBar.style.display = 'block'
    const pct = total > 0 ? (current / total) * 100 : 0
    if (this.elements.analysisProgressFill) this.elements.analysisProgressFill.style.width = `${pct}%`
  }

  _inferGroup (name) {
    if (['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King', 'Doubled', 'Isolated', 'Backward', 'Shield', 'Outpost', 'Mobility'].some(k => name.includes(k))) {
      return 'Tuning'
    }
    return 'Other'
  }

  updateCapturedPieces (game, startingFen, pieceSet, isFlipped) {
    this.boardInfoRenderer.updateCapturedPieces(game, startingFen, pieceSet, isFlipped)
  }

  setThinking (isThinking) {
    const board = document.getElementById('chessboard')
    const evalContainer = document.getElementById('eval-bar-container')
    if (isThinking) {
      if (board) board.classList.add('thinking-border')
      if (evalContainer) evalContainer.classList.add('thinking')
    } else {
      if (board) board.classList.remove('thinking-border')
      if (evalContainer) evalContainer.classList.remove('thinking')
    }
  }

  _applyPreset (preset) {
    const send = (n, v) => {
      if (this.callbacks.onSendOption) this.callbacks.onSendOption(n, v)
      // Update UI
      const input = this.elements.uciOptions.querySelector(`[data-option-name="${n}"]`)
      if (input) {
        if (input.type === 'checkbox') input.checked = v
        else input.value = v
        // Trigger change event if needed? No, we are setting it programmatically.
        // But for slider, we need to update the number input too.
        if (input.type === 'range') {
          const number = input.nextElementSibling
          if (number && number.type === 'number') number.value = v
        }
      }
    }

    if (preset === 'blitz') {
      send('Hash', 64)
      send('Threads', 1)
      send('MultiPV', 1)
      send('Contempt', 0)
      send('UCI_LimitStrength', false)
    } else if (preset === 'analysis') {
      send('Hash', 256)
      send('Threads', 4)
      send('MultiPV', 3)
      send('Contempt', 0)
      send('UCI_LimitStrength', false)
    } else if (preset === 'stock') {
      send('Hash', 16)
      send('Threads', 1)
      send('MultiPV', 1)
      send('Contempt', 0)
      send('UCI_LimitStrength', false)
    }
  }
}
