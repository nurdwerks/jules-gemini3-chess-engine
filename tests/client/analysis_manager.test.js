/**
 * @jest-environment jsdom
 */

const fs = require('fs')
const path = require('path')

const chessScript = fs.readFileSync(path.resolve(__dirname, '../../public/libs/chess.js'), 'utf8')
// eslint-disable-next-line no-eval
eval(chessScript)
if (typeof exports !== 'undefined' && exports.Chess) window.Chess = exports.Chess

describe('AnalysisManager', () => {
  let AnalysisManager
  let game
  let gameManager
  let socketHandler
  let callbacks
  let analysisManager

  beforeAll(() => {
    require('../../public/js/AnalysisManager.js')
    AnalysisManager = window.AnalysisManager
  })

  beforeEach(() => {
    game = new window.Chess()
    gameManager = {
      moveMetadata: []
    }
    socketHandler = {
      send: jest.fn()
    }
    callbacks = {
      onError: jest.fn(),
      onStart: jest.fn(),
      onStepComplete: jest.fn(),
      onComplete: jest.fn()
    }
    analysisManager = new AnalysisManager(game, gameManager, socketHandler, callbacks)
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('startFullGameAnalysis handles empty history', () => {
    analysisManager.startFullGameAnalysis()
    expect(callbacks.onError).toHaveBeenCalledWith('No game to analyze')
  })

  test('startFullGameAnalysis queues tasks', () => {
    game.move('e4')
    game.move('e5')

    analysisManager.startFullGameAnalysis()

    expect(analysisManager.isFullAnalysis).toBe(true)
    expect(analysisManager.analysisQueue.length).toBe(2)
    expect(callbacks.onStart).toHaveBeenCalledWith(2)
    expect(socketHandler.send).toHaveBeenCalledWith('setoption name MultiPV value 3')

    // Advance to trigger _runNextAnalysis
    jest.advanceTimersByTime(100)

    expect(socketHandler.send).toHaveBeenCalledWith(expect.stringContaining('position fen'))
    expect(socketHandler.send).toHaveBeenCalledWith('go depth 12')
  })

  test('handleInfo collects scores', () => {
    analysisManager.isFullAnalysis = true

    analysisManager.handleInfo({ multipv: '1', score: { type: 'cp', value: 50 }, pv: ['e2e4'] })
    expect(analysisManager.currentAnalysisInfo[1]).toEqual({ score: { type: 'cp', value: 50 }, move: 'e2e4', pv: ['e2e4'] })

    analysisManager.handleInfo({ multipv: '2', score: { type: 'cp', value: 10 }, pv: ['d2d4'] })
    expect(analysisManager.currentAnalysisInfo[2]).toEqual({ score: { type: 'cp', value: 10 }, move: 'd2d4', pv: ['d2d4'] })
  })

  test('handleBestMove processes step and moves to next', () => {
    game.move('e4')
    analysisManager.startFullGameAnalysis()
    jest.advanceTimersByTime(100)

    // Simulate engine info
    // e2e4 is played move.
    // Suppose best move is e2e4 (score 50)
    analysisManager.handleInfo({ multipv: '1', score: { type: 'cp', value: 50 }, pv: ['e2e4'] })

    // Trigger bestmove
    analysisManager.handleBestMove()

    expect(callbacks.onStepComplete).toHaveBeenCalled()
    const result = callbacks.onStepComplete.mock.calls[0][1]
    expect(result.best).toBe('e2e4')
    expect(result.played).toBe('e2e4')
    expect(result.diff).toBe(0) // 50 - 50

    expect(analysisManager.analysisQueue.length).toBe(0) // Finished

    // Should finish
    expect(callbacks.onComplete).toHaveBeenCalled()
    expect(socketHandler.send).toHaveBeenCalledWith('setoption name MultiPV value 1')
  })

  test('calculates diff correctly when played move is not best', () => {
    game.move('h3') // bad move
    analysisManager.startFullGameAnalysis()
    jest.advanceTimersByTime(100)

    // Best is e4 (50), Played is h3 (-10)
    analysisManager.handleInfo({ multipv: '1', score: { type: 'cp', value: 50 }, pv: ['e2e4'] })
    analysisManager.handleInfo({ multipv: '2', score: { type: 'cp', value: -10 }, pv: ['h2h3'] })

    analysisManager.handleBestMove()

    const result = callbacks.onStepComplete.mock.calls[0][1]
    expect(result.best).toBe('e2e4')
    expect(result.played).toBe('h2h3')
    expect(result.diff).toBe(60) // 50 - (-10)

    // Check auto-annotation
    expect(gameManager.moveMetadata[0]).toBeDefined()
    // Diff 60 is > 50, so ?!
    expect(gameManager.moveMetadata[0].annotation).toBe('?!')
  })

  test('stopAnalysis', () => {
    analysisManager.stopAnalysis()
    expect(analysisManager.isFullAnalysis).toBe(false)
    expect(socketHandler.send).toHaveBeenCalledWith('setoption name MultiPV value 1')
  })
})
