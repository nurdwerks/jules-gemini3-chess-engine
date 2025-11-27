const Bitboard = require('./Bitboard');
const Piece = require('./Piece');

class SEE {
    static getSmallestAttacker(board, square, side) {
        const us = board.bitboards[side];
        const occupancy = board.bitboards.white | board.bitboards.black;
        const sq64 = Bitboard.to64(square);
        const sq = square;

        const pawns = board.bitboards.pawn & us;
        if (pawns !== 0n) {
            const attackerOffsets = side === 'white' ? [15, 17] : [-15, -17];
            for (const offset of attackerOffsets) {
                const from = sq + offset;
                if ((from & 0x88) === 0) {
                    const from64 = Bitboard.to64(from);
                    if ((pawns & (1n << BigInt(from64))) !== 0n) {
                        return { from, piece: new Piece(side, 'pawn'), value: 100 };
                    }
                }
            }
        }

        const knights = board.bitboards.knight & us;
        if (knights !== 0n) {
            const attacks = Bitboard.getKnightAttacks(sq64);
            const attackers = attacks & knights;
            if (attackers !== 0n) {
                const from64 = Bitboard.lsb(attackers);
                const r = 7 - Math.floor(from64 / 8);
                const c = from64 % 8;
                const from = (r << 4) | c;
                return { from, piece: new Piece(side, 'knight'), value: 320 };
            }
        }

        const bishops = board.bitboards.bishop & us;
        if (bishops !== 0n) {
            const attacks = Bitboard.getBishopAttacks(sq64, occupancy);
            const attackers = attacks & bishops;
            if (attackers !== 0n) {
                const from64 = Bitboard.lsb(attackers);
                const r = 7 - Math.floor(from64 / 8);
                const c = from64 % 8;
                const from = (r << 4) | c;
                return { from, piece: new Piece(side, 'bishop'), value: 330 };
            }
        }

        const rooks = board.bitboards.rook & us;
        if (rooks !== 0n) {
            const attacks = Bitboard.getRookAttacks(sq64, occupancy);
            const attackers = attacks & rooks;
            if (attackers !== 0n) {
                const from64 = Bitboard.lsb(attackers);
                const r = 7 - Math.floor(from64 / 8);
                const c = from64 % 8;
                const from = (r << 4) | c;
                return { from, piece: new Piece(side, 'rook'), value: 500 };
            }
        }

        const queens = board.bitboards.queen & us;
        if (queens !== 0n) {
            const bAttacks = Bitboard.getBishopAttacks(sq64, occupancy);
            const rAttacks = Bitboard.getRookAttacks(sq64, occupancy);
            const attackers = (bAttacks | rAttacks) & queens;
            if (attackers !== 0n) {
                const from64 = Bitboard.lsb(attackers);
                const r = 7 - Math.floor(from64 / 8);
                const c = from64 % 8;
                const from = (r << 4) | c;
                return { from, piece: new Piece(side, 'queen'), value: 900 };
            }
        }

        const kings = board.bitboards.king & us;
        if (kings !== 0n) {
            const attacks = Bitboard.getKingAttacks(sq64);
            const attackers = attacks & kings;
            if (attackers !== 0n) {
                const from64 = Bitboard.lsb(attackers);
                const r = 7 - Math.floor(from64 / 8);
                const c = from64 % 8;
                const from = (r << 4) | c;
                return { from, piece: new Piece(side, 'king'), value: 20000 };
            }
        }

        return null;
    }

    static see(board, move) {
        let gain = [0];
        if (move.captured) {
            gain[0] = SEE.getPieceValue(move.captured.type);
        } else {
            if (move.flags === 'e' || move.flags === 'ep') {
                gain[0] = 100;
            }
        }

        const changes = [];

        const movePiece = (from, to, piece) => {
            const victim = board.getPiece(to);
            changes.push({ from, to, piece, victim });

            board.toggleBitboard(piece, from);
            if (victim) {
                board.toggleBitboard(victim, to);
            }
            board.toggleBitboard(piece, to);
        };

        movePiece(move.from, move.to, move.piece);

        let attacker = move.piece;
        let attackerValue = SEE.getPieceValue(attacker.type);
        let side = attacker.color === 'white' ? 'black' : 'white';
        const sq = move.to;
        let depth = 0;

        try {
            while (true) {
                depth++;
                const nextAttackerInfo = SEE.getSmallestAttacker(board, sq, side);
                if (!nextAttackerInfo) break;

                gain.push(attackerValue - gain[depth - 1]);

                attackerValue = nextAttackerInfo.value;
                side = side === 'white' ? 'black' : 'white';

                movePiece(nextAttackerInfo.from, sq, nextAttackerInfo.piece);
            }
        } finally {
            while (changes.length > 0) {
                const c = changes.pop();
                board.toggleBitboard(c.piece, c.to);
                if (c.victim) {
                    board.toggleBitboard(c.victim, c.to);
                }
                board.toggleBitboard(c.piece, c.from);
            }
        }

        while (depth > 0) {
            gain[depth - 1] = -Math.max(-gain[depth - 1], gain[depth]);
            depth--;
        }
        return gain[0];
    }

    static getPieceValue(type) {
        const values = { 'pawn': 100, 'knight': 320, 'bishop': 330, 'rook': 500, 'queen': 900, 'king': 20000 };
        return values[type] || 0;
    }
}

module.exports = SEE;
