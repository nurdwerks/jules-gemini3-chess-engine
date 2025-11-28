const SearchHeuristics = require('../../src/SearchHeuristics')

describe('SearchHeuristics', () => {
  let heuristics

  beforeEach(() => {
    heuristics = new SearchHeuristics()
  })

  test('initializes correctly', () => {
    expect(heuristics.killerMoves.length).toBe(64)
    expect(heuristics.history.length).toBe(2 * 128 * 128)
    expect(heuristics.counterMoves.length).toBe(2 * 128 * 128)
  })

  test('stores and retrieves killer moves', () => {
    const move1 = { from: 10, to: 20 }
    const move2 = { from: 10, to: 21 }
    const move3 = { from: 10, to: 22 }
    const depth = 5

    // Store first killer
    heuristics.storeKiller(depth, move1)
    let killers = heuristics.getKillers(depth)
    expect(killers).toHaveLength(1)
    expect(killers[0]).toBe(move1)

    // Store duplicate (should ignore)
    heuristics.storeKiller(depth, move1)
    killers = heuristics.getKillers(depth)
    expect(killers).toHaveLength(1)

    // Store second killer
    heuristics.storeKiller(depth, move2)
    killers = heuristics.getKillers(depth)
    expect(killers).toHaveLength(2)
    expect(killers[0]).toBe(move2) // Newest first
    expect(killers[1]).toBe(move1)

    // Store third killer (should displace oldest)
    heuristics.storeKiller(depth, move3)
    killers = heuristics.getKillers(depth)
    expect(killers).toHaveLength(2)
    expect(killers[0]).toBe(move3)
    expect(killers[1]).toBe(move2)
  })

  test('ignores killer moves at invalid depth', () => {
    const move = { from: 10, to: 20 }
    heuristics.storeKiller(100, move)
    expect(heuristics.getKillers(100)).toEqual([]) // Or undefined/empty

    // getKillers at invalid depth
    expect(heuristics.getKillers(70)).toEqual([])
  })

  test('clears killer moves', () => {
    heuristics.storeKiller(5, { from: 10, to: 20 })
    heuristics.clearKillers()
    expect(heuristics.getKillers(5)).toEqual([])
  })

  test('reset clears killer moves', () => {
    heuristics.storeKiller(5, { from: 10, to: 20 })
    heuristics.reset()
    expect(heuristics.getKillers(5)).toEqual([])
  })

  test('updates and retrieves history scores', () => {
    const side = 'w'
    const from = 10
    const to = 20
    const depth = 2 // bonus = 4

    heuristics.addHistoryScore(side, from, to, depth)
    const score = heuristics.getHistoryScore(side, from, to)
    expect(score).toBe(4)
  })

  test('ages history scores', () => {
    heuristics.addHistoryScore('w', 10, 20, 2) // 4
    heuristics.ageHistory()
    const score = heuristics.getHistoryScore('w', 10, 20)
    expect(score).toBe(2)
  })

  test('caps history scores when limit reached', () => {
    // Limit is 1,000,000
    // We need to trigger the cap logic.
    // We can manually set the value to be close to limit.
    const side = 'w'
    const from = 10
    const to = 20
    const colorIdx = 0
    const idx = colorIdx * 128 * 128 + from * 128 + to

    heuristics.history[idx] = 1000000

    // Add a large bonus to exceed limit
    const depth = 10 // 100
    heuristics.addHistoryScore(side, from, to, depth)

    // history[idx] should be (1000000 + 100) >> 1 = 500050
    // And ALL other entries should be halved.

    // Set another entry to verify global aging
    heuristics.history[idx + 1] = 200

    // Trigger logic
    // But wait, `addHistoryScore` adds THEN checks.
    // `this.history[idx] += bonus` -> 1000100.
    // `if (this.history[idx] > 1000000)` -> True.
    // `for... this.history[i] >>= 1`.
    // So idx -> 500050.
    // idx+1 -> 100.

    // Re-run
    heuristics.history[idx] = 1000000
    heuristics.history[idx + 1] = 200

    heuristics.addHistoryScore(side, from, to, depth)

    expect(heuristics.history[idx]).toBe(500050)
    expect(heuristics.history[idx + 1]).toBe(100)
  })

  test('stores and retrieves counter moves', () => {
    const side = 'w'
    const prevFrom = 10
    const prevTo = 20
    const move = { from: 30, to: 40 }

    heuristics.storeCounterMove(side, prevFrom, prevTo, move)
    const retrieved = heuristics.getCounterMove(side, prevFrom, prevTo)
    expect(retrieved).toBe(move)
  })

  test('handles invalid counter move indices safely', () => {
    // Test out of bounds access
    const side = 'w'
    // Max from/to is 127.
    // If we pass larger values?
    const largeFrom = 200
    // 0x88 board is max 127 (0x77). But logic uses 128 multiplier.
    // 200 * 128 is large.

    const retrieved = heuristics.getCounterMove(side, largeFrom, 20)
    expect(retrieved).toBeNull()

    // Store
    heuristics.storeCounterMove(side, largeFrom, 20, { from: 0, to: 0 })
    // Should not crash (checks length)
  })
})
