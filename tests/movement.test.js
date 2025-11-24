const Board = require('../src/Board');
const Piece = require('../src/Piece');

describe('Piece Movement Logic', () => {
  let board;

  beforeEach(() => {
    board = new Board();
  });

  test('pawn basic movement (white)', () => {
    // White pawn at 6, 0 moving to 5, 0
    const start = { row: 6, col: 0 };
    const end = { row: 5, col: 0 };
    expect(board.isValidMove(start, end)).toBe(true);
  });

  test('pawn basic movement (black)', () => {
    // Black pawn at 1, 0 moving to 2, 0
    const start = { row: 1, col: 0 };
    const end = { row: 2, col: 0 };
    expect(board.isValidMove(start, end)).toBe(true);
  });

  test('pawn cannot move backwards', () => {
    // White pawn trying to move back
    // Let's test a valid position first, say we move a pawn to 5,0 manually then try to move back
    board.grid[5][0] = new Piece('white', 'pawn');
    board.grid[6][0] = null;

    const start = { row: 5, col: 0 };
    const end = { row: 6, col: 0 };
    expect(board.isValidMove(start, end)).toBe(false);
  });

  test('pawn initial double move', () => {
     // White pawn at 6, 1 moving to 4, 1
     const start = { row: 6, col: 1 };
     const end = { row: 4, col: 1 };
     expect(board.isValidMove(start, end)).toBe(true);
  });

  test('pawn invalid move (sideways)', () => {
      const start = { row: 6, col: 1 };
      const end = { row: 6, col: 2 };
      expect(board.isValidMove(start, end)).toBe(false);
  });
});
