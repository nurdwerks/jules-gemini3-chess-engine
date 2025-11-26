const TimeManager = require('../src/TimeManager');
const Board = require('../src/Board');

describe('TimeManager', () => {
    let tm;
    let board;

    beforeEach(() => {
        tm = new TimeManager();
        board = new Board();
    });

    test('should allocate less time in the opening', () => {
        board.moveNumber = 5;
        const args = ['wtime', '60000', 'btime', '60000'];
        const timeLimits = tm.parseGoCommand(args, 'w', board);
        expect(timeLimits.softLimit).toBeLessThan(2000);
    });

    test('should allocate more time in the middlegame', () => {
        board.moveNumber = 25;
        const args = ['wtime', '60000', 'btime', '60000'];
        const timeLimits = tm.parseGoCommand(args, 'w', board);
        expect(timeLimits.softLimit).toBeGreaterThan(1500);
    });

    test('should allocate even more time in the endgame', () => {
        board.moveNumber = 45;
        const args = ['wtime', '60000', 'btime', '60000'];
        const timeLimits = tm.parseGoCommand(args, 'w', board);
        expect(timeLimits.softLimit).toBeGreaterThan(2000);
    });

    test('should use less time with a time advantage', () => {
        board.moveNumber = 25;
        const args = ['wtime', '120000', 'btime', '30000'];
        const timeLimits = tm.parseGoCommand(args, 'w', board);
        const baseTime = new TimeManager().parseGoCommand(['wtime', '60000', 'btime', '60000'], 'w', board);
        expect(timeLimits.softLimit).toBeLessThan(baseTime.softLimit * 2);
    });

    test('should use more time in time trouble', () => {
        board.moveNumber = 25;
        const args = ['wtime', '30000', 'btime', '120000'];
        const timeLimits = tm.parseGoCommand(args, 'w', board);
        const baseTime = new TimeManager().parseGoCommand(['wtime', '60000', 'btime', '60000'], 'w', board);
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
