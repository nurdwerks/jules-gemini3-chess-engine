const UCI = require('../../src/UCI')

describe('MultiPV Search', () => {
  let uci
  let outputs = []

  beforeEach(() => {
    outputs = []
    uci = new UCI((msg) => {
      // console.log('Mock Output:', msg);
      outputs.push(msg)
    })
    // Disable opening book strictly
    uci.book.findMove = () => null
  })

  afterEach(() => {
    if (uci) {
      uci.stopWorkers()
    }
  })

  test('Should report multiple PV lines when MultiPV > 1', () => {
    uci.processCommand('setoption name MultiPV value 2')
    uci.processCommand('position startpos')
    uci.processCommand('go depth 2')

    // console.log('Outputs:', outputs);

    const multiPVLines = outputs.filter(line => line.includes('info') && line.includes('multipv'))
    expect(multiPVLines.length).toBeGreaterThan(0)

    const pv1 = multiPVLines.filter(l => l.includes('multipv 1'))
    const pv2 = multiPVLines.filter(l => l.includes('multipv 2'))

    expect(pv1.length).toBeGreaterThan(0)
    expect(pv2.length).toBeGreaterThan(0)

    const depth2pv1 = pv1.find(l => l.includes('depth 2'))
    const depth2pv2 = pv2.find(l => l.includes('depth 2'))

    expect(depth2pv1).toBeDefined()
    expect(depth2pv2).toBeDefined()
  })

  test('Should exclude first PV move from second PV search', () => {
    uci.processCommand('setoption name MultiPV value 2')
    uci.processCommand('position startpos')
    uci.processCommand('go depth 2')

    const depth2Lines = outputs.filter(line => line.includes('info') && line.includes('depth 2') && line.includes('multipv'))

    const mpv1 = depth2Lines.filter(l => l.includes('multipv 1')).pop()
    const mpv2 = depth2Lines.filter(l => l.includes('multipv 2')).pop()

    expect(mpv1).toBeDefined()
    expect(mpv2).toBeDefined()

    const move1 = mpv1.match(/pv\s+(\w+)/)[1]
    const move2 = mpv2.match(/pv\s+(\w+)/)[1]

    expect(move1).not.toEqual(move2)
  })
})
