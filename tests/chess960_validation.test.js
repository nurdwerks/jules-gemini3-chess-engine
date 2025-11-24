const Board = require('../src/Board');

describe('Chess960 Validation', () => {
    let board;
    beforeEach(() => {
        board = new Board();
    });

    test('loadFen validates 960 placement (Bishops opposite colors)', () => {
        // Bishops on same color (a1=black, c1=black)
        // r n b q k b n r
        // a1=0(white?) No, a1 is dark square?
        // Board 0x88: a1=112 (row 7, col 0). (7+0)%2=1 -> Dark.
        // c1=114 (row 7, col 2). (7+2)%2=1 -> Dark.
        // So BB on a1,c1 is invalid.
        const fen = 'rn1qkbnr/pppppppp/8/8/8/8/PPPPPPPP/B1BQKBNR w KQkq - 0 1';
        expect(() => board.loadFen(fen)).toThrow('Invalid FEN string: Bishops must be on opposite colors.');
    });

    test('loadFen validates 960 placement (King between Rooks)', () => {
        // R K R is valid.
        // K R R is invalid for castling if both Rooks have rights.
        // King on a1, Rooks on b1, c1.
        // b1=113, c1=114. King=112.
        // Rights: B, C (files 1, 2).
        // FEN: KRR5/8/8/8/8/8/8/8 w BC - 0 1
        // BC -> Rooks on b1, c1.
        const fen = 'KRR5/8/8/8/8/8/8/8 w BC - 0 1';
        expect(() => board.loadFen(fen)).toThrow('Invalid FEN string: King must be between Rooks.');
    });
});
