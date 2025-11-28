const Bitboard = require('./Bitboard')

class SEE {
  static getSmallestAttacker (board, square, side) {
    const sq64 = Bitboard.to64(square)
    const occupancy = board.bitboards.white | board.bitboards.black
    const attackersBB = board.bitboards[side]

    const pawnAttacker = SEE.getPawnAttacker(board, sq64, side, attackersBB)
    if (pawnAttacker) return pawnAttacker

    const knightAttacker = SEE.getPieceAttacker(board, sq64, side, attackersBB, 'knight', occupancy)
    if (knightAttacker) return knightAttacker

    const bishopAttacker = SEE.getPieceAttacker(board, sq64, side, attackersBB, 'bishop', occupancy)
    if (bishopAttacker) return bishopAttacker

    const rookAttacker = SEE.getPieceAttacker(board, sq64, side, attackersBB, 'rook', occupancy)
    if (rookAttacker) return rookAttacker

    const queenAttacker = SEE.getPieceAttacker(board, sq64, side, attackersBB, 'queen', occupancy)
    if (queenAttacker) return queenAttacker

    const kingAttacker = SEE.getPieceAttacker(board, sq64, side, attackersBB, 'king', occupancy)
    if (kingAttacker) return kingAttacker

    return null
  }

  static getPawnAttacker (board, sq64, side, attackersBB) {
    const pawns = board.bitboards.pawn & attackersBB
    if (!pawns) return null

    const bbRank = Math.floor(sq64 / 8)
    const bbCol = sq64 % 8

    if (side === 'white') return SEE._getWhitePawnAttacker(pawns, sq64, bbRank, bbCol)
    return SEE._getBlackPawnAttacker(pawns, sq64, bbRank, bbCol)
  }

  static _getWhitePawnAttacker (pawns, sq64, bbRank, bbCol) {
    if (bbRank > 0) {
      if (bbCol > 0 && (pawns & (1n << BigInt(sq64 - 9)))) return { from: SEE.to0x88(sq64 - 9), piece: { type: 'pawn', color: 'white' }, value: 100 }
      if (bbCol < 7 && (pawns & (1n << BigInt(sq64 - 7)))) return { from: SEE.to0x88(sq64 - 7), piece: { type: 'pawn', color: 'white' }, value: 100 }
    }
    return null
  }

  static _getBlackPawnAttacker (pawns, sq64, bbRank, bbCol) {
    if (bbRank < 7) {
      if (bbCol > 0 && (pawns & (1n << BigInt(sq64 + 7)))) return { from: SEE.to0x88(sq64 + 7), piece: { type: 'pawn', color: 'black' }, value: 100 }
      if (bbCol < 7 && (pawns & (1n << BigInt(sq64 + 9)))) return { from: SEE.to0x88(sq64 + 9), piece: { type: 'pawn', color: 'black' }, value: 100 }
    }
    return null
  }

  static getPieceAttacker (board, sq64, side, attackersBB, type, occupancy) {
    const pieces = board.bitboards[type] & attackersBB
    if (!pieces) return null

    let attackMask = 0n
    switch (type) {
      case 'knight': attackMask = Bitboard.getKnightAttacks(sq64); break
      case 'bishop': attackMask = Bitboard.getBishopAttacks(sq64, occupancy); break
      case 'rook': attackMask = Bitboard.getRookAttacks(sq64, occupancy); break
      case 'queen': attackMask = Bitboard.getBishopAttacks(sq64, occupancy) | Bitboard.getRookAttacks(sq64, occupancy); break
      case 'king': attackMask = Bitboard.getKingAttacks(sq64); break
    }

    const attackers = attackMask & pieces
    if (attackers) {
      const from64 = Bitboard.lsb(attackers)
      return { from: SEE.to0x88(from64), piece: { type, color: side }, value: SEE.getPieceValue(type) }
    }
    return null
  }

  static to0x88 (sq64) {
    const row = 7 - Math.floor(sq64 / 8)
    const col = sq64 % 8
    return (row << 4) | col
  }

  static see (board, move) {
    const gain = [0]
    if (move.captured) {
      gain[0] = SEE.getPieceValue(move.captured.type)
    }

    const changes = []
    const movePiece = (from, to, piece) => {
      const prevFrom = board.getPiece(from)
      const prevTo = board.getPiece(to)
      changes.push({ from, to, prevFrom, prevTo })
      board.toggleBitboard(piece, from)
      if (prevTo) board.toggleBitboard(prevTo, to)
      board.toggleBitboard(piece, to)
    }

    movePiece(move.from, move.to, move.piece)

    const attacker = move.piece
    let attackerValue = SEE.getPieceValue(attacker.type)
    let side = attacker.color === 'white' ? 'black' : 'white'
    const sq = move.to
    let depth = 0

    try {
      while (true) {
        depth++
        const nextAttackerInfo = SEE.getSmallestAttacker(board, sq, side)
        if (!nextAttackerInfo) break

        gain.push(attackerValue - gain[depth - 1])
        attackerValue = nextAttackerInfo.value
        side = side === 'white' ? 'black' : 'white'
        movePiece(nextAttackerInfo.from, sq, nextAttackerInfo.piece)
      }
    } finally {
      while (changes.length > 0) {
        const c = changes.pop()
        const pieceMoved = c.prevFrom
        board.toggleBitboard(pieceMoved, c.to)
        if (c.prevTo) board.toggleBitboard(c.prevTo, c.to)
        board.toggleBitboard(pieceMoved, c.from)
      }
    }

    while (depth > 1) {
      depth--
      gain[depth - 1] = -Math.max(-gain[depth - 1], gain[depth])
    }
    return gain[0]
  }

  static getPieceValue (type) {
    const values = { pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 20000 }
    return values[type] || 0
  }
}

module.exports = SEE
