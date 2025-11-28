const Piece = require('./Piece')
const Zobrist = require('./Zobrist')
const Bitboard = require('./Bitboard')
const trace = require('./trace')
const FenParser = require('./FenParser')
const MoveGenerator = require('./MoveGenerator')
const PerftTT = require('./PerftTT')

class Board {
  constructor () {
    this.activeColor = 'w'
    this.castlingRights = 'KQkq'
    this.enPassantTarget = '-'
    this.halfMoveClock = 0
    this.fullMoveNumber = 1
    this.zobristKey = 0n
    this.history = []
    this.castling = { w: { k: false, q: false }, b: { k: false, q: false } }
    this.castlingRooks = { white: [], black: [] }
    this.isChess960 = false

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

  getPiece (index, col) {
    if (col !== undefined) {
      index = this.toIndex(index, col)
    }
    if (!this.isValidSquare(index)) return null
    const sq64 = Bitboard.to64(index)
    const mask = 1n << BigInt(sq64)

    if (!((this.bitboards.white | this.bitboards.black) & mask)) return null

    const color = (this.bitboards.white & mask) ? 'white' : 'black'

    const types = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']
    for (const type of types) {
      if (this.bitboards[type] & mask) return new Piece(color, type)
    }

    return null
  }

  placePiece (row, col, piece) {
    const index = this.toIndex(row, col)
    if (this.isValidSquare(index)) {
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

  placePieceBitboard (move) {
    const pieceType = move.promotion ? ({ q: 'queen', r: 'rook', b: 'bishop', n: 'knight' }[move.promotion]) : move.piece.type
    const color = move.piece.color

    const { row: toRow, col: toCol } = this.toRowCol(move.to)
    const bbRank = 7 - toRow
    const bbSq = bbRank * 8 + toCol
    const toBit = 1n << BigInt(bbSq)

    this.bitboards[color] |= toBit
    this.bitboards[pieceType] |= toBit
  }

  handleMakeMoveEnPassant (move) {
    const isWhite = move.piece.color === 'white'
    const captureSq = isWhite ? move.to + 16 : move.to - 16
    const capturedPawn = new Piece(isWhite ? 'black' : 'white', 'pawn')
    this.toggleBitboard(capturedPawn, captureSq)
    return capturedPawn
  }

  handleMakeMoveCastling (move) {
    if (move.flags === 'k960' || move.flags === 'q960') {
      this._handleMakeMoveCastling960(move)
    } else {
      this._handleMakeMoveCastlingStandard(move)
    }
  }

  _handleMakeMoveCastling960 (move) {
    const rookSource = move.rookSource
    const isKingside = move.flags === 'k960'
    const rank = move.piece.color === 'white' ? 7 : 0
    const rookTargetFile = isKingside ? 5 : 3
    const rookTarget = (rank << 4) | rookTargetFile

    const rook = new Piece(move.piece.color, 'rook')
    this.toggleBitboard(rook, rookSource)
    this.toggleBitboard(rook, rookTarget)
  }

  _handleMakeMoveCastlingStandard (move) {
    const isWhite = move.piece.color === 'white'
    const rook = new Piece(isWhite ? 'white' : 'black', 'rook')
    const kStart = isWhite ? 119 : 7
    const kEnd = isWhite ? 117 : 5
    const qStart = isWhite ? 112 : 0
    const qEnd = isWhite ? 115 : 3

    if (move.flags === 'k') {
      this.toggleBitboard(rook, kStart)
      this.toggleBitboard(rook, kEnd)
    } else {
      this.toggleBitboard(rook, qStart)
      this.toggleBitboard(rook, qEnd)
    }
  }

  makeMove (move) {
    let captured = move.captured
    if (!captured && move.flags !== 'e' && move.flags !== 'ep') {
      captured = this.getPiece(move.to)
    }

    this.toggleBitboard(move.piece, move.from)
    if (captured) {
      this.toggleBitboard(captured, move.to)
    }

    if (!move.piece) {
      console.error('Board.makeMove: move.piece is null!', move)
      return null
    }

    this.placePieceBitboard(move)

    if (move.flags === 'e' || move.flags === 'ep') {
      captured = this.handleMakeMoveEnPassant(move)
    }

    if (['k', 'q', 'k960', 'q960'].includes(move.flags)) {
      this.handleMakeMoveCastling(move)
    }
    return captured
  }

  handleUnmakeMoveEnPassant (move, captured) {
    const isWhite = move.piece.color === 'white'
    const captureSq = isWhite ? move.to + 16 : move.to - 16
    this.toggleBitboard(captured, captureSq)
  }

  handleUnmakeMoveCastling (move) {
    if (move.flags === 'k960' || move.flags === 'q960') {
      this._handleUnmakeMoveCastling960(move)
    } else {
      this._handleUnmakeMoveCastlingStandard(move)
    }
  }

  _handleUnmakeMoveCastling960 (move) {
    const rookSource = move.rookSource
    const isKingside = move.flags === 'k960'
    const rank = move.piece.color === 'white' ? 7 : 0
    const rookTargetFile = isKingside ? 5 : 3
    const rookTarget = (rank << 4) | rookTargetFile

    const rook = new Piece(move.piece.color, 'rook')
    this.toggleBitboard(rook, rookTarget)
    this.toggleBitboard(rook, rookSource)
  }

  _handleUnmakeMoveCastlingStandard (move) {
    const isWhite = move.piece.color === 'white'
    const rook = new Piece(isWhite ? 'white' : 'black', 'rook')
    const kStart = isWhite ? 117 : 5
    const kEnd = isWhite ? 119 : 7
    const qStart = isWhite ? 115 : 3
    const qEnd = isWhite ? 112 : 0

    if (move.flags === 'k') {
      this.toggleBitboard(rook, kStart)
      this.toggleBitboard(rook, kEnd)
    } else {
      this.toggleBitboard(rook, qStart)
      this.toggleBitboard(rook, qEnd)
    }
  }

  unmakeMove (move, captured) {
    if (!move.piece) {
      console.error('Board.unmakeMove: move.piece is null!', move)
      return
    }

    const pieceType = move.promotion ? ({ q: 'queen', r: 'rook', b: 'bishop', n: 'knight' }[move.promotion]) : move.piece.type
    const color = move.piece.color

    const { row: toRow, col: toCol } = this.toRowCol(move.to)
    const bbRank = 7 - toRow
    const bbSq = bbRank * 8 + toCol
    const toBit = 1n << BigInt(bbSq)

    this.bitboards[color] ^= toBit
    this.bitboards[pieceType] ^= toBit

    this.toggleBitboard(move.piece, move.from)

    if (captured && move.flags !== 'e' && move.flags !== 'ep') {
      this.toggleBitboard(captured, move.to)
    }

    if (move.flags === 'e' || move.flags === 'ep') {
      this.handleUnmakeMoveEnPassant(move, captured)
    }

    if (['k', 'q', 'k960', 'q960'].includes(move.flags)) {
      this.handleUnmakeMoveCastling(move)
    }
  }

  setupBoard () {
    const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    this.loadFen(START_FEN)
  }

  getKingIndex (kingColor) {
    const kingBB = this.bitboards.king & this.bitboards[kingColor]
    if (kingBB === 0n) return -1
    const sq64 = Bitboard.lsb(kingBB)
    const row = 7 - Math.floor(sq64 / 8)
    const col = sq64 % 8
    return (row << 4) | col
  }

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

  checkPawnAttacks (bbSq, bbRank, col, attackingSide) {
    if (attackingSide === 'white') {
      return this._checkWhitePawnAttacks(bbSq, bbRank, col)
    } else {
      return this._checkBlackPawnAttacks(bbSq, bbRank, col)
    }
  }

  _checkWhitePawnAttacks (bbSq, bbRank, col) {
    const whitePawns = this.bitboards.pawn & this.bitboards.white
    if (bbRank > 0) {
      if (col > 0 && ((whitePawns >> BigInt(bbSq - 9)) & 1n)) return true
      if (col < 7 && ((whitePawns >> BigInt(bbSq - 7)) & 1n)) return true
    }
    return false
  }

  _checkBlackPawnAttacks (bbSq, bbRank, col) {
    const blackPawns = this.bitboards.pawn & this.bitboards.black
    if (bbRank < 7) {
      if (col > 0 && ((blackPawns >> BigInt(bbSq + 7)) & 1n)) return true
      if (col < 7 && ((blackPawns >> BigInt(bbSq + 9)) & 1n)) return true
    }
    return false
  }

  isSquareAttacked (squareIndex, attackingSide) {
    if (!this.isValidSquare(squareIndex)) return false

    const { row, col } = this.toRowCol(squareIndex)
    const bbRank = 7 - row
    const bbSq = bbRank * 8 + col

    const knights = this.bitboards.knight & this.bitboards[attackingSide]
    if ((Bitboard.getKnightAttacks(bbSq) & knights) !== 0n) return true

    if (this.checkPawnAttacks(bbSq, bbRank, col, attackingSide)) return true

    const king = this.bitboards.king & this.bitboards[attackingSide]
    if ((Bitboard.getKingAttacks(bbSq) & king) !== 0n) return true

    const occupancy = this.bitboards.white | this.bitboards.black
    const rq = (this.bitboards.rook | this.bitboards.queen) & this.bitboards[attackingSide]
    if ((Bitboard.getRookAttacks(bbSq, occupancy) & rq) !== 0n) return true

    const bq = (this.bitboards.bishop | this.bitboards.queen) & this.bitboards[attackingSide]
    if ((Bitboard.getBishopAttacks(bbSq, occupancy) & bq) !== 0n) return true

    return false
  }

  generateMoves () {
    return MoveGenerator.generateMoves(this)
  }

  loadFen (fen) {
    FenParser.loadFen(this, fen)
  }

  calculateZobristKey () {
    let key = 0n;
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
      hash ^= this._getRightsHash(char)
    }
    return hash
  }

  _getRightsHash (char) {
    if (char === 'K') return Zobrist.castling[0][7]
    else if (char === 'Q') return Zobrist.castling[0][0]
    else if (char === 'k') return Zobrist.castling[1][7]
    else if (char === 'q') return Zobrist.castling[1][0]
    else {
      const code = char.charCodeAt(0)
      if (code >= 65 && code <= 72) return Zobrist.castling[0][code - 65]
      else if (code >= 97 && code <= 104) return Zobrist.castling[1][code - 97]
    }
    return 0n
  }

  updateZobristForMove (move, capturedPiece) {
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
  }

  updateZobristCastling (move) {
    if (move.flags !== 'k' && move.flags !== 'q') return

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

  applyMove (move) {
    if (!move.piece) {
      console.error('Board.applyMove: move.piece is null!', move)
      throw new Error('Board.applyMove: move.piece is null')
    }

    const state = this._createState()
    const capturedPiece = move.captured || ((move.flags !== 'e' && move.flags !== 'ep') ? this.getPiece(move.to) : null)

    this._updateZobristBeforeMove(move, capturedPiece)

    const madeCapturedPiece = this.makeMove(move)
    state.capturedPiece = madeCapturedPiece

    this.activeColor = this.activeColor === 'w' ? 'b' : 'w'
    this.updateCastlingRights(move, madeCapturedPiece)
    this.zobristKey ^= this.getCastlingHash(this.castlingRights)

    this.updateEnPassant(move)
    this._updateZobristAfterMove()

    this._updateClocks(move, madeCapturedPiece)

    this.history.push(this.zobristKey)
    return state
  }

  _createState () {
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

  _updateZobristBeforeMove (move, capturedPiece) {
    this.updateZobristForMove(move, capturedPiece)
    this.updateZobristCastling(move)
    this.zobristKey ^= Zobrist.sideToMove
    this.zobristKey ^= this.getCastlingHash(this.castlingRights)
    const oldEpIndex = Zobrist.getEpIndex(this.enPassantTarget)
    if (oldEpIndex !== -1) this.zobristKey ^= Zobrist.enPassant[oldEpIndex]
  }

  _updateZobristAfterMove () {
    const newEpIndex = Zobrist.getEpIndex(this.enPassantTarget)
    if (newEpIndex !== -1) this.zobristKey ^= Zobrist.enPassant[newEpIndex]
  }

  _updateClocks (move, madeCapturedPiece) {
    this.halfMoveClock++
    if (move.piece.type === 'pawn' || madeCapturedPiece) this.halfMoveClock = 0
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

    const checkRook = (sq) => {
      if (sq === 119) removeRight('K')
      else if (sq === 112) removeRight('Q')
      else if (sq === 7) removeRight('k')
      else if (sq === 0) removeRight('q')
    }

    if (move.piece.type === 'rook') checkRook(move.from)
    if (capturedPiece && capturedPiece.type === 'rook') checkRook(move.to)
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

  perft (depth, tt = null) {
    trace(`perft(depth: ${depth})`)
    if (depth === 0) return 1

    if (!tt) {
      tt = new PerftTT(64)
    }

    const cached = tt.probe(this.zobristKey, depth)
    if (cached !== null) {
      return Number(cached)
    }

    const moves = this.generateMoves()

    if (depth === 1) {
      const count = moves.length
      tt.save(this.zobristKey, depth, count)
      return count
    }

    trace(`perft(depth: ${depth}, moves: ${moves.length})`)
    let nodes = 0
    for (const move of moves) {
      const state = this.applyMove(move)
      nodes += this.perft(depth - 1, tt)
      this.undoApplyMove(move, state)
    }

    tt.save(this.zobristKey, depth, nodes)
    return nodes
  }

  applyAlgebraicMove (moveStr) {
    const moves = this.generateMoves()
    for (const move of moves) {
      const san = this.moveToSan(move, moves)
      if (san === moveStr) {
        this.applyMove(move)
        return move
      }
    }

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

  disambiguateMove (move, moves, piece, toAlg) {
    const pieceChar = piece.type.toUpperCase().replace('KNIGHT', 'N').charAt(0)
    let san = `${pieceChar}${toAlg}`

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
    return san
  }

  moveToSan (move, moves) {
    if (move.flags === 'k' || move.flags === 'k960') return 'O-O'
    if (move.flags === 'q' || move.flags === 'q960') return 'O-O-O'

    const piece = move.piece
    const toAlg = this.moveToString(move).slice(2, 4)

    if (piece.type === 'pawn') {
      if (move.captured) {
        const fromAlg = this.moveToString(move).slice(0, 1)
        return `${fromAlg}x${toAlg}`
      }
      return toAlg
    }

    let san = this.disambiguateMove(move, moves, piece, toAlg)

    if (move.captured) {
      san = san.replace(toAlg, `x${toAlg}`)
    }

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
