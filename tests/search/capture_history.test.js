const Search = require('../../src/engine/Search')
const Board = require('../../src/engine/Board')
const MoveSorter = require('../../src/engine/MoveSorter')
const SearchHeuristics = require('../../src/engine/SearchHeuristics')

describe('Capture History Heuristic', () => {
  let board
  let heuristics

  beforeEach(() => {
    board = new Board()
    heuristics = new SearchHeuristics()
  })

  test('should store and retrieve capture history scores', () => {
    const to = 0x44
    heuristics.addCaptureHistory('pawn', to, 'pawn', 2)

    const score = heuristics.getCaptureHistory('pawn', to, 'pawn')
    expect(score).toBe(4)
  })

  test('should age capture history', () => {
    const to = 0x44
    heuristics.addCaptureHistory('pawn', to, 'pawn', 2)
    heuristics.ageHistory()
    const score = heuristics.getCaptureHistory('pawn', to, 'pawn')
    expect(score).toBe(2)
  })

  test('MoveSorter should include capture history in score', () => {
    const options = { UseCaptureHistory: true }

    // Setup board with pawn on d5 (0x33)
    // Row 3 (rank 5), Col 3 (d)
    const from = 0x33
    board.placePiece(3, 3, { type: 'pawn', color: 'white' })

    // Target 1: e6 (0x24) - Capture Black Pawn
    const to1 = 0x24
    board.placePiece(2, 4, { type: 'pawn', color: 'black' })

    // Target 2: c6 (0x22) - Capture Black Pawn
    const to2 = 0x22
    board.placePiece(2, 2, { type: 'pawn', color: 'black' })

    const move1 = {
      from,
      to: to1,
      flags: 'c',
      piece: { type: 'pawn', color: 'white' },
      captured: { type: 'pawn', color: 'black' }
    }

    const move2 = {
      from,
      to: to2,
      flags: 'c',
      piece: { type: 'pawn', color: 'white' },
      captured: { type: 'pawn', color: 'black' }
    }

    // Add huge history score for move1
    heuristics.addCaptureHistory('pawn', to1, 'pawn', 100)

    // Initial order: move2, move1
    const movesList = [move2, move1]

    MoveSorter.sort(movesList, board, null, 0, null, heuristics, options)

    // move1 should be sorted first due to history
    expect(movesList[0]).toBe(move1)
  })

  test('Search should update capture history on cutoff', () => {
    board.loadFen('rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2')
    const search = new Search(board)

    search.search(3, { hardLimit: 1000 }, { UseCaptureHistory: true })

    let found = false
    for (let i = 0; i < search.heuristics.captureHistory.length; i++) {
      if (search.heuristics.captureHistory[i] > 0) {
        found = true
        break
      }
    }
    expect(found).toBe(true)
  })
})
