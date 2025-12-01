const Bitboard = require('./Bitboard')

class BoardVerify {
  static verify (board) {
    const errors = []

    // Check Kings
    const wKing = Bitboard.popcnt(board.bitboards.white & board.bitboards.king)
    const bKing = Bitboard.popcnt(board.bitboards.black & board.bitboards.king)
    if (wKing !== 1) errors.push(`White King count: ${wKing}`)
    if (bKing !== 1) errors.push(`Black King count: ${bKing}`)

    // Check overlaps
    const w = board.bitboards.white
    const b = board.bitboards.black
    if ((w & b) !== 0n) errors.push('White and Black bitboards overlap')

    const pieces = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']
    let allPieces = 0n
    for (const p of pieces) {
      if ((board.bitboards[p] & allPieces) !== 0n) errors.push(`Piece bitboard overlap: ${p}`)
      allPieces |= board.bitboards[p]
    }

    if ((allPieces & ~(w | b)) !== 0n) errors.push('Piece exists without color')
    if (((w | b) & ~allPieces) !== 0n) errors.push('Color exists without piece type')

    return errors.length > 0 ? errors.join('; ') : 'State OK'
  }
}

module.exports = BoardVerify
