/**
 * @jest-environment jsdom
 */

const fs = require('fs')
const path = require('path')

const chessScript = fs.readFileSync(path.resolve(__dirname, '../../public/libs/chess.js'), 'utf8')
// eslint-disable-next-line no-eval
eval(chessScript)
if (typeof exports !== 'undefined' && exports.Chess) window.Chess = exports.Chess

describe('MoveHandler', () => {
  let MoveHandler
  let game
  let gameManager
  let uiManager
  let boardRenderer
  let trainingManager
  let state
  let renderCallback
  let moveHandler

  beforeAll(() => {
    global.ClientUtils = {
      coordsToAlgebraic: (r, c) => {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        const rank = 8 - r
        return files[c] + rank
      }
    }
    require('../../public/js/MoveHandler.js')
    MoveHandler = window.MoveHandler
  })

  beforeEach(() => {
    game = new window.Chess()
    gameManager = {
      performMove: jest.fn().mockReturnValue(true),
      sendPositionAndGo: jest.fn(),
      gameMode: 'pve'
    }
    uiManager = {
      showToast: jest.fn(),
      showPromotionModal: jest.fn().mockResolvedValue('q'),
      elements: {
        animationSpeedSelect: { value: '0' }
      }
    }
    boardRenderer = {
      animateMove: jest.fn().mockResolvedValue(),
      currentPieceSet: 'cburnett'
    }
    trainingManager = {
      isMemoryTraining: false,
      handleMemoryClick: jest.fn(),
      isTacticsMode: false,
      handleTacticsMove: jest.fn()
    }
    state = {
      currentViewIndex: -1,
      selectedSquare: null,
      legalMoves: [],
      premove: null,
      pendingConfirmationMove: null
    }
    renderCallback = jest.fn()

    moveHandler = new MoveHandler(game, gameManager, uiManager, boardRenderer, trainingManager, state, renderCallback)

    document.body.innerHTML = '<input type="checkbox" id="move-confirmation" /><input type="checkbox" id="auto-queen" />'
  })

  test('handleSquareClick selects piece', () => {
    moveHandler.handleSquareClick(6, 4) // e2
    expect(state.selectedSquare).toEqual({ row: 6, col: 4 })
    expect(state.legalMoves.length).toBeGreaterThan(0)
    expect(renderCallback).toHaveBeenCalled()
  })

  test('handleSquareClick attempts move', async () => {
    moveHandler.handleSquareClick(6, 4) // e2
    await moveHandler.handleSquareClick(4, 4) // e4
    expect(gameManager.performMove).toHaveBeenCalled()
    expect(state.selectedSquare).toBeNull()
  })

  test('handleDrop executes move', async () => {
    await moveHandler.handleDrop('e2', 'e4')
    expect(gameManager.performMove).toHaveBeenCalled()
  })

  test('handles promotion with modal', async () => {
    game.load('7k/P7/8/8/8/8/8/7K w - - 0 1')
    await moveHandler.handleDrop('a7', 'a8')
    expect(uiManager.showPromotionModal).toHaveBeenCalled()
    expect(gameManager.performMove).toHaveBeenCalledWith(expect.objectContaining({ promotion: 'q' }), true)
  })

  test('handles move confirmation', async () => {
    document.getElementById('move-confirmation').checked = true
    moveHandler.handleSquareClick(6, 4)
    await moveHandler.handleSquareClick(4, 4)

    expect(state.pendingConfirmationMove).not.toBeNull()
    expect(uiManager.showToast).toHaveBeenCalledWith('Click again to confirm move', 'info')
    expect(gameManager.performMove).not.toHaveBeenCalled()

    await moveHandler.handleSquareClick(4, 4)
    expect(gameManager.performMove).toHaveBeenCalled()
  })

  test('handles tactics mode', async () => {
    trainingManager.isTacticsMode = true
    trainingManager.handleTacticsMove.mockReturnValue(true)
    await moveHandler.handleDrop('e2', 'e4')
    expect(trainingManager.handleTacticsMove).toHaveBeenCalled()
    expect(gameManager.performMove).not.toHaveBeenCalled()
  })

  test('sets premove manually', async () => {
    // Manually trigger attemptMove with a "premove" (wrong turn color)
    const move = { from: 'e7', to: 'e5', color: 'b', flags: 'n', piece: 'p', san: 'e5' }
    // Game turn is 'w'

    await moveHandler.attemptMove(move)

    expect(state.premove).toBe(move)
    expect(uiManager.showToast).toHaveBeenCalledWith('Premove set', 'info')
    expect(gameManager.performMove).not.toHaveBeenCalled()
  })

  test('executes premove', async () => {
    // White turn. Set premove for Black (e7-e5).
    state.premove = { from: 'e7', to: 'e5', color: 'b' }

    // Make white move e4
    game.move('e4')

    await moveHandler.checkAndExecutePremove()

    expect(gameManager.performMove).toHaveBeenCalledWith(expect.objectContaining({ from: 'e7', to: 'e5' }), true)
    expect(state.premove).toBeNull()
  })

  test('handles memory training click', () => {
    trainingManager.isMemoryTraining = true
    moveHandler.handleSquareClick(6, 4)
    expect(trainingManager.handleMemoryClick).toHaveBeenCalled()
  })
})
