const Polyglot = require('../../src/Polyglot')
const Board = require('../../src/Board')
const fs = require('fs')
const path = require('path')

describe('Polyglot', () => {
  let polyglot
  let board
  const testBookPath = path.join(__dirname, 'test_book.bin')

  beforeEach(() => {
    polyglot = new Polyglot()
    board = new Board()
  })

  afterAll(() => {
    if (fs.existsSync(testBookPath)) {
      fs.unlinkSync(testBookPath)
    }
  })

  test('Computes a key for start position', () => {
    const key = polyglot.computeKey(board)
    expect(typeof key).toBe('bigint')
  })

  test('Computes different keys for different positions', () => {
    const key1 = polyglot.computeKey(board)
    // board.applyAlgebraicMove is in UCI, not Board. Board uses applyMove with object.
    // We can simulate it.
    const e2 = board.algebraicToIndex('e2')
    const e4 = board.algebraicToIndex('e4')
    const moves = board.generateMoves()
    const move = moves.find(m => m.from === e2 && m.to === e4)
    board.applyMove(move)

    const key2 = polyglot.computeKey(board)
    expect(key1).not.toBe(key2)
  })

  test('Reads from a book file', () => {
    // Create a dummy book file
    // Entry: Key (8), Move (2), Weight (2), Learn (4) = 16 bytes
    // We will add an entry for the Start Position.

    const key = polyglot.computeKey(board) // Start pos key using OUR constants
    // e2e4: from e2 (4,1 -> row 1, col 4). to e4 (4,3 -> row 3, col 4)
    // Polyglot:
    // fromRow: 1, fromCol: 4.
    // toRow: 3, toCol: 4.
    // moveInt: promo(0)<<12 | fromRow(1)<<9 | fromCol(4)<<6 | toRow(3)<<3 | toCol(4)
    // 0 | 512 | 256 | 24 | 4 = 796

    // Let's encode e2e4 manually
    // e2 (white) is row 1 in Polyglot (Rank 2). Col 4 (File E).
    // e4 is row 3 in Polyglot (Rank 4). Col 4.
    // fromRow=1, fromCol=4, toRow=3, toCol=4.
    const encodedMove = (1 << 9) | (4 << 6) | (3 << 3) | 4

    const buf = Buffer.alloc(16)
    buf.writeBigUInt64BE(key, 0)
    buf.writeUInt16BE(encodedMove, 8)
    buf.writeUInt16BE(100, 10) // Weight
    buf.writeUInt32BE(0, 12) // Learn

    fs.writeFileSync(testBookPath, buf)

    polyglot.loadBook(testBookPath)

    const move = polyglot.findMove(board)

    expect(move).not.toBeNull()
    expect(move.from).toBe(board.algebraicToIndex('e2'))
    expect(move.to).toBe(board.algebraicToIndex('e4'))
  })

  test('Handles multiple entries and weights', () => {
    const key = polyglot.computeKey(board)

    // e2e4 (Weight 10)
    const move1 = (1 << 9) | (4 << 6) | (3 << 3) | 4
    // d2d4 (Weight 50) -> d2(1,3) -> d4(3,3)
    const move2 = (1 << 9) | (3 << 6) | (3 << 3) | 3

    const buf1 = Buffer.alloc(16)
    buf1.writeBigUInt64BE(key, 0)
    buf1.writeUInt16BE(move1, 8)
    buf1.writeUInt16BE(10, 10)

    const buf2 = Buffer.alloc(16)
    buf2.writeBigUInt64BE(key, 0)
    buf2.writeUInt16BE(move2, 8)
    buf2.writeUInt16BE(50, 10)

    // Should be sorted by key? Keys are same.
    // Polyglot file entries should be sorted by key.
    // Since keys are equal, order doesn't matter for binary search finding the block.

    const fd = fs.openSync(testBookPath, 'w')
    fs.writeSync(fd, buf1)
    fs.writeSync(fd, buf2)
    fs.closeSync(fd)

    polyglot.loadBook(testBookPath)

    // Run multiple times to check random distribution?
    // Mock Math.random to deterministic?
    // For now, just check it returns one of them.
    const move = polyglot.findMove(board)
    expect(move).not.toBeNull()
    // It should be either e2e4 or d2d4
    const e2e4 = board.algebraicToIndex('e2') + '-' + board.algebraicToIndex('e4')
    const d2d4 = board.algebraicToIndex('d2') + '-' + board.algebraicToIndex('d4')
    const res = move.from + '-' + move.to
    expect([e2e4, d2d4]).toContain(res)
  })
})
