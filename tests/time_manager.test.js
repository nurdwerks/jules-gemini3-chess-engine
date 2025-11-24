const TimeManager = require('../src/TimeManager');

describe('TimeManager', () => {
    let tm;

    beforeEach(() => {
        tm = new TimeManager();
    });

    test('Parses wtime/btime correctly', () => {
        const args = ['wtime', '60000', 'btime', '50000', 'winc', '1000', 'binc', '1000'];
        const limits = tm.parseGoCommand(args, 'w');

        expect(tm.wtime).toBe(60000);
        expect(tm.btime).toBe(50000);
        expect(tm.winc).toBe(1000);

        // Basic check for allocation logic
        // 60000 / 20 = 3000 + 500 = 3500 approx
        expect(limits.softLimit).toBeGreaterThan(1000);
        expect(limits.softLimit).toBeLessThan(60000);
    });

    test('Handles movetime (fixed time)', () => {
        const args = ['movetime', '5000'];
        const limits = tm.parseGoCommand(args, 'w');

        expect(limits.hardLimit).toBe(5000);
        expect(limits.softLimit).toBe(5000);
    });

    test('Handles movesToGo', () => {
        const args = ['wtime', '10000', 'movestogo', '10'];
        const limits = tm.parseGoCommand(args, 'w');

        // 10000 / 10 = 1000
        expect(limits.softLimit).toBeCloseTo(1000, -2); // Approx
    });

    test('Infinite search', () => {
        const args = ['infinite'];
        const limits = tm.parseGoCommand(args, 'w');
        expect(limits.hardLimit).toBe(Infinity);
    });

    test('Safety buffer - Very low time', () => {
        const args = ['wtime', '100', 'winc', '0']; // 100ms left
        const limits = tm.parseGoCommand(args, 'w');

        // overhead is 50. maxTime = 50.
        // target = 100/20 = 5.
        // min soft = 10.
        expect(limits.hardLimit).toBeLessThanOrEqual(50);
        expect(limits.softLimit).toBeGreaterThanOrEqual(10);
    });
});
