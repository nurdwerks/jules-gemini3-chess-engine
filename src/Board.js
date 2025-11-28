const Piece = require('./Piece')
const Zobrist = require('./Zobrist')
const Bitboard = require('./Bitboard')
const trace = require('./trace')
const FenParser = require('./FenParser')
const MoveGenerator = require('./MoveGenerator')

class Board {
  constructor () {
    this.activeColor = 'w'
    this.castlingRights = 'KQkq'
    this.enPassantTarget = '-'
    this.halfMoveClock = 0
    this.fullMoveNumber = 1
    this.zobristKey = 0n
    this.history = [] // Array of hashes for repetition detection
    this.castling = { w: { k: false, q: false }, b: { k: false, q: false } } // Backward compatibility structure
    this.castlingRooks = { white: [], black: [] } // Stores 0x88 indices of castling rooks
    this.isChess960 = false

    // Bitboards
    this.bitboards = {
      white: 0n,
      black: 0n,
      pawn: 0n,
      knight: 0n,
      bishop: 0n,
      rook: 0n,
      queen: 0n,
      king: 0n
    }

    this.setupBoard()
  }

  toIndex (row, col) {
    return (row << 4) | col
  }

  algebraicToIndex (alg) {
    const col = alg.charCodeAt(0) - 'a'.charCodeAt(0)
    const rank = parseInt(alg[1], 10)
    const row = 8 - rank
    return this.toIndex(row, col)
  }

  toRowCol (index) {
    return {
      row: index >> 4,
      col: index & 7
    }
  }

  isValidSquare (index) {
    return (index & 0x88) === 0
  }

  // Helper to get piece from bitboards
  getPiece (index, col) {
    if (col !== undefined) {
      index = this.toIndex(index, col)
    }
    if (!this.isValidSquare(index)) return null
    const sq64 = Bitboard.to64(index)
    const mask = 1n << BigInt(sq64)

    // Check occupancy first
    if (!((this.bitboards.white | this.bitboards.black) & mask)) return null

    const color = (this.bitboards.white & mask) ? 'white' : 'black'

    if (this.bitboards.pawn & mask) return new Piece(color, 'pawn')
    if (this.bitboards.knight & mask) return new Piece(color, 'knight')
    if (this.bitboards.bishop & mask) return new Piece(color, 'bishop')
    if (this.bitboards.rook & mask) return new Piece(color, 'rook')
    if (this.bitboards.queen & mask) return new Piece(color, 'queen')
    if (this.bitboards.king & mask) return new Piece(color, 'king')

    return null
  }

  placePiece (row, col, piece) {
    const index = this.toIndex(row, col)
    if (this.isValidSquare(index)) {
      // Update Bitboards
      const bbRank = 7 - row
      const bbSq = bbRank * 8 + col
      const bit = 1n << BigInt(bbSq)
      this.bitboards[piece.color] |= bit
      this.bitboards[piece.type] |= bit
    }
  }

  toggleBitboard (piece, index) {
    if (!piece) return
    const { row, col } = this.toRowCol(index)
    const bbRank = 7 - row
    const bbSq = bbRank * 8 + col
    const bit = 1n << BigInt(bbSq)
    this.bitboards[piece.color] ^= bit
    this.bitboards[piece.type] ^= bit
  }

  /**
   * Executes a move on the board state, updating bitboards.
   * Does NOT handle full state history (Zobrist, etc.) - use applyMove for that.
   * @param {Object} move - The move object.
   * @param {number} move.from - The 0x88 index of the source square.
   * @param {number} move.to - The 0x88 index of the destination square.
   * @param {string} move.flags - Move flags ('n', 'c', 'e', 'p', 'k', 'q', etc.).
   * @param {Piece} move.piece - The piece being moved.
   * @param {Piece} [move.captured] - The captured piece, if any.
   * @param {string} [move.promotion] - Promotion piece type ('q', 'r', 'b', 'n').
   * @returns {Piece|null} The captured piece, if any, or null.
   */
  makeMove (move) {
    let captured = this._resolveCapturedPiece(move)

    this.toggleBitboard(move.piece, move.from)
    if (captured) {
      this.toggleBitboard(captured, move.to)
    }

    if (!move.piece) {
      console.error('Board.makeMove: move.piece is null!', move)
      return null
    }

    this._toggleMovedPiece(move)

    captured = this._handleEnPassant(move, captured)
    this._handleCastling(move)

    return captured
  }

  unmakeMove (move, captured) {
    if (!move.piece) {
      console.error('Board.unmakeMove: move.piece is null!', move)
      return
    }

    this._toggleMovedPiece(move)
    this.toggleBitboard(move.piece, move.from)

    if (captured && move.flags !== 'e' && move.flags !== 'ep') {
      this.toggleBitboard(captured, move.to)
    }

    this._handleEnPassant(move, captured)
    this._handleCastling(move)
  }

  _resolveCapturedPiece (move) {
    let captured = move.captured
    if (!captured && move.flags !== 'e' && move.flags !== 'ep') {
      captured = this.getPiece(move.to)
    }
    return captured
  }

  _toggleMovedPiece (move) {
    const pieceType = move.promotion ? ({ q: 'queen', r: 'rook', b: 'bishop', n: 'knight' }[move.promotion]) : move.piece.type
    const color = move.piece.color
    const { row: toRow, col: toCol } = this.toRowCol(move.to)
    const bbRank = 7 - toRow
    const bbSq = bbRank * 8 + toCol
    const toBit = 1n << BigInt(bbSq)
    this.bitboards[color] ^= toBit
    this.bitboards[pieceType] ^= toBit
  }

  _handleEnPassant (move, captured) {
    if (move.flags === 'e' || move.flags === 'ep') {
      const isWhite = move.piece.color === 'white'
      const captureSq = isWhite ? move.to + 16 : move.to - 16
      const capturedPawn = new Piece(isWhite ? 'black' : 'white', 'pawn')
      this.toggleBitboard(capturedPawn, captureSq)
      return capturedPawn
    }
    return captured
  }

  _handleCastling (move) {
    if (['k', 'q', 'k960', 'q960'].includes(move.flags)) {
      if (move.flags.endsWith('960')) {
        this._handle960Castling(move)
      } else {
        this._handleStandardCastling(move)
      }
    }
  }

  _handle960Castling (move) {
    const rookSource = move.rookSource
    const isKingside = move.flags === 'k960'
    const rank = move.piece.color === 'white' ? 7 : 0
    const rookTargetFile = isKingside ? 5 : 3
    const rookTarget = (rank << 4) | rookTargetFile
    const rook = new Piece(move.piece.color, 'rook')
    this.toggleBitboard(rook, rookSource)
    this.toggleBitboard(rook, rookTarget)
  }

  _handleStandardCastling (move) {
    if (move.piece.color === 'white') {
      const rook = new Piece('white', 'rook')
      if (move.flags === 'k') {
        this.toggleBitboard(rook, 119)
        this.toggleBitboard(rook, 117)
      } else {
        this.toggleBitboard(rook, 112)
        this.toggleBitboard(rook, 115)
      }
    } else {
      const rook = new Piece('black', 'rook')
      if (move.flags === 'k') {
        this.toggleBitboard(rook, 7)
        this.toggleBitboard(rook, 5)
      } else {
        this.toggleBitboard(rook, 0)
        this.toggleBitboard(rook, 3)
      }
    }
  }

  setupBoard () {
    const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    this.loadFen(START_FEN)
  }

  getKingIndex (kingColor) {
    // Optimized using bitboards
    const kingBB = this.bitboards.king & this.bitboards[kingColor]
    if (kingBB === 0n) return -1
    const sq64 = Bitboard.lsb(kingBB)
    // Convert 64 to 0x88
    const row = 7 - Math.floor(sq64 / 8)
    const col = sq64 % 8
    return (row << 4) | col
  }

  /**
   * Checks if the king of the specified color is in check.
   * @param {string} kingColor - 'white' or 'black'.
   * @returns {boolean} True if the king is in check.
   */
  isKingInCheck (kingColor) {
    const opponentColor = kingColor === 'white' ? 'black' : 'white'
    const kingIndex = this.getKingIndex(kingColor)
    if (kingIndex === -1) {
      return false
    }
    return this.isSquareAttacked(kingIndex, opponentColor)
  }

  isInCheck () {
    const kingColor = this.activeColor === 'w' ? 'white' : 'black'
    return this.isKingInCheck(kingColor)
  }

  isSquareAttacked (squareIndex, attackingSide) {
    if (!this.isValidSquare(squareIndex)) return false

    const { row, col } = this.toRowCol(squareIndex)
    const bbRank = 7 - row
    const bbSq = bbRank * 8 + col

    const occupancy = this.bitboards.white | this.bitboards.black

    if (this._isAttackedByKnight(bbSq, attackingSide)) return true
    if (this._isAttackedByPawn(bbRank, col, bbSq, attackingSide)) return true
    if (this._isAttackedByKing(bbSq, attackingSide)) return true
    if (this._isAttackedBySlider(bbSq, occupancy, attackingSide)) return true

    return false
  }

  _isAttackedByKnight (bbSq, attackingSide) {
    const knights = this.bitboards.knight & this.bitboards[attackingSide]
    return (Bitboard.getKnightAttacks(bbSq) & knights) !== 0n
  }

  _isAttackedByPawn (bbRank, col, bbSq, attackingSide) {
    if (attackingSide === 'white') {
      const whitePawns = this.bitboards.pawn & this.bitboards.white
      if (bbRank > 0) {
        if (col > 0 && ((whitePawns >> BigInt(bbSq - 9)) & 1n)) return true
        if (col < 7 && ((whitePawns >> BigInt(bbSq - 7)) & 1n)) return true
      }
    } else {
      const blackPawns = this.bitboards.pawn & this.bitboards.black
      if (bbRank < 7) {
        if (col > 0 && ((blackPawns >> BigInt(bbSq + 7)) & 1n)) return true
        if (col < 7 && ((blackPawns >> BigInt(bbSq + 9)) & 1n)) return true
      }
    }
    return false
  }

  _isAttackedByKing (bbSq, attackingSide) {
    const king = this.bitboards.king & this.bitboards[attackingSide]
    return (Bitboard.getKingAttacks(bbSq) & king) !== 0n
  }

  _isAttackedBySlider (bbSq, occupancy, attackingSide) {
    const rq = (this.bitboards.rook | this.bitboards.queen) & this.bitboards[attackingSide]
    if ((Bitboard.getRookAttacks(bbSq, occupancy) & rq) !== 0n) return true

    const bq = (this.bitboards.bishop | this.bitboards.queen) & this.bitboards[attackingSide]
    if ((Bitboard.getBishopAttacks(bbSq, occupancy) & bq) !== 0n) return true
    return false
  }

  /**
   * Generates all legal moves for the active side.
   * @returns {Array<Object>} An array of legal move objects.
   */
  generateMoves () {
    return MoveGenerator.generateMoves(this)
  }

  /**
   * Loads a game state from a FEN string.
   * @param {string} fen - The FEN string to load.
   * @throws {Error} If the FEN string is invalid.
   */
  loadFen (fen) {
    FenParser.loadFen(this, fen)
  }

  calculateZobristKey () {
    let key = 0n;
    // Iterate pieces using bitboards instead of squares array
    // colors
    ['white', 'black'].forEach(c => {
      ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'].forEach(t => {
        let bb = this.bitboards[c] & this.bitboards[t]
        while (bb) {
          const sq64 = Bitboard.lsb(bb)
          const row = 7 - Math.floor(sq64 / 8)
          const col = sq64 % 8
          const idx = (row << 4) | col

          const { c: cIdx, t: tIdx } = Zobrist.getPieceIndex(c, t)
          key ^= Zobrist.pieces[cIdx][tIdx][idx]

          bb &= (bb - 1n)
        }
      })
    })

    if (this.activeColor === 'b') key ^= Zobrist.sideToMove
    key ^= this.getCastlingHash(this.castlingRights)
    const epIndex = Zobrist.getEpIndex(this.enPassantTarget)
    if (epIndex !== -1) key ^= Zobrist.enPassant[epIndex]
    this.zobristKey = key
  }

  getCastlingHash (rights) {
    if (rights === '-') return 0n
    let hash = 0n
    for (const char of rights) {
      if (char === 'K') hash ^= Zobrist.castling[0][7]
      else if (char === 'Q') hash ^= Zobrist.castling[0][0]
      else if (char === 'k') hash ^= Zobrist.castling[1][7]
      else if (char === 'q') hash ^= Zobrist.castling[1][0]
      else {
        const code = char.charCodeAt(0)
        if (code >= 65 && code <= 72) hash ^= Zobrist.castling[0][code - 65]
        else if (code >= 97 && code <= 104) hash ^= Zobrist.castling[1][code - 97]
      }
    }
    return hash
  }

  /**
   * Applies a move to the board, updating all state (Zobrist, history, etc.).
   * @param {Object} move - The move to apply.
   * @returns {Object} A state object containing previous state values for undoing.
   */
  applyMove (move) {
    const state = this._createUndoState()

    if (!move.piece) {
      console.error('Board.applyMove: move.piece is null!', move)
      throw new Error('Board.applyMove: move.piece is null')
    }

    const capturedPiece = this._getCapturedForZobrist(move)
    this._updateZobristPieceMoves(move, capturedPiece)

    this.zobristKey ^= Zobrist.sideToMove
    this.zobristKey ^= this.getCastlingHash(this.castlingRights)
    const oldEpIndex = Zobrist.getEpIndex(this.enPassantTarget)
    if (oldEpIndex !== -1) this.zobristKey ^= Zobrist.enPassant[oldEpIndex]

    const madeCapturedPiece = this.makeMove(move)
    state.capturedPiece = madeCapturedPiece

    this.activeColor = this.activeColor === 'w' ? 'b' : 'w'
    this.updateCastlingRights(move, madeCapturedPiece)
    this.zobristKey ^= this.getCastlingHash(this.castlingRights)

    this.updateEnPassant(move)
    const newEpIndex = Zobrist.getEpIndex(this.enPassantTarget)
    if (newEpIndex !== -1) this.zobristKey ^= Zobrist.enPassant[newEpIndex]

    this._updateClocks(move, madeCapturedPiece)

    this.history.push(this.zobristKey)
    return state
  }

  _createUndoState () {
    return {
      activeColor: this.activeColor,
      castlingRights: this.castlingRights,
      enPassantTarget: this.enPassantTarget,
      halfMoveClock: this.halfMoveClock,
      fullMoveNumber: this.fullMoveNumber,
      zobristKey: this.zobristKey,
      capturedPiece: null
    }
  }

  _getCapturedForZobrist (move) {
    return move.captured || ((move.flags !== 'e' && move.flags !== 'ep') ? this.getPiece(move.to) : null)
  }

  _updateZobristPieceMoves (move, capturedPiece) {
    const { c, t } = Zobrist.getPieceIndex(move.piece.color, move.piece.type)
    this.zobristKey ^= Zobrist.pieces[c][t][move.from]

    if (capturedPiece) {
      const capIdx = Zobrist.getPieceIndex(capturedPiece.color, capturedPiece.type)
      this.zobristKey ^= Zobrist.pieces[capIdx.c][capIdx.t][move.to]
    } else if (move.flags === 'e' || move.flags === 'ep') {
      const isWhite = move.piece.color === 'white'
      const captureSq = isWhite ? move.to + 16 : move.to - 16
      const capColor = isWhite ? 'black' : 'white'
      const capIdx = Zobrist.getPieceIndex(capColor, 'pawn')
      this.zobristKey ^= Zobrist.pieces[capIdx.c][capIdx.t][captureSq]
    }

    if (move.promotion) {
      const promoType = { q: 'queen', r: 'rook', b: 'bishop', n: 'knight' }[move.promotion]
      const promoIdx = Zobrist.getPieceIndex(move.piece.color, promoType)
      this.zobristKey ^= Zobrist.pieces[promoIdx.c][promoIdx.t][move.to]
    } else {
      this.zobristKey ^= Zobrist.pieces[c][t][move.to]
    }

    if (move.flags === 'k' || move.flags === 'q') {
      this._updateZobristCastlingRook(move)
    }
  }

  _updateZobristCastlingRook (move) {
    if (move.piece.color === 'white') {
      const rookIdx = Zobrist.getPieceIndex('white', 'rook')
      if (move.flags === 'k') {
        this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][119]
        this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][117]
      } else {
        this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][112]
        this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][115]
      }
    } else {
      const rookIdx = Zobrist.getPieceIndex('black', 'rook')
      if (move.flags === 'k') {
        this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][7]
        this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][5]
      } else {
        this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][0]
        this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][3]
      }
    }
  }

  _updateClocks (move, captured) {
    this.halfMoveClock++
    if (move.piece.type === 'pawn' || captured) this.halfMoveClock = 0
    if (this.activeColor === 'w') this.fullMoveNumber++
  }

  makeNullMove () {
    const state = {
      activeColor: this.activeColor,
      castlingRights: this.castlingRights,
      enPassantTarget: this.enPassantTarget,
      halfMoveClock: this.halfMoveClock,
      fullMoveNumber: this.fullMoveNumber,
      zobristKey: this.zobristKey,
      capturedPiece: null
    }
    this.zobristKey ^= Zobrist.sideToMove
    const oldEpIndex = Zobrist.getEpIndex(this.enPassantTarget)
    if (oldEpIndex !== -1) this.zobristKey ^= Zobrist.enPassant[oldEpIndex]
    this.enPassantTarget = '-'
    this.activeColor = this.activeColor === 'w' ? 'b' : 'w'
    this.halfMoveClock++
    return state
  }

  undoNullMove (state) {
    this.activeColor = state.activeColor
    this.castlingRights = state.castlingRights
    this.enPassantTarget = state.enPassantTarget
    this.halfMoveClock = state.halfMoveClock
    this.fullMoveNumber = state.fullMoveNumber
    this.zobristKey = state.zobristKey
  }

  undoApplyMove (move, state) {
    this.unmakeMove(move, state.capturedPiece)
    this.activeColor = state.activeColor
    this.castlingRights = state.castlingRights
    this.enPassantTarget = state.enPassantTarget
    this.halfMoveClock = state.halfMoveClock
    this.fullMoveNumber = state.fullMoveNumber
    this.zobristKey = state.zobristKey
    this.history.pop()
  }

  updateCastlingRights (move, capturedPiece) {
    if (this.castlingRights === '-') return
    const removeRight = (char) => {
      this.castlingRights = this.castlingRights.replace(char, '')
      if (this.castlingRights === '') this.castlingRights = '-'
    }

    if (move.piece.type === 'king') {
      if (move.piece.color === 'white') {
        removeRight('K'); removeRight('Q')
      } else {
        removeRight('k'); removeRight('q')
      }
    }
    if (move.piece.type === 'rook') {
      if (move.from === 119) removeRight('K')
      else if (move.from === 112) removeRight('Q')
      else if (move.from === 7) removeRight('k')
      else if (move.from === 0) removeRight('q')
    }
    if (capturedPiece && capturedPiece.type === 'rook') {
      if (move.to === 119) removeRight('K')
      else if (move.to === 112) removeRight('Q')
      else if (move.to === 7) removeRight('k')
      else if (move.to === 0) removeRight('q')
    }
  }

  updateEnPassant (move) {
    if (move.piece.type === 'pawn') {
      const diff = Math.abs(move.to - move.from)
      if (diff === 32) {
        const isWhite = move.piece.color === 'white'
        const epIndex = isWhite ? move.from - 16 : move.from + 16
        const { row, col } = this.toRowCol(epIndex)
        const file = String.fromCharCode('a'.charCodeAt(0) + col)
        const rank = 8 - row
        this.enPassantTarget = `${file}${rank}`
        return
      }
    }
    this.enPassantTarget = '-'
  }

  isDrawBy50Moves () {
    return this.halfMoveClock >= 100
  }

  isDrawByRepetition () {
    let count = 0
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.history[i] === this.zobristKey) {
        count++
      }
    }
    return count >= 2
  }

  perft (depth) {
    trace(`perft(depth: ${depth})`)
    if (depth === 0) return 1
    const moves = this.generateMoves()
    trace(`perft(depth: ${depth}, moves: ${moves.length})`)
    let nodes = 0
    for (const move of moves) {
      const state = this.applyMove(move)
      nodes += this.perft(depth - 1)
      this.undoApplyMove(move, state)
    }
    return nodes
  }

  applyAlgebraicMove (moveStr) {
    // Try SAN first
    const moves = this.generateMoves()
    for (const move of moves) {
      const san = this.moveToSan(move, moves)
      if (san === moveStr) {
        this.applyMove(move)
        return move
      }
    }

    // Fallback to LAN
    const fromStr = moveStr.slice(0, 2)
    const toStr = moveStr.slice(2, 4)
    const promotionChar = moveStr.length > 4 ? moveStr[4] : null

    const from = this.algebraicToIndex(fromStr)
    const to = this.algebraicToIndex(toStr)

    const move = moves.find(m => {
      return m.from === from && m.to === to &&
            (!promotionChar || m.promotion === promotionChar)
    })

    if (move) {
      this.applyMove(move)
      return move
    }

    throw new Error(`Illegal move: ${moveStr}`)
  }

  moveToSan (move, moves) {
    if (move.flags === 'k' || move.flags === 'k960') {
      return 'O-O'
    }
    if (move.flags === 'q' || move.flags === 'q960') {
      return 'O-O-O'
    }
    // This is a simplified SAN generator. A full one is more complex.
    const piece = move.piece
    const toAlg = this.moveToString(move).slice(2, 4)

    if (piece.type === 'pawn') {
      if (move.captured) {
        const fromAlg = this.moveToString(move).slice(0, 1)
        return `${fromAlg}x${toAlg}`
      }
      return toAlg
    }

    const pieceChar = piece.type.toUpperCase().replace('KNIGHT', 'N').charAt(0)
    let san = `${pieceChar}${toAlg}`

    // Basic disambiguation - if multiple pieces of the same type can move to the same square
    const ambiguousMoves = moves.filter(m =>
      m.piece.type === piece.type &&
        m.to === move.to &&
        m.from !== move.from
    )

    if (ambiguousMoves.length > 0) {
      const fromAlg = this.moveToString(move)
      const fromFile = fromAlg.charAt(0)
      const fromRank = fromAlg.charAt(1)

      const fileCollision = ambiguousMoves.some(m => (this.moveToString(m).charAt(0) === fromFile))
      const rankCollision = ambiguousMoves.some(m => (this.moveToString(m).charAt(1) === fromRank))

      if (fileCollision && rankCollision) {
        san = `${pieceChar}${fromAlg.slice(0, 2)}${toAlg}`
      } else if (fileCollision) {
        san = `${pieceChar}${fromRank}${toAlg}`
      } else {
        san = `${pieceChar}${fromFile}${toAlg}`
      }
    }

    if (move.captured) {
      san = san.replace(toAlg, `x${toAlg}`)
    }

    // Check for check/checkmate is omitted for simplicity for now
    return san
  }

  moveToString (move) {
    const { row: fromRow, col: fromCol } = this.toRowCol(move.from)
    const { row: toRow, col: toCol } = this.toRowCol(move.to)
    const fromAlg = `${String.fromCharCode('a'.charCodeAt(0) + fromCol)}${8 - fromRow}`
    const toAlg = `${String.fromCharCode('a'.charCodeAt(0) + toCol)}${8 - toRow}`
    const promo = move.promotion ? move.promotion : ''
    return `${fromAlg}${toAlg}${promo}`
  }

  generateFen () {
    return FenParser.generateFen(this)
  }

  clone () {
    const newBoard = new Board()
    // No squares to clone
    newBoard.activeColor = this.activeColor
    newBoard.castlingRights = this.castlingRights
    newBoard.enPassantTarget = this.enPassantTarget
    newBoard.halfMoveClock = this.halfMoveClock
    newBoard.fullMoveNumber = this.fullMoveNumber
    newBoard.zobristKey = this.zobristKey
    newBoard.history = [...this.history]
    newBoard.castling = {
      w: { ...this.castling.w },
      b: { ...this.castling.b }
    }
    newBoard.castlingRooks = {
      white: [...this.castlingRooks.white],
      black: [...this.castlingRooks.black]
    }
    newBoard.isChess960 = this.isChess960
    newBoard.bitboards = { ...this.bitboards }
    return newBoard
  }
}

module.exports = Board
