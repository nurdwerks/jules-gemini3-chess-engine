const Evaluation = require('../../src/Evaluation');
const Board = require('../../src/Board');

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
    const piece = board.getPiece(16);
    if (piece) board.toggleBitboard(piece, 16);

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

  describe('Mobility Evaluation', () => {
    test('Knight mobility', () => {
        const boardCenter = new Board();
        boardCenter.loadFen('8/8/8/8/4n3/8/8/8 b - - 0 1');
        const scoreCenter = Evaluation.evaluate(boardCenter);

        const boardCorner = new Board();
        boardCorner.loadFen('7n/8/8/8/8/8/8/8 b - - 0 1');
        const scoreCorner = Evaluation.evaluate(boardCorner);

        expect(scoreCenter).toBeGreaterThan(scoreCorner);
    });

    test('Bishop mobility', () => {
        const boardOpen = new Board();
        boardOpen.loadFen('8/8/8/8/4b3/3p4/8/8 b - - 0 1'); // Pawn on d3 doesn't block bishop on e4
        const scoreOpen = Evaluation.evaluate(boardOpen);

        const boardClosed = new Board();
        boardClosed.loadFen('8/8/8/3p4/4b3/8/8/8 b - - 0 1'); // Pawn on d5 blocks bishop on e4
        const scoreClosed = Evaluation.evaluate(boardClosed);

        expect(scoreOpen).toBeGreaterThan(scoreClosed);
    });

    test('Rook mobility', () => {
        const boardOpen = new Board();
        boardOpen.loadFen('1p6/8/8/8/8/8/8/r7 b - - 0 1'); // Pawn on b8 does not block rook on a1
        const scoreOpen = Evaluation.evaluate(boardOpen);

        const boardClosed = new Board();
        boardClosed.loadFen('p7/8/8/8/8/8/8/r7 b - - 0 1');   // Pawn on a8 blocks rook on a1
        const scoreClosed = Evaluation.evaluate(boardClosed);

        expect(scoreOpen).toBeGreaterThan(scoreClosed);
        // Explicitly verify the bonus difference (1 extra square * RookMobilityBonus(2) = 2)
        const diff = scoreOpen - scoreClosed;
        expect(diff).toBe(2);
    });

    test('Queen mobility', () => {
        const boardOpen = new Board();
        boardOpen.loadFen('8/8/8/8/4q3/3p4/8/8 b - - 0 1'); // Pawn on d3
        const scoreOpen = Evaluation.evaluate(boardOpen);

        const boardClosed = new Board();
        boardClosed.loadFen('8/8/8/3p4/4q3/8/8/8 b - - 0 1'); // Pawn on d5
        const scoreClosed = Evaluation.evaluate(boardClosed);

        expect(scoreOpen).toBeGreaterThan(scoreClosed);
    });

    test('Mobility considers only safe squares', () => {
        const boardUnsafe = new Board();
        boardUnsafe.loadFen('8/8/8/8/4q3/8/R7/8 b - - 0 1'); // White rook on a2 attacks squares
        const scoreUnsafe = Evaluation.evaluate(boardUnsafe);

        const boardSafe = new Board();
        boardSafe.loadFen('8/8/8/8/4q3/8/8/8 b - - 0 1');
        const scoreSafe = Evaluation.evaluate(boardSafe);

        expect(scoreUnsafe).toBeLessThan(scoreSafe);
    });
  });
});
