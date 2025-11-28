const Board = require('../../src/Board')
const Piece = require('../../src/Piece')

describe('Stepping Pieces Movement (Story 1.3b)', () => {
  let board

  beforeEach(() => {
    board = new Board()
    board.loadFen('8/8/8/8/8/8/8/8 w - - 0 1')
  })

  // Helper to get moves in a friendly format
  const getMoves = () => {
    const moves = board.generateMoves()
    return moves.map(m => ({
      from: board.toRowCol(m.from),
      to: board.toRowCol(m.to),
      flags: m.flags
    }))
  }

  const findMove = (moves, r1, c1, r2, c2) => {
    return moves.find(m =>
      m.from.row === r1 && m.from.col === c1 &&
          m.to.row === r2 && m.to.col === c2
    )
  }

  // --- KNIGHT TESTS ---
  test('Knight moves in center', () => {
    // White Knight at d4 (4, 3)
    board.placePiece(4, 3, new Piece('white', 'knight'))
    board.activeColor = 'w'

    const moves = getMoves()
    // Should have up to 8 moves
    // Targets:
    // (2, 2), (2, 4) - Up 2
    // (6, 2), (6, 4) - Down 2
    // (3, 1), (5, 1) - Left 2
    // (3, 5), (5, 5) - Right 2
    expect(moves.length).toBe(8)
    expect(findMove(moves, 4, 3, 2, 2)).toBeTruthy()
    expect(findMove(moves, 4, 3, 6, 4)).toBeTruthy()
  })

  test('Knight moves on edge/corner', () => {
    // White Knight at a1 (7, 0)
    board.placePiece(7, 0, new Piece('white', 'knight'))
    board.activeColor = 'w'

    const moves = getMoves()
    // Targets: (5, 1) and (6, 2)
    expect(moves.length).toBe(2)
    expect(findMove(moves, 7, 0, 5, 1)).toBeTruthy()
    expect(findMove(moves, 7, 0, 6, 2)).toBeTruthy()
  })

  test('Knight captures and blocked', () => {
    // White Knight at d4 (4, 3)
    board.placePiece(4, 3, new Piece('white', 'knight'))
    // Own piece at (2, 2) - Blocked
    board.placePiece(2, 2, new Piece('white', 'pawn'))
    // Enemy piece at (2, 4) - Capture
    board.placePiece(2, 4, new Piece('black', 'pawn'))
    board.activeColor = 'w'

    const moves = getMoves()

    expect(findMove(moves, 4, 3, 2, 2)).toBeFalsy() // Blocked
    const capture = findMove(moves, 4, 3, 2, 4)
    expect(capture).toBeTruthy() // Capture
    expect(capture.flags).toContain('c')
  })

  // --- KING TESTS ---
  test('King moves in center', () => {
    // White King at d4 (4, 3)
    board.placePiece(4, 3, new Piece('white', 'king'))
    board.activeColor = 'w'

    const moves = getMoves()
    // 8 adjacent squares
    expect(moves.length).toBe(8)
    expect(findMove(moves, 4, 3, 3, 3)).toBeTruthy() // Up
    expect(findMove(moves, 4, 3, 5, 4)).toBeTruthy() // Down-Right
  })

  test('King captures and blocked', () => {
    // White King at d4 (4, 3)
    board.placePiece(4, 3, new Piece('white', 'king'))
    // Own piece at d3 (3, 3) - Blocked
    board.placePiece(3, 3, new Piece('white', 'pawn'))
    // Enemy piece at d5 (5, 3) - Capture
    board.placePiece(5, 3, new Piece('black', 'pawn'))
    board.activeColor = 'w'

    const moves = getMoves()

    expect(findMove(moves, 4, 3, 3, 3)).toBeFalsy() // Blocked
    const capture = findMove(moves, 4, 3, 5, 3)
    expect(capture).toBeTruthy()
    expect(capture.flags).toContain('c')
  })

  // --- PAWN TESTS ---
  test('White Pawn single and double push', () => {
    // White Pawn at e2 (6, 4) - Start position
    board.placePiece(6, 4, new Piece('white', 'pawn'))
    board.activeColor = 'w'

    const moves = getMoves()
    // Should have e3 (5, 4) and e4 (4, 4)
    expect(moves.length).toBe(2)
    expect(findMove(moves, 6, 4, 5, 4)).toBeTruthy()
    expect(findMove(moves, 6, 4, 4, 4)).toBeTruthy()
  })

  test('Black Pawn single and double push', () => {
    // Black Pawn at e7 (1, 4) - Start position
    board.placePiece(1, 4, new Piece('black', 'pawn'))
    board.activeColor = 'b'

    const moves = getMoves()
    // Should have e6 (2, 4) and e5 (3, 4)
    expect(moves.length).toBe(2)
    expect(findMove(moves, 1, 4, 2, 4)).toBeTruthy()
    expect(findMove(moves, 1, 4, 3, 4)).toBeTruthy()
  })

  test('Pawn blocked', () => {
    // White Pawn at e2 (6, 4)
    board.placePiece(6, 4, new Piece('white', 'pawn'))
    // Obstacle at e3 (5, 4)
    board.placePiece(5, 4, new Piece('black', 'pawn')) // Blocked by enemy
    board.activeColor = 'w'

    const moves = getMoves()
    // Should have 0 moves (blocked single push means blocked double push too)
    expect(moves.length).toBe(0)
  })

  test('Pawn blocked double push only', () => {
    // White Pawn at e2 (6, 4)
    board.placePiece(6, 4, new Piece('white', 'pawn'))
    // Obstacle at e4 (4, 4)
    board.placePiece(4, 4, new Piece('black', 'pawn'))
    board.activeColor = 'w'

    const moves = getMoves()
    // Should have 1 move (e3)
    expect(moves.length).toBe(1)
    expect(findMove(moves, 6, 4, 5, 4)).toBeTruthy()
    expect(findMove(moves, 6, 4, 4, 4)).toBeFalsy()
  })

  test('Pawn capture', () => {
    // White Pawn at e4 (4, 4)
    board.placePiece(4, 4, new Piece('white', 'pawn'))
    // Enemy at d5 (3, 3) - Capture Left
    board.placePiece(3, 3, new Piece('black', 'pawn'))
    // Enemy at f5 (3, 5) - Capture Right
    board.placePiece(3, 5, new Piece('black', 'pawn'))
    board.activeColor = 'w'

    const moves = getMoves()

    // e5 (3, 4) - Push
    expect(findMove(moves, 4, 4, 3, 4)).toBeTruthy()
    // d5 - Capture
    const cap1 = findMove(moves, 4, 4, 3, 3)
    expect(cap1).toBeTruthy()
    expect(cap1.flags).toContain('c')
    // f5 - Capture
    const cap2 = findMove(moves, 4, 4, 3, 5)
    expect(cap2).toBeTruthy()
    expect(cap2.flags).toContain('c')
  })

  test('Pawn cannot capture straight', () => {
    // White Pawn at e4 (4, 4)
    board.placePiece(4, 4, new Piece('white', 'pawn'))
    // Enemy at e5 (3, 4)
    board.placePiece(3, 4, new Piece('black', 'pawn'))
    board.activeColor = 'w'

    const moves = getMoves()
    expect(moves.length).toBe(0) // Blocked
  })
})
