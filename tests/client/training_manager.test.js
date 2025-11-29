/**
 * @jest-environment jsdom
 */

const fs = require('fs')
const path = require('path')

const chessScript = fs.readFileSync(path.resolve(__dirname, '../../public/libs/chess.js'), 'utf8')
// eslint-disable-next-line no-eval
eval(chessScript)
if (typeof exports !== 'undefined' && exports.Chess) window.Chess = exports.Chess

describe('TrainingManager', () => {
  let TrainingManager
  let game
  let boardRenderer
  let callbacks
  let trainingManager

  beforeAll(() => {
    require('../../public/js/TrainingManager.js')
    TrainingManager = window.TrainingManager
  })

  beforeEach(() => {
    game = new window.Chess()
    boardRenderer = {
      render: jest.fn()
    }
    callbacks = {
      onMemoryStart: jest.fn(),
      onMemoryTick: jest.fn(),
      onMemoryReconstructionStart: jest.fn(),
      onTacticsLoad: jest.fn(),
      onTacticsSolved: jest.fn(),
      onMoveMade: jest.fn(),
      onEndgameStart: jest.fn()
    }
    trainingManager = new TrainingManager(game, boardRenderer, callbacks)
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('Memory Training: Flow', () => {
    trainingManager.startMemoryTraining()
    expect(trainingManager.isMemoryTraining).toBe(true)
    expect(callbacks.onMemoryStart).toHaveBeenCalled()

    // Timer ticks
    jest.advanceTimersByTime(1000)
    expect(callbacks.onMemoryTick).toHaveBeenCalledWith(4)

    // Timer finishes
    jest.advanceTimersByTime(5000) // 5 seconds total
    expect(callbacks.onMemoryReconstructionStart).toHaveBeenCalled()
    expect(game.fen()).toBe('8/8/8/8/8/8/8/8 w - - 0 1') // empty board
  })

  test('Memory Training: Placing pieces', () => {
    trainingManager.startMemoryTraining()
    // Skip to reconstruction
    jest.advanceTimersByTime(6000)

    trainingManager.selectPalettePiece('w', 'p')
    trainingManager.handleMemoryClick(4, 4, 'e4')
    expect(game.get('e4')).toEqual({ type: 'p', color: 'w' })

    trainingManager.selectedPalettePiece = null
    trainingManager.handleMemoryClick(4, 4, 'e4')
    expect(game.get('e4')).toBeNull()
  })

  test('Memory Training: Scoring', () => {
    trainingManager.memoryTargetFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    game.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')

    const res = trainingManager.checkMemoryResult()
    expect(res.score).toBe(100)
    expect(trainingManager.isMemoryTraining).toBe(false)

    game.remove('e2')
    trainingManager.isMemoryTraining = true
    const res2 = trainingManager.checkMemoryResult()
    expect(res2.score).toBeLessThan(100)
  })

  test('Tactics: Start and Load', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ fen: 'startpos', moves: ['e2e4'] }]
    })

    await trainingManager.startTacticsTrainer()
    expect(trainingManager.isTacticsMode).toBe(true)
    expect(callbacks.onTacticsLoad).toHaveBeenCalled()
  })

  test('Tactics: Handle Move', () => {
    const puzzle = { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', moves: ['e2e4', 'e7e5'] }
    trainingManager._loadPuzzle(puzzle)

    // Incorrect move
    const res = trainingManager.handleTacticsMove({ from: 'd2', to: 'd4' })
    expect(res).toBe(false)

    // Correct move
    const res2 = trainingManager.handleTacticsMove({ from: 'e2', to: 'e4' })
    expect(res2).toBe(true)

    // Opponent reply (delayed)
    jest.advanceTimersByTime(500)
    expect(game.fen()).toContain('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR')
    expect(callbacks.onMoveMade).toHaveBeenCalled()
  })

  test('Tactics: Solved', () => {
    const puzzle = { fen: 'startpos', moves: ['e2e4'] } // 1 move solution
    trainingManager._loadPuzzle(puzzle)

    trainingManager.handleTacticsMove({ from: 'e2', to: 'e4' })
    expect(callbacks.onTacticsSolved).toHaveBeenCalled()
  })

  test('Daily Puzzle', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        game: { pgn: '1. e4 e5' },
        puzzle: { solution: ['e2e4'], initialPly: 0, rating: 1500 }
      })
    })
    await trainingManager.startDailyPuzzle()
    expect(callbacks.onTacticsLoad).toHaveBeenCalled()
  })

  test('Endgame', () => {
    trainingManager.startEndgame('kp-vs-k')
    expect(callbacks.onEndgameStart).toHaveBeenCalled()
    expect(game.fen()).toContain('4k3')
  })
})
