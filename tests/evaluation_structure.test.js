const Evaluation = require('../src/Evaluation');
const Board = require('../src/Board');

describe('Evaluation - Pawn Structure', () => {
    let board;

    beforeEach(() => {
        board = new Board();
    });

    test('Identifies Passed Pawn bonus', () => {
        // White Pawn on e5.
        // Scenario 1: Blocked by Black Pawn on e6. (Not Passed)
        const boardBlocked = new Board();
        boardBlocked.loadFen('8/8/4p3/4P3/8/8/8/8 w - - 0 1');

        // Scenario 2: No Black Pawn ahead on e, d, or f files. (Passed)
        const boardPassed = new Board();
        boardPassed.loadFen('8/8/8/4P3/8/8/8/8 w - - 0 1');

        const scoreBlocked = Evaluation.evaluatePawnStructure(boardBlocked, boardBlocked.algebraicToIndex('e5'), 'white');
        const scorePassed = Evaluation.evaluatePawnStructure(boardPassed, boardPassed.algebraicToIndex('e5'), 'white');

        console.log(`Blocked: ${scoreBlocked}, Passed: ${scorePassed}`);
        expect(scorePassed).toBeGreaterThan(scoreBlocked);
    });

    test('Passed Pawn bonus increases with Rank', () => {
        // Pawn on e4 vs e6
        const boardLow = new Board();
        boardLow.loadFen('8/8/8/8/4P3/8/8/8 w - - 0 1'); // e4

        const boardHigh = new Board();
        boardHigh.loadFen('8/8/4P3/8/8/8/8/8 w - - 0 1'); // e6

        const scoreLow = Evaluation.evaluatePawnStructure(boardLow, boardLow.algebraicToIndex('e4'), 'white');
        const scoreHigh = Evaluation.evaluatePawnStructure(boardHigh, boardHigh.algebraicToIndex('e6'), 'white');

        expect(scoreHigh).toBeGreaterThan(scoreLow);
    });

    test('Black Passed Pawn detection', () => {
         // Black Pawn on e4.
        // Scenario 1: Blocked by White Pawn on e3. (Not Passed)
        const boardBlocked = new Board();
        boardBlocked.loadFen('8/8/8/8/4p3/4P3/8/8 b - - 0 1');

        // Scenario 2: Passed
        const boardPassed = new Board();
        boardPassed.loadFen('8/8/8/8/4p3/8/8/8 b - - 0 1');

        const scoreBlocked = Evaluation.evaluatePawnStructure(boardBlocked, boardBlocked.algebraicToIndex('e4'), 'black');
        const scorePassed = Evaluation.evaluatePawnStructure(boardPassed, boardPassed.algebraicToIndex('e4'), 'black');

        expect(scorePassed).toBeGreaterThan(scoreBlocked);
    });
});
