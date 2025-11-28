class SearchHeuristics {
    constructor() {
        this.killerMoves = new Array(64).fill(null).map(() => []);
        this.history = new Int32Array(2 * 128 * 128);
        this.counterMoves = new Array(2 * 128 * 128).fill(null);
    }

    reset() {
        this.killerMoves = new Array(64).fill(null).map(() => []);
        // History is usually not reset per search, but aged.
    }

    clearKillers() {
        this.killerMoves = new Array(64).fill(null).map(() => []);
    }

    ageHistory() {
        for(let i=0; i<this.history.length; i++) this.history[i] >>= 1;
    }

    getHistoryScore(side, from, to) {
        const colorIdx = side === 'w' ? 0 : 1;
        return this.history[colorIdx * 128 * 128 + from * 128 + to];
    }

    addHistoryScore(side, from, to, depth) {
        const colorIdx = side === 'w' ? 0 : 1;
        const idx = colorIdx * 128 * 128 + from * 128 + to;
        const bonus = depth * depth;
        this.history[idx] += bonus;
        if (this.history[idx] > 1000000) { // Cap/Age
            for(let i=0; i<this.history.length; i++) this.history[i] >>= 1;
        }
    }

    storeKiller(depth, move) {
        if (depth >= 64) return;
        const killers = this.killerMoves[depth];
        if (killers.some(k => k.from === move.from && k.to === move.to)) return;

        if (killers.length >= 2) {
            killers.pop();
        }
        killers.unshift(move);
    }

    getKillers(depth) {
        if (depth >= 64) return [];
        return this.killerMoves[depth];
    }

    storeCounterMove(side, prevFrom, prevTo, move) {
        const sideIdx = side === 'w' ? 0 : 1;
        const idx = sideIdx * 128 * 128 + prevFrom * 128 + prevTo;
        if (idx < this.counterMoves.length) {
            this.counterMoves[idx] = move;
        }
    }

    getCounterMove(side, prevFrom, prevTo) {
        const sideIdx = side === 'w' ? 0 : 1;
        const idx = sideIdx * 128 * 128 + prevFrom * 128 + prevTo;
        if (idx < this.counterMoves.length) {
            return this.counterMoves[idx];
        }
        return null;
    }
}
module.exports = SearchHeuristics;
