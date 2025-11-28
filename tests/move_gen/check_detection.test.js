const Board = require('../../src/Board');
const Piece = require('../../src/Piece');

describe('Attack Detection & Legal Moves', () => {
  let board;

  beforeEach(() => {
    board = new Board();
  });

  describe('isSquareAttacked', () => {
    test('detects pawn attacks', () => {
      // White pawns on e4, g4. Black king on f5.
      board.loadFen('8/8/8/5k2/4P1P1/8/8/8 w - - 0 1');
      const f5 = board.algebraicToIndex('f5');
      // White attacks f5
      expect(board.isSquareAttacked(f5, 'white')).toBe(true);
      // Black does not attack f5 (it's occupied by black king, but check attacker)
      expect(board.isSquareAttacked(f5, 'black')).toBe(false);
    });

    test('detects knight attacks', () => {
      // Knight on e6 attacks d4 (row 2, col 4 -> row 4, col 3)
      board.loadFen('8/8/4N3/8/3k4/8/8/8 w - - 0 1');
      const d4 = board.algebraicToIndex('d4'); // Black king
      expect(board.isSquareAttacked(d4, 'white')).toBe(true);
    });

    test('detects rook attacks (blocked and unblocked)', () => {
      board.loadFen('8/8/3R4/3P4/3k4/8/8/8 w - - 0 1');
      const d4 = board.algebraicToIndex('d4');
      // Rook on d6, Pawn on d5 blocks it.
      // Wait, Pawn on d5 is white. Rook on d6 is white. King on d4 is black.
      // d6 -> d5 (blocked) -> d4. Rook attacks d5, but does it attack d4? No.
      expect(board.isSquareAttacked(d4, 'white')).toBe(false);

      board.loadFen('8/8/3R4/8/3k4/8/8/8 w - - 0 1');
      expect(board.isSquareAttacked(d4, 'white')).toBe(true);
    });

    test('detects bishop attacks', () => {
      board.loadFen('8/8/8/8/3k4/2B5/8/8 w - - 0 1');
      const d4 = board.algebraicToIndex('d4');
      expect(board.isSquareAttacked(d4, 'white')).toBe(true);
    });

    test('detects queen attacks', () => {
      // Queen on g1 (118) attacks d4 (67).
      // g1: row 7, col 6. d4: row 4, col 3.
      // Diff row: 3. Diff col: 3. Diagonal.
      board.loadFen('8/8/8/8/3k4/8/8/6Q1 w - - 0 1');
      const d4 = board.algebraicToIndex('d4');
      expect(board.isSquareAttacked(d4, 'white')).toBe(true);
    });

    test('detects king attacks', () => {
      board.loadFen('8/8/8/8/3k4/4K3/8/8 w - - 0 1');
      const d4 = board.algebraicToIndex('d4');
      expect(board.isSquareAttacked(d4, 'white')).toBe(true);
    });
  });

  describe('Legal Move Filtering', () => {
    test('filters moves leaving king in check (absolute pin)', () => {
      // White King on e1, White Rook on e2, Black Rook on e8.
      // White Rook on e2 is absolutely pinned. It cannot move left/right or away from file.
      // It can capture e8 or move along the file if possible (blocked by e8).
      // Let's use a diagonal pin.
      // K on e1, B on d2, q on a5.
      // a5 -> e1 diagonal.
      // d2 is pinned.
      board.loadFen('8/8/8/q7/8/8/3B4/4K3 w - - 0 1');
      const moves = board.generateMoves();
      const bishopMoves = moves.filter(m => m.piece.type === 'bishop');
      // Bishop on d2 usually has moves. But here it's pinned by Queen on a5.
      // It can only move along the a5-e1 diagonal.
      // c3, b4, a5 (capture).
      // Pseudo-legal moves for Bishop at d2:
      // c3, b4, a5, e3, f4, g5, h6 (if empty), c1.
      // Legal: c3, b4, a5.

      const toAlgebraic = (idx) => {
         const {row, col} = board.toRowCol(idx);
         return String.fromCharCode('a'.charCodeAt(0) + col) + (8 - row);
      };

      const destinations = bishopMoves.map(m => toAlgebraic(m.to)).sort();
      expect(destinations).toEqual(expect.arrayContaining(['a5', 'b4', 'c3']));
      expect(destinations).not.toContain('e3');
      expect(destinations).not.toContain('c1');
    });

    test('king cannot move into check', () => {
        // King e1, Rook a2. King cannot move to d2, e2, f2? No, Rook is on rank 2.
        // wait, Rook on a2 attacks entire rank 2.
        // King e1 moves: d1, f1, d2, e2, f2.
        // d2, e2, f2 are attacked.
        board.loadFen('8/8/8/8/8/8/r7/4K3 w - - 0 1');
        const moves = board.generateMoves();
        const kingMoves = moves.filter(m => m.piece.type === 'king');
        const destinations = kingMoves.map(m => board.toRowCol(m.to)).map(({row, col}) =>
            String.fromCharCode('a'.charCodeAt(0) + col) + (8 - row)
        );
        expect(destinations).not.toContain('d2');
        expect(destinations).not.toContain('e2');
        expect(destinations).not.toContain('f2');
        expect(destinations).toContain('d1');
        expect(destinations).toContain('f1');
    });

    test('Pinned piece cannot move off the pin line', () => {
      // White King on e1, White Rook on e2, Black Rook on e8.
      // The White Rook on e2 is pinned and cannot move to d2.
      board.loadFen('4r3/8/8/8/8/8/4R3/4K3 w - - 0 1');
      const moves = board.generateMoves();
      const rookMove = moves.find(m => m.from === 100 && m.to === 99); // e2 to d2
      expect(rookMove).toBeUndefined();
    });

    test('King cannot move into an attacked square', () => {
      // White King on e1, Black Rook on a2.
      // The King cannot move to d2, which is attacked by the Rook.
      board.loadFen('8/8/8/8/8/8/r7/4K3 w - - 0 1');
      const moves = board.generateMoves();
      const kingMove = moves.find(m => m.from === 116 && m.to === 99); // e1 to d2
      expect(kingMove).toBeUndefined();
    });

    test('castling prevented if path is attacked', () => {
        // White King e1. Rooks a1, h1.
        // Black Rook on d8. Attacks d file.
        // Queenside castling (e1 -> c1) crosses d1.
        // d1 is attacked by d8 Rook.
        // So Queenside castling should be illegal.
        board.loadFen('3r4/8/8/8/8/8/8/R3K2R w KQ - 0 1');
        const moves = board.generateMoves();
        const castlingMoves = moves.filter(m => m.flags === 'q' || m.flags === 'k');

        // Kingside allowed? Yes.
        const kingside = castlingMoves.find(m => m.flags === 'k');
        expect(kingside).toBeDefined();

        // Queenside allowed? No.
        const queenside = castlingMoves.find(m => m.flags === 'q');
        expect(queenside).toBeUndefined();
    });

    test('castling prevented if king in check', () => {
        // White King e1, in check by Rook e8.
        board.loadFen('4r3/8/8/8/8/8/8/R3K2R w KQ - 0 1');
        const moves = board.generateMoves();
        const castlingMoves = moves.filter(m => m.flags === 'q' || m.flags === 'k');
        expect(castlingMoves.length).toBe(0);
    });

    test('castling prevented if target square is attacked', () => {
       // White King e1. Target g1 (Kingside).
       // Black Bishop on c5 attacks g1?
       // c5 (3, 2). g1 (7, 6).
       // 7-3 = 4. 6-2 = 4. Yes, diagonal.
       board.loadFen('8/8/8/2b5/8/8/8/R3K2R w KQ - 0 1');
       const moves = board.generateMoves();
       const kingside = moves.find(m => m.flags === 'k');
       expect(kingside).toBeUndefined();
    });
  });
});
