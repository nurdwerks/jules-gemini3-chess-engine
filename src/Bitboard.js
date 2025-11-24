const Bitboard = {
    // BigInt wrapper utils?
    // In JS, we can just use BigInt primitives.
    // But for attack tables, we need an object/class.

    popcnt(bb) {
        let c = 0;
        while (bb > 0n) {
            bb &= (bb - 1n);
            c++;
        }
        return c;
    },

    lsb(bb) {
        if (bb === 0n) return -1;
        // Binary search or simple loop?
        // Or: bb & -bb gives LSB isolated. Then log2?
        // JS BigInt doesn't have log2.
        // Let's use a De Bruijn sequence or simple loop.
        // Simple loop for now.
        let idx = 0;
        while ((bb & 1n) === 0n) {
            bb >>= 1n;
            idx++;
        }
        return idx;
    },

    setBit(bb, square) {
        return bb | (1n << BigInt(square));
    },

    clearBit(bb, square) {
        return bb & ~(1n << BigInt(square));
    },

    getBit(bb, square) {
        return (bb & (1n << BigInt(square))) !== 0n;
    },

    // Attack Tables
    knightAttacks: new BigUint64Array(64),
    kingAttacks: new BigUint64Array(64),

    init() {
        this.initKnightAttacks();
        this.initKingAttacks();
    },

    initKnightAttacks() {
        const offsets = [-17, -15, -10, -6, 6, 10, 15, 17];
        // Note: 0x88 offsets were -33 etc.
        // Bitboard squares: 0=h1 ... 63=a8? Or a1=0?
        // LERF: a1=0, b1=1 ... h1=7 ... a8=56...
        // Let's stick to Little-Endian Rank-File mapping (a1=0).

        for (let sq = 0; sq < 64; sq++) {
            let attacks = 0n;
            const rank = Math.floor(sq / 8);
            const col = sq % 8;

            // Manual offsets
            const jumps = [
                {r: 2, c: 1}, {r: 2, c: -1},
                {r: -2, c: 1}, {r: -2, c: -1},
                {r: 1, c: 2}, {r: 1, c: -2},
                {r: -1, c: 2}, {r: -1, c: -2}
            ];

            for (const jump of jumps) {
                const tr = rank + jump.r;
                const tc = col + jump.c;
                if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
                    const tsq = tr * 8 + tc;
                    attacks |= (1n << BigInt(tsq));
                }
            }
            this.knightAttacks[sq] = attacks;
        }
    },

    initKingAttacks() {
        for (let sq = 0; sq < 64; sq++) {
            let attacks = 0n;
            const rank = Math.floor(sq / 8);
            const col = sq % 8;

            for (let r = -1; r <= 1; r++) {
                for (let c = -1; c <= 1; c++) {
                    if (r === 0 && c === 0) continue;
                    const tr = rank + r;
                    const tc = col + c;
                    if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
                        const tsq = tr * 8 + tc;
                        attacks |= (1n << BigInt(tsq));
                    }
                }
            }
            this.kingAttacks[sq] = attacks;
        }
    },

    getKnightAttacks(sq) {
        return this.knightAttacks[sq];
    },

    getKingAttacks(sq) {
        return this.kingAttacks[sq];
    },

    // Slider Attacks
    // We can implement "Classic" ray casting for now to satisfy "Implement Slider Attack Lookups".
    // Magic Bitboards are an optimization.

    getRookAttacks(sq, occupancy) {
        let attacks = 0n;
        const rank = Math.floor(sq / 8);
        const col = sq % 8;

        // North
        for (let r = rank + 1; r < 8; r++) {
            const tsq = r * 8 + col;
            attacks |= (1n << BigInt(tsq));
            if ((occupancy & (1n << BigInt(tsq))) !== 0n) break;
        }
        // South
        for (let r = rank - 1; r >= 0; r--) {
            const tsq = r * 8 + col;
            attacks |= (1n << BigInt(tsq));
            if ((occupancy & (1n << BigInt(tsq))) !== 0n) break;
        }
        // East
        for (let c = col + 1; c < 8; c++) {
            const tsq = rank * 8 + c;
            attacks |= (1n << BigInt(tsq));
            if ((occupancy & (1n << BigInt(tsq))) !== 0n) break;
        }
        // West
        for (let c = col - 1; c >= 0; c--) {
            const tsq = rank * 8 + c;
            attacks |= (1n << BigInt(tsq));
            if ((occupancy & (1n << BigInt(tsq))) !== 0n) break;
        }
        return attacks;
    },

    getBishopAttacks(sq, occupancy) {
        let attacks = 0n;
        const rank = Math.floor(sq / 8);
        const col = sq % 8;

        // NE
        for (let r = rank + 1, c = col + 1; r < 8 && c < 8; r++, c++) {
            const tsq = r * 8 + c;
            attacks |= (1n << BigInt(tsq));
            if ((occupancy & (1n << BigInt(tsq))) !== 0n) break;
        }
        // SE
        for (let r = rank - 1, c = col + 1; r >= 0 && c < 8; r--, c++) {
            const tsq = r * 8 + c;
            attacks |= (1n << BigInt(tsq));
            if ((occupancy & (1n << BigInt(tsq))) !== 0n) break;
        }
        // SW
        for (let r = rank - 1, c = col - 1; r >= 0 && c >= 0; r--, c--) {
            const tsq = r * 8 + c;
            attacks |= (1n << BigInt(tsq));
            if ((occupancy & (1n << BigInt(tsq))) !== 0n) break;
        }
        // NW
        for (let r = rank + 1, c = col - 1; r < 8 && c >= 0; r++, c--) {
            const tsq = r * 8 + c;
            attacks |= (1n << BigInt(tsq));
            if ((occupancy & (1n << BigInt(tsq))) !== 0n) break;
        }
        return attacks;
    }
};

Bitboard.init();

module.exports = Bitboard;
