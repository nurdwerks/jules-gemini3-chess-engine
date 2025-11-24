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
      'queen': [-17, -15, 15, 17, -16, 16, -1, 1]
    };

    for (let i = 0; i < 128; i++) {
      if (!this.isValidSquare(i)) continue; // Skip 0x88 invalid squares

      const piece = this.squares[i];
      if (!piece || piece.color !== color) continue;

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
      // TODO: Implement Pawn, Knight, King
    }
    return moves;
  }

  isValidMove(start, end) {
    const startIndex = this.toIndex(start.row, start.col);
    const endIndex = this.toIndex(end.row, end.col);

    // Maintain pawn logic for now as it's not fully in generateMoves yet
    // Or we could implement pawn in generateMoves now?
    // The previous implementation was hardcoded.
    // Let's preserve the existing pawn logic for now to avoid regression on tests/movement.test.js
    // while we add sliding logic via generateMoves.

    if (!this.isValidSquare(startIndex) || !this.isValidSquare(endIndex)) return false;
    const piece = this.squares[startIndex];
    if (!piece) return false;

    // Use generateMoves for sliding pieces
    if (['rook', 'bishop', 'queen'].includes(piece.type)) {
      // We need to temporarily set activeColor to piece color if we want to use generateMoves
      // strictly, but isValidMove might be called for analysis.
      // Assuming isValidMove is for the side to move or we just force it.
      // But generateMoves relies on activeColor.
      const savedActive = this.activeColor;
      this.activeColor = piece.color === 'white' ? 'w' : 'b';
      const moves = this.generateMoves();
      this.activeColor = savedActive;

      return moves.some(m => m.from === startIndex && m.to === endIndex);
    }

    const rowDiff = end.row - start.row;
    const colDiff = end.col - start.col;

    if (piece.type === 'pawn') {
      if (piece.color === 'white') {
        // Basic move (White moves UP, so rowDiff is -1)
        if (colDiff === 0 && rowDiff === -1) return true;
        // Initial double move
        if (start.row === 6 && colDiff === 0 && rowDiff === -2) return true;
      } else {
        // Black pawn (Black moves DOWN, so rowDiff is 1)
        if (colDiff === 0 && rowDiff === 1) return true;
        if (start.row === 1 && colDiff === 0 && rowDiff === 2) return true;
      }
    }

    return false;
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
