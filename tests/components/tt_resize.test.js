const { TranspositionTable } = require('../../src/engine/TranspositionTable')
const UCI = require('../../src/engine/UCI')

// Mock output
let output = []
const mockOutput = (msg) => output.push(msg)

describe('TranspositionTable Resizing', () => {
  test('resizes correctly', () => {
    const tt = new TranspositionTable(16) // Start with 16MB
    const initialSize = tt.size

    tt.resize(32) // Resize to 32MB
    expect(tt.size).toBeGreaterThan(initialSize)
    // 16MB ~ 1 million entries (16 bytes each). 32MB ~ 2 million.
    // Exact check:
    // 16MB / 16 bytes = 1,048,576
    // 32MB / 16 bytes = 2,097,152
    expect(tt.size).toBe(2097152)
    expect(tt.keys.length).toBe(2097152)
  })

  test('clears data on resize', () => {
    const tt = new TranspositionTable(1)
    tt.save(12345n, 100, 5, 0, null)

    // Resize
    tt.resize(2)

    // Probe should fail (or key cleared)
    const entry = tt.probe(12345n)
    expect(entry).toBeNull()
  })
})

describe('UCI Hash Option', () => {
  let uci

  beforeEach(() => {
    output = []
  })

  afterEach(async () => {
    if (uci) await uci.stopWorkers()
  })

  test('setoption name Hash updates TT size', () => {
    uci = new UCI(mockOutput)

    // Verify initial size (default 16MB)
    expect(uci.tt.size).toBe(1048576)

    // Resize to 32MB
    uci.processCommand('setoption name Hash value 32')

    // Verify new size
    expect(uci.tt.size).toBe(2097152)

    // Verify output message
    const log = output.find(line => line.includes('Hash resized to 32 MB'))
    expect(log).toBeDefined()
  })
})
