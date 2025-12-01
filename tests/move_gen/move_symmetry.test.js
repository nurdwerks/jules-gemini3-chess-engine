const Board = require('../../src/engine/Board')

function moveToNotation (board, move) {
  const from = board.toRowCol(move.from)
  const to = board.toRowCol(move.to)
  const fromAlg = String.fromCharCode(97 + from.col) + (8 - from.row)
  const toAlg = String.fromCharCode(97 + to.col) + (8 - to.row)
  let notation = `${fromAlg}${toAlg}`
  if (move.promotion) {
    notation += move.promotion
  }
  return notation
}

function testSymmetry (fen, moveNotation) {
  const board = new Board()
  board.loadFen(fen)
  const initialFen = board.generateFen()
  const initialZobristKey = board.zobristKey

  const moves = board.generateMoves()
  const move = moves.find(m => moveToNotation(board, m) === moveNotation)

  if (!move) {
    console.log(`Move not found: ${moveNotation}`)
    console.log(`FEN: ${fen}`)
    console.log('Available moves:', moves.map(m => moveToNotation(board, m)))
  }

  expect(move).toBeDefined()

  const state = board.applyMove(move)
  board.undoApplyMove(move, state)

  expect(board.generateFen()).toBe(initialFen)
  expect(board.zobristKey).toBe(initialZobristKey)
}

describe('makeMove/unmakeMove symmetry', () => {
  test('pawn push', () => {
    testSymmetry('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'e2e4')
  })

  test('pawn double push', () => {
    testSymmetry('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'd2d4')
  })

  test('pawn capture', () => {
    testSymmetry('rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1', 'e4d5')
  })

  test('knight move', () => {
    testSymmetry('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'g1f3')
  })

  test('knight capture', () => {
    testSymmetry('rnbqkb1r/ppp1pppp/5n2/3p4/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3', 'f3d4')
  })

  test('bishop move', () => {
    testSymmetry('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2', 'f1c4')
  })

  test('bishop capture', () => {
    testSymmetry('rnbqk1nr/pppp1ppp/8/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 4', 'c4f7')
  })

  test('rook move', () => {
    testSymmetry('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'a1b1')
  })

  test('rook capture', () => {
    testSymmetry('r2k3r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQ - 0 1', 'a1d1')
  })

  test('queen move', () => {
    testSymmetry('rnbqkbnr/pppp1ppp/8/4p3/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1', 'd8h4')
  })

  test('queen capture', () => {
    testSymmetry('rnb1kbnr/ppp2ppp/8/3qp3/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 4', 'd1e2')
  })

  test('king move', () => {
    testSymmetry('rnbqk1nr/pppp1ppp/8/4p3/4P3/8/PPPB1PPP/RN1QKBNR b KQkq - 0 1', 'e8e7')
  })

  test('king capture', () => {
    testSymmetry('8/8/8/8/8/4p3/4K3/8 w - - 0 1', 'e2e3')
  })

  test('en passant', () => {
    testSymmetry('rnbqkbnr/ppp1pppp/8/8/3pP3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', 'd4e3')
  })

  test('pawn promotion to queen', () => {
    testSymmetry('rnbq1bnr/pPpppppp/8/8/8/8/1PP1PPPP/RNBQKBNR w KQ - 1 6', 'b7a8q')
  })

  test('pawn promotion to rook', () => {
    testSymmetry('rnbq1bnr/pPpppppp/8/8/8/8/1PP1PPPP/RNBQKBNR w KQ - 1 6', 'b7a8r')
  })

  test('pawn promotion to bishop', () => {
    testSymmetry('rnbq1bnr/pPpppppp/8/8/8/8/1PP1PPPP/RNBQKBNR w KQ - 1 6', 'b7a8b')
  })

  test('pawn promotion to knight', () => {
    testSymmetry('rnbq1bnr/pPpppppp/8/8/8/8/1PP1PPPP/RNBQKBNR w KQ - 1 6', 'b7a8n')
  })

  test('white kingside castle', () => {
    testSymmetry('rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', 'e1g1')
  })

  test('white queenside castle', () => {
    testSymmetry('r3k2r/pppq1ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPPQ1PPP/R3K2R w KQkq - 2 8', 'e1c1')
  })

  test('black kingside castle', () => {
    testSymmetry('rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R b KQkq - 5 4', 'e8g8')
  })

  test('black queenside castle', () => {
    testSymmetry('r3k2r/pppq1ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPPQ1PPP/R1B1K2R b KQkq - 3 8', 'e8c8')
  })

  test('chess960 white kingside castle (king on e-file)', () => {
    testSymmetry('4k3/8/8/8/8/8/PPPPPPPP/1R2K2R w BHbh - 0 1', 'e1g1')
  })

  test('chess960 white queenside castle (king on e-file)', () => {
    testSymmetry('4k3/8/8/8/8/8/PPPPPPPP/1R2K2R w BHbh - 0 1', 'e1c1')
  })

  test('chess960 black kingside castle (king on e-file)', () => {
    testSymmetry('1r2k2r/pppppppp/8/8/8/8/8/4K3 b bh - 0 1', 'e8g8')
  })

  test('chess960 black queenside castle (king on e-file)', () => {
    testSymmetry('1r2k2r/pppppppp/8/8/8/8/8/4K3 b bh - 0 1', 'e8c8')
  })

  test('chess960 white kingside castle (king on b-file)', () => {
    testSymmetry('4k3/8/8/8/8/8/PPPPPPPP/RK5R w AHah - 0 1', 'b1g1')
  })

  test('chess960 white queenside castle (king on b-file)', () => {
    testSymmetry('4k3/8/8/8/8/8/PPPPPPPP/RK5R w AHah - 0 1', 'b1c1')
  })

  test('chess960 black kingside castle (king on b-file)', () => {
    testSymmetry('rk5r/pppppppp/8/8/8/8/8/4K3 b AHah - 0 1', 'b8g8')
  })

  test('chess960 black queenside castle (king on b-file)', () => {
    testSymmetry('rk5r/pppppppp/8/8/8/8/8/4K3 b AHah - 0 1', 'b8c8')
  })

  test('chess960 white kingside castle (king on d-file)', () => {
    testSymmetry('4k3/8/8/8/8/8/PPPPPPPP/R2K3R w AHah - 0 1', 'd1g1')
  })

  test('chess960 white queenside castle (king on d-file)', () => {
    testSymmetry('4k3/8/8/8/8/8/PPPPPPPP/R2K3R w AHah - 0 1', 'd1c1')
  })

  test('chess960 black kingside castle (king on d-file)', () => {
    testSymmetry('r2k3r/pppppppp/8/8/8/8/8/K7 b ah - 0 1', 'd8g8')
  })

  test('chess960 black queenside castle (king on d-file)', () => {
    testSymmetry('r2k3r/pppppppp/8/8/8/8/8/K7 b ah - 0 1', 'd8c8')
  })
})
