/* eslint-env browser */

window.ExternalActions = class ExternalActions {
  constructor (pgnManager, boardRenderer, uiManager, game) {
    this.pgnManager = pgnManager
    this.boardRenderer = boardRenderer
    this.uiManager = uiManager
    this.game = game
  }

  analyzeLichess () {
    const pgn = this.pgnManager.exportPgn()
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = 'https://lichess.org/import'
    form.target = '_blank'
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = 'pgn'
    input.value = pgn
    form.appendChild(input)
    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
  }

  analyzeChessCom () {
    const pgn = this.pgnManager.exportPgn()
    const url = `https://www.chess.com/analysis?pgn=${encodeURIComponent(pgn)}`
    window.open(url, '_blank')
  }

  shareTwitter () {
    const text = 'Check out my game on Jules & Gemini Chess!'
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&hashtags=chess,engine`
    window.open(url, '_blank')
  }

  shareReddit () {
    const url = `https://www.reddit.com/submit?title=${encodeURIComponent('My Chess Game')}&text=${encodeURIComponent(this.pgnManager.exportPgn())}`
    window.open(url, '_blank')
  }

  downloadScreenshot () {
    const url = this.boardRenderer.getScreenshotUrl()
    const a = document.createElement('a')
    a.href = url
    a.download = `screenshot_${new Date().toISOString().replace(/[:.]/g, '-')}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    this.uiManager.showToast('Screenshot downloaded', 'success')
  }
}

if (typeof module !== 'undefined') {
  module.exports = window.ExternalActions
}
