const EpdLoader = require('../tools/EpdLoader');
const fs = require('fs');
const path = require('path');

describe('EPD Dataset Loader', () => {
    const testFile = path.join(__dirname, 'test.epd');

    beforeAll(() => {
        const content = [
            'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 c0 "start"; result 1/2-1/2;',
            'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1 c0 "e4"; result 1-0;',
            'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2 c0 "sicilian"; result 0-1;'
        ].join('\n');
        fs.writeFileSync(testFile, content);
    });

    afterAll(() => {
        if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
    });

    test('loads positions correctly', async () => {
        const positions = await EpdLoader.load(testFile);
        expect(positions.length).toBe(3);

        expect(positions[0].result).toBe(0.5);
        expect(positions[0].fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

        expect(positions[1].result).toBe(1.0);
        expect(positions[1].fen).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');

        expect(positions[2].result).toBe(0.0);
        expect(positions[2].fen).toBe('rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2');
    });
});
