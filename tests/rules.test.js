const Board = require('../src/Board');

describe('Game Rules', () => {
  let board;

  beforeEach(() => {
    board = new Board();
  });

  test('Draw by 50-Move Rule', () => {
    // Manually set halfMoveClock
    board.halfMoveClock = 100;
    expect(board.isDrawBy50Moves()).toBe(true);

    board.halfMoveClock = 99;
    expect(board.isDrawBy50Moves()).toBe(false);
  });

  test('50-Move Rule resets on pawn move', () => {
      board.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 99 1');
      const move = {
          from: board.algebraicToIndex('e2'),
          to: board.algebraicToIndex('e4'),
          piece: board.getPiece(6, 4), // e2 pawn
          flags: 'n' // double push usually 'n' in this engine unless specialized
      };

      // We need to verify generateMoves produces this move to be safe,
      // but for unit testing the logic in applyMove, we can mock or just construct.
      // Let's rely on applyMove logic.

      board.applyMove(move);
      expect(board.halfMoveClock).toBe(0);
      expect(board.isDrawBy50Moves()).toBe(false);
  });

  test('50-Move Rule resets on capture', () => {
    // Setup a position where a capture is possible
    board.loadFen('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 99 1');
    // Black pawn d7, white pawn e4.
    // Let's just place a piece to capture.
    board.placePiece(4, 4, { type: 'pawn', color: 'white' }); // e4
    board.placePiece(3, 3, { type: 'bishop', color: 'black' }); // d5

    // d5 captures e4
    const move = {
        from: board.algebraicToIndex('d5'),
        to: board.algebraicToIndex('e4'),
        piece: { type: 'bishop', color: 'black' },
        flags: 'c',
        captured: { type: 'pawn', color: 'white' }
    };

    // Note: applyMove expects the move object to be fully populated like generateMoves does.
    // Specifically 'piece' and 'captured' objects.

    board.applyMove(move);
    expect(board.halfMoveClock).toBe(0);
  });
});
