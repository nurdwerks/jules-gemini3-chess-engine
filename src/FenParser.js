const Piece = require('./Piece');
const Bitboard = require('./Bitboard');
const Zobrist = require('./Zobrist');

class FenParser {
    static loadFen(board, fen) {
        const parts = fen.split(' ');
        if (parts.length < 4) throw new Error('Invalid FEN string: Must have at least 4 fields.');

        const placement = parts[0];
        const activeColor = parts[1];
        const castling = parts[2];
        const enPassant = parts[3];
        const halfMove = parts.length > 4 ? parts[4] : '0';
        const fullMove = parts.length > 5 ? parts[5] : '1';

        board.isChess960 = false;
        // Reset Bitboards
        board.bitboards = { white: 0n, black: 0n, pawn: 0n, knight: 0n, bishop: 0n, rook: 0n, queen: 0n, king: 0n };

        const rows = placement.split('/');
        if (rows.length !== 8) throw new Error('Invalid FEN string: Must have 8 ranks.');

        const pieceMap = {
            'p': { type: 'pawn', color: 'black' },
            'n': { type: 'knight', color: 'black' },
            'b': { type: 'bishop', color: 'black' },
            'r': { type: 'rook', color: 'black' },
            'q': { type: 'queen', color: 'black' },
            'k': { type: 'king', color: 'black' },
            'P': { type: 'pawn', color: 'white' },
            'N': { type: 'knight', color: 'white' },
            'B': { type: 'bishop', color: 'white' },
            'R': { type: 'rook', color: 'white' },
            'Q': { type: 'queen', color: 'white' },
            'K': { type: 'king', color: 'white' }
        };

        for (let r = 0; r < 8; r++) {
            let col = 0;
            const rowString = rows[r];
            for (let i = 0; i < rowString.length; i++) {
                const char = rowString[i];
                if (char >= '1' && char <= '8') {
                    col += parseInt(char, 10);
                } else if (pieceMap[char]) {
                    if (col > 7) throw new Error('Invalid FEN string: Too many pieces in rank.');
                    board.placePiece(r, col, new Piece(pieceMap[char].color, pieceMap[char].type));
                    col++;
                } else {
                    throw new Error(`Invalid FEN string: Unknown character '${char}'.`);
                }
            }
            if (col !== 8) throw new Error(`Invalid FEN string: Rank ${r} does not sum to 8 columns.`);
        }

        if (activeColor !== 'w' && activeColor !== 'b') throw new Error('Invalid FEN string: Invalid active color.');
        board.activeColor = activeColor;
        board.castlingRights = castling;
        FenParser.parseCastlingRights(board, castling);
        board.enPassantTarget = enPassant;
        board.halfMoveClock = parseInt(halfMove, 10);
        board.fullMoveNumber = parseInt(fullMove, 10);

        board.calculateZobristKey();
        board.history = [];
        FenParser.validatePosition(board);
    }

    static validatePosition(board) {
        // Validate bishops on opposite colors
        const bishops = { white: [], black: [] };

        const bishopBB = board.bitboards.bishop;
        let bb = bishopBB;
        while (bb) {
            const sq64 = Bitboard.lsb(bb);
            const color = (board.bitboards.white & (1n << BigInt(sq64))) ? 'white' : 'black';
            const r = 7 - Math.floor(sq64 / 8);
            const c = sq64 % 8;
            bishops[color].push((r << 4) | c);
            bb &= (bb - 1n);
        }

        if (board.fullMoveNumber === 1 && board.halfMoveClock === 0) {
            const checkBishops = (list) => {
                const light = list.filter(idx => FenParser.getSquareColor(board, idx) === 0).length;
                const dark = list.filter(idx => FenParser.getSquareColor(board, idx) === 1).length;
                if (light > 1 || dark > 1) {
                    throw new Error('Invalid FEN string: Bishops must be on opposite colors.');
                }
            };
            checkBishops(bishops.white);
            checkBishops(bishops.black);
        }
    }

    static getSquareColor(board, index) {
        const { row, col } = board.toRowCol(index);
        return (row + col) % 2;
    }

    static parseCastlingRights(board, rights) {
        board.castling = { w: { k: false, q: false }, b: { k: false, q: false } };
        board.castlingRooks = { white: [], black: [] };
        if (rights === '-') return;

        for (const char of rights) {
            if (char === 'K') {
                board.castling.w.k = true;
                FenParser.addCastlingRook(board, 'white', 7);
            } else if (char === 'Q') {
                board.castling.w.q = true;
                FenParser.addCastlingRook(board, 'white', 0);
            } else if (char === 'k') {
                board.castling.b.k = true;
                FenParser.addCastlingRook(board, 'black', 7);
            } else if (char === 'q') {
                board.castling.b.q = true;
                FenParser.addCastlingRook(board, 'black', 0);
            } else if (/[A-H]/.test(char) || /[a-h]/.test(char)) {
                board.isChess960 = true;
                const code = char.charCodeAt(0);
                if (code >= 65 && code <= 72) {
                    FenParser.addCastlingRook(board, 'white', code - 65);
                } else if (code >= 97 && code <= 104) {
                    FenParser.addCastlingRook(board, 'black', code - 97);
                }
            }
        }
        if (board.isChess960) {
            FenParser.update960CastlingRights(board, 'white');
            FenParser.update960CastlingRights(board, 'black');
        }
    }

    static update960CastlingRights(board, color) {
        const kingIndex = board.getKingIndex(color);
        let kingCol = -1;
        if (kingIndex !== -1) {
            kingCol = kingIndex & 7;
        }

        if (kingCol !== -1) {
            const rooks = board.castlingRooks[color].map(idx => idx & 7).sort((a, b) => a - b);
            const prefix = color === 'white' ? 'w' : 'b';

            const leftRooks = rooks.filter(rCol => rCol < kingCol);
            const rightRooks = rooks.filter(rCol => rCol > kingCol);

            if (rightRooks.length > 0) board.castling[prefix].k = true;
            if (leftRooks.length > 0) board.castling[prefix].q = true;
        }
    }

    static addCastlingRook(board, color, file) {
        const rank = color === 'white' ? 7 : 0;
        const index = (rank << 4) | file;
        board.castlingRooks[color].push(index);
    }

    static generateFen(board) {
        let placement = '';
        for (let r = 0; r < 8; r++) {
            let emptyCount = 0;
            for (let c = 0; c < 8; c++) {
                const piece = board.getPiece(board.toIndex(r, c));
                if (piece) {
                    if (emptyCount > 0) {
                        placement += emptyCount;
                        emptyCount = 0;
                    }
                    let char = '';
                    switch (piece.type) {
                        case 'pawn': char = 'p'; break;
                        case 'knight': char = 'n'; break;
                        case 'bishop': char = 'b'; break;
                        case 'rook': char = 'r'; break;
                        case 'queen': char = 'q'; break;
                        case 'king': char = 'k'; break;
                    }
                    if (piece.color === 'white') char = char.toUpperCase();
                    placement += char;
                } else {
                    emptyCount++;
                }
            }
            if (emptyCount > 0) placement += emptyCount;
            if (r < 7) placement += '/';
        }
        return `${placement} ${board.activeColor} ${board.castlingRights} ${board.enPassantTarget} ${board.halfMoveClock} ${board.fullMoveNumber}`;
    }
}

module.exports = FenParser;
