const UCI = require('../../src/UCI')

// Mock Worker
jest.mock('worker_threads', () => {
  return {
    Worker: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      postMessage: jest.fn(),
      terminate: jest.fn().mockResolvedValue()
    }))
  }
})

describe('UCI Epic 73 Options', () => {
  let uci
  let outputSpy

  beforeEach(() => {
    outputSpy = jest.fn()
    uci = new UCI(outputSpy)
  })

  afterEach(async () => {
    await uci.stopWorkers()
  })

  test('should list Syzygy options in UCI output', () => {
    uci.processCommand('uci')
    expect(outputSpy).toHaveBeenCalledWith(expect.stringContaining('option name SyzygyPath type string'))
    expect(outputSpy).toHaveBeenCalledWith(expect.stringContaining('option name SyzygyProbeLimit type spin'))
  })

  test('should set SyzygyPath', () => {
    uci.processCommand('setoption name SyzygyPath value /path/to/tablebases')
    expect(uci.options.SyzygyPath).toBe('/path/to/tablebases')
    expect(uci.syzygy.path).toBe('/path/to/tablebases')
  })

  test('should set SyzygyProbeLimit', () => {
    uci.processCommand('setoption name SyzygyProbeLimit value 4')
    expect(uci.options.SyzygyProbeLimit).toBe(4)
  })
})
