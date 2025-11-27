const Board = require('../src/Board');

describe('Board.generateMoves Crash Reproduction', () => {
    test('should not return undefined when king is missing from squares but present in bitboards', () => {
        const board = new Board();
        board.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

        // Manually desynchronize board state
        // The white king is at e1.
        // In 0x88 representation:
        // Rank 1 (row 7) is 0x70. Col e (4). Index = 0x74 = 116.
        const e1 = 116;

        // Verify initial state
        expect(board.squares[e1]).not.toBeNull();
        expect(board.squares[e1].type).toBe('king');
        expect(board.squares[e1].color).toBe('white');

        // Verify bitboard has king
        // Row 7 -> bitboard rank 0. Col 4. Index 4.
        const bitIndex = 4n;
        expect((board.bitboards.white & (1n << bitIndex)) !== 0n).toBe(true);
        expect((board.bitboards.king & (1n << bitIndex)) !== 0n).toBe(true);

        // Corrupt the squares array: Remove the king
        board.squares[e1] = null;

        // Now generating moves.
        // Previous behavior: generateMoves() returns undefined because getKingIndex returns -1 and it returns void.
        // Expected behavior: generateMoves() returns an array (possibly empty or partial, but valid array).
        const moves = board.generateMoves();

        // The critical check: moves must be defined and be an array
        expect(moves).toBeDefined();
        expect(Array.isArray(moves)).toBe(true);
    });
});
