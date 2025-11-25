const Zobrist = require('./Zobrist');

class PawnHash {
    constructor(sizeMB = 16) {
        // Entry size: 8 bytes (key) + 4 bytes (score) + 4 bytes (unused/flags) = 16 bytes
        // sizeMB * 1024 * 1024 / 16
        this.size = Math.floor((sizeMB * 1024 * 1024) / 16);
        this.keys = new BigUint64Array(this.size);
        this.scores = new Int32Array(this.size);
    }

    getIndex(key) {
        return Number(key % BigInt(this.size));
    }

    get(key) {
        const index = this.getIndex(key);
        if (this.keys[index] === key) {
            return this.scores[index];
        }
        return null;
    }

    set(key, score) {
        const index = this.getIndex(key);
        this.keys[index] = key;
        this.scores[index] = score;
    }

    clear() {
        this.keys.fill(0n);
        this.scores.fill(0);
    }
}

module.exports = PawnHash;
