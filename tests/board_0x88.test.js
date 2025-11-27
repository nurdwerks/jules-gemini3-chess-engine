const Board = require('../src/Board');

describe('0x88 Board Representation', () => {
  let board;

  beforeEach(() => {
    board = new Board();
  });


  test('isValidSquare should correctly identify on-board squares', () => {
    // Valid squares: 0x00-0x07, 0x10-0x17, ..., 0x70-0x77

    // Test some valid squares
    expect(board.isValidSquare(0x00)).toBe(true); // a8
    expect(board.isValidSquare(0x07)).toBe(true); // h8
    expect(board.isValidSquare(0x70)).toBe(true); // a1
    expect(board.isValidSquare(0x77)).toBe(true); // h1
    expect(board.isValidSquare(0x33)).toBe(true); // d5 (approx)

    // Test some invalid squares (off the board to the right)
    expect(board.isValidSquare(0x08)).toBe(false);
    expect(board.isValidSquare(0x1F)).toBe(false);

    // Test some invalid squares (off the board vertically - in the gap)
    // Actually in 0x88, the "vertical" off-board is naturally handled if we stay within 0-127,
    // but the 0x88 logic specifically checks the 0x88 bit.
    // 0x88 (136) is out of bounds of the array length 128 usually, but let's see implementation.
    // Standard 0x88 array is size 128.
    // Indices like 0x88 are >= 128, so they are out of bounds of the array.
    // But isValidSquare might just check (index & 0x88) === 0.
    // If index is 128 (0x80), 0x80 & 0x88 = 0x80 != 0. Correct.
    expect(board.isValidSquare(0x88)).toBe(false);
  });

  test('toIndex should convert row/col to 0x88 index', () => {
    // Row 0, Col 0 -> 0x00
    expect(board.toIndex(0, 0)).toBe(0x00);
    // Row 0, Col 7 -> 0x07
    expect(board.toIndex(0, 7)).toBe(0x07);
    // Row 1, Col 0 -> 0x10 (16)
    expect(board.toIndex(1, 0)).toBe(0x10);
    // Row 7, Col 7 -> 0x77
    expect(board.toIndex(7, 7)).toBe(0x77);
  });

  test('toRowCol should convert 0x88 index to row/col', () => {
    expect(board.toRowCol(0x00)).toEqual({ row: 0, col: 0 });
    expect(board.toRowCol(0x77)).toEqual({ row: 7, col: 7 });
    expect(board.toRowCol(0x10)).toEqual({ row: 1, col: 0 });
  });

  test('Board setup should place pieces in correct 0x88 indices', () => {
    // White Rooks at 7,0 (0x70) and 7,7 (0x77)
    expect(board.getPiece(0x70)).not.toBeNull();
    expect(board.getPiece(0x70).type).toBe('rook');
    expect(board.getPiece(0x70).color).toBe('white');

    expect(board.getPiece(0x77)).not.toBeNull();
    expect(board.getPiece(0x77).type).toBe('rook');

    // Black Rooks at 0,0 (0x00) and 0,7 (0x07)
    expect(board.getPiece(0x00)).not.toBeNull();
    expect(board.getPiece(0x00).type).toBe('rook');
    expect(board.getPiece(0x00).color).toBe('black');
  });
});
