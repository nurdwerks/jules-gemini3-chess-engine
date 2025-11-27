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
    board.squares[16] = null; // a7 is index 16.

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

        // Note: PST differences might overwhelm mobility if mobility bonus is negative but small.
        // In this specific case, PST favors center significantly.
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
        boardClosed.loadFen('p7/8/8/8/8/8/8/r7 b - - 0 1');   // Pawn on a7 (actually a8) blocks rook on a1
        const scoreClosed = Evaluation.evaluate(boardClosed);

        const params = Evaluation.getParams();
        // Here PST is likely identical (Rank 8 pawns), so Mobility is the deciding factor.
        if (params.RookMobilityBonus >= 0) {
             expect(scoreOpen).toBeGreaterThan(scoreClosed);
        } else {
             expect(scoreOpen).toBeLessThan(scoreClosed);
        }
    });

    test('Queen mobility', () => {
        const boardOpen = new Board();
        boardOpen.loadFen('8/8/8/8/4q3/3p4/8/8 b - - 0 1'); // Pawn on d3
        const scoreOpen = Evaluation.evaluate(boardOpen);

        const boardClosed = new Board();
        boardClosed.loadFen('8/8/8/3p4/4q3/8/8/8 b - - 0 1'); // Pawn on d5
        const scoreClosed = Evaluation.evaluate(boardClosed);

        // Pawn PST differs here too.
        expect(scoreOpen).toBeGreaterThan(scoreClosed);
    });

    test('Mobility considers only safe squares', () => {
        const boardUnsafe = new Board();
        boardUnsafe.loadFen('8/8/8/8/4q3/8/R7/8 b - - 0 1'); // White rook on a2 attacks squares
        // Queen on e4 (index 0x88: row 3, col 4 -> index 68)
        // Wait, loadFen parses rank 8 first (index 0).
        // e4: rank 4.
        // Row 0=Rank 8. Row 1=Rank 7. Row 2=Rank 6. Row 3=Rank 5. Row 4=Rank 4.
        // Index = 4 * 16 + 4 = 68. Correct.

        // Find queen index
        const queenIndex = boardUnsafe.squares.findIndex(p => p && p.type === 'queen');

        const scoreUnsafe = Evaluation.evaluateMobility(boardUnsafe, queenIndex, 'queen', 'black');

        const boardSafe = new Board();
        boardSafe.loadFen('8/8/8/8/4q3/8/8/8 b - - 0 1');
        const queenIndexSafe = boardSafe.squares.findIndex(p => p && p.type === 'queen');

        const scoreSafe = Evaluation.evaluateMobility(boardSafe, queenIndexSafe, 'queen', 'black');

        // Safe has more mobility (squares not attacked by rook).
        // If bonus > 0, Safe > Unsafe.
        // If bonus < 0, Safe < Unsafe (more negative).
        const params = Evaluation.getParams();
        if (params.QueenMobilityBonus >= 0) {
            expect(scoreSafe).toBeGreaterThan(scoreUnsafe);
        } else {
            expect(scoreSafe).toBeLessThan(scoreUnsafe);
        }
    });
  });
});
