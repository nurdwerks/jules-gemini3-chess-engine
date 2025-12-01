const UCI = require('../../src/engine/UCI')

describe('UCI Developer Tools', () => {
  let uci
  let output

  beforeEach(() => {
    output = []
    uci = new UCI((msg) => output.push(msg))
  })

  afterEach(async () => {
    await uci.stopWorkers()
  })

  test('perft command', () => {
    // Mock board.perft to avoid long running calculation
    jest.spyOn(uci.board, 'perft').mockReturnValue(20)

    uci.processCommand('perft 1')

    expect(uci.board.perft).toHaveBeenCalledWith(1)
    const result = output.find(o => o.startsWith('perft_result'))
    expect(result).toBeDefined()
    expect(result).toMatch(/perft_result 20 \d+ \d+/)
  })

  test('verify command', () => {
    uci.processCommand('verify')
    expect(output).toContain('sanity State OK')
  })

  test('zobrist command', () => {
    uci.processCommand('zobrist')
    const zMsg = output.find(o => o.startsWith('zobrist'))
    expect(zMsg).toBeDefined()
    expect(zMsg).toMatch(/zobrist 0x[0-9a-f]+/)
  })

  test('garbage_collect command', () => {
    global.gc = jest.fn()
    uci.processCommand('garbage_collect')
    expect(global.gc).toHaveBeenCalled()
    expect(output).toContain('info string GC executed')
  })

  test('memory command', () => {
    uci.processCommand('memory')
    const memMsg = output.find(o => o.startsWith('memory_usage'))
    expect(memMsg).toBeDefined()
    expect(memMsg).toMatch(/memory_usage \d+/)
  })
})
