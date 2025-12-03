class PgnManager {
  constructor (game, uiManager) {
    this.game = game
    this.uiManager = uiManager
    this.customHeaders = {
      Event: 'Casual Game',
      Site: 'NurdWerks Chess Engine',
      Date: new Date().toISOString().split('T')[0],
      White: 'White',
      Black: 'Black'
    }
  }

  updateHeader (key, value) {
    this.customHeaders[key] = value
  }

  getHeaders () {
    return this.customHeaders
  }

  exportPgn () {
    // Apply custom headers to the game object before exporting
    // Note: chess.js might clear headers on reset, so we re-apply them or manage them externally
    // However, if we use game.header(), it's persistent until cleared.
    // Ideally we merge existing game headers with our custom ones.

    // Update Date/Time just before export
    this.customHeaders.Date = new Date().toISOString().split('T')[0]
    this.customHeaders.Time = new Date().toTimeString().split(' ')[0]

    // We can't easily rely on game.header() to be pristine if we are setting it repeatedly
    // But chess.js header() takes varargs: header('Key', 'Value', 'Key2', 'Value2')

    // Let's gather current headers first (if any)
    const currentHeaders = this.game.header()

    // Merge custom headers
    const finalHeaders = { ...currentHeaders, ...this.customHeaders }

    // Apply to game object
    const headerArgs = []
    for (const [key, value] of Object.entries(finalHeaders)) {
      headerArgs.push(key, value)
    }
    this.game.header(...headerArgs)

    return this.game.pgn()
  }

  downloadPgn () {
    const pgn = this.exportPgn()
    const blob = new Blob([pgn], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `game_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.pgn`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    this.uiManager.showToast('PGN Downloaded', 'success')
  }

  copyPgnToClipboard () {
    const pgn = this.exportPgn()
    navigator.clipboard.writeText(pgn).then(() => {
      this.uiManager.showToast('PGN copied to clipboard', 'success')
    }, (err) => {
      this.uiManager.showToast('Failed to copy PGN', 'error')
      console.error('Could not copy text: ', err)
    })
  }

  importPgn (pgnString) {
    const success = this.game.load_pgn(pgnString)
    if (success) {
      this.uiManager.showToast('PGN loaded successfully', 'success')
      return true
    } else {
      this.uiManager.showToast('Invalid PGN string', 'error')
      return false
    }
  }
}

if (typeof module !== 'undefined') {
  module.exports = PgnManager
}
