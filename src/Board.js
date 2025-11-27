const Piece = require('./Piece');
const Zobrist = require('./Zobrist');
const Bitboard = require('./Bitboard');
const trace = require('./trace');
class Board {
  constructor() {
    this.activeColor = 'w';
    this.castlingRights = 'KQkq';
    this.enPassantTarget = '-';
    this.halfMoveClock = 0;
    this.fullMoveNumber = 1;
    this.zobristKey = 0n;
    this.history = []; // Array of hashes for repetition detection
    this.castling = { w: { k: false, q: false }, b: { k: false, q: false } }; // Backward compatibility structure
    this.castlingRooks = { white: [], black: [] }; // Stores 0x88 indices of castling rooks
    this.isChess960 = false;

    // Bitboards
    this.bitboards = {
        white: 0n,
        black: 0n,
        pawn: 0n,
        knight: 0n,
        bishop: 0n,
        rook: 0n,
        queen: 0n,
        king: 0n
    };

    this.setupBoard();
  }

  toIndex(row, col) {
    return (row << 4) | col;
  }

  algebraicToIndex(alg) {
    const col = alg.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = parseInt(alg[1], 10);
    const row = 8 - rank;
    return this.toIndex(row, col);
  }

  toRowCol(index) {
    return {
      row: index >> 4,
      col: index & 7
    };
  }

  isValidSquare(index) {
    return (index & 0x88) === 0;
  }

  placePiece(row, col, piece) {
    const index = this.toIndex(row, col);
    if (this.isValidSquare(index)) {
      // Update Bitboards
      const bbRank = 7 - row;
      const bbSq = bbRank * 8 + col;
      const bit = 1n << BigInt(bbSq);
      this.bitboards[piece.color] |= bit;
      this.bitboards[piece.type] |= bit;
    }
  }

  toggleBitboard(piece, index) {
      if (!piece) return;
      const { row, col } = this.toRowCol(index);
      const bbRank = 7 - row;
      const bbSq = bbRank * 8 + col;
      const bit = 1n << BigInt(bbSq);
      this.bitboards[piece.color] ^= bit;
      this.bitboards[piece.type] ^= bit;
  }

  makeMove(move) {
      // Deduce captured piece if not provided
      let captured = move.captured;
      if (captured === undefined) {
          // If move.captured is undefined, check the board.
          captured = this.getPiece(move.to);
      }

      // Update Bitboards
      this.toggleBitboard(move.piece, move.from);
      if (captured) {
          this.toggleBitboard(captured, move.to);
      }

      if (!move.piece) {
          console.error("Board.makeMove: move.piece is null!", move);
          return null;
      }

      const pieceType = move.promotion ? ({ 'q': 'queen', 'r': 'rook', 'b': 'bishop', 'n': 'knight' }[move.promotion]) : move.piece.type;
      const color = move.piece.color;

      const { row: toRow, col: toCol } = this.toRowCol(move.to);
      const bbRank = 7 - toRow;
      const bbSq = bbRank * 8 + toCol;
      const toBit = 1n << BigInt(bbSq);

      this.bitboards[color] |= toBit;
      this.bitboards[pieceType] |= toBit;

      if (move.flags === 'e' || move.flags === 'ep') {
        const isWhite = move.piece.color === 'white';
        const captureSq = isWhite ? move.to + 16 : move.to - 16;
        const capPawn = this.getPiece(captureSq); // Must lookup en-passant capture
        if (capPawn) {
            this.toggleBitboard(capPawn, captureSq);
        }
      }

      if (move.flags === 'k' || move.flags === 'q' || move.flags === 'k960' || move.flags === 'q960') {
          if (move.flags === 'k960' || move.flags === 'q960') {
              const kingSource = move.from;
              const rookSource = move.rookSource;
              const kingTarget = move.to;
              const isKingside = move.flags === 'k960';
              const rank = move.piece.color === 'white' ? 7 : 0;
              const rookTargetFile = isKingside ? 5 : 3;
              const rookTarget = (rank << 4) | rookTargetFile;

              const rook = new Piece(move.piece.color, 'rook');

              this.toggleBitboard(rook, rookSource);
              this.toggleBitboard(rook, rookTarget);
          } else {
              if (move.piece.color === 'white') {
                  if (move.flags === 'k') {
                      const rook = new Piece('white', 'rook');
                      this.toggleBitboard(rook, 119);
                      this.toggleBitboard(rook, 117);
                  } else {
                      const rook = new Piece('white', 'rook');
                      this.toggleBitboard(rook, 112);
                      this.toggleBitboard(rook, 115);
                  }
              } else {
                  if (move.flags === 'k') {
                      const rook = new Piece('black', 'rook');
                      this.toggleBitboard(rook, 7);
                      this.toggleBitboard(rook, 5);
                  } else {
                      const rook = new Piece('black', 'rook');
                      this.toggleBitboard(rook, 0);
                      this.toggleBitboard(rook, 3);
                  }
              }
          }
      }
      return captured;
  }

  unmakeMove(move, captured) {
      if (!move.piece) {
          console.error("Board.unmakeMove: move.piece is null!", move);
          return;
      }

      const pieceType = move.promotion ? ({ 'q': 'queen', 'r': 'rook', 'b': 'bishop', 'n': 'knight' }[move.promotion]) : move.piece.type;
      const color = move.piece.color;

      const { row: toRow, col: toCol } = this.toRowCol(move.to);
      const bbRank = 7 - toRow;
      const bbSq = bbRank * 8 + toCol;
      const toBit = 1n << BigInt(bbSq);

      this.bitboards[color] ^= toBit;
      this.bitboards[pieceType] ^= toBit;

      this.toggleBitboard(move.piece, move.from);

      if (captured) {
          this.toggleBitboard(captured, move.to);
      }

      if (move.flags === 'e') {
          const isWhite = move.piece.color === 'white';
          const captureSq = isWhite ? move.to + 16 : move.to - 16;
          const capturedPawn = new Piece(isWhite ? 'black' : 'white', 'pawn');
          this.toggleBitboard(capturedPawn, captureSq);
      }

      if (move.flags === 'k' || move.flags === 'q' || move.flags === 'k960' || move.flags === 'q960') {
          if (move.flags === 'k960' || move.flags === 'q960') {
              const rookSource = move.rookSource;
              const isKingside = move.flags === 'k960';
              const rank = move.piece.color === 'white' ? 7 : 0;
              const rookTargetFile = isKingside ? 5 : 3;
              const rookTarget = (rank << 4) | rookTargetFile;

              const rook = new Piece(move.piece.color, 'rook');
              this.toggleBitboard(rook, rookTarget);
              this.toggleBitboard(rook, rookSource);
          } else {
              if (move.piece.color === 'white') {
                  if (move.flags === 'k') {
                      const rook = new Piece('white', 'rook');
                      this.toggleBitboard(rook, 117);
                      this.toggleBitboard(rook, 119);
                  } else {
                      const rook = new Piece('white', 'rook');
                      this.toggleBitboard(rook, 115);
                      this.toggleBitboard(rook, 112);
                  }
              } else {
                  if (move.flags === 'k') {
                      const rook = new Piece('black', 'rook');
                      this.toggleBitboard(rook, 5);
                      this.toggleBitboard(rook, 7);
                  } else {
                      const rook = new Piece('black', 'rook');
                      this.toggleBitboard(rook, 3);
                      this.toggleBitboard(rook, 0);
                  }
              }
          }
      }
  }

  setupBoard() {
    const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    this.loadFen(START_FEN);
  }

  getPiece(row, col) {
    let index;
    if (typeof col !== 'undefined') {
        index = this.toIndex(row, col);
    } else {
        index = row;
    }
    if (!this.isValidSquare(index)) return null;

    const sq64 = Bitboard.to64(index);
    const bit = 1n << BigInt(sq64);

    if (!((this.bitboards.white | this.bitboards.black) & bit)) return null;

    const color = (this.bitboards.white & bit) ? 'white' : 'black';
    let type = 'pawn';
    if (this.bitboards.pawn & bit) type = 'pawn';
    else if (this.bitboards.knight & bit) type = 'knight';
    else if (this.bitboards.bishop & bit) type = 'bishop';
    else if (this.bitboards.rook & bit) type = 'rook';
    else if (this.bitboards.queen & bit) type = 'queen';
    else if (this.bitboards.king & bit) type = 'king';

    return new Piece(color, type);
  }

  getKingIndex(kingColor) {
    const kingBB = this.bitboards.king & this.bitboards[kingColor];
    if (kingBB === 0n) return -1;
    const sq64 = Bitboard.lsb(kingBB);
    // Convert 64 to 0x88
    const row = 7 - Math.floor(sq64 / 8);
    const col = sq64 % 8;
    return (row << 4) | col;
  }

  isKingInCheck(kingColor) {
      const opponentColor = kingColor === 'white' ? 'black' : 'white';
      const kingIndex = this.getKingIndex(kingColor);
      if (kingIndex === -1) {
          return false;
      }
      return this.isSquareAttacked(kingIndex, opponentColor);
  }

  isInCheck() {
      const kingColor = this.activeColor === 'w' ? 'white' : 'black';
      return this.isKingInCheck(kingColor);
  }

  isSquareAttacked(squareIndex, attackingSide) {
    if (!this.isValidSquare(squareIndex)) return false;

    const { row, col } = this.toRowCol(squareIndex);
    const bbRank = 7 - row;
    const bbSq = bbRank * 8 + col;

    const occupancy = this.bitboards.white | this.bitboards.black;

    const knights = this.bitboards.knight & this.bitboards[attackingSide];
    if ((Bitboard.getKnightAttacks(bbSq) & knights) !== 0n) return true;

    if (attackingSide === 'white') {
        const whitePawns = this.bitboards.pawn & this.bitboards.white;
        if (bbRank > 0) {
            if (col > 0 && ((whitePawns >> BigInt(bbSq - 9)) & 1n)) return true;
            if (col < 7 && ((whitePawns >> BigInt(bbSq - 7)) & 1n)) return true;
        }
    } else {
        const blackPawns = this.bitboards.pawn & this.bitboards.black;
        if (bbRank < 7) {
            if (col > 0 && ((blackPawns >> BigInt(bbSq + 7)) & 1n)) return true;
            if (col < 7 && ((blackPawns >> BigInt(bbSq + 9)) & 1n)) return true;
        }
    }

    const king = this.bitboards.king & this.bitboards[attackingSide];
    if ((Bitboard.getKingAttacks(bbSq) & king) !== 0n) return true;

    const rq = (this.bitboards.rook | this.bitboards.queen) & this.bitboards[attackingSide];
    if ((Bitboard.getRookAttacks(bbSq, occupancy) & rq) !== 0n) return true;

    const bq = (this.bitboards.bishop | this.bitboards.queen) & this.bitboards[attackingSide];
    if ((Bitboard.getBishopAttacks(bbSq, occupancy) & bq) !== 0n) return true;

    return false;
  }

  generateMoves() {
    trace(`generateMoves(color: ${this.activeColor})`);
    const moves = [];
    const color = this.activeColor === 'w' ? 'white' : 'black';
    const opponent = this.activeColor === 'w' ? 'black' : 'white';

    const us = this.bitboards[color];
    const them = this.bitboards[opponent];
    const occupancy = us | them;

    const addMoves = (pieceType, fromSq, attacks) => {
        const fromRow = 7 - Math.floor(fromSq / 8);
        const fromCol = fromSq % 8;
        const from0x88 = (fromRow << 4) | fromCol;
        const piece = new Piece(color, pieceType);

        let targets = attacks & ~us;
        while (targets) {
            const toSq = Bitboard.lsb(targets);
            const toRow = 7 - Math.floor(toSq / 8);
            const toCol = toSq % 8;
            const to0x88 = (toRow << 4) | toCol;

            const isCapture = (them & (1n << BigInt(toSq))) !== 0n;
            if (isCapture) {
                // Find captured piece type
                const toBit = 1n << BigInt(toSq);
                let capturedPiece = null;
                if (this.bitboards.pawn & toBit) capturedPiece = new Piece(opponent, 'pawn');
                else if (this.bitboards.knight & toBit) capturedPiece = new Piece(opponent, 'knight');
                else if (this.bitboards.bishop & toBit) capturedPiece = new Piece(opponent, 'bishop');
                else if (this.bitboards.rook & toBit) capturedPiece = new Piece(opponent, 'rook');
                else if (this.bitboards.queen & toBit) capturedPiece = new Piece(opponent, 'queen');
                else if (this.bitboards.king & toBit) capturedPiece = new Piece(opponent, 'king');

                moves.push({ from: from0x88, to: to0x88, flags: 'c', piece: piece, captured: capturedPiece });
            } else {
                moves.push({ from: from0x88, to: to0x88, flags: 'n', piece: piece, captured: null });
            }

            targets &= (targets - 1n);
        }
    };

    let knights = this.bitboards.knight & us;
    while (knights) {
        const fromSq = Bitboard.lsb(knights);
        const attacks = Bitboard.getKnightAttacks(fromSq);
        addMoves('knight', fromSq, attacks);
        knights &= (knights - 1n);
    }

    let kings = this.bitboards.king & us;
    while (kings) {
        const fromSq = Bitboard.lsb(kings);
        const attacks = Bitboard.getKingAttacks(fromSq);
        addMoves('king', fromSq, attacks);
        kings &= (kings - 1n);

        const from0x88 = this.toIndex(7 - Math.floor(fromSq/8), fromSq%8);
        const piece = new Piece(color, 'king');

        if (!this.isSquareAttacked(from0x88, opponent)) {
          if (this.isChess960) {
           const rooks = this.castlingRooks[color];
           for (const rookIndex of rooks) {
               const rookPiece = this.getPiece(rookIndex);
               if (!rookPiece || rookPiece.type !== 'rook' || rookPiece.color !== color) continue;

               const kingCol = from0x88 & 7;
               const rookCol = rookIndex & 7;

               const isKingside = rookCol > kingCol;
               let canCastle = (isKingside && this.castling[color === 'white' ? 'w' : 'b'].k) || (!isKingside && this.castling[color === 'white' ? 'w' : 'b'].q);
               if (!canCastle) continue;
               const targetFile = isKingside ? 6 : 2;
               const rank = color === 'white' ? 7 : 0;
               const kingTargetIndex = (rank << 4) | targetFile;
               const rookTargetFile = isKingside ? 5 : 3;
               const rookTargetIndex = (rank << 4) | rookTargetFile;

               const kingPath = [from0x88, kingTargetIndex].sort((a,b)=>a-b);
               const rookPath = [rookIndex, rookTargetIndex].sort((a,b)=>a-b);

               const squaresToCheck = new Set();
               for (let i = kingPath[0]; i <= kingPath[1]; i++) squaresToCheck.add(i);
               for (let i = rookPath[0]; i <= rookPath[1]; i++) squaresToCheck.add(i);

               let pathClear = true;
               for (const sq of squaresToCheck) {
                   if (sq !== from0x88 && sq !== rookIndex) {
                       if (this.getPiece(sq)) {
                           pathClear = false; // Obstruction
                           break;
                       }
                   }
               }
               if (!pathClear) continue;

               let kingAttacked = false;
               for (let i = kingPath[0]; i <= kingPath[1]; i++) {
                   if (this.isSquareAttacked(i, opponent)) {
                       kingAttacked = true;
                       break;
                   }
               }
               if (kingAttacked) continue;

               if (this.isChess960) {
                    const flag = isKingside ? 'k960' : 'q960';
                    moves.push({ from: from0x88, to: kingTargetIndex, flags: flag, piece: piece, rookSource: rookIndex });
               } else {
                   if (isKingside) {
                       moves.push({ from: from0x88, to: kingTargetIndex, flags: 'k', piece: piece });
                   } else {
                       moves.push({ from: from0x88, to: kingTargetIndex, flags: 'q', piece: piece });
                   }
               }
           }
         } else { // Standard chess
            const kingIndex = from0x88;
            const kingPiece = piece;

            if (this.castling[color === 'white' ? 'w' : 'b'].k) {
                const rook = this.getPiece(kingIndex + 3);
                if (rook && rook.type === 'rook' && !this.getPiece(kingIndex+1) && !this.getPiece(kingIndex+2) &&
                    !this.isSquareAttacked(kingIndex, opponent) && !this.isSquareAttacked(kingIndex+1, opponent) && !this.isSquareAttacked(kingIndex+2, opponent)) {
                    moves.push({ from: kingIndex, to: kingIndex + 2, flags: 'k', piece: kingPiece });
                }
            }
            if (this.castling[color === 'white' ? 'w' : 'b'].q) {
                const rook = this.getPiece(kingIndex - 4);
                if (rook && rook.type === 'rook' && !this.getPiece(kingIndex-1) && !this.getPiece(kingIndex-2) && !this.getPiece(kingIndex-3) &&
                    !this.isSquareAttacked(kingIndex, opponent) && !this.isSquareAttacked(kingIndex-1, opponent) && !this.isSquareAttacked(kingIndex-2, opponent)) {
                    moves.push({ from: kingIndex, to: kingIndex - 2, flags: 'q', piece: kingPiece });
                }
            }
          }
        }
    }

    let rooks = this.bitboards.rook & us;
    while (rooks) {
        const fromSq = Bitboard.lsb(rooks);
        const attacks = Bitboard.getRookAttacks(fromSq, occupancy);
        addMoves('rook', fromSq, attacks);
        rooks &= (rooks - 1n);
    }

    let bishops = this.bitboards.bishop & us;
    while (bishops) {
        const fromSq = Bitboard.lsb(bishops);
        const attacks = Bitboard.getBishopAttacks(fromSq, occupancy);
        addMoves('bishop', fromSq, attacks);
        bishops &= (bishops - 1n);
    }

    let queens = this.bitboards.queen & us;
    while (queens) {
        const fromSq = Bitboard.lsb(queens);
        const attacks = Bitboard.getRookAttacks(fromSq, occupancy) | Bitboard.getBishopAttacks(fromSq, occupancy);
        addMoves('queen', fromSq, attacks);
        queens &= (queens - 1n);
    }

    let pawns = this.bitboards.pawn & us;
    while (pawns) {
        const fromSq = Bitboard.lsb(pawns);
        const fromRow = 7 - Math.floor(fromSq / 8);
        const fromCol = fromSq % 8;
        const from0x88 = (fromRow << 4) | fromCol;
        const piece = new Piece(color, 'pawn');

        const forward = color === 'white' ? -16 : 16;
        const targetSingle = from0x88 + forward;
        if (this.isValidSquare(targetSingle) && !this.getPiece(targetSingle)) {
            const targetRow = targetSingle >> 4;
            const promotionRank = color === 'white' ? 0 : 7;
            if (targetRow === promotionRank) {
                 ['q', 'r', 'b', 'n'].forEach(promo => {
                   moves.push({ from: from0x88, to: targetSingle, flags: 'p', piece: piece, promotion: promo });
                 });
            } else {
                 moves.push({ from: from0x88, to: targetSingle, flags: 'n', piece: piece });
                 const startRank = color === 'white' ? 6 : 1;
                 const currentRow = from0x88 >> 4;
                 const targetDouble = from0x88 + (forward * 2);
                 if (currentRow === startRank && this.isValidSquare(targetDouble) && !this.getPiece(targetDouble)) {
                   moves.push({ from: from0x88, to: targetDouble, flags: 'n', piece: piece });
                 }
            }
        }

        const captureOffsets = color === 'white' ? [-17, -15] : [15, 17];
        for (const capOffset of captureOffsets) {
          const targetCap = from0x88 + capOffset;
          if (this.isValidSquare(targetCap)) {
            const targetPiece = this.getPiece(targetCap);
            if (targetPiece && targetPiece.color === opponent) {
               const targetRow = targetCap >> 4;
               const promotionRank = color === 'white' ? 0 : 7;
               if (targetRow === promotionRank) {
                   ['q', 'r', 'b', 'n'].forEach(promo => {
                     moves.push({ from: from0x88, to: targetCap, flags: 'cp', piece: piece, captured: targetPiece, promotion: promo });
                   });
               } else {
                   moves.push({ from: from0x88, to: targetCap, flags: 'c', piece: piece, captured: targetPiece });
               }
            } else if (!targetPiece && this.enPassantTarget !== '-') {
               const epIndex = this.algebraicToIndex(this.enPassantTarget);
               if (targetCap === epIndex) {
                   moves.push({ from: from0x88, to: targetCap, flags: 'e', piece: piece });
               }
            }
          }
        }

        pawns &= (pawns - 1n);
    }

    const movingColor = this.activeColor === 'w' ? 'white' : 'black';
    return moves.filter(move => {
      const captured = this.makeMove(move);
      const legal = !this.isKingInCheck(movingColor);
      this.unmakeMove(move, captured);
      return legal;
    });
  }

  loadFen(fen) {
    const parts = fen.split(' ');
    if (parts.length < 4) throw new Error('Invalid FEN string: Must have at least 4 fields.');

    const placement = parts[0];
    const activeColor = parts[1];
    const castling = parts[2];
    const enPassant = parts[3];
    const halfMove = parts.length > 4 ? parts[4] : '0';
    const fullMove = parts.length > 5 ? parts[5] : '1';

    // No more squares array
    this.isChess960 = false;
    // Reset Bitboards
    this.bitboards = { white: 0n, black: 0n, pawn: 0n, knight: 0n, bishop: 0n, rook: 0n, queen: 0n, king: 0n };

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
            this.placePiece(r, col, new Piece(pieceMap[char].color, pieceMap[char].type));
            col++;
        } else {
            throw new Error(`Invalid FEN string: Unknown character '${char}'.`);
        }
      }
      if (col !== 8) throw new Error(`Invalid FEN string: Rank ${r} does not sum to 8 columns.`);
    }

    if (activeColor !== 'w' && activeColor !== 'b') throw new Error('Invalid FEN string: Invalid active color.');
    this.activeColor = activeColor;
    this.castlingRights = castling;
    this.parseCastlingRights(castling);
    this.enPassantTarget = enPassant;
    this.halfMoveClock = parseInt(halfMove, 10);
    this.fullMoveNumber = parseInt(fullMove, 10);

    this.calculateZobristKey();
    this.history = [];
    this.validatePosition();
  }

  validatePosition() {
      const lightSq = 0x55AA55AA55AA55AAn;
      const darkSq = ~lightSq;

      if (this.fullMoveNumber === 1 && this.halfMoveClock === 0) {
         const check = (color) => {
             const bishops = this.bitboards.bishop & this.bitboards[color];
             const lightCount = Bitboard.popcnt(bishops & lightSq);
             const darkCount = Bitboard.popcnt(bishops & darkSq);
             if (lightCount > 1 || darkCount > 1) {
                  throw new Error('Invalid FEN string: Bishops must be on opposite colors.');
             }
         }
         check('white');
         check('black');
      }
  }

  getSquareColor(index) {
      const { row, col } = this.toRowCol(index);
      return (row + col) % 2;
  }

  getPiece(indexOrRow, col) {
    let index;
    if (typeof col !== 'undefined') {
        index = this.toIndex(indexOrRow, col);
    } else {
        index = indexOrRow;
    }

    if (!this.isValidSquare(index)) return null;
    const sq64 = Bitboard.to64(index);
    const bit = 1n << BigInt(sq64);

    if (!((this.bitboards.white | this.bitboards.black) & bit)) return null;

    const color = (this.bitboards.white & bit) ? 'white' : 'black';
    let type = 'pawn';
    if (this.bitboards.pawn & bit) type = 'pawn';
    else if (this.bitboards.knight & bit) type = 'knight';
    else if (this.bitboards.bishop & bit) type = 'bishop';
    else if (this.bitboards.rook & bit) type = 'rook';
    else if (this.bitboards.queen & bit) type = 'queen';
    else if (this.bitboards.king & bit) type = 'king';

    return new Piece(color, type);
  }

  checkKingRookPlacement(color) {
    if (this.fullMoveNumber === 1 && this.halfMoveClock === 0) {
      const rights = this.castlingRooks[color];
      if (!rights || rights.length === 0) return;

      const kingIndex = this.getKingIndex(color);
      if (kingIndex === -1) return;

      const kingCol = kingIndex & 7;
      const rookCols = rights.map(idx => idx & 7).sort((a, b) => a - b);

      if (rookCols.length >= 2) {
          const leftRook = rookCols[0];
          const rightRook = rookCols[rookCols.length - 1];
          if (!(leftRook < kingCol && rightRook > kingCol)) {
               throw new Error('Invalid FEN string: King must be between Rooks.');
          }
      }
    }
  }

  calculateZobristKey() {
      let key = 0n;
      // Iterate all pieces efficiently
      for (const color of ['white', 'black']) {
          for (const type of ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']) {
              let bb = this.bitboards[type] & this.bitboards[color];
              while (bb) {
                  const sq64 = Bitboard.lsb(bb);
                  // Convert to 0x88 index
                  const row = 7 - Math.floor(sq64 / 8);
                  const col = sq64 % 8;
                  const idx = (row << 4) | col;

                  const { c, t } = Zobrist.getPieceIndex(color, type);
                  key ^= Zobrist.pieces[c][t][idx];

                  bb &= (bb - 1n);
              }
          }
      }

      if (this.activeColor === 'b') key ^= Zobrist.sideToMove;
      key ^= this.getCastlingHash(this.castlingRights);
      const epIndex = Zobrist.getEpIndex(this.enPassantTarget);
      if (epIndex !== -1) key ^= Zobrist.enPassant[epIndex];
      this.zobristKey = key;
  }

  parseCastlingRights(rights) {
      this.castling = { w: { k: false, q: false }, b: { k: false, q: false } };
      this.castlingRooks = { white: [], black: [] };
      if (rights === '-') return;

      for (const char of rights) {
          if (char === 'K') {
              this.castling.w.k = true;
              this.addCastlingRook('white', 7);
          } else if (char === 'Q') {
              this.castling.w.q = true;
              this.addCastlingRook('white', 0);
          } else if (char === 'k') {
              this.castling.b.k = true;
              this.addCastlingRook('black', 7);
          } else if (char === 'q') {
              this.castling.b.q = true;
              this.addCastlingRook('black', 0);
          } else if (/[A-H]/.test(char) || /[a-h]/.test(char)) {
              this.isChess960 = true;
              const code = char.charCodeAt(0);
              if (code >= 65 && code <= 72) {
                  this.addCastlingRook('white', code - 65);
              } else if (code >= 97 && code <= 104) {
                  this.addCastlingRook('black', code - 97);
              }
          }
      }
       if (this.isChess960) {
          this.update960CastlingRights('white');
          this.update960CastlingRights('black');
      }
  }
  update960CastlingRights(color) {
    const kingRow = color === 'white' ? 7 : 0;
    const kingBB = this.bitboards.king & this.bitboards[color];
    if (kingBB === 0n) return;
    const kingSq = Bitboard.lsb(kingBB);
    const kingCol = kingSq % 8;

    if (kingCol !== -1) {
        const rooks = this.castlingRooks[color].map(idx => idx & 7).sort((a,b)=>a-b);
        const prefix = color === 'white' ? 'w' : 'b';

        const leftRooks = rooks.filter(rCol => rCol < kingCol);
        const rightRooks = rooks.filter(rCol => rCol > kingCol);

        if (rightRooks.length > 0) this.castling[prefix].k = true;
        if (leftRooks.length > 0) this.castling[prefix].q = true;
    }
  }
  addCastlingRook(color, file) {
      const rank = color === 'white' ? 7 : 0;
      const index = (rank << 4) | file;
      this.castlingRooks[color].push(index);
  }

  getCastlingHash(rights) {
      if (rights === '-') return 0n;
      let hash = 0n;
      for (const char of rights) {
          if (char === 'K') hash ^= Zobrist.castling[0][7];
          else if (char === 'Q') hash ^= Zobrist.castling[0][0];
          else if (char === 'k') hash ^= Zobrist.castling[1][7];
          else if (char === 'q') hash ^= Zobrist.castling[1][0];
          else {
              const code = char.charCodeAt(0);
              if (code >= 65 && code <= 72) hash ^= Zobrist.castling[0][code - 65];
              else if (code >= 97 && code <= 104) hash ^= Zobrist.castling[1][code - 97];
          }
      }
      return hash;
  }

  applyMove(move) {
    const state = {
      activeColor: this.activeColor,
      castlingRights: this.castlingRights,
      enPassantTarget: this.enPassantTarget,
      halfMoveClock: this.halfMoveClock,
      fullMoveNumber: this.fullMoveNumber,
      zobristKey: this.zobristKey,
      capturedPiece: null
    };

    if (!move.piece) {
         throw new Error("Board.applyMove: move.piece is null");
    }

    let { c, t } = Zobrist.getPieceIndex(move.piece.color, move.piece.type);
    this.zobristKey ^= Zobrist.pieces[c][t][move.from];

    // Get captured piece using getPiece
    const capturedPiece = this.getPiece(move.to);

    if (capturedPiece) {
        const capIdx = Zobrist.getPieceIndex(capturedPiece.color, capturedPiece.type);
        this.zobristKey ^= Zobrist.pieces[capIdx.c][capIdx.t][move.to];
    } else if (move.flags === 'e' || move.flags === 'ep') {
         const isWhite = move.piece.color === 'white';
         const captureSq = isWhite ? move.to + 16 : move.to - 16;
         const capColor = isWhite ? 'black' : 'white';
         const capIdx = Zobrist.getPieceIndex(capColor, 'pawn');
         this.zobristKey ^= Zobrist.pieces[capIdx.c][capIdx.t][captureSq];
    }

    if (move.promotion) {
        const promoType = { 'q': 'queen', 'r': 'rook', 'b': 'bishop', 'n': 'knight' }[move.promotion];
        const promoIdx = Zobrist.getPieceIndex(move.piece.color, promoType);
        this.zobristKey ^= Zobrist.pieces[promoIdx.c][promoIdx.t][move.to];
    } else {
        this.zobristKey ^= Zobrist.pieces[c][t][move.to];
    }

    if (move.flags === 'k' || move.flags === 'q') {
        if (move.piece.color === 'white') {
             const rookIdx = Zobrist.getPieceIndex('white', 'rook');
             if (move.flags === 'k') {
                 this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][119];
                 this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][117];
             } else {
                 this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][112];
                 this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][115];
             }
        } else {
             const rookIdx = Zobrist.getPieceIndex('black', 'rook');
             if (move.flags === 'k') {
                 this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][7];
                 this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][5];
             } else {
                 this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][0];
                 this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][3];
             }
        }
    }

    this.zobristKey ^= Zobrist.sideToMove;
    this.zobristKey ^= this.getCastlingHash(this.castlingRights);

    const oldEpIndex = Zobrist.getEpIndex(this.enPassantTarget);
    if (oldEpIndex !== -1) this.zobristKey ^= Zobrist.enPassant[oldEpIndex];

    const madeCapturedPiece = this.makeMove(move);
    state.capturedPiece = madeCapturedPiece;

    this.activeColor = this.activeColor === 'w' ? 'b' : 'w';
    this.updateCastlingRights(move, madeCapturedPiece);
    this.zobristKey ^= this.getCastlingHash(this.castlingRights);

    this.updateEnPassant(move);
    const newEpIndex = Zobrist.getEpIndex(this.enPassantTarget);
    if (newEpIndex !== -1) this.zobristKey ^= Zobrist.enPassant[newEpIndex];

    this.halfMoveClock++;
    if (move.piece.type === 'pawn' || madeCapturedPiece) this.halfMoveClock = 0;
    if (this.activeColor === 'w') this.fullMoveNumber++;

    this.history.push(this.zobristKey);
    return state;
  }

  makeNullMove() {
      const state = {
          activeColor: this.activeColor,
          castlingRights: this.castlingRights,
          enPassantTarget: this.enPassantTarget,
          halfMoveClock: this.halfMoveClock,
          fullMoveNumber: this.fullMoveNumber,
          zobristKey: this.zobristKey,
          capturedPiece: null
      };
      this.zobristKey ^= Zobrist.sideToMove;
      const oldEpIndex = Zobrist.getEpIndex(this.enPassantTarget);
      if (oldEpIndex !== -1) this.zobristKey ^= Zobrist.enPassant[oldEpIndex];
      this.enPassantTarget = '-';
      this.activeColor = this.activeColor === 'w' ? 'b' : 'w';
      this.halfMoveClock++;
      return state;
  }

  undoNullMove(state) {
      this.activeColor = state.activeColor;
      this.castlingRights = state.castlingRights;
      this.enPassantTarget = state.enPassantTarget;
      this.halfMoveClock = state.halfMoveClock;
      this.fullMoveNumber = state.fullMoveNumber;
      this.zobristKey = state.zobristKey;
  }

  undoApplyMove(move, state) {
    this.unmakeMove(move, state.capturedPiece);
    this.activeColor = state.activeColor;
    this.castlingRights = state.castlingRights;
    this.enPassantTarget = state.enPassantTarget;
    this.halfMoveClock = state.halfMoveClock;
    this.fullMoveNumber = state.fullMoveNumber;
    this.zobristKey = state.zobristKey;
    this.history.pop();
  }

  updateCastlingRights(move, capturedPiece) {
    if (this.castlingRights === '-') return;
    const removeRight = (char) => {
      this.castlingRights = this.castlingRights.replace(char, '');
      if (this.castlingRights === '') this.castlingRights = '-';
    };

    if (move.piece.type === 'king') {
      if (move.piece.color === 'white') {
        removeRight('K'); removeRight('Q');
      } else {
        removeRight('k'); removeRight('q');
      }
    }
    if (move.piece.type === 'rook') {
      if (move.from === 119) removeRight('K');
      else if (move.from === 112) removeRight('Q');
      else if (move.from === 7) removeRight('k');
      else if (move.from === 0) removeRight('q');
    }
    if (capturedPiece && capturedPiece.type === 'rook') {
       if (move.to === 119) removeRight('K');
       else if (move.to === 112) removeRight('Q');
       else if (move.to === 7) removeRight('k');
       else if (move.to === 0) removeRight('q');
    }
  }

  updateEnPassant(move) {
    if (move.piece.type === 'pawn') {
      const diff = Math.abs(move.to - move.from);
      if (diff === 32) {
         const isWhite = move.piece.color === 'white';
         const epIndex = isWhite ? move.from - 16 : move.from + 16;
         const { row, col } = this.toRowCol(epIndex);
         const file = String.fromCharCode('a'.charCodeAt(0) + col);
         const rank = 8 - row;
         this.enPassantTarget = `${file}${rank}`;
         return;
      }
    }
    this.enPassantTarget = '-';
  }

  isDrawBy50Moves() {
    return this.halfMoveClock >= 100;
  }

  isDrawByRepetition() {
    let count = 0;
    for (let i = this.history.length - 1; i >= 0; i--) {
        if (this.history[i] === this.zobristKey) {
            count++;
        }
    }
    return count >= 2;
  }

  perft(depth) {
    trace(`perft(depth: ${depth})`);
    if (depth === 0) return 1;
    const moves = this.generateMoves();
    trace(`perft(depth: ${depth}, moves: ${moves.length})`);
    let nodes = 0;
    for (const move of moves) {
      const state = this.applyMove(move);
      nodes += this.perft(depth - 1);
      this.undoApplyMove(move, state);
    }
    return nodes;
  }

  applyAlgebraicMove(moveStr) {
    // Try SAN first
    const moves = this.generateMoves();
    for (const move of moves) {
        const san = this.moveToSan(move, moves);
        if (san === moveStr) {
            this.applyMove(move);
            return move;
        }
    }

    // Fallback to LAN
    const fromStr = moveStr.slice(0, 2);
    const toStr = moveStr.slice(2, 4);
    const promotionChar = moveStr.length > 4 ? moveStr[4] : null;

    const from = this.algebraicToIndex(fromStr);
    const to = this.algebraicToIndex(toStr);

    const move = moves.find(m => {
        return m.from === from && m.to === to &&
            (!promotionChar || m.promotion === promotionChar);
    });

    if (move) {
        this.applyMove(move);
        return move;
    }

    throw new Error(`Illegal move: ${moveStr}`);
  }

  moveToSan(move, moves) {
    if (move.flags === 'k' || move.flags === 'k960') {
        return 'O-O';
    }
    if (move.flags === 'q' || move.flags === 'q960') {
        return 'O-O-O';
    }
    // This is a simplified SAN generator. A full one is more complex.
    const piece = move.piece;
    const toAlg = this.moveToString(move).slice(2,4);

    if (piece.type === 'pawn') {
        if (move.captured) {
            const fromAlg = this.moveToString(move).slice(0,1);
            return `${fromAlg}x${toAlg}`;
        }
        return toAlg;
    }

    const pieceChar = piece.type.toUpperCase().replace('KNIGHT', 'N').charAt(0);
    let san = `${pieceChar}${toAlg}`;

    // Basic disambiguation - if multiple pieces of the same type can move to the same square
    const ambiguousMoves = moves.filter(m =>
        m.piece.type === piece.type &&
        m.to === move.to &&
        m.from !== move.from
    );

    if (ambiguousMoves.length > 0) {
        const fromAlg = this.moveToString(move);
        const fromFile = fromAlg.charAt(0);
        const fromRank = fromAlg.charAt(1);

        const fileCollision = ambiguousMoves.some(m => (this.moveToString(m).charAt(0) === fromFile));
        const rankCollision = ambiguousMoves.some(m => (this.moveToString(m).charAt(1) === fromRank));

        if(fileCollision && rankCollision) {
            san = `${pieceChar}${fromAlg.slice(0,2)}${toAlg}`;
        } else if (fileCollision) {
            san = `${pieceChar}${fromRank}${toAlg}`;
        } else {
            san = `${pieceChar}${fromFile}${toAlg}`;
        }
    }

     if (move.captured) {
        san = san.replace(toAlg, `x${toAlg}`);
    }

    // Check for check/checkmate is omitted for simplicity for now
    return san;
  }

  moveToString(move) {
      const { row: fromRow, col: fromCol } = this.toRowCol(move.from);
      const { row: toRow, col: toCol } = this.toRowCol(move.to);
      const fromAlg = `${String.fromCharCode('a'.charCodeAt(0) + fromCol)}${8 - fromRow}`;
      const toAlg = `${String.fromCharCode('a'.charCodeAt(0) + toCol)}${8 - toRow}`;
      const promo = move.promotion ? move.promotion : '';
      return `${fromAlg}${toAlg}${promo}`;
  }

  generateFen() {
    let placement = '';
    for (let r = 0; r < 8; r++) {
      let emptyCount = 0;
      for (let c = 0; c < 8; c++) {
        const piece = this.getPiece(r, c);
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
    return `${placement} ${this.activeColor} ${this.castlingRights} ${this.enPassantTarget} ${this.halfMoveClock} ${this.fullMoveNumber}`;
  }

  clone() {
    const newBoard = new Board();
    // No squares to copy
    newBoard.activeColor = this.activeColor;
    newBoard.castlingRights = this.castlingRights;
    newBoard.enPassantTarget = this.enPassantTarget;
    newBoard.halfMoveClock = this.halfMoveClock;
    newBoard.fullMoveNumber = this.fullMoveNumber;
    newBoard.zobristKey = this.zobristKey;
    newBoard.history = [...this.history];
    newBoard.castling = {
        w: { ...this.castling.w },
        b: { ...this.castling.b }
    };
    newBoard.castlingRooks = {
        white: [...this.castlingRooks.white],
        black: [...this.castlingRooks.black]
    };
    newBoard.isChess960 = this.isChess960;
    newBoard.bitboards = { ...this.bitboards };
    return newBoard;
  }
}

module.exports = Board;
