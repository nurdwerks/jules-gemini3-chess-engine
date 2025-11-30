/* eslint-env browser */
/* global QRCode, GIF */

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

  generateQrCode () {
    const url = window.location.href.split('?')[0] + '?fen=' + encodeURIComponent(this.game.fen())
    const container = document.getElementById('qrcode-container')
    if (container) {
      container.innerHTML = ''
      // eslint-disable-next-line no-new
      new QRCode(container, {
        text: url,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      })
      const modal = document.getElementById('qr-modal')
      if (modal) modal.classList.add('active')

      const closeBtn = document.getElementById('close-qr-modal')
      if (closeBtn) {
        closeBtn.onclick = () => modal.classList.remove('active')
      }
    }
  }

  async exportGif () {
    if (typeof GIF === 'undefined') {
      this.uiManager.showToast('GIF library not loaded.', 'error')
      return
    }

    this.uiManager.showToast('Generating GIF... Please wait.', 'info')
    const gif = new GIF({
      workers: 2,
      quality: 10,
      workerScript: 'libs/gif.worker.js'
    })

    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.top = '-9999px'
    container.id = 'export-board'
    const mainBoard = document.getElementById('chessboard')
    if (mainBoard) container.className = mainBoard.className
    document.body.appendChild(container)

    const tempRenderer = new window.BoardRenderer(container, this.game, { isViewOnly: () => true })
    if (this.boardRenderer.currentPieceSet) tempRenderer.setPieceSet(this.boardRenderer.currentPieceSet)

    const moves = this.game.history({ verbose: true })
    const tempReplay = new window.Chess(this.game.fen())
    while (tempReplay.undo()) {}
    const startFen = tempReplay.fen()

    const tempGame = new window.Chess(startFen)

    // Initial frame
    tempRenderer.render({ board: tempGame.board(), chess: tempGame })
    await this._captureFrame(gif, tempRenderer)

    for (const move of moves) {
      tempGame.move(move)
      tempRenderer.render({ board: tempGame.board(), chess: tempGame, lastMove: { from: move.from, to: move.to } })
      await this._captureFrame(gif, tempRenderer)
    }

    document.body.removeChild(container)

    gif.on('finished', (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `game_${new Date().toISOString().replace(/[:.]/g, '-')}.gif`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      this.uiManager.showToast('GIF Downloaded!', 'success')
    })

    gif.render()
  }

  _captureFrame (gif, renderer = null) {
    const r = renderer || this.boardRenderer
    const svgUrl = r.getScreenshotUrl()
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        gif.addFrame(img, { delay: 1000 })
        URL.revokeObjectURL(svgUrl)
        resolve()
      }
      img.src = svgUrl
    })
  }
}

if (typeof module !== 'undefined') {
  module.exports = window.ExternalActions
}
