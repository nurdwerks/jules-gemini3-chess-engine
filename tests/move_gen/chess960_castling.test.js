const Board = require('../../src/Board')

describe('Chess960 Castling', () => {
  it('should allow castling when king and rook are in standard positions', () => {
    const board = new Board()
    board.loadFen('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1')
    const moves = board.generateMoves()
    const castlingMoves = moves.filter(m => m.flags === 'k' || m.flags === 'q')
    expect(castlingMoves.length).toBe(2)
  })

  it('should allow castling when king is on f1 and rook is on h1', () => {
    const board = new Board()
    board.loadFen('5k1r/8/8/8/8/8/8/5K1R w Hh - 0 1')
    const moves = board.generateMoves()
    const castlingMoves = moves.filter(m => m.flags === 'k960')
    expect(castlingMoves.length).toBe(1)
  })

  it('should not allow castling through check', () => {
    const board = new Board()
    board.loadFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1')
    board.applyAlgebraicMove('e1g1')
    board.applyAlgebraicMove('a6e2')
    const moves = board.generateMoves()
    const castlingMoves = moves.filter(m => m.flags === 'k' || m.flags === 'q')
    expect(castlingMoves.length).toBe(0)
  })

  it('should not allow castling out of check', () => {
    const board = new Board()
    board.loadFen('rnbqk2r/pppp1ppp/4pn2/8/1b1P4/2N1P3/PPP2PPP/R1BQKBNR w KQkq - 1 4')
    board.applyAlgebraicMove('a2a3')
    board.applyAlgebraicMove('b4c3')
    const moves = board.generateMoves()
    const castlingMoves = moves.filter(m => m.flags === 'k' || m.flags === 'q')
    expect(castlingMoves.length).toBe(0)
  })

  it('should handle castling with rook on g1', () => {
    const board = new Board()
    board.loadFen('r3k1r1/pppppppp/8/8/8/8/PPPPPPPP/R3K1R1 w Qq - 0 1')
    const moves = board.generateMoves()
    const castlingMoves = moves.filter(m => m.flags === 'k' || m.flags === 'q')
    expect(castlingMoves.length).toBe(1)
  })
})
