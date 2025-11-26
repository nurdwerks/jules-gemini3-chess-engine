const Board = require('../src/Board');

describe('Kiwipete Perft Verification', () => {
  let board;

  beforeEach(() => {
    board = new Board();
  });

  // Kiwipete
  // r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1
  // Depth 1: 48
  // Depth 2: 2039
  // Depth 3: 97862

  test('Perft(1) Kiwipete', () => {
      board.loadFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');
      expect(board.perft(1)).toBe(48);
  });

  test('Perft(2) Kiwipete', () => {
      board.loadFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');
      expect(board.perft(2)).toBe(2039);
  });

   test('Perft(3) Kiwipete', () => {
      board.loadFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');
      expect(board.perft(3)).toBe(97862);
  });
});
