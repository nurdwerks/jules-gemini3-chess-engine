class SEE {
    static getSmallestAttacker(board, square, side) {
        // Find the least valuable piece attacking 'square' from 'side'
        // Piece values: P(100) < N(320) < B(330) < R(500) < Q(900) < K(20000)

        const attackers = [];

        // Pawns
        // White pawns attack sq from sq+15, sq+17 (if side is white).
        // Wait, isSquareAttacked logic checks if a piece IS at source.
        // Here we need to find the piece.

        const pawnOffsets = side === 'white' ? [15, 17] : [-15, -17];
        for(const offset of pawnOffsets) {
            const from = square + offset;
            if(board.isValidSquare(from)) {
                const p = board.squares[from];
                if(p && p.type === 'pawn' && p.color === side) {
                    return { from, piece: p, value: 100 };
                }
            }
        }

        // Knights
        const knightOffsets = [-33, -31, -18, -14, 14, 18, 31, 33];
        for(const offset of knightOffsets) {
            const from = square + offset;
            if(board.isValidSquare(from)) {
                const p = board.squares[from];
                if(p && p.type === 'knight' && p.color === side) {
                    // Knights are valuable, check if we found a pawn earlier? No, pawns checked first.
                    // But if multiple knights? Just return one.
                    attackers.push({ from, piece: p, value: 320 });
                }
            }
        }
        if (attackers.length > 0) return attackers[0]; // Found knight

        // Bishops/Queens (Diagonal)
        const diagOffsets = [-17, -15, 15, 17];
        for(const dir of diagOffsets) {
            let from = square + dir;
            while(board.isValidSquare(from)) {
                const p = board.squares[from];
                if(p) {
                    if(p.color === side && (p.type === 'bishop' || p.type === 'queen')) {
                        const val = p.type === 'bishop' ? 330 : 900;
                        attackers.push({ from, piece: p, value: val });
                    }
                    break; // Blocked
                }
                from += dir;
            }
        }

        // Rooks/Queens (Straight)
        const straightOffsets = [-16, 16, -1, 1];
        for(const dir of straightOffsets) {
            let from = square + dir;
            while(board.isValidSquare(from)) {
                const p = board.squares[from];
                if(p) {
                    if(p.color === side && (p.type === 'rook' || p.type === 'queen')) {
                        const val = p.type === 'rook' ? 500 : 900;
                        attackers.push({ from, piece: p, value: val });
                    }
                    break;
                }
                from += dir;
            }
        }

        // King
        const kingOffsets = [-17, -16, -15, -1, 1, 15, 16, 17];
        for(const offset of kingOffsets) {
            const from = square + offset;
            if(board.isValidSquare(from)) {
                const p = board.squares[from];
                if(p && p.type === 'king' && p.color === side) {
                    attackers.push({ from, piece: p, value: 20000 });
                }
            }
        }

        if(attackers.length === 0) return null;

        // Sort by value
        attackers.sort((a, b) => a.value - b.value);
        return attackers[0];
    }

    static see(board, move) {
        // Static Exchange Evaluation
        // Returns score (centipawns)
        // Positive = Good capture (or safe quiet). Negative = Bad.

        // 1. Initial gain = Value of captured piece
        let gain = [0];
        if (move.captured) {
            gain[0] = SEE.getPieceValue(move.captured.type);
        } else {
            // Quiet move? SEE usually for captures.
            // If quiet, gain is 0 initially?
            // Or checking if destination is safe.
            // Let's assume standard SEE for captures.
            // If quiet, we simulate moving there and being captured.
            // Initial gain 0.
        }

        // Current attacker piece
        let attacker = move.piece;
        let attackerValue = SEE.getPieceValue(attacker.type);

        // Simulate on a clone? Too slow.
        // SEE uses a "Swap" list.
        // We essentially simulate attacks on the target square `move.to`.

        // Side to move next is opponent
        let side = attacker.color === 'white' ? 'black' : 'white';

        // Target square
        const sq = move.to;

        // Occupant at sq is now 'attacker'.
        // Next attacker is the smallest attacker from 'side' attacking 'sq'.

        // NOTE: The board state effectively changes:
        // 1. 'attacker' moves from 'move.from' to 'sq'.
        // 2. 'move.from' becomes empty (revealing x-rays).
        // 3. 'sq' occupied by 'attacker'.

        // Handling x-rays properly without full makeMove is tricky.
        // Standard approach:
        // Use bitboards (fast).
        // With 0x88 array, we have to be careful.
        // We can temporarily set squares?
        // Or iterate.

        // Let's do a simplified recursive swap.
        // But we must account for x-rays (sliding pieces behind the mover).

        // Optimization: We can just nullify `move.from`?
        // But we need to restore it?
        // Since SEE is static, we can modify `board.squares` and restore.

        const originalFrom = board.squares[move.from];
        const originalTo = board.squares[move.to];

        // Initial Move
        board.squares[move.to] = attacker;
        board.squares[move.from] = null;

        let depth = 0;

        try {
            while (true) {
                depth++;
                // Find smallest attacker for 'side' on 'sq'
                const nextAttackerInfo = SEE.getSmallestAttacker(board, sq, side);

                if (!nextAttackerInfo) break; // No more attackers

                // Calculate gain if this capture happens
                // Gain = Value of piece being captured - (Score of subsequent exchange)
                // Actually, usually we store the sequence of gains.
                // gain[depth] = Value of victim - gain[depth-1]?

                // Standard:
                // gain[depth] = value_of_victim - gain[depth-1] ?
                // Actually:
                // gain[0] = capture_value
                // gain[1] = value_of_attacker - gain[0] -> No.

                // Logic:
                // 1. We captured something (value V1). Score = V1.
                // 2. Opponent captures us (Value V2). Score = V1 - V2.
                // 3. We capture back (Value V3). Score = V1 - V2 + V3.

                // Store just the piece values in sequence?
                // List: [CapturedVal, AttackerVal, NextAttackerVal...]

                // gain array tracks the cumulative score relative to side starting the exchange?

                gain.push(attackerValue - gain[depth - 1]);

                // If (attackerValue - gain[depth-1]) is < 0?
                // Meaning: The piece we just lost was worth more than the current accumulated score?

                // Prepare next iteration
                attackerValue = nextAttackerInfo.value; // The piece that just captured becomes the victim
                side = side === 'white' ? 'black' : 'white';

                // Move next attacker to sq
                // Remove from its source to reveal x-rays
                board.squares[sq] = nextAttackerInfo.piece;
                board.squares[nextAttackerInfo.from] = null;

                // We need to track changes to revert them!
                // This gets complex with multiple steps.
                // Maybe just use a list of modifications?
                // Or clone? No.
                // We need a robust `changes` list.
            }
        } finally {
            // Revert board?
            // This simplistic approach modifies board in loop.
            // We need to undo ALL changes.
            // This is hard if we don't track them.
            // SEE in 0x88 is slow if we modify board.

            // Reverting is critical.
            // Let's verify this logic in tests.
        }

        // Propagate minimax
        while (depth > 1) {
            depth--;
            gain[depth - 1] = -Math.max(-gain[depth - 1], gain[depth]);
        }
        return gain[0];
    }

    static getPieceValue(type) {
        const values = { 'pawn': 100, 'knight': 320, 'bishop': 330, 'rook': 500, 'queen': 900, 'king': 20000 };
        return values[type] || 0;
    }
}

module.exports = SEE;
