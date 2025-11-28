const UCI = require('../../src/UCI');

// Mock console.log to capture output
let output = [];
const mockLog = (msg) => output.push(msg);

describe('UCI Options', () => {
  let uci;

  beforeEach(() => {
    output = [];
    uci = new UCI(mockLog);
  });

  test('uci command reports required options', () => {
    uci.processCommand('uci');

    // Check for standard options
    const options = output.filter(line => line.startsWith('option'));

    // Should verify specific options requested: Hash, Threads, Ponder, MultiPV
    const hasHash = options.some(l => l.includes('name Hash') && l.includes('type spin'));
    const hasThreads = options.some(l => l.includes('name Threads') && l.includes('type spin'));
    const hasPonder = options.some(l => l.includes('name Ponder') && l.includes('type check'));
    const hasMultiPV = options.some(l => l.includes('name MultiPV') && l.includes('type spin'));

    expect(hasHash).toBe(true);
    expect(hasThreads).toBe(true);
    expect(hasPonder).toBe(true);
    expect(hasMultiPV).toBe(true);

    // Verify default values
    const hashLine = options.find(l => l.includes('name Hash'));
    expect(hashLine).toContain('default 16');
    expect(hashLine).toContain('min 1');
    expect(hashLine).toContain('max 1024'); // Example max

    const threadsLine = options.find(l => l.includes('name Threads'));
    expect(threadsLine).toContain('default 1');

    const ponderLine = options.find(l => l.includes('name Ponder'));
    expect(ponderLine).toContain('default false');

    const multiPVLine = options.find(l => l.includes('name MultiPV'));
    expect(multiPVLine).toContain('default 1');
  });

  test('setoption command handles known options without error', () => {
      // Just verifying it doesn't crash or throw.
      // Logic verification comes in later stories.
      uci.processCommand('setoption name Hash value 64');
      uci.processCommand('setoption name Threads value 4');
      uci.processCommand('setoption name Ponder value true');
      uci.processCommand('setoption name MultiPV value 2');

      // Also existing evaluation options
      uci.processCommand('setoption name PawnValue value 105');
  });
});
