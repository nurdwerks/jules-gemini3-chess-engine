class TimeManager {
    constructor(board) {
        this.board = board;
        this.wtime = 0;
        this.btime = 0;
        this.winc = 0;
        this.binc = 0;
        this.movestogo = 0;
        this.movetime = 0;
        this.infinite = false;
        this.startTime = 0;
    }

    reset() {
        this.wtime = 0;
        this.btime = 0;
        this.winc = 0;
        this.binc = 0;
        this.movestogo = 0;
        this.movetime = 0;
        this.infinite = false;
        this.startTime = 0;
    }

    /**
     * Parse UCI 'go' command arguments.
     * @param {string[]} args
     * @param {string} color 'w' or 'b'
     */
    parseGoCommand(args, color) {
        this.reset();
        this.startTime = Date.now();

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (arg === 'wtime' && i + 1 < args.length) this.wtime = parseInt(args[i + 1], 10);
            if (arg === 'btime' && i + 1 < args.length) this.btime = parseInt(args[i + 1], 10);
            if (arg === 'winc' && i + 1 < args.length) this.winc = parseInt(args[i + 1], 10);
            if (arg === 'binc' && i + 1 < args.length) this.binc = parseInt(args[i + 1], 10);
            if (arg === 'movestogo' && i + 1 < args.length) this.movestogo = parseInt(args[i + 1], 10);
            if (arg === 'movetime' && i + 1 < args.length) this.movetime = parseInt(args[i + 1], 10);
            if (arg === 'infinite') this.infinite = true;
        }

        return this.calculateTimeAllocation(color);
    }

    calculateTimeAllocation(color) {
        if (this.movetime > 0) {
            return { hardLimit: this.movetime, softLimit: this.movetime };
        }

        if (this.infinite) {
            return { hardLimit: Infinity, softLimit: Infinity };
        }

        const time = color === 'w' ? this.wtime : this.btime;
        const inc = color === 'w' ? this.winc : this.binc;
        const opponentTime = color === 'w' ? this.btime : this.wtime;

        if (time === 0) {
            return { hardLimit: Infinity, softLimit: Infinity };
        }

        const overhead = this.moveOverhead || 50;
        let maxTime = time - overhead;
        if (maxTime < 10) maxTime = 10;

        // Game Phase Logic
        let movesLeft;
        if (this.movestogo > 0) {
            movesLeft = this.movestogo;
        } else if (this.board.fullMoveNumber < 15) { // Opening
            movesLeft = 50; // Spend less time
        } else if (this.board.fullMoveNumber > 40) { // Endgame
            movesLeft = 20; // Spend more time
        } else { // Middlegame
            movesLeft = 30;
        }

        let targetTime = (time / movesLeft) + (inc * 0.75); // Use most of the increment

        // Opponent Time Logic
        const timeRatio = time / (opponentTime + 1); // Add 1 to avoid division by zero
        if (timeRatio > 2) {
            targetTime *= 0.8; // We have a large time advantage, be conservative
        } else if (timeRatio < 0.5) {
            targetTime *= 1.2; // We are in time trouble, think a bit more
        }


        // Safety Buffers
        let softLimit = Math.min(maxTime, targetTime);
        let hardLimit = Math.min(maxTime, softLimit * 4);

        if (softLimit < 10) softLimit = 10;
        if (hardLimit < softLimit) hardLimit = softLimit;

        return { hardLimit, softLimit };
    }

    setMoveOverhead(overhead) {
        this.moveOverhead = overhead;
    }

    shouldStop(elapsed, softLimit, isStable) {
        if (elapsed >= softLimit) {
            if (isStable) {
                return true;
            }
        }
        return false;
    }
}

module.exports = TimeManager;
