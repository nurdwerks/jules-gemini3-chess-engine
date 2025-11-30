/* eslint-env browser */

window.CloudEngineManager = class CloudEngineManager {
  constructor (callbacks) {
    this.socket = null
    this.callbacks = callbacks || {}
    this.isConnected = false
  }

  connect (url) {
    if (this.socket) {
      this.socket.close()
    }
    try {
      this.socket = new WebSocket(url)
      this.socket.onopen = () => {
        this.isConnected = true
        if (this.callbacks.onOpen) this.callbacks.onOpen()
      }
      this.socket.onmessage = (e) => this._handleMessage(e.data)
      this.socket.onclose = () => {
        this.isConnected = false
        if (this.callbacks.onClose) this.callbacks.onClose()
      }
      this.socket.onerror = (e) => {
        if (this.callbacks.onError) this.callbacks.onError('WebSocket connection error')
      }
    } catch (e) {
      if (this.callbacks.onError) this.callbacks.onError(e.message)
    }
  }

  disconnect () {
    if (this.socket) {
      this.socket.close()
      this.socket = null
      this.isConnected = false
    }
  }

  send (command) {
    if (this.isConnected && this.socket) {
      this.socket.send(command)
      if (this.callbacks.onSent) this.callbacks.onSent(command)
    }
  }

  _handleMessage (msg) {
    if (typeof msg !== 'string') return

    if (msg.startsWith('option name')) {
      if (this.callbacks.onOption) this.callbacks.onOption(msg)
      return
    }

    this._handleUciCommand(msg)
  }

  _handleUciCommand (msg) {
    const parts = msg.split(' ')
    const cmd = parts[0]
    switch (cmd) {
      case 'uciok':
        this.send('isready')
        break
      case 'readyok':
        if (this.callbacks.onReadyOk) this.callbacks.onReadyOk()
        break
      case 'bestmove':
        if (this.callbacks.onBestMove) this.callbacks.onBestMove(parts)
        break
      case 'info':
        if (this.callbacks.onInfo) this.callbacks.onInfo(msg)
        break
    }
  }
}
