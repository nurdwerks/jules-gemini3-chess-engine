const Piece = require('./Piece')
const Bitboard = require('./Bitboard')
const trace = require('./trace')

class MoveGenerator {
  static generateMoves (board) {
    trace(`generateMoves(color: ${board.activeColor})`)
    const moves = []
    const color = board.activeColor === 'w' ? 'white' : 'black'
    const opponent = board.activeColor === 'w' ? 'black' : 'white'

    const us = board.bitboards[color]
    const them = board.bitboards[opponent]
    const occupancy = us | them

    MoveGenerator.generatePawnMoves(board, us, them, occupancy, moves)
    MoveGenerator.generateKnightMoves(board, us, them, moves)
    MoveGenerator.generateKingMoves(board, us, them, occupancy, moves)

    MoveGenerator.generateSlidingMoves(board, 'rook', us, them, occupancy, moves)
    MoveGenerator.generateSlidingMoves(board, 'bishop', us, them, occupancy, moves)
    MoveGenerator.generateSlidingMoves(board, 'queen', us, them, occupancy, moves)

    const movingColor = board.activeColor === 'w' ? 'white' : 'black'
    return moves.filter(move => {
      const captured = board.makeMove(move)
      const legal = !board.isKingInCheck(movingColor)
      board.unmakeMove(move, captured)
      return legal
    })
  }

  static addMoves (board, pieceType, fromSq, attacks, us, them, moves) {
    const color = board.activeColor === 'w' ? 'white' : 'black'
    const fromRow = 7 - Math.floor(fromSq / 8)
    const fromCol = fromSq % 8
    const from0x88 = (fromRow << 4) | fromCol
    const piece = new Piece(color, pieceType)

    let targets = attacks & ~us
    while (targets) {
      const toSq = Bitboard.lsb(targets)
      const toRow = 7 - Math.floor(toSq / 8)
      const toCol = toSq % 8
      const to0x88 = (toRow << 4) | toCol

      const isCapture = (them & (1n << BigInt(toSq))) !== 0n
      if (isCapture) {
        const captured = board.getPiece(to0x88)
        moves.push({ from: from0x88, to: to0x88, flags: 'c', piece, captured })
      } else {
        moves.push({ from: from0x88, to: to0x88, flags: 'n', piece })
      }

      targets &= (targets - 1n)
    }
  }

  static generatePawnPushes (board, from0x88, color, occupancy, moves, piece) {
    const forward = color === 'white' ? -16 : 16
    const targetSingle = from0x88 + forward

    if (MoveGenerator._isSquareEmpty(board, targetSingle, occupancy)) {
      MoveGenerator._addSinglePush(board, from0x88, targetSingle, color, moves, piece)

      const startRank = color === 'white' ? 6 : 1
      const currentRow = from0x88 >> 4
      if (currentRow === startRank) {
        const targetDouble = from0x88 + (forward * 2)
        if (MoveGenerator._isSquareEmpty(board, targetDouble, occupancy)) {
          moves.push({ from: from0x88, to: targetDouble, flags: 'n', piece })
        }
      }
    }
  }

  static _isSquareEmpty (board, sq, occupancy) {
    if (!board.isValidSquare(sq)) return false
    const t64 = Bitboard.to64(sq)
    return (occupancy & (1n << BigInt(t64))) === 0n
  }

  static _addSinglePush (board, from0x88, targetSingle, color, moves, piece) {
    const targetRow = targetSingle >> 4
    const promotionRank = color === 'white' ? 0 : 7
    if (targetRow === promotionRank) {
      ['q', 'r', 'b', 'n'].forEach(promo => {
        moves.push({ from: from0x88, to: targetSingle, flags: 'p', piece, promotion: promo })
      })
    } else {
      moves.push({ from: from0x88, to: targetSingle, flags: 'n', piece })
    }
  }

  static generatePawnCaptures (board, from0x88, color, them, occupancy, moves, piece) {
    const captureOffsets = color === 'white' ? [-17, -15] : [15, 17]
    for (const capOffset of captureOffsets) {
      const targetCap = from0x88 + capOffset
      if (board.isValidSquare(targetCap)) {
        const t64 = Bitboard.to64(targetCap)
        const isOcc = (occupancy & (1n << BigInt(t64))) !== 0n
        const isThem = (them & (1n << BigInt(t64))) !== 0n

        if (isThem) {
          const targetPiece = board.getPiece(targetCap)
          const targetRow = targetCap >> 4
          const promotionRank = color === 'white' ? 0 : 7
          if (targetRow === promotionRank) {
            ['q', 'r', 'b', 'n'].forEach(promo => {
              moves.push({ from: from0x88, to: targetCap, flags: 'cp', piece, captured: targetPiece, promotion: promo })
            })
          } else {
            moves.push({ from: from0x88, to: targetCap, flags: 'c', piece, captured: targetPiece })
          }
        } else if (!isOcc && board.enPassantTarget !== '-') {
          const epIndex = board.algebraicToIndex(board.enPassantTarget)
          if (targetCap === epIndex) {
            moves.push({ from: from0x88, to: targetCap, flags: 'e', piece })
          }
        }
      }
    }
  }

  static generatePawnMoves (board, us, them, occupancy, moves) {
    const color = board.activeColor === 'w' ? 'white' : 'black'
    let pawns = board.bitboards.pawn & us
    while (pawns) {
      const fromSq = Bitboard.lsb(pawns)
      const fromRow = 7 - Math.floor(fromSq / 8)
      const fromCol = fromSq % 8
      const from0x88 = (fromRow << 4) | fromCol
      const piece = new Piece(color, 'pawn')

      MoveGenerator.generatePawnPushes(board, from0x88, color, occupancy, moves, piece)
      MoveGenerator.generatePawnCaptures(board, from0x88, color, them, occupancy, moves, piece)

      pawns &= (pawns - 1n)
    }
  }

  static generateChess960Castling (board, from0x88, piece, opponent, occupancy, moves) {
    const color = board.activeColor === 'w' ? 'white' : 'black'
    const rooks = board.castlingRooks[color]
    for (const rookIndex of rooks) {
      MoveGenerator._check960CastlingForRook(board, from0x88, rookIndex, piece, opponent, occupancy, moves, color)
    }
  }

  static _check960CastlingForRook (board, from0x88, rookIndex, piece, opponent, occupancy, moves, color) {
    const rookPiece = board.getPiece(rookIndex)
    if (!rookPiece || rookPiece.type !== 'rook' || rookPiece.color !== color) return

    const kingCol = from0x88 & 7
    const rookCol = rookIndex & 7
    const isKingside = rookCol > kingCol
    if (!MoveGenerator._canCastle960(board, color, isKingside)) return

    const { kingTargetIndex, rookTargetIndex } = MoveGenerator._getCastlingTargets(isKingside, color)

    if (!MoveGenerator.isPathClear(board, from0x88, rookIndex, kingTargetIndex, rookTargetIndex, occupancy)) return
    if (MoveGenerator.isPathAttacked(board, from0x88, kingTargetIndex, opponent)) return

    const flag = isKingside ? 'k960' : 'q960'
    moves.push({ from: from0x88, to: kingTargetIndex, flags: flag, piece, rookSource: rookIndex })
  }

  static _canCastle960 (board, color, isKingside) {
    const castling = board.castling[color === 'white' ? 'w' : 'b']
    return (isKingside && castling.k) || (!isKingside && castling.q)
  }

  static _getCastlingTargets (isKingside, color) {
    const targetFile = isKingside ? 6 : 2
    const rank = color === 'white' ? 7 : 0
    const kingTargetIndex = (rank << 4) | targetFile
    const rookTargetFile = isKingside ? 5 : 3
    const rookTargetIndex = (rank << 4) | rookTargetFile
    return { kingTargetIndex, rookTargetIndex }
  }

  static isPathClear (board, from, rookIndex, kingTarget, rookTarget, occupancy) {
    const kingPath = [from, kingTarget].sort((a, b) => a - b)
    const rookPath = [rookIndex, rookTarget].sort((a, b) => a - b)

    const squaresToCheck = new Set()
    for (let i = kingPath[0]; i <= kingPath[1]; i++) squaresToCheck.add(i)
    for (let i = rookPath[0]; i <= rookPath[1]; i++) squaresToCheck.add(i)

    for (const sq of squaresToCheck) {
      if (sq !== from && sq !== rookIndex) {
        const sq64 = Bitboard.to64(sq)
        if ((occupancy & (1n << BigInt(sq64))) !== 0n) return false
      }
    }
    return true
  }

  static isPathAttacked (board, from, kingTarget, opponent) {
    const kingPath = [from, kingTarget].sort((a, b) => a - b)
    for (let i = kingPath[0]; i <= kingPath[1]; i++) {
      if (board.isSquareAttacked(i, opponent)) return true
    }
    return false
  }

  static generateStandardCastling (board, from0x88, piece, opponent, occupancy, moves) {
    const color = board.activeColor === 'w' ? 'white' : 'black'
    const kingIndex = from0x88

    if (board.castling[color === 'white' ? 'w' : 'b'].k) {
      MoveGenerator._generateStandardCastlingKingside(board, kingIndex, piece, opponent, moves)
    }
    if (board.castling[color === 'white' ? 'w' : 'b'].q) {
      MoveGenerator._generateStandardCastlingQueenside(board, kingIndex, piece, opponent, moves)
    }
  }

  static _generateStandardCastlingKingside (board, kingIndex, piece, opponent, moves) {
    const rook = board.getPiece(kingIndex + 3)
    const occ1 = board.getPiece(kingIndex + 1)
    const occ2 = board.getPiece(kingIndex + 2)

    if (rook && rook.type === 'rook' && !occ1 && !occ2 &&
      !board.isSquareAttacked(kingIndex, opponent) &&
      !board.isSquareAttacked(kingIndex + 1, opponent) &&
      !board.isSquareAttacked(kingIndex + 2, opponent)) {
      moves.push({ from: kingIndex, to: kingIndex + 2, flags: 'k', piece })
    }
  }

  static _generateStandardCastlingQueenside (board, kingIndex, piece, opponent, moves) {
    const rook = board.getPiece(kingIndex - 4)
    const occ1 = board.getPiece(kingIndex - 1)
    const occ2 = board.getPiece(kingIndex - 2)
    const occ3 = board.getPiece(kingIndex - 3)

    if (rook && rook.type === 'rook' && !occ1 && !occ2 && !occ3 &&
      !board.isSquareAttacked(kingIndex, opponent) &&
      !board.isSquareAttacked(kingIndex - 1, opponent) &&
      !board.isSquareAttacked(kingIndex - 2, opponent)) {
      moves.push({ from: kingIndex, to: kingIndex - 2, flags: 'q', piece })
    }
  }

  static generateCastlingMoves (board, from0x88, piece, opponent, occupancy, moves) {
    if (board.isChess960) {
      MoveGenerator.generateChess960Castling(board, from0x88, piece, opponent, occupancy, moves)
    } else {
      MoveGenerator.generateStandardCastling(board, from0x88, piece, opponent, occupancy, moves)
    }
  }

  static generateKingMoves (board, us, them, occupancy, moves) {
    const color = board.activeColor === 'w' ? 'white' : 'black'
    const opponent = board.activeColor === 'w' ? 'black' : 'white'
    let kings = board.bitboards.king & us
    while (kings) {
      const fromSq = Bitboard.lsb(kings)
      const attacks = Bitboard.getKingAttacks(fromSq)
      MoveGenerator.addMoves(board, 'king', fromSq, attacks, us, them, moves)
      kings &= (kings - 1n)

      const from0x88 = board.toIndex(7 - Math.floor(fromSq / 8), fromSq % 8)
      const piece = new Piece(color, 'king')
      if (!board.isSquareAttacked(from0x88, opponent)) {
        MoveGenerator.generateCastlingMoves(board, from0x88, piece, opponent, occupancy, moves)
      }
    }
  }

  static generateSlidingMoves (board, type, us, them, occupancy, moves) {
    let pieces = board.bitboards[type] & us
    while (pieces) {
      const fromSq = Bitboard.lsb(pieces)
      let attacks = 0n
      if (type === 'rook') attacks = Bitboard.getRookAttacks(fromSq, occupancy)
      else if (type === 'bishop') attacks = Bitboard.getBishopAttacks(fromSq, occupancy)
      else if (type === 'queen') attacks = Bitboard.getRookAttacks(fromSq, occupancy) | Bitboard.getBishopAttacks(fromSq, occupancy)

      MoveGenerator.addMoves(board, type, fromSq, attacks, us, them, moves)
      pieces &= (pieces - 1n)
    }
  }

  static generateKnightMoves (board, us, them, moves) {
    let knights = board.bitboards.knight & us
    while (knights) {
      const fromSq = Bitboard.lsb(knights)
      const attacks = Bitboard.getKnightAttacks(fromSq)
      MoveGenerator.addMoves(board, 'knight', fromSq, attacks, us, them, moves)
      knights &= (knights - 1n)
    }
  }
}

module.exports = MoveGenerator
