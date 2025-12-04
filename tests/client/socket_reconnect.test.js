/**
 * @jest-environment jsdom
 */

describe('SocketHandler Reconnection', () => {
  let SocketHandler
  let mockSocketInstances = []
  let clock

  class MockWebSocket {
    constructor (url) {
      this.url = url
      this.readyState = 0
      this.onopen = null
      this.onclose = null
      this.onmessage = null
      this.onerror = null
      mockSocketInstances.push(this)

      // Simulate async connection
      setTimeout(() => {
        this.readyState = 1
        if (this.onopen) this.onopen()
      }, 10)
    }

    send (data) {}
    close () {
      if (this.onclose) this.onclose()
    }
  }

  beforeAll(() => {
    global.WebSocket = MockWebSocket
    // Load SocketHandler class
    require('../../public/js/SocketHandler.js')
    SocketHandler = window.SocketHandler
  })

  beforeEach(() => {
    mockSocketInstances = []
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('should attempt to reconnect after close', () => {
    const sh = new SocketHandler({})
    sh.connect()

    // Fast-forward connection
    jest.advanceTimersByTime(20)
    expect(sh.isConnected).toBe(true)
    expect(mockSocketInstances.length).toBe(1)

    // Simulate close
    const socket = mockSocketInstances[0]
    socket.close()
    expect(sh.isConnected).toBe(false)

    // Fast-forward reconnection delay (assuming 2000ms)
    jest.advanceTimersByTime(2000)

    // Should have created a new socket
    expect(mockSocketInstances.length).toBe(2)
  })

  test('should not reconnect if autoReconnect is false', () => {
    const sh = new SocketHandler({}, { autoReconnect: false })
    sh.connect()

    // Connect
    jest.advanceTimersByTime(20)
    expect(sh.isConnected).toBe(true)

    // Close
    mockSocketInstances[0].close()

    // Wait
    jest.advanceTimersByTime(2000)

    // Should NOT have created a new socket (length remains 1)
    expect(mockSocketInstances.length).toBe(1)
  })
})
