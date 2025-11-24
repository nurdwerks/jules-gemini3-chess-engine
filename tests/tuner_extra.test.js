const Tuner = require('../tools/Tuner');

describe('Tuner Extra', () => {
    test('minimize optimizes weights locally', () => {
        const tuner = new Tuner();
        const positions = [
            { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', result: 0.5 },
            // winning position for white
            { fen: '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1', result: 1.0 }
        ];

        const initialError = tuner.calculateError(positions);
        tuner.minimize(positions, 1); // 1 iteration
        const finalError = tuner.calculateError(positions);

        expect(finalError).toBeLessThanOrEqual(initialError);
    });

    test('saveWeights writes to file', () => {
        const tuner = new Tuner();
        const outFile = 'weights_test.json';
        tuner.saveWeights(outFile);
        const fs = require('fs');
        expect(fs.existsSync(outFile)).toBe(true);
        fs.unlinkSync(outFile);
    });
});
