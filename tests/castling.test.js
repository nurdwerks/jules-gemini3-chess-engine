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

  // Chess960 Castling Tests
  describe.skip('Chess960', () => {
    test('should allow castling from a standard Chess960 starting position', () => {
      // Position: RNBQKBNR. In Chess960, this is SP #518. King on e1, rooks on a1/h1.
      // Castling rights are denoted by the files of the rooks.
      board.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      const moves = board.generateMoves();

      const kingsideCastle = moves.find(m => m.flags === 'k');
      expect(kingsideCastle).toBeDefined();
      expect(kingsideCastle.from).toBe(116); // e1
      expect(kingsideCastle.to).toBe(118); // g1

      const queensideCastle = moves.find(m => m.flags === 'q');
      expect(queensideCastle).toBeDefined();
      expect(queensideCastle.from).toBe(116); // e1
      expect(queensideCastle.to).toBe(114); // c1
    });

    test('should handle Chess960 castling with king and rooks in different positions', () => {
      // Position SP #4: RKR..... King on b1, rooks on a1 and c1.
      board.loadFen('rkrnnqbb/pppppppp/8/8/8/8/PPPPPPPP/RKRNNQBB w ACac - 0 1');
      const moves = board.generateMoves();

      const kingsideCastle = moves.find(m => m.flags === 'k960');
      expect(kingsideCastle).toBeDefined();
      expect(kingsideCastle.from).toBe(113); // b1
      expect(kingsideCastle.to).toBe(118); // g1 -> king moves to g1

      const queensideCastle = moves.find(m => m.flags === 'q960');
      expect(queensideCastle).toBeDefined();
      expect(queensideCastle.from).toBe(113); // b1
      expect(queensideCastle.to).toBe(114); // c1 -> king moves to c1
    });

    test('should not allow Chess960 castling if squares between king and rook are occupied', () => {
      // Position: Like SP #4, but with a knight between king and queenside rook.
      board.loadFen('rknrnqbb/pppppppp/8/8/8/8/PPPPPPPP/RKNRNQBB w ACac - 0 1');
      const moves = board.generateMoves();
      const queensideCastle = moves.find(m => m.flags === 'q960');
      expect(queensideCastle).toBeUndefined();
    });

    test('should not allow Chess960 castling when king is in check', () => {
      // King on b1 is in check from a rook on b8
      board.loadFen('1rkrnqbb/pppppppp/8/8/8/8/PPPPPPPP/RKRNNQBB w ACac - 0 1');
      const moves = board.generateMoves();
      const castlingMoves = moves.filter(m => m.flags === 'k960' || m.flags === 'q960');
      expect(castlingMoves.length).toBe(0);
    });

    test('should not allow Chess960 castling through check', () => {
      // King on b1, queenside castle to c1. Attacked by rook on c8.
      board.loadFen('2r5/pppppppp/8/8/8/8/PPPPPPPP/RKRNNQBB w ACac - 0 1');
      const moves = board.generateMoves();
      const queensideCastle = moves.find(m => m.flags === 'q960');
      expect(queensideCastle).toBeUndefined();
    });
  });
});
