const Board = require('../../src/Board');

describe('Chess960 X-FEN Parsing', () => {
    let board;

    beforeEach(() => {
        board = new Board();
    });

    test('loadFen accepts standard FEN', () => {
        board.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        expect(board.castling.w.k).toBe(true);
        expect(board.castling.w.q).toBe(true);
        expect(board.castling.b.k).toBe(true);
        expect(board.castling.b.q).toBe(true);
    });

    test('loadFen accepts X-FEN with file letters', () => {
        // X-FEN: Rooks on A and C. King on B.
        // R(a1), K(b1), R(c1).
        // Rights: A (0), C (2).
        // FEN: rkr5/8/8/8/8/8/8/RKR5 w ACac - 0 1

        const fen = 'rkr5/8/8/8/8/8/8/RKR5 w ACac - 0 1';
        board.loadFen(fen);

        expect(board.activeColor).toBe('w');
        // Verify internal state has correct files
        // White rooks at 0 and 2?
        // castlingRooks.white should contain indices for a1 and c1.
        // a1=112, c1=114.
        const rooks = board.castlingRooks.white;
        expect(rooks).toContain(112);
        expect(rooks).toContain(114);
    });

    test('loadFen parses a different Chess960 FEN', () => {
        // Position 2: RNBQKBNR/PPPPPPPP/8/8/8/8/pppppppp/rnbqkbnr w FBfb - 0 1
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w FBfb - 0 1';
        board.loadFen(fen);
        expect(board.castling.w.k).toBe(true); // f-file rook
        expect(board.castling.w.q).toBe(true); // b-file rook
        expect(board.castling.b.k).toBe(true); // f-file rook
        expect(board.castling.b.q).toBe(true); // b-file rook
        const whiteRooks = board.castlingRooks.white;
        expect(whiteRooks).toContain(113); // b1
        expect(whiteRooks).toContain(117); // f1
    });

    test('loadFen handles no castling rights in Chess960', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';
        board.loadFen(fen);
        expect(board.castling.w.k).toBe(false);
        expect(board.castling.w.q).toBe(false);
        expect(board.castling.b.k).toBe(false);
        expect(board.castling.b.q).toBe(false);
    });
});
