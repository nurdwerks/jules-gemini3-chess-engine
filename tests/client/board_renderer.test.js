/**
 * @jest-environment jsdom
 */

const fs = require('fs')
const path = require('path')

// Load local chess.js
const chessScript = fs.readFileSync(path.resolve(__dirname, '../../public/libs/chess.js'), 'utf8')
// eslint-disable-next-line no-eval
eval(chessScript)
if (typeof exports !== 'undefined' && exports.Chess) window.Chess = exports.Chess

describe('BoardRenderer', () => {
  let BoardRenderer
  let boardElement
  let game
  let callbacks

  beforeAll(() => {
    // Mock global dependencies
    global.ClientUtils = {
      coordsToAlgebraic: (r, c) => {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        const rank = 8 - r
        return files[c] + rank
      }
    }

    global.ArrowManager = {
      getUserHighlight: jest.fn(),
      clearLastMoveArrow: jest.fn(),
      setLastMoveArrow: jest.fn()
    }

    global.VisualizationManager = {
      calculate: jest.fn(),
      getHighlights: jest.fn().mockReturnValue([]),
      getOpacity: jest.fn()
    }

    require('../../public/js/BoardRenderer.js')
    BoardRenderer = window.BoardRenderer
  })

  beforeEach(() => {
    boardElement = document.createElement('div')
    game = new window.Chess()
    callbacks = {
      onSquareClick: jest.fn(),
      onDrop: jest.fn()
    }
  })

  test('initializes correctly', () => {
    const renderer = new BoardRenderer(boardElement, game, callbacks)
    expect(renderer.boardElement).toBe(boardElement)
    expect(renderer.currentPieceSet).toBe('cburnett')
  })

  test('renders board squares and pieces', () => {
    const renderer = new BoardRenderer(boardElement, game, callbacks)
    const state = {
      board: game.board(),
      chess: game,
      selectedSquare: null,
      legalMoves: [],
      currentViewIndex: -1
    }

    renderer.render(state)

    expect(boardElement.children.length).toBe(64)
    const e4 = boardElement.querySelector('.square[data-alg="e4"]')
    expect(e4).not.toBeNull()

    const a1 = boardElement.querySelector('.square[data-alg="a1"]')
    expect(a1.querySelector('.piece')).not.toBeNull() // Rook
  })

  test('handles click events', () => {
    const renderer = new BoardRenderer(boardElement, game, callbacks)
    const state = {
      board: game.board(),
      chess: game,
      legalMoves: []
    }
    renderer.render(state)

    const e2 = boardElement.querySelector('.square[data-alg="e2"]')
    e2.click()
    expect(callbacks.onSquareClick).toHaveBeenCalled()
  })

  test('handles drag and drop', () => {
    const renderer = new BoardRenderer(boardElement, game, callbacks)
    const state = {
      board: game.board(),
      chess: game,
      legalMoves: []
    }
    renderer.render(state)

    const e2Piece = boardElement.querySelector('.square[data-alg="e2"] .piece')
    const e4Square = boardElement.querySelector('.square[data-alg="e4"]')

    // Drag start
    const dataTransfer = { setData: jest.fn(), effectAllowed: '' }
    const startEvent = new Event('dragstart', { bubbles: true })
    startEvent.dataTransfer = dataTransfer
    Object.defineProperty(startEvent, 'target', { value: e2Piece })
    e2Piece.dispatchEvent(startEvent)

    expect(renderer.draggedPiece).toBe(e2Piece)
    expect(renderer.draggedFrom).toBe('e2')

    // Drop
    const dropEvent = new Event('drop', { bubbles: true })
    // Need to make sure target resolves to closest .square
    Object.defineProperty(dropEvent, 'target', { value: e4Square })
    e4Square.dispatchEvent(dropEvent)

    expect(callbacks.onDrop).toHaveBeenCalledWith('e2', 'e4')
  })

  test('updates flipped state', () => {
    const renderer = new BoardRenderer(boardElement, game, callbacks)
    renderer.setFlipped(true)
    expect(boardElement.classList.contains('flipped')).toBe(true)
    renderer.setFlipped(false)
    expect(boardElement.classList.contains('flipped')).toBe(false)
  })

  test('adds coordinates', () => {
     const renderer = new BoardRenderer(boardElement, game, callbacks)
     renderer.showCoords = true
     renderer.render({ board: game.board(), chess: game, legalMoves: [] })

     // Rank 8 on a8 (row 0, col 0)
     const a8 = boardElement.querySelector('.square[data-alg="a8"]')
     expect(a8.querySelector('.rank')).not.toBeNull()

     // File h on h1 (row 7, col 7)
     const h1 = boardElement.querySelector('.square[data-alg="h1"]')
     expect(h1.querySelector('.file')).not.toBeNull()
  })

  test('highlights last move', () => {
    const renderer = new BoardRenderer(boardElement, game, callbacks)
    game.move('e4')
    const state = {
       board: game.board(),
       chess: game,
       legalMoves: [],
       currentViewIndex: -1
    }
    renderer.render(state)

    const e2 = boardElement.querySelector('.square[data-alg="e2"]')
    const e4 = boardElement.querySelector('.square[data-alg="e4"]')
    expect(e2.classList.contains('last-move')).toBe(true)
    expect(e4.classList.contains('last-move')).toBe(true)
  })

  test('handles drag enter/leave', () => {
    const renderer = new BoardRenderer(boardElement, game, callbacks)
    renderer.render({ board: game.board(), chess: game, legalMoves: [], currentViewIndex: -1 })

    const square = boardElement.querySelector('.square')

    // Drag Enter
    // Mock target.closest
    const eventEnter = new Event('dragenter', { bubbles: true })
    Object.defineProperty(eventEnter, 'target', { value: square })
    square.dispatchEvent(eventEnter)
    expect(square.classList.contains('drag-target')).toBe(true)

    // Drag Leave
    const eventLeave = new Event('dragleave', { bubbles: true })
    Object.defineProperty(eventLeave, 'target', { value: square })
    square.dispatchEvent(eventLeave)
    expect(square.classList.contains('drag-target')).toBe(false)
  })
})
