/**
 * Pawn Hash Table (Epic 20)
 * Caches pawn structure scores (Doubled, Isolated, Backward, Passed).
 * Key: Zobrist Hash of Pawns Only.
 */

class PawnHash {
    constructor(sizeInMB = 1) {
        const entrySize = 16; // Key (8 bytes) + Score (4 bytes) + Padding?
        // JS objects are expensive. We can use Map for simplicity or TypedArray for speed.
        // For a Pawn Hash, collisions are rare if key is good.
        // Let's use a simple Map for now as 'sizeInMB' management with Map is tricky (count entries).
        // Or better: Two arrays: keys (BigUint64) and scores (Int16).

        const numEntries = Math.floor((sizeInMB * 1024 * 1024) / 10); // Approx
        this.size = numEntries;
        this.keys = new BigUint64Array(numEntries);
        this.scores = new Int16Array(numEntries); // Score is usually small

        // We need a replacement strategy. Always replace? Or depth-based?
        // Pawn structure is static for a given pawn configuration.
        // So 'Always Replace' is fine, or 'Buckets'.
        // Simple direct mapping: index = key % size.
    }

    getIndex(key) {
        return Number(key % BigInt(this.size));
    }

    probe(key) {
        const index = this.getIndex(key);
        if (this.keys[index] === key) {
            return this.scores[index];
        }
        return null;
    }

    save(key, score) {
        const index = this.getIndex(key);
        this.keys[index] = key;
        this.scores[index] = score;
    }

    // Need to compute Pawn Key separately from Board Key?
    // Board usually has a Zobrist key.
    // We need a Zobrist key ONLY for pawns.
    // Board doesn't maintain it incrementally currently.
    // We can compute it on the fly in Evaluation?
    // Or update Board to maintain 'pawnKey'.
}

module.exports = PawnHash;
