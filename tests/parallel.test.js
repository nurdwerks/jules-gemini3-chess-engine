const { TranspositionTable } = require('../src/TranspositionTable');

describe('Parallel Search Infrastructure', () => {
    test('TT handles SharedArrayBuffer', () => {
        const sizeMB = 1;
        const entrySize = 16;
        const count = Math.floor((sizeMB * 1024 * 1024) / entrySize);
        const totalBytes = count * 16; // Keys + Data + Scores

        const sab = new SharedArrayBuffer(totalBytes);
        const tt = new TranspositionTable(sizeMB, sab);

        expect(tt.shared).toBe(true);
        expect(tt.keys.buffer).toBe(sab);
    });

    // Mock worker spawning? Hard in Jest environment.
    // We verify the infrastructure.
});
