const fs = require('fs')
const path = require('path')
const Bitboard = require('./Bitboard')

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

  static get0x88 (sq64) {
    const r = 7 - Math.floor(sq64 / 8)
    const c = sq64 % 8
    return (r << 4) | c
  }

  static evaluatePiece (board, type, color, bb) {
    let score = 0
    let tempBb = bb
    while (tempBb) {
      const sq64 = Bitboard.lsb(tempBb)
      const i = Evaluation.get0x88(sq64)

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

      tempBb &= (tempBb - 1n)
    }
    return score
  }

  static evaluate (board) {
    let score = 0
    const colors = ['white', 'black']
    const types = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']

    for (const color of colors) {
      for (const type of types) {
        const bb = board.bitboards[type] & board.bitboards[color]
        score += Evaluation.evaluatePiece(board, type, color, bb)
      }
    }

    // King Safety (calculated once per side)
    const whiteKingBb = board.bitboards.king & board.bitboards.white
    if (whiteKingBb) {
      const sq64 = Bitboard.lsb(whiteKingBb)
      score += Evaluation.evaluateKingSafety(board, Evaluation.get0x88(sq64), 'white')
    }

    const blackKingBb = board.bitboards.king & board.bitboards.black
    if (blackKingBb) {
      const sq64 = Bitboard.lsb(blackKingBb)
      score -= Evaluation.evaluateKingSafety(board, Evaluation.get0x88(sq64), 'black')
    }

    return board.activeColor === 'w' ? score : -score
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

  static isOutpostSafe (board, rank, col, color) {
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

    return (enemyPawns & attackMask) === 0n
  }

  static evaluateOutpost (board, index, type, color) {
    if (type !== 'knight' && type !== 'bishop') return 0

    const sq64 = Bitboard.to64(index)
    const rank = Math.floor(sq64 / 8)
    const col = sq64 % 8

    const rankBonusMultiplier = Evaluation.getOutpostRankMultiplier(rank, color)
    if (rankBonusMultiplier === 0) return 0

    if (!Evaluation.isOutpostSupported(board, rank, col, color)) return 0
    if (!Evaluation.isOutpostSafe(board, rank, col, color)) return 0

    const baseBonus = type === 'knight' ? PARAMS.KnightOutpostBonus : PARAMS.BishopOutpostBonus
    return baseBonus * rankBonusMultiplier
  }

  static updateParam (name, value) {
    const map = {
      PawnValue: 'pawn',
      KnightValue: 'knight',
      BishopValue: 'bishop',
      RookValue: 'rook',
      QueenValue: 'queen'
    }

    if (map[name] && Object.prototype.hasOwnProperty.call(PIECE_VALUES, map[name])) {
      PIECE_VALUES[map[name]] = value
      return
    }

    if (Object.prototype.hasOwnProperty.call(PIECE_VALUES, name)) {
      PIECE_VALUES[name] = value
    }

    if (Object.prototype.hasOwnProperty.call(PARAMS, name)) {
      PARAMS[name] = value
    }
  }

  static getParams () {
    return { ...PIECE_VALUES, ...PARAMS }
  }

  static getDoubledPawnPenalty (board, index, color) {
    const forward = color === 'white' ? -16 : 16
    const frontSq = index + forward
    const frontPiece = board.getPiece(frontSq)
    if (frontPiece && frontPiece.type === 'pawn' && frontPiece.color === color) {
      return PARAMS.DoubledPawnPenalty
    }
    return 0
  }

  static getIsolatedPawnPenalty (board, index, color) {
    const col = index & 7
    let hasNeighbor = false
    const files = [col - 1, col + 1]
    for (const f of files) {
      if (f >= 0 && f <= 7) {
        for (let r = 0; r < 8; r++) {
          const idx = (r << 4) | f
          const p = board.getPiece(idx)
          if (p && p.type === 'pawn' && p.color === color) {
            hasNeighbor = true
            break
          }
        }
      }
    }
    return hasNeighbor ? 0 : PARAMS.IsolatedPawnPenalty
  }

  static getBackwardPawnPenalty (board, index, color) {
    const col = index & 7
    const row = index >> 4
    const files = [col - 1, col + 1]
    let hasNeighbor = false

    // Check if neighbors exist
    for (const f of files) {
      if (f >= 0 && f <= 7) {
        for (let r = 0; r < 8; r++) {
          const idx = (r << 4) | f
          const p = board.getPiece(idx)
          if (p && p.type === 'pawn' && p.color === color) {
            hasNeighbor = true
            break
          }
        }
      }
    }

    if (!hasNeighbor) return 0 // Isolated handled separately

    let isBehindAllNeighbors = true
    for (const f of files) {
      if (f >= 0 && f <= 7) {
        for (let r = 0; r < 8; r++) {
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

  static getPassedPawnBonus (board, index, color) {
    const col = index & 7
    const row = index >> 4
    const enemyColor = color === 'white' ? 'black' : 'white'
    let isPassed = true
    const checkFiles = [col - 1, col, col + 1]

    const startRow = color === 'white' ? 0 : row + 1
    const endRow = color === 'white' ? row - 1 : 7

    for (const f of checkFiles) {
      if (f < 0 || f > 7) continue
      if (startRow <= endRow) {
        for (let r = startRow; r <= endRow; r++) {
          const idx = (r << 4) | f
          const p = board.getPiece(idx)
          if (p && p.type === 'pawn' && p.color === enemyColor) {
            isPassed = false
            break
          }
        }
      }
      if (!isPassed) break
    }

    if (isPassed) {
      const PASSED_BONUS = [0, 0, 10, 20, 40, 80, 160, 0]
      let rankIdx = 0
      if (color === 'white') {
        rankIdx = 7 - row
      } else {
        rankIdx = row
      }
      if (rankIdx < 0) rankIdx = 0
      if (rankIdx > 7) rankIdx = 7

      return PASSED_BONUS[rankIdx]
    }
    return 0
  }

  static evaluatePawnStructure (board, index, color) {
    let score = 0
    score -= Evaluation.getDoubledPawnPenalty(board, index, color)
    score -= Evaluation.getIsolatedPawnPenalty(board, index, color)
    score -= Evaluation.getBackwardPawnPenalty(board, index, color)
    score += Evaluation.getPassedPawnBonus(board, index, color)
    return score
  }

  static getAttackSquares (type, sq, occupancy) {
    switch (type) {
      case 'knight':
        return Bitboard.getKnightAttacks(sq)
      case 'bishop':
        return Bitboard.getBishopAttacks(sq, occupancy)
      case 'rook':
        return Bitboard.getRookAttacks(sq, occupancy)
      case 'queen':
        return Bitboard.getBishopAttacks(sq, occupancy) | Bitboard.getRookAttacks(sq, occupancy)
      default:
        return 0n
    }
  }

  static evaluateMobility (board, index, type, color) {
    const r = 7 - (index >> 4)
    const c = index & 7
    const sq = r * 8 + c
    if (sq < 0 || sq > 63) return 0

    const occupancy = board.bitboards.white | board.bitboards.black
    const friendlyPieces = board.bitboards[color]
    const opponent = color === 'white' ? 'black' : 'white'

    let attackSquares = Evaluation.getAttackSquares(type, sq, occupancy)
    attackSquares &= ~friendlyPieces

    let safeSquaresCount = 0
    while (attackSquares) {
      const toSq = Bitboard.lsb(attackSquares)
      const bbRow = Math.floor(toSq / 8)
      const bbCol = toSq % 8
      const boardRow = 7 - bbRow
      const to0x88 = (boardRow << 4) | bbCol

      if (!board.isSquareAttacked(to0x88, opponent)) {
        safeSquaresCount++
      }

      attackSquares &= (attackSquares - 1n)
    }

    switch (type) {
      case 'knight': return safeSquaresCount * PARAMS.KnightMobilityBonus
      case 'bishop': return safeSquaresCount * PARAMS.BishopMobilityBonus
      case 'rook': return safeSquaresCount * PARAMS.RookMobilityBonus
      case 'queen': return safeSquaresCount * PARAMS.QueenMobilityBonus
    }
    return 0
  }

  static getKingAttackersScore (board, zone, opponent, occupancy) {
    let attackUnits = 0
    let attackerCount = 0

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

    if (attackerCount > 1) {
      const safetyTable = [0, 0, 10, 30, 60, 100, 150, 210, 280, 360, 450]
      const idx = Math.min(attackUnits, 10)
      return -safetyTable[idx]
    }
    return 0
  }

  static getPawnShieldAndStormScore (board, r, c, color, opponent) {
    const kFile = c
    const rankIndex = r
    const forward = color === 'white' ? 1 : -1
    let shieldScore = 0
    let stormScore = 0

    for (let f = kFile - 1; f <= kFile + 1; f++) {
      if (f < 0 || f > 7) continue

      const fileMask = FILE_MASKS[f]

      // Shield
      const r1 = rankIndex + forward
      let shieldFound = false
      if (r1 >= 0 && r1 <= 7) {
        const idx = r1 * 8 + f
        if (board.bitboards.pawn & board.bitboards[color] & (1n << BigInt(idx))) {
          shieldScore += PARAMS.ShieldBonus
          shieldFound = true
        }
      }
      if (!shieldFound) {
        const r2 = rankIndex + forward * 2
        if (r2 >= 0 && r2 <= 7) {
          const idx = r2 * 8 + f
          if (board.bitboards.pawn & board.bitboards[color] & (1n << BigInt(idx))) {
            shieldScore += (PARAMS.ShieldBonus / 2)
          }
        }
      }

      // Storm
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
          stormScore -= (60 / dist)
        }
      }
    }
    return shieldScore + stormScore
  }

  static evaluateKingSafety (board, kingIndex, color) {
    const opponent = color === 'white' ? 'black' : 'white'
    const r = 7 - (kingIndex >> 4)
    const c = kingIndex & 7
    const kSq = r * 8 + c

    const zone = Bitboard.getKingAttacks(kSq)
    const occupancy = board.bitboards.white | board.bitboards.black

    let score = Evaluation.getKingAttackersScore(board, zone, opponent, occupancy)
    score += Evaluation.getPawnShieldAndStormScore(board, r, c, color, opponent)

    return score
  }
}

module.exports = Evaluation
