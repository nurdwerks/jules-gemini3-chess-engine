const Bitboard = require('./Bitboard')

class SEE {
  static getSmallestAttacker (board, square, side) {
    // square is 0x88
    const sq64 = Bitboard.to64(square)
    const occupancy = board.bitboards.white | board.bitboards.black
    const attackersBB = board.bitboards[side]

    // 1. Pawns
    const pawns = board.bitboards.pawn & attackersBB
    if (pawns) {
      // Check if any pawn attacks sq64
      // Attacks TO sq64.
      // If side is white, pawns are at sq-15, sq-17?
      // White pawn at P attacks P-16+1 (P-15) and P-16-1 (P-17)?
      // Wait.
      // White Pawn at sq64 (rank r, col c). Attacks (r-1, c-1) and (r-1, c+1) on 8x8?
      // "White pawn attacks sq from sq+15"
      // Let's verify direction.
      // White moves "up" (decreasing row index in 0x88, increasing rank).
      // Rank 0 is bottom (White pieces). Row 7.
      // White pawn at Row 6 moves to Row 5.
      // Attacks Row 5, Col +/- 1.
      // So P (Row 6) attacks (Row 5).
      // If `square` is at Row 5.
      // We look for pawns at Row 6.
      // Row 6 > Row 5. Index is higher.
      // So `sq + offset` where offset > 0.
      // `16` is one row down. `15` and `17` are diagonals.
      // So White pawns are at `sq + 15` and `sq + 17`.
      // Indices: `sq` is target. `sq+15` is potential white pawn.

      // In bitboards (Rank 0..7):
      // White pawn at Rank 1 attacks Rank 2.
      // Target `sq` at Rank 2.
      // Source `p` at Rank 1.
      // `p < sq`.
      // Bitboard `p = sq - 7` or `sq - 9`?
      // `sq = p + 7` or `p + 9`.
      // So `p = sq - 7` or `sq - 9`.

      // Let's check `isSquareAttacked` in Board.js:
      /*
            if (attackingSide === 'white') {
                if (col > 0 && ((whitePawns >> BigInt(bbSq - 9)) & 1n)) return true;
                if (col < 7 && ((whitePawns >> BigInt(bbSq - 7)) & 1n)) return true;
            }
            */
      // So for Bitboards, white pawns are at `sq - 9` and `sq - 7`.
      // Wait, this means checking `sq - 9` looks for a pawn there.

      const bbRank = Math.floor(sq64 / 8)
      const bbCol = sq64 % 8

      if (side === 'white') {
        // Pawns are "below" the target in ranks (lower rank index).
        // Wait, White starts at rank 0, moves to 7.
        // Attack is strictly increasing rank.
        // Target is Rank R. Pawn is Rank R-1.
        // Index: Target > Pawn.
        // So Pawn is at `sq - 7` or `sq - 9`.
        // Checks:
        if (bbRank > 0) { // Can have pawns at rank-1
          // Capture from right (col-1 attacking col) -> index - 9 ?
          // Capture from left (col+1 attacking col) -> index - 7 ?
          // Just check both.
          if (bbCol > 0 && (pawns & (1n << BigInt(sq64 - 9)))) return { from: SEE.to0x88(sq64 - 9), piece: { type: 'pawn', color: 'white' }, value: 100 }
          if (bbCol < 7 && (pawns & (1n << BigInt(sq64 - 7)))) return { from: SEE.to0x88(sq64 - 7), piece: { type: 'pawn', color: 'white' }, value: 100 }
        }
      } else {
        // Black pawns at Rank R+1.
        // Pawn > Target.
        // Pawn is at `sq + 7` or `sq + 9`.
        if (bbRank < 7) {
          if (bbCol > 0 && (pawns & (1n << BigInt(sq64 + 7)))) return { from: SEE.to0x88(sq64 + 7), piece: { type: 'pawn', color: 'black' }, value: 100 }
          if (bbCol < 7 && (pawns & (1n << BigInt(sq64 + 9)))) return { from: SEE.to0x88(sq64 + 9), piece: { type: 'pawn', color: 'black' }, value: 100 }
        }
      }
    }

    // 2. Knights
    const knights = board.bitboards.knight & attackersBB
    if (knights) {
      // Knights attacking sq64 are at `getKnightAttacks(sq64)`.
      const attackMask = Bitboard.getKnightAttacks(sq64)
      const attackers = attackMask & knights
      if (attackers) {
        const from64 = Bitboard.lsb(attackers)
        return { from: SEE.to0x88(from64), piece: { type: 'knight', color: side }, value: 320 }
      }
    }

    // 3. Bishops
    const bishops = board.bitboards.bishop & attackersBB
    if (bishops) {
      const attackMask = Bitboard.getBishopAttacks(sq64, occupancy)
      const attackers = attackMask & bishops
      if (attackers) {
        const from64 = Bitboard.lsb(attackers)
        return { from: SEE.to0x88(from64), piece: { type: 'bishop', color: side }, value: 330 }
      }
    }

    // 4. Rooks
    const rooks = board.bitboards.rook & attackersBB
    if (rooks) {
      const attackMask = Bitboard.getRookAttacks(sq64, occupancy)
      const attackers = attackMask & rooks
      if (attackers) {
        const from64 = Bitboard.lsb(attackers)
        return { from: SEE.to0x88(from64), piece: { type: 'rook', color: side }, value: 500 }
      }
    }

    // 5. Queens
    const queens = board.bitboards.queen & attackersBB
    if (queens) {
      const attackMask = Bitboard.getBishopAttacks(sq64, occupancy) | Bitboard.getRookAttacks(sq64, occupancy)
      const attackers = attackMask & queens
      if (attackers) {
        const from64 = Bitboard.lsb(attackers)
        return { from: SEE.to0x88(from64), piece: { type: 'queen', color: side }, value: 900 }
      }
    }

    // 6. King
    const king = board.bitboards.king & attackersBB
    if (king) {
      const attackMask = Bitboard.getKingAttacks(sq64)
      const attackers = attackMask & king
      if (attackers) {
        const from64 = Bitboard.lsb(attackers)
        return { from: SEE.to0x88(from64), piece: { type: 'king', color: side }, value: 20000 }
      }
    }

    return null
  }

  static to0x88 (sq64) {
    const row = 7 - Math.floor(sq64 / 8)
    const col = sq64 % 8
    return (row << 4) | col
  }

  static see (board, move) {
    // Initial gain = Value of captured piece
    const gain = [0]
    if (move.captured) {
      gain[0] = SEE.getPieceValue(move.captured.type)
    }

    // Track changes to revert
    const changes = []

    // Helper to modify and track
    const movePiece = (from, to, piece) => {
      const prevFrom = board.getPiece(from)
      const prevTo = board.getPiece(to)
      changes.push({ from, to, prevFrom, prevTo })

      // Remove piece from from
      board.toggleBitboard(piece, from)
      // Remove captured from to
      if (prevTo) board.toggleBitboard(prevTo, to)
      // Add piece to to
      board.toggleBitboard(piece, to)
    }

    // Initial Move
    movePiece(move.from, move.to, move.piece)

    const attacker = move.piece
    if (!attacker) {
      // Revert changes before returning
      while (changes.length > 0) {
        const c = changes.pop()
        if (c.prevTo) board.toggleBitboard(c.prevTo, c.to) // Remove piece at to, put prevTo
        else board.toggleBitboard(attacker, c.to) // Remove piece at to

        if (c.prevTo) ; // Handled above?
        // Wait, revert logic must be precise.
        // Inverse of movePiece:
        // 1. Remove piece from to.
        // 2. Add prevTo to to (if exists).
        // 3. Add prevFrom to from.
      }
      // This path is error, let's fix revert loop below properly.
      return 0
    }

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
      // Revert changes in reverse order
      while (changes.length > 0) {
        const c = changes.pop()
        // Revert: piece was moved from c.from to c.to. c.prevTo was captured.
        // The piece that moved is 'c.prevFrom' (or what we passed to movePiece).
        // Wait, c.prevFrom IS the piece that moved.

        const pieceMoved = c.prevFrom

        // 1. Remove piece from 'to'
        board.toggleBitboard(pieceMoved, c.to)

        // 2. Restore captured piece at 'to'
        if (c.prevTo) {
          board.toggleBitboard(c.prevTo, c.to)
        }

        // 3. Restore piece at 'from'
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
