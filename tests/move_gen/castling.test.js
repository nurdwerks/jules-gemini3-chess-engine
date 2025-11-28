const Board = require('../../src/Board');

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

  // Chess960 Castling Tests
  describe('Chess960', () => {
    test('should allow castling with rooks in non-standard positions', () => {
      // Rook on b1, King on e1, Rook on h1. White can castle queenside (long) and kingside (short).
      // Queenside castling: King moves to c1, Rook moves to d1.
      // Kingside castling: King moves to g1, Rook moves to f1.
      board.loadFen('1r2k2r/8/8/8/8/8/8/1R2K2R w BHbh - 0 1'); // Castling rights for B and H files
      const moves = board.generateMoves();

      const queensideCastle = moves.find(m => m.flags === 'q960');
      expect(queensideCastle).toBeDefined();
      expect(queensideCastle.to).toBe(114); // King moves to c1

      const kingsideCastle = moves.find(m => m.flags === 'k960');
      expect(kingsideCastle).toBeDefined();
      expect(kingsideCastle.to).toBe(118); // King moves to g1
    });

    test('should allow castling when king and rook are adjacent', () => {
      // King on d1, Rook on e1. This is a valid setup for kingside castling.
      board.loadFen('8/8/8/8/8/8/8/3KR3 w E - 0 1');
      const moves = board.generateMoves();
      const kingsideCastle = moves.find(m => m.flags === 'k960');
      expect(kingsideCastle).toBeDefined();
    });

    test('should correctly identify castling moves with unusual rook positions', () => {
      // White: King f1, Rooks a1, g1. Black: King e8, Rook a8. This setup makes kingside castling legal.
      board.loadFen('r3k3/8/8/8/8/8/8/R4KR1 w AGa - 0 1');
      const moves = board.generateMoves();

      // White queenside castling (A-file rook)
      const whiteQueenside = moves.find(m => m.flags === 'q960' && m.from === 117 && m.to === 114);
      expect(whiteQueenside).toBeDefined();

      // White kingside castling (G-file rook)
      const whiteKingside = moves.find(m => m.flags === 'k960' && m.from === 117 && m.to === 118);
      expect(whiteKingside).toBeDefined();
    });

    test('should not allow castling if there are pieces between king and rook', () => {
      // King on d1, Rook on h1, but a knight is on f1. Kingside castling is not possible.
      board.loadFen('8/8/8/8/8/8/8/3K1N1R w H - 0 1');
      const moves = board.generateMoves();
      const kingsideCastle = moves.find(m => m.flags === 'k960');
      expect(kingsideCastle).toBeUndefined();
    });

    test('should not allow castling if the king passes through an attacked square', () => {
      // King on b1, Rook on h1. Black knight on f3 attacks e1 and g1, squares the king must pass through.
      board.loadFen('8/8/8/8/8/5n2/8/1K5R w H - 0 1');
      const moves = board.generateMoves();
      const kingsideCastle = moves.find(m => m.flags === 'k960');
      expect(kingsideCastle).toBeUndefined();
    });

    test('should not allow castling when king is in check', () => {
      // King on f1, Rook on h1. Black knight on e3 puts the king in check.
      board.loadFen('8/8/8/8/8/4n3/8/5K1R w H - 0 1');
      const moves = board.generateMoves();
      const castlingMoves = moves.filter(m => m.flags === 'k960' || m.flags === 'q960');
      expect(castlingMoves.length).toBe(0);
    });
  });
});
