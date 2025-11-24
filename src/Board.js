const Piece = require('./Piece');

class Board {
  constructor() {
    this.grid = Array(8).fill(null).map(() => Array(8).fill(null));
    this.setupBoard();
  }

  setupBoard() {
    // Setup Pawns
    for (let i = 0; i < 8; i++) {
      this.grid[6][i] = new Piece('white', 'pawn');
      this.grid[1][i] = new Piece('black', 'pawn');
    }

    // Setup Rooks
    this.grid[7][0] = new Piece('white', 'rook');
    this.grid[7][7] = new Piece('white', 'rook');
    this.grid[0][0] = new Piece('black', 'rook');
    this.grid[0][7] = new Piece('black', 'rook');

    // Setup Knights, Bishops, Queens, Kings can be added as needed or for completeness
  }

  getPiece(row, col) {
    return this.grid[row][col];
  }

  isValidMove(start, end) {
    const piece = this.getPiece(start.row, start.col);
    if (!piece) return false;

    // Check bounds
    if (end.row < 0 || end.row > 7 || end.col < 0 || end.col > 7) return false;

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
