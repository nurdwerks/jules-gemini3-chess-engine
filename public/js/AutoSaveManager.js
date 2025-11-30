/* global localStorage */

class AutoSaveManager {
  constructor (gameManager, uiManager, game) {
    this.gameManager = gameManager
    this.uiManager = uiManager
    this.game = game
    this.storageKey = 'autosave_game_state'
  }

  saveGame () {
    if (!this.gameManager.gameStarted) return

    const state = {
      fen: this.game.fen(),
      pgn: this.game.pgn(),
      timestamp: Date.now(),
      mode: this.gameManager.gameMode,
      whiteTime: this.gameManager.whiteTime,
      blackTime: this.gameManager.blackTime
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state))
    } catch (e) {
      console.warn('AutoSave failed', e)
    }
  }

  checkForSavedGame () {
    try {
      const saved = localStorage.getItem(this.storageKey)
      if (!saved) return false

      const state = JSON.parse(saved)

      // Don't restore if it's just the start position or very old (e.g. > 24 hours)
      if (state.fen === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') return false

      // Optional: Check timestamp for expiry? For now, we keep it simple.

      return state
    } catch (e) {
      console.error('Error reading autosave', e)
      return false
    }
  }

  restoreGame (state) {
    if (!state) return

    this.gameManager.startNewGame(state.fen)

    // Restore PGN if possible to keep history
    // Note: pgn-parser might be needed if we want full headers,
    // but chess.js load_pgn usually works for moves.
    if (state.pgn) {
      this.game.load_pgn(state.pgn)
    }

    // Restore times
    if (state.whiteTime) this.gameManager.whiteTime = state.whiteTime
    if (state.blackTime) this.gameManager.blackTime = state.blackTime

    // Restore mode if valid
    if (state.mode) this.gameManager.gameMode = state.mode

    this.uiManager.showToast('Game Restored from Auto-Save', 'success')
  }

  clearSave () {
    localStorage.removeItem(this.storageKey)
  }
}

if (typeof module !== 'undefined') {
  module.exports = AutoSaveManager
}
