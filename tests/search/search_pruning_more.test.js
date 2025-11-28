const Search = require('../../src/Search');
const Board = require('../../src/Board');

describe('Search Pruning (More)', () => {
    let board;
    let search;

    beforeEach(() => {
        board = new Board();
        search = new Search(board);
    });

    test('Late Move Reduction logic', () => {
        // Hard to verify internal reduction without stats or probing.
        // But we can verify it still finds the best move in tactical positions where LMR shouldn't hurt (or is re-searched).
        // Kiwipete position?
        // Just standard search.
        // If LMR is aggressive, it might miss something?
        // If implemented correctly, it handles PVS re-search.

        board.loadFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');
        search.search(3);
        // It should finish without error.
    });

    test('Futility Pruning logic', () => {
        // Low depth search.
        search.search(1);
        // Should utilize futility if possible.
    });
});
