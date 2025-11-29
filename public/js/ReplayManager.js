/* eslint-env browser */

class ReplayManager {
  constructor (gameManager, game, renderCallback) {
    this.gameManager = gameManager
    this.game = game
    this.renderCallback = renderCallback
    this.replayInterval = null
  }

  toggleReplay () {
    if (this.replayInterval) {
      clearInterval(this.replayInterval)
      this.replayInterval = null
    } else {
      this.gameManager.currentViewIndex = -1
      this.renderCallback()
      this.replayInterval = setInterval(() => {
        this.gameManager.currentViewIndex++
        if (this.gameManager.currentViewIndex >= this.game.history().length) this.gameManager.currentViewIndex = -1
        this.renderCallback()
      }, 800)
    }
  }
}

window.ReplayManager = ReplayManager
