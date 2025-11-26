const TimeManager = require('../src/TimeManager');

describe('TimeManager', () => {
    let tm;
    let mockBoard;

    beforeEach(() => {
        mockBoard = { fullMoveNumber: 20 };
        tm = new TimeManager(mockBoard);
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
        const args = ['wtime', '10000', 'btime', '10000', 'movestogo', '10'];
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

    test('should allocate less time in the opening', () => {
        mockBoard.fullMoveNumber = 5;
        const args = ['wtime', '60000', 'btime', '60000'];
        const timeLimits = tm.parseGoCommand(args, 'w');
        expect(timeLimits.softLimit).toBeLessThan(2000);
    });

    test('should allocate more time in the middlegame', () => {
        mockBoard.fullMoveNumber = 25;
        const args = ['wtime', '60000', 'btime', '60000'];
        const timeLimits = tm.parseGoCommand(args, 'w');
        expect(timeLimits.softLimit).toBeGreaterThan(1500);
    });

    test('should allocate even more time in the endgame', () => {
        mockBoard.fullMoveNumber = 45;
        const args = ['wtime', '60000', 'btime', '60000'];
        const timeLimits = tm.parseGoCommand(args, 'w');
        expect(timeLimits.softLimit).toBeGreaterThan(2000);
    });

    test('should use less time with a time advantage', () => {
        mockBoard.fullMoveNumber = 25;
        const args = ['wtime', '120000', 'btime', '30000'];
        const timeLimits = tm.parseGoCommand(args, 'w');
        const baseTm = new TimeManager(mockBoard);
        const baseTime = baseTm.parseGoCommand(['wtime', '60000', 'btime', '60000'], 'w');
        expect(timeLimits.softLimit).toBeLessThan(baseTime.softLimit * 2);
    });

    test('should use more time in time trouble', () => {
        mockBoard.fullMoveNumber = 25;
        const args = ['wtime', '30000', 'btime', '120000'];
        const timeLimits = tm.parseGoCommand(args, 'w');
        const baseTm = new TimeManager(mockBoard);
        const baseTime = baseTm.parseGoCommand(['wtime', '60000', 'btime', '60000'], 'w');
        expect(timeLimits.softLimit).toBeGreaterThan(baseTime.softLimit * 0.5);
    });

    test('should stop if search is stable', () => {
        const softLimit = 1000;
        const elapsed = 1100;
        const isStable = true;
        expect(tm.shouldStop(elapsed, softLimit, isStable)).toBe(true);
    });

    test('should not stop if search is unstable', () => {
        const softLimit = 1000;
        const elapsed = 1100;
        const isStable = false;
        expect(tm.shouldStop(elapsed, softLimit, isStable)).toBe(false);
    });
});
