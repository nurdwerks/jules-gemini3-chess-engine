const UCI = require('../../src/engine/UCI')

// Mock output
let output = []
const mockOutput = (msg) => output.push(msg)

describe('UCI Ponder Logic', () => {
  let uci

  beforeEach(() => {
    output = []
    uci = new UCI(mockOutput)
  })

  afterEach(async () => {
    await uci.stopWorkers()
  })

  test('go ponder starts search but suppresses bestmove', async () => {
    // Setup a simple position
    uci.processCommand('position startpos')

    // Go ponder with shallow depth so it finishes quickly
    uci.processCommand('go ponder depth 1')

    // Wait for search to likely finish (depth 1 is sub-ms usually)
    await new Promise(resolve => setTimeout(resolve, 200))

    // Search should have run, but NO bestmove should be printed yet
    expect(output.some(line => line.startsWith('bestmove'))).toBe(false)
  })

  test('ponderhit triggers bestmove', async () => {
    uci.processCommand('position startpos')
    uci.processCommand('go ponder depth 1')

    // Wait a bit to ensure search finishes and bestmove is pending
    await new Promise(resolve => setTimeout(resolve, 200))

    const promise = new Promise(resolve => {
      const originalLog = uci.output
      uci.output = (msg) => {
        originalLog(msg)
        if (msg.startsWith('bestmove')) resolve()
      }
      // If it was already pending, ponderhit should trigger it immediately
      uci.processCommand('ponderhit')
    })

    await promise
    expect(output.some(line => line.startsWith('bestmove'))).toBe(true)
  })

  test('stop during ponder sends bestmove', async () => {
    uci.processCommand('position startpos')
    uci.processCommand('go ponder depth 1')

    await new Promise(resolve => setTimeout(resolve, 200))

    const promise = new Promise(resolve => {
      const originalLog = uci.output
      uci.output = (msg) => {
        originalLog(msg)
        if (msg.startsWith('bestmove')) resolve()
      }
      uci.processCommand('stop')
    })

    await promise
    expect(output.some(line => line.startsWith('bestmove'))).toBe(true)
  })
})
