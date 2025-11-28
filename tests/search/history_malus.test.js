const SearchHeuristics = require('../../src/SearchHeuristics')
const MoveSorter = require('../../src/MoveSorter')
const Search = require('../../src/Search')
const { TranspositionTable } = require('../../src/TranspositionTable')

describe('History Malus', () => {
  let heuristics
  let board

  beforeEach(() => {
    heuristics = new SearchHeuristics()
    board = {
        activeColor: 'w',
        toRowCol: (idx) => ({ row: 0, col: 0 }),
        zobristKey: BigInt(0),
        getPiece: () => ({ type: 'pawn', color: 'black' })
    }
  })

  test('subtractHistoryScore decreases history score', () => {
    const side = 'w'
    const from = 10
    const to = 20
    const depth = 5

    // Initial score should be 0
    expect(heuristics.getHistoryScore(side, from, to)).toBe(0)

    heuristics.subtractHistoryScore(side, from, to, depth)

    const expectedPenalty = depth * depth
    expect(heuristics.getHistoryScore(side, from, to)).toBe(-expectedPenalty)
  })

  test('subtractHistoryScore handles capping/clamping', () => {
    const side = 'w'
    const from = 10
    const to = 20
    const depth = 100 // Large penalty

    // Decrease repeatedly
    for(let i=0; i<1000; i++) {
        heuristics.subtractHistoryScore(side, from, to, depth)
    }

    expect(heuristics.getHistoryScore(side, from, to)).toBeLessThan(0)
  })

  test('MoveSorter sorts negative history scores later', () => {
    const moveA = { from: 10, to: 20, flags: 'n' } // Quiet
    const moveB = { from: 11, to: 21, flags: 'n' } // Quiet

    heuristics.subtractHistoryScore('w', moveA.from, moveA.to, 5)

    const moves = [moveA, moveB]
    const options = { UseHistory: true }

    MoveSorter.sort(moves, board, null, 1, null, heuristics, options)

    // B (0) should come before A (-25)
    expect(moves[0]).toBe(moveB)
    expect(moves[1]).toBe(moveA)
  })

  test('shouldPruneLateMove prunes moves with bad history', () => {
      const search = new Search(board, new TranspositionTable(1))
      search.options = { UseHistory: true }

      const move = { from: 10, to: 20, flags: 'n' } // Quiet

      // Set very bad history
      // Penalty depth 100 => 10000
      search.heuristics.subtractHistoryScore('w', 10, 20, 100)

      // Threshold for depth 1 is -4000. Current score is -10000.
      const result = search.shouldPruneLateMove(1, 0, false, move)
      expect(result).toBe(true)
  })

  test('shouldPruneLateMove does not prune moves with neutral history', () => {
      const search = new Search(board, new TranspositionTable(1))
      search.options = { UseHistory: true }

      const move = { from: 30, to: 40, flags: 'n' }
      // History is 0

      const result = search.shouldPruneLateMove(1, 0, false, move)
      expect(result).toBe(false)
  })
})
