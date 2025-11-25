const Board = require('../src/Board');
const Piece = require('../src/Piece');

describe('Piece Movement Logic', () => {
  let board;

  beforeEach(() => {
    board = new Board();
  });

  const findMove = (moves, r1, c1, r2, c2) => {
    const from = (r1 << 4) | c1;
    const to = (r2 << 4) | c2;
    return moves.find(m => m.from === from && m.to === to);
  };

  test('pawn basic movement (white)', () => {
    board.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const moves = board.generateMoves();
    expect(findMove(moves, 6, 0, 5, 0)).toBeTruthy();
  });

  test('pawn basic movement (black)', () => {
    board.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1');
    const moves = board.generateMoves();
    expect(findMove(moves, 1, 0, 2, 0)).toBeTruthy();
  });

  test('pawn cannot move backwards', () => {
    board.loadFen('rnbqkbnr/p1pppppp/8/1p6/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const moves = board.generateMoves();
    expect(findMove(moves, 3, 1, 4, 1)).toBeFalsy();
  });

  test('pawn initial double move', () => {
    board.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const moves = board.generateMoves();
    expect(findMove(moves, 6, 1, 4, 1)).toBeTruthy();
  });

  test('pawn invalid move (sideways)', () => {
    board.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const moves = board.generateMoves();
    expect(findMove(moves, 6, 1, 6, 2)).toBeFalsy();
  });
});
