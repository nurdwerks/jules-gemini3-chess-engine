/* eslint-env browser */
/* global Chess, ClientUtils */

window.BoardEditor = class BoardEditor {
  constructor (modalId, onLoadPosition) {
    this.modal = document.getElementById(modalId)
    this.onLoadPosition = onLoadPosition
    this.boardContainer = document.getElementById('editor-board-container')
    this.paletteW = document.getElementById('palette-w')
    this.paletteB = document.getElementById('palette-b')

    // UI Controls
    this.trashBtn = document.getElementById('editor-trash-btn')
    this.clearBtn = document.getElementById('editor-clear-btn')
    this.startPosBtn = document.getElementById('editor-startpos-btn')
    this.loadPosBtn = document.getElementById('load-position-btn')
    this.closeBtn = document.getElementById('close-board-editor-modal')

    // Settings
    this.inputs = {
      turn: document.getElementsByName('editor-turn'),
      castling: {
        K: document.getElementById('editor-castling-wk'),
        Q: document.getElementById('editor-castling-wq'),
        k: document.getElementById('editor-castling-bk'),
        q: document.getElementById('editor-castling-bq')
      },
      ep: document.getElementById('editor-ep-target'),
      half: document.getElementById('editor-halfmove'),
      full: document.getElementById('editor-fullmove'),
      fen: document.getElementById('editor-fen-output')
    }

    this.board = []
    this.trashMode = false
    this.draggedItem = null

    this.init()
  }

  init () {
    this.setupPalette()
    this.bindEvents()
    this.createEmptyBoard()
  }

  setupPalette () {
    const pieces = ['p', 'n', 'b', 'r', 'q', 'k']

    // White Pieces
    pieces.forEach(p => {
      const el = this.createPalettePiece('w', p)
      this.paletteW.appendChild(el)
    })

    // Black Pieces
    pieces.forEach(p => {
      const el = this.createPalettePiece('b', p)
      this.paletteB.appendChild(el)
    })
  }

  createPalettePiece (color, type) {
    const div = document.createElement('div')
    div.classList.add('palette-piece')

    const img = document.createElement('img')
    img.src = `images/cburnett/${color}${type}.svg`
    img.style.width = '100%'
    img.style.height = '100%'

    div.appendChild(img)
    div.draggable = true

    div.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('application/json', JSON.stringify({
        type: 'add',
        piece: { color, type }
      }))
      e.dataTransfer.effectAllowed = 'copy'
    })

    return div
  }

  bindEvents () {
    this.closeBtn.addEventListener('click', () => this.close())
    this.loadPosBtn.addEventListener('click', () => {
      const fen = this.generateFen()
      // Basic validation via Chess.js
      try {
        // eslint-disable-next-line no-new
        new Chess(fen)
        this.onLoadPosition(fen)
        this.close()
      } catch (e) {
        alert('Invalid Position: ' + e.message)
      }
    })

    this.trashBtn.addEventListener('click', () => {
      this.trashMode = !this.trashMode
      if (this.trashMode) this.trashBtn.classList.add('active')
      else this.trashBtn.classList.remove('active')
    })

    this.clearBtn.addEventListener('click', () => {
      this.createEmptyBoard()
      this.updateFenDisplay()
    })

    this.startPosBtn.addEventListener('click', () => {
      this.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    })

    // Inputs change listeners
    this.inputs.turn.forEach(r => r.addEventListener('change', () => this.updateFenDisplay()))
    Object.values(this.inputs.castling).forEach(c => c.addEventListener('change', () => this.updateFenDisplay()))
    this.inputs.ep.addEventListener('input', () => this.updateFenDisplay())
    this.inputs.half.addEventListener('input', () => this.updateFenDisplay())
    this.inputs.full.addEventListener('input', () => this.updateFenDisplay())

    // Paste FEN listener
    this.inputs.fen.removeAttribute('readonly') // Allow editing
    this.inputs.fen.addEventListener('change', () => {
      const fen = this.inputs.fen.value
      try {
        // eslint-disable-next-line no-new
        new Chess(fen) // Validate
        this.loadFen(fen)
      } catch (e) {
        // invalid manual entry, maybe revert or warn?
        // For now just ignore
      }
    })
  }

  open (currentFen) {
    this.modal.classList.add('active')
    this.loadFen(currentFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  }

  close () {
    this.modal.classList.remove('active')
    this.trashMode = false
    this.trashBtn.classList.remove('active')
  }

  createEmptyBoard () {
    this.board = Array(8).fill(null).map(() => Array(8).fill(null))
    this.renderBoard()
  }

  loadFen (fen) {
    try {
      const chess = new Chess(fen)
      const boardArray = chess.board()

      // Map chess.js board to our internal board
      this.board = boardArray.map(row => row.map(p => p ? { type: p.type, color: p.color } : null))

      // Set UI controls
      const tokens = fen.split(' ')
      const turn = tokens[1]
      const castling = tokens[2]
      const ep = tokens[3]
      const half = tokens[4]
      const full = tokens[5]

      this.inputs.turn.forEach(r => { r.checked = r.value === turn })

      this.inputs.castling.K.checked = castling.includes('K')
      this.inputs.castling.Q.checked = castling.includes('Q')
      this.inputs.castling.k.checked = castling.includes('k')
      this.inputs.castling.q.checked = castling.includes('q')

      this.inputs.ep.value = ep === '-' ? '' : ep
      this.inputs.half.value = half || 0
      this.inputs.full.value = full || 1

      this.renderBoard()
      this.updateFenDisplay()
    } catch (e) {
      console.error('Error loading FEN into editor', e)
    }
  }

  generateFen () {
    const pieces = this._getPiecePlacementFen()
    const turn = this._getTurnFen()
    const castling = this._getCastlingFen()
    const ep = this._getEnPassantFen()
    const clocks = this._getClocksFen()

    return `${pieces} ${turn} ${castling} ${ep} ${clocks}`
  }

  _getPiecePlacementFen () {
    let fen = ''
    for (let r = 0; r < 8; r++) {
      let empty = 0
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c]
        if (!p) {
          empty++
        } else {
          if (empty > 0) {
            fen += empty
            empty = 0
          }
          const char = p.type
          fen += p.color === 'w' ? char.toUpperCase() : char.toLowerCase()
        }
      }
      if (empty > 0) fen += empty
      if (r < 7) fen += '/'
    }
    return fen
  }

  _getTurnFen () {
    return Array.from(this.inputs.turn).find(r => r.checked).value
  }

  _getCastlingFen () {
    let castling = ''
    if (this.inputs.castling.K.checked) castling += 'K'
    if (this.inputs.castling.Q.checked) castling += 'Q'
    if (this.inputs.castling.k.checked) castling += 'k'
    if (this.inputs.castling.q.checked) castling += 'q'
    if (castling === '') castling = '-'
    return castling
  }

  _getEnPassantFen () {
    let ep = this.inputs.ep.value.trim()
    if (!/^[a-h][36]$/.test(ep)) ep = '-'
    return ep
  }

  _getClocksFen () {
    const half = this.inputs.half.value || 0
    const full = this.inputs.full.value || 1
    return `${half} ${full}`
  }

  updateFenDisplay () {
    this.inputs.fen.value = this.generateFen()
  }

  renderBoard () {
    this.boardContainer.innerHTML = ''

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const square = document.createElement('div')
        square.classList.add('square')
        square.classList.add((r + c) % 2 === 0 ? 'white' : 'black')

        // Add Coordinate
        const alg = ClientUtils.coordsToAlgebraic(r, c)
        square.dataset.alg = alg
        square.dataset.r = r
        square.dataset.c = c

        // Add Piece
        const piece = this.board[r][c]
        if (piece) {
          const img = document.createElement('img')
          img.src = `images/cburnett/${piece.color}${piece.type}.svg`
          img.classList.add('piece')
          img.draggable = true
          img.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('application/json', JSON.stringify({
              type: 'move',
              from: { r, c }
            }))
            e.dataTransfer.effectAllowed = 'move'
          })
          square.appendChild(img)
        }

        // Drop listeners
        square.addEventListener('dragover', (e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
        })
        square.addEventListener('drop', (e) => this.handleDrop(e, r, c))

        // Click listener (Trash / Toggle)
        square.addEventListener('click', () => this.handleSquareClick(r, c))

        this.boardContainer.appendChild(square)
      }
    }
  }

  handleDrop (e, r, c) {
    e.preventDefault()
    const dataRaw = e.dataTransfer.getData('application/json')
    if (!dataRaw) return

    const data = JSON.parse(dataRaw)

    if (data.type === 'add') {
      this.board[r][c] = data.piece
    } else if (data.type === 'move') {
      const fromR = data.from.r
      const fromC = data.from.c
      const piece = this.board[fromR][fromC]
      this.board[fromR][fromC] = null
      this.board[r][c] = piece
    }

    this.renderBoard()
    this.updateFenDisplay()
  }

  handleSquareClick (r, c) {
    if (this.trashMode) {
      this.board[r][c] = null
      this.renderBoard()
      this.updateFenDisplay()
    }
  }
}
