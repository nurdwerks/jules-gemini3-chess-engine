const Piece = require('./Piece');

class Board {
  constructor() {
    this.squares = new Array(128).fill(null);
    this.activeColor = 'w';
    this.castlingRights = 'KQkq';
    this.enPassantTarget = '-';
    this.halfMoveClock = 0;
    this.fullMoveNumber = 1;
    this.setupBoard();
  }

  // Helper: Convert row/col to 0x88 index
  toIndex(row, col) {
    return (row << 4) | col;
  }

  // Helper: Convert 0x88 index to row/col
  toRowCol(index) {
    return {
      row: index >> 4,
      col: index & 7
    };
  }

  // Helper: Check if index is on the board
  isValidSquare(index) {
    return (index & 0x88) === 0;
  }

  // Helper: Place a piece at a specific row/col (mainly for tests/setup)
  placePiece(row, col, piece) {
    const index = this.toIndex(row, col);
    if (this.isValidSquare(index)) {
      this.squares[index] = piece;
    }
  }

  setupBoard() {
    const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    this.loadFen(START_FEN);
  }

  getPiece(row, col) {
    const index = this.toIndex(row, col);
    if (!this.isValidSquare(index)) return null;
    return this.squares[index];
  }

  generateMoves() {
    const moves = [];
    const color = this.activeColor === 'w' ? 'white' : 'black';
    const opponent = this.activeColor === 'w' ? 'black' : 'white';

    // Offsets
    const offsets = {
      'rook': [-16, 16, -1, 1],
      'bishop': [-17, -15, 15, 17],
      'queen': [-17, -15, 15, 17, -16, 16, -1, 1],
      'knight': [-33, -31, -18, -14, 14, 18, 31, 33],
      'king': [-17, -16, -15, -1, 1, 15, 16, 17]
    };

    for (let i = 0; i < 128; i++) {
      if (!this.isValidSquare(i)) continue; // Skip 0x88 invalid squares

      const piece = this.squares[i];
      if (!piece || piece.color !== color) continue;

      // Sliding pieces
      if (['rook', 'bishop', 'queen'].includes(piece.type)) {
        const directions = offsets[piece.type];
        for (const dir of directions) {
          let target = i + dir;
          while (this.isValidSquare(target)) {
            const targetPiece = this.squares[target];
            if (!targetPiece) {
              // Quiet move
              moves.push({ from: i, to: target, flags: 'n', piece: piece });
            } else {
              if (targetPiece.color === opponent) {
                // Capture
                moves.push({ from: i, to: target, flags: 'c', piece: piece, captured: targetPiece });
              }
              // Blocked (either by own or enemy after capture)
              break;
            }
            target += dir;
          }
        }
      }
      // Stepping pieces (Knight, King)
      else if (['knight', 'king'].includes(piece.type)) {
        const directions = offsets[piece.type];
        for (const dir of directions) {
          const target = i + dir;
          if (this.isValidSquare(target)) {
            const targetPiece = this.squares[target];
            if (!targetPiece) {
              // Quiet move
              moves.push({ from: i, to: target, flags: 'n', piece: piece });
            } else if (targetPiece.color === opponent) {
              // Capture
              moves.push({ from: i, to: target, flags: 'c', piece: piece, captured: targetPiece });
            }
          }
        }
      }
      // Pawn
      else if (piece.type === 'pawn') {
        const isWhite = piece.color === 'white';
        const forward = isWhite ? -16 : 16;
        const startRank = isWhite ? 6 : 1;
        const currentRow = i >> 4;

        // Single push
        const targetSingle = i + forward;
        if (this.isValidSquare(targetSingle) && !this.squares[targetSingle]) {
          moves.push({ from: i, to: targetSingle, flags: 'n', piece: piece });

          // Double push
          const targetDouble = i + (forward * 2);
          if (currentRow === startRank && this.isValidSquare(targetDouble) && !this.squares[targetDouble]) {
            moves.push({ from: i, to: targetDouble, flags: 'n', piece: piece });
          }
        }

        // Captures
        const captureOffsets = isWhite ? [-17, -15] : [15, 17];
        for (const capOffset of captureOffsets) {
          const targetCap = i + capOffset;
          if (this.isValidSquare(targetCap)) {
            const targetPiece = this.squares[targetCap];
            if (targetPiece && targetPiece.color === opponent) {
               moves.push({ from: i, to: targetCap, flags: 'c', piece: piece, captured: targetPiece });
            }
          }
        }
      }
    }
    return moves;
  }

  isValidMove(start, end) {
    const startIndex = this.toIndex(start.row, start.col);
    const endIndex = this.toIndex(end.row, end.col);

    if (!this.isValidSquare(startIndex) || !this.isValidSquare(endIndex)) return false;
    const piece = this.squares[startIndex];
    if (!piece) return false;

    // Use generateMoves for all pieces now
    const savedActive = this.activeColor;
    this.activeColor = piece.color === 'white' ? 'w' : 'b';
    const moves = this.generateMoves();
    this.activeColor = savedActive;

    return moves.some(m => m.from === startIndex && m.to === endIndex);
  }

  loadFen(fen) {
    const parts = fen.split(' ');
    if (parts.length !== 6) {
      throw new Error('Invalid FEN string: Must have 6 fields.');
    }

    const [placement, activeColor, castling, enPassant, halfMove, fullMove] = parts;

    // 1. Piece Placement
    this.squares.fill(null);
    const rows = placement.split('/');
    if (rows.length !== 8) {
      throw new Error('Invalid FEN string: Must have 8 ranks.');
    }

    const pieceMap = {
      'p': { type: 'pawn', color: 'black' },
      'n': { type: 'knight', color: 'black' },
      'b': { type: 'bishop', color: 'black' },
      'r': { type: 'rook', color: 'black' },
      'q': { type: 'queen', color: 'black' },
      'k': { type: 'king', color: 'black' },
      'P': { type: 'pawn', color: 'white' },
      'N': { type: 'knight', color: 'white' },
      'B': { type: 'bishop', color: 'white' },
      'R': { type: 'rook', color: 'white' },
      'Q': { type: 'queen', color: 'white' },
      'K': { type: 'king', color: 'white' }
    };

    for (let r = 0; r < 8; r++) {
      let col = 0;
      const rowString = rows[r];
      for (let i = 0; i < rowString.length; i++) {
        const char = rowString[i];
        if (char >= '1' && char <= '8') {
          col += parseInt(char, 10);
        } else if (pieceMap[char]) {
            if (col > 7) throw new Error('Invalid FEN string: Too many pieces in rank.');
            this.placePiece(r, col, new Piece(pieceMap[char].color, pieceMap[char].type));
            col++;
        } else {
            throw new Error(`Invalid FEN string: Unknown character '${char}'.`);
        }
      }
      if (col !== 8) throw new Error(`Invalid FEN string: Rank ${r} does not sum to 8 columns.`);
    }

    // 2. Active Color
    if (activeColor !== 'w' && activeColor !== 'b') {
        throw new Error('Invalid FEN string: Invalid active color.');
    }
    this.activeColor = activeColor;

    // 3. Castling Rights
    // Basic validation could be improved, but this suffices for now
    this.castlingRights = castling;

    // 4. En Passant Target
    this.enPassantTarget = enPassant;

    // 5. Halfmove Clock
    this.halfMoveClock = parseInt(halfMove, 10);

    // 6. Fullmove Number
    this.fullMoveNumber = parseInt(fullMove, 10);
  }

  generateFen() {
    let placement = '';
    for (let r = 0; r < 8; r++) {
      let emptyCount = 0;
      for (let c = 0; c < 8; c++) {
        const piece = this.getPiece(r, c);
        if (piece) {
          if (emptyCount > 0) {
            placement += emptyCount;
            emptyCount = 0;
          }
          let char = '';
          switch (piece.type) {
            case 'pawn': char = 'p'; break;
            case 'knight': char = 'n'; break;
            case 'bishop': char = 'b'; break;
            case 'rook': char = 'r'; break;
            case 'queen': char = 'q'; break;
            case 'king': char = 'k'; break;
          }
          if (piece.color === 'white') {
            char = char.toUpperCase();
          }
          placement += char;
        } else {
          emptyCount++;
        }
      }
      if (emptyCount > 0) {
        placement += emptyCount;
      }
      if (r < 7) {
        placement += '/';
      }
    }

    return `${placement} ${this.activeColor} ${this.castlingRights} ${this.enPassantTarget} ${this.halfMoveClock} ${this.fullMoveNumber}`;
  }
}

module.exports = Board;
