const UCI = require('../../src/engine/UCI')

// Mock Worker to avoid threading issues in tests
jest.mock('worker_threads', () => {
  return {
    Worker: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      postMessage: jest.fn(),
      terminate: jest.fn().mockResolvedValue()
    }))
  }
})

describe('UCI Options', () => {
  let uci
  let outputSpy

  beforeEach(() => {
    outputSpy = jest.fn()
    uci = new UCI(outputSpy)
  })

  afterEach(async () => {
    await uci.stopWorkers()
  })

  test('should handle "Clear Hash" option', () => {
    const clearSpy = jest.spyOn(uci.tt, 'clear')
    uci.processCommand('setoption name Clear Hash')
    expect(clearSpy).toHaveBeenCalled()
    expect(outputSpy).toHaveBeenCalledWith('info string Hash cleared')
  })

  test('should resize Hash when threads is 1', () => {
    uci.options.Threads = 1
    const resizeSpy = jest.spyOn(uci.tt, 'resize')
    uci.processCommand('setoption name Hash value 32')
    expect(resizeSpy).toHaveBeenCalledWith(32)
    expect(uci.options.Hash).toBe(32)
  })

  test('should not resize Hash when threads > 1', () => {
    uci.options.Threads = 2
    const resizeSpy = jest.spyOn(uci.tt, 'resize')
    uci.processCommand('setoption name Hash value 32')
    expect(resizeSpy).not.toHaveBeenCalled()
    expect(uci.options.Hash).toBe(32)
  })

  test('should restart workers when Threads option changes', async () => {
    const stopSpy = jest.spyOn(uci, 'stopWorkers')
    const startSpy = jest.spyOn(uci, 'startWorkers')
    uci.processCommand('setoption name Threads value 2')
    expect(stopSpy).toHaveBeenCalled()
    expect(startSpy).toHaveBeenCalled()
    expect(uci.options.Threads).toBe(2)
  })

  test('should list "Clear Hash" in UCI options', () => {
    uci.processCommand('uci')
    expect(outputSpy).toHaveBeenCalledWith(expect.stringContaining('option name Clear Hash type button'))
  })
})
