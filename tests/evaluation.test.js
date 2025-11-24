const Evaluation = require('../src/Evaluation');
const Board = require('../src/Board');

describe('Evaluation', () => {
  let board;

  beforeEach(() => {
    board = new Board();
  });

  test('Start Position is Equal (Mirror)', () => {
    // Start position should be exactly 0 because material is equal and PSTs are mirrored vertically
    expect(Evaluation.evaluate(board)).toBe(0);
  });

  test('Material Advantage', () => {
    // Remove black pawn
    board.squares[16] = null; // a7 is index 16. Wait, index 16 is a7 (row 1).
    // a8=0. a7=16. Yes.

    // Evaluate for White
    const score = Evaluation.evaluate(board);
    // Should be positive (White is up a pawn + positional)
    expect(score).toBeGreaterThan(50);
  });

  test('Positional Advantage (Pawn Center)', () => {
      // White pawn on e4 (strong) vs White pawn on h2 (weak)
      // We can compare two boards.

      const boardStrong = new Board();
      boardStrong.loadFen('8/8/8/8/4P3/8/8/8 w - - 0 1');

      const boardWeak = new Board();
      boardWeak.loadFen('8/8/8/8/8/8/7P/8 w - - 0 1');

      expect(Evaluation.evaluate(boardStrong)).toBeGreaterThan(Evaluation.evaluate(boardWeak));
  });
});
