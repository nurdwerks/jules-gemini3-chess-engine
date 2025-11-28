const fs = require('fs');
const path = require('path');
const PawnHash = require('./PawnHash');
const Bitboard = require('./Bitboard');

// Pawn Hash Global Instance
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

/**
 * Tunable evaluation parameters.
 * These can be overridden by tuned_evaluation_params.json.
 */
const PARAMS = {
    DoubledPawnPenalty: 10,
    IsolatedPawnPenalty: 15,
    BackwardPawnPenalty: 10,
    KnightMobilityBonus: 1,
    BishopMobilityBonus: 2,
    RookMobilityBonus: 2,
    QueenMobilityBonus: 3,
    ShieldBonus: 5,
    KnightOutpostBonus: 20,
    BishopOutpostBonus: 10,
};

// PSTs (same as before)
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
            const isTest = process.env.TEST_MODE === 'true' || process.env.NODE_ENV === 'test';
            if (!isTest && fs.existsSync(paramsPath)) {
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

    /**
     * Statically evaluates the board state.
     * @param {Board} board - The board to evaluate.
     * @returns {number} The score in centipawns from the perspective of the side to move.
     */
    static evaluate(board) {
        let score = 0;
        let whiteKingIndex = -1;
        let blackKingIndex = -1;

        const to0x88 = (sq64) => {
             const r = 7 - Math.floor(sq64/8);
             const c = sq64 % 8;
             return (r << 4) | c;
        };

        const colors = ['white', 'black'];
        const types = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

        for (const color of colors) {
            for (const type of types) {
                let bb = board.bitboards[type] & board.bitboards[color];
                while(bb) {
                    const sq64 = Bitboard.lsb(bb);
                    const i = to0x88(sq64);

                    // Track kings for safety check
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

                    let outpostBonus = 0;
                    if (type === 'knight' || type === 'bishop') {
                        outpostBonus = Evaluation.evaluateOutpost(board, i, type, color);
                    }

                    if (color === 'white') {
                        pstValue = PSTS[type][i];
                        score += (value + pstValue + pawnStructure + mobility + outpostBonus);
                    } else {
                        const row = i >> 4;
                        const col = i & 7;
                        const flippedIndex = ((7 - row) << 4) | col;
                        pstValue = PSTS[type][flippedIndex];
                        score -= (value + pstValue + pawnStructure + mobility + outpostBonus);
                    }

                    bb &= (bb - 1n);
                }
            }
        }

        if (whiteKingIndex !== -1) {
            score += Evaluation.evaluateKingSafety(board, whiteKingIndex, 'white');
        }
        if (blackKingIndex !== -1) {
            score -= Evaluation.evaluateKingSafety(board, blackKingIndex, 'black');
        }

        return board.activeColor === 'w' ? score : -score;
    }

    static evaluateOutpost(board, index, type, color) {
        // Only for Knights and Bishops
        if (type !== 'knight' && type !== 'bishop') return 0;

        const sq64 = Bitboard.to64(index);
        const rank = Math.floor(sq64 / 8); // 0-7. 0=Rank1.
        const col = sq64 % 8;

        let rankBonusMultiplier = 0;

        if (color === 'white') {
            if (rank < 3 || rank > 5) return 0; // Only Ranks 4, 5, 6 (Indices 3,4,5)
            rankBonusMultiplier = (rank - 2);
        } else {
            if (rank < 2 || rank > 4) return 0; // Ranks 6, 5, 4 (Indices 5,4,3) for Black
            rankBonusMultiplier = (5 - rank);
        }

        // 1. Supported by friendly pawn
        const friendlyPawns = board.bitboards[color] & board.bitboards.pawn;
        let supportMask = 0n;

        if (color === 'white') {
            if (rank > 0) {
                if (col > 0) supportMask |= (1n << BigInt((rank - 1) * 8 + (col - 1)));
                if (col < 7) supportMask |= (1n << BigInt((rank - 1) * 8 + (col + 1)));
            }
        } else {
            if (rank < 7) {
                if (col > 0) supportMask |= (1n << BigInt((rank + 1) * 8 + (col - 1)));
                if (col < 7) supportMask |= (1n << BigInt((rank + 1) * 8 + (col + 1)));
            }
        }

        if ((friendlyPawns & supportMask) === 0n) return 0; // Not supported

        // 2. Not attackable by enemy pawn
        const opponent = color === 'white' ? 'black' : 'white';
        const enemyPawns = board.bitboards[opponent] & board.bitboards.pawn;

        let attackMask = 0n;
        const checkFiles = [];
        if (col > 0) checkFiles.push(col - 1);
        if (col < 7) checkFiles.push(col + 1);

        for (const f of checkFiles) {
            if (color === 'white') {
                // Check Black pawns at Rank >= rank + 1
                 for (let r = rank + 1; r < 8; r++) {
                     attackMask |= (1n << BigInt(r * 8 + f));
                 }
            } else {
                // Check White pawns at Rank <= rank - 1
                 for (let r = 0; r < rank; r++) {
                     attackMask |= (1n << BigInt(r * 8 + f));
                 }
            }
        }

        if ((enemyPawns & attackMask) !== 0n) return 0; // Attackable

        // Is Outpost!
        const baseBonus = type === 'knight' ? PARAMS.KnightOutpostBonus : PARAMS.BishopOutpostBonus;
        return baseBonus * rankBonusMultiplier;
    }

    static updateParam(name, value) {
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

    static evaluatePawnStructure(board, index, color) {
        let score = 0;
        const col = index & 7;
        const row = index >> 4;

        // Doubled Pawns
        const forward = color === 'white' ? -16 : 16;
        const frontSq = index + forward;
        // Check piece in front
        const frontPiece = board.getPiece(frontSq);
        if (frontPiece && frontPiece.type === 'pawn' && frontPiece.color === color) {
            score -= PARAMS.DoubledPawnPenalty;
        }

        // Isolated Pawns
        let hasNeighbor = false;
        const files = [col - 1, col + 1];
        for (const f of files) {
             if (f >= 0 && f <= 7) {
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

        // Backward Pawns
        if (hasNeighbor) {
            let isBehindAllNeighbors = true;
            for (const f of files) {
                if (f >= 0 && f <= 7) {
                    for (let r = 0; r < 8; r++) { // scan file
                        const idx = (r << 4) | f;
                        const p = board.getPiece(idx);
                        if (p && p.type === 'pawn' && p.color === color) {
                             if (color === 'white') {
                                 if (r > row) isBehindAllNeighbors = false;
                             } else {
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

        // Passed Pawn
        const enemyColor = color === 'white' ? 'black' : 'white';
        let isPassed = true;
        const checkFiles = [col - 1, col, col + 1];

        const startRow = color === 'white' ? 0 : row + 1;
        const endRow = color === 'white' ? row - 1 : 7;

        outerLoop:
        for (const f of checkFiles) {
             if (f < 0 || f > 7) continue;

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
            const PASSED_BONUS = [0, 0, 10, 20, 40, 80, 160, 0];
            let rankIdx = 0;
            if (color === 'white') {
                rankIdx = 7 - row;
            } else {
                rankIdx = row;
            }
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
        let score = 0;
        let attackUnits = 0;
        let attackerCount = 0;
        const opponent = color === 'white' ? 'black' : 'white';
        const zoneOffsets = [-17, -16, -15, -1, 1, 15, 16, 17];

        const r = 7 - (kingIndex >> 4);
        const c = kingIndex & 7;
        const kSq = r * 8 + c;

        const zone = Bitboard.getKingAttacks(kSq); // Surrounding 8

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

        if (attackerCount > 1) {
            const safetyTable = [0, 0, 10, 30, 60, 100, 150, 210, 280, 360, 450];
            const idx = Math.min(attackUnits, 10);
            score -= safetyTable[idx];
        }

        return score;
    }
}

module.exports = Evaluation;
