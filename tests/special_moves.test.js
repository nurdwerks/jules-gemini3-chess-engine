const Board = require('../src/Board');

describe('Special Moves', () => {
  let board;

  beforeEach(() => {
    board = new Board();
  });

  describe('Castling', () => {
    test('White Kingside Castling', () => {
      // White King at e1, Rook at h1, empty f1, g1. Rights K.
      board.loadFen('r3k2r/8/8/8/8/8/8/R3K2R w K - 0 1');
      const moves = board.generateMoves();
      // e1 is 7,4 (index 116). g1 is 7,6 (index 118).
      // 7<<4 | 6 = 112 | 6 = 118.
      const castlingMove = moves.find(m => m.from === 116 && m.to === 118);
      expect(castlingMove).toBeDefined();
      expect(castlingMove.flags).toBe('k'); // k for kingside castling
    });

    test('White Queenside Castling', () => {
      // White King at e1, Rook at a1, empty b1, c1, d1. Rights Q.
      board.loadFen('r3k2r/8/8/8/8/8/8/R3K2R w Q - 0 1');
      const moves = board.generateMoves();
      // e1 is 7,4 (116). c1 is 7,2 (114).
      const castlingMove = moves.find(m => m.from === 116 && m.to === 114);
      expect(castlingMove).toBeDefined();
      expect(castlingMove.flags).toBe('q'); // q for queenside castling
    });

    test('Black Kingside Castling', () => {
      // Black King at e8, Rook at h8. Rights k.
      board.loadFen('r3k2r/8/8/8/8/8/8/R3K2R b k - 0 1');
      const moves = board.generateMoves();
      // e8 is 0,4 (4). g8 is 0,6 (6).
      const castlingMove = moves.find(m => m.from === 4 && m.to === 6);
      expect(castlingMove).toBeDefined();
      expect(castlingMove.flags).toBe('k');
    });

    test('Black Queenside Castling', () => {
      // Black King at e8, Rook at a8. Rights q.
      board.loadFen('r3k2r/8/8/8/8/8/8/R3K2R b q - 0 1');
      const moves = board.generateMoves();
      // e8 is 0,4 (4). c8 is 0,2 (2).
      const castlingMove = moves.find(m => m.from === 4 && m.to === 2);
      expect(castlingMove).toBeDefined();
      expect(castlingMove.flags).toBe('q');
    });

    test('Castling Blocked', () => {
      // White King e1, Rook h1, Bishop on f1. Rights K.
      board.loadFen('r3k2r/8/8/8/8/8/8/R3KB1R w K - 0 1');
      const moves = board.generateMoves();
      const castlingMove = moves.find(m => m.from === 116 && m.to === 118);
      expect(castlingMove).toBeUndefined();
    });

    test('Castling Rights Missing', () => {
      // Position valid for castling but no rights.
      board.loadFen('r3k2r/8/8/8/8/8/8/R3K2R w - - 0 1');
      const moves = board.generateMoves();
      const castlingMove = moves.find(m => m.from === 116 && m.to === 118);
      expect(castlingMove).toBeUndefined();
    });
  });

  describe('En Passant', () => {
    test('White En Passant Capture', () => {
      // White pawn e5, Black pawn d5 (moved d7-d5). Target d6.
      // Actually if black moves d7-d5, the target is d6 (square behind d5).
      // Fen: ... w - d6 0 1
      // White pawn at e5 (row 3, col 4 -> 3<<4 | 4 = 48+4=52)
      // Target d6 (row 2, col 3 -> 2<<4 | 3 = 32+3=35)

      // Board rows: 0 is top (black), 7 is bottom (white).
      // e5 is row 3 (if 8=0, 7=1, 6=2, 5=3). Wait, let's check.
      // Rank 8 -> Row 0
      // Rank 5 -> Row 3.
      // Rank 6 -> Row 2.
      // Rank 3 -> Row 5.

      // Case: White Pawn on e5 (Rank 5 -> Row 3). Black Pawn moves d7-d5 (Rank 7->5 -> Row 1->3).
      // EP Target is d6 (Rank 6 -> Row 2).

      board.loadFen('rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 1');
      const moves = board.generateMoves();

      // e5 is row 3, col 4. Index: 3*16 + 4 = 52.
      // d6 is row 2, col 3. Index: 2*16 + 3 = 35.

      const epMove = moves.find(m => m.from === 52 && m.to === 35);
      expect(epMove).toBeDefined();
      expect(epMove.flags).toBe('e'); // e for en passant
    });
  });

  describe('Promotion', () => {
    test('White Pawn Promotion', () => {
      // White Pawn on a7 (Row 1, Col 0). Move to a8 (Row 0, Col 0).
      board.loadFen('8/P7/8/8/8/8/8/k6K w - - 0 1');
      const moves = board.generateMoves();

      // From a7 (1,0 -> 16) to a8 (0,0 -> 0).
      const promoMoves = moves.filter(m => m.from === 16 && m.to === 0);

      // Should have 4 moves (Q, R, B, N)
      expect(promoMoves.length).toBe(4);

      const types = promoMoves.map(m => m.promotion).sort();
      expect(types).toEqual(['b', 'n', 'q', 'r']);
      expect(promoMoves[0].flags).toBe('p'); // p for promotion
    });
  });
});
