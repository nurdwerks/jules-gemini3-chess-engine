const Piece = require('./Piece');

class Board {
  constructor() {
    this.squares = new Array(128).fill(null);
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
    // Setup Pawns
    for (let i = 0; i < 8; i++) {
      this.placePiece(6, i, new Piece('white', 'pawn'));
      this.placePiece(1, i, new Piece('black', 'pawn'));
    }

    // Setup Rooks
    this.placePiece(7, 0, new Piece('white', 'rook'));
    this.placePiece(7, 7, new Piece('white', 'rook'));
    this.placePiece(0, 0, new Piece('black', 'rook'));
    this.placePiece(0, 7, new Piece('black', 'rook'));

    // Setup Knights, Bishops, Queens, Kings can be added as needed or for completeness
  }

  getPiece(row, col) {
    const index = this.toIndex(row, col);
    if (!this.isValidSquare(index)) return null;
    return this.squares[index];
  }

  isValidMove(start, end) {
    const startIndex = this.toIndex(start.row, start.col);
    const endIndex = this.toIndex(end.row, end.col);

    if (!this.isValidSquare(startIndex) || !this.isValidSquare(endIndex)) return false;

    const piece = this.squares[startIndex];
    if (!piece) return false;

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
}

module.exports = Board;
