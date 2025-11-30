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
      this._handleJsonMessage(msg)
      return
    }

    if (msg.startsWith('option name')) {
      if (this.callbacks.onOption) this.callbacks.onOption(msg)
      return
    }

    this._handleUciCommand(msg)
  }

  _handleJsonMessage (msg) {
    try {
      const data = JSON.parse(msg)
      if (data.type === 'chat') {
        if (this.callbacks.onChatMessage) this.callbacks.onChatMessage(data)
      } else if (data.type === 'reaction') {
        if (this.callbacks.onReaction) this.callbacks.onReaction(data)
      } else {
        if (this.callbacks.onVoteMessage) this.callbacks.onVoteMessage(data)
      }
    } catch (e) {}
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
