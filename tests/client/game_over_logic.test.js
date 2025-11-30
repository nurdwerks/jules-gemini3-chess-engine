/**
 * @jest-environment jsdom
 */

const fs = require('fs')
const path = require('path')

// Load local chess.js (v0.x) from public/libs
const chessScript = fs.readFileSync(path.resolve(__dirname, '../../public/libs/chess.js'), 'utf8')
// eslint-disable-next-line no-eval
eval(chessScript)
if (typeof exports !== 'undefined' && exports.Chess) window.Chess = exports.Chess

// Mock Dependencies
global.SocketHandler = class {
  constructor (callbacks) { this.callbacks = callbacks }
  connect () {}
  send () {}
}
global.LocalEngineManager = class {
  constructor (callbacks) { this.callbacks = callbacks }
  load () {}
  send () {}
}
global.CloudEngineManager = class {
  constructor (callbacks) { this.callbacks = callbacks }
  connect () {}
  disconnect () {}
  send () {}
}
global.EngineProxy = class {
  constructor (def) { this.active = def }
  setEngine (e) { this.active = e }
  getEngine () { return this.active }
  send (c) { if (this.active) this.active.send(c) }
}
global.BoardRenderer = class {
  render () {}
  setFlipped () {}
  setPieceSet () {}
}
global.GameManager = class {
  constructor (game, socket, callbacks) {
    this.game = game
    this.callbacks = callbacks
    this.engineAConfig = { name: 'A' }
    this.engineBConfig = { name: 'B' }
    this.whiteTime = 1000
    this.blackTime = 1000
    this.gameStarted = false
    this.clockInterval = 123
  }

  startNewGame () { this.gameStarted = true }
  checkGameOver () {}
  undo () {}
}
global.AnalysisManager = class {}
global.TrainingManager = class {}
global.ArrowManager = { clearUserArrows: jest.fn(), clearEngineArrows: jest.fn() }
global.SoundManager = {}
global.ClientUtils = { checkFenInUrl: jest.fn() }
global.MoveHandler = class {}
global.LeaderboardManager = class { updateLeaderboard () {} }
global.PgnManager = class {}
global.FenManager = class {}
global.BoardEditor = class { open () {} }
global.DeveloperManager = class {}
global.MoveListManager = class {}
global.OpeningExplorer = class {}
global.TreeManager = class {}
global.AccessibilityManager = class {}
global.SettingsManager = class {}
global.ExternalActions = class {}
global.AutoSaveManager = class { saveGame () {} checkForSavedGame () {} restoreGame () {} clearSave () {} }
global.InfoManager = class {}
global.VisualEffects = class { triggerShake () {} startConfetti () {} }
global.BatterySaver = class {}
global.LanguageManager = class { init () {} }

global.fetch = jest.fn().mockResolvedValue({ json: () => Promise.resolve({}) })

// Mock UIManager to capture calls
const showGameOverModalMock = jest.fn()
const showToastMock = jest.fn()
const logToOutputMock = jest.fn()
const parseOptionMock = jest.fn()
let uiCallbacks = {}

global.UIManager = class {
  constructor (callbacks) {
    uiCallbacks = callbacks
    this.elements = {
      status: { textContent: '' },
      localEngineFile: {},
      useLocalEngine: { checked: false, disabled: true },
      fenInput: { value: '' },
      pgnImportModal: { classList: { add: jest.fn(), remove: jest.fn() } },
      pgnInputArea: { value: '' },
      analysisReportModal: { classList: { add: jest.fn(), remove: jest.fn() } },
      analysisSummary: { textContent: '' },
      analysisTable: { innerHTML: '' },
      gameMode: { value: 'pve' },
      animationSpeedSelect: { value: '200' },
      gameOverModal: { classList: { add: jest.fn(), remove: jest.fn() } },
      gameOverResult: { textContent: '' },
      gameOverReason: { textContent: '' }
    }
  }

  showGameOverModal (result, reason) { showGameOverModalMock(result, reason) }
  showToast (msg, type) { showToastMock(msg, type) }
  logToOutput (msg) { logToOutputMock(msg) }
  parseOption (line, cb) { parseOptionMock(line, cb) }
  setThinking () {}
  updateSearchStats () {}
  renderAnalysisRow () {}
  updateAnalysisProgress () {}
  updateCapturedPieces () {}
  updateAvatars () {}
}

global.ChatManager = class { init () {} }
global.TutorialManager = class { start () {} }

const initApp = require('../../public/client.js')

describe('Game Over Logic', () => {
  let gameManager

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="status"></div>
      <div id="local-engine-file"></div>
      <input id="use-local-engine" type="checkbox" />
      <input id="cloud-engine-url" />
      <button id="connect-cloud-btn"></button>
      <input id="use-cloud-engine" type="checkbox" />
      <input id="fen-input">
      <div id="handicap-select" value="none"></div>
      <button id="self-play-btn"></button>
      <button id="board-editor-btn"></button>
      <div id="chessboard"></div>
      <select id="uci-preset-select"></select>
      <input type="checkbox" id="auto-flip">
      <input type="checkbox" id="auto-queen">
      <input type="checkbox" id="move-confirmation">
      <input type="checkbox" id="zen-mode">
      <input type="checkbox" id="blindfold-mode">
      <input type="checkbox" id="blindfold-training">
      <input type="checkbox" id="show-coords">
      <input type="checkbox" id="show-arrow-last">
      <input type="checkbox" id="show-threats">
      <input type="checkbox" id="analysis-mode">
      <select id="game-mode"><option value="pve">PvE</option></select>
      <select id="board-theme"></select>
      <select id="piece-set"></select>
      <select id="ui-theme"></select>
      <input type="range" id="board-size">
      <input id="history-notation-toggle">
    `
    // Ensure mocks are clear
    showGameOverModalMock.mockClear()

    // Initialize app
    initApp()
    gameManager = window.gameManager
  })

  test('Checkmate White Wins', () => {
    gameManager.callbacks.onGameOver({ winner: 'black', reason: 'Checkmate' })
    expect(showGameOverModalMock).toHaveBeenCalledWith('Black Wins!', 'Checkmate')
  })

  test('Stalemate Draw', () => {
    gameManager.callbacks.onGameOver({ winner: 'draw', reason: 'Stalemate' })
    expect(showGameOverModalMock).toHaveBeenCalledWith('Draw', 'Stalemate')
  })

  test('Timeout White', () => {
    gameManager.callbacks.onGameOver({ winner: 'black', reason: 'Timeout (White)' })
    expect(showGameOverModalMock).toHaveBeenCalledWith('Black Wins!', 'Timeout (White)')
  })

  test('Resignation', () => {
    gameManager.game.reset()
    gameManager.gameStarted = true

    uiCallbacks.onResign()

    expect(showGameOverModalMock).toHaveBeenCalledWith('Black Wins!', 'White Resigned')
  })
})
