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
        // SEE with board modification and proper revert

        // Initial gain = Value of captured piece
        let gain = [0];
        if (move.captured) {
            gain[0] = SEE.getPieceValue(move.captured.type);
        }

        // Track changes to revert
        const changes = [];

        // Helper to modify and track
        const movePiece = (from, to, piece) => {
            const prevFrom = board.squares[from];
            const prevTo = board.squares[to];
            changes.push({ from, to, prevFrom, prevTo });
            board.squares[to] = piece;
            board.squares[from] = null;
        };

        // Initial Move
        // move.piece moves to move.to
        movePiece(move.from, move.to, move.piece);

        let attacker = move.piece;
        if (!attacker) {
             console.error("SEE: attacker (move.piece) is null", move);
             // Revert changes before returning
             while (changes.length > 0) {
                const c = changes.pop();
                board.squares[c.from] = c.prevFrom;
                board.squares[c.to] = c.prevTo;
            }
             return 0;
        }
        let attackerValue = SEE.getPieceValue(attacker.type);
        let side = attacker.color === 'white' ? 'black' : 'white';
        const sq = move.to;
        let depth = 0;

        try {
            while (true) {
                depth++;
                const nextAttackerInfo = SEE.getSmallestAttacker(board, sq, side);
                if (!nextAttackerInfo) break;

                // Gain at this depth = AttackerValue - Gain[depth-1]
                // Wait, standard SEE formula:
                // gain[d] = value_of_victim - gain[d-1]
                // Here, 'attacker' is the piece that just moved onto 'sq' (the new victim)
                // 'nextAttackerInfo.value' is the value of the piece ABOUT TO CAPTURE.

                // Correct logic:
                // gain[0] = Value of Initial Victim (already set)
                // gain[1] = Value of Initial Attacker (now Victim) - gain[0]
                // gain[2] = Value of 2nd Attacker - gain[1]

                // So we push (attackerValue - gain[depth-1])
                gain.push(attackerValue - gain[depth - 1]);

                // Setup next iteration
                attackerValue = nextAttackerInfo.value;
                side = side === 'white' ? 'black' : 'white';

                // Execute capture
                movePiece(nextAttackerInfo.from, sq, nextAttackerInfo.piece);
            }
        } finally {
            // Revert changes in reverse order
            while (changes.length > 0) {
                const c = changes.pop();
                board.squares[c.from] = c.prevFrom;
                board.squares[c.to] = c.prevTo;
            }
        }

        // Minimax back up
        while (depth > 0) {
            gain[depth - 1] = -Math.max(-gain[depth - 1], gain[depth]);
            depth--;
        }
        return gain[0];
    }

    static getPieceValue(type) {
        const values = { 'pawn': 100, 'knight': 320, 'bishop': 330, 'rook': 500, 'queen': 900, 'king': 20000 };
        return values[type] || 0;
    }
}

module.exports = SEE;
