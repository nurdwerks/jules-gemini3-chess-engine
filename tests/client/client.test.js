/**
 * @jest-environment jsdom
 */

describe('client.js', () => {
  const instances = {}

  beforeAll(() => {
    // Mocks
    global.Chess = jest.fn(() => ({
      board: jest.fn().mockReturnValue([]),
      history: jest.fn().mockReturnValue([]),
      turn: jest.fn().mockReturnValue('w'),
      fen: jest.fn().mockReturnValue('startpos'),
      game_over: jest.fn().mockReturnValue(false),
      load: jest.fn(),
      reset: jest.fn(),
      move: jest.fn(),
      pgn: jest.fn(),
      load_pgn: jest.fn(),
      get: jest.fn(),
      moves: jest.fn().mockReturnValue([])
    }))

    global.SocketHandler = jest.fn(function (cbs) { instances.socketHandler = this; this.callbacks = cbs; this.connect = jest.fn(); this.send = jest.fn() })
    global.UIManager = jest.fn(function (cbs) {
      instances.uiManager = this
      this.callbacks = cbs
      this.elements = {
        status: {},
        fenInput: {},
        analysisReportModal: { classList: { add: jest.fn() } },
        analysisSummary: {},
        analysisTable: {},
        topPlayerClock: {},
        bottomPlayerClock: {},
        animationSpeedSelect: { value: '0' },
        pgnInputArea: {},
        pgnImportModal: { classList: { add: jest.fn() } }
      }
      this.boardInfoRenderer = {
        updateClocks: jest.fn()
      }
      this.logSystemMessage = jest.fn()
      this.logToOutput = jest.fn()
      this.updateSearchStats = jest.fn()
      this.showToast = jest.fn()
      this.parseOption = jest.fn()
      this.renderHistory = jest.fn()
      this.updateCapturedPieces = jest.fn()
      this.setThinking = jest.fn()
      this.renderAnalysisRow = jest.fn()
      this.updateAnalysisProgress = jest.fn()
    })
    global.GameManager = jest.fn(function (g, s, cbs) {
      instances.gameManager = this
      this.callbacks = cbs
      this.game = g
      this.startNewGame = jest.fn()
      this.checkGameOver = jest.fn()
      this.undo = jest.fn()
      this.sendPositionAndGo = jest.fn()
      this.performMove = jest.fn()
      this.startingFen = 'startpos'
      this.whiteTime = 300000
      this.blackTime = 300000
    })
    global.BoardRenderer = jest.fn(function (el, g, cbs) {
      instances.boardRenderer = this
      this.callbacks = cbs
      this.render = jest.fn()
      this.setFlipped = jest.fn()
      this.setPieceSet = jest.fn()
      this.animateMove = jest.fn().mockResolvedValue()
    })
    global.AnalysisManager = jest.fn(function (g, s, cbs) {
      instances.analysisManager = this
      this.callbacks = cbs
      this.handleInfo = jest.fn()
      this.handleBestMove = jest.fn()
      this.startFullGameAnalysis = jest.fn()
      this.stopAnalysis = jest.fn()
      this.exportAnalysis = jest.fn()
      this.importAnalysis = jest.fn()
    })
    global.TrainingManager = jest.fn(function (g, b, cbs) {
      instances.trainingManager = this
      this.callbacks = cbs
      this.startMemoryTraining = jest.fn()
      this.checkMemoryResult = jest.fn()
      this.stopMemoryTraining = jest.fn()
      this.startTacticsTrainer = jest.fn()
      this.nextTacticsPuzzle = jest.fn()
      this.startEndgame = jest.fn()
      this.startDailyPuzzle = jest.fn()
    })
    global.LeaderboardManager = jest.fn(function (u) {
      instances.leaderboardManager = this
      this.renderLeaderboard = jest.fn()
      this.updateLeaderboard = jest.fn()
    })
    global.PgnManager = jest.fn(function () {
      instances.pgnManager = this
      this.importPgn = jest.fn()
      this.exportPgn = jest.fn()
      this.updateHeader = jest.fn()
      this.getHeaders = jest.fn()
      this.copyPgnToClipboard = jest.fn()
      this.downloadPgn = jest.fn()
    })
    global.FenManager = jest.fn(function () {
      instances.fenManager = this
      this.loadFen = jest.fn()
      this.copyFen = jest.fn()
      this.copyFenUrl = jest.fn()
    })
    global.BoardEditor = jest.fn(function () {
      instances.boardEditor = this
      this.open = jest.fn()
    })
    global.MoveHandler = jest.fn(function () {
      instances.moveHandler = this
      this.handleSquareClick = jest.fn()
      this.handleDrop = jest.fn()
      this.checkAndExecutePremove = jest.fn()
    })
    global.DeveloperManager = jest.fn(function () {
      instances.developerManager = this
      this.logPacket = jest.fn()
      this.handleMessage = jest.fn()
    })
    global.MoveListManager = jest.fn(function () {
      instances.moveListManager = this
      this.render = jest.fn()
    })
    global.OpeningExplorer = jest.fn(function () {
      instances.openingExplorer = this
      this.refresh = jest.fn()
      this.handleBookInfo = jest.fn()
    })
    global.TreeManager = jest.fn(function () {
      instances.treeManager = this
      this.onTreeReady = jest.fn()
    })
    global.AccessibilityManager = jest.fn(function (gm, um, render) {
      instances.accessibilityManager = this
      this.announceMove = jest.fn()
      this.setVoiceAnnounce = jest.fn()
      this.setVoiceControl = jest.fn()
    })

    global.ClientUtils = {
      parseInfo: jest.fn(),
      generate960Fen: jest.fn()
    }
    global.ArrowManager = { clearEngineArrows: jest.fn(), clearUserArrows: jest.fn() }
    global.SoundManager = { setEnabled: jest.fn(), playSound: jest.fn(), setVolume: jest.fn(), loadSoundPack: jest.fn() }

    // Mock document elements
    document.body.innerHTML = `
        <div id="status"></div>
        <div id="self-play-btn"></div>
        <div id="chessboard"></div>
        <input id="sound-enabled" type="checkbox" />
        <input id="volume-control" type="range" />
        <input id="voice-announce" type="checkbox" />
        <input id="voice-control" type="checkbox" />
        <input id="high-contrast" type="checkbox" />
        <input id="sound-pack-upload" type="file" />
        <div id="piece-palette"></div>
        <div id="memory-timer"></div>
        <div id="tactics-desc"></div>
        <div id="engine-a-name"></div><div id="engine-a-elo"></div><input id="engine-a-limit" type="checkbox" />
        <div id="engine-b-name"></div><div id="engine-b-elo"></div><input id="engine-b-limit" type="checkbox" />
        <div id="endgame-controls"></div>
        <input id="auto-flip" type="checkbox" />
        <select id="handicap-select"><option value="none">None</option></select>
        <button id="board-editor-btn"></button>
    `

    const initApp = require('../../public/client.js')

    // Trigger initialization directly
    initApp()
  })

  test('initializes all managers', () => {
    expect(global.SocketHandler).toHaveBeenCalled()
    expect(global.UIManager).toHaveBeenCalled()
    expect(global.GameManager).toHaveBeenCalled()
    expect(global.AccessibilityManager).toHaveBeenCalled()
    expect(instances.socketHandler.connect).toHaveBeenCalled()
  })

  test('SocketHandler callbacks', () => {
    const cbs = instances.socketHandler.callbacks

    // onOpen
    cbs.onOpen()
    expect(instances.socketHandler.send).toHaveBeenCalledWith('uci')

    // onInfo
    global.ClientUtils.parseInfo.mockReturnValue({ depth: 10 })
    cbs.onInfo('info depth 10')
    expect(instances.uiManager.updateSearchStats).toHaveBeenCalled()
    expect(instances.analysisManager.handleInfo).toHaveBeenCalled()

    // onBestMove
    cbs.onBestMove(['bestmove', 'e2e4'])
    expect(instances.analysisManager.handleBestMove).toHaveBeenCalled()
  })

  test('UIManager callbacks', () => {
    const cbs = instances.uiManager.callbacks

    // onNewGame
    cbs.onNewGame()
    expect(instances.gameManager.startNewGame).toHaveBeenCalled()

    // onFlipBoard
    cbs.onFlipBoard()
    expect(instances.boardRenderer.setFlipped).toHaveBeenCalled()

    // onResign
    cbs.onResign()
    expect(instances.gameManager.checkGameOver).toHaveBeenCalled()

    // onAnalysisModeChange
    cbs.onAnalysisModeChange(true)
    expect(instances.gameManager.sendPositionAndGo).toHaveBeenCalled()
  })

  test('GameManager callbacks', () => {
    const cbs = instances.gameManager.callbacks

    // onGameStart
    cbs.onGameStart()
    expect(instances.uiManager.showToast).toHaveBeenCalledWith('New Game Started', 'info')

    // onMove
    cbs.onMove(true)
    expect(global.ArrowManager.clearEngineArrows).toHaveBeenCalled()

    // onGameOver
    cbs.onGameOver('checkmate')
    expect(instances.uiManager.showToast).toHaveBeenCalledWith('Game Over: checkmate', 'info')
  })
})
