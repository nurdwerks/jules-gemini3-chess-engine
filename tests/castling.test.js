const Board = require('../src/Board');

describe('Castling', () => {
  let board;

  beforeEach(() => {
    board = new Board();
  });

  // Standard Chess Castling Tests
  describe('Standard Chess', () => {
    test('should not allow castling when king is in check', () => {
      // Position: White king in check from a black rook on e8. Castling rights are available.
      board.loadFen('4r3/8/8/8/8/8/8/R3K2R w KQ - 0 1');
      const moves = board.generateMoves();
      const castlingMoves = moves.filter(m => m.flags === 'k' || m.flags === 'q');
      expect(castlingMoves.length).toBe(0);
    });

    test('should not allow castling when king passes through an attacked square', () => {
      // Position: White can't castle kingside because f1 is attacked by a black rook on f8.
      board.loadFen('5r2/8/8/8/8/8/8/R3K2R w KQ - 0 1');
      const moves = board.generateMoves();
      const kingsideCastle = moves.find(m => m.flags === 'k' && m.from === 116 && m.to === 118);
      expect(kingsideCastle).toBeUndefined();

      // Queenside castling should still be allowed.
      const queensideCastle = moves.find(m => m.flags === 'q' && m.from === 116 && m.to === 114);
      expect(queensideCastle).toBeDefined();
    });

    test('should not allow castling when king lands on an attacked square', () => {
      // Position: White can't castle kingside because g1 is attacked by a black rook on g8.
      board.loadFen('6r1/8/8/8/8/8/8/R3K2R w KQ - 0 1');
      const moves = board.generateMoves();
      const kingsideCastle = moves.find(m => m.flags === 'k' && m.from === 116 && m.to === 118);
      expect(kingsideCastle).toBeUndefined();
    });

    test('should allow castling when the rook is attacked but the path is clear', () => {
      // Position: White can castle kingside even though the h1 rook is attacked.
      board.loadFen('7r/8/8/8/8/8/8/R3K2R w KQ - 0 1');
      const moves = board.generateMoves();
      const kingsideCastle = moves.find(m => m.flags === 'k' && m.from === 116 && m.to === 118);
      expect(kingsideCastle).toBeDefined();
    });
  });

});
