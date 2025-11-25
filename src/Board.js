const Piece = require('./Piece');
const Zobrist = require('./Zobrist');
const Bitboard = require('./Bitboard');

class Board {
  constructor() {
    this.squares = new Array(128).fill(null);
    this.activeColor = 'w';
    this.castlingRights = 'KQkq';
    this.enPassantTarget = '-';
    this.halfMoveClock = 0;
    this.fullMoveNumber = 1;
    this.zobristKey = 0n;
    this.history = []; // Array of hashes for repetition detection
    this.castling = { w: { k: false, q: false }, b: { k: false, q: false } }; // Backward compatibility structure
    this.castlingRooks = { white: [], black: [] }; // Stores 0x88 indices of castling rooks

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
      this.squares[index] = piece;

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
      const captured = this.squares[move.to];

      // Update Bitboards
      this.toggleBitboard(move.piece, move.from);
      if (captured) {
          this.toggleBitboard(captured, move.to);
      }

      if (!move.piece) {
          console.error("Board.makeMove: move.piece is null!", move);
          return null; // Or throw error
      }

      const pieceType = move.promotion ? ({ 'q': 'queen', 'r': 'rook', 'b': 'bishop', 'n': 'knight' }[move.promotion]) : move.piece.type;
      const color = move.piece.color;

      const { row: toRow, col: toCol } = this.toRowCol(move.to);
      const bbRank = 7 - toRow;
      const bbSq = bbRank * 8 + toCol;
      const toBit = 1n << BigInt(bbSq);

      this.bitboards[color] |= toBit;
      this.bitboards[pieceType] |= toBit;

      if (move.promotion) {
          this.squares[move.to] = new Piece(color, pieceType);
      } else {
          this.squares[move.to] = move.piece;
      }
      this.squares[move.from] = null;

      if (move.flags === 'e' || move.flags === 'ep') {
          const isWhite = move.piece.color === 'white';
          const captureSq = isWhite ? move.to + 16 : move.to - 16;
          const capPawn = this.squares[captureSq];
          if (capPawn) {
              this.toggleBitboard(capPawn, captureSq);
              this.squares[captureSq] = null;
          }
      }

      if (move.flags === 'k' || move.flags === 'q' || move.flags === 'k960') {
          if (move.flags === 'k960') {
              const kingSource = move.from;
              const rookSource = move.to;

              const isKingside = (rookSource & 7) > (kingSource & 7);
              const rank = move.piece.color === 'white' ? 7 : 0;
              const kingTargetFile = isKingside ? 6 : 2;
              const rookTargetFile = isKingside ? 5 : 3;

              const kingTarget = (rank << 4) | kingTargetFile;
              const rookTarget = (rank << 4) | rookTargetFile;

              // 'captured' is the rook (it was at move.to/rookSource).
              // Generic code already removed it from bitboard at rookSource.
              const rook = captured;

              // We need to place the rook at rookTarget.
              this.toggleBitboard(rook, rookTarget);

              // Generic code placed King at move.to (rookSource).
              // If kingTarget != rookSource, we must move King.
              if (kingTarget !== move.to) {
                  this.toggleBitboard(move.piece, move.to); // Remove King from rookSource
                  this.toggleBitboard(move.piece, kingTarget); // Place King at kingTarget
                  this.squares[move.to] = null; // Clear King from rookSource
              }

              this.squares[kingTarget] = move.piece;
              this.squares[rookTarget] = rook;
          } else {
              if (move.piece.color === 'white') {
                  if (move.flags === 'k') {
                      const rook = this.squares[119];
                      this.toggleBitboard(rook, 119);
                      this.toggleBitboard(rook, 117);
                      this.squares[117] = rook;
                      this.squares[119] = null;
                  } else {
                      const rook = this.squares[112];
                      this.toggleBitboard(rook, 112);
                      this.toggleBitboard(rook, 115);
                      this.squares[115] = rook;
                      this.squares[112] = null;
                  }
              } else {
                  if (move.flags === 'k') {
                      const rook = this.squares[7];
                      this.toggleBitboard(rook, 7);
                      this.toggleBitboard(rook, 5);
                      this.squares[5] = rook;
                      this.squares[7] = null;
                  } else {
                      const rook = this.squares[0];
                      this.toggleBitboard(rook, 0);
                      this.toggleBitboard(rook, 3);
                      this.squares[3] = rook;
                      this.squares[0] = null;
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

      this.squares[move.from] = move.piece;
      this.squares[move.to] = captured;

      if (move.flags === 'e') {
          this.squares[move.to] = null;
          const isWhite = move.piece.color === 'white';
          const captureSq = isWhite ? move.to + 16 : move.to - 16;
          const capturedPawn = new Piece(isWhite ? 'black' : 'white', 'pawn');
          this.squares[captureSq] = capturedPawn;
          this.toggleBitboard(capturedPawn, captureSq);
      }

      if (move.flags === 'k' || move.flags === 'q' || move.flags === 'k960') {
          if (move.flags === 'k960') {
              const kingSource = move.from;
              const rookSource = move.to;
              const isKingside = (rookSource & 7) > (kingSource & 7);
              const rank = move.piece.color === 'white' ? 7 : 0;
              const kingTarget = (rank << 4) | (isKingside ? 6 : 2);
              const rookTarget = (rank << 4) | (isKingside ? 5 : 3);

              if (kingTarget !== kingSource) {
                  this.squares[kingTarget] = null;
              }

              const rook = this.squares[rookTarget];
              this.squares[rookTarget] = null;
              this.squares[rookSource] = rook;

              this.toggleBitboard(rook, rookTarget);
              this.toggleBitboard(rook, rookSource);

              if (kingTarget !== move.to) {
                  this.toggleBitboard(move.piece, kingTarget);
                  this.bitboards[color] ^= toBit;
                  this.bitboards[pieceType] ^= toBit;
              }

              if (rookTarget === kingSource) {
                  this.squares[kingSource] = move.piece;
              }

          } else {
              this.squares[move.to] = null;
              if (move.piece.color === 'white') {
                  if (move.flags === 'k') {
                      const rook = this.squares[117];
                      this.toggleBitboard(rook, 117);
                      this.toggleBitboard(rook, 119);
                      this.squares[119] = rook;
                      this.squares[117] = null;
                  } else {
                      const rook = this.squares[115];
                      this.toggleBitboard(rook, 115);
                      this.toggleBitboard(rook, 112);
                      this.squares[112] = rook;
                      this.squares[115] = null;
                  }
              } else {
                  if (move.flags === 'k') {
                      const rook = this.squares[5];
                      this.toggleBitboard(rook, 5);
                      this.toggleBitboard(rook, 7);
                      this.squares[7] = rook;
                      this.squares[5] = null;
                  } else {
                      const rook = this.squares[3];
                      this.toggleBitboard(rook, 3);
                      this.toggleBitboard(rook, 0);
                      this.squares[0] = rook;
                      this.squares[3] = null;
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
    const index = this.toIndex(row, col);
    if (!this.isValidSquare(index)) return null;
    return this.squares[index];
  }

  isInCheck() {
      const kingColor = this.activeColor === 'w' ? 'white' : 'black';
      const opponentColor = this.activeColor === 'w' ? 'black' : 'white';
      let kingIndex = -1;
      for (let i = 0; i < 128; i++) {
          if (this.isValidSquare(i)) {
              const piece = this.squares[i];
              if (piece && piece.type === 'king' && piece.color === kingColor) {
                  kingIndex = i;
                  break;
              }
          }
      }
      if (kingIndex === -1) return false;
      return this.isSquareAttacked(kingIndex, opponentColor);
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
        const piece = this.squares[from0x88];

        let targets = attacks & ~us;
        while (targets) {
            const toSq = Bitboard.lsb(targets);
            const toRow = 7 - Math.floor(toSq / 8);
            const toCol = toSq % 8;
            const to0x88 = (toRow << 4) | toCol;

            const isCapture = (them & (1n << BigInt(toSq))) !== 0n;
            if (isCapture) {
                const captured = this.squares[to0x88];
                moves.push({ from: from0x88, to: to0x88, flags: 'c', piece: piece, captured: captured });
            } else {
                moves.push({ from: from0x88, to: to0x88, flags: 'n', piece: piece });
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
        const piece = this.squares[from0x88];

        if (!this.isSquareAttacked(from0x88, opponent)) {
           const rooks = this.castlingRooks[color];
           for (const rookIndex of rooks) {
               const rookPiece = this.squares[rookIndex];
               if (!rookPiece || rookPiece.type !== 'rook' || rookPiece.color !== color) continue;

               const isKingside = (rookIndex & 7) > (from0x88 & 7);
               const targetFile = isKingside ? 6 : 2;
               const rank = color === 'white' ? 7 : 0;
               const kingTargetIndex = (rank << 4) | targetFile;
               const rookTargetFile = isKingside ? 5 : 3;
               const rookTargetIndex = (rank << 4) | rookTargetFile;

               let pathClear = true;
               const start = Math.min(from0x88, rookIndex);
               const end = Math.max(from0x88, rookIndex);
               for (let sq = start + 1; sq < end; sq++) {
                   if (this.squares[sq]) {
                       pathClear = false;
                       break;
                   }
               }
               if (!pathClear) continue;

               const kStart = Math.min(from0x88, kingTargetIndex);
               const kEnd = Math.max(from0x88, kingTargetIndex);
               let safe = true;
               for (let sq = kStart; sq <= kEnd; sq++) {
                   if (sq === from0x88) continue;
                   if (this.squares[sq] && sq !== rookIndex && sq !== from0x88) {
                       safe = false; break;
                   }
                   if (this.isSquareAttacked(sq, opponent)) {
                       safe = false; break;
                   }
               }
               if (!safe) continue;

               if (this.squares[rookTargetIndex] && rookTargetIndex !== from0x88 && rookTargetIndex !== rookIndex) {
                   continue;
               }

               const isStandardWhiteK = (from0x88 === 116 && rookIndex === 119);
               const isStandardWhiteQ = (from0x88 === 116 && rookIndex === 112);
               const isStandardBlackK = (from0x88 === 4 && rookIndex === 7);
               const isStandardBlackQ = (from0x88 === 4 && rookIndex === 0);

               if (isStandardWhiteK || isStandardBlackK) {
                   moves.push({ from: from0x88, to: kingTargetIndex, flags: 'k', piece: piece });
               } else if (isStandardWhiteQ || isStandardBlackQ) {
                   moves.push({ from: from0x88, to: kingTargetIndex, flags: 'q', piece: piece });
               } else {
                   moves.push({ from: from0x88, to: rookIndex, flags: 'k960', piece: piece });
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
        const piece = this.squares[from0x88];

        const forward = color === 'white' ? -16 : 16;
        const targetSingle = from0x88 + forward;
        if (this.isValidSquare(targetSingle) && !this.squares[targetSingle]) {
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
                 if (currentRow === startRank && this.isValidSquare(targetDouble) && !this.squares[targetDouble]) {
                   moves.push({ from: from0x88, to: targetDouble, flags: 'n', piece: piece });
                 }
            }
        }

        const captureOffsets = color === 'white' ? [-17, -15] : [15, 17];
        for (const capOffset of captureOffsets) {
          const targetCap = from0x88 + capOffset;
          if (this.isValidSquare(targetCap)) {
            const targetPiece = this.squares[targetCap];
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

    const legalMoves = [];
    for (const move of moves) {
        const captured = this.makeMove(move);
        if (!this.isInCheck()) {
            legalMoves.push(move);
        }
        this.unmakeMove(move, captured);
    }
    return legalMoves;
  }

  loadFen(fen) {
    const parts = fen.split(' ');
    if (parts.length !== 6) throw new Error('Invalid FEN string: Must have 6 fields.');

    const [placement, activeColor, castling, enPassant, halfMove, fullMove] = parts;
    this.squares.fill(null);
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
      const bishops = { white: [], black: [] };
      for(let i=0; i<128; i++) {
          if(!this.isValidSquare(i)) continue;
          const p = this.squares[i];
          if(p && p.type === 'bishop') {
              bishops[p.color].push(i);
          }
      }

      if (this.fullMoveNumber === 1 && this.halfMoveClock === 0) {
          const checkBishops = (list) => {
              const light = list.filter(idx => this.getSquareColor(idx) === 0).length;
              const dark = list.filter(idx => this.getSquareColor(idx) === 1).length;
              if (light > 1 || dark > 1) {
                   throw new Error('Invalid FEN string: Bishops must be on opposite colors.');
              }
          };
          checkBishops(bishops.white);
          checkBishops(bishops.black);
      }

      this.checkKingRookPlacement('white');
      this.checkKingRookPlacement('black');
  }

  getSquareColor(index) {
      const { row, col } = this.toRowCol(index);
      return (row + col) % 2;
  }

  checkKingRookPlacement(color) {
      const rights = this.castlingRooks[color];
      if (!rights || rights.length === 0) return;

      let kingIndex = -1;
      for(let i=0; i<128; i++) {
          if(!this.isValidSquare(i)) continue;
          const p = this.squares[i];
          if(p && p.type === 'king' && p.color === color) {
              kingIndex = i;
              break;
          }
      }
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

  calculateZobristKey() {
      let key = 0n;
      for (let i = 0; i < 128; i++) {
          if (this.isValidSquare(i)) {
              const piece = this.squares[i];
              if (piece) {
                  const { c, t } = Zobrist.getPieceIndex(piece.color, piece.type);
                  key ^= Zobrist.pieces[c][t][i];
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
          } else {
              const code = char.charCodeAt(0);
              if (code >= 65 && code <= 72) {
                  this.addCastlingRook('white', code - 65);
              } else if (code >= 97 && code <= 104) {
                  this.addCastlingRook('black', code - 97);
              }
          }
      }
  }

  addCastlingRook(color, file) {
      const rank = color === 'white' ? 7 : 0;
      const index = (rank << 4) | file;
      this.castlingRooks[color].push(index);

      const kingRow = color === 'white' ? 7 : 0;
      let kingCol = 4;
      for(let c=0; c<8; c++) {
          const p = this.squares[(kingRow << 4) | c];
          if (p && p.type === 'king' && p.color === color) {
              kingCol = c;
              break;
          }
      }
      const prefix = color === 'white' ? 'w' : 'b';
      if (file > kingCol) this.castling[prefix].k = true;
      if (file < kingCol) this.castling[prefix].q = true;
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
         console.error("Board.applyMove: move.piece is null!", move);
         // Cannot apply this move. Return null state or throw.
         // Throwing is better to stop invalid recursion.
         throw new Error("Board.applyMove: move.piece is null");
    }

    let { c, t } = Zobrist.getPieceIndex(move.piece.color, move.piece.type);
    this.zobristKey ^= Zobrist.pieces[c][t][move.from];

    const capturedPiece = this.squares[move.to];
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
    if (depth === 0) return 1;
    const moves = this.generateMoves();
    let nodes = 0;
    for (const move of moves) {
      const state = this.applyMove(move);
      nodes += this.perft(depth - 1);
      this.undoApplyMove(move, state);
    }
    return nodes;
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
}

module.exports = Board;
