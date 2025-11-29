/* eslint-env browser */
/* global Chess, SocketHandler, BoardRenderer, GameManager, AnalysisManager, TrainingManager, UIManager, ArrowManager, SoundManager, Chess960, DuelManager, ReplayManager, MoveHandler */

document.addEventListener('DOMContentLoaded', () => {
  const game = new Chess()

  // Shared State
  const state = {
    selectedSquare: null,
    legalMoves: [],
    currentViewIndex: -1,
    premove: null,
    pendingConfirmationMove: null,
    isFlipped: false
  }

  // --- 1. Initialize Managers ---

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
    onOption: (line) => uiManager.parseOption(line, (n, v) => sendOption(n, v)),
    onReadyOk: () => {
      if (!gameManager.gameStarted) gameManager.startNewGame()
    },
    onInfo: (msg) => {
      if (msg.includes('score cp') || msg.includes('mate')) {
        uiManager.logToOutput(msg)
      }
      const info = parseInfo(msg)
      if (info) {
        uiManager.updateSearchStats(info)
        analysisManager.handleInfo(info)
      }
    },
    onBestMove: (parts) => {
      analysisManager.handleBestMove()
      handleBestMove(parts)
    },
    onVoteMessage: (data) => handleVoteMessage(data)
  })

  const uiManager = new UIManager({
    onNewGame: () => gameManager.startNewGame(),
    onNew960: () => {
      const fen = Chess960.generateFen()
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
      uiManager.showToast('You resigned.', 'info')
      uiManager.logToOutput(`Game Over: ${game.turn() === 'w' ? 'White' : 'Black'} resigns.`)
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
    onReplayToggle: () => replayManager.toggleReplay(),
    onLoadFen: (fen) => {
      if (fen) {
        gameManager.startNewGame(fen)
        render()
      }
    },
    onCopyFen: () => {
      navigator.clipboard.writeText(game.fen())
      uiManager.showToast('FEN copied', 'success')
    },
    onLoadPgn: (pgn) => {
      if (game.load_pgn(pgn)) {
        gameManager.gameStarted = true
        render()
        uiManager.showToast('PGN loaded', 'success')
      } else {
        uiManager.showToast('Invalid PGN', 'error')
      }
    },
    onExportPgn: () => {
      const pgn = game.pgn()
      const blob = new Blob([pgn], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'game.pgn'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
    onStartDuel: () => duelManager.startDuel(),
    onArmageddon: () => {
      gameManager.isArmageddon = true
      gameManager.startNewGame('startpos')
      gameManager.whiteTime = 300000 // 5m
      gameManager.blackTime = 240000 // 4m
      uiManager.showToast('Armageddon Mode Started', 'info')
    },
    onMemoryTraining: () => trainingManager.startMemoryTraining(),
    onMemorySubmit: () => trainingManager.checkMemoryResult(),
    onMemoryGiveUp: () => {
      trainingManager.stopMemoryTraining()
      game.load(trainingManager.memoryTargetFen)
      render()
    },
    onTacticsTrainer: () => trainingManager.startTacticsTrainer(),
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
    onShowLeaderboard: () => duelManager.renderLeaderboard(),
    onResetLeaderboard: () => duelManager.resetLeaderboard(),
    onRepertoireBuilder: () => {}, // TODO
    onSaveRepertoire: () => {}, // TODO
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
      const board = document.getElementById('chessboard');
      ['theme-green', 'theme-blue', 'theme-wood', 'theme-glass', 'theme-newspaper', 'theme-custom'].forEach(cls => {
        board.classList.remove(cls)
      })
      if (theme !== 'classic') board.classList.add(`theme-${theme}`)
    },
    onPieceSetChange: (set) => {
      boardRenderer.setPieceSet(set)
      render()
    },
    getTurn: () => game.turn()
  })

  const boardRenderer = new BoardRenderer(document.getElementById('chessboard'), game, {
    onSquareClick: (row, col) => moveHandler.handleSquareClick(row, col),
    onDrop: (from, to) => moveHandler.handleDrop(from, to),
    isViewOnly: () => state.currentViewIndex !== -1
  })

  const gameManager = new GameManager(game, socketHandler, {
    onGameStart: () => {
      render()
      uiManager.showToast('New Game Started', 'info')
    },
    onMove: (result) => {
      render()
      if (result) {
        if (ArrowManager) ArrowManager.clearEngineArrows()
        if (document.getElementById('auto-flip').checked) {
          state.isFlipped = game.turn() === 'b'
          boardRenderer.setFlipped(state.isFlipped)
          render()
        }
      }
    },
    onGameOver: (result) => {
      uiManager.showToast(`Game Over: ${result}`, 'info')
      uiManager.logToOutput(`Game Over: ${result}`)
      if (gameManager.isDuelActive) {
        duelManager.updateLeaderboard(gameManager.engineAConfig.name, gameManager.engineBConfig.name, result)
      }
    },
    onClockUpdate: () => renderClocks()
  })

  const analysisManager = new AnalysisManager(game, socketHandler, {
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

  const trainingManager = new TrainingManager(game, boardRenderer, {
    onMemoryStart: (fen) => uiManager.showToast('Memorize this position!', 'info'),
    onMemoryTick: (time) => { document.getElementById('memory-timer').textContent = `Time: ${time}` },
    onMemoryReconstructionStart: () => {
      uiManager.showToast('Reconstruct the position!', 'info')
      document.getElementById('piece-palette').style.display = 'flex'
      renderPalette()
    },
    onTacticsLoad: (puzzle) => {
      render()
      uiManager.showToast('Tactics: ' + puzzle.description, 'info')
      document.getElementById('tactics-desc').textContent = puzzle.description
    },
    onTacticsSolved: () => uiManager.showToast('Puzzle Solved!', 'success'),
    onMoveMade: () => {
      if (SoundManager) SoundManager.playSound(game.history({ verbose: true }).pop(), game)
    }
  })

  const duelManager = new DuelManager(gameManager, socketHandler, uiManager)
  const replayManager = new ReplayManager(gameManager, game, () => render())
  const moveHandler = new MoveHandler(game, state, uiManager, boardRenderer, gameManager, trainingManager, () => render())

  // --- Helpers ---

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
    uiManager.renderHistory(game, state.currentViewIndex, (idx) => {
      gameManager.currentViewIndex = idx
      render()
    })
    renderClocks()
    uiManager.updateCapturedPieces(game, gameManager.startingFen, boardRenderer.currentPieceSet, state.isFlipped)
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
            duelManager.applyEngineConfig(config)
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
  }

  function parseInfo (msg) {
    const parts = msg.split(' ')
    const info = {}
    const getVal = (key) => {
      const idx = parts.indexOf(key)
      if (idx !== -1 && idx + 1 < parts.length) return parts[idx + 1]
      return null
    }
    info.depth = getVal('depth')
    info.nodes = getVal('nodes')
    info.nps = getVal('nps')
    const scoreCp = getVal('cp')
    const scoreMate = getVal('mate')
    if (scoreMate) info.score = { type: 'mate', value: parseInt(scoreMate) }
    else if (scoreCp) info.score = { type: 'cp', value: parseInt(scoreCp) }
    const pvIdx = parts.indexOf('pv')
    if (pvIdx !== -1) info.pv = parts.slice(pvIdx + 1)
    const wdlIdx = parts.indexOf('wdl')
    if (wdlIdx !== -1) info.wdl = [parts[wdlIdx + 1], parts[wdlIdx + 2], parts[wdlIdx + 3]]
    return info.depth || info.score || info.pv ? info : null
  }

  function renderClocks () {
    const format = (ms) => {
      const s = Math.ceil(ms / 1000)
      return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
    }
    const wTime = format(gameManager.whiteTime)
    const bTime = format(gameManager.blackTime)

    if (state.isFlipped) {
      uiManager.elements.topPlayerClock.textContent = wTime
      uiManager.elements.bottomPlayerClock.textContent = bTime
    } else {
      uiManager.elements.topPlayerClock.textContent = bTime
      uiManager.elements.bottomPlayerClock.textContent = wTime
    }
  }

  function renderPalette () {
    const palette = document.getElementById('piece-palette')
    palette.innerHTML = ''
    const pieces = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK']
    pieces.forEach(p => {
      const color = p[0]
      const type = p[1].toLowerCase()
      const div = document.createElement('div')
      div.classList.add('palette-piece')
      const img = document.createElement('img')
      img.src = `images/${boardRenderer.currentPieceSet}/${color}${type}.svg`
      div.appendChild(img)
      div.addEventListener('click', () => {
        document.querySelectorAll('.palette-piece').forEach(el => el.classList.remove('selected'))
        div.classList.add('selected')
        trainingManager.selectPalettePiece(color, type)
      })
      palette.appendChild(div)
    })
  }

  // --- Initialize ---
  if (document.getElementById('sound-enabled')) {
    SoundManager.setEnabled(document.getElementById('sound-enabled').checked)
    document.getElementById('sound-enabled').addEventListener('change', (e) => {
      SoundManager.setEnabled(e.target.checked)
    })
  }

  socketHandler.connect()

  // Export for Tournament
  window.ChessApp = {
    startMatch: (whiteConfig, blackConfig, onGameEnd) => {
      gameManager.callbacks.onGameOver = onGameEnd
      gameManager.engineAConfig = whiteConfig
      gameManager.engineBConfig = blackConfig
      gameManager.isDuelActive = true
      gameManager.startNewGame()
      duelManager.applyEngineConfig(gameManager.engineAConfig)
      gameManager.sendPositionAndGo()
    }
  }
})
