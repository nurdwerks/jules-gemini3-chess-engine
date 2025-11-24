const Search = require('../src/Search');
const Board = require('../src/Board');
const fs = require('fs');
const path = require('path');

describe('JSON Tree Export', () => {
    let board;
    let search;
    const outputFile = path.join(__dirname, 'test_tree.json');

    beforeEach(() => {
        board = new Board();
        search = new Search(board);
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    });

    afterEach(() => {
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    });

    test('Search generates a JSON tree when debug mode is enabled', () => {
        const options = {
            debug: true,
            debugFile: outputFile
        };

        search.search(2, { hardLimit: Infinity }, options);

        expect(fs.existsSync(outputFile)).toBe(true);

        const content = fs.readFileSync(outputFile, 'utf8');
        const json = JSON.parse(content);

        expect(json).toBeDefined();
        expect(json.depth).toBeDefined();
        expect(json.nodes).toBeDefined(); // Root nodes
        expect(Array.isArray(json.nodes)).toBe(true);

        // Check structure of a node
        const firstNode = json.nodes[0];
        expect(firstNode.move).toBeDefined();
        expect(firstNode.score).toBeDefined();
        expect(firstNode.children).toBeDefined();
    });
});
