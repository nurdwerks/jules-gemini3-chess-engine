// Polyglot Random Numbers (first 64 bytes)
// We need the full set for a compliant implementation, but for this exercise
// I will create a class that can compute keys compatible with standard books.
// The constants are usually 781 uint64s.
// I will fetch the full list of constants from a known source or use the ones from the website.
// The website shows the first few and the structure.
// To save space/time, I will only include the Random64 array if I can find a compact source or just copy paste a sufficient amount.
// Actually, I can't easily copy paste 781 numbers without bloating the file.
// However, I can generate them if I knew the seed, but Polyglot numbers are static constants.
// I will use a separate file `src/PolyglotConstants.js` and paste them there.
// For now, let's create `src/Polyglot.js` structure.

const fs = require('fs');
const Bitboard = require('./Bitboard');

class Polyglot {
  constructor() {
    this.bookFile = null;
  }

  loadBook(filepath) {
      if (fs.existsSync(filepath)) {
          this.bookFile = filepath;
          return true;
      }
      return false;
  }

  // Compute Polyglot Key for the board
  computeKey(board) {
      const constants = require('./PolyglotConstants');

      let key = 0n; // BigInt

      // Pieces
      for (const color of ['white', 'black']) {
          for (const type of ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']) {
              let bb = board.bitboards[type] & board.bitboards[color];
              while (bb) {
                  const sq64 = Bitboard.lsb(bb);
                  const row = 7 - Math.floor(sq64 / 8);
                  const file = sq64 % 8;
                  const polyRow = 7 - row;
                  const polyFile = file;

                  const pieceTypeMap = { 'pawn': 0, 'knight': 1, 'bishop': 2, 'rook': 3, 'queen': 4, 'king': 5 };
                  let kind = pieceTypeMap[type];
                  kind = kind * 2 + (color === 'white' ? 1 : 0);

                  const offset = 64 * kind + 8 * polyRow + polyFile;
                  key ^= constants.Random64[offset];

                  bb &= (bb - 1n);
              }
          }
      }

      // Castling
      if (board.castlingRights.includes('K')) key ^= constants.Random64[768 + 0];
      if (board.castlingRights.includes('Q')) key ^= constants.Random64[768 + 1];
      if (board.castlingRights.includes('k')) key ^= constants.Random64[768 + 2];
      if (board.castlingRights.includes('q')) key ^= constants.Random64[768 + 3];

      // En Passant
      if (board.enPassantTarget !== '-') {
          const epIndex = board.algebraicToIndex(board.enPassantTarget);
          const epCol = epIndex & 7;
          const epRow = epIndex >> 4;
          const epPawnRow = board.activeColor === 'w' ? epRow + 1 : epRow - 1;

          let hasPawn = false;
          const cols = [epCol - 1, epCol + 1];
          for (const c of cols) {
              if (c >= 0 && c <= 7) {
                  const idx = (epPawnRow << 4) | c;
                  const p = board.getPiece(idx);
                  if (p && p.type === 'pawn' && (p.color === 'white' ? 'w' : 'b') === board.activeColor) {
                      hasPawn = true;
                      break;
                  }
              }
          }

          if (hasPawn) {
               key ^= constants.Random64[772 + epCol];
          }
      }

      // Turn
      if (board.activeColor === 'w') {
          key ^= constants.Random64[780];
      }

      return key;
  }

  findMove(board) {
      if (!this.bookFile) return null;

      const key = this.computeKey(board);

      // Binary Search in the file.
      // File entries are 16 bytes.
      // Big-endian Key (8 bytes).

      const fd = fs.openSync(this.bookFile, 'r');
      const stats = fs.fstatSync(fd);
      const fileSize = stats.size;
      const entrySize = 16;
      const numEntries = Math.floor(fileSize / entrySize);

      let left = 0;
      let right = numEntries - 1;
      let firstMatch = -1;

      // Find FIRST occurrence of key
      while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          const buffer = Buffer.alloc(8);
          fs.readSync(fd, buffer, 0, 8, mid * entrySize);
          const entryKey = buffer.readBigUInt64BE(0);

          if (entryKey === key) {
              firstMatch = mid;
              right = mid - 1; // Try to find earlier match
          } else if (entryKey < key) {
              left = mid + 1;
          } else {
              right = mid - 1;
          }
      }

      if (firstMatch === -1) {
          fs.closeSync(fd);
          return null;
      }

      // Collect all moves for this key
      const moves = [];
      let current = firstMatch;

      while (current < numEntries) {
          const buffer = Buffer.alloc(16);
          fs.readSync(fd, buffer, 0, 16, current * entrySize);
          const entryKey = buffer.readBigUInt64BE(0);

          if (entryKey !== key) break;

          const moveInt = buffer.readUInt16BE(8);
          const weight = buffer.readUInt16BE(10);

          moves.push({ moveInt, weight });
          current++;
      }

      fs.closeSync(fd);

      // Select move based on weight
      return this.selectWeightedMove(moves);
  }

  selectWeightedMove(moves) {
      const totalWeight = moves.reduce((sum, m) => sum + m.weight, 0);
      if (totalWeight === 0) return null; // Or pick random?

      let rnd = Math.floor(Math.random() * totalWeight);
      for (const m of moves) {
          rnd -= m.weight;
          if (rnd < 0) {
              return this.intToMove(m.moveInt);
          }
      }
      return this.intToMove(moves[0].moveInt);
  }

  moveToInt(move) {
    const fromFile = move.from & 7;
    const fromRow = 7 - (move.from >> 4);
    const toFile = move.to & 7;
    const toRow = 7 - (move.to >> 4);
    const promoMap = { 'n': 1, 'b': 2, 'r': 3, 'q': 4 };
    const promo = move.promotion ? promoMap[move.promotion] : 0;

    return (promo << 12) | (fromRow << 9) | (fromFile << 6) | (toRow << 3) | toFile;
  }

  intToMove(moveInt) {
      // Polyglot Move Encoding:
      // bit 0-2: to file
      // bit 3-5: to row
      // bit 6-8: from file
      // bit 9-11: from row
      // bit 12-14: promotion

      const toFile = moveInt & 7;
      const toRow = (moveInt >> 3) & 7;
      const fromFile = (moveInt >> 6) & 7;
      const fromRow = (moveInt >> 9) & 7;
      const promo = (moveInt >> 12) & 7;

      // Convert to algebraic or board indices
      // Polyglot Row 0 = Rank 1.
      // My Board Row = 7 - PolyRow.

      const from = ((7 - fromRow) << 4) | fromFile;
      const to = ((7 - toRow) << 4) | toFile;

      const promoMap = [null, 'n', 'b', 'r', 'q'];
      const promotion = promoMap[promo];

      return { from, to, promotion };
  }
}

module.exports = Polyglot;
