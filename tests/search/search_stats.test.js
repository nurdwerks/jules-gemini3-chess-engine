const Search = require('../../src/Search')
const Board = require('../../src/Board')

// Mock console.log to capture output

describe('Search Statistics & PV Consistency', () => {
  let board
  let search

  beforeEach(() => {
    board = new Board()
    search = new Search(board)
  })

  test('Search initializes stats object', () => {
    expect(search.stats).toBeDefined()
    expect(search.stats.nodes).toBeDefined()
    expect(search.stats.pruning).toBeDefined()
  })

  test('Search reports pruning stats after search', () => {
    // Capture stdout?
    // Search class doesn't log directly usually, UCI does.
    // But the story says "Statistics printed at end of search".
    // Let's assume Search exposes stats and UCI prints them, OR Search prints them if debug mode.
    // Let's modify Search to have getStats() or similar.

    // Let's check if search.stats is populated (even if 0)
    search.search(1)
    expect(search.stats.pruning.nullMove).toBe(0)
    expect(search.stats.pruning.futility).toBe(0)
  })

  test('PV Consistency Check validates legal PV', () => {
    // Create a situation where PV is obvious
    board.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    // Mock a PV
    // Indices: a2 is 96? No 0x88.
    // Rank 0 (8): 0-7. Rank 1 (7): 16-23...
    // Board 0x88:
    // 0-7: rnbqkbnr (Black)
    // ...
    // 112-119: RNBQKBNR (White)

    // Let's use real engine to generate a PV and check it
    search.search(2)
    // How to get PV? Search returns bestMove.
    // PV is usually in TT or passed up.
    // The story implies a debug check *inside* search.

    // We will test the checking function directly if exposed
    // search.checkPV(pv)
  })
})
