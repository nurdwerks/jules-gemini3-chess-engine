const { TranspositionTable, TT_FLAG } = require('../src/TranspositionTable');

describe('Transposition Table', () => {
    let tt;

    beforeEach(() => {
        tt = new TranspositionTable(1); // 1MB
    });

    test('Save and Probe', () => {
        const key = 123456789n;
        const score = 100;
        const depth = 5;
        const flag = TT_FLAG.EXACT;
        const move = { from: 10, to: 20 };

        tt.save(key, score, depth, flag, move);

        const entry = tt.probe(key);
        expect(entry).not.toBeNull();
        expect(entry.score).toBe(score);
        expect(entry.depth).toBe(depth);
        expect(entry.flag).toBe(flag);
        expect(entry.move.from).toBe(move.from);
        expect(entry.move.to).toBe(move.to);
    });

    test('Probe Miss', () => {
        const key = 123456789n;
        const entry = tt.probe(key);
        expect(entry).toBeNull();
    });

    test('Overwrite', () => {
        const key = 123456789n;
        tt.save(key, 100, 5, TT_FLAG.LOWERBOUND, null);

        tt.save(key, 200, 6, TT_FLAG.EXACT, { from: 5, to: 6 });

        const entry = tt.probe(key);
        expect(entry.score).toBe(200);
        expect(entry.depth).toBe(6);
        expect(entry.flag).toBe(TT_FLAG.EXACT);
        expect(entry.move).not.toBeNull();
    });

    test('Collision (Index same, Key diff)', () => {
        // We need to find two keys that map to same index.
        // Index = key % size.
        const size = BigInt(tt.size);
        const key1 = 10n;
        const key2 = 10n + size; // key2 % size == 10

        tt.save(key1, 100, 5, TT_FLAG.EXACT, null);
        let entry = tt.probe(key1);
        expect(entry).not.toBeNull();

        tt.save(key2, 200, 6, TT_FLAG.EXACT, null);

        // key1 should be gone (overwritten)
        entry = tt.probe(key1);
        expect(entry).toBeNull();

        entry = tt.probe(key2);
        expect(entry).not.toBeNull();
        expect(entry.score).toBe(200);
    });
});
