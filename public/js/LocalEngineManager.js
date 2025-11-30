/* eslint-env browser */
/* global URL, Worker */

window.LocalEngineManager = class LocalEngineManager {
  constructor (callbacks) {
    this.worker = null
    this.callbacks = callbacks || {}
    this.isLoaded = false
  }

  load (file) {
    if (this.worker) this.worker.terminate()

    const url = URL.createObjectURL(file)
    try {
      this.worker = new Worker(url)
      this.worker.onmessage = (e) => this._handleMessage(e.data)
      this.worker.onerror = (e) => {
        console.error('Worker Error', e)
        if (this.callbacks.onError) this.callbacks.onError(e.message)
      }
      this.isLoaded = true
      if (this.callbacks.onOpen) this.callbacks.onOpen()

      // Initialize
      this.send('uci')
    } catch (e) {
      console.error('Failed to create worker', e)
      if (this.callbacks.onError) this.callbacks.onError(e.message)
    }
  }

  send (command) {
    if (this.isLoaded && this.worker) {
      this.worker.postMessage(command)
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
