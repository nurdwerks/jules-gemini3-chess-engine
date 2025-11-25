const Piece = require('./Piece');
const Zobrist = require('./Zobrist');

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
    }
  }

  makeMove(move) {
      const captured = this.squares[move.to];
      this.squares[move.to] = move.piece;
      this.squares[move.from] = null;

      if (move.flags === 'e' || move.flags === 'ep') {
          const isWhite = move.piece.color === 'white';
          const captureSq = isWhite ? move.to + 16 : move.to - 16;
          this.squares[captureSq] = null;
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

              const rook = this.squares[rookSource];
              this.squares[rookSource] = null;
              this.squares[kingTarget] = move.piece;
              this.squares[rookTarget] = rook;
          } else {
              if (move.piece.color === 'white') {
                  if (move.flags === 'k') {
                      const rook = this.squares[119];
                      this.squares[117] = rook;
                      this.squares[119] = null;
                  } else {
                      const rook = this.squares[112];
                      this.squares[115] = rook;
                      this.squares[112] = null;
                  }
              } else {
                  if (move.flags === 'k') {
                      const rook = this.squares[7];
                      this.squares[5] = rook;
                      this.squares[7] = null;
                  } else {
                      const rook = this.squares[0];
                      this.squares[3] = rook;
                      this.squares[0] = null;
                  }
              }
          }
      }
      return captured;
  }

  unmakeMove(move, captured) {
      this.squares[move.from] = move.piece;
      this.squares[move.to] = captured;

      if (move.flags === 'e') {
          this.squares[move.to] = null;
          const isWhite = move.piece.color === 'white';
          const captureSq = isWhite ? move.to + 16 : move.to - 16;
          const capturedPawn = new Piece(isWhite ? 'black' : 'white', 'pawn');
          this.squares[captureSq] = capturedPawn;
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

              if (rookTarget === kingSource) {
                  this.squares[kingSource] = move.piece;
              }

          } else {
              this.squares[move.to] = null;
              if (move.piece.color === 'white') {
                  if (move.flags === 'k') {
                      const rook = this.squares[117];
                      this.squares[119] = rook;
                      this.squares[117] = null;
                  } else {
                      const rook = this.squares[115];
                      this.squares[112] = rook;
                      this.squares[115] = null;
                  }
              } else {
                  if (move.flags === 'k') {
                      const rook = this.squares[5];
                      this.squares[7] = rook;
                      this.squares[5] = null;
                  } else {
                      const rook = this.squares[3];
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

    if (attackingSide === 'white') {
        const pawnAttacks = [15, 17];
        for (const offset of pawnAttacks) {
            const source = squareIndex + offset;
            if (this.isValidSquare(source)) {
                const piece = this.squares[source];
                if (piece && piece.type === 'pawn' && piece.color === 'white') return true;
            }
        }
    } else {
        const pawnAttacks = [-15, -17];
        for (const offset of pawnAttacks) {
            const source = squareIndex + offset;
            if (this.isValidSquare(source)) {
                const piece = this.squares[source];
                if (piece && piece.type === 'pawn' && piece.color === 'black') return true;
            }
        }
    }

    const knightOffsets = [-33, -31, -18, -14, 14, 18, 31, 33];
    for (const offset of knightOffsets) {
        const source = squareIndex + offset;
        if (this.isValidSquare(source)) {
            const piece = this.squares[source];
            if (piece && piece.type === 'knight' && piece.color === attackingSide) return true;
        }
    }

    const kingOffsets = [-17, -16, -15, -1, 1, 15, 16, 17];
    for (const offset of kingOffsets) {
        const source = squareIndex + offset;
        if (this.isValidSquare(source)) {
            const piece = this.squares[source];
            if (piece && piece.type === 'king' && piece.color === attackingSide) return true;
        }
    }

    const directions = {
        'straight': [-16, 16, -1, 1],
        'diagonal': [-17, -15, 15, 17]
    };

    for (const dir of directions.straight) {
        let source = squareIndex + dir;
        while (this.isValidSquare(source)) {
            const piece = this.squares[source];
            if (piece) {
                if (piece.color === attackingSide && (piece.type === 'rook' || piece.type === 'queen')) {
                    return true;
                }
                break;
            }
            source += dir;
        }
    }

    for (const dir of directions.diagonal) {
        let source = squareIndex + dir;
        while (this.isValidSquare(source)) {
            const piece = this.squares[source];
            if (piece) {
                if (piece.color === attackingSide && (piece.type === 'bishop' || piece.type === 'queen')) {
                    return true;
                }
                break;
            }
            source += dir;
        }
    }

    return false;
  }

  generateMoves() {
    const moves = [];
    const color = this.activeColor === 'w' ? 'white' : 'black';
    const opponent = this.activeColor === 'w' ? 'black' : 'white';

    const offsets = {
      'rook': [-16, 16, -1, 1],
      'bishop': [-17, -15, 15, 17],
      'queen': [-17, -15, 15, 17, -16, 16, -1, 1],
      'knight': [-33, -31, -18, -14, 14, 18, 31, 33],
      'king': [-17, -16, -15, -1, 1, 15, 16, 17]
    };

    for (let i = 0; i < 128; i++) {
      if (!this.isValidSquare(i)) continue;

      const piece = this.squares[i];
      if (!piece || piece.color !== color) continue;

      if (['rook', 'bishop', 'queen'].includes(piece.type)) {
        const directions = offsets[piece.type];
        for (const dir of directions) {
          let target = i + dir;
          while (this.isValidSquare(target)) {
            const targetPiece = this.squares[target];
            if (!targetPiece) {
              moves.push({ from: i, to: target, flags: 'n', piece: piece });
            } else {
              if (targetPiece.color === opponent) {
                moves.push({ from: i, to: target, flags: 'c', piece: piece, captured: targetPiece });
              }
              break;
            }
            target += dir;
          }
        }
      }
      else if (['knight', 'king'].includes(piece.type)) {
        const directions = offsets[piece.type];
        for (const dir of directions) {
          const target = i + dir;
          if (this.isValidSquare(target)) {
            const targetPiece = this.squares[target];
            if (!targetPiece) {
              moves.push({ from: i, to: target, flags: 'n', piece: piece });
            } else if (targetPiece.color === opponent) {
              moves.push({ from: i, to: target, flags: 'c', piece: piece, captured: targetPiece });
            }
          }
        }

        if (piece.type === 'king') {
           if (!this.isSquareAttacked(i, opponent)) {
               const rooks = this.castlingRooks[color === 'white' ? 'white' : 'black'];
               for (const rookIndex of rooks) {
                   const rookPiece = this.squares[rookIndex];
                   if (!rookPiece || rookPiece.type !== 'rook' || rookPiece.color !== color) continue;

                   const isKingside = (rookIndex & 7) > (i & 7);
                   const targetFile = isKingside ? 6 : 2;
                   const rank = color === 'white' ? 7 : 0;
                   const kingTargetIndex = (rank << 4) | targetFile;
                   const rookTargetFile = isKingside ? 5 : 3;
                   const rookTargetIndex = (rank << 4) | rookTargetFile;

                   let pathClear = true;
                   const start = Math.min(i, rookIndex);
                   const end = Math.max(i, rookIndex);
                   for (let sq = start + 1; sq < end; sq++) {
                       if (this.squares[sq]) {
                           pathClear = false;
                           break;
                       }
                   }
                   if (!pathClear) continue;

                   const kStart = Math.min(i, kingTargetIndex);
                   const kEnd = Math.max(i, kingTargetIndex);
                   let safe = true;
                   for (let sq = kStart; sq <= kEnd; sq++) {
                       if (sq === i) continue;
                       if (this.squares[sq] && sq !== rookIndex && sq !== i) {
                           safe = false; break;
                       }
                       if (this.isSquareAttacked(sq, opponent)) {
                           safe = false; break;
                       }
                   }
                   if (!safe) continue;

                   if (this.squares[rookTargetIndex] && rookTargetIndex !== i && rookTargetIndex !== rookIndex) {
                       continue;
                   }

                   const isStandardWhiteK = (i === 116 && rookIndex === 119);
                   const isStandardWhiteQ = (i === 116 && rookIndex === 112);
                   const isStandardBlackK = (i === 4 && rookIndex === 7);
                   const isStandardBlackQ = (i === 4 && rookIndex === 0);

                   if (isStandardWhiteK || isStandardBlackK) {
                       moves.push({ from: i, to: kingTargetIndex, flags: 'k', piece: piece });
                   } else if (isStandardWhiteQ || isStandardBlackQ) {
                       moves.push({ from: i, to: kingTargetIndex, flags: 'q', piece: piece });
                   } else {
                       moves.push({ from: i, to: rookIndex, flags: 'k960', piece: piece });
                   }
               }
           }
        }
      }
      else if (piece.type === 'pawn') {
        const isWhite = piece.color === 'white';
        const forward = isWhite ? -16 : 16;
        const startRank = isWhite ? 6 : 1;
        const currentRow = i >> 4;
        const promotionRank = isWhite ? 0 : 7;

        const targetSingle = i + forward;
        if (this.isValidSquare(targetSingle) && !this.squares[targetSingle]) {
          const targetRow = targetSingle >> 4;
          if (targetRow === promotionRank) {
             ['q', 'r', 'b', 'n'].forEach(promo => {
               moves.push({ from: i, to: targetSingle, flags: 'p', piece: piece, promotion: promo });
             });
          } else {
             moves.push({ from: i, to: targetSingle, flags: 'n', piece: piece });
             const targetDouble = i + (forward * 2);
             if (currentRow === startRank && this.isValidSquare(targetDouble) && !this.squares[targetDouble]) {
               moves.push({ from: i, to: targetDouble, flags: 'n', piece: piece });
             }
          }
        }

        const captureOffsets = isWhite ? [-17, -15] : [15, 17];
        for (const capOffset of captureOffsets) {
          const targetCap = i + capOffset;
          if (this.isValidSquare(targetCap)) {
            const targetPiece = this.squares[targetCap];
            if (targetPiece && targetPiece.color === opponent) {
               const targetRow = targetCap >> 4;
               if (targetRow === promotionRank) {
                   ['q', 'r', 'b', 'n'].forEach(promo => {
                     moves.push({ from: i, to: targetCap, flags: 'cp', piece: piece, captured: targetPiece, promotion: promo });
                   });
               } else {
                   moves.push({ from: i, to: targetCap, flags: 'c', piece: piece, captured: targetPiece });
               }
            } else if (!targetPiece && this.enPassantTarget !== '-') {
               const epIndex = this.algebraicToIndex(this.enPassantTarget);
               if (targetCap === epIndex) {
                   moves.push({ from: i, to: targetCap, flags: 'e', piece: piece });
               }
            }
          }
        }
      }
    }

    const legalMoves = [];
    for (const move of moves) {
        const captured = this.makeMove(move);
        let kingIndex = -1;
        for (let k = 0; k < 128; k++) {
            if (this.isValidSquare(k)) {
                const p = this.squares[k];
                if (p && p.type === 'king' && p.color === color) {
                    kingIndex = k;
                    break;
                }
            }
        }
        if (kingIndex === -1 || !this.isSquareAttacked(kingIndex, opponent)) {
            legalMoves.push(move);
        }
        this.unmakeMove(move, captured);
    }
    return legalMoves;
  }

  isValidMove(start, end) {
    const startIndex = this.toIndex(start.row, start.col);
    const endIndex = this.toIndex(end.row, end.col);
    if (!this.isValidSquare(startIndex) || !this.isValidSquare(endIndex)) return false;
    const piece = this.squares[startIndex];
    if (!piece) return false;

    const savedActive = this.activeColor;
    this.activeColor = piece.color === 'white' ? 'w' : 'b';
    const moves = this.generateMoves();
    this.activeColor = savedActive;

    return moves.some(m => m.from === startIndex && m.to === endIndex);
  }

  loadFen(fen) {
    const parts = fen.split(' ');
    if (parts.length !== 6) throw new Error('Invalid FEN string: Must have 6 fields.');

    const [placement, activeColor, castling, enPassant, halfMove, fullMove] = parts;
    this.squares.fill(null);
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
      // Validate Bishops (Opposite Colors)
      const bishops = { white: [], black: [] };
      for(let i=0; i<128; i++) {
          if(!this.isValidSquare(i)) continue;
          const p = this.squares[i];
          if(p && p.type === 'bishop') {
              bishops[p.color].push(i);
          }
      }

      // Check White
      // If Start Position (moves=1), enforce max 1 light, max 1 dark bishop.
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

      // Validate King between Rooks
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
