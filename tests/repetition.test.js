const Board = require('../src/Board');

describe('Draw by Repetition', () => {
    let board;

    beforeEach(() => {
        board = new Board();
    });

    test('3-fold repetition detection', () => {
        board.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        // Initial pos is 1st occurrence.

        // White Nf3 (1)
        let move = { from: 118, to: 85, piece: board.getPiece(7, 6), flags: 'n' };
        board.applyMove(move);

        // Black Nf6 (1)
        move = { from: 6, to: 39, piece: board.getPiece(0, 6), flags: 'n' };
        board.applyMove(move);

        // White Ng1 (2 - Back to start)
        move = { from: 85, to: 118, piece: board.getPiece(5, 5), flags: 'n' };
        board.applyMove(move);

        // Black Ng8 (2 - Back to start)
        move = { from: 39, to: 6, piece: board.getPiece(2, 7), flags: 'n' };
        board.applyMove(move);

        // Current state is same as start.
        // History should have start hash.
        // Wait, does history include the *current* state?
        // My implementation: history.push(this.zobristKey) at end of applyMove.
        // So history contains all states *after* moves.
        // The *start* state is not in history unless we push it on loadFen/init.
        // Let's check Board.js. loadFen clears history.
        // So start state is NOT in history list.
        // We should probably check: current key vs history.

        expect(board.isDrawByRepetition()).toBe(false); // Only 2 repetitions so far (Initial + Current)

        // Let's do it again.
        // White Nf3
        move = { from: 118, to: 85, piece: board.getPiece(7, 6), flags: 'n' };
        board.applyMove(move);

        // Black Nf6
        move = { from: 6, to: 39, piece: board.getPiece(0, 6), flags: 'n' };
        board.applyMove(move);

        // White Ng1
        move = { from: 85, to: 118, piece: board.getPiece(5, 5), flags: 'n' };
        board.applyMove(move);

        // Black Ng8 (3rd time back to start)
        move = { from: 39, to: 6, piece: board.getPiece(2, 7), flags: 'n' };
        board.applyMove(move);

        expect(board.isDrawByRepetition()).toBe(true);
    });
});
