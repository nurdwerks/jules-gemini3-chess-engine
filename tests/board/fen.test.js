const Board = require('../../src/Board')
const Piece = require('../../src/Piece')

describe('FEN Parsing and Generation', () => {
  let board

  beforeEach(() => {
    board = new Board()
  })

  test('loadFen should correctly load the starting position', () => {
    const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    board.loadFen(startFen)

    // Check corners
    expect(board.getPiece(0, 0)).toEqual(expect.objectContaining({ type: 'rook', color: 'black' }))
    expect(board.getPiece(0, 7)).toEqual(expect.objectContaining({ type: 'rook', color: 'black' }))
    expect(board.getPiece(7, 0)).toEqual(expect.objectContaining({ type: 'rook', color: 'white' }))
    expect(board.getPiece(7, 7)).toEqual(expect.objectContaining({ type: 'rook', color: 'white' }))

    // Check pawns
    expect(board.getPiece(1, 0)).toEqual(expect.objectContaining({ type: 'pawn', color: 'black' }))
    expect(board.getPiece(6, 0)).toEqual(expect.objectContaining({ type: 'pawn', color: 'white' }))

    // Check empty middle
    expect(board.getPiece(4, 4)).toBeNull()

    // Check state
    expect(board.activeColor).toBe('w')
    expect(board.castlingRights).toBe('KQkq')
    expect(board.enPassantTarget).toBe('-')
    expect(board.halfMoveClock).toBe(0)
    expect(board.fullMoveNumber).toBe(1)
  })

  test('loadFen should load a custom position', () => {
    // A random position: White to move, no castling for black, en passant available at e6
    const fen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2'
    board.loadFen(fen)

    expect(board.getPiece(4, 4)).toEqual(expect.objectContaining({ type: 'pawn', color: 'white' })) // e4
    expect(board.getPiece(3, 2)).toEqual(expect.objectContaining({ type: 'pawn', color: 'black' })) // c5

    expect(board.activeColor).toBe('w')
    expect(board.castlingRights).toBe('KQkq')
    expect(board.enPassantTarget).toBe('c6')
    expect(board.halfMoveClock).toBe(0)
    expect(board.fullMoveNumber).toBe(2)
  })

  test('loadFen should throw error for invalid FEN string', () => {
    // Not enough fields (less than 4)
    expect(() => board.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq')).toThrow()

    // Invalid rank count
    expect(() => board.loadFen('8/8/8/8/8/8/8/8/8 w - - 0 1')).toThrow()

    // Invalid piece char
    expect(() => board.loadFen('8/8/8/8/8/8/8/X7 w - - 0 1')).toThrow()
  })

  test('loadFen should accept 4 fields (EPD)', () => {
    board.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -')
    expect(board.halfMoveClock).toBe(0)
    expect(board.fullMoveNumber).toBe(1)
  })

  test('generateFen should return correct FEN for starting position', () => {
    // Note: The Board constructor currently calls setupBoard, which sets up a partial board.
    // We should clear it and load the full start FEN first to test generation of the standard start.
    const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    board.loadFen(startFen)

    expect(board.generateFen()).toBe(startFen)
  })

  test('generateFen should return correct FEN for custom position', () => {
    const fen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR b KQkq c6 0 2'
    board.loadFen(fen)
    expect(board.generateFen()).toBe(fen)
  })

  test('Round trip consistency', () => {
    const fen = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3'
    board.loadFen(fen)
    const generated = board.generateFen()
    expect(generated).toBe(fen)

    board.loadFen(generated)
    expect(board.generateFen()).toBe(fen)
  })
})
