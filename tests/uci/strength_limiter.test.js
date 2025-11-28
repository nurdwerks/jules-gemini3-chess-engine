const StrengthLimiter = require('../../src/StrengthLimiter');

describe('StrengthLimiter Elo Mapping', () => {
    test('1200 Elo returns approx 1000 nodes', () => {
        const nodes = StrengthLimiter.getNodesForElo(1200);
        expect(nodes).toBe(1000);
    });

    test('1800 Elo returns approx 10,000 nodes', () => {
        const nodes = StrengthLimiter.getNodesForElo(1800);
        expect(nodes).toBe(10000);
    });

    test('2400 Elo returns approx 100,000 nodes', () => {
        const nodes = StrengthLimiter.getNodesForElo(2400);
        expect(nodes).toBe(100000);
    });

    test('3000 Elo returns Infinity', () => {
        const nodes = StrengthLimiter.getNodesForElo(3000);
        expect(nodes).toBe(Infinity);
    });

    test('Low Elo returns small positive number', () => {
        const nodes = StrengthLimiter.getNodesForElo(600);
        // (600 - 1200)/600 + 3 = -1 + 3 = 2 -> 10^2 = 100
        expect(nodes).toBe(100);
    });

    test('Very low Elo returns at least 1', () => {
        const nodes = StrengthLimiter.getNodesForElo(100);
        expect(nodes).toBeGreaterThanOrEqual(1);
    });
});
