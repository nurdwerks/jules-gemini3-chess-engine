const PawnHash = require('../../src/engine/PawnHash')

describe('PawnHash', () => {
  let pawnHash

  beforeEach(() => {
    // Initialize with a small size for testing
    pawnHash = new PawnHash(1) // 1 MB
  })

  test('should initialize with correct size', () => {
    // 1MB = 1024 * 1024 bytes
    // Entry size = 16 bytes
    // Expected entries = 65536
    expect(pawnHash.size).toBe(65536)
    expect(pawnHash.keys.length).toBe(65536)
    expect(pawnHash.scores.length).toBe(65536)
  })

  test('should store and retrieve values', () => {
    const key = 123456789n
    const score = 100

    pawnHash.set(key, score)
    const retrievedScore = pawnHash.get(key)

    expect(retrievedScore).toBe(score)
  })

  test('should return null for non-existent keys', () => {
    const key = 987654321n
    const retrievedScore = pawnHash.get(key)

    expect(retrievedScore).toBeNull()
  })

  test('should overwrite existing values at same index', () => {
    // Since we can't easily force a collision without knowing the exact modulus behavior and size,
    // we can just overwrite the same key.
    const key = 11111n
    pawnHash.set(key, 50)
    expect(pawnHash.get(key)).toBe(50)

    pawnHash.set(key, 75)
    expect(pawnHash.get(key)).toBe(75)
  })

  test('should clear the table', () => {
    const key = 22222n
    pawnHash.set(key, 200)
    expect(pawnHash.get(key)).toBe(200)

    pawnHash.clear()
    expect(pawnHash.get(key)).toBeNull()
  })

  test('should handle collision by replacing (always replace strategy)', () => {
    // Find two keys that map to the same index
    // index = key % size
    // size = 65536 for 1MB
    const size = BigInt(65536)
    const index = 10n
    const key1 = index
    const key2 = index + size

    pawnHash.set(key1, 10)
    expect(pawnHash.get(key1)).toBe(10)

    pawnHash.set(key2, 20)

    // key1 should be gone (overwritten) because we don't have buckets or probing, just direct map
    // Wait, get() checks if keys[index] === key.
    // So get(key1) should return null because keys[index] is now key2.
    expect(pawnHash.get(key1)).toBeNull()
    expect(pawnHash.get(key2)).toBe(20)
  })
})
