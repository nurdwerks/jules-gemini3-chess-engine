const Board = require('../src/Board');
const Piece = require('../src/Piece');

describe('Pin Logic Verification (Story 1.3a)', () => {
    let board;

    beforeEach(() => {
        board = new Board();
        board.squares.fill(null);
    });

    test('Absolute Pin: Piece cannot move out of pin', () => {
        // White King at e1 (7, 4)
        board.placePiece(7, 4, new Piece('white', 'king'));
        // White Rook at e2 (6, 4) - Pinned
        board.placePiece(6, 4, new Piece('white', 'rook'));
        // Black Rook at e8 (0, 4) - Pinner
        board.placePiece(0, 4, new Piece('black', 'rook'));

        board.activeColor = 'w';

        const moves = board.generateMoves();
        // Rook can only move along the file e (vertical) or capture checking piece?
        // Actually, here the pinner is at e8. The pinned rook is at e2. King at e1.
        // Rook can move to e3, e4... e8 (capture).
        // Rook cannot move horizontally (e.g. d2, f2) as that would expose king.

        const rookMoves = moves.filter(m => m.piece.type === 'rook');

        // Check horizontal move is forbidden
        const moveToD2 = rookMoves.find(m => m.to === board.algebraicToIndex('d2'));
        expect(moveToD2).toBeUndefined();

        // Check vertical move is allowed
        const moveToE3 = rookMoves.find(m => m.to === board.algebraicToIndex('e3'));
        expect(moveToE3).toBeDefined();

        // Check capture is allowed
        const captureE8 = rookMoves.find(m => m.to === board.algebraicToIndex('e8'));
        expect(captureE8).toBeDefined();
    });

    test('Absolute Pin: Diagonal Pin', () => {
        // White King at e1 (7, 4)
        board.placePiece(7, 4, new Piece('white', 'king'));
        // White Bishop at d2 (6, 3) - Pinned
        board.placePiece(6, 3, new Piece('white', 'bishop'));
        // Black Queen at a4 (4, 0) - Pinner (on diagonal a4-e8? No. a4 to e1 check.
        // a4 (4,0) -> b3 (5,1) -> c2 (6,2) -> d1 (7,3). No wait.
        // Let's use easy coords.
        // King e1. Bishop f2. Black Bishop h3.
        // e1 (7,4). f2 (6,5). h3 (5,7).
        // Diagonal: (7,4), (6,5), (5,6), (4,7).
        // Wait, h3 is (5,7).
        // Let's check Board.toRowCol
        // a8=0,0. a1=7,0. h1=7,7. e1=7,4.

        // King at e1 (7,4).
        board.placePiece(7, 4, new Piece('white', 'king'));

        // Pinned Pawn at f2 (6,5).
        board.placePiece(6, 5, new Piece('white', 'pawn'));

        // Pinner Black Bishop at h4 (4,7)?
        // 4,7 (h4) -> 5,6 (g3) -> 6,5 (f2) -> 7,4 (e1). Yes.
        board.placePiece(4, 7, new Piece('black', 'bishop'));

        board.activeColor = 'w';

        const moves = board.generateMoves();
        const pawnMoves = moves.filter(m => m.piece.type === 'pawn');

        // Pawn usually moves f2-f3.
        // Move to f3 (5,5) would expose king to h4 bishop?
        // h4 bishop attacks e1? No, if pawn at f3, line is blocked?
        // Line is h4-e1. Squares: g3, f2.
        // If pawn moves f2->f3. f2 becomes empty.
        // h4 bishop attacks e1 through g3, f2. Yes.

        // So f2-f3 is ILLEGAL.
        const moveF3 = pawnMoves.find(m => m.to === board.algebraicToIndex('f3'));
        expect(moveF3).toBeUndefined();

        // Pawn can capture g3? (if there was a piece).
        // Or if it could move along the diagonal. But pawns don't move along diagonal unless capturing.
        // So pawn is paralyzed.
        expect(pawnMoves.length).toBe(0);
    });
});
