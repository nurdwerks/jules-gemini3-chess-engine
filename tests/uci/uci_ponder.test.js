const UCI = require('../../src/UCI')

// Mock output
let output = []
const mockOutput = (msg) => output.push(msg)

describe('UCI Ponder Logic', () => {
  let uci

  beforeEach(() => {
    output = []
    uci = new UCI(mockOutput)
  })

  test('go ponder starts search but suppresses bestmove', () => {
    // Setup a simple position
    uci.processCommand('position startpos')

    // Go ponder with shallow depth so it finishes quickly
    uci.processCommand('go ponder depth 1')

    // Search should run (producing info lines probably, but not checked here)
    // But NO bestmove should be printed yet
    expect(output.some(line => line.startsWith('bestmove'))).toBe(false)
  })

  test('ponderhit triggers bestmove after search finishes', () => {
    uci.processCommand('position startpos')
    uci.processCommand('go ponder depth 1')

    // Clear output to verify what happens on ponderhit
    output = []

    // Verify state is "pending bestmove" (internal check or just behavior)
    uci.processCommand('ponderhit')

    expect(output.some(line => line.startsWith('bestmove'))).toBe(true)
  })

  test('stop during ponder sends bestmove', () => {
    uci.processCommand('position startpos')
    uci.processCommand('go ponder depth 1')

    output = []
    uci.processCommand('stop')

    expect(output.some(line => line.startsWith('bestmove'))).toBe(true)
  })
})
