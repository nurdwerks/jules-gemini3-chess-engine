class San {
  static moveToString (board, move) {
    const { row: fromRow, col: fromCol } = board.toRowCol(move.from)
    const { row: toRow, col: toCol } = board.toRowCol(move.to)
    const fromAlg = `${String.fromCharCode('a'.charCodeAt(0) + fromCol)}${8 - fromRow}`
    const toAlg = `${String.fromCharCode('a'.charCodeAt(0) + toCol)}${8 - toRow}`
    const promo = move.promotion ? move.promotion : ''
    return `${fromAlg}${toAlg}${promo}`
  }

  static moveToSan (board, move, moves) {
    if (move.flags === 'k' || move.flags === 'k960') return 'O-O'
    if (move.flags === 'q' || move.flags === 'q960') return 'O-O-O'

    const piece = move.piece
    const toAlg = San.moveToString(board, move).slice(2, 4)

    if (piece.type === 'pawn') {
      if (move.captured) {
        const fromAlg = San.moveToString(board, move).slice(0, 1)
        return `${fromAlg}x${toAlg}`
      }
      return toAlg
    }

    let san = San.disambiguateMove(board, move, moves, piece, toAlg)

    if (move.captured) {
      san = san.replace(toAlg, `x${toAlg}`)
    }

    return san
  }

  static disambiguateMove (board, move, moves, piece, toAlg) {
    const pieceChar = piece.type.toUpperCase().replace('KNIGHT', 'N').charAt(0)
    let san = `${pieceChar}${toAlg}`

    const ambiguousMoves = moves.filter(m =>
      m.piece.type === piece.type &&
        m.to === move.to &&
        m.from !== move.from
    )

    if (ambiguousMoves.length > 0) {
      const fromAlg = San.moveToString(board, move)
      const fromFile = fromAlg.charAt(0)
      const fromRank = fromAlg.charAt(1)

      const fileCollision = ambiguousMoves.some(m => (San.moveToString(board, m).charAt(0) === fromFile))
      const rankCollision = ambiguousMoves.some(m => (San.moveToString(board, m).charAt(1) === fromRank))

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
}

module.exports = San
