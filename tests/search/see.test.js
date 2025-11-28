const SEE = require('../../src/SEE')
const Board = require('../../src/Board')

describe('Static Exchange Evaluation (SEE)', () => {
  let board

  beforeEach(() => {
    board = new Board()
  })

  test('getSmallestAttacker finds pawn', () => {
    board.loadFen('8/8/8/4p3/3P4/8/8/8 w - - 0 1')
    // White Pawn on d4 (Index ?). Black Pawn on e5.
    // d4 is attacked by e5.
    // d4 index: row 4 (rank 4), col 3.
    // Row 4 is 0x88 row 4.
    const d4 = board.algebraicToIndex('d4')
    const attacker = SEE.getSmallestAttacker(board, d4, 'black')
    expect(attacker).not.toBeNull()
    expect(attacker.piece.type).toBe('pawn')
    expect(attacker.piece.color).toBe('black')
  })

  test('getSmallestAttacker prefers pawn over knight', () => {
    // d4 attacked by e5 (pawn) and c6 (knight)
    board.loadFen('8/8/2n5/4p3/3P4/8/8/8 w - - 0 1')
    const d4 = board.algebraicToIndex('d4')
    const attacker = SEE.getSmallestAttacker(board, d4, 'black')
    expect(attacker).not.toBeNull()
    expect(attacker.piece.type).toBe('pawn')
  })
})
