const { NNUE, Accumulator } = require('../../src/NNUE');
const Board = require('../../src/Board');

jest.setTimeout(60000);

describe('NNUE', () => {
    let nnue;

    beforeAll(async () => {
        nnue = new NNUE();
        await nnue.loadNetwork('https://tests.stockfishchess.org/api/nn/nn-46832cfbead3.nnue');
    });

    test('should load the network file and parse all layers', () => {
        expect(nnue.network).not.toBeNull();
        expect(nnue.network.featureTransformer).not.toBeNull();
        expect(nnue.network.layers.length).toBe(3);
    });

    test('should produce a non-zero evaluation for the starting position', () => {
        const board = new Board();
        const score = nnue.evaluate(board);
        expect(score).not.toBe(0);
    });

    test('incremental update should match full refresh for a pawn move', () => {
        const board = new Board();
        const accumulator = new Accumulator();
        nnue.refreshAccumulator(accumulator, board);

        const moves = board.generateMoves();
        const move = moves.find(m => m.from === board.algebraicToIndex('e2') && m.to === board.algebraicToIndex('e4'));

        const changes = nnue.getChangedIndices(board, move, null);

        const incrementalAccumulator = accumulator.clone();
        nnue.updateAccumulator(incrementalAccumulator, changes);

        board.makeMove(move);
        const refreshAccumulator = new Accumulator();
        nnue.refreshAccumulator(refreshAccumulator, board);

        expect(incrementalAccumulator.white).toEqual(refreshAccumulator.white);
        expect(incrementalAccumulator.black).toEqual(refreshAccumulator.black);
    });

    test('incremental update should match full refresh for pawn promotion', () => {
        const board = new Board();
        board.loadFen('8/P7/8/8/8/8/8/k1K5 w - - 0 1');
        const accumulator = new Accumulator();
        nnue.refreshAccumulator(accumulator, board);

        const moves = board.generateMoves();
        const move = moves.find(m => m.promotion === 'q' && m.from === board.algebraicToIndex('a7') && m.to === board.algebraicToIndex('a8'));

        const changes = nnue.getChangedIndices(board, move, null);
        const incrementalAccumulator = accumulator.clone();
        nnue.updateAccumulator(incrementalAccumulator, changes);

        const boardAfterMove = board.clone();
        boardAfterMove.makeMove(move);

        const refreshAccumulator = new Accumulator();
        nnue.refreshAccumulator(refreshAccumulator, boardAfterMove);

        expect(incrementalAccumulator.white).toEqual(refreshAccumulator.white);
        expect(incrementalAccumulator.black).toEqual(refreshAccumulator.black);
    });

    test('incremental update should match full refresh for en passant', () => {
        const board = new Board();
        board.loadFen('rnbqkbnr/ppp2ppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2');
        const accumulator = new Accumulator();
        nnue.refreshAccumulator(accumulator, board);

        const moves = board.generateMoves();
        const move = moves.find(m => m.flags === 'e' && m.from === board.algebraicToIndex('e5') && m.to === board.algebraicToIndex('d6'));

        const changes = nnue.getChangedIndices(board, move, null);
        const incrementalAccumulator = accumulator.clone();
        nnue.updateAccumulator(incrementalAccumulator, changes);

        const boardAfterMove = board.clone();
        boardAfterMove.makeMove(move);

        const refreshAccumulator = new Accumulator();
        nnue.refreshAccumulator(refreshAccumulator, boardAfterMove);

        expect(incrementalAccumulator.white).toEqual(refreshAccumulator.white);
        expect(incrementalAccumulator.black).toEqual(refreshAccumulator.black);
    });

    test('incremental update should match full refresh for a capture move', () => {
        const board = new Board();
        board.loadFen('rnbqkb1r/ppp1pppp/5n2/3p4/4P3/2N5/PPPP1PPP/R1BQKBNR w KQkq - 0 3');
        const accumulator = new Accumulator();
        nnue.refreshAccumulator(accumulator, board);

        const moves = board.generateMoves();
        const move = moves.find(m => m.from === board.algebraicToIndex('e4') && m.to === board.algebraicToIndex('d5'));

        const changes = nnue.getChangedIndices(board, move, board.getPiece(board.algebraicToIndex('d5')));
        const incrementalAccumulator = accumulator.clone();
        nnue.updateAccumulator(incrementalAccumulator, changes);

        const boardAfterMove = board.clone();
        boardAfterMove.makeMove(move);

        const refreshAccumulator = new Accumulator();
        nnue.refreshAccumulator(refreshAccumulator, boardAfterMove);

        expect(incrementalAccumulator.white).toEqual(refreshAccumulator.white);
        expect(incrementalAccumulator.black).toEqual(refreshAccumulator.black);
    });

    test('incremental update should match full refresh for a knight move', () => {
        const board = new Board();
        const accumulator = new Accumulator();
        nnue.refreshAccumulator(accumulator, board);

        const moves = board.generateMoves();
        const move = moves.find(m => m.from === board.algebraicToIndex('g1') && m.to === board.algebraicToIndex('f3'));

        const changes = nnue.getChangedIndices(board, move, null);
        const incrementalAccumulator = accumulator.clone();
        nnue.updateAccumulator(incrementalAccumulator, changes);

        const boardAfterMove = board.clone();
        boardAfterMove.makeMove(move);

        const refreshAccumulator = new Accumulator();
        nnue.refreshAccumulator(refreshAccumulator, boardAfterMove);

        expect(incrementalAccumulator.white).toEqual(refreshAccumulator.white);
        expect(incrementalAccumulator.black).toEqual(refreshAccumulator.black);
    });

    test('incremental update should match full refresh for Chess960 castling', () => {
        const board = new Board();
        board.loadFen('5k1r/8/8/8/8/8/8/5K1R w Hh - 0 1');

        const moves = board.generateMoves();
        const move = moves.find(m => m.flags === 'k960');
        const boardAfterMove = board.clone();
        boardAfterMove.makeMove(move);

        const refreshAccumulator = new Accumulator();
        nnue.refreshAccumulator(refreshAccumulator, boardAfterMove);

        const accumulatorBefore = new Accumulator();
        nnue.refreshAccumulator(accumulatorBefore, board);
        const incrementalAccumulator = accumulatorBefore.clone();
        const changes = nnue.getChangedIndices(board, move, null);

        if (changes.white.refresh) {
            incrementalAccumulator.white.set(refreshAccumulator.white);
        } else {
            const whiteOnlyChanges = { white: changes.white, black: { added: [], removed: [] }};
            nnue.updateAccumulator(incrementalAccumulator, whiteOnlyChanges);
        }

        if (changes.black.refresh) {
            incrementalAccumulator.black.set(refreshAccumulator.black);
        } else {
            const blackOnlyChanges = { white: { added: [], removed: [] }, black: changes.black };
            nnue.updateAccumulator(incrementalAccumulator, blackOnlyChanges);
        }

        expect(incrementalAccumulator.white).toEqual(refreshAccumulator.white);
        expect(incrementalAccumulator.black).toEqual(refreshAccumulator.black);
    });
});
