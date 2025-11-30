/* eslint-env browser */
/* eslint-disable max-lines */
/* global Chess, SocketHandler, BoardRenderer, GameManager, AnalysisManager, TrainingManager, UIManager, ArrowManager, SoundManager, ClientUtils, MoveHandler, LeaderboardManager, PgnManager, FenManager, BoardEditor, DeveloperManager, MoveListManager, OpeningExplorer, TreeManager, AccessibilityManager, SettingsManager, ExternalActions, AutoSaveManager, InfoManager, VisualEffects, BatterySaver, LanguageManager, ChatManager, TutorialManager */

const initApp = () => {
  try {
    const game = new Chess()
    let pgnManager = null
    let fenManager = null
    let moveListManager = null
    let openingExplorer = null
    let treeManager = null
    let accessibilityManager = null
    let settingsManager = null
    let externalActions = null
    let autoSaveManager = null
    let infoManager = null
    let visualEffects = null
    let batterySaver = null
    let moveHandler = null
    let chatManager = null

    // Shared State
    const state = {
      selectedSquare: null,
      legalMoves: [],
      currentViewIndex: -1,
      premove: null,
      pendingConfirmationMove: null,
      isFlipped: false,
      historyNotation: 'san'
    }

    const socketHandler = new SocketHandler({
      onOpen: () => {
        uiManager.elements.status.textContent = 'Status: Connected'
        uiManager.logSystemMessage('Connected to server', 'success')
        socketHandler.send('uci')
      },
      onClose: () => {
        uiManager.elements.status.textContent = 'Status: Disconnected'
        uiManager.logSystemMessage('Disconnected from server', 'error')
      },
      onSent: (cmd) => {
        if (developerManager) developerManager.logPacket('OUT', cmd)
        if (cmd.startsWith('go ')) {
          uiManager.setThinking(true)
        } else if (cmd === 'stop') {
          uiManager.setThinking(false)
        }
      },
      onOption: (line) => {
        if (developerManager) developerManager.logPacket('IN', line)
        uiManager.parseOption(line, (n, v) => sendOption(n, v))
      },
      onReadyOk: () => {
        if (developerManager) developerManager.handleMessage('readyok')
        if (developerManager) developerManager.logPacket('IN', 'readyok')
        if (!gameManager.gameStarted) gameManager.startNewGame()
      },
      onInfo: (msg) => handleInfoMessage(msg),
      onBestMove: (parts) => {
        if (developerManager) developerManager.logPacket('IN', parts.join(' '))
        uiManager.setThinking(false)
        analysisManager.handleBestMove()
        handleBestMove(parts)
      },
      onVoteMessage: (data) => handleVoteMessage(data),
      onChatMessage: (data) => chatManager && chatManager.addMessage(data, false),
      onReaction: (data) => chatManager && chatManager.showReaction(data.emoji, false)
    })

    const handleInfoMessage = (msg) => {
      if (developerManager) developerManager.handleMessage(msg)
      if (developerManager) developerManager.logPacket('IN', msg)
      if (msg.includes('book_moves')) {
        const json = msg.substring(msg.indexOf('book_moves') + 11)
        if (openingExplorer) openingExplorer.handleBookInfo(json)
      } else if (msg.includes('Debug tree written')) {
        uiManager.showToast('Tree Generated', 'success')
        if (treeManager) treeManager.onTreeReady()
      } else if (msg.includes('score cp') || msg.includes('mate')) {
        uiManager.logToOutput(msg)
      }
      const info = ClientUtils.parseInfo(msg)
      if (info) {
        uiManager.updateSearchStats(info)
        analysisManager.handleInfo(info)
      }
    }

    const developerManager = new DeveloperManager(null, socketHandler, game)

    const uiManager = new UIManager({
      onSendOption: (n, v) => sendOption(n, v),
      onResetEngine: () => window.location.reload(),
      onNewGame: () => {
        const handicap = document.getElementById('handicap-select').value
        let fen = 'startpos'
        if (handicap && handicap !== 'none') {
          const map = ClientUtils.getHandicapFen(handicap)
          if (map) fen = map
        }
        gameManager.startNewGame(fen)
      },
      onNew960: () => {
        const fen = ClientUtils.generate960Fen()
        uiManager.elements.fenInput.value = fen
        gameManager.startNewGame(fen)
        render()
      },
      onFlipBoard: () => {
        state.isFlipped = !state.isFlipped
        boardRenderer.setFlipped(state.isFlipped)
        render()
      },
      onSelfPlayToggle: () => {
        gameManager.isSelfPlay = !gameManager.isSelfPlay
        if (gameManager.isSelfPlay) gameManager.sendPositionAndGo()
        const btn = document.getElementById('self-play-btn')
        if (btn) btn.textContent = gameManager.isSelfPlay ? 'Stop Self Play' : 'Self Play'
      },
      onResign: () => {
        gameManager.checkGameOver()
        if (!gameManager.gameStarted) return
        gameManager.gameStarted = false
        if (gameManager.clockInterval) clearInterval(gameManager.clockInterval)
        const loser = game.turn() === 'w' ? 'White' : 'Black'
        const winner = game.turn() === 'w' ? 'Black' : 'White'
        uiManager.showGameOverModal(`${winner} Wins!`, `${loser} Resigned`)
        uiManager.showToast('You resigned.', 'info')
        uiManager.logToOutput(`Game Over: ${loser} resigns.`)
      },
      onOfferDraw: () => {
        if (Math.abs(gameManager.lastEngineEval) <= 10) {
          gameManager.gameStarted = false
          if (gameManager.clockInterval) clearInterval(gameManager.clockInterval)
          uiManager.showToast('Engine accepted draw offer.', 'success')
        } else {
          uiManager.showToast('Engine declined draw offer.', 'error')
        }
      },
      onTakeback: () => {
        socketHandler.send('stop')
        setTimeout(() => {
          gameManager.undo()
          if (gameManager.gameMode === 'pve' && gameManager.game.turn() !== 'w') {
            gameManager.undo()
          }
          render()
        }, 100)
      },
      onForceMove: () => socketHandler.send('stop'),
      onClearAnalysis: () => {
        if (ArrowManager) {
          ArrowManager.clearUserArrows()
          ArrowManager.clearEngineArrows()
        }
        render()
      },
      onReplayToggle: () => toggleReplay(),
      onLoadFen: (fen) => fenManager.loadFen(fen),
      onCopyFen: () => fenManager.copyFen(),
      onCopyFenUrl: () => fenManager.copyFenUrl(),
      onDownloadScreenshot: () => externalActions.downloadScreenshot(),
      onExportGif: () => externalActions.exportGif(),
      onLoadPgn: (pgn) => {
        if (pgnManager.importPgn(pgn)) {
          gameManager.gameStarted = true
          render()
        }
      },
      onExportPgn: () => {
        uiManager.elements.pgnInputArea.value = pgnManager.exportPgn()
        uiManager.elements.pgnImportModal.classList.add('active')
      },
      onCopyPgn: () => pgnManager.copyPgnToClipboard(),
      onDownloadPgn: () => pgnManager.downloadPgn(),
      onSavePgnSettings: (settings) => {
        pgnManager.updateHeader('White', settings.White)
        pgnManager.updateHeader('Black', settings.Black)
        pgnManager.updateHeader('Event', settings.Event)
        uiManager.showToast('PGN Settings Saved', 'success')
      },
      onGetPgnSettings: () => pgnManager.getHeaders(),
      onAnalyzeLichess: () => externalActions.analyzeLichess(),
      onAnalyzeChessCom: () => externalActions.analyzeChessCom(),
      onShareTwitter: () => externalActions.shareTwitter(),
      onShareReddit: () => externalActions.shareReddit(),
      onGenerateQr: () => externalActions.generateQrCode(),
      onHistoryNotationChange: (val) => {
        state.historyNotation = val
        render()
      },
      onExportAnalysis: () => {
        const json = analysisManager.exportAnalysis()
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analysis_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      },
      onImportAnalysis: (json) => {
        if (analysisManager.importAnalysis(json)) {
          uiManager.showToast('Analysis Loaded', 'success')
          uiManager.elements.analysisReportModal.classList.add('active')
        } else {
          uiManager.showToast('Invalid Analysis File', 'error')
        }
      },
      onStartDuel: () => startDuel(),
      onArmageddon: () => {
        gameManager.isArmageddon = true
        gameManager.startNewGame('startpos')
        gameManager.whiteTime = 300000 // 5m
        gameManager.blackTime = 240000 // 4m
        uiManager.showToast('Armageddon Mode Started', 'info')
      },
      onMemoryTraining: () => {
        document.getElementById('memory-training-controls').style.display = 'block'
        trainingManager.startMemoryTraining()
      },
      onMemorySubmit: () => trainingManager.checkMemoryResult(),
      onMemoryGiveUp: () => {
        document.getElementById('memory-training-controls').style.display = 'none'
        trainingManager.stopMemoryTraining()
        game.load(trainingManager.memoryTargetFen)
        render()
      },
      onTacticsTrainer: () => {
        document.getElementById('tactics-controls').style.display = 'block'
        trainingManager.startTacticsTrainer()
      },
      onTacticsNext: () => trainingManager.nextTacticsPuzzle(),
      onEndgameTrainer: () => { document.getElementById('endgame-controls').style.display = 'block' },
      onStartEndgame: (type) => {
        const config = trainingManager.startEndgame(type)
        if (config) {
          if (config.userColor === 'b') {
            state.isFlipped = true
            boardRenderer.setFlipped(true)
          } else {
            state.isFlipped = false
            boardRenderer.setFlipped(false)
          }
          gameManager.gameStarted = true
          render()
          if (game.turn() !== config.userColor) {
            gameManager.sendPositionAndGo()
          }
        }
      },
      onDailyPuzzle: () => trainingManager.startDailyPuzzle(),
      onAnalyzeGame: () => analysisManager.startFullGameAnalysis(gameManager.startingFen),
      onStopAnalysis: () => analysisManager.stopAnalysis(),
      onShowLeaderboard: () => leaderboardManager.renderLeaderboard(),
      onResetLeaderboard: () => {
        localStorage.removeItem('engine-leaderboard')
        leaderboardManager.renderLeaderboard()
      },
      onRepertoireBuilder: () => {},
      onSaveRepertoire: () => {},
      onAutoFlipChange: (checked) => {
        if (checked) {
          const turn = game.turn()
          state.isFlipped = turn === 'b'
          boardRenderer.setFlipped(state.isFlipped)
          render()
        }
      },
      onAutoQueenChange: (checked) => {},
      onMoveConfirmChange: (checked) => {},
      onShowCoordsChange: (checked) => {
        boardRenderer.showCoords = checked
        render()
      },
      onShowArrowLastChange: (checked) => {
        boardRenderer.showArrowLast = checked
        render()
      },
      onShowThreatsChange: (checked) => {
        boardRenderer.showThreats = checked
        render()
      },
      onAnalysisModeChange: (checked) => {
        if (checked) gameManager.sendPositionAndGo(true, false)
        else socketHandler.send('stop')
      },
      onGameModeChange: (mode) => {
        gameManager.gameMode = mode
        if (mode === 'vote') socketHandler.send(JSON.stringify({ action: 'join_vote' }))
      },
      onBoardThemeChange: (theme) => {
        const board = document.getElementById('chessboard')
          ;['theme-green', 'theme-blue', 'theme-wood', 'theme-glass', 'theme-newspaper', 'theme-custom'].forEach(cls => {
          board.classList.remove(cls)
        })
        if (theme !== 'classic') board.classList.add(`theme-${theme}`)
      },
      onPieceSetChange: (set) => {
        boardRenderer.setPieceSet(set)
        render()
      },
      getTurn: () => game.turn(),
      onPromoteVariation: (uciMove) => {
        // uciMove e.g. "e2e4"
        const from = uciMove.substring(0, 2)
        const to = uciMove.substring(2, 4)
        const promotion = uciMove.length > 4 ? uciMove[4] : undefined
        gameManager.performMove({ from, to, promotion })
      }
    })

    developerManager.uiManager = uiManager

    const leaderboardManager = new LeaderboardManager(uiManager)

    pgnManager = new PgnManager(game, uiManager)
    fenManager = new FenManager(game, uiManager, (fen) => {
      gameManager.startNewGame(fen)
      render()
    })

    const boardEditor = new BoardEditor('board-editor-modal', (fen) => {
      gameManager.startNewGame(fen)
      render()
      uiManager.showToast('Position loaded from Editor', 'success')
    })
    document.getElementById('board-editor-btn').addEventListener('click', () => {
      boardEditor.open(game.fen())
    })

    const boardRenderer = new BoardRenderer(document.getElementById('chessboard'), game, {
      onSquareClick: (row, col) => moveHandler.handleSquareClick(row, col),
      onDrop: (from, to) => moveHandler.handleDrop(from, to),
      isViewOnly: () => state.currentViewIndex !== -1
    })

    externalActions = new ExternalActions(pgnManager, boardRenderer, uiManager, game)

    const gameManager = new GameManager(game, socketHandler, {
      onGameStart: () => {
        render()
        uiManager.showToast('New Game Started', 'info')
        if (openingExplorer) openingExplorer.refresh()
        if (autoSaveManager) autoSaveManager.saveGame()
      },
      onMove: (result) => {
        render()
        if (openingExplorer) openingExplorer.refresh()
        if (result) {
          if (ArrowManager) ArrowManager.clearEngineArrows()
          if (document.getElementById('auto-flip').checked) {
            state.isFlipped = game.turn() === 'b'
            boardRenderer.setFlipped(state.isFlipped)
            render()
          }
          if (accessibilityManager) accessibilityManager.announceMove(result)
          if (autoSaveManager) autoSaveManager.saveGame()
        }
      },
      onGameOver: (outcome) => {
        let title = 'Game Over'
        if (outcome.winner === 'white') title = 'White Wins!'
        else if (outcome.winner === 'black') title = 'Black Wins!'
        else if (outcome.winner === 'draw') title = 'Draw'

        uiManager.showGameOverModal(title, outcome.reason)

        const msg = `Game Over: ${outcome.winner} (${outcome.reason})`
        uiManager.showToast(msg, 'info')
        uiManager.logToOutput(msg)
        if (gameManager.isDuelActive) {
          leaderboardManager.updateLeaderboard(gameManager.engineAConfig.name, gameManager.engineBConfig.name, outcome.winner)
        }
        if (autoSaveManager) autoSaveManager.clearSave()
        if (visualEffects) {
          if (outcome.reason === 'Checkmate') visualEffects.triggerShake()
          if (outcome.winner !== 'draw') visualEffects.startConfetti()
        }
      },
      onClockUpdate: () => renderClocks()
    })

    const analysisManager = new AnalysisManager(game, gameManager, socketHandler, {
      onStart: (total) => {
        uiManager.elements.analysisReportModal.classList.add('active')
        uiManager.elements.analysisSummary.textContent = 'Analyzing...'
        uiManager.elements.analysisTable.innerHTML = ''
      },
      onStepComplete: (task, result, current, total) => {
        uiManager.renderAnalysisRow(task, result)
        uiManager.updateAnalysisProgress(current, total)
      },
      onComplete: () => {
        uiManager.elements.analysisSummary.textContent = 'Analysis Complete'
        uiManager.showToast('Analysis Complete', 'success')
      },
      onError: (msg) => uiManager.showToast(msg, 'error')
    })

    const trainingManager = createTrainingManager(game, boardRenderer, uiManager, render)

    moveListManager = new MoveListManager(game, gameManager, uiManager)
    openingExplorer = new OpeningExplorer(gameManager, socketHandler, uiManager)
    treeManager = new TreeManager(socketHandler, uiManager)

    // Accessibility Manager
    accessibilityManager = new AccessibilityManager(gameManager, uiManager, render)

    // Settings Manager
    settingsManager = new SettingsManager(uiManager, SoundManager, accessibilityManager)

    // Auto Save Manager
    autoSaveManager = new AutoSaveManager(gameManager, uiManager, game)

    // Info Manager
    // eslint-disable-next-line no-unused-vars
    infoManager = new InfoManager(uiManager)

    // Visual Effects
    visualEffects = new VisualEffects(uiManager)

    // Battery Saver
    // eslint-disable-next-line no-unused-vars
    batterySaver = new BatterySaver(uiManager)

    // Chat Manager
    chatManager = new ChatManager(uiManager, socketHandler, visualEffects)

    // Tutorial Manager
    const tutorialManager = new TutorialManager(uiManager)
    const tutorialBtn = document.getElementById('tutorial-btn')
    if (tutorialBtn) tutorialBtn.addEventListener('click', () => tutorialManager.start())

    // Language Manager
    const languageManager = new LanguageManager()
    languageManager.init()

    checkVersion()
    setupOfflineIndicator()
    setupEmbed()
    setupPWA()

    moveHandler = new MoveHandler(game, gameManager, uiManager, boardRenderer, trainingManager, state, render)

    // --- Helpers ---

    function setupPWA () {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(reg => {
          console.log('SW registered:', reg)
        }).catch(err => console.error('SW registration failed:', err))
      }

      let deferredPrompt
      const installBtn = document.getElementById('install-app-btn')

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        deferredPrompt = e
        if (installBtn) {
          installBtn.style.display = 'block'
          installBtn.addEventListener('click', () => {
            installBtn.style.display = 'none'
            deferredPrompt.prompt()
            deferredPrompt.userChoice.then((choiceResult) => {
              if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt')
              }
              deferredPrompt = null
            })
          })
        }
      })
    }

    function checkVersion () {
      fetch('/version').then(res => res.json()).then(data => {
        const localVersion = data.version
        const versionDisplay = document.getElementById('version-display')
        if (versionDisplay) versionDisplay.textContent = `v${localVersion}`

        // Check GitHub
        fetch('https://api.github.com/repos/nurdwerks/jules-gemini3-chess-engine/releases/latest')
          .then(res => res.json())
          .then(release => {
            const remoteVersion = release.tag_name ? release.tag_name.replace('v', '') : null
            if (remoteVersion && remoteVersion !== localVersion) {
              uiManager.showToast(`New version available: v${remoteVersion}`, 'info')
            }
          }).catch((e) => console.error('GitHub check failed', e))
      }).catch((e) => console.error('Version check failed', e))
    }

    function setupOfflineIndicator () {
      const badge = document.getElementById('offline-badge')
      const update = () => {
        if (!navigator.onLine) {
          if (badge) badge.style.display = 'block'
        } else {
          if (badge) badge.style.display = 'none'
        }
      }
      window.addEventListener('online', update)
      window.addEventListener('offline', update)
      update()
    }

    function setupEmbed () {
      const btn = document.getElementById('embed-btn')
      if (btn) {
        btn.addEventListener('click', () => {
          const modal = document.getElementById('embed-modal')
          const area = document.getElementById('embed-code-area')
          if (modal && area) {
            const url = window.location.href.split('?')[0] + '?fen=' + encodeURIComponent(game.fen())
            const code = `<iframe src="${url}" width="600" height="400" frameborder="0"></iframe>`
            area.value = code
            modal.classList.add('active')
          }
        })
      }
      const close = document.getElementById('close-embed-modal')
      if (close) {
        close.addEventListener('click', () => {
          document.getElementById('embed-modal').classList.remove('active')
        })
      }
      const copy = document.getElementById('copy-embed-btn')
      if (copy) {
        copy.addEventListener('click', () => {
          const area = document.getElementById('embed-code-area')
          area.select()
          document.execCommand('copy')
          uiManager.showToast('Embed code copied!', 'success')
        })
      }
    }

    function render () {
      state.currentViewIndex = gameManager.currentViewIndex
      boardRenderer.render({
        board: getBoardState().board,
        chess: getBoardState().chess,
        selectedSquare: state.selectedSquare,
        legalMoves: state.legalMoves,
        currentViewIndex: state.currentViewIndex,
        premove: state.premove,
        pendingConfirmationMove: state.pendingConfirmationMove
      })

      moveListManager.render(state.currentViewIndex, (idx) => {
        gameManager.currentViewIndex = idx
        render()
      }, state.historyNotation)

      renderClocks()
      uiManager.updateCapturedPieces(game, gameManager.startingFen, boardRenderer.currentPieceSet, state.isFlipped)
      uiManager.updateAvatars(state.isFlipped)
    }

    function getBoardState () {
      if (gameManager.currentViewIndex === -1) {
        return { board: game.board(), chess: game }
      }
      const tempGame = new Chess()
      if (gameManager.startingFen !== 'startpos') {
        tempGame.load(gameManager.startingFen)
      }
      const history = game.history({ verbose: true })
      for (let i = 0; i <= gameManager.currentViewIndex; i++) {
        tempGame.move(history[i])
      }
      return { board: tempGame.board(), chess: tempGame }
    }

    function handleBestMove (parts) {
      if (analysisManager.isFullAnalysis) return

      const move = parts[1]
      if (move && move !== '(none)') {
        const from = move.substring(0, 2)
        const to = move.substring(2, 4)
        const promotion = move.length > 4 ? move[4] : undefined

        const moveObj = { from, to, promotion }
        const speed = parseInt(uiManager.elements.animationSpeedSelect.value)
        if (speed > 0 && gameManager.currentViewIndex === -1) {
          boardRenderer.animateMove(from, to, speed).then(() => {
            gameManager.performMove(moveObj)
            moveHandler.checkAndExecutePremove()
            _triggerNext()
          })
        } else {
          gameManager.performMove(moveObj)
          moveHandler.checkAndExecutePremove()
          _triggerNext()
        }
      }

      function _triggerNext () {
        if ((gameManager.isSelfPlay || gameManager.isDuelActive) && !game.game_over()) {
          setTimeout(() => {
            if (gameManager.isDuelActive) {
              const turn = game.turn()
              const config = turn === 'w' ? gameManager.engineAConfig : gameManager.engineBConfig
              applyEngineConfig(config)
            }
            gameManager.sendPositionAndGo()
          }, 500)
        }
      }
    }

    function handleVoteMessage (data) {
      if (data.type === 'vote_result') {
        uiManager.showToast(`Vote Result: ${data.move}`, 'success')
      }
    }

    function sendOption (name, value) {
      let command = `setoption name ${name}`
      if (value !== undefined) command += ` value ${value}`
      socketHandler.send(command)
      uiManager.logToOutput(`> ${command}`)
      if (name === 'Threads' && developerManager && developerManager.elements.threadsDisplay) {
        developerManager.elements.threadsDisplay.textContent = value
      }
    }

    function renderClocks () {
      uiManager.boardInfoRenderer.updateClocks(gameManager.whiteTime, gameManager.blackTime, state.isFlipped)
    }

    let replayInterval = null
    function toggleReplay () {
      if (replayInterval) {
        clearInterval(replayInterval)
        replayInterval = null
      } else {
        gameManager.currentViewIndex = -1
        render()
        replayInterval = setInterval(() => {
          gameManager.currentViewIndex++
          if (gameManager.currentViewIndex >= game.history().length) gameManager.currentViewIndex = -1
          render()
        }, 800)
      }
    }

    function startDuel () {
      gameManager.isDuelActive = true
      gameManager.engineAConfig = {
        name: document.getElementById('engine-a-name').value,
        elo: document.getElementById('engine-a-elo').value,
        limitStrength: document.getElementById('engine-a-limit').checked
      }
      gameManager.engineBConfig = {
        name: document.getElementById('engine-b-name').value,
        elo: document.getElementById('engine-b-elo').value,
        limitStrength: document.getElementById('engine-b-limit').checked
      }
      gameManager.startNewGame()
      applyEngineConfig(gameManager.engineAConfig)
      gameManager.sendPositionAndGo()
    }

    function applyEngineConfig (config) {
      sendOption('UCI_LimitStrength', config.limitStrength)
      sendOption('UCI_Elo', config.elo)
      uiManager.showToast(`Active: ${config.name}`)
    }

    function createTrainingManager (g, r, u, renderFn) {
      return new TrainingManager(g, r, {
        onMemoryStart: (fen) => u.showToast('Memorize this position!', 'info'),
        onMemoryTick: (time) => { document.getElementById('memory-timer').textContent = `Time: ${time}` },
        onMemoryReconstructionStart: () => {
          u.showToast('Reconstruct the position!', 'info')
          document.getElementById('piece-palette').style.display = 'flex'
        },
        onTacticsLoad: (puzzle) => {
          renderFn()
          u.showToast('Tactics: ' + puzzle.description, 'info')
          document.getElementById('tactics-desc').textContent = puzzle.description
        },
        onTacticsSolved: () => u.showToast('Puzzle Solved!', 'success'),
        onMoveMade: () => {
          if (SoundManager) SoundManager.playSound(g.history({ verbose: true }).pop(), g)
        }
      })
    }

    // Check for FEN in URL
    ClientUtils.checkFenInUrl(gameManager, uiManager)

    // Check for Auto Save
    if (autoSaveManager) {
      const savedState = autoSaveManager.checkForSavedGame()
      if (savedState) {
        // We found a saved game. Ideally we should prompt the user, but for "Crash Recovery" (Story 180),
        // we might want to just restore it or show a toast.
        // Let's restore it automatically for now, as per the story "Automatically restore...".
        // But we should prioritize FEN in URL if present.
        const urlParams = new URLSearchParams(window.location.search)
        if (!urlParams.has('fen')) {
          autoSaveManager.restoreGame(savedState)
          render()
        }
      }
    }

    socketHandler.connect()

    // Expose for testing
    window.gameManager = gameManager
    window.settingsManager = settingsManager

    window.ChessApp = {
      startMatch: (whiteConfig, blackConfig, onGameEnd) => {
        gameManager.callbacks.onGameOver = onGameEnd
        gameManager.engineAConfig = whiteConfig
        gameManager.engineBConfig = blackConfig
        gameManager.isDuelActive = true
        gameManager.startNewGame()
        applyEngineConfig(gameManager.engineAConfig)
        gameManager.sendPositionAndGo()
      }
    }
  } catch (err) {
    console.error('INIT APP ERROR', err)
  }
}

document.addEventListener('DOMContentLoaded', initApp)

if (typeof module !== 'undefined') {
  module.exports = initApp
}
