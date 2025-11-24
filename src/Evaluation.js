// Piece values (centi-pawns)
const PIECE_VALUES = {
  'pawn': 100,
  'knight': 320,
  'bishop': 330,
  'rook': 500,
  'queen': 900,
  'king': 20000
};

// Simplified PSTs (from flipped perspective for black? Or always from white perspective and flip index?)
// Commonly, PSTs are defined for White. For Black, we mirror the rank and file (index ^ 56 for vertical flip, but 0x88 is different).
// 0x88 Board: 0-7 (Rank 8), ..., 112-119 (Rank 1).
// Let's define tables for White (Rank 1 at bottom indices 112-119).
// Wait, 0x88 index 0 is a8.
// If I define the table as an array of 64, I need to map it.
// Let's just use 128-sized arrays for simplicity, filling invalid squares with 0.

// White Pawn PST (Encourages pushing, center control)
const PAWN_PST = [
    0,  0,  0,  0,  0,  0,  0,  0,    0,0,0,0,0,0,0,0, // Rank 8 (Promoted)
   50, 50, 50, 50, 50, 50, 50, 50,    0,0,0,0,0,0,0,0, // Rank 7
   10, 10, 20, 30, 30, 20, 10, 10,    0,0,0,0,0,0,0,0, // Rank 6
    5,  5, 10, 25, 25, 10,  5,  5,    0,0,0,0,0,0,0,0, // Rank 5
    0,  0,  0, 20, 20,  0,  0,  0,    0,0,0,0,0,0,0,0, // Rank 4
    5, -5,-10,  0,  0,-10, -5,  5,    0,0,0,0,0,0,0,0, // Rank 3
    5, 10, 10,-20,-20, 10, 10,  5,    0,0,0,0,0,0,0,0, // Rank 2
    0,  0,  0,  0,  0,  0,  0,  0,    0,0,0,0,0,0,0,0  // Rank 1
];

const KNIGHT_PST = [
    -50,-40,-30,-30,-30,-30,-40,-50,  0,0,0,0,0,0,0,0,
    -40,-20,  0,  0,  0,  0,-20,-40,  0,0,0,0,0,0,0,0,
    -30,  0, 10, 15, 15, 10,  0,-30,  0,0,0,0,0,0,0,0,
    -30,  5, 15, 20, 20, 15,  5,-30,  0,0,0,0,0,0,0,0,
    -30,  0, 15, 20, 20, 15,  0,-30,  0,0,0,0,0,0,0,0,
    -30,  5, 10, 15, 15, 10,  5,-30,  0,0,0,0,0,0,0,0,
    -40,-20,  0,  5,  5,  0,-20,-40,  0,0,0,0,0,0,0,0,
    -50,-40,-30,-30,-30,-30,-40,-50,  0,0,0,0,0,0,0,0
];

const BISHOP_PST = [
    -20,-10,-10,-10,-10,-10,-10,-20,  0,0,0,0,0,0,0,0,
    -10,  0,  0,  0,  0,  0,  0,-10,  0,0,0,0,0,0,0,0,
    -10,  0,  5, 10, 10,  5,  0,-10,  0,0,0,0,0,0,0,0,
    -10,  5,  5, 10, 10,  5,  5,-10,  0,0,0,0,0,0,0,0,
    -10,  0, 10, 10, 10, 10,  0,-10,  0,0,0,0,0,0,0,0,
    -10, 10, 10, 10, 10, 10, 10,-10,  0,0,0,0,0,0,0,0,
    -10,  5,  0,  0,  0,  0,  5,-10,  0,0,0,0,0,0,0,0,
    -20,-10,-10,-10,-10,-10,-10,-20,  0,0,0,0,0,0,0,0
];

const ROOK_PST = [
      0,  0,  0,  0,  0,  0,  0,  0,  0,0,0,0,0,0,0,0,
      5, 10, 10, 10, 10, 10, 10,  5,  0,0,0,0,0,0,0,0,
     -5,  0,  0,  0,  0,  0,  0, -5,  0,0,0,0,0,0,0,0,
     -5,  0,  0,  0,  0,  0,  0, -5,  0,0,0,0,0,0,0,0,
     -5,  0,  0,  0,  0,  0,  0, -5,  0,0,0,0,0,0,0,0,
     -5,  0,  0,  0,  0,  0,  0, -5,  0,0,0,0,0,0,0,0,
     -5,  0,  0,  0,  0,  0,  0, -5,  0,0,0,0,0,0,0,0,
      0,  0,  0,  5,  5,  0,  0,  0,  0,0,0,0,0,0,0,0
];

const QUEEN_PST = [
    -20,-10,-10, -5, -5,-10,-10,-20,  0,0,0,0,0,0,0,0,
    -10,  0,  0,  0,  0,  0,  0,-10,  0,0,0,0,0,0,0,0,
    -10,  0,  5,  5,  5,  5,  0,-10,  0,0,0,0,0,0,0,0,
     -5,  0,  5,  5,  5,  5,  0, -5,  0,0,0,0,0,0,0,0,
      0,  0,  5,  5,  5,  5,  0, -5,  0,0,0,0,0,0,0,0,
    -10,  5,  5,  5,  5,  5,  0,-10,  0,0,0,0,0,0,0,0,
    -10,  0,  5,  0,  0,  0,  0,-10,  0,0,0,0,0,0,0,0,
    -20,-10,-10, -5, -5,-10,-10,-20,  0,0,0,0,0,0,0,0
];

const KING_PST_MIDGAME = [
    -30,-40,-40,-50,-50,-40,-40,-30,  0,0,0,0,0,0,0,0,
    -30,-40,-40,-50,-50,-40,-40,-30,  0,0,0,0,0,0,0,0,
    -30,-40,-40,-50,-50,-40,-40,-30,  0,0,0,0,0,0,0,0,
    -30,-40,-40,-50,-50,-40,-40,-30,  0,0,0,0,0,0,0,0,
    -20,-30,-30,-40,-40,-30,-30,-20,  0,0,0,0,0,0,0,0,
    -10,-20,-20,-20,-20,-20,-20,-10,  0,0,0,0,0,0,0,0,
     20, 20,  0,  0,  0,  0, 20, 20,  0,0,0,0,0,0,0,0,
     20, 30, 10,  0,  0, 10, 30, 20,  0,0,0,0,0,0,0,0
];

const PSTS = {
    'pawn': PAWN_PST,
    'knight': KNIGHT_PST,
    'bishop': BISHOP_PST,
    'rook': ROOK_PST,
    'queen': QUEEN_PST,
    'king': KING_PST_MIDGAME
};

class Evaluation {
    static evaluate(board) {
        let score = 0;

        for (let i = 0; i < 128; i++) {
            if (!board.isValidSquare(i)) continue;

            const piece = board.squares[i];
            if (!piece) continue;

            let value = PIECE_VALUES[piece.type];
            let pstValue = 0;

            if (piece.color === 'white') {
                // White uses table directly
                // However, my tables are defined from top (rank 8, index 0) to bottom (rank 1, index 112).
                // Index 0 in 0x88 is a8.
                // My visual tables match this layout (row 0 is rank 8).
                pstValue = PSTS[piece.type][i];
                score += (value + pstValue);
            } else {
                // Black
                // We need to mirror the index vertically.
                // Row 0 (0-7) -> Row 7 (112-119)
                // Row r -> Row 7-r
                // Col c -> Col c (Mirror horizontally? Usually not for simple pieces, but Kingside/Queenside matters.
                // Let's assume symmetric or just flip vertical for now.)
                // Standard: Flip vertical.
                // 0x88 index: row = i >> 4, col = i & 7.
                // Flipped row = 7 - row.
                // Flipped index = (7 - row) * 16 + col.

                const row = i >> 4;
                const col = i & 7;
                const flippedIndex = ((7 - row) << 4) | col;

                pstValue = PSTS[piece.type][flippedIndex];
                score -= (value + pstValue);
            }
        }

        return board.activeColor === 'w' ? score : -score;
    }
}

module.exports = Evaluation;
