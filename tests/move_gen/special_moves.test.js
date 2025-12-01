const Board = require('../../src/engine/Board')

describe('Special Moves', () => {
  let board

  beforeEach(() => {
    board = new Board()
  })

  describe('Castling', () => {
    test('White Kingside Castling', () => {
      // White King at e1, Rook at h1, empty f1, g1. Rights K.
      board.loadFen('r3k2r/8/8/8/8/8/8/R3K2R w K - 0 1')
      const moves = board.generateMoves()
      // e1 is 7,4 (index 116). g1 is 7,6 (index 118).
      // 7<<4 | 6 = 112 | 6 = 118.
      const castlingMove = moves.find(m => m.from === 116 && m.to === 118)
      expect(castlingMove).toBeDefined()
      expect(castlingMove.flags).toBe('k') // k for kingside castling
    })

    test('White Queenside Castling', () => {
      // White King at e1, Rook at a1, empty b1, c1, d1. Rights Q.
      board.loadFen('r3k2r/8/8/8/8/8/8/R3K2R w Q - 0 1')
      const moves = board.generateMoves()
      // e1 is 7,4 (116). c1 is 7,2 (114).
      const castlingMove = moves.find(m => m.from === 116 && m.to === 114)
      expect(castlingMove).toBeDefined()
      expect(castlingMove.flags).toBe('q') // q for queenside castling
    })

    test('Black Kingside Castling', () => {
      // Black King at e8, Rook at h8. Rights k.
      board.loadFen('r3k2r/8/8/8/8/8/8/R3K2R b k - 0 1')
      const moves = board.generateMoves()
      // e8 is 0,4 (4). g8 is 0,6 (6).
      const castlingMove = moves.find(m => m.from === 4 && m.to === 6)
      expect(castlingMove).toBeDefined()
      expect(castlingMove.flags).toBe('k')
    })

    test('Black Queenside Castling', () => {
      // Black King at e8, Rook at a8. Rights q.
      board.loadFen('r3k2r/8/8/8/8/8/8/R3K2R b q - 0 1')
      const moves = board.generateMoves()
      // e8 is 0,4 (4). c8 is 0,2 (2).
      const castlingMove = moves.find(m => m.from === 4 && m.to === 2)
      expect(castlingMove).toBeDefined()
      expect(castlingMove.flags).toBe('q')
    })

    test('Castling Blocked', () => {
      // White King e1, Rook h1, Bishop on f1. Rights K.
      board.loadFen('r3k2r/8/8/8/8/8/8/R3KB1R w K - 0 1')
      const moves = board.generateMoves()
      const castlingMove = moves.find(m => m.from === 116 && m.to === 118)
      expect(castlingMove).toBeUndefined()
    })

    test('Castling Rights Missing', () => {
      // Position valid for castling but no rights.
      board.loadFen('r3k2r/8/8/8/8/8/8/R3K2R w - - 0 1')
      const moves = board.generateMoves()
      const castlingMove = moves.find(m => m.from === 116 && m.to === 118)
      expect(castlingMove).toBeUndefined()
    })
  })

  describe('Promotion', () => {
    test('White Pawn Promotion', () => {
      // White Pawn on a7 (Row 1, Col 0). Move to a8 (Row 0, Col 0).
      board.loadFen('8/P7/8/8/8/8/8/k6K w - - 0 1')
      const moves = board.generateMoves()

      // From a7 (1,0 -> 16) to a8 (0,0 -> 0).
      const promoMoves = moves.filter(m => m.from === 16 && m.to === 0)

      // Should have 4 moves (Q, R, B, N)
      expect(promoMoves.length).toBe(4)

      const types = promoMoves.map(m => m.promotion).sort()
      expect(types).toEqual(['b', 'n', 'q', 'r'])
      expect(promoMoves[0].flags).toBe('p') // p for promotion
    })

    test('Promotion with check', () => {
      // White Pawn on d7, Black King on f8. Move to d8, promote to Q. Checks King.
      board.loadFen('5k2/3P4/8/8/8/8/8/K7 w - - 0 1')
      const moves = board.generateMoves()
      // d7 (1,3 -> 19) to d8 (0,3 -> 3)
      const promoMoves = moves.filter(m => m.from === 19 && m.to === 3)
      expect(promoMoves.length).toBe(4) // Q,R,B,N

      // Find Queen promotion
      const queenPromo = promoMoves.find(m => m.promotion === 'q')
      expect(queenPromo).toBeDefined()

      // Apply the move
      board.applyMove(queenPromo)

      // Check if black king is in check
      expect(board.isInCheck()).toBe(true)
    })

    test('Promotion to escape check', () => {
      // King on c8 is checked by a rook on a8. A pawn on b7 can promote to b8, blocking the check.
      board.loadFen('r1K5/1P6/8/8/8/8/8/8 w - - 0 1')

      // Verify white is in check
      expect(board.isInCheck()).toBe(true)
      const moves = board.generateMoves()

      // b7 (1,1 -> 17) to b8 (0,1 -> 1)
      const promoMoves = moves.filter(m => m.from === 17 && m.to === 1)
      expect(promoMoves.length).toBe(4) // Q, R, B, N

      // Find Queen promotion
      const queenPromo = promoMoves.find(m => m.promotion === 'q')
      expect(queenPromo).toBeDefined()

      // Apply the move
      board.applyMove(queenPromo)

      // White should no longer be in check
      expect(board.isInCheck()).toBe(false)
    })

    test('Illegal promotion (exposes king to check)', () => {
      // White King on e1, Black Rook on e8, White pawn on d7.
      // Promoting d7 to d8 would expose king on e1 to check from rook on e8.
      board.loadFen('4r3/3P4/8/8/8/8/8/4K3 w - - 0 1')
      const moves = board.generateMoves()

      // d7 (1,3 -> 19) to d8 (0,3 -> 3)
      const promoMove = moves.find(m => m.from === 19 && m.to === 3)

      // This move should not be generated because it is illegal
      expect(promoMove).toBeUndefined()
    })
  })
})
