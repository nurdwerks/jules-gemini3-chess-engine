const Board = require('../src/Board');
const Bitboard = require('../src/Bitboard');

describe('Board Consistency', () => {
    function checkConsistency(board) {
        const issues = [];

        // Check 1: Every piece in squares must have corresponding bits
        for (let i = 0; i < 128; i++) {
            if (!board.isValidSquare(i)) continue;

            const piece = board.squares[i];
            if (piece) {
                const { row, col } = board.toRowCol(i);
                const bbRank = 7 - row;
                const bbSq = bbRank * 8 + col;
                const bit = 1n << BigInt(bbSq);

                if ((board.bitboards[piece.color] & bit) === 0n) {
                    issues.push(`Square ${i} has ${piece.color} ${piece.type} but ${piece.color} bitboard is missing bit at ${bbSq}`);
                }

                if ((board.bitboards[piece.type] & bit) === 0n) {
                    issues.push(`Square ${i} has ${piece.color} ${piece.type} but ${piece.type} bitboard is missing bit at ${bbSq}`);
                }
            }
        }

        // Check 2: Every bit in bitboards must have a piece in squares
        const colors = ['white', 'black'];
        const types = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

        for (const color of colors) {
            let bb = board.bitboards[color];
            while (bb) {
                const sq = Bitboard.lsb(bb);
                const row = 7 - Math.floor(sq / 8);
                const col = sq % 8;
                const index = (row << 4) | col;
                const piece = board.squares[index];

                if (!piece) {
                    issues.push(`Bitboard ${color} has bit at ${sq} but square ${index} is empty`);
                } else if (piece.color !== color) {
                    issues.push(`Bitboard ${color} has bit at ${sq} but square ${index} has ${piece.color} piece`);
                }
                bb &= (bb - 1n);
            }
        }

        for (const type of types) {
            let bb = board.bitboards[type];
            while (bb) {
                const sq = Bitboard.lsb(bb);
                const row = 7 - Math.floor(sq / 8);
                const col = sq % 8;
                const index = (row << 4) | col;
                const piece = board.squares[index];

                if (!piece) {
                    issues.push(`Bitboard ${type} has bit at ${sq} but square ${index} is empty`);
                } else if (piece.type !== type) {
                    issues.push(`Bitboard ${type} has bit at ${sq} but square ${index} has ${piece.type} piece`);
                }
                bb &= (bb - 1n);
            }
        }

        return issues;
    }

    function deepSearch(board, depth) {
        if (depth === 0) return;

        const moves = board.generateMoves();
        for (const move of moves) {
            const state = board.applyMove(move);

            const issues = checkConsistency(board);
            if (issues.length > 0) {
                throw new Error(`Consistency check failed after move ${board.moveToString(move)}\nFEN: ${board.generateFen()}\nIssues:\n${issues.join('\n')}`);
            }

            deepSearch(board, depth - 1);

            board.undoApplyMove(move, state);

            const issuesUndo = checkConsistency(board);
            if (issuesUndo.length > 0) {
                 throw new Error(`Consistency check failed after UNDO move ${board.moveToString(move)}\nFEN: ${board.generateFen()}\nIssues:\n${issuesUndo.join('\n')}`);
            }
        }
    }

    const fens = [
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1',
        'rnbqkb1r/ppp1pppp/5n2/3p4/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3',
        'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
        'rnbqk1nr/pppp1ppp/8/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 4',
        'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
        'r2k3r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQ - 0 1',
        'rnbqkbnr/pppp1ppp/8/4p3/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1',
        'rnb1kbnr/ppp2ppp/8/3qp3/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 4',
        'rnbqk1nr/pppp1ppp/8/4p3/4P3/8/PPPB1PPP/RN1QKBNR b KQkq - 0 1',
        '8/8/8/8/8/4p3/4K3/8 w - - 0 1',
        'rnbqkbnr/ppp1pppp/8/8/3pP3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        'rnbq1bnr/pPpppppp/8/8/8/8/1PP1PPPP/RNBQKBNR w KQ - 1 6',
        'rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
        'r3k2r/pppq1ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPPQ1PPP/R3K2R w KQkq - 2 8',
        'rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R b KQkq - 5 4',
        'r3k2r/pppq1ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPPQ1PPP/R1B1K2R b KQkq - 3 8',
        '4k3/8/8/8/8/8/PPPPPPPP/1R2K2R w BHbh - 0 1',
        '1r2k2r/pppppppp/8/8/8/8/8/4K3 b bh - 0 1',
        'k7/8/8/8/8/8/PPPPPPPP/1K1R3R w DHdh - 0 1',
        '1k1r3r/pppppppp/8/8/8/8/8/K7 b dh - 0 1',
        'k7/8/8/8/8/8/PPPPPPPP/R2K3R w AHah - 0 1',
        'r2k3r/pppppppp/8/8/8/8/8/K7 b ah - 0 1'
    ];

    test('All FENs should maintain consistency during search', () => {
        const board = new Board();
        for (const fen of fens) {
            board.loadFen(fen);
            const issues = checkConsistency(board);
            expect(issues).toEqual([]);
            deepSearch(board, 1); // Depth 1 is enough to trigger the single-move failures
        }
    });

    test('Known failing case depth 2', () => {
         const board = new Board();
         // The case that failed in investigation
         board.loadFen('4k3/8/8/8/8/8/PPPPPPPP/1R2K2R w BHbh - 0 1');
         deepSearch(board, 2);
    });
});
