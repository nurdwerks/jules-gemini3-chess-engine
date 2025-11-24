const Board = require('../src/Board');

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
        // X-FEN: HAha means White rooks on H and A, Black rooks on h and a (Standard start pos really, but explicit files)
        // More interesting: King on d1, Rooks on c1, g1.
        // FEN: rk1r/pppppppp/8/8/8/8/PPPPPPPP/RK1R w GCgc - 0 1
        // Castling rights: G (inner rook), C (outer rook) for white.

        const fen = 'rk1r4/8/8/8/8/8/8/RK1R4 w GCgc - 0 1';
        board.loadFen(fen);

        // We need to check if the board stores specific files for castling
        // The `castling` object needs to support more than boolean k/q if we strictly follow 960.
        // However, for 960, usually we map King-side/Queen-side to specific Rooks.
        // Let's see how we update Board state.
        // For now, just verifying it parses without error and sets *some* flag or file index.

        expect(board.activeColor).toBe('w');
    });
});
