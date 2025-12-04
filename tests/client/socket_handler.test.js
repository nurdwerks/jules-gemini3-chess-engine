/**
 * @jest-environment jsdom
 */

class MockWebSocket {
  constructor (url) {
    this.url = url
    this.readyState = 0
    setTimeout(() => {
      this.readyState = 1
      if (this.onopen) this.onopen()
    }, 0)
  }

  send (data) {}
  close () {}
}
MockWebSocket.OPEN = 1
global.WebSocket = MockWebSocket

describe('SocketHandler', () => {
  let SocketHandler

  beforeAll(() => {
    require('../../public/js/SocketHandler.js')
    SocketHandler = window.SocketHandler
  })

  test('connects and triggers onOpen', (done) => {
    const onOpen = jest.fn()
    const sh = new SocketHandler({ onOpen })
    sh.connect()
    expect(sh.socket).toBeInstanceOf(MockWebSocket)
    setTimeout(() => {
      expect(onOpen).toHaveBeenCalled()
      expect(sh.isConnected).toBe(true)
      done()
    }, 10)
  })

  test('sends message when connected', (done) => {
    const sh = new SocketHandler({})
    sh.connect()
    setTimeout(() => {
      const spy = jest.spyOn(sh.socket, 'send')
      sh.send('test')
      expect(spy).toHaveBeenCalledWith('test')
      done()
    }, 10)
  })

  test('handles uciok by sending isready', (done) => {
    const sh = new SocketHandler({})
    sh.connect()
    setTimeout(() => {
      const spy = jest.spyOn(sh, 'send')
      sh.socket.onmessage({ data: 'uciok' })
      expect(spy).toHaveBeenCalledWith('isready')
      done()
    }, 10)
  })

  test('handles bestmove callback', (done) => {
    const onBestMove = jest.fn()
    const sh = new SocketHandler({ onBestMove })
    sh.connect()
    setTimeout(() => {
      sh.socket.onmessage({ data: 'bestmove e2e4' })
      expect(onBestMove).toHaveBeenCalledWith(['bestmove', 'e2e4'])
      done()
    }, 10)
  })

  test('handles json vote message', (done) => {
    const onVoteMessage = jest.fn()
    const sh = new SocketHandler({ onVoteMessage })
    sh.connect()
    setTimeout(() => {
      sh.socket.onmessage({ data: '{"type":"vote"}' })
      expect(onVoteMessage).toHaveBeenCalledWith({ type: 'vote' })
      done()
    }, 10)
  })
})
