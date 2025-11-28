const Board = require('../../src/Board.js')

describe('En Passant', () => {
  let board

  beforeEach(() => {
    board = new Board()
  })

  test('White En Passant Capture', () => {
    board.loadFen('rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 1')
    const moves = board.generateMoves()
    const epMove = moves.find(m => m.from === 52 && m.to === 35)
    expect(epMove).toBeDefined()
    expect(epMove.flags).toBe('e') // e for en passant
  })

  test('White En Passant Capture landing on h-file', () => {
    // White pawn on g5, black just played h7-h5. EP target is h6.
    board.loadFen('8/8/k7/6Pp/8/8/8/K7 w - h6 0 1')
    const moves = board.generateMoves()
    const epMove = moves.find(m => m.from === 54 && m.to === 39) // g5 to h6
    expect(epMove).toBeDefined()
    expect(epMove.flags).toBe('e') // e for en passant
  })

  test('White En Passant Capture landing on b-file', () => {
    // White pawn on c5, black just played b7-b5. EP target is b6.
    board.loadFen('8/k7/8/1pP5/8/8/8/K7 w - b6 0 1')
    const moves = board.generateMoves()
    const epMove = moves.find(m => m.from === 50 && m.to === 33) // c5 to b6
    expect(epMove).toBeDefined()
    expect(epMove.flags).toBe('e') // e for en passant
  })

  test('Invalid en passant because it is not the preceding move', () => {
    board.loadFen('rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1')
    const moves = board.generateMoves()
    const epMove = moves.find(m => m.from === 52 && m.to === 35)
    expect(epMove).toBeUndefined()
  })

  test('Invalid en passant because the capturing pawn is pinned', () => {
    board.loadFen('4r3/8/8/3pP3/8/8/8/4K3 w - d6 0 1')
    const moves = board.generateMoves()
    const epMove = moves.find(m => m.from === 52 && m.to === 35)
    expect(epMove).toBeUndefined()
  })
})
