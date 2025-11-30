/**
 * @jest-environment jsdom
 */

/* global GraphManager, SoundManager */

const fs = require('fs')
const path = require('path')

// Load local chess.js (v0.x) from public/libs
const chessScript = fs.readFileSync(path.resolve(__dirname, '../../public/libs/chess.js'), 'utf8')
// eslint-disable-next-line no-eval
eval(chessScript)
// eslint-disable-next-line no-undef
if (typeof exports !== 'undefined' && exports.Chess) window.Chess = exports.Chess

// Mock dependencies
global.SoundManager = { playSound: jest.fn(), playTick: jest.fn() }
global.GraphManager = {
  renderEvalGraph: jest.fn(),
  renderMaterialGraph: jest.fn(),
  renderTimeGraph: jest.fn(),
  renderTensionGraph: jest.fn(),
  renderNpsGraph: jest.fn()
}

describe('GameManager', () => {
  let GameManager
  let socketHandlerMock
  let game

  beforeAll(() => {
    require('../../public/js/GameManager.js')
    GameManager = window.GameManager
  })

  beforeEach(() => {
    // window.Chess should be defined by the eval above
    game = new window.Chess()
    socketHandlerMock = { send: jest.fn() }
    jest.clearAllMocks()
  })

  test('initializes correctly', () => {
    const gm = new GameManager(game, socketHandlerMock)
    expect(gm.game).toBe(game)
    expect(gm.startingFen).toBe('startpos')
  })

  test('startNewGame resets game and stats', () => {
    const gm = new GameManager(game, socketHandlerMock)
    gm.startNewGame()
    expect(game.fen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    expect(socketHandlerMock.send).toHaveBeenCalledWith('ucinewgame')
    expect(gm.gameStarted).toBe(true)
    expect(GraphManager.renderEvalGraph).toHaveBeenCalled()
  })

  test('startNewGame with custom FEN', () => {
    const gm = new GameManager(game, socketHandlerMock)
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
    gm.startNewGame(fen)
    expect(game.fen()).toBe(fen)
    expect(gm.startingFen).toBe(fen)
  })

  test('performMove updates state and checks game over', () => {
    const gm = new GameManager(game, socketHandlerMock)
    gm.startNewGame()
    const result = gm.performMove({ from: 'e2', to: 'e4' })
    expect(result).toBeTruthy()
    expect(game.fen()).not.toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    expect(gm.timeHistory).toHaveLength(1)
    expect(SoundManager.playSound).toHaveBeenCalled()
  })

  test('undo reverts move', () => {
    const gm = new GameManager(game, socketHandlerMock)
    gm.startNewGame()
    gm.performMove({ from: 'e2', to: 'e4' })
    gm.undo()
    expect(game.fen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  })

  test('clock updates', () => {
    jest.useFakeTimers()
    const gm = new GameManager(game, socketHandlerMock)
    gm.startNewGame()
    const initialTime = gm.whiteTime
    jest.advanceTimersByTime(200)
    // Clock updates every 100ms
    // whiteTime should decrease
    expect(gm.whiteTime).toBeLessThan(initialTime)
    jest.useRealTimers()
    if (gm.clockInterval) clearInterval(gm.clockInterval)
  })

  test('checkGameOver detects timeout', () => {
    const onGameOver = jest.fn()
    const gm = new GameManager(game, socketHandlerMock, { onGameOver })
    gm.startNewGame()
    gm.whiteTime = 0
    gm.checkGameOver()
    expect(onGameOver).toHaveBeenCalledWith({ winner: 'black', reason: 'Timeout (White)' })
    expect(gm.gameStarted).toBe(false)
  })

  test('sendPositionAndGo constructs correct command', () => {
    const gm = new GameManager(game, socketHandlerMock)
    gm.startNewGame()
    gm.performMove({ from: 'e2', to: 'e4' })
    gm.sendPositionAndGo()
    expect(socketHandlerMock.send).toHaveBeenCalledWith('position startpos moves e2e4')
    expect(socketHandlerMock.send).toHaveBeenCalledWith(expect.stringContaining('go wtime'))
  })
})
