/* eslint-env browser */
/* global window */

window.SocketHandler = class SocketHandler {
  constructor (callbacks) {
    this.socket = null
    this.callbacks = callbacks || {}
    this.isConnected = false
  }

  connect () {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    this.socket = new WebSocket(`${protocol}//${window.location.host}`)

    this.socket.onopen = () => {
      this.isConnected = true
      if (this.callbacks.onOpen) this.callbacks.onOpen()
    }

    this.socket.onmessage = (event) => {
      const msg = event.data
      this._handleMessage(msg)
    }

    this.socket.onclose = () => {
      this.isConnected = false
      if (this.callbacks.onClose) this.callbacks.onClose()
    }
  }

  send (command) {
    if (this.isConnected && this.socket) {
      this.socket.send(command)
      if (this.callbacks.onSent) this.callbacks.onSent(command)
    }
  }

  _handleMessage (msg) {
    if (msg.startsWith('{')) {
      try {
        const data = JSON.parse(msg)
        if (this.callbacks.onVoteMessage) this.callbacks.onVoteMessage(data)
        return
      } catch (e) {}
    }

    const parts = msg.split(' ')
    if (msg.startsWith('option name')) {
      if (this.callbacks.onOption) this.callbacks.onOption(msg)
    } else if (parts[0] === 'uciok') {
      this.send('isready')
    } else if (parts[0] === 'readyok') {
      if (this.callbacks.onReadyOk) this.callbacks.onReadyOk()
    } else if (parts[0] === 'bestmove') {
      if (this.callbacks.onBestMove) this.callbacks.onBestMove(parts)
    } else if (parts[0] === 'info') {
      if (this.callbacks.onInfo) this.callbacks.onInfo(msg)
    }
  }
}
