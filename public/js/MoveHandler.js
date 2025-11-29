/* eslint-env browser */
/* global ClientUtils */

window.MoveHandler = class MoveHandler {
  constructor (game, gameManager, uiManager, boardRenderer, trainingManager, state, renderCallback) {
    this.game = game
    this.gameManager = gameManager
    this.uiManager = uiManager
    this.boardRenderer = boardRenderer
    this.trainingManager = trainingManager
    this.state = state
    this.render = renderCallback
  }

  handleSquareClick (row, col) {
    if (this.trainingManager.isMemoryTraining) {
      this.trainingManager.handleMemoryClick(row, col, ClientUtils.coordsToAlgebraic(row, col))
      return
    }

    if (this.state.currentViewIndex !== -1) return

    const alg = ClientUtils.coordsToAlgebraic(row, col)

    // Move Attempt
    if (this.state.selectedSquare) {
      const move = this.state.legalMoves.find(m => m.to === alg)
      if (move) {
        this.attemptMove(move)
        return
      }
    }

    this._handlePieceSelection(alg, row, col)
  }

  _handlePieceSelection (alg, row, col) {
    const piece = this.game.get(alg)
    if (piece && piece.color === this.game.turn()) {
      this.state.selectedSquare = { row, col }
      this.state.legalMoves = this.game.moves({ square: alg, verbose: true })
      this.render()
    } else {
      // Deselect
      this.state.selectedSquare = null
      this.state.legalMoves = []
      this.render()
    }
  }

  handleDrop (from, to) {
    const moves = this.game.moves({ verbose: true })
    let move = moves.find(m => m.from === from && m.to === to)

    if (!move) {
      move = moves.find(m => m.from === from && m.to === to && m.promotion === 'q')
    }

    if (move) {
      this.attemptMove(move)
    }
  }

  async attemptMove (move) {
    if (this._shouldWaitConfirmation(move)) return
    if (this._handleTactics(move)) return
    if (this._handlePremove(move)) return

    const promoSuccess = await this._handlePromotion(move)
    if (!promoSuccess) return

    await this._executeMove(move)
  }

  _shouldWaitConfirmation (move) {
    const confirmCheck = document.getElementById('move-confirmation')
    const needsConfirm = confirmCheck && confirmCheck.checked && !this.trainingManager.isTacticsMode && this.gameManager.gameMode !== 'guess'

    if (needsConfirm) {
      if (!this.state.pendingConfirmationMove || this.state.pendingConfirmationMove.from !== move.from || this.state.pendingConfirmationMove.to !== move.to) {
        this.state.pendingConfirmationMove = move
        this.render()
        this.uiManager.showToast('Click again to confirm move', 'info')
        return true
      }
      this.state.pendingConfirmationMove = null
    }
    return false
  }

  _handleTactics (move) {
    if (this.trainingManager.isTacticsMode) {
      if (this.trainingManager.handleTacticsMove(move)) {
        this.render()
      } else {
        this.uiManager.showToast('Incorrect move', 'error')
      }
      this._resetSelection()
      return true
    }
    return false
  }

  _handlePremove (move) {
    if (move.color !== this.game.turn()) {
      this.state.premove = move
      this._resetSelection()
      this.state.pendingConfirmationMove = null
      this.render()
      this.uiManager.showToast('Premove set', 'info')
      return true
    }
    return false
  }

  async _handlePromotion (move) {
    if (move.flags.includes('p')) {
      if (document.getElementById('auto-queen') && document.getElementById('auto-queen').checked) {
        move.promotion = 'q'
      } else {
        try {
          const choice = await this.uiManager.showPromotionModal(move.color, this.boardRenderer.currentPieceSet)
          move.promotion = choice
        } catch (e) {
          this._resetSelection()
          this.render()
          return false
        }
      }
    }
    return true
  }

  async _executeMove (move) {
    const speed = parseInt(this.uiManager.elements.animationSpeedSelect.value)
    if (speed > 0) {
      await this.boardRenderer.animateMove(move.from, move.to, speed)
    }

    const result = this.gameManager.performMove(move, true)
    if (result) {
      if (this.gameManager.gameMode === 'pve') {
        this.gameManager.sendPositionAndGo()
      }
    }

    this._resetSelection()
    this.render()
  }

  _resetSelection () {
    this.state.selectedSquare = null
    this.state.legalMoves = []
  }

  async checkAndExecutePremove () {
    if (!this.state.premove) return
    const moves = this.game.moves({ verbose: true })
    const match = moves.find(m => m.from === this.state.premove.from && m.to === this.state.premove.to && (!this.state.premove.promotion || m.promotion === this.state.premove.promotion))
    if (match) {
      this.state.premove = null
      await this.attemptMove(match)
    } else {
      this.state.premove = null
      this.uiManager.showToast('Premove invalid', 'error')
      this.render()
    }
  }
}
