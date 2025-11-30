/* eslint-env browser */
/* global Chess, ClientUtils, ArrowManager, VisualizationManager */

window.BoardRenderer = class BoardRenderer {
  constructor (boardElement, game, callbacks) {
    this.boardElement = boardElement
    this.game = game
    this.callbacks = callbacks || {}
    this.currentPieceSet = 'cburnett'
    this.customPieceImages = {}
    this.isFlipped = false
    this.showCoords = true
    this.showArrowLast = false
    this.showThreats = false

    this.draggedPiece = null
    this.draggedFrom = null

    // Pre-bind event handlers
    this.handleDragStart = this.handleDragStart.bind(this)
    this.handleDragOver = this.handleDragOver.bind(this)
    this.handleDragEnter = this.handleDragEnter.bind(this)
    this.handleDragLeave = this.handleDragLeave.bind(this)
    this.handleDragEnd = this.handleDragEnd.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
  }

  setPieceSet (set) {
    this.currentPieceSet = set
  }

  setFlipped (flipped) {
    this.isFlipped = flipped
    if (this.isFlipped) {
      this.boardElement.classList.add('flipped')
    } else {
      this.boardElement.classList.remove('flipped')
    }
  }

  render (state) {
    this.boardElement.innerHTML = ''
    const board = state.board
    const chess = state.chess
    const selectedSquare = state.selectedSquare

    if (VisualizationManager) {
      VisualizationManager.calculate(chess, selectedSquare)
    }

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        this._createSquare(r, c, board, chess, state)
      }
    }

    this._updateLastMoveArrow(state)
  }

  _createSquare (r, c, board, chess, state) {
    const row = r
    const col = c
    const alg = ClientUtils.coordsToAlgebraic(row, col)

    const square = document.createElement('div')
    square.classList.add('square')
    if ((row + col) % 2 === 0) square.classList.add('white')
    else square.classList.add('black')

    this._addCoordinates(square, row, col)
    this._addLegalMoveHints(square, alg, state.legalMoves)

    const pieceObj = board[row][col]
    this._addPieceToSquare(square, pieceObj, alg)

    square.dataset.row = row
    square.dataset.col = col
    square.dataset.alg = alg

    this._applySquareHighlights(square, row, col, alg, chess, state)

    square.addEventListener('click', () => {
      if (this.callbacks.onSquareClick) {
        this.callbacks.onSquareClick(row, col)
      }
    })

    // Drag and Drop
    square.addEventListener('dragover', this.handleDragOver)
    square.addEventListener('dragenter', this.handleDragEnter)
    square.addEventListener('dragleave', this.handleDragLeave)
    square.addEventListener('drop', this.handleDrop)
    square.addEventListener('mousedown', this.handleMouseDown)
    square.addEventListener('mouseup', this.handleMouseUp)
    square.addEventListener('contextmenu', (e) => e.preventDefault())

    this.boardElement.appendChild(square)
  }

  handleMouseDown (e) {
    if (e.button === 2) { // Right click
      const square = e.target.closest('.square')
      if (square) {
        this.rightClickStart = square.dataset.alg
      }
    }
  }

  handleMouseUp (e) {
    if (e.button === 2) {
      const square = e.target.closest('.square')
      if (square && this.rightClickStart) {
        const to = square.dataset.alg
        if (this.rightClickStart === to) {
          if (ArrowManager) ArrowManager.toggleUserHighlight(to)
        } else {
          if (ArrowManager) ArrowManager.addUserArrow(this.rightClickStart, to)
        }
      }
      this.rightClickStart = null
    }
  }

  _addPieceToSquare (square, pieceObj, alg) {
    if (!pieceObj) return
    const color = pieceObj.color
    const type = pieceObj.type
    let el

    if (this.currentPieceSet === 'unicode') {
      const div = document.createElement('div')
      div.classList.add('piece', 'piece-text')
      div.classList.add(color === 'w' ? 'white-piece' : 'black-piece')
      div.textContent = this._getUnicodePiece(color, type)
      el = div
    } else if (this.currentPieceSet === 'custom-upload') {
      const img = document.createElement('img')
      const key = color + type
      img.src = this.customPieceImages[key] || ''
      img.classList.add('piece')
      el = img
    } else {
      const img = document.createElement('img')
      img.src = `images/${this.currentPieceSet}/${color}${type}.svg`
      img.classList.add('piece')
      img.classList.add(`piece-set-${this.currentPieceSet}`)
      el = img
    }

    if (el) {
      el.draggable = true
      el.dataset.alg = alg
      el.addEventListener('dragstart', this.handleDragStart)
      el.addEventListener('dragend', this.handleDragEnd)
      square.appendChild(el)
    }
  }

  handleDragStart (e) {
    // If not live view, prevent drag
    if (this.callbacks.isViewOnly && this.callbacks.isViewOnly()) {
      e.preventDefault()
      return
    }

    this.draggedPiece = e.target
    this.draggedFrom = this.draggedPiece.dataset.alg
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', this.draggedFrom)
    setTimeout(() => {
      if (this.draggedPiece) this.draggedPiece.classList.add('dragging')
    }, 0)
  }

  handleDragOver (e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    return false
  }

  handleDragEnter (e) {
    e.preventDefault()
    const square = e.target.closest('.square')
    if (square) square.classList.add('drag-target')
  }

  handleDragLeave (e) {
    const square = e.target.closest('.square')
    if (square) square.classList.remove('drag-target')
  }

  handleDragEnd (e) {
    if (this.draggedPiece) {
      this.draggedPiece.classList.remove('dragging')
    }
    document.querySelectorAll('.drag-target').forEach(el => el.classList.remove('drag-target'))
    this.draggedPiece = null
    this.draggedFrom = null
  }

  handleDrop (e) {
    e.stopPropagation()
    e.preventDefault()

    const targetSquare = e.target.closest('.square')
    if (!targetSquare) {
      this.handleDragEnd(e)
      return
    }

    const to = targetSquare.dataset.alg
    const from = this.draggedFrom

    if (from && to && from !== to) {
      if (this.callbacks.onDrop) {
        this.callbacks.onDrop(from, to)
      }
    }

    this.handleDragEnd(e)
  }

  _addCoordinates (square, row, col) {
    if (!this.showCoords) return
    const isLeftEdge = (!this.isFlipped && col === 0) || (this.isFlipped && col === 7)
    if (isLeftEdge) {
      const rank = 8 - row
      const rankSpan = document.createElement('span')
      rankSpan.classList.add('coordinate', 'rank')
      rankSpan.textContent = rank
      square.appendChild(rankSpan)
    }

    const isBottomEdge = (!this.isFlipped && row === 7) || (this.isFlipped && row === 0)
    if (isBottomEdge) {
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
      const file = files[col]
      const fileSpan = document.createElement('span')
      fileSpan.classList.add('coordinate', 'file')
      fileSpan.textContent = file
      square.appendChild(fileSpan)
    }
  }

  _addLegalMoveHints (square, alg, legalMoves) {
    if (!legalMoves) return
    const move = legalMoves.find(m => m.to === alg)
    if (move) {
      square.classList.add('legal-move-hint')
      if (move.flags.includes('c') || move.flags.includes('e')) {
        square.classList.add('capture-hint')
      }
    }
  }

  _applySquareHighlights (square, row, col, alg, chess, state) {
    this._applySelectionHighlights(square, row, col, alg, state)

    if (ArrowManager) {
      const userH = ArrowManager.getUserHighlight(alg)
      if (userH) square.classList.add(userH)
    }

    this._applyLastMoveHighlight(square, alg, state)
    this._applyCheckHighlight(square, row, col, chess)
    this._applyThreatHighlight(square, alg, chess)
    this._applyVisualizationHighlights(square, alg)
  }

  _applySelectionHighlights (square, row, col, alg, state) {
    if (state.selectedSquare && state.selectedSquare.row === row && state.selectedSquare.col === col) {
      square.classList.add('selected')
    }
    if (state.pendingConfirmationMove && state.pendingConfirmationMove.to === alg) {
      square.classList.add('selected')
    }
    if (state.premove && (alg === state.premove.from || alg === state.premove.to)) {
      square.classList.add('premove-highlight')
    }
  }

  _applyVisualizationHighlights (square, alg) {
    if (VisualizationManager) {
      const vizHighlights = VisualizationManager.getHighlights(alg)
      vizHighlights.forEach(c => square.classList.add(c))

      const op = VisualizationManager.getOpacity(alg)
      if (op) {
        const overlay = document.createElement('div')
        overlay.classList.add('heatmap-overlay')
        overlay.style.backgroundColor = op.color
        overlay.style.opacity = op.value
        square.appendChild(overlay)
      }
    }
  }

  _applyLastMoveHighlight (square, alg, state) {
    const history = this.game.history({ verbose: true })
    let lastMove = null

    if (state.currentViewIndex === -1) {
      if (history.length > 0) lastMove = history[history.length - 1]
    } else {
      if (state.currentViewIndex >= 0 && state.currentViewIndex < history.length) {
        lastMove = history[state.currentViewIndex]
      }
    }

    if (lastMove && (alg === lastMove.from || alg === lastMove.to)) {
      square.classList.add('last-move')
    }
  }

  _applyCheckHighlight (square, row, col, chess) {
    if (chess && chess.in_check()) {
      const turn = chess.turn()
      const pieceObj = chess.board()[row][col]
      if (pieceObj && pieceObj.type === 'k' && pieceObj.color === turn) {
        square.classList.add('check-highlight')
      }
    }
  }

  _applyThreatHighlight (square, alg, chess) {
    if (this.showThreats && chess) {
      if (this._isSquareThreatened(alg, chess)) {
        const p = chess.get(alg)
        if (p && p.color === chess.turn()) {
          square.classList.add('threat-highlight')
        }
      }
    }
  }

  _isSquareThreatened (alg, chess) {
    // Basic threat check logic
    const currentTurn = chess.turn()
    const opponent = currentTurn === 'w' ? 'b' : 'w'
    const tokens = chess.fen().split(' ')
    tokens[1] = opponent
    tokens[3] = '-'
    const tempFen = tokens.join(' ')
    try {
      const tempGame = new Chess(tempFen)
      const moves = tempGame.moves({ verbose: true })
      return moves.some(m => m.to === alg)
    } catch (e) {
      return false
    }
  }

  _updateLastMoveArrow (state) {
    if (!ArrowManager) return
    if (!this.showArrowLast) {
      ArrowManager.clearLastMoveArrow()
      return
    }

    const history = this.game.history({ verbose: true })
    let move = null

    if (state.currentViewIndex === -1) {
      if (history.length > 0) move = history[history.length - 1]
    } else {
      if (state.currentViewIndex >= 0 && state.currentViewIndex < history.length) {
        move = history[state.currentViewIndex]
      }
    }

    if (move) {
      ArrowManager.setLastMoveArrow(move.from, move.to)
    } else {
      ArrowManager.clearLastMoveArrow()
    }
  }

  _getUnicodePiece (color, type) {
    const map = {
      w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
      b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }
    }
    return map[color][type]
  }

  animateMove (from, to, duration) {
    return new Promise(resolve => {
      const fromSquare = this.boardElement.querySelector(`.square[data-alg="${from}"]`)
      const toSquare = this.boardElement.querySelector(`.square[data-alg="${to}"]`)

      if (!fromSquare || !toSquare) {
        resolve()
        return
      }

      const piece = fromSquare.querySelector('.piece')
      if (!piece) {
        resolve()
        return
      }

      const fromRect = fromSquare.getBoundingClientRect()
      const toRect = toSquare.getBoundingClientRect()

      const dx = toRect.left - fromRect.left
      const dy = toRect.top - fromRect.top

      piece.style.position = 'relative'
      piece.style.zIndex = '100'
      piece.style.transition = `transform ${duration}ms ease-in-out`
      piece.style.transform = `translate(${dx}px, ${dy}px)`

      setTimeout(() => {
        resolve()
      }, duration)
    })
  }

  getScreenshotUrl () {
    const size = 800
    const squareSize = size / 8
    const xmlns = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(xmlns, 'svg')
    svg.setAttribute('width', size)
    svg.setAttribute('height', size)
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`)

    const squares = this.boardElement.querySelectorAll('.square')
    squares.forEach(sq => {
      const row = parseInt(sq.dataset.row)
      const col = parseInt(sq.dataset.col)

      let displayRow = row
      let displayCol = col
      if (this.isFlipped) {
        displayRow = 7 - row
        displayCol = 7 - col
      }

      const x = displayCol * squareSize
      const y = displayRow * squareSize

      const rect = document.createElementNS(xmlns, 'rect')
      rect.setAttribute('x', x)
      rect.setAttribute('y', y)
      rect.setAttribute('width', squareSize)
      rect.setAttribute('height', squareSize)
      rect.setAttribute('fill', window.getComputedStyle(sq).backgroundColor)
      svg.appendChild(rect)

      const piece = sq.querySelector('.piece')
      if (piece) {
        const img = document.createElementNS(xmlns, 'image')
        img.setAttribute('x', x)
        img.setAttribute('y', y)
        img.setAttribute('width', squareSize)
        img.setAttribute('height', squareSize)
        img.setAttribute('href', piece.src)
        svg.appendChild(img)
      }

      // Coordinates
      if (this.showCoords) {
        const coords = sq.querySelectorAll('.coordinate')
        coords.forEach(c => {
          const txt = document.createElementNS(xmlns, 'text')
          txt.textContent = c.textContent
          const style = window.getComputedStyle(c)

          // Approximate position based on class
          if (c.classList.contains('rank')) {
            txt.setAttribute('x', x + 2)
            txt.setAttribute('y', y + 12)
            txt.setAttribute('text-anchor', 'start')
          } else {
            txt.setAttribute('x', x + squareSize - 2)
            txt.setAttribute('y', y + squareSize - 2)
            txt.setAttribute('text-anchor', 'end')
          }

          txt.setAttribute('font-family', style.fontFamily)
          txt.setAttribute('font-size', '12px')
          txt.setAttribute('fill', style.color)
          svg.appendChild(txt)
        })
      }
    })

    const serializer = new XMLSerializer()
    const source = serializer.serializeToString(svg)
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    return URL.createObjectURL(blob)
  }
}
