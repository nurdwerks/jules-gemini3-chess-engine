const Board = require('../src/Board');
const Piece = require('../src/Piece');

describe('Pin Logic Verification (Story 1.3a)', () => {
    let board;

    beforeEach(() => {
        board = new Board();
    });

    test('Absolute Pin: Piece cannot move out of pin', () => {
        board.loadFen('4r3/8/8/8/8/8/4R3/4K3 w - - 0 1');

        const moves = board.generateMoves();
        const rookMoves = moves.filter(m => m.piece.type === 'rook');

        const moveToD2 = rookMoves.find(m => m.to === board.algebraicToIndex('d2'));
        expect(moveToD2).toBeUndefined();

        const moveToE3 = rookMoves.find(m => m.to === board.algebraicToIndex('e3'));
        expect(moveToE3).toBeDefined();

        const captureE8 = rookMoves.find(m => m.to === board.algebraicToIndex('e8'));
        expect(captureE8).toBeDefined();
    });

    test('Absolute Pin: Diagonal Pin', () => {
        board.loadFen('6k1/b7/8/8/8/8/5P2/6K1 w - - 0 1');

        const moves = board.generateMoves();
        const pawnMoves = moves.filter(m => m.piece.type === 'pawn');

        const moveF3 = pawnMoves.find(m => m.to === board.algebraicToIndex('f3'));
        expect(moveF3).toBeUndefined();

        expect(pawnMoves.length).toBe(0);
    });
});
