const fs = require('fs')
const path = require('path')
const PawnHash = require('./PawnHash')
const Bitboard = require('./Bitboard')

// Pawn Hash Global Instance
const pawnHash = new PawnHash(16) // 16MB default

// Piece values (centi-pawns)
const PIECE_VALUES = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000
}

/**
 * Tunable evaluation parameters.
 * These can be overridden by tuned_evaluation_params.json.
 */
const PARAMS = {
  DoubledPawnPenalty: 10,
  IsolatedPawnPenalty: 15,
  BackwardPawnPenalty: 10,
  KnightMobilityBonus: 1,
  BishopMobilityBonus: 2,
  RookMobilityBonus: 2,
  QueenMobilityBonus: 3,
  ShieldBonus: 5,
  KnightOutpostBonus: 20,
  BishopOutpostBonus: 10
}

// PSTs (same as before)
const PAWN_PST = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // Rank 8 (Promoted)
  50, 50, 50, 50, 50, 50, 50, 50, 0, 0, 0, 0, 0, 0, 0, 0, // Rank 7
  10, 10, 20, 30, 30, 20, 10, 10, 0, 0, 0, 0, 0, 0, 0, 0, // Rank 6
  5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, // Rank 5
  0, 0, 0, 20, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // Rank 4
  5, -5, -10, 0, 0, -10, -5, 5, 0, 0, 0, 0, 0, 0, 0, 0, // Rank 3
  5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0, // Rank 2
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 // Rank 1
]

const KNIGHT_PST = [
  -50, -40, -30, -30, -30, -30, -40, -50, 0, 0, 0, 0, 0, 0, 0, 0,
  -40, -20, 0, 0, 0, 0, -20, -40, 0, 0, 0, 0, 0, 0, 0, 0,
  -30, 0, 10, 15, 15, 10, 0, -30, 0, 0, 0, 0, 0, 0, 0, 0,
  -30, 5, 15, 20, 20, 15, 5, -30, 0, 0, 0, 0, 0, 0, 0, 0,
  -30, 0, 15, 20, 20, 15, 0, -30, 0, 0, 0, 0, 0, 0, 0, 0,
  -30, 5, 10, 15, 15, 10, 5, -30, 0, 0, 0, 0, 0, 0, 0, 0,
  -40, -20, 0, 5, 5, 0, -20, -40, 0, 0, 0, 0, 0, 0, 0, 0,
  -50, -40, -30, -30, -30, -30, -40, -50, 0, 0, 0, 0, 0, 0, 0, 0
]

const BISHOP_PST = [
  -20, -10, -10, -10, -10, -10, -10, -20, 0, 0, 0, 0, 0, 0, 0, 0,
  -10, 0, 0, 0, 0, 0, 0, -10, 0, 0, 0, 0, 0, 0, 0, 0,
  -10, 0, 5, 10, 10, 5, 0, -10, 0, 0, 0, 0, 0, 0, 0, 0,
  -10, 5, 5, 10, 10, 5, 5, -10, 0, 0, 0, 0, 0, 0, 0, 0,
  -10, 0, 10, 10, 10, 10, 0, -10, 0, 0, 0, 0, 0, 0, 0, 0,
  -10, 10, 10, 10, 10, 10, 10, -10, 0, 0, 0, 0, 0, 0, 0, 0,
  -10, 5, 0, 0, 0, 0, 5, -10, 0, 0, 0, 0, 0, 0, 0, 0,
  -20, -10, -10, -10, -10, -10, -10, -20, 0, 0, 0, 0, 0, 0, 0, 0
]

const ROOK_PST = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  5, 10, 10, 10, 10, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 0, 0, 0, 0, 0,
  -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 0, 0, 0, 0, 0,
  -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 0, 0, 0, 0, 0,
  -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 0, 0, 0, 0, 0,
  -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
]

const QUEEN_PST = [
  -20, -10, -10, -5, -5, -10, -10, -20, 0, 0, 0, 0, 0, 0, 0, 0,
  -10, 0, 0, 0, 0, 0, 0, -10, 0, 0, 0, 0, 0, 0, 0, 0,
  -10, 0, 5, 5, 5, 5, 0, -10, 0, 0, 0, 0, 0, 0, 0, 0,
  -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 5, 5, 5, 5, 0, -5, 0, 0, 0, 0, 0, 0, 0, 0,
  -10, 5, 5, 5, 5, 5, 0, -10, 0, 0, 0, 0, 0, 0, 0, 0,
  -10, 0, 5, 0, 0, 0, 0, -10, 0, 0, 0, 0, 0, 0, 0, 0,
  -20, -10, -10, -5, -5, -10, -10, -20, 0, 0, 0, 0, 0, 0, 0, 0
]

const KING_PST_MIDGAME = [
  -30, -40, -40, -50, -50, -40, -40, -30, 0, 0, 0, 0, 0, 0, 0, 0,
  -30, -40, -40, -50, -50, -40, -40, -30, 0, 0, 0, 0, 0, 0, 0, 0,
  -30, -40, -40, -50, -50, -40, -40, -30, 0, 0, 0, 0, 0, 0, 0, 0,
  -30, -40, -40, -50, -50, -40, -40, -30, 0, 0, 0, 0, 0, 0, 0, 0,
  -20, -30, -30, -40, -40, -30, -30, -20, 0, 0, 0, 0, 0, 0, 0, 0,
  -10, -20, -20, -20, -20, -20, -20, -10, 0, 0, 0, 0, 0, 0, 0, 0,
  20, 20, 0, 0, 0, 0, 20, 20, 0, 0, 0, 0, 0, 0, 0, 0,
  20, 30, 10, 0, 0, 10, 30, 20, 0, 0, 0, 0, 0, 0, 0, 0
]

const FILE_MASKS = [
  0x0101010101010101n, 0x0202020202020202n, 0x0404040404040404n, 0x0808080808080808n,
  0x1010101010101010n, 0x2020202020202020n, 0x4040404040404040n, 0x8080808080808080n
]

const RANK_MASKS = [
  0xFFn, 0xFF00n, 0xFF0000n, 0xFF000000n,
  0xFF00000000n, 0xFF0000000000n, 0xFF000000000000n, 0xFF00000000000000n
]

const PSTS = {
  pawn: PAWN_PST,
  knight: KNIGHT_PST,
  bishop: BISHOP_PST,
  rook: ROOK_PST,
  queen: QUEEN_PST,
  king: KING_PST_MIDGAME
}

class Evaluation {
  static {
    // Static initializer block to load tuned parameters
    try {
      const paramsPath = path.join(__dirname, '..', 'tuned_evaluation_params.json')
      const isTest = process.env.TEST_MODE === 'true' || process.env.NODE_ENV === 'test'
      if (!isTest && fs.existsSync(paramsPath)) {
        console.log('Loading tuned evaluation parameters...')
        const tunedParams = JSON.parse(fs.readFileSync(paramsPath, 'utf8'))
        for (const key in tunedParams) {
          this.updateParam(key, tunedParams[key])
        }
      }
    } catch (error) {
      console.error('Error loading tuned parameters, using defaults:', error)
    }
  }

  static isPassedPawn (board, squareIndex) {
    const piece = board.getPiece(squareIndex)
    if (!piece || piece.type !== 'pawn') {
      return false
    }

    const color = piece.color
    const opponentColor = color === 'white' ? 'black' : 'white'
    const sq64 = Bitboard.to64(squareIndex)
    const rank = Math.floor(sq64 / 8)
    const col = sq64 % 8

    let fileMask = FILE_MASKS[col]
    if (col > 0) {
      fileMask |= FILE_MASKS[col - 1]
    }
    if (col < 7) {
      fileMask |= FILE_MASKS[col + 1]
    }

    let rankMask = 0n
    if (color === 'white') {
      for (let r = rank + 1; r < 8; r++) {
        rankMask |= RANK_MASKS[r]
      }
    } else {
      for (let r = 0; r < rank; r++) {
        rankMask |= RANK_MASKS[r]
      }
    }

    const finalMask = fileMask & rankMask
    const opponentPawns = board.bitboards.pawn & board.bitboards[opponentColor]

    return (finalMask & opponentPawns) === 0n
  }

  /**
     * Statically evaluates the board state.
     * @param {Board} board - The board to evaluate.
     * @returns {number} The score in centipawns from the perspective of the side to move.
     */
  static evaluate (board) {
    let score = 0
    let whiteKingIndex = -1
    let blackKingIndex = -1

    const to0x88 = (sq64) => {
      const r = 7 - Math.floor(sq64 / 8)
      const c = sq64 % 8
      return (r << 4) | c
    }

    const colors = ['white', 'black']
    const types = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']

    for (const color of colors) {
      for (const type of types) {
        let bb = board.bitboards[type] & board.bitboards[color]
        while (bb) {
          const sq64 = Bitboard.lsb(bb)
          const i = to0x88(sq64)

          // Track kings for safety check
          if (type === 'king') {
            if (color === 'white') whiteKingIndex = i
            else blackKingIndex = i
          }

          const value = PIECE_VALUES[type]
          let pstValue = 0
          let mobility = 0

          if (['knight', 'bishop', 'rook', 'queen'].includes(type)) {
            mobility = Evaluation.evaluateMobility(board, i, type, color)
          }

          let pawnStructure = 0
          if (type === 'pawn') {
            pawnStructure = Evaluation.evaluatePawnStructure(board, i, color)
          }

          let outpostBonus = 0
          if (type === 'knight' || type === 'bishop') {
            outpostBonus = Evaluation.evaluateOutpost(board, i, type, color)
          }

          if (color === 'white') {
            pstValue = PSTS[type][i]
            score += (value + pstValue + pawnStructure + mobility + outpostBonus)
          } else {
            const row = i >> 4
            const col = i & 7
            const flippedIndex = ((7 - row) << 4) | col
            pstValue = PSTS[type][flippedIndex]
            score -= (value + pstValue + pawnStructure + mobility + outpostBonus)
          }

          bb &= (bb - 1n)
        }
      }
    }

    if (whiteKingIndex !== -1) {
      score += Evaluation.evaluateKingSafety(board, whiteKingIndex, 'white')
    }
    if (blackKingIndex !== -1) {
      score -= Evaluation.evaluateKingSafety(board, blackKingIndex, 'black')
    }

    return board.activeColor === 'w' ? score : -score
  }

  static evaluateOutpost (board, index, type, color) {
    if (type !== 'knight' && type !== 'bishop') return 0

    const sq64 = Bitboard.to64(index)
    const rank = Math.floor(sq64 / 8)
    const col = sq64 % 8

    const rankBonusMultiplier = Evaluation.getOutpostRankMultiplier(rank, color)
    if (rankBonusMultiplier === 0) return 0

    if (!Evaluation.isOutpostSupported(board, rank, col, color)) return 0
    if (Evaluation.isOutpostAttackable(board, rank, col, color)) return 0

    const baseBonus = type === 'knight' ? PARAMS.KnightOutpostBonus : PARAMS.BishopOutpostBonus
    return baseBonus * rankBonusMultiplier
  }

  static getOutpostRankMultiplier (rank, color) {
    if (color === 'white') {
      if (rank < 3 || rank > 5) return 0
      return (rank - 2)
    } else {
      if (rank < 2 || rank > 4) return 0
      return (5 - rank)
    }
  }

  static isOutpostSupported (board, rank, col, color) {
    const friendlyPawns = board.bitboards[color] & board.bitboards.pawn
    let supportMask = 0n

    if (color === 'white') {
      if (rank > 0) {
        if (col > 0) supportMask |= (1n << BigInt((rank - 1) * 8 + (col - 1)))
        if (col < 7) supportMask |= (1n << BigInt((rank - 1) * 8 + (col + 1)))
      }
    } else {
      if (rank < 7) {
        if (col > 0) supportMask |= (1n << BigInt((rank + 1) * 8 + (col - 1)))
        if (col < 7) supportMask |= (1n << BigInt((rank + 1) * 8 + (col + 1)))
      }
    }

    return (friendlyPawns & supportMask) !== 0n
  }

  static isOutpostAttackable (board, rank, col, color) {
    const opponent = color === 'white' ? 'black' : 'white'
    const enemyPawns = board.bitboards[opponent] & board.bitboards.pawn

    let attackMask = 0n
    const checkFiles = []
    if (col > 0) checkFiles.push(col - 1)
    if (col < 7) checkFiles.push(col + 1)

    for (const f of checkFiles) {
      if (color === 'white') {
        for (let r = rank + 1; r < 8; r++) {
          attackMask |= (1n << BigInt(r * 8 + f))
        }
      } else {
        for (let r = 0; r < rank; r++) {
          attackMask |= (1n << BigInt(r * 8 + f))
        }
      }
    }

    return (enemyPawns & attackMask) !== 0n
  }

  static updateParam (name, value) {
    const map = {
      PawnValue: 'pawn',
      KnightValue: 'knight',
      BishopValue: 'bishop',
      RookValue: 'rook',
      QueenValue: 'queen'
    }

    if (map[name] && PIECE_VALUES.hasOwnProperty(map[name])) {
      PIECE_VALUES[map[name]] = value
      return
    }

    if (PIECE_VALUES.hasOwnProperty(name)) {
      PIECE_VALUES[name] = value
    }

    if (PARAMS.hasOwnProperty(name)) {
      PARAMS[name] = value
    }
  }

  static getParams () {
    return { ...PIECE_VALUES, ...PARAMS }
  }

  static evaluatePawnStructure (board, index, color) {
    let score = 0
    const col = index & 7
    const row = index >> 4

    // Doubled Pawns
    score -= Evaluation.calcDoubledPawnPenalty(board, index, color)

    // Isolated Pawns
    const hasNeighbor = Evaluation.hasPawnNeighbor(board, col, color)
    if (!hasNeighbor) {
      score -= PARAMS.IsolatedPawnPenalty
    } else {
      // Backward Pawns
      score -= Evaluation.calcBackwardPawnPenalty(board, index, col, row, color)
    }

    // Passed Pawn
    score += Evaluation.calcPassedPawnBonus(board, index, col, row, color)

    return score
  }

  static calcDoubledPawnPenalty (board, index, color) {
    const forward = color === 'white' ? -16 : 16
    const frontSq = index + forward
    const frontPiece = board.getPiece(frontSq)
    if (frontPiece && frontPiece.type === 'pawn' && frontPiece.color === color) {
      return PARAMS.DoubledPawnPenalty
    }
    return 0
  }

  static hasPawnNeighbor (board, col, color) {
    const files = [col - 1, col + 1]
    for (const f of files) {
      if (f >= 0 && f <= 7) {
        for (let r = 0; r < 8; r++) {
          const idx = (r << 4) | f
          const p = board.getPiece(idx)
          if (p && p.type === 'pawn' && p.color === color) {
            return true
          }
        }
      }
    }
    return false
  }

  static calcBackwardPawnPenalty (board, index, col, row, color) {
    const files = [col - 1, col + 1]
    let isBehindAllNeighbors = true
    for (const f of files) {
      if (f >= 0 && f <= 7) {
        for (let r = 0; r < 8; r++) { // scan file
          const idx = (r << 4) | f
          const p = board.getPiece(idx)
          if (p && p.type === 'pawn' && p.color === color) {
            if (color === 'white') {
              if (r > row) isBehindAllNeighbors = false
            } else {
              if (r < row) isBehindAllNeighbors = false
            }
          }
        }
      }
    }
    return isBehindAllNeighbors ? PARAMS.BackwardPawnPenalty : 0
  }

  static calcPassedPawnBonus (board, index, col, row, color) {
    if (Evaluation._isPassedPawnInternal(board, col, row, color)) {
      return Evaluation.getPassedBonus(row, color)
    }
    return 0
  }

  static isPassedPawn (board, index) {
    const piece = board.getPiece(index)
    if (!piece || piece.type !== 'pawn') return false
    const color = piece.color
    const col = index & 7
    const row = index >> 4
    return Evaluation._isPassedPawnInternal(board, col, row, color)
  }

  static _isPassedPawnInternal (board, col, row, color) {
    const enemyColor = color === 'white' ? 'black' : 'white'
    const checkFiles = [col - 1, col, col + 1]
    const startRow = color === 'white' ? 0 : row + 1
    const endRow = color === 'white' ? row - 1 : 7

    for (const f of checkFiles) {
      if (f < 0 || f > 7) continue
      if (Evaluation.fileHasEnemyPawn(board, f, startRow, endRow, enemyColor)) return false
    }
    return true
  }

  static fileHasEnemyPawn (board, f, startRow, endRow, enemyColor) {
    if (startRow <= endRow) {
      for (let r = startRow; r <= endRow; r++) {
        const idx = (r << 4) | f
        const p = board.getPiece(idx)
        if (p && p.type === 'pawn' && p.color === enemyColor) {
          return true
        }
      }
    }
    return false
  }

  static getPassedBonus (row, color) {
    const PASSED_BONUS = [0, 0, 10, 20, 40, 80, 160, 0]
    let rankIdx = color === 'white' ? 7 - row : row
    if (rankIdx < 0) rankIdx = 0
    if (rankIdx > 7) rankIdx = 7
    return PASSED_BONUS[rankIdx]
  }

  static evaluateMobility (board, index, type, color) {
    const r = 7 - (index >> 4)
    const c = index & 7
    const sq = r * 8 + c
    if (sq < 0 || sq > 63) return 0

    const occupancy = board.bitboards.white | board.bitboards.black
    const friendlyPieces = board.bitboards[color]
    const opponent = color === 'white' ? 'black' : 'white'

    let attack_squares = 0n
    switch (type) {
      case 'knight':
        attack_squares = Bitboard.getKnightAttacks(sq)
        break
      case 'bishop':
        attack_squares = Bitboard.getBishopAttacks(sq, occupancy)
        break
      case 'rook':
        attack_squares = Bitboard.getRookAttacks(sq, occupancy)
        break
      case 'queen':
        attack_squares = Bitboard.getBishopAttacks(sq, occupancy) | Bitboard.getRookAttacks(sq, occupancy)
        break
    }

    attack_squares &= ~friendlyPieces

    let safe_squares_count = 0
    while (attack_squares) {
      const toSq = Bitboard.lsb(attack_squares)
      const bbRow = Math.floor(toSq / 8)
      const bbCol = toSq % 8
      const boardRow = 7 - bbRow
      const to0x88 = (boardRow << 4) | bbCol

      if (!board.isSquareAttacked(to0x88, opponent)) {
        safe_squares_count++
      }

      attack_squares &= (attack_squares - 1n)
    }

    const mobility = safe_squares_count
    switch (type) {
      case 'knight':
        return mobility * PARAMS.KnightMobilityBonus
      case 'bishop':
        return mobility * PARAMS.BishopMobilityBonus
      case 'rook':
        return mobility * PARAMS.RookMobilityBonus
      case 'queen':
        return mobility * PARAMS.QueenMobilityBonus
    }

    return 0
  }

  static evaluateKingSafety (board, kingIndex, color) {
    let score = 0
    const attackData = Evaluation.calculateAttackUnits(board, kingIndex, color)

    if (attackData.attackerCount > 1) {
      const safetyTable = [0, 0, 10, 30, 60, 100, 150, 210, 280, 360, 450]
      const idx = Math.min(attackData.attackUnits, 10)
      score -= safetyTable[idx]
    }

    score += Evaluation.calculatePawnShieldAndStorm(board, kingIndex, color)

    return score
  }

  static calculateAttackUnits (board, kingIndex, color) {
    let attackUnits = 0
    let attackerCount = 0
    const opponent = color === 'white' ? 'black' : 'white'
    const r = 7 - (kingIndex >> 4)
    const c = kingIndex & 7
    const kSq = r * 8 + c
    const zone = Bitboard.getKingAttacks(kSq)
    const occupancy = board.bitboards.white | board.bitboards.black

    // Knights
    let kn = board.bitboards.knight & board.bitboards[opponent]
    while (kn) {
      const sq = Bitboard.lsb(kn)
      const att = Bitboard.getKnightAttacks(sq)
      if (att & zone) {
        attackUnits += 2
        attackerCount++
      }
      kn &= (kn - 1n)
    }

    // Rooks/Queens
    let rq = (board.bitboards.rook | board.bitboards.queen) & board.bitboards[opponent]
    while (rq) {
      const sq = Bitboard.lsb(rq)
      const att = Bitboard.getRookAttacks(sq, occupancy)
      if (att & zone) {
        attackUnits += 3
        attackerCount++
      }
      rq &= (rq - 1n)
    }

    // Bishops/Queens
    let bq = (board.bitboards.bishop | board.bitboards.queen) & board.bitboards[opponent]
    while (bq) {
      const sq = Bitboard.lsb(bq)
      const att = Bitboard.getBishopAttacks(sq, occupancy)
      if (att & zone) {
        attackUnits += 3
        attackerCount++
      }
      bq &= (bq - 1n)
    }

    return { attackUnits, attackerCount }
  }

  static calculatePawnShieldAndStorm (board, kingIndex, color) {
    const opponent = color === 'white' ? 'black' : 'white'
    const r = 7 - (kingIndex >> 4)
    const c = kingIndex & 7
    const kFile = c
    const rankIndex = r

    let shieldScore = 0
    let stormScore = 0

    for (let f = kFile - 1; f <= kFile + 1; f++) {
      if (f < 0 || f > 7) continue
      shieldScore += Evaluation.getFileShieldScore(board, f, rankIndex, color)
      stormScore += Evaluation.getFileStormScore(board, f, rankIndex, color, opponent)
    }
    return shieldScore + stormScore
  }

  static getFileShieldScore (board, f, rankIndex, color) {
    const forward = color === 'white' ? 1 : -1
    const r1 = rankIndex + forward
    if (r1 >= 0 && r1 <= 7) {
      const idx = r1 * 8 + f
      if (board.bitboards.pawn & board.bitboards[color] & (1n << BigInt(idx))) {
        return PARAMS.ShieldBonus
      }
    }
    const r2 = rankIndex + forward * 2
    if (r2 >= 0 && r2 <= 7) {
      const idx = r2 * 8 + f
      if (board.bitboards.pawn & board.bitboards[color] & (1n << BigInt(idx))) {
        return (PARAMS.ShieldBonus / 2)
      }
    }
    return 0
  }

  static getFileStormScore (board, f, rankIndex, color, opponent) {
    const fileMask = FILE_MASKS[f]
    const enemyPawns = board.bitboards.pawn & board.bitboards[opponent] & fileMask
    if (enemyPawns) {
      let pSq
      if (color === 'white') {
        pSq = Bitboard.lsb(enemyPawns)
      } else {
        pSq = Bitboard.msb(enemyPawns)
      }
      const pRank = Math.floor(pSq / 8)
      const dist = Math.abs(pRank - rankIndex)
      if (dist > 0) {
        return -(60 / dist)
      }
    }
    return 0
  }
}

module.exports = Evaluation
