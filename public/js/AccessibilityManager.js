/* eslint-env browser */

window.AccessibilityManager = class AccessibilityManager {
  constructor (gameManager, uiManager, renderFn) {
    this.gameManager = gameManager
    this.uiManager = uiManager
    this.renderFn = renderFn

    this.voiceAnnounceEnabled = false
    this.voiceControlEnabled = false
    this.recognition = null

    this._initKeyboard()
    this._initSpeechRecognition()
  }

  _initKeyboard () {
    document.addEventListener('keydown', (e) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return

      if (e.key === 'ArrowLeft') {
        this._navigateHistory(-1)
      } else if (e.key === 'ArrowRight') {
        this._navigateHistory(1)
      }
    })
  }

  _navigateHistory (dir) {
    const history = this.gameManager.game.history()
    const maxIndex = history.length - 1

    const current = this.gameManager.currentViewIndex
    // Map -1 (Live) to maxIndex for calculation
    const effectiveIndex = current === -1 ? maxIndex : current

    let nextIndex = effectiveIndex + dir

    // Handling the gap between 0 and -2 (skipping -1 which is Live)
    // If we are at 0 and go back (-1), we land on -1 (Live). We want -2.
    if (effectiveIndex === 0 && dir === -1) {
      nextIndex = -2
    }

    // If we are at -2 and go forward (+1), we land on -1 (Live). We want 0.
    if (effectiveIndex === -2 && dir === 1) {
      if (history.length === 0) nextIndex = -1
      else nextIndex = 0
    }

    // Bounds
    if (nextIndex < -2) nextIndex = -2
    if (nextIndex > maxIndex) nextIndex = -1 // Back to live

    // Update
    if (this.gameManager.currentViewIndex !== nextIndex) {
      this.gameManager.currentViewIndex = nextIndex
      this.renderFn()
      this._announceMoveStatus(nextIndex)
    }
  }

  _announceMoveStatus (idx) {
    const history = this.gameManager.game.history({ verbose: true })
    const statusDiv = document.getElementById('a11y-status')
    if (!statusDiv) return

    if (idx === -1) {
      statusDiv.textContent = 'Live Position'
    } else if (idx === -2) {
      statusDiv.textContent = 'Start Position'
    } else if (history[idx]) {
      const m = history[idx]
      const color = m.color === 'w' ? 'White' : 'Black'
      statusDiv.textContent = `Move ${Math.floor(idx / 2) + 1}, ${color} played ${m.san}`
    }
  }

  setVoiceAnnounce (enabled) {
    this.voiceAnnounceEnabled = enabled
  }

  announceMove (move) {
    if (!this.voiceAnnounceEnabled || !window.speechSynthesis) return

    // Format: "White plays Knight to f3"
    const pieceNames = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' }
    const color = move.color === 'w' ? 'White' : 'Black'
    const piece = pieceNames[move.piece] || 'Piece'
    const text = `${color} plays ${piece} to ${move.to}`

    const utter = new SpeechSynthesisUtterance(text)
    window.speechSynthesis.speak(utter)
  }

  setVoiceControl (enabled) {
    this.voiceControlEnabled = enabled
    if (enabled) {
      if (this.recognition) {
        try { this.recognition.start() } catch (e) { /* already started */ }
      }
    } else {
      if (this.recognition) {
        try { this.recognition.stop() } catch (e) { /* already stopped */ }
      }
    }
  }

  _initSpeechRecognition () {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    this.recognition = new SpeechRecognition()
    this.recognition.continuous = true
    this.recognition.lang = 'en-US'
    this.recognition.interimResults = false

    this.recognition.onresult = (event) => {
      if (!this.voiceControlEnabled) return
      const last = event.results.length - 1
      const command = event.results[last][0].transcript.trim().toLowerCase()
      this._handleVoiceCommand(command)
    }

    this.recognition.onend = () => {
      if (this.voiceControlEnabled) {
        try { this.recognition.start() } catch (e) { /* ignore */ }
      }
    }

    this.recognition.onerror = (e) => {
      console.warn('Speech Recognition Error', e)
    }
  }

  _handleVoiceCommand (cmd) {
    // Check for "New Game"
    if (cmd.includes('new game')) {
      this.uiManager.showToast('Voice: Starting New Game', 'info')
      this.gameManager.startNewGame()
      return
    }

    // Try to parse move: "e4", "knight f3", "move e2 to e4"
    // We will attempt to sanitize and match against legal moves
    const clean = cmd.replace('move ', '').replace('play ', '').replace('to ', '')

    // Get legal moves
    const moves = this.gameManager.game.moves({ verbose: true })

    // 1. Try exact SAN match (case insensitive)
    let match = moves.find(m => m.san.toLowerCase() === clean.replace(/\s/g, ''))

    // 2. Try phonetic / separated match
    if (!match) {
      // "knight f 3" -> "Nf3" logic is complex, simplify:
      // iterate all moves, convert to "spoken" form and compare
      // e.g. Nf3 -> "knight f3"
      const pieceMap = { n: 'knight', k: 'king', q: 'queen', r: 'rook', b: 'bishop', p: 'pawn' }

      match = moves.find(m => {
        let spoken = ''
        if (m.piece !== 'p') spoken += pieceMap[m.piece] + ' '
        spoken += m.to
        // Handle captures? "takes"
        // This is basic.
        return spoken.toLowerCase() === clean
      })
    }

    if (match) {
      this.uiManager.showToast(`Voice: ${match.san}`, 'success')
      this.gameManager.performMove({ from: match.from, to: match.to, promotion: match.promotion }, true)
      // Trigger Engine
      if (this.gameManager.gameMode === 'pve') {
        this.gameManager.sendPositionAndGo()
      }
    } else {
      console.log(`Voice Command not understood: "${cmd}"`)
    }
  }
}
