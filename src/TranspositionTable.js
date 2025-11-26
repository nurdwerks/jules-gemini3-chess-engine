// Transposition Table Entry Flags
const TT_FLAG = {
    EXACT: 0,
    LOWERBOUND: 1, // Alpha
    UPPERBOUND: 2  // Beta
};

class TranspositionTable {
    constructor(sizeInMB = 64, sharedBuffer = null) {
        const entrySize = 16;
        const count = Math.floor((sizeInMB * 1024 * 1024) / entrySize);

        this.size = count;

        if (sharedBuffer) {
            // Use shared buffer
            // Layout: Keys (8*count), Data (4*count), Scores (4*count)
            const totalBytes = count * 16;
            if (sharedBuffer.byteLength < totalBytes) {
                throw new Error('SharedBuffer too small');
            }
            this.keys = new BigUint64Array(sharedBuffer, 0, count);
            this.data = new Uint32Array(sharedBuffer, count * 8, count);
            this.scores = new Int32Array(sharedBuffer, count * 12, count);
            this.shared = true;
        } else {
            this.keys = new BigUint64Array(count);
            this.data = new Uint32Array(count);
            this.scores = new Int32Array(count);
            this.shared = false;
        }
    }

    resize(sizeInMB) {
        if (this.shared) {
            // Cannot resize shared buffer easily without re-init from UCI
            // For now, ignore or throw.
            return;
        }
        const entrySize = 16;
        const count = Math.floor((sizeInMB * 1024 * 1024) / entrySize);

        this.size = count;
        this.keys = new BigUint64Array(count);
        this.data = new Uint32Array(count);
        this.scores = new Int32Array(count);
    }

    clear() {
        this.keys.fill(0n);
        this.data.fill(0);
        this.scores.fill(0);
    }

    // Index mapping: key % size
    getIndex(key) {
        return Number(key % BigInt(this.size));
    }

    save(key, score, depth, flag, move) {
        const index = this.getIndex(key);

        // Replacement scheme: Deepest or Always Replace?
        // Simple: Always replace.
        // Better: Replace if depth is greater or equal. Or if different generation.
        // For now: Always replace.

        this.keys[index] = key;
        this.scores[index] = score;

        // Pack data
        // Move: 16 bits (0-65535).
        // 0x88 indices are 0-127. From (7 bits) + To (7 bits) = 14 bits.
        // Promotion? 2 bits (Q, R, B, N).
        // So 16 bits is tight but fits.
        // Let's store move as a number: (from << 7) | to.
        // Promotion: we need to handle it.
        // My engine Move object has { from, to, flags, promotion }.
        // Let's encode:
        // bits 0-6: from
        // bits 7-13: to
        // bits 14-15: promotion (0=none/Q, 1=R, 2=B, 3=N ? Need to distinguish none).
        // Actually, best move from TT is mainly for ordering. Promotion type is rarely critical for ordering unless specific.
        // But if we return it as Principal Variation, we need it.
        // Let's simplify: Store (from << 8) | to. 16 bits.

        let moveInt = 0;
        if (move) {
            moveInt = (move.from << 8) | move.to;
        }

        // Depth: 8 bits (0-255).
        // Flag: 2 bits.

        // Data Layout:
        // 0-15: Move
        // 16-23: Depth
        // 24-31: Flag

        const data = (moveInt & 0xFFFF) | ((depth & 0xFF) << 16) | ((flag & 0xFF) << 24);
        this.data[index] = data;
    }

    probe(key) {
        const index = this.getIndex(key);

        if (this.keys[index] !== key) {
            return null;
        }

        const data = this.data[index];
        const moveInt = data & 0xFFFF;
        const depth = (data >>> 16) & 0xFF;
        const flag = (data >>> 24) & 0xFF;
        const score = this.scores[index];

        let move = null;
        if (moveInt !== 0) {
            const from = (moveInt >>> 8) & 0xFF;
            const to = moveInt & 0xFF;
            move = { from, to };
        }

        return {
            score,
            depth,
            flag,
            move
        };
    }

    getSharedBuffer() {
        return this.buffer;
    }
}

module.exports = { TranspositionTable, TT_FLAG };
