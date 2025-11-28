
const Board = require('../../src/Board');
const Search = require('../../src/Search');
const Zobrist = require('../../src/Zobrist');

describe('Story Verification', () => {

    test('Draw by 50-move rule', () => {
        const board = new Board();
        board.halfMoveClock = 99;
        expect(board.isDrawBy50Moves()).toBe(false);

        board.halfMoveClock = 100;
        expect(board.isDrawBy50Moves()).toBe(true);
    });

    test('Draw by Repetition (3-fold)', () => {
        const board = new Board();
        // Start pos
        const startKey = board.zobristKey;

        // Move 1: e2e4
        const e2 = board.algebraicToIndex('e2');
        const e4 = board.algebraicToIndex('e4');

        // Knights jumping back and forth

        // 1. w: Ng1-f3
        const g1 = board.algebraicToIndex('g1');
        const f3 = board.algebraicToIndex('f3');
        let move = board.generateMoves().find(m => m.from === g1 && m.to === f3);
        board.applyMove(move);

        // 2. b: Ng8-f6
        const g8 = board.algebraicToIndex('g8');
        const f6 = board.algebraicToIndex('f6');
        move = board.generateMoves().find(m => m.from === g8 && m.to === f6);
        board.applyMove(move);

        // 3. w: Nf3-g1 (back)
        move = board.generateMoves().find(m => m.from === f3 && m.to === g1);
        board.applyMove(move);

        // 4. b: Nf6-g8 (back)
        move = board.generateMoves().find(m => m.from === f6 && m.to === g8);
        board.applyMove(move);

        // Now we are back at start position (visually).
        // History has 4 items. One of them (the last one, resulting from move 4) is the start position key.
        // Wait, applyMove pushes the NEW key.
        // StartKey is NOT in history.
        // Move 1: Key1.
        // Move 2: Key2.
        // Move 3: Key3 (matches Key1).
        // Move 4: Key4 (matches StartKey).

        // History: [K1, K2, K1, StartKey].
        // Board Key: StartKey.

        // isDrawByRepetition counts occurrences in history.
        // Finds 1 occurrence of StartKey.
        // Count = 1.
        // Returns count >= 2? False.

        expect(board.isDrawByRepetition()).toBe(false); // 2nd occurrence (1 previous + current)

        // 5. w: Ng1-f3
        move = board.generateMoves().find(m => m.from === g1 && m.to === f3);
        board.applyMove(move);

        // 6. b: Ng8-f6
        move = board.generateMoves().find(m => m.from === g8 && m.to === f6);
        board.applyMove(move);

        // 7. w: Nf3-g1
        move = board.generateMoves().find(m => m.from === f3 && m.to === g1);
        board.applyMove(move);

        // 8. b: Nf6-g8
        move = board.generateMoves().find(m => m.from === f6 && m.to === g8);
        board.applyMove(move);

        // History: [..., K1, K2, K1, StartKey, K1, K2, K1, StartKey]
        // Count of StartKey in history is 2.
        // Returns true.

        expect(board.isDrawByRepetition()).toBe(true); // 3rd occurrence
    });

    test('Zobrist Key Consistency', () => {
        const board = new Board();
        const initialKey = board.zobristKey;

        // Make a move
        const e2 = board.algebraicToIndex('e2');
        const e4 = board.algebraicToIndex('e4');
        const move = board.generateMoves().find(m => m.from === e2 && m.to === e4);

        const state = board.applyMove(move);
        const afterKey = board.zobristKey;

        expect(initialKey).not.toBe(afterKey);

        board.undoApplyMove(move, state);
        const restoredKey = board.zobristKey;

        expect(restoredKey).toBe(initialKey);
    });
});
