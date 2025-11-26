const Board = require('../src/Board');

describe('Chess960 Castling', () => {
  let board;

  beforeEach(() => {
    board = new Board();
  });

  const assertCastlingMoves = (fen, kingside, queenside) => {
    board.loadFen(fen);
    const moves = board.generateMoves();
    const kingsideCastle = moves.find(m => m.flags === 'k960');
    const queensideCastle = moves.find(m => m.flags === 'q960');

    if (kingside) {
      expect(kingsideCastle).toBeDefined();
    } else {
      expect(kingsideCastle).toBeUndefined();
    }

    if (queenside) {
      expect(queensideCastle).toBeDefined();
    } else {
      expect(queensideCastle).toBeUndefined();
    }
  };

  // Using simplified FENs with only Kings and Rooks for white, and a single king for black to have a valid FEN
  // This is to avoid interference from other pieces in valid castling scenario tests.

  describe('Valid Castling Scenarios', () => {
    test('King on E, Rooks on A, H (Standard)', () => {
        assertCastlingMoves('k7/8/8/8/8/8/8/R3K2R w AHah - 0 1', true, true);
    });

    test('King on E, Rooks on B, G', () => {
        assertCastlingMoves('k7/8/8/8/8/8/8/1R2K1R1 w BGbg - 0 1', true, true);
    });

    test('King on E, Rooks on C, H', () => {
        assertCastlingMoves('k7/8/8/8/8/8/8/2R1K2R w CHch - 0 1', true, true);
    });

    test('King on F, Rooks on C, H', () => {
        assertCastlingMoves('k7/8/8/8/8/8/8/2R2K1R w CHch - 0 1', true, true);
    });
  });

  describe('Invalid Castling Scenarios', () => {
    test('King is in check', () => {
      assertCastlingMoves('k7/8/8/8/8/4n3/8/R3K2R w AHah - 0 1', false, false);
    });

    test('Path is blocked', () => {
      assertCastlingMoves('k7/8/8/8/8/8/8/RN2K2R w AHah - 0 1', true, false);
    });

    test('King passes through attacked square', () => {
      assertCastlingMoves('k7/8/8/8/8/3n4/8/R3K2R w AHah - 0 1', false, false);
    });
  });
});
