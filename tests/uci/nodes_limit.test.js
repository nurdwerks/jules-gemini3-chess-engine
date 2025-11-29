const UCI = require('../../src/UCI')

describe('UCI go nodes command', () => {
  let uci
  let outputs

  beforeEach(() => {
    outputs = []
    uci = new UCI((msg) => outputs.push(msg))
    // Ensure 1 thread
    uci.options.Threads = 1
    uci.options.UCI_UseNNUE = false
    uci.nnue = { network: null } // Mock NNUE
  })

  afterEach(async () => {
    await uci.stopWorkers()
  })

  test('go nodes 1000 stops near 1000 nodes', async () => {
    // Mock book to avoid early exit
    uci.book.findMove = () => null

    uci.processCommand('position startpos')

    const promise = new Promise(resolve => {
      const originalLog = uci.output
      uci.output = (msg) => {
        originalLog(msg)
        if (msg.startsWith('bestmove')) resolve()
      }
    })

    uci.processCommand('go nodes 1000')
    await promise

    const bestMoveMsg = outputs.find(o => o.startsWith('bestmove'))
    expect(bestMoveMsg).toBeDefined()

    // Check info messages
    const infoMsgs = outputs.filter(o => o.startsWith('info') && o.includes('nodes'))
    expect(infoMsgs.length).toBeGreaterThan(0)

    const lastInfo = infoMsgs[infoMsgs.length - 1]
    const match = lastInfo.match(/nodes (\d+)/)
    expect(match).not.toBeNull()
    const nodes = parseInt(match[1], 10)

    console.log('Nodes searched:', nodes)

    // This expectation is set to PASS if the feature is implemented (nodes close to 1000).
    expect(nodes).toBeLessThan(3000) // Loosen slightly for async granularity
  })
})
