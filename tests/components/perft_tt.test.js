const PerftTT = require('../../src/engine/PerftTT')

describe('PerftTT Component', () => {
  test('Constructor initializes correctly with default size', () => {
    const tt = new PerftTT(64)
    expect(tt.keys).toBeInstanceOf(BigUint64Array)
    expect(tt.data).toBeInstanceOf(BigUint64Array)
    expect(tt.size).toBeGreaterThan(0)
    // 64MB / 16 bytes = 4M entries
    expect(tt.size).toBe(4194304)
  })

  test('Constructor handles small sizes', () => {
    // 1KB size
    const sizeMB = 1 / 1024
    const tt = new PerftTT(sizeMB)
    // 1024 / 16 = 64 entries
    expect(tt.size).toBe(64)
  })

  test('Save and Probe works', () => {
    const tt = new PerftTT(1) // 1MB
    const key = 12345n
    const depth = 5
    const nodes = 1000

    tt.save(key, depth, nodes)
    const result = tt.probe(key, depth)
    expect(result).toBe(BigInt(nodes))
  })

  test('Probe returns null for missing key', () => {
    const tt = new PerftTT(1)
    const result = tt.probe(99999n, 1)
    expect(result).toBeNull()
  })

  test('Probe returns null for wrong depth', () => {
    const tt = new PerftTT(1)
    const key = 12345n
    tt.save(key, 5, 1000)
    const result = tt.probe(key, 4)
    expect(result).toBeNull()
  })

  test('Overwrite strategy: Update if depth is greater', () => {
    const tt = new PerftTT(1)
    const key = 12345n

    tt.save(key, 3, 100)
    expect(tt.probe(key, 3)).toBe(100n)

    // Save deeper result
    tt.save(key, 4, 500)
    expect(tt.probe(key, 4)).toBe(500n)
    // Probe old depth should now fail (store has depth 4)
    expect(tt.probe(key, 3)).toBeNull()
  })

  test('Overwrite strategy: Update if depth is equal', () => {
    const tt = new PerftTT(1)
    const key = 12345n

    tt.save(key, 3, 100)
    tt.save(key, 3, 200) // Update with new node count (e.g. if bug or different path?)
    expect(tt.probe(key, 3)).toBe(200n)
  })

  test('Overwrite strategy: Do not update if depth is smaller', () => {
    const tt = new PerftTT(1)
    const key = 12345n

    tt.save(key, 5, 1000)
    tt.save(key, 3, 50) // Should be ignored

    expect(tt.probe(key, 5)).toBe(1000n)
    expect(tt.probe(key, 3)).toBeNull()
  })

  test('Collision handling: Always replace (different key)', () => {
    // Use standard size but pick colliding keys.
    const ttStandard = new PerftTT(1) // Size 65536, Mask 65535
    const key1 = 1n
    const key2 = 1n | (1n << 20n) // key2 & mask == 1n & mask == 1

    ttStandard.save(key1, 5, 100)
    expect(ttStandard.probe(key1, 5)).toBe(100n)

    // Save key2 (collision)
    ttStandard.save(key2, 3, 50) // Should replace because storedKey !== key

    expect(ttStandard.probe(key1, 5)).toBeNull()
    expect(ttStandard.probe(key2, 3)).toBe(50n)
  })

  test('Clear resets data', () => {
    const tt = new PerftTT(1)
    const key = 12345n
    tt.save(key, 5, 1000)
    tt.clear()
    expect(tt.probe(key, 5)).toBeNull()
  })
})
