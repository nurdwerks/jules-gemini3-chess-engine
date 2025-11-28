const fs = require('fs')

class Polyglot {
  constructor () {
    this.bookFile = null
  }

  loadBook (filepath) {
    if (fs.existsSync(filepath)) {
      this.bookFile = filepath
      return true
    }
    return false
  }

  computeKey (board) {
    const constants = require('./PolyglotConstants')
    let key = 0n

    key ^= this.hashPieces(board, constants)
    key ^= this.hashCastling(board, constants)
    key ^= this.hashEnPassant(board, constants)
    key ^= this.hashTurn(board, constants)

    return key
  }

  hashPieces (board, constants) {
    let key = 0n
    for (let i = 0; i < 128; i++) {
      if (!board.isValidSquare(i)) continue
      const piece = board.getPiece(i)
      if (piece) {
        const file = i & 7
        const row = i >> 4
        const polyRow = 7 - row
        const polyFile = file
        const pieceTypeMap = { pawn: 0, knight: 1, bishop: 2, rook: 3, queen: 4, king: 5 }
        let kind = pieceTypeMap[piece.type]
        kind = kind * 2 + (piece.color === 'white' ? 1 : 0)
        const offset = 64 * kind + 8 * polyRow + polyFile
        key ^= constants.Random64[offset]
      }
    }
    return key
  }

  hashCastling (board, constants) {
    let key = 0n
    if (board.castlingRights.includes('K')) key ^= constants.Random64[768 + 0]
    if (board.castlingRights.includes('Q')) key ^= constants.Random64[768 + 1]
    if (board.castlingRights.includes('k')) key ^= constants.Random64[768 + 2]
    if (board.castlingRights.includes('q')) key ^= constants.Random64[768 + 3]
    return key
  }

  hashEnPassant (board, constants) {
    if (board.enPassantTarget === '-') return 0n
    const epIndex = board.algebraicToIndex(board.enPassantTarget)
    const epCol = epIndex & 7
    const epRow = epIndex >> 4
    const epPawnRow = board.activeColor === 'w' ? epRow + 1 : epRow - 1

    let hasPawn = false
    const cols = [epCol - 1, epCol + 1]
    for (const c of cols) {
      if (c >= 0 && c <= 7) {
        const idx = (epPawnRow << 4) | c
        const p = board.getPiece(idx)
        if (p && p.type === 'pawn' && (p.color === 'white' ? 'w' : 'b') === board.activeColor) {
          hasPawn = true
          break
        }
      }
    }

    if (hasPawn) {
      return constants.Random64[772 + epCol]
    }
    return 0n
  }

  hashTurn (board, constants) {
    if (board.activeColor === 'w') {
      return constants.Random64[780]
    }
    return 0n
  }

  findMove (board) {
    if (!this.bookFile) return null

    const key = this.computeKey(board)

    const fd = fs.openSync(this.bookFile, 'r')
    const stats = fs.fstatSync(fd)
    const fileSize = stats.size
    const entrySize = 16
    const numEntries = Math.floor(fileSize / entrySize)

    let left = 0
    let right = numEntries - 1
    let firstMatch = -1

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      const buffer = Buffer.alloc(8)
      fs.readSync(fd, buffer, 0, 8, mid * entrySize)
      const entryKey = buffer.readBigUInt64BE(0)

      if (entryKey === key) {
        firstMatch = mid
        right = mid - 1
      } else if (entryKey < key) {
        left = mid + 1
      } else {
        right = mid - 1
      }
    }

    if (firstMatch === -1) {
      fs.closeSync(fd)
      return null
    }

    const moves = []
    let current = firstMatch

    while (current < numEntries) {
      const buffer = Buffer.alloc(16)
      fs.readSync(fd, buffer, 0, 16, current * entrySize)
      const entryKey = buffer.readBigUInt64BE(0)

      if (entryKey !== key) break

      const moveInt = buffer.readUInt16BE(8)
      const weight = buffer.readUInt16BE(10)

      moves.push({ moveInt, weight })
      current++
    }

    fs.closeSync(fd)

    return this.selectWeightedMove(moves)
  }

  selectWeightedMove (moves) {
    const totalWeight = moves.reduce((sum, m) => sum + m.weight, 0)
    if (totalWeight === 0) return null

    let rnd = Math.floor(Math.random() * totalWeight)
    for (const m of moves) {
      rnd -= m.weight
      if (rnd < 0) {
        return this.intToMove(m.moveInt)
      }
    }
    return this.intToMove(moves[0].moveInt)
  }

  moveToInt (move) {
    const fromFile = move.from & 7
    const fromRow = 7 - (move.from >> 4)
    const toFile = move.to & 7
    const toRow = 7 - (move.to >> 4)
    const promoMap = { n: 1, b: 2, r: 3, q: 4 }
    const promo = move.promotion ? promoMap[move.promotion] : 0

    return (promo << 12) | (fromRow << 9) | (fromFile << 6) | (toRow << 3) | toFile
  }

  intToMove (moveInt) {
    const toFile = moveInt & 7
    const toRow = (moveInt >> 3) & 7
    const fromFile = (moveInt >> 6) & 7
    const fromRow = (moveInt >> 9) & 7
    const promo = (moveInt >> 12) & 7

    const from = ((7 - fromRow) << 4) | fromFile
    const to = ((7 - toRow) << 4) | toFile

    const promoMap = [null, 'n', 'b', 'r', 'q']
    const promotion = promoMap[promo]

    return { from, to, promotion }
  }
}

module.exports = Polyglot
