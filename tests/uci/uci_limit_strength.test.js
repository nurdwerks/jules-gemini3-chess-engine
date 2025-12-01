const UCI = require('../../src/engine/UCI')

// Mock output
let output = []
const mockOutput = (msg) => output.push(msg)

describe('UCI Limit Strength Options', () => {
  let uci

  beforeEach(() => {
    output = []
    uci = new UCI(mockOutput)
  })

  afterEach(async () => {
    await uci.stopWorkers()
  })

  test('uci command reports LimitStrength and Elo options', () => {
    uci.processCommand('uci')

    const limitStrength = output.find(l => l.includes('name UCI_LimitStrength'))
    const elo = output.find(l => l.includes('name UCI_Elo'))

    expect(limitStrength).toBeDefined()
    expect(limitStrength).toContain('type check')
    expect(limitStrength).toContain('default false')

    expect(elo).toBeDefined()
    expect(elo).toContain('type spin')
    expect(elo).toContain('default 3000')
  })

  test('setoption updates values', () => {
    uci.processCommand('setoption name UCI_LimitStrength value true')
    uci.processCommand('setoption name UCI_Elo value 1500')

    expect(uci.options.UCI_LimitStrength).toBe(true)
    expect(uci.options.UCI_Elo).toBe(1500)
  })
})
