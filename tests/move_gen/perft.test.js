const Board = require('../../src/engine/Board')

describe('Perft Verification', () => {
  let board

  beforeEach(() => {
    board = new Board()
  })

  // Start Position
  // Depth 1: 20
  // Depth 2: 400
  // Depth 3: 8902
  // Depth 4: 197281 (might be too slow for basic test, but 8902 is fine)

  test('Perft(1) Start Position', () => {
    board.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    expect(board.perft(1)).toBe(20)
  })

  test('Perft(2) Start Position', () => {
    board.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    expect(board.perft(2)).toBe(400)
  })

  test('Perft(3) Start Position', () => {
    board.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    expect(board.perft(3)).toBe(8902)
  })

  // Position 3
  // 8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1
  // Depth 1: 14
  // Depth 2: 191
  // Depth 3: 2812

  test('Perft(1) Position 3', () => {
    board.loadFen('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1')
    expect(board.perft(1)).toBe(14)
  })

  test('Perft(2) Position 3', () => {
    board.loadFen('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1')
    expect(board.perft(2)).toBe(191)
  })

  // Position 4 (Good for castling/promotion/checks)
  // r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1
  // Depth 1: 6
  // Depth 2: 264
  // Depth 3: 9467

  test('Perft(1) Position 4', () => {
    board.loadFen('r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1')
    expect(board.perft(1)).toBe(6)
  })

  test('Perft(2) Position 4', () => {
    board.loadFen('r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1')
    expect(board.perft(2)).toBe(264)
  })

  // Position 5 (Good for castling rights)
  // rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8
  // Depth 1: 44
  // Depth 2: 1486
  // Depth 3: 62379
  test('Perft(1) Position 5', () => {
    board.loadFen('rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8')
    expect(board.perft(1)).toBe(44)
  })
})
