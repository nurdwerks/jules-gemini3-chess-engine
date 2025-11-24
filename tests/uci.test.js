const UCI = require('../src/UCI');
const Board = require('../src/Board');

// Mock console.log to capture output
let output = [];
const mockLog = (msg) => output.push(msg);

describe('UCI Protocol', () => {
  let uci;

  beforeEach(() => {
    output = [];
    uci = new UCI(mockLog);
  });

  test('Command: uci', () => {
    uci.processCommand('uci');
    expect(output).toContain('id name JulesGemini');
    expect(output).toContain('id author JulesGemini');
    expect(output).toContain('uciok');
  });

  test('Command: isready', () => {
    uci.processCommand('isready');
    expect(output).toContain('readyok');
  });

  test('Command: ucinewgame', () => {
      // Should reset the board
      uci.board.activeColor = 'b'; // Change state
      uci.processCommand('ucinewgame');
      expect(uci.board.activeColor).toBe('w'); // Should be back to start
  });

  test('Command: position startpos', () => {
    uci.processCommand('position startpos');
    expect(uci.board.generateFen()).toContain('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
  });

  test('Command: position startpos moves e2e4', () => {
    uci.processCommand('position startpos moves e2e4');
    expect(uci.board.squares[uci.board.algebraicToIndex('e4')]).not.toBeNull();
    expect(uci.board.activeColor).toBe('b');
  });

  test('Command: position startpos moves e2e4 e7e5', () => {
    uci.processCommand('position startpos moves e2e4 e7e5');
    expect(uci.board.squares[uci.board.algebraicToIndex('e4')]).not.toBeNull(); // White
    expect(uci.board.squares[uci.board.algebraicToIndex('e5')]).not.toBeNull(); // Black
    expect(uci.board.activeColor).toBe('w');
  });

  test('Command: position fen', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      uci.processCommand(`position fen ${fen}`);
      expect(uci.board.generateFen()).toContain(fen); // Note: formatting might vary slightly but core valid
  });

  test('Command: position fen moves', () => {
      // Start with e2e4 already played
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
      // Black moves e7e5
      uci.processCommand(`position fen ${fen} moves e7e5`);
      expect(uci.board.squares[uci.board.algebraicToIndex('e5')]).not.toBeNull();
      expect(uci.board.activeColor).toBe('w');
  });

  test('Command: go', () => {
      // For now, go should just return a bestmove (random or first legal)
      // Since search isn't implemented, we just check for output
      uci.processCommand('position startpos');
      uci.processCommand('go depth 1');
      // output should contain "bestmove ..."
      expect(output.some(line => line.startsWith('bestmove'))).toBe(true);
  });
});
