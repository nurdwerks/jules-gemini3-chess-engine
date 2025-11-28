const UCI = require('../../src/UCI');

describe('UCI go nodes command', () => {
    let uci;
    let outputs;

    beforeEach(() => {
        outputs = [];
        uci = new UCI((msg) => outputs.push(msg));
        // Disable workers for testing to keep it simple and synchronous-ish
        uci.stopWorkers();
        // Set Threads to 1 just in case
        uci.options.Threads = 1;
        // Mock UCI_UseNNUE to false to avoid net load
        uci.options.UCI_UseNNUE = false;
        uci.nnue = { network: null }; // Mock NNUE
    });

    afterEach(() => {
        uci.stopWorkers();
    });

    test('go nodes 1000 stops near 1000 nodes', () => {
        // Mock book to avoid early exit
        uci.book.findMove = () => null;

        uci.processCommand('position startpos');
        uci.processCommand('go nodes 1000');

        const bestMoveMsg = outputs.find(o => o.startsWith('bestmove'));
        expect(bestMoveMsg).toBeDefined();

        // Check info messages
        const infoMsgs = outputs.filter(o => o.startsWith('info') && o.includes('nodes'));
        expect(infoMsgs.length).toBeGreaterThan(0);

        const lastInfo = infoMsgs[infoMsgs.length - 1];
        const match = lastInfo.match(/nodes (\d+)/);
        expect(match).not.toBeNull();
        const nodes = parseInt(match[1], 10);

        console.log('Nodes searched:', nodes);

        // This expectation is set to PASS if the feature is implemented (nodes close to 1000).
        // It should FAIL if the feature is missing (nodes >> 1000, because depth 5 default).
        expect(nodes).toBeLessThan(2000);
    });
});
