const Search = require('../../src/Search');
const Board = require('../../src/Board');

describe('Time Management Override & Fast Move at Low Elo', () => {
    let board;
    let search;

    beforeEach(() => {
        board = new Board();
        search = new Search(board);
    });

    test('Engine returns quickly at low Elo (effectively overriding time management)', () => {
        // Complex position
        board.loadFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');

        // Low Elo -> very few nodes
        const options = {
            UCI_LimitStrength: true,
            UCI_Elo: 600 // ~100 nodes
        };

        const startTime = Date.now();
        // Give it plenty of time (10 seconds)
        search.search(20, { hardLimit: 10000, softLimit: 10000 }, options);
        const duration = Date.now() - startTime;

        // Should be very fast (< 100ms usually, but let's say < 500ms to be safe in CI)
        // Increasing to 1000ms to avoid flakiness on slower systems
        expect(duration).toBeLessThan(1000);
        expect(search.nodes).toBeLessThan(200);
    });
});
