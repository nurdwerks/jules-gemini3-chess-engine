const Board = require('../../src/Board')

describe('Zobrist Hashing', () => {
  let board

  beforeEach(() => {
    board = new Board()
    // Board initializes with Zobrist key calculation if we update it.
    // For now, we manually check the methods if they exist or will exist.
  })

  test('Initial Hash Calculation', () => {
    // We will assume board.zobristKey is set.
    // Let's manually calculate what it should be for start pos.
    // This is hard to "assert" exactly unless we expose the calculation logic or mock Zobrist.
    // Instead, let's verify that loading the same FEN gives the same hash.
    const hash1 = board.zobristKey
    board.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    const hash2 = board.zobristKey
    expect(hash1).toBe(hash2)
    expect(typeof hash1).toBe('bigint')
  })

  test('Incremental Updates vs Fresh Calculation', () => {
    // Make a move
    const move = {
      from: board.algebraicToIndex('e2'),
      to: board.algebraicToIndex('e4'),
      piece: board.getPiece(6, 4), // e2 pawn
      flags: 'n'
    }

    const state = board.applyMove(move)
    const incrementalHash = board.zobristKey

    // Force full recalculation
    board.calculateZobristKey()
    const freshHash = board.zobristKey

    expect(incrementalHash).toBe(freshHash)

    // Undo move
    board.undoApplyMove(move, state)
    board.calculateZobristKey()
    const restoredHash = board.zobristKey

    // Should match start
    // Note: undoApplyMove should also restore the key incrementally.
    // We will verify that in another test, here we just check if it matches start if we recalc.
    board.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    board.calculateZobristKey()
    expect(restoredHash).toBe(board.zobristKey)
  })

  test('Undo Restore Key Correctly', () => {
    const startHash = board.zobristKey

    const move = {
      from: board.algebraicToIndex('g1'),
      to: board.algebraicToIndex('f3'),
      piece: board.getPiece(7, 6), // g1 knight
      flags: 'n'
    }

    const state = board.applyMove(move)
    expect(board.zobristKey).not.toBe(startHash)

    board.undoApplyMove(move, state)
    expect(board.zobristKey).toBe(startHash)
  })

  test('Different positions have different hashes', () => {
    const hash1 = board.zobristKey
    board.loadFen('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1')
    const hash2 = board.zobristKey
    expect(hash1).not.toBe(hash2)
  })
})
