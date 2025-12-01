const Board = require('../../src/engine/Board')
const Piece = require('../../src/engine/Piece')

describe('Sliding Pieces Movement (Story 1.3a)', () => {
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
      flags: m.flags // e.g., 'c' for capture, 'n' for normal (quiet)
    }))
  }

  const findMove = (moves, r1, c1, r2, c2) => {
    return moves.find(m =>
      m.from.row === r1 && m.from.col === c1 &&
          m.to.row === r2 && m.to.col === c2
    )
  }

  test('Rook moves on an empty board', () => {
    // Place a white rook at d4 (row 4, col 3)
    board.placePiece(4, 3, new Piece('white', 'rook'))
    board.activeColor = 'w'

    const moves = getMoves()

    // Rook should have 14 moves on an empty board
    expect(moves.length).toBe(14)

    // Check specific moves
    expect(findMove(moves, 4, 3, 4, 0)).toBeTruthy() // Left to edge
    expect(findMove(moves, 4, 3, 4, 7)).toBeTruthy() // Right to edge
    expect(findMove(moves, 4, 3, 0, 3)).toBeTruthy() // Up to edge
    expect(findMove(moves, 4, 3, 7, 3)).toBeTruthy() // Down to edge
  })

  test('Rook blocked by own piece', () => {
    // White rook at d4 (4, 3)
    board.placePiece(4, 3, new Piece('white', 'rook'))
    // White pawn at d5 (3, 3) - blocked up
    board.placePiece(3, 3, new Piece('white', 'pawn'))
    board.activeColor = 'w'

    const moves = getMoves()

    // Should NOT be able to move to d5 or beyond (d6..)
    expect(findMove(moves, 4, 3, 3, 3)).toBeFalsy()
    expect(findMove(moves, 4, 3, 2, 3)).toBeFalsy()

    // Should still move other directions
    expect(findMove(moves, 4, 3, 5, 3)).toBeTruthy() // Down
  })

  test('Rook captures enemy piece', () => {
    // White rook at d4 (4, 3)
    board.placePiece(4, 3, new Piece('white', 'rook'))
    // Black pawn at d6 (2, 3)
    board.placePiece(2, 3, new Piece('black', 'pawn'))
    board.activeColor = 'w'

    const moves = getMoves()

    // Should be able to capture at d6
    const captureMove = findMove(moves, 4, 3, 2, 3)
    expect(captureMove).toBeTruthy()
    expect(captureMove.flags).toContain('c') // Expect capture flag

    // Should NOT move beyond capture (d7)
    expect(findMove(moves, 4, 3, 1, 3)).toBeFalsy()

    // Should move to d5 (intermediate empty square)
    expect(findMove(moves, 4, 3, 3, 3)).toBeTruthy()
  })

  test('Bishop moves on empty board', () => {
    // White Bishop at d4 (4, 3)
    board.placePiece(4, 3, new Piece('white', 'bishop'))
    board.activeColor = 'w'

    const moves = getMoves()
    // Diagonals:
    // UL: c3(5,2), b2(6,1), a1(7,0) -> 3
    // UR: e3(5,4), f2(6,5), g1(7,6) -> 3
    // DL: c5(3,2), b6(2,1), a7(1,0) -> 3
    // DR: e5(3,4), f6(2,5), g7(1,6), h8(0,7) -> 4
    // Total 13
    expect(moves.length).toBe(13)

    expect(findMove(moves, 4, 3, 0, 7)).toBeTruthy() // h8
    expect(findMove(moves, 4, 3, 7, 0)).toBeTruthy() // a1
  })

  test('Bishop blocked and capture', () => {
    // White Bishop at d4 (4, 3)
    board.placePiece(4, 3, new Piece('white', 'bishop'))
    // Own piece at e5 (3, 4) - Blocked DR
    board.placePiece(3, 4, new Piece('white', 'pawn'))
    // Enemy piece at b6 (2, 1) - Capture DL
    board.placePiece(2, 1, new Piece('black', 'pawn'))
    board.activeColor = 'w'

    const moves = getMoves()

    // Blocked path
    expect(findMove(moves, 4, 3, 3, 4)).toBeFalsy() // Occupied by self
    expect(findMove(moves, 4, 3, 2, 5)).toBeFalsy() // Beyond

    // Capture path
    expect(findMove(moves, 4, 3, 3, 2)).toBeTruthy() // Intermediate
    const capture = findMove(moves, 4, 3, 2, 1)
    expect(capture).toBeTruthy()
    expect(capture.flags).toContain('c')
    expect(findMove(moves, 4, 3, 1, 0)).toBeFalsy() // Beyond capture
  })

  test('Queen moves (combine Rook + Bishop)', () => {
    // White Queen at d4 (4, 3)
    board.placePiece(4, 3, new Piece('white', 'queen'))
    board.activeColor = 'w'

    const moves = getMoves()
    // 14 (Rook) + 13 (Bishop) = 27
    expect(moves.length).toBe(27)
  })
})
