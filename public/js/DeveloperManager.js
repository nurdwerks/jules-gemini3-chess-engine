class DeveloperManager {
  constructor (uiManager, socketHandler, game) {
    this.uiManager = uiManager
    this.socketHandler = socketHandler
    this.game = game // chess.js instance
    this.elements = {
      perftBtn: document.getElementById('perft-btn'),
      sanityBtn: document.getElementById('sanity-check-btn'),
      zobristBtn: document.getElementById('zobrist-btn'),
      forceGcBtn: document.getElementById('force-gc-btn'),
      nullMoveBtn: document.getElementById('null-move-btn'),
      memoryDisplay: document.getElementById('dev-memory-usage'),
      latencyDisplay: document.getElementById('dev-latency'),
      threadsDisplay: document.getElementById('dev-threads'),
      hashBar: document.getElementById('dev-hash-bar'),
      depthBar: document.getElementById('dev-depth-bar'),
      debugOverlayCheck: document.getElementById('dev-debug-overlay'),
      packetInspectorCheck: document.getElementById('dev-packet-inspector'),
      packetInspectorContainer: document.getElementById('packet-inspector-container'),
      packetLog: document.getElementById('packet-log'),
      boardWrapper: document.querySelector('.board-wrapper')
    }

    this.isDebugOverlayEnabled = false
    this.isPacketInspectorEnabled = false
    this.debugOverlayEl = null
    this.latencyStart = 0

    this.init()
  }

  init () {
    this.elements.perftBtn.addEventListener('click', () => this.runPerft())
    this.elements.sanityBtn.addEventListener('click', () => this.runSanityCheck())
    this.elements.zobristBtn.addEventListener('click', () => this.getZobrist())
    this.elements.forceGcBtn.addEventListener('click', () => this.forceGc())
    this.elements.nullMoveBtn.addEventListener('click', () => this.makeNullMove())

    this.elements.debugOverlayCheck.addEventListener('change', (e) => this.toggleDebugOverlay(e.target.checked))
    this.elements.packetInspectorCheck.addEventListener('change', (e) => this.togglePacketInspector(e.target.checked))

    setInterval(() => this.checkLatency(), 5000)
    setInterval(() => this.requestMemoryUsage(), 5000)
  }

  runPerft () {
    this.uiManager.showToast('Running Perft(5)...', 'info')
    this.socketHandler.send('perft 5')
  }

  runSanityCheck () {
    this.socketHandler.send('verify')
  }

  getZobrist () {
    this.socketHandler.send('zobrist')
  }

  forceGc () {
    this.socketHandler.send('garbage_collect')
    this.uiManager.showToast('GC Requested', 'info')
  }

  makeNullMove () {
    const fen = this.game.fen()
    const parts = fen.split(' ')
    parts[1] = parts[1] === 'w' ? 'b' : 'w'
    parts[3] = '-'
    const newFen = parts.join(' ')
    this.uiManager.onLoadFen(newFen)
    this.uiManager.showToast('Null Move Applied (Side Swapped)', 'info')
  }

  toggleDebugOverlay (enabled) {
    this.isDebugOverlayEnabled = enabled
    if (enabled) {
      if (!this.debugOverlayEl) {
        this.debugOverlayEl = document.createElement('div')
        this.debugOverlayEl.className = 'debug-overlay'
        this.elements.boardWrapper.appendChild(this.debugOverlayEl)
      }
      this.debugOverlayEl.style.display = 'block'
      this.updateDebugOverlay()
    } else if (this.debugOverlayEl) {
      this.debugOverlayEl.style.display = 'none'
    }
  }

  togglePacketInspector (enabled) {
    this.isPacketInspectorEnabled = enabled
    this.elements.packetInspectorContainer.style.display = enabled ? 'block' : 'none'
  }

  logPacket (direction, data) {
    if (!this.isPacketInspectorEnabled) return
    const time = new Date().toLocaleTimeString().split(' ')[0]
    const entry = document.createElement('div')
    entry.textContent = `[${time}] ${direction}: ${data}`
    entry.style.color = direction === 'IN' ? '#33B5E5' : '#9AC42A'
    this.elements.packetLog.appendChild(entry)
    this.elements.packetLog.scrollTop = this.elements.packetLog.scrollHeight
  }

  checkLatency () {
    this.latencyStart = performance.now()
    this.socketHandler.send('isready')
  }

  requestMemoryUsage () {
    this.socketHandler.send('memory')
  }

  handleMessage (msg) {
    this._checkLatencyResponse(msg)
    this._checkInfo(msg)
    this._checkCustomCommands(msg)
  }

  _checkLatencyResponse (msg) {
    if (msg === 'readyok' && this.latencyStart > 0) {
      const latency = Math.round(performance.now() - this.latencyStart)
      this.elements.latencyDisplay.textContent = `${latency} ms`
      this.latencyStart = 0
    }
  }

  _checkInfo (msg) {
    if (!msg.startsWith('info')) return

    const hashMatch = msg.match(/hashfull (\d+)/)
    if (hashMatch) {
      const hashFull = parseInt(hashMatch[1])
      this.elements.hashBar.style.width = `${hashFull / 10}%`
    }

    const depthMatch = msg.match(/depth (\d+)/)
    if (depthMatch) {
      const depth = parseInt(depthMatch[1])
      const pct = Math.min(100, (depth / 30) * 100)
      this.elements.depthBar.style.width = `${pct}%`
    }

    if (this.isDebugOverlayEnabled) {
      const npsMatch = msg.match(/nps (\d+)/)
      const nodesMatch = msg.match(/nodes (\d+)/)
      this.currentStats = {
        depth: depthMatch ? depthMatch[1] : this.currentStats?.depth,
        nps: npsMatch ? npsMatch[1] : this.currentStats?.nps,
        nodes: nodesMatch ? nodesMatch[1] : this.currentStats?.nodes,
        hash: hashMatch ? hashMatch[1] : this.currentStats?.hash
      }
      this.updateDebugOverlay()
    }
  }

  _checkCustomCommands (msg) {
    if (msg.startsWith('memory_usage ')) {
      const mem = msg.split(' ')[1]
      this.elements.memoryDisplay.textContent = `${mem} MB`
    } else if (msg.startsWith('zobrist ')) {
      this.uiManager.showToast(`Zobrist: ${msg.split(' ')[1]}`, 'info')
    } else if (msg.startsWith('sanity ')) {
      const status = msg.includes('ok') ? 'success' : 'error'
      this.uiManager.showToast(msg, status)
    } else if (msg.startsWith('perft_result ')) {
      const parts = msg.split(' ')
      this.uiManager.showToast(`Perft: ${parts[1]} nodes in ${parts[2]}ms (${parts[3]} nps)`, 'success')
    }
  }

  updateDebugOverlay () {
    if (!this.debugOverlayEl || !this.currentStats) return
    this.debugOverlayEl.innerHTML = `
      Depth: ${this.currentStats.depth || '-'}<br>
      NPS: ${this.currentStats.nps || '-'}<br>
      Nodes: ${this.currentStats.nodes || '-'}<br>
      Hash: ${this.currentStats.hash || 0}‰
    `
  }
}

if (typeof module !== 'undefined') {
  module.exports = DeveloperManager
}
