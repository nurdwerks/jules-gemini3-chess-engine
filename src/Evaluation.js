// Piece values (centi-pawns)
const PIECE_VALUES = {
  'pawn': 100,
  'knight': 320,
  'bishop': 330,
  'rook': 500,
  'queen': 900,
  'king': 20000
};

const PARAMS = {
    DoubledPawnPenalty: 10,
    IsolatedPawnPenalty: 15,
    BackwardPawnPenalty: 10,
    MobilityBonus: 2,
    ShieldBonus: 5
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
        let whiteKingIndex = -1;
        let blackKingIndex = -1;

        for (let i = 0; i < 128; i++) {
            if (!board.isValidSquare(i)) continue;

            const piece = board.squares[i];
            if (!piece) continue;

            if (piece.type === 'king') {
                if (piece.color === 'white') whiteKingIndex = i;
                else blackKingIndex = i;
            }

            let value = PIECE_VALUES[piece.type];
            let pstValue = 0;
            let mobility = 0;

            // Mobility Bonus
            // We will count pseudo-legal moves for sliding pieces (Bishop, Rook, Queen).
            // This is expensive, so we keep it simple.
            if (['bishop', 'rook', 'queen', 'knight'].includes(piece.type)) {
                mobility = Evaluation.evaluateMobility(board, i, piece.type, piece.color);
            }

            // Advanced: Pawn Structure
            let pawnStructure = 0;
            if (piece.type === 'pawn') {
                 // Epic 20: Pawn Hash Probe could go here, but usually done globally for the pawn structure.
                 // Since evaluatePawnStructure() is per pawn, we'll keep it simple for now.
                 pawnStructure = Evaluation.evaluatePawnStructure(board, i, piece.color);
            }

            if (piece.color === 'white') {
                pstValue = PSTS[piece.type][i];
                score += (value + pstValue + pawnStructure + mobility);
            } else {
                const row = i >> 4;
                const col = i & 7;
                const flippedIndex = ((7 - row) << 4) | col;
                pstValue = PSTS[piece.type][flippedIndex];
                score -= (value + pstValue + pawnStructure + mobility);
            }
        }

        // Safety
        // Check if King is exposed (basic).
        // Or distance to enemy pieces?
        // Let's do a simple "King Shield" check if King is castled or in corner.
        // Checking king safety properly requires knowing pawn shield.
        if (whiteKingIndex !== -1) {
            score += Evaluation.evaluateKingSafety(board, whiteKingIndex, 'white');
        }
        if (blackKingIndex !== -1) {
            score -= Evaluation.evaluateKingSafety(board, blackKingIndex, 'black');
        }

        return board.activeColor === 'w' ? score : -score;
    }

    static updateParam(name, value) {
        // Handle piece values mapping (e.g. 'PawnValue' -> 'pawn')
        const map = {
            'PawnValue': 'pawn',
            'KnightValue': 'knight',
            'BishopValue': 'bishop',
            'RookValue': 'rook',
            'QueenValue': 'queen'
        };

        if (map[name] && PIECE_VALUES.hasOwnProperty(map[name])) {
             PIECE_VALUES[map[name]] = value;
             return;
        }

        if (PIECE_VALUES.hasOwnProperty(name)) {
             PIECE_VALUES[name] = value;
        }

        if (PARAMS.hasOwnProperty(name)) {
            PARAMS[name] = value;
        }
    }

    static getParams() {
        return { ...PIECE_VALUES, ...PARAMS };
    }

    static getParams() {
        return { ...PIECE_VALUES, ...PARAMS };
    }

    static evaluatePawnStructure(board, index, color) {
        let score = 0;
        const col = index & 7;
        const row = index >> 4;

        // Doubled Pawns (Penalty)
        // Check file for other pawns of same color
        // Just check if there's a pawn in front/behind (simple)
        const forward = color === 'white' ? -16 : 16;
        if (board.squares[index + forward] && board.squares[index + forward].type === 'pawn' && board.squares[index + forward].color === color) {
            score -= PARAMS.DoubledPawnPenalty; // Penalty for doubled
        }

        // Isolated Pawns (Penalty)
        // Check adjacent files for friendly pawns
        let hasNeighbor = false;
        const files = [col - 1, col + 1];
        for (const f of files) {
             if (f >= 0 && f <= 7) {
                 // Check entire file? Or just approximate.
                 // Iterating files is slow.
                 // Let's assume standard eval is fast enough.
                 for (let r = 0; r < 8; r++) {
                      const idx = (r << 4) | f;
                      const p = board.squares[idx];
                      if (p && p.type === 'pawn' && p.color === color) {
                          hasNeighbor = true;
                          break;
                      }
                 }
             }
        }
        if (!hasNeighbor) score -= PARAMS.IsolatedPawnPenalty;

        // Backward Pawns (Penalty)
        // A pawn is backward if:
        // 1. It has no friendly pawns on adjacent files that are further back or same rank.
        // 2. The square in front of it is controlled by an enemy pawn.
        // Simplified: Just check if it's behind neighbors and has semi-open file?
        // Or: No neighbor on adjacent files at rank >= current (for white).

        // White: rank increases UP (0-7 visually, but indices 112-0).
        // Board implementation: Row 0 is Rank 8. Row 7 is Rank 1.
        // White pawns move row 6 -> 5 -> ... -> 0. (Decreasing row index).
        // So "behind" means HIGHER row index.

        // Check adjacent files for pawns that are "ahead" (lower row index) or same.
        // If NO neighbor is behind or same, it might be backward?
        // Actually, definition: "No friendly pawn on an adjacent file is further advanced." -> No, that's passed.
        // Backward: "Behind all friendly pawns on adjacent files and cannot be safely advanced."

        // Let's implement simplified backward:
        // 1. Find most backward pawn on adjacent files.
        // If current pawn is BEHIND (higher row) all adjacent friendly pawns.
        // AND square in front is attacked by enemy pawn (or just blocked).

        if (hasNeighbor) { // Only relevant if neighbors exist (otherwise isolated)
            let isBehindAllNeighbors = true;
            for (const f of files) {
                if (f >= 0 && f <= 7) {
                    for (let r = 0; r < 8; r++) { // scan file
                        const idx = (r << 4) | f;
                        const p = board.squares[idx];
                        if (p && p.type === 'pawn' && p.color === color) {
                             // Check rank.
                             // White: Moves up (decreasing row).
                             // If neighbor row > current row (neighbor is behind), then we are NOT backward.
                             if (color === 'white') {
                                 if (r > row) isBehindAllNeighbors = false;
                             } else {
                                 // Black: Moves down (increasing row).
                                 // If neighbor row < current row (neighbor is behind), then we are NOT backward.
                                 if (r < row) isBehindAllNeighbors = false;
                             }
                        }
                    }
                }
            }
            if (isBehindAllNeighbors) {
                 score -= PARAMS.BackwardPawnPenalty;
            }
        }

        // Passed Pawn (Bonus)
        // A pawn is passed if there are no enemy pawns on the same file or adjacent files
        // that are "ahead" of the pawn.
        const enemyColor = color === 'white' ? 'black' : 'white';
        let isPassed = true;
        const checkFiles = [col - 1, col, col + 1];

        // Define "ahead" rows
        // White: rows 0 to row-1
        // Black: rows row+1 to 7
        const startRow = color === 'white' ? 0 : row + 1;
        const endRow = color === 'white' ? row - 1 : 7;

        // Optimized: Break early if loop range is invalid (though loop condition handles it)
        // Note: For White at row 0 (promotion), loop doesn't run, implicitly passed (but pawns promote).
        // Pawns only exist rows 1-6 normally.

        outerLoop:
        for (const f of checkFiles) {
             if (f < 0 || f > 7) continue;

             // Iterate rows ahead
             // We can just loop from startRow to endRow (inclusive if start <= end)
             // Careful with direction if start > end, but here startRow/endRow are computed correctly:
             // White: 0 to row-1. (Ascending ok)
             // Black: row+1 to 7. (Ascending ok)

             // Ensure loop runs correctly
             if (startRow <= endRow) {
                 for (let r = startRow; r <= endRow; r++) {
                     const idx = (r << 4) | f;
                     const p = board.squares[idx];
                     if (p && p.type === 'pawn' && p.color === enemyColor) {
                         isPassed = false;
                         break outerLoop;
                     }
                 }
             }
        }

        if (isPassed) {
            // Rank-based bonus
            // White: Rank 2 (row 6) is start. Rank 7 (row 1) is high.
            // Ranks 0-7.
            // visual Rank = 8 - row.
            // White visual Ranks: 2, 3, 4, 5, 6, 7.
            // Bonuses: [0, 0, 10, 20, 40, 80, 160, 0] (Index by visual rank)
            const PASSED_BONUS = [0, 0, 10, 20, 40, 80, 160, 0];

            const visualRank = 8 - row - 1; // 0-7 index (Row 7->Rank 1->Idx 0).
            // Wait. Row 0 is Rank 8. Row 7 is Rank 1.
            // White moves Row 6 -> Row 1.
            // Rank index for bonus:
            // Row 6 (Rank 2) -> Low bonus.
            // Row 1 (Rank 7) -> High bonus.

            let rankIdx = 0;
            if (color === 'white') {
                // Row 6 -> Rank 2. We want index 1 or 2?
                // Let's say index = Rank - 1.
                // Row 6 is Rank 2. Idx 1.
                // Row 1 is Rank 7. Idx 6.
                rankIdx = 7 - row;
            } else {
                // Black moves Row 1 -> Row 6.
                // Row 1 (Rank 7) -> Base.
                // Row 6 (Rank 2) -> Advanced.
                // Wait, Black advances Row 1 -> Row 6.
                // Row 1 is starting position for black pawns.
                // Row 6 is close to promotion.
                rankIdx = row;
            }

            // Safety clamp
            if (rankIdx < 0) rankIdx = 0;
            if (rankIdx > 7) rankIdx = 7;

            score += PASSED_BONUS[rankIdx];
        }

        return score;
    }

    static evaluateMobility(board, index, type, color) {
        let count = 0;

        const offsets = {
          'rook': [-16, 16, -1, 1],
          'bishop': [-17, -15, 15, 17],
          'queen': [-17, -15, 15, 17, -16, 16, -1, 1],
          'knight': [-33, -31, -18, -14, 14, 18, 31, 33]
        };

        const directions = offsets[type];
        if (!directions) return 0;

        const isSliding = ['rook', 'bishop', 'queen'].includes(type);

        for (const dir of directions) {
             if (isSliding) {
                 let target = index + dir;
                 while (board.isValidSquare(target)) {
                     if (!board.squares[target]) {
                         count++;
                     } else {
                         // Capture or blocked. Count if capture?
                         // Mobility usually counts safe squares.
                         // Simplified: Just count empty + 1 (capture).
                         count++;
                         break;
                     }
                     target += dir;
                 }
             } else {
                 const target = index + dir;
                 if (board.isValidSquare(target)) {
                     const p = board.squares[target];
                     if (!p || p.color !== color) {
                         count++;
                     }
                 }
             }
        }

        return count * PARAMS.MobilityBonus;
    }

    static evaluateKingSafety(board, kingIndex, color) {
        let score = 0;
        const row = kingIndex >> 4;
        const col = kingIndex & 7;
        const forward = color === 'white' ? -1 : 1; // Rank direction (white rows decrease)

        // Pawn Shield
        // Check squares in front of King
        // If King is on g1 (col 6, row 7), check f2, g2, h2 (col 5,6,7 row 6).
        // Index diffs: -17, -16, -15 (for white)
        const shieldOffsets = color === 'white' ? [-17, -16, -15] : [15, 16, 17];

        let shieldCount = 0;
        for (const offset of shieldOffsets) {
            const shieldSq = kingIndex + offset;
            if (board.isValidSquare(shieldSq)) {
                const p = board.squares[shieldSq];
                if (p && p.type === 'pawn' && p.color === color) {
                    shieldCount++;
                }
            }
        }

        // Bonus for full shield
        score += shieldCount * PARAMS.ShieldBonus;

        // Penalty for open file if King is on it
        // Check if file is open (no pawns).
        // Too expensive to loop whole file?

        return score;
    }
}

module.exports = Evaluation;
