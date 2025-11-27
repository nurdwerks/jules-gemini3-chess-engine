const fs = require('fs');
const path = require('path');
const PawnHash = require('./PawnHash');
const Bitboard = require('./Bitboard');

// Pawn Hash Global Instance (Should be in Search or Board, but Evaluation is static?)
// Evaluation is static, so we need a singleton or passed instance.
// For now, singleton here.
const pawnHash = new PawnHash(16); // 16MB default

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
    KnightMobilityBonus: 1,
    BishopMobilityBonus: 2,
    RookMobilityBonus: 2,
    QueenMobilityBonus: 3,
    ShieldBonus: 5,
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

const FILE_MASKS = [
    0x0101010101010101n, 0x0202020202020202n, 0x0404040404040404n, 0x0808080808080808n,
    0x1010101010101010n, 0x2020202020202020n, 0x4040404040404040n, 0x8080808080808080n
];

const RANK_MASKS = [
    0xFFn, 0xFF00n, 0xFF0000n, 0xFF000000n,
    0xFF00000000n, 0xFF0000000000n, 0xFF000000000000n, 0xFF00000000000000n
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
    static {
        // Static initializer block to load tuned parameters
        try {
            const paramsPath = path.join(__dirname, '..', 'tuned_evaluation_params.json');
            if (fs.existsSync(paramsPath)) {
                console.log("Loading tuned evaluation parameters...");
                const tunedParams = JSON.parse(fs.readFileSync(paramsPath, 'utf8'));
                for (const key in tunedParams) {
                    this.updateParam(key, tunedParams[key]);
                }
            }
        } catch (error) {
            console.error('Error loading tuned parameters, using defaults:', error);
        }
    }

    static isPassedPawn(board, squareIndex) {
        const piece = board.getPiece(squareIndex);
        if (!piece || piece.type !== 'pawn') {
            return false;
        }

        const color = piece.color;
        const opponentColor = color === 'white' ? 'black' : 'white';
        const sq64 = Bitboard.to64(squareIndex);
        const rank = Math.floor(sq64 / 8);
        const col = sq64 % 8;

        let fileMask = FILE_MASKS[col];
        if (col > 0) {
            fileMask |= FILE_MASKS[col - 1];
        }
        if (col < 7) {
            fileMask |= FILE_MASKS[col + 1];
        }

        let rankMask = 0n;
        if (color === 'white') {
            for (let r = rank + 1; r < 8; r++) {
                rankMask |= RANK_MASKS[r];
            }
        } else {
            for (let r = 0; r < rank; r++) {
                rankMask |= RANK_MASKS[r];
            }
        }

        const finalMask = fileMask & rankMask;
        const opponentPawns = board.bitboards.pawn & board.bitboards[opponentColor];

        return (finalMask & opponentPawns) === 0n;
    }

    static evaluate(board) {
        let score = 0;
        let whiteKingIndex = -1;
        let blackKingIndex = -1;

        for (const color of ['white', 'black']) {
            for (const type of ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']) {
                let bb = board.bitboards[type] & board.bitboards[color];
                while (bb) {
                    const sq64 = Bitboard.lsb(bb);
                    const row = 7 - Math.floor(sq64 / 8);
                    const col = sq64 % 8;
                    const i = (row << 4) | col;

                    if (type === 'king') {
                        if (color === 'white') whiteKingIndex = i;
                        else blackKingIndex = i;
                    }

                    let value = PIECE_VALUES[type];
                    let pstValue = 0;
                    let mobility = 0;

                    if (['knight', 'bishop', 'rook', 'queen'].includes(type)) {
                        mobility = Evaluation.evaluateMobility(board, i, type, color);
                    }

                    let pawnStructure = 0;
                    if (type === 'pawn') {
                         pawnStructure = Evaluation.evaluatePawnStructure(board, i, color);
                    }

                    if (color === 'white') {
                        pstValue = PSTS[type][i];
                        score += (value + pstValue + pawnStructure + mobility);
                    } else {
                        const flippedIndex = ((7 - row) << 4) | col;
                        pstValue = PSTS[type][flippedIndex];
                        score -= (value + pstValue + pawnStructure + mobility);
                    }

                    bb &= (bb - 1n);
                }
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
        const frontPiece = board.getPiece(index + forward);
        if (frontPiece && frontPiece.type === 'pawn' && frontPiece.color === color) {
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
                      const p = board.getPiece(idx);
                      if (p && p.type === 'pawn' && p.color === color) {
                          hasNeighbor = true;
                          break;
                      }
                 }
             }
        }
        if (!hasNeighbor) score -= PARAMS.IsolatedPawnPenalty;

        // Backward Pawns (Penalty)
        if (hasNeighbor) { // Only relevant if neighbors exist (otherwise isolated)
            let isBehindAllNeighbors = true;
            for (const f of files) {
                if (f >= 0 && f <= 7) {
                    for (let r = 0; r < 8; r++) { // scan file
                        const idx = (r << 4) | f;
                        const p = board.getPiece(idx);
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
                     const p = board.getPiece(idx);
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
        const r = 7 - (index >> 4);
        const c = index & 7;
        const sq = r * 8 + c;
        if (sq < 0 || sq > 63) return 0;

        const occupancy = board.bitboards.white | board.bitboards.black;
        const friendlyPieces = board.bitboards[color];
        const opponent = color === 'white' ? 'black' : 'white';

        let attack_squares = 0n;
        switch (type) {
            case 'knight':
                attack_squares = Bitboard.getKnightAttacks(sq);
                break;
            case 'bishop':
                attack_squares = Bitboard.getBishopAttacks(sq, occupancy);
                break;
            case 'rook':
                attack_squares = Bitboard.getRookAttacks(sq, occupancy);
                break;
            case 'queen':
                attack_squares = Bitboard.getBishopAttacks(sq, occupancy) | Bitboard.getRookAttacks(sq, occupancy);
                break;
        }

        attack_squares &= ~friendlyPieces;

        let safe_squares_count = 0;
        while (attack_squares) {
            const toSq = Bitboard.lsb(attack_squares);
            const bbRow = Math.floor(toSq / 8);
            const bbCol = toSq % 8;
            const boardRow = 7 - bbRow;
            const to0x88 = (boardRow << 4) | bbCol;

            if (!board.isSquareAttacked(to0x88, opponent)) {
                safe_squares_count++;
            }

            attack_squares &= (attack_squares - 1n);
        }

        const mobility = safe_squares_count;
        switch (type) {
            case 'knight':
                return mobility * PARAMS.KnightMobilityBonus;
            case 'bishop':
                return mobility * PARAMS.BishopMobilityBonus;
            case 'rook':
                return mobility * PARAMS.RookMobilityBonus;
            case 'queen':
                return mobility * PARAMS.QueenMobilityBonus;
        }

        return 0;
    }


    static evaluateKingSafety(board, kingIndex, color) {
        // Epic 25: Advanced King Safety
        // Attack Units Model
        let score = 0;
        let attackUnits = 0;
        let attackerCount = 0;
        const opponent = color === 'white' ? 'black' : 'white';

        // Define King Zone: 3x3 area around King (including King sq, handled by logic?)
        // Usually surrounding 8 squares + squares in front.
        // We iterate surrounding 8 squares.
        const zoneOffsets = [-17, -16, -15, -1, 1, 15, 16, 17];

        // Iterate opponent pieces to see if they attack the zone.
        // This is expensive if we loop all pieces.
        // But checking "isSquareAttacked" for 8 squares is also expensive (8 calls * check all).
        // Better: Iterate opponent pieces (sliding mainly) and see if they hit zone.
        // But we don't have piece lists easily accessible in Board 0x88 (we have `bitboards` now!).
        // Board has bitboards.

        // Use Bitboards for King Safety (Fast)
        // 0x88 to 64:
        const r = 7 - (kingIndex >> 4);
        const c = kingIndex & 7;
        const kSq = r * 8 + c;

        // Zone Mask (Precomputed ideally, but dynamic here)
        // King attacks from kSq.
        const zone = Bitboard.getKingAttacks(kSq); // Surrounding 8

        // Check attackers
        const enemyKnights = board.bitboards.knight & board.bitboards[opponent];
        const enemyBishops = board.bitboards.bishop & board.bitboards[opponent];
        const enemyRooks = board.bitboards.rook & board.bitboards[opponent];
        const enemyQueens = board.bitboards.queen & board.bitboards[opponent];
        const occupancy = board.bitboards.white | board.bitboards.black;

        // Knights
        let kn = enemyKnights;
        while (kn) {
            const sq = Bitboard.lsb(kn);
            const att = Bitboard.getKnightAttacks(sq);
            if (att & zone) {
                attackUnits += 2;
                attackerCount++;
            }
            kn &= (kn - 1n);
        }

        // Sliders (Rook/Queen)
        let rq = enemyRooks | enemyQueens;
        while (rq) {
            const sq = Bitboard.lsb(rq);
            const att = Bitboard.getRookAttacks(sq, occupancy);
            if (att & zone) {
                attackUnits += 3;
                attackerCount++;
            }
            rq &= (rq - 1n);
        }

        // Sliders (Bishop/Queen)
        let bq = enemyBishops | enemyQueens;
        while (bq) {
            const sq = Bitboard.lsb(bq);
            const att = Bitboard.getBishopAttacks(sq, occupancy);
            if (att & zone) {
                attackUnits += 3;
                attackerCount++;
            }
            bq &= (bq - 1n);
        }

        const shieldOffsets = color === 'white' ? [-17, -16, -15] : [15, 16, 17];
        let shieldCount = 0;
        for (const offset of shieldOffsets) {
             const shieldSq = kingIndex + offset;
             if (board.isValidSquare(shieldSq)) {
                 const p = board.getPiece(shieldSq);
                 if (p && p.type === 'pawn' && p.color === color) {
                     shieldCount++;
                 }
             }
        }
        score += shieldCount * PARAMS.ShieldBonus;

        // Safety Table (Non-linear)
        // AttackerCount must be > 1 to matter usually?
        if (attackerCount > 1) {
            // Formula: weight * attackUnits^2 / 100?
            // Or simple table:
            const safetyTable = [0, 0, 10, 30, 60, 100, 150, 210, 280, 360, 450]; // Index by attack units / 2 approx?
            const idx = Math.min(attackUnits, 10);
            score -= safetyTable[idx];
        }

        // Still add shield bonus
        // Pawn Shield (Re-using logic efficiently?)
        // We can check pawns on bitboard zone?
        // Let's keep it simple.

        return score;
    }
}

module.exports = Evaluation;
