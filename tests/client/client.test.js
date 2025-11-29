/**
 * @jest-environment jsdom
 */

describe('client.js', () => {
  let instances = {}

  beforeAll(() => {
    // Mocks
    window.Chess = jest.fn(() => ({
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
        get: jest.fn()
    }))

    window.SocketHandler = jest.fn(function(cbs) { instances.socketHandler = this; this.callbacks = cbs; this.connect = jest.fn(); this.send = jest.fn() })
    window.UIManager = jest.fn(function(cbs) {
        instances.uiManager = this;
        this.callbacks = cbs;
        this.elements = {
            status: {},
            fenInput: {},
            analysisReportModal: { classList: { add: jest.fn() } },
            analysisSummary: {},
            analysisTable: {},
            topPlayerClock: {},
            bottomPlayerClock: {},
            animationSpeedSelect: { value: '0' }
        }
        this.logSystemMessage = jest.fn()
        this.logToOutput = jest.fn()
        this.updateSearchStats = jest.fn()
        this.showToast = jest.fn()
        this.parseOption = jest.fn()
        this.renderHistory = jest.fn()
        this.updateCapturedPieces = jest.fn()
    })
    window.GameManager = jest.fn(function(g, s, cbs) {
        instances.gameManager = this;
        this.callbacks = cbs;
        this.game = g;
        this.startNewGame = jest.fn();
        this.checkGameOver = jest.fn();
        this.undo = jest.fn();
        this.sendPositionAndGo = jest.fn();
        this.performMove = jest.fn();
        this.startingFen = 'startpos';
        this.whiteTime = 300000;
        this.blackTime = 300000;
    })
    window.BoardRenderer = jest.fn(function(el, g, cbs) {
        instances.boardRenderer = this;
        this.callbacks = cbs;
        this.render = jest.fn();
        this.setFlipped = jest.fn();
        this.setPieceSet = jest.fn();
        this.animateMove = jest.fn().mockResolvedValue();
    })
    window.AnalysisManager = jest.fn(function(g, s, cbs) {
        instances.analysisManager = this;
        this.callbacks = cbs;
        this.handleInfo = jest.fn();
        this.handleBestMove = jest.fn();
        this.startFullGameAnalysis = jest.fn();
        this.stopAnalysis = jest.fn();
    })
    window.TrainingManager = jest.fn(function(g, b, cbs) {
        instances.trainingManager = this;
        this.callbacks = cbs;
        this.startMemoryTraining = jest.fn();
        this.checkMemoryResult = jest.fn();
        this.stopMemoryTraining = jest.fn();
        this.startTacticsTrainer = jest.fn();
        this.nextTacticsPuzzle = jest.fn();
        this.startEndgame = jest.fn();
        this.startDailyPuzzle = jest.fn();
    })
    window.LeaderboardManager = jest.fn(function(u) {
        instances.leaderboardManager = this;
        this.renderLeaderboard = jest.fn();
        this.updateLeaderboard = jest.fn();
    })
    window.MoveHandler = jest.fn(function() {
        instances.moveHandler = this;
        this.handleSquareClick = jest.fn();
        this.handleDrop = jest.fn();
        this.checkAndExecutePremove = jest.fn();
    })

    window.ClientUtils = {
        parseInfo: jest.fn(),
        generate960Fen: jest.fn()
    }
    window.ArrowManager = { clearEngineArrows: jest.fn(), clearUserArrows: jest.fn() }
    window.SoundManager = { setEnabled: jest.fn(), playSound: jest.fn() }

    document.body.innerHTML = `
        <div id="status"></div>
        <div id="self-play-btn"></div>
        <div id="chessboard"></div>
        <input id="sound-enabled" type="checkbox" />
        <div id="piece-palette"></div>
        <div id="memory-timer"></div>
        <div id="tactics-desc"></div>
        <div id="engine-a-name"></div><div id="engine-a-elo"></div><input id="engine-a-limit" type="checkbox" />
        <div id="engine-b-name"></div><div id="engine-b-elo"></div><input id="engine-b-limit" type="checkbox" />
        <div id="endgame-controls"></div>
        <input id="auto-flip" type="checkbox" />
    `

    const initApp = require('../../public/client.js')

    // Trigger initialization directly
    initApp()
  })

  test('initializes all managers', () => {
      expect(window.SocketHandler).toHaveBeenCalled()
      expect(window.UIManager).toHaveBeenCalled()
      expect(window.GameManager).toHaveBeenCalled()
      expect(instances.socketHandler.connect).toHaveBeenCalled()
  })

  test('SocketHandler callbacks', () => {
      const cbs = instances.socketHandler.callbacks

      // onOpen
      cbs.onOpen()
      expect(instances.socketHandler.send).toHaveBeenCalledWith('uci')

      // onInfo
      window.ClientUtils.parseInfo.mockReturnValue({ depth: 10 })
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
      expect(window.ArrowManager.clearEngineArrows).toHaveBeenCalled()

      // onGameOver
      cbs.onGameOver('checkmate')
      expect(instances.uiManager.showToast).toHaveBeenCalledWith('Game Over: checkmate', 'info')
  })
})
