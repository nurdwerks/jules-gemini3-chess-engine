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
      // We need the Polyglot Random Numbers.
      // Since we don't have them yet, we can't compute the standard key.
      // But we can implement the logic.
      const constants = require('./PolyglotConstants');

      let key = 0n; // BigInt

      // Pieces
      for (let i = 0; i < 128; i++) {
          if (!board.isValidSquare(i)) continue;
          const piece = board.squares[i];
          if (piece) {
              const file = i & 7;
              const row = i >> 4;
              // Polyglot uses 0-7 for rows 0-7.
              // My board: Row 0 is Rank 8. Row 7 is Rank 1.
              // Polyglot: Row 0 is Rank 1? Need to check.
              // "square a1, file 0, row 0".
              // My board: a1 is index 112 (row 7, col 0).
              // So Polyglot Row = 7 - MyRow.
              const polyRow = 7 - row;
              const polyFile = file;

              const pieceTypeMap = {
                  'pawn': 0, 'knight': 1, 'bishop': 2, 'rook': 3, 'queen': 4, 'king': 5
              };
              let kind = pieceTypeMap[piece.type];
              // Black pieces are offset by ? Polyglot:
              // Black Pawn 0, White Pawn 1...
              // Wait. Website says:
              // bp 0, wp 1, bn 2, wn 3 ...
              // So Kind = type * 2 + (color == white ? 1 : 0).

              kind = kind * 2 + (piece.color === 'white' ? 1 : 0);

              // Offset = 64 * kind + 8 * row + file
              const offset = 64 * kind + 8 * polyRow + polyFile;
              key ^= constants.Random64[offset];
          }
      }

      // Castling
      // "castle" is XOR of entries.
      // 0: White Short (K side)
      // 1: White Long (Q side)
      // 2: Black Short
      // 3: Black Long
      // Offset 768 + index
      // My board stores castlingRights as string "KQkq".
      if (board.castlingRights.includes('K')) key ^= constants.Random64[768 + 0];
      if (board.castlingRights.includes('Q')) key ^= constants.Random64[768 + 1];
      if (board.castlingRights.includes('k')) key ^= constants.Random64[768 + 2];
      if (board.castlingRights.includes('q')) key ^= constants.Random64[768 + 3];

      // En Passant
      // If EP square exists.
      // Polyglot: "If the opponent has performed a double pawn push and there is now a pawn next to it belonging to the player to move"
      // My board stores `enPassantTarget` as string or '-'.
      if (board.enPassantTarget !== '-') {
          const epIndex = board.algebraicToIndex(board.enPassantTarget);
          const epCol = epIndex & 7;

          // My board.enPassantTarget is the square *behind* the pawn.
          // e.g. e2-e4 -> enPassantTarget is e3.
          // The pawn is at e4.
          // We need to check if friendly pawns are at d4 or f4.

          const epRow = epIndex >> 4;
          // If activeColor is white (attacking), it means black pawn moved.
          // Black moves e7->e5 (row 1->3). EP square e6 (row 2).
          // Pawn is at e5 (row 3).
          // White pawns at d5/f5 (row 3) can capture.
          // So row to check is epRow + 1.
          // If activeColor is black, white pawn moved e2->e4 (row 6->4). EP e3 (row 5).
          // Pawn at e4 (row 4).
          // Black pawns at d4/f4 (row 4) can capture.
          // So row to check is epRow - 1.

          const epPawnRow = board.activeColor === 'w' ? epRow + 1 : epRow - 1;

          let hasPawn = false;
          const cols = [epCol - 1, epCol + 1];
          for (const c of cols) {
              if (c >= 0 && c <= 7) {
                  const idx = (epPawnRow << 4) | c;
                  const p = board.squares[idx];
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
