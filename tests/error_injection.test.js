const Search = require('../src/Search');
const Board = require('../src/Board');
const UCI = require('../src/UCI');

describe('Strength Limitation & Error Injection', () => {
    let board;
    let search;

    beforeEach(() => {
        board = new Board();
        search = new Search(board);
    });

    test('Engine respects node limits at low Elo', () => {
        // Setup a complex position where deep search uses many nodes
        board.loadFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');

        // Configure search for 1200 Elo (approx 1000 nodes)
        const options = {
            UCI_LimitStrength: true,
            UCI_Elo: 1200
        };

        search.search(10, { hardLimit: Infinity }, options);

        expect(search.nodes).toBeLessThanOrEqual(1200); // 1000 + margin
        expect(search.nodes).toBeGreaterThan(0);
    });

    test('Engine restricts depth/nodes significantly at min Elo', () => {
        board.loadFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');

        const options = {
            UCI_LimitStrength: true,
            UCI_Elo: 100 // Very low -> < 10 nodes
        };

        search.search(10, { hardLimit: Infinity }, options);

        expect(search.nodes).toBeLessThan(50);
    });
});
