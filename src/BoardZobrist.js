const Zobrist = require('./Zobrist')
const Bitboard = require('./Bitboard')

class BoardZobrist {
  static calculateZobristKey (board) {
    let key = 0n;
    ['white', 'black'].forEach(c => {
      ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'].forEach(t => {
        let bb = board.bitboards[c] & board.bitboards[t]
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

    if (board.activeColor === 'b') key ^= Zobrist.sideToMove
    key ^= BoardZobrist.getCastlingHash(board.castlingRights)
    const epIndex = Zobrist.getEpIndex(board.enPassantTarget)
    if (epIndex !== -1) key ^= Zobrist.enPassant[epIndex]
    board.zobristKey = key
  }

  static getCastlingHash (rights) {
    if (rights === '-') return 0n
    let hash = 0n
    for (const char of rights) {
      hash ^= BoardZobrist._getRightsHash(char)
    }
    return hash
  }

  static _getRightsHash (char) {
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

  static updateZobristForMove (board, move, capturedPiece) {
    const { c, t } = Zobrist.getPieceIndex(move.piece.color, move.piece.type)
    board.zobristKey ^= Zobrist.pieces[c][t][move.from]

    if (capturedPiece) {
      const capIdx = Zobrist.getPieceIndex(capturedPiece.color, capturedPiece.type)
      board.zobristKey ^= Zobrist.pieces[capIdx.c][capIdx.t][move.to]
    } else if (move.flags === 'e' || move.flags === 'ep') {
      const isWhite = move.piece.color === 'white'
      const captureSq = isWhite ? move.to + 16 : move.to - 16
      const capColor = isWhite ? 'black' : 'white'
      const capIdx = Zobrist.getPieceIndex(capColor, 'pawn')
      board.zobristKey ^= Zobrist.pieces[capIdx.c][capIdx.t][captureSq]
    }

    if (move.promotion) {
      const promoType = { q: 'queen', r: 'rook', b: 'bishop', n: 'knight' }[move.promotion]
      const promoIdx = Zobrist.getPieceIndex(move.piece.color, promoType)
      board.zobristKey ^= Zobrist.pieces[promoIdx.c][promoIdx.t][move.to]
    } else {
      board.zobristKey ^= Zobrist.pieces[c][t][move.to]
    }
  }

  static updateZobristCastling (board, move) {
    if (move.flags !== 'k' && move.flags !== 'q') return

    if (move.piece.color === 'white') {
      const rookIdx = Zobrist.getPieceIndex('white', 'rook')
      if (move.flags === 'k') {
        board.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][119]
        board.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][117]
      } else {
        board.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][112]
        board.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][115]
      }
    } else {
      const rookIdx = Zobrist.getPieceIndex('black', 'rook')
      if (move.flags === 'k') {
        board.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][7]
        board.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][5]
      } else {
        board.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][0]
        board.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][3]
      }
    }
  }

  static updateZobristBeforeMove (board, move, capturedPiece) {
    BoardZobrist.updateZobristForMove(board, move, capturedPiece)
    BoardZobrist.updateZobristCastling(board, move)
    board.zobristKey ^= Zobrist.sideToMove
    board.zobristKey ^= BoardZobrist.getCastlingHash(board.castlingRights)
    const oldEpIndex = Zobrist.getEpIndex(board.enPassantTarget)
    if (oldEpIndex !== -1) board.zobristKey ^= Zobrist.enPassant[oldEpIndex]
  }

  static updateZobristAfterMove (board) {
    const newEpIndex = Zobrist.getEpIndex(board.enPassantTarget)
    if (newEpIndex !== -1) board.zobristKey ^= Zobrist.enPassant[newEpIndex]
  }
}

module.exports = BoardZobrist
