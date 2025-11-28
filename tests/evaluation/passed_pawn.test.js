const Board = require('../../src/Board');
const Search = require('../../src/Search');
const Evaluation = require('../../src/Evaluation');

describe('Passed Pawn Extensions', () => {
    let board;
    let search;

    beforeEach(() => {
        board = new Board();
        search = new Search(board);
    });

    // Test case for isPassedPawn
    test('should correctly identify a passed pawn', () => {
        // White pawn on e6, no black pawns on d, e, f files
        board.loadFen('8/8/4P3/8/8/8/8/k1K5 w - - 0 1');
        const pawnIndex = board.algebraicToIndex('e6');
        expect(Evaluation.isPassedPawn(board, pawnIndex)).toBe(true);

        // White pawn on e4, black pawn on d5
        board.loadFen('8/8/8/3p4/4P3/8/8/k1K5 w - - 0 1');
        const nonPassedPawnIndex = board.algebraicToIndex('e4');
        expect(Evaluation.isPassedPawn(board, nonPassedPawnIndex)).toBe(false);
    });

    // Test case for search extension
    test('should find promotion faster with passed pawn extension', () => {
        // Position where a passed pawn is about to promote
        board.loadFen('k7/8/8/8/8/8/p7/4K3 b - - 0 1');

        // Without extensions, a shallow search might not see the promotion.
        // With extensions, it should find it.
        // We will run a search at a depth where it would normally fail.
        // The extension should allow it to find the promotion.
        const bestMove = search.search(2); // Depth 2 would normally not be enough

        // The move should be a2-a1=Q
        expect(bestMove).toBeDefined();
        expect(bestMove).not.toBeNull();
        expect(search.moveToString(bestMove)).toBe('a2a1q');
    });
});
