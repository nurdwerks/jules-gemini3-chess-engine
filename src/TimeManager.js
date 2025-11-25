class TimeManager {
    constructor() {
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
        // If fixed time per move
        if (this.movetime > 0) {
            return {
                hardLimit: this.movetime,
                softLimit: this.movetime
            };
        }

        if (this.infinite) {
            return {
                hardLimit: Infinity,
                softLimit: Infinity
            };
        }

        // Clock details
        let time = color === 'w' ? this.wtime : this.btime;
        let inc = color === 'w' ? this.winc : this.binc;

        if (time === 0 && inc === 0) {
            // Default fallback if no time provided (e.g. just 'go')
            // Or maybe fixed depth? Let Search handle it if no time limit is passed.
            return { hardLimit: Infinity, softLimit: Infinity };
        }

        // Logic
        // Moves to go (if known, usually 40, otherwise assume ~30-40 moves left in game)
        // If movestogo not provided, assume sudden death or long increment?
        // Standard heuristic: Divide time by 30 or 40.
        // Or if increment, use time/20 + inc/2?

        let movesLeft = this.movestogo > 0 ? this.movestogo : 30;

        // Basic allocation
        let targetTime = time / movesLeft;

        // Adjust for increment
        if (inc > 0) {
            // Don't just add increment, it's safer to rely on remaining time.
            // A common formula: (Time / 20) + (Inc / 2)
            if (this.movestogo === 0) {
                targetTime = (time / 20) + (inc / 2);
            } else {
                 targetTime = (time / movesLeft) + inc;
            }
        }

        // Safety Buffers
        // Epic 19: Move Overhead
        // Configurable overhead (passed in or default)
        // We'll assume UCI option 'MoveOverhead' is handled elsewhere and passed here,
        // or we use a default. Since calculateTimeAllocation only takes color,
        // we might need to update signature or use a property set by UCI.
        // For now, standard default 50ms is in code.
        // Let's allow passing options?

        // But 'calculateTimeAllocation' is called from 'parseGoCommand'.
        // I should add 'options' to 'parseGoCommand' or use 'this.options'.

        const overhead = this.moveOverhead || 50;
        let maxTime = time - overhead;
        if (maxTime < 0) maxTime = 10; // Minimum 10ms

        // Hard Limit: Max time we are allowed to spend (usually up to 5x optimum, but constrained by total time)
        // Soft Limit: Optimum time. We stop here if score is stable or not improving.

        let hardLimit = Math.min(maxTime, targetTime * 5);
        let softLimit = Math.min(maxTime, targetTime);

        // Ensure we don't return crazy small values if time is low
        if (softLimit < 10) softLimit = 10;
        if (hardLimit < softLimit) hardLimit = softLimit;

        return { hardLimit, softLimit };
    }

    setMoveOverhead(overhead) {
        this.moveOverhead = overhead;
    }

    shouldStop(elapsed, softLimit, bestScore, prevScore) {
        // Basic stopping condition:
        if (elapsed >= softLimit) {
            // Epic 19: Stability
            // If score is stable (bestScore ~= prevScore) and we are over soft limit, stop.
            // If score is volatile (big jump), maybe extend?
            // Logic:
            // If elapsed > softLimit * 1.0, stop.
            return true;
        }
        // Advanced: If score dropped significantly (panic), maybe extend?
        // Not implemented here yet, but interface allows it.
        return false;
    }
}

module.exports = TimeManager;
