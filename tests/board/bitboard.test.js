const Bitboard = require('../../src/Bitboard');

describe('Bitboard Infrastructure', () => {
    test('setBit/getBit/clearBit', () => {
        let bb = 0n;
        bb = Bitboard.setBit(bb, 0); // a1
        expect(Bitboard.getBit(bb, 0)).toBe(true);
        expect(Bitboard.getBit(bb, 1)).toBe(false);

        bb = Bitboard.setBit(bb, 63); // h8
        expect(Bitboard.getBit(bb, 63)).toBe(true);

        bb = Bitboard.clearBit(bb, 0);
        expect(Bitboard.getBit(bb, 0)).toBe(false);
    });

    test('popcnt', () => {
        let bb = 0n;
        bb = Bitboard.setBit(bb, 0);
        bb = Bitboard.setBit(bb, 10);
        expect(Bitboard.popcnt(bb)).toBe(2);
    });

    test('lsb', () => {
        let bb = 0n;
        bb = Bitboard.setBit(bb, 4);
        bb = Bitboard.setBit(bb, 10);
        expect(Bitboard.lsb(bb)).toBe(4);
    });

    test('Pre-calculated Knight Attacks', () => {
        // e4 (rank 3, col 4) -> index 28
        const attacks = Bitboard.getKnightAttacks(28);
        // Verify a few targets
        // d6 (rank 5, col 3) -> 43? 5*8+3 = 43.
        expect(Bitboard.getBit(attacks, 43)).toBe(true);
        // f6 (rank 5, col 5) -> 45.
        expect(Bitboard.getBit(attacks, 45)).toBe(true);
        // a1 (0) should be false
        expect(Bitboard.getBit(attacks, 0)).toBe(false);
    });

    test('Slider Attacks (Rook)', () => {
        // Rook on d4 (27). Occupancy on d7 (51).
        // d4 = 3*8+3 = 27.
        // d7 = 6*8+3 = 51.
        const rookSq = 27;
        let occ = 0n;
        occ = Bitboard.setBit(occ, 51); // d7 blocker

        const attacks = Bitboard.getRookAttacks(rookSq, occ);

        // Should attack d5 (35), d6 (43), d7 (51).
        // Should NOT attack d8 (59) because blocked by d7.

        expect(Bitboard.getBit(attacks, 35)).toBe(true); // d5
        expect(Bitboard.getBit(attacks, 43)).toBe(true); // d6
        expect(Bitboard.getBit(attacks, 51)).toBe(true); // d7 (capture)
        expect(Bitboard.getBit(attacks, 59)).toBe(false); // d8 (blocked)
    });
});
