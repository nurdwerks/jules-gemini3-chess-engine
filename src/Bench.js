const Search = require('./Search');
const { TranspositionTable } = require('./TranspositionTable');

class Bench {
    static run(uci, depth = 12) {
        const positions = [
            'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Start
            'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1', // Kiwipete
            '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', // Endgame
        ];

        let totalNodes = 0;
        let totalTime = 0;
        const startTotal = Date.now();

        console.log(`Benchmarking ${positions.length} positions at depth ${depth}...`);

        // We reuse UCI instance's TT? Or create new?
        // Standard: Reuse or reset.
        // UCI command `bench` usually uses existing engine state or resets it.
        // Let's use a fresh Search/TT for consistency or pass one.
        // The `uci` object is passed.

        for (const fen of positions) {
            uci.board.loadFen(fen);
            const search = new Search(uci.board, uci.tt);
            const start = Date.now();

            // Sync search?
            search.search(depth, { hardLimit: Infinity }, { ...uci.options });

            const end = Date.now();
            const nodes = search.nodes;
            const time = end - start;

            console.log(`Position: ${fen}`);
            console.log(`Nodes: ${nodes}, Time: ${time}ms, NPS: ${Math.floor(nodes / (time / 1000 + 0.001))}`);

            totalNodes += nodes;
            totalTime += time;
        }

        const totalElapsed = Date.now() - startTotal;
        console.log('===========================');
        console.log(`Total Nodes: ${totalNodes}`);
        console.log(`Total Time: ${totalElapsed}ms`);
        console.log(`Mean NPS: ${Math.floor(totalNodes / (totalElapsed / 1000))}`);

        return totalNodes;
    }
}

module.exports = Bench;
