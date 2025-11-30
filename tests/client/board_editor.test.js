/**
 * @jest-environment jsdom
 */

const fs = require('fs')
const path = require('path')

// Load dependencies
const chessScript = fs.readFileSync(path.resolve(__dirname, '../../public/libs/chess.js'), 'utf8')
// eslint-disable-next-line no-eval
eval(chessScript)
if (typeof exports !== 'undefined' && exports.Chess) window.Chess = exports.Chess

// Load ClientUtils
require('../../public/js/ClientUtils.js')

describe('BoardEditor', () => {
  let BoardEditor

  beforeAll(() => {
    require('../../public/js/BoardEditor.js')
    BoardEditor = window.BoardEditor
  })

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="board-editor-modal"></div>
      <div id="editor-board-container"></div>
      <div id="palette-w"></div>
      <div id="palette-b"></div>
      <button id="editor-trash-btn"></button>
      <button id="editor-clear-btn"></button>
      <button id="editor-startpos-btn"></button>
      <button id="load-position-btn"></button>
      <button id="close-board-editor-modal"></button>

      <input type="radio" name="editor-turn" value="w" checked>
      <input type="radio" name="editor-turn" value="b">

      <input type="checkbox" id="editor-castling-wk">
      <input type="checkbox" id="editor-castling-wq">
      <input type="checkbox" id="editor-castling-bk">
      <input type="checkbox" id="editor-castling-bq">

      <input type="text" id="editor-ep-target">
      <input type="number" id="editor-fullmove" value="1">
      <input type="number" id="editor-halfmove" value="0">
      <input type="text" id="editor-fen-output">
    `
    // Mock DataTransfer for drag events
    window.DataTransfer = class {
      constructor () { this.data = {} }
      setData (k, v) { this.data[k] = v }
      getData (k) { return this.data[k] }
    }
    // Stub alert
    window.alert = jest.fn()
  })

  test('initializes correctly with empty board', () => {
    const editor = new BoardEditor('board-editor-modal', jest.fn())
    expect(editor.board).toHaveLength(8)
    expect(editor.board[0]).toHaveLength(8)
    // Board should be empty initially as createEmptyBoard is called
    expect(editor.board[0][0]).toBeNull()
  })

  test('loadFen correctly populates board and settings', () => {
    const editor = new BoardEditor('board-editor-modal', jest.fn())
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    editor.loadFen(fen)

    // Check pieces
    expect(editor.board[0][0]).toEqual({ type: 'r', color: 'b' }) // a8
    expect(editor.board[7][4]).toEqual({ type: 'k', color: 'w' }) // e1

    // Check settings
    expect(document.querySelector('input[name="editor-turn"][value="w"]').checked).toBe(true)
    expect(document.getElementById('editor-castling-wk').checked).toBe(true)
    expect(document.getElementById('editor-castling-bq').checked).toBe(true)
    expect(document.getElementById('editor-fullmove').value).toBe('1')
  })

  test('generateFen produces valid FEN from board state', () => {
    const editor = new BoardEditor('board-editor-modal', jest.fn())
    // Manually set a piece
    editor.board[0][0] = { type: 'r', color: 'b' }
    editor.board[7][4] = { type: 'k', color: 'w' }

    const fen = editor.generateFen()
    // r7/8/8/8/8/8/8/4K3 w KQkq - 0 1 (assuming defaults for rights)
    expect(fen).toContain('r7/8/8/8/8/8/8/4K3')
    expect(fen).toContain('w')
  })

  test('trash mode removes piece on click', () => {
    const editor = new BoardEditor('board-editor-modal', jest.fn())
    editor.board[0][0] = { type: 'r', color: 'b' }

    // Enable trash
    editor.trashBtn.click()
    expect(editor.trashMode).toBe(true)

    // Click square (0,0)
    editor.handleSquareClick(0, 0)
    expect(editor.board[0][0]).toBeNull()
  })

  test('dropping new piece updates board', () => {
    const editor = new BoardEditor('board-editor-modal', jest.fn())
    const dt = new window.DataTransfer()
    dt.setData('application/json', JSON.stringify({
      type: 'add',
      piece: { color: 'w', type: 'q' }
    }))

    const mockEvent = {
      preventDefault: jest.fn(),
      dataTransfer: dt
    }

    editor.handleDrop(mockEvent, 4, 4) // e4
    expect(editor.board[4][4]).toEqual({ color: 'w', type: 'q' })
  })

  test('moving piece updates board', () => {
    const editor = new BoardEditor('board-editor-modal', jest.fn())
    // Place piece
    editor.board[0][0] = { color: 'w', type: 'k' }

    const dt = new window.DataTransfer()
    dt.setData('application/json', JSON.stringify({
      type: 'move',
      from: { r: 0, c: 0 }
    }))

    const mockEvent = {
      preventDefault: jest.fn(),
      dataTransfer: dt
    }

    editor.handleDrop(mockEvent, 1, 1) // b7 (row 1, col 1)

    expect(editor.board[0][0]).toBeNull()
    expect(editor.board[1][1]).toEqual({ color: 'w', type: 'k' })
  })
})
