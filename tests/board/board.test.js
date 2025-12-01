const Board = require('../../src/engine/Board')

test('initial board state', () => {
  const board = new Board()

  // Check white pawns
  for (let i = 0; i < 8; i++) {
    const piece = board.getPiece(6, i)
    expect(piece).toBeDefined()
    expect(piece.color).toBe('white')
    expect(piece.type).toBe('pawn')
  }

  // Check black pawns
  for (let i = 0; i < 8; i++) {
    const piece = board.getPiece(1, i)
    expect(piece).toBeDefined()
    expect(piece.color).toBe('black')
    expect(piece.type).toBe('pawn')
  }

  // Check rooks
  expect(board.getPiece(7, 0).type).toBe('rook')
  expect(board.getPiece(7, 7).type).toBe('rook')
  expect(board.getPiece(0, 0).type).toBe('rook')
  expect(board.getPiece(0, 7).type).toBe('rook')

  // Check empty space
  expect(board.getPiece(3, 3)).toBeNull()
})
