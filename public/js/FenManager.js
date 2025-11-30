class FenManager {
  constructor (game, uiManager, onFenLoaded) {
    this.game = game
    this.uiManager = uiManager
    this.onFenLoaded = onFenLoaded
  }

  copyFen () {
    const fen = this.game.fen()
    navigator.clipboard.writeText(fen).then(() => {
      this.uiManager.showToast('FEN copied to clipboard', 'success')
    }, (err) => {
      this.uiManager.showToast('Failed to copy FEN', 'error')
      console.error(err)
    })
  }

  copyFenUrl () {
    const fen = this.game.fen()
    const url = new URL(window.location.href)
    url.searchParams.set('fen', fen)
    navigator.clipboard.writeText(url.toString()).then(() => {
      this.uiManager.showToast('URL with FEN copied', 'success')
    }, (err) => {
      this.uiManager.showToast('Failed to copy URL', 'error')
      console.error(err)
    })
  }

  loadFen (fen) {
    // Basic validation
    if (!fen) return

    // Detailed validation
    const validation = this.game.validate_fen(fen)
    if (!validation.valid) {
      this.uiManager.showToast(`Invalid FEN: ${validation.error}`, 'error')
      return
    }

    const result = this.game.load(fen)
    if (result) {
      if (this.onFenLoaded) this.onFenLoaded(fen)
      this.uiManager.showToast('FEN loaded', 'success')
    } else {
      this.uiManager.showToast('Invalid FEN (unknown error)', 'error')
    }
  }

  // Story 129: Move History Notation Toggle (SAN/LAN)
  // This logic is likely in UIManager.renderHistory, but FenManager can help or track the state.
  // Actually, UIManager handles rendering. I'll keep this separate or let UIManager handle it.
}

if (typeof module !== 'undefined') {
  module.exports = FenManager
}
