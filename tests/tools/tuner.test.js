const Tuner = require('../../tools/Tuner');

describe('Tuner Error Function', () => {
    test('sigmoid returns 0.5 for score 0', () => {
        expect(Tuner.sigmoid(0)).toBe(0.5);
    });

    test('sigmoid returns > 0.5 for positive score', () => {
        expect(Tuner.sigmoid(100)).toBeGreaterThan(0.5);
    });

    test('sigmoid returns < 0.5 for negative score', () => {
        expect(Tuner.sigmoid(-100)).toBeLessThan(0.5);
    });

    test('calculateError computes MSE', () => {
        const tuner = new Tuner();
        const positions = [
            { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', result: 0.5 } // Score 0 -> Prob 0.5 -> Error 0
        ];

        // Mock Evaluation to return 0?
        // Evaluation.evaluate(startpos) is 0.
        const error = tuner.calculateError(positions);
        expect(error).toBeCloseTo(0);
    });
});
