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

  // Helper: Convert row/col to 0x88 index
  toIndex(row, col) {
    return (row << 4) | col;
  }

  // Helper: Convert algebraic notation to index (e.g., "e4" -> 100)
  // a8=0, h8=7, a1=112, h1=119
  // row 0 is rank 8, row 7 is rank 1
  algebraicToIndex(alg) {
    const col = alg.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = parseInt(alg[1], 10);
    const row = 8 - rank;
    return this.toIndex(row, col);
  }

  // Helper: Convert 0x88 index to row/col
  toRowCol(index) {
    return {
      row: index >> 4,
      col: index & 7
    };
  }

  // Helper: Check if index is on the board
  isValidSquare(index) {
    return (index & 0x88) === 0;
  }

  // Helper: Place a piece at a specific row/col (mainly for tests/setup)
  placePiece(row, col, piece) {
    const index = this.toIndex(row, col);
    if (this.isValidSquare(index)) {
      this.squares[index] = piece;
    }
  }

  // Simplified makeMove for validation purposes
  // Returns captured piece or null, to be used in unmake
  makeMove(move) {
      const captured = this.squares[move.to];
      this.squares[move.to] = move.piece;
      this.squares[move.from] = null;

      // Handle En Passant capture (remove the captured pawn)
      if (move.flags === 'e' || move.flags === 'ep') { // 'ep' is not standard flag in my generator, 'e' is used.
          // Captured pawn is "behind" the target square
          // If white moves up (decreases index), captured pawn is below target (target + 16)
          // If black moves down (increases index), captured pawn is above target (target - 16)
          const isWhite = move.piece.color === 'white';
          const captureSq = isWhite ? move.to + 16 : move.to - 16;
          this.squares[captureSq] = null;
          // Note: we don't return the pawn here for simple unmake, we need to know where it was.
          // But for "isSquareAttacked" checks, we just need board state.
          // To unmake properly, we need to restore it.
      }

      // Handle Castling (move the rook)
      if (move.flags === 'k' || move.flags === 'q' || move.flags === 'k960') {
          if (move.flags === 'k960') {
              // 960 Castling: King moves to C/G, Rook moves to D/F.
              // move.to is the Rook's source square (encoded in generateMoves).
              // move.from is King's source square.

              const kingSource = move.from;
              const rookSource = move.to; // Encoded target

              // Determine side based on rook relative to king
              const isKingside = (rookSource & 7) > (kingSource & 7);

              // Targets
              const rank = move.piece.color === 'white' ? 7 : 0;
              const kingTargetFile = isKingside ? 6 : 2; // g or c
              const rookTargetFile = isKingside ? 5 : 3; // f or d

              const kingTarget = (rank << 4) | kingTargetFile;
              const rookTarget = (rank << 4) | rookTargetFile;

              // Move Rook
              const rook = this.squares[rookSource];
              this.squares[rookSource] = null;
              this.squares[rookTarget] = rook;

              // Move King (overwriting rook if needed, but usually swapped or separate)
              // Note: King was cleared from 'from' at start of function.
              // If King target == Rook source, we just cleared Rook source.
              // If Rook target == King source, we cleared King source.
              // Be careful not to overwrite if they swap squares (only possible if adjacent).

              // Standard logic: Clear source, Set target.
              // We cleared move.from (King Source).
              // We cleared rookSource.
              // Set King Target.
              // Set Rook Target.

              // Special case: King moves to Rook's square (and Rook moves elsewhere)
              // Or King stays?

              this.squares[kingTarget] = move.piece;

              // Ensure Rook is at Rook Target (re-set in case overwritten?)
              this.squares[rookTarget] = rook;

              // Wait, makeMove sets this.squares[move.to] = move.piece at start!
              // For k960, move.to IS rookSource.
              // So we put King on Rook Source.
              // But King should go to King Target.
              // So we must fix the placement.

              if (kingTarget !== rookSource) {
                  this.squares[rookSource] = null; // Clear if King doesn't land there
              }
              this.squares[kingTarget] = move.piece;

              // If rookSource was overwritten by King (if King landed there), we handled it?
              // No, at start: this.squares[move.to] = move.piece.
              // If move.to == rookSource, King is now at rookSource.
              // If kingTarget != rookSource, we move King to kingTarget.

              // If rookTarget == rookSource, we put rook back.

          } else {
              // Standard Logic (Legacy k/q flags)
              if (move.piece.color === 'white') {
                  if (move.flags === 'k') { // e1->g1
                      const rook = this.squares[119]; // h1
                      this.squares[117] = rook; // f1
                      this.squares[119] = null;
                  } else { // e1->c1
                      const rook = this.squares[112]; // a1
                      this.squares[115] = rook; // d1
                      this.squares[112] = null;
                  }
              } else {
                  if (move.flags === 'k') { // e8->g8
                      const rook = this.squares[7]; // h8
                      this.squares[5] = rook; // f8
                      this.squares[7] = null;
                  } else { // e8->c8
                      const rook = this.squares[0]; // a8
                      this.squares[3] = rook; // d8
                      this.squares[0] = null;
                  }
              }
          }
      }

      return captured;
  }

  // Simplified unmakeMove for validation
  // Requires the move and the captured piece (returned from makeMove)
  // Also needs to handle special moves restoration.
  // Actually, for check detection, we might just clone the board or be very careful.
  // Let's implement a 'safe' unmake.
  unmakeMove(move, captured) {
      this.squares[move.from] = move.piece;
      this.squares[move.to] = captured;

      // Restore En Passant capture
      if (move.flags === 'e') {
          this.squares[move.to] = null; // Target was empty
          const isWhite = move.piece.color === 'white';
          const captureSq = isWhite ? move.to + 16 : move.to - 16;
          const capturedPawn = new Piece(isWhite ? 'black' : 'white', 'pawn');
          this.squares[captureSq] = capturedPawn;
      }

      // Restore Castling
      if (move.flags === 'k' || move.flags === 'q' || move.flags === 'k960') {
          this.squares[move.to] = null; // King moves back to 'from' handled above. wait...
          // King was at move.to (or kingTarget in k960 case)?
          // In unmake, we do: `this.squares[move.from] = move.piece;`.
          // For k960, King ends at KingTarget. But move object stores `to: rookSource`.
          // We need to clear KingTarget and restore Rook.

          if (move.flags === 'k960') {
              const kingSource = move.from;
              const rookSource = move.to;

              const isKingside = (rookSource & 7) > (kingSource & 7);
              const rank = move.piece.color === 'white' ? 7 : 0;
              const kingTarget = (rank << 4) | (isKingside ? 6 : 2);
              const rookTarget = (rank << 4) | (isKingside ? 5 : 3);

              // 1. Clear King Target (where King landed)
              // Unless King Target == Rook Source (already handled?)
              // Or King Target == King Source (restored by standard unmake)
              if (kingTarget !== kingSource) {
                  this.squares[kingTarget] = null;
                  // If King Target == Rook Source, we are clearing it before restoring rook? Correct.
              }

              // 2. Restore Rook to Source
              // Rook is currently at Rook Target.
              const rook = this.squares[rookTarget];
              this.squares[rookTarget] = null;
              this.squares[rookSource] = rook;

              // If Rook Target == King Source, we cleared King Source?
              // Standard unmake: `this.squares[move.from] = move.piece`. (Restores King to Source).
              // This happens BEFORE this block.
              // So King is at King Source.

              // Wait, if Rook Target == King Source:
              // King is at King Source.
              // We just set `squares[rookTarget] = null`.
              // This DELETES the King!
              // If Rook Target != King Source, we are safe.
              // In standard 960, King and Rook swap or are separate.

              if (rookTarget === kingSource) {
                  // Rook was at King Source?
                  // No, Rook ended at Rook Target.
                  // If Rook Target == King Source (King moved out, Rook moved in).
                  // Then `squares[rookTarget]` contains the Rook.
                  // We null it.
                  // Then we restore King at `move.from` (King Source).
                  // So we are fine?
                  // Standard unmake happens BEFORE this block:
                  // `this.squares[move.from] = move.piece;`
                  // If King Source == Rook Target, King is now there.
                  // But wait, Rook is ALSO there?
                  // No, move.to is NOT King Target.
                  // Unmake puts piece at `move.from`.
                  // If King Source == Rook Target, then we overwrote the Rook with the King!

                  // If Rook ended at King Source, we lost the Rook in `this.squares[move.from] = move.piece`.
                  // We need to retrieve the Rook from somewhere?
                  // Or simply, if Rook Target == King Source, we know the rook SHOULD be there but is now King.
                  // We need to put Rook back to Rook Source.
                  // And King is already at King Source.
                  // So we just set `squares[rookSource] = (Rook)`.
                  // Where do we get the Rook piece?
                  // We can reconstruct it (Rook of same color).
                  this.squares[rookSource] = new Piece(move.piece.color, 'rook');
              }

              // Edge case: King Target == Rook Source.
              // King landed where Rook started.
              // We cleared King Target above: `this.squares[kingTarget] = null`.
              // This clears the Rook Source.
              // Then we set `this.squares[rookSource] = rook`.
              // So we are fine.

          } else {
              // Legacy
              this.squares[move.to] = null; // King moves back to 'from' handled above

              if (move.piece.color === 'white') {
                  if (move.flags === 'k') { // Undo h1->f1
                      const rook = this.squares[117];
                      this.squares[119] = rook;
                      this.squares[117] = null;
                  } else { // Undo a1->d1
                      const rook = this.squares[115];
                      this.squares[112] = rook;
                      this.squares[115] = null;
                  }
              } else {
                  if (move.flags === 'k') { // Undo h8->f8
                      const rook = this.squares[5];
                      this.squares[7] = rook;
                      this.squares[5] = null;
                  } else { // Undo a8->d8
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

  // Check if a square is attacked by 'attackingSide' ('white' or 'black')
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
      if (kingIndex === -1) return false; // Should not happen
      return this.isSquareAttacked(kingIndex, opponentColor);
  }

  isSquareAttacked(squareIndex, attackingSide) {
    if (!this.isValidSquare(squareIndex)) return false;

    // Pawns
    // If attackingSide is white, they attack from (squareIndex + 16 - 1) and (squareIndex + 16 + 1) [reverse of pawn move]
    // Wait, let's think.
    // If we want to know if squareIndex is attacked by a White Pawn, we look "down" (higher row index)
    // White pawns move "up" (decreasing index).
    // So a white pawn at squareIndex + 15 (attacking left) or +17 (attacking right) would attack squareIndex.
    // Wait, indices:
    // White pawn at index i. Attacks i - 17 and i - 15.
    // So if we are at square s, is it attacked by a white pawn?
    // We check s + 17 and s + 15.
    // For Black pawn at index i. Attacks i + 17 and i + 15.
    // So if we are at square s, is it attacked by a black pawn?
    // We check s - 17 and s - 15.

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

    // Knights
    const knightOffsets = [-33, -31, -18, -14, 14, 18, 31, 33];
    for (const offset of knightOffsets) {
        const source = squareIndex + offset;
        if (this.isValidSquare(source)) {
            const piece = this.squares[source];
            if (piece && piece.type === 'knight' && piece.color === attackingSide) return true;
        }
    }

    // King
    const kingOffsets = [-17, -16, -15, -1, 1, 15, 16, 17];
    for (const offset of kingOffsets) {
        const source = squareIndex + offset;
        // Don't check isValidSquare for simple offset check?
        // isValidSquare logic: (index & 0x88) === 0.
        // If source is valid, check piece.
        if (this.isValidSquare(source)) {
            const piece = this.squares[source];
            if (piece && piece.type === 'king' && piece.color === attackingSide) return true;
        }
    }

    // Sliding pieces (Rook, Bishop, Queen)
    const directions = {
        'straight': [-16, 16, -1, 1],
        'diagonal': [-17, -15, 15, 17]
    };

    // Straight (Rook, Queen)
    for (const dir of directions.straight) {
        let source = squareIndex + dir;
        while (this.isValidSquare(source)) {
            const piece = this.squares[source];
            if (piece) {
                if (piece.color === attackingSide && (piece.type === 'rook' || piece.type === 'queen')) {
                    return true;
                }
                break; // Blocked
            }
            source += dir;
        }
    }

    // Diagonal (Bishop, Queen)
    for (const dir of directions.diagonal) {
        let source = squareIndex + dir;
        while (this.isValidSquare(source)) {
            const piece = this.squares[source];
            if (piece) {
                if (piece.color === attackingSide && (piece.type === 'bishop' || piece.type === 'queen')) {
                    return true;
                }
                break; // Blocked
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

    // Offsets
    const offsets = {
      'rook': [-16, 16, -1, 1],
      'bishop': [-17, -15, 15, 17],
      'queen': [-17, -15, 15, 17, -16, 16, -1, 1],
      'knight': [-33, -31, -18, -14, 14, 18, 31, 33],
      'king': [-17, -16, -15, -1, 1, 15, 16, 17]
    };

    for (let i = 0; i < 128; i++) {
      if (!this.isValidSquare(i)) continue; // Skip 0x88 invalid squares

      const piece = this.squares[i];
      if (!piece || piece.color !== color) continue;

      // Sliding pieces
      if (['rook', 'bishop', 'queen'].includes(piece.type)) {
        const directions = offsets[piece.type];
        for (const dir of directions) {
          let target = i + dir;
          while (this.isValidSquare(target)) {
            const targetPiece = this.squares[target];
            if (!targetPiece) {
              // Quiet move
              moves.push({ from: i, to: target, flags: 'n', piece: piece });
            } else {
              if (targetPiece.color === opponent) {
                // Capture
                moves.push({ from: i, to: target, flags: 'c', piece: piece, captured: targetPiece });
              }
              // Blocked (either by own or enemy after capture)
              break;
            }
            target += dir;
          }
        }
      }
      // Stepping pieces (Knight, King)
      else if (['knight', 'king'].includes(piece.type)) {
        const directions = offsets[piece.type];
        for (const dir of directions) {
          const target = i + dir;
          if (this.isValidSquare(target)) {
            const targetPiece = this.squares[target];
            if (!targetPiece) {
              // Quiet move
              moves.push({ from: i, to: target, flags: 'n', piece: piece });
            } else if (targetPiece.color === opponent) {
              // Capture
              moves.push({ from: i, to: target, flags: 'c', piece: piece, captured: targetPiece });
            }
          }
        }

        // Castling (960 Compatible)
        if (piece.type === 'king') {
           if (!this.isSquareAttacked(i, opponent)) {
               const rooks = this.castlingRooks[color === 'white' ? 'white' : 'black'];
               for (const rookIndex of rooks) {
                   // Check if we still have rights for this rook?
                   // Actually castlingRooks contains all valid start rooks.
                   // But we must check if they are still on board and rights exist.
                   // We rely on `castlingRights` string to confirm validity?
                   // No, `castlingRooks` is static initial state.
                   // We should check `this.squares[rookIndex]`.

                   // But wait, if rights are lost, `castlingRights` is updated.
                   // We need to map rookIndex to a right char?
                   // Simpler: Iterate `castlingRights` string and get rook files?
                   // But we stored `castlingRooks` indices.

                   // Let's iterate known castling rooks and check if move is valid.
                   // Validity:
                   // 1. Rook must be at rookIndex (unmoved).
                   // 2. Path between King and Rook clear.
                   // 3. King destination (c/g file) and Rook destination (d/f file) free/safe.
                   // 4. King doesn't cross attacked squares.

                   // Actually, simplest check:
                   // Is this rook still available in `castlingRights`?
                   // Need to map rookIndex -> char.
                   // Assume `castlingRooks` is updated or check board.
                   const rookPiece = this.squares[rookIndex];
                   if (!rookPiece || rookPiece.type !== 'rook' || rookPiece.color !== color) continue;

                   // Target squares for 960 (Standard: c/g for King, d/f for Rook)
                   // White: c1(114)/g1(118). Rook -> d1(115)/f1(117).
                   // Black: c8(2)/g8(6). Rook -> d8(3)/f8(5).

                   const isKingside = (rookIndex & 7) > (i & 7); // Rook is right of King
                   // Determine target files
                   // Standard files: g (6) for K-side, c (2) for Q-side.
                   const targetFile = isKingside ? 6 : 2;
                   const rank = color === 'white' ? 7 : 0;
                   const kingTargetIndex = (rank << 4) | targetFile;

                   // Rook target: f (5) for K-side, d (3) for Q-side.
                   const rookTargetFile = isKingside ? 5 : 3;
                   const rookTargetIndex = (rank << 4) | rookTargetFile;

                   // Check path free between King and Rook
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

                   // Check if King destination is occupied (unless it's by the rook or king itself)
                   // And check path to destination?
                   // 960 Rules: All squares between King start and King dest (inclusive) must be safe and empty (except King/Rook).
                   // Also Rook dest must be empty (except King/Rook).

                   // Let's check safety of King path.
                   // Path: i -> kingTargetIndex.
                   const kStart = Math.min(i, kingTargetIndex);
                   const kEnd = Math.max(i, kingTargetIndex);
                   let safe = true;
                   for (let sq = kStart; sq <= kEnd; sq++) {
                       if (sq === i) continue; // Already checked start (not in check)
                       // Check if occupied (except by rook/king)
                       if (this.squares[sq] && sq !== rookIndex && sq !== i) {
                           safe = false; break;
                       }
                       // Check if attacked
                       if (this.isSquareAttacked(sq, opponent)) {
                           safe = false; break;
                       }
                   }
                   if (!safe) continue;

                   // Check Rook dest empty (except King/Rook)
                   if (this.squares[rookTargetIndex] && rookTargetIndex !== i && rookTargetIndex !== rookIndex) {
                       continue;
                   }

                   // Check Rook path? The path King<->Rook was cleared above.
                   // But strictly, we just need "all squares between King's start and dest, and Rook's start and dest" to be free.
                   // The "between K and R" check usually covers most.

                   // Valid! Push move.
                   // Use special flag 'castle'.
                   // Target is ROOK SQUARE (UCI 960 convention) or King Target?
                   // Internal engine usually uses King Target with flag.
                   // BUT UCI requires `e1h1` (King takes Rook) for 960.
                   // Let's assume internal engine uses `to: rookIndex` for 960 moves to distinguish easily?
                   // Or use standard `to: kingTargetIndex` with a flag, and UCI adapter converts it.
                   // My UCI adapter expects generated moves.
                   // If I output `to: kingTargetIndex` (g1), I need to know WHICH rook.
                   // In standard chess, g1 implies h1 rook.
                   // In 960, g1 might be valid but ambiguous if multiple rooks? (Unlikely).
                   // Best to use `to: rookIndex` for 960 castling internally?
                   // Standard `makeMove` handles `flags: 'k'` by assuming standard rooks.
                   // I should update `makeMove` to handle 960.
                   // Let's use `to: rookIndex` (King captures Rook) as the move encoding for 960.
                   // This matches UCI 960.
                   moves.push({ from: i, to: rookIndex, flags: 'k960', piece: piece });
               }
           }
        }
      }
      // Pawn
      else if (piece.type === 'pawn') {
        const isWhite = piece.color === 'white';
        const forward = isWhite ? -16 : 16;
        const startRank = isWhite ? 6 : 1;
        const currentRow = i >> 4;

        const promotionRank = isWhite ? 0 : 7;

        // Single push
        const targetSingle = i + forward;
        if (this.isValidSquare(targetSingle) && !this.squares[targetSingle]) {
          const targetRow = targetSingle >> 4;
          if (targetRow === promotionRank) {
             // Promotion
             ['q', 'r', 'b', 'n'].forEach(promo => {
               moves.push({ from: i, to: targetSingle, flags: 'p', piece: piece, promotion: promo });
             });
          } else {
             moves.push({ from: i, to: targetSingle, flags: 'n', piece: piece });

             // Double push
             const targetDouble = i + (forward * 2);
             if (currentRow === startRank && this.isValidSquare(targetDouble) && !this.squares[targetDouble]) {
               moves.push({ from: i, to: targetDouble, flags: 'n', piece: piece });
             }
          }
        }

        // Captures
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
               // En Passant
               // Calculate index of en passant target
               const epIndex = this.algebraicToIndex(this.enPassantTarget);
               if (targetCap === epIndex) {
                   moves.push({ from: i, to: targetCap, flags: 'e', piece: piece });
               }
            }
          }
        }
      }
    }
    // Filter illegal moves (those leaving king in check)
    const legalMoves = [];
    for (const move of moves) {
        const captured = this.makeMove(move);

        // Find King
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

        // If King is not found (should not happen in valid game), or attacked
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

    // Use generateMoves for all pieces now
    const savedActive = this.activeColor;
    this.activeColor = piece.color === 'white' ? 'w' : 'b';
    const moves = this.generateMoves();
    this.activeColor = savedActive;

    return moves.some(m => m.from === startIndex && m.to === endIndex);
  }

  loadFen(fen) {
    const parts = fen.split(' ');
    if (parts.length !== 6) {
      throw new Error('Invalid FEN string: Must have 6 fields.');
    }

    const [placement, activeColor, castling, enPassant, halfMove, fullMove] = parts;

    // 1. Piece Placement
    this.squares.fill(null);
    const rows = placement.split('/');
    if (rows.length !== 8) {
      throw new Error('Invalid FEN string: Must have 8 ranks.');
    }

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

    // 2. Active Color
    if (activeColor !== 'w' && activeColor !== 'b') {
        throw new Error('Invalid FEN string: Invalid active color.');
    }
    this.activeColor = activeColor;

    // 3. Castling Rights
    this.castlingRights = castling;
    this.parseCastlingRights(castling);

    // 4. En Passant Target
    this.enPassantTarget = enPassant;

    // 5. Halfmove Clock
    this.halfMoveClock = parseInt(halfMove, 10);

    // 6. Fullmove Number
    this.fullMoveNumber = parseInt(fullMove, 10);

    // Calculate initial hash
    this.calculateZobristKey();
    this.history = []; // Clear history on load
    this.validatePosition();
  }

  validatePosition() {
      // Check Bishops (if present on starting ranks?)
      // Iterate pieces to find bishops
      const bishops = { w: [], b: [] };
      for(let i=0; i<128; i++) {
          if (!this.isValidSquare(i)) continue;
          const p = this.squares[i];
          if (p && p.type === 'bishop') {
              const prefix = p.color === 'white' ? 'w' : 'b';
              bishops[prefix].push(i);
          }
      }

      // Check White
      // Only checking if we have exactly 2 bishops? Or any number?
      // 960 constraint applies to the pair of bishops.
      // If promoted bishops exist, we might have 3.
      // Let's assume if there are 2 bishops, they must be opposite colors?
      // No, in standard chess you can promote to have 2 light-squared bishops.
      // The 960 constraint is for the *starting position*.
      // `loadFen` loads *any* position.
      // Validating "Bishops opposite colors" on `loadFen` for *any* FEN is incorrect for mid-game positions with promotions.
      // HOWEVER, the user story says "Validates FEN validity (Bishops opposite colors, King between Rooks)".
      // This implies checks for *start positions*.
      // I will check only if FullMove == 1? Or just assume we want strict 960 checks.
      // Let's assume strict checks for the *initial* array of pieces on backrank?
      // I'll implement a check: If we have bishops on the backrank (rows 0/7), ensure they are opposite colors?
      // That's a safe heuristic for 960 start pos.

      // Check White Backrank (Row 7)
      this.checkBishopsOnRank(7);
      // Check Black Backrank (Row 0)
      this.checkBishopsOnRank(0);

      // King between Rooks check?
      // Only if castling rights exist.
      this.checkKingRookPlacement();
  }

  checkBishopsOnRank(row) {
      const bishops = [];
      for(let c=0; c<8; c++) {
          const idx = (row << 4) | c;
          const p = this.squares[idx];
          if (p && p.type === 'bishop') {
              bishops.push(idx);
          }
      }
      // If exactly 2 bishops on backrank, check colors
      if (bishops.length === 2) {
          const color1 = (this.toRowCol(bishops[0]).col + this.toRowCol(bishops[0]).row) % 2;
          const color2 = (this.toRowCol(bishops[1]).col + this.toRowCol(bishops[1]).row) % 2;
          if (color1 === color2) {
              throw new Error('Invalid FEN string: Bishops must be on opposite colors.');
          }
      }
  }

  checkKingRookPlacement() {
      // Check White
      this.checkCastlingBounds('white', 7);
      this.checkCastlingBounds('black', 0);
  }

  checkCastlingBounds(color, row) {
      const rights = this.castlingRooks[color];
      if (!rights || rights.length === 0) return;

      // Find King
      let kingCol = -1;
      for(let c=0; c<8; c++) {
          const idx = (row << 4) | c;
          const p = this.squares[idx];
          if (p && p.type === 'king' && p.color === color) {
              kingCol = c;
              break;
          }
      }
      if (kingCol === -1) return; // No king?

      // Verify Rooks are on files relative to King if needed?
      // Actually 960 rules say King must be between the two rooks used for castling.
      // But `castlingRooks` just lists available rooks.
      // We can have multiple rooks.
      // If we have K and Q rights, usually implies one on left, one on right.
      // But X-FEN allows specific rooks.
      // If we have a right for a rook on file X:
      // If X < KingCol, it acts as Queenside?
      // If X > KingCol, it acts as Kingside?
      // If we have a right for a rook, the king MUST be "between" it and the other side?
      // No, "King between Rooks" means in the starting position array: R ... K ... R.
      // If we have rights for 2 rooks, they must enclose the king.
      // If we have right for only 1 rook, it can be anywhere?
      // Standard 960 generation produces R K R.
      // If we load a FEN: R R K. And rights for both R?
      // Castling "Queenside" (left) is valid.
      // Castling "Kingside" (right) is impossible if no rook is on right.
      // So we just validate that if a "Kingside" right exists (conceptually), there is a rook to the right.
      // But `castlingRooks` stores indices.
      // Let's just skip strict "King between Rooks" validation for `loadFen` unless explicitly asked to check start pos structure.
      // The acceptance criteria says "Validates FEN validity (Bishops opposite colors, King between Rooks)".
      // So I must implement it.

      // If we have rights for rooks:
      // Ensure at least one rook is to the left of King (if we have left-side rights?)
      // Or simply: If we have >1 rooks with rights, ensure King is not outside them?
      // Actually, standard 960 ensures 1 rook left, 1 rook right.
      // If I have rights for a rook at col X.
      // Valid if it's a rook.
      // Is "King between Rooks" a hard rule for *validity* of a FEN?
      // Yes, for a start position.
      // If I have castling rights for 2 rooks on the same side of the king, it's invalid 960 start pos.

      const rookCols = rights.map(idx => idx & 7).sort((a, b) => a - b);
      if (rookCols.length === 2) {
          if (!(rookCols[0] < kingCol && rookCols[1] > kingCol)) {
               // Determine if this is actually invalid.
               // In 960, you strictly have one rook left, one right.
               // So if both are left or both right, throw.
               throw new Error('Invalid FEN string: King must be between Rooks.');
          }
      }
  }

  calculateZobristKey() {
      let key = 0n;

      // Pieces
      for (let i = 0; i < 128; i++) {
          if (this.isValidSquare(i)) {
              const piece = this.squares[i];
              if (piece) {
                  const { c, t } = Zobrist.getPieceIndex(piece.color, piece.type);
                  key ^= Zobrist.pieces[c][t][i];
              }
          }
      }

      // Side to move
      if (this.activeColor === 'b') {
          key ^= Zobrist.sideToMove;
      }

      // Castling
      key ^= this.getCastlingHash(this.castlingRights);

      // En Passant
      const epIndex = Zobrist.getEpIndex(this.enPassantTarget);
      if (epIndex !== -1) {
          key ^= Zobrist.enPassant[epIndex];
      }

      this.zobristKey = key;
  }

  parseCastlingRights(rights) {
      this.castling = { w: { k: false, q: false }, b: { k: false, q: false } };
      this.castlingRooks = { white: [], black: [] };

      if (rights === '-') return;

      for (const char of rights) {
          if (char === 'K') {
              this.castling.w.k = true;
              // Find right-most rook
              // Standard: h1 (119). 960: Right of king.
              // We'll defer rook finding or assume h1 if standard.
              // For X-FEN compat, we might need to scan board if K is used but rooks moved?
              // Standard K implies h1.
              this.addCastlingRook('white', 7); // File 7 (h)
          } else if (char === 'Q') {
              this.castling.w.q = true;
              this.addCastlingRook('white', 0); // File 0 (a)
          } else if (char === 'k') {
              this.castling.b.k = true;
              this.addCastlingRook('black', 7);
          } else if (char === 'q') {
              this.castling.b.q = true;
              this.addCastlingRook('black', 0);
          } else {
              // X-FEN file letter (A-H or a-h)
              const code = char.charCodeAt(0);
              if (code >= 65 && code <= 72) { // A-H (White)
                  this.addCastlingRook('white', code - 65);
              } else if (code >= 97 && code <= 104) { // a-h (Black)
                  this.addCastlingRook('black', code - 97);
              }
          }
      }
  }

  addCastlingRook(color, file) {
      // Convert file to index
      const rank = color === 'white' ? 7 : 0; // Rank 1 (row 7) or Rank 8 (row 0)
      const index = (rank << 4) | file;
      this.castlingRooks[color].push(index);

      // Update legacy flags for tests (approximate)
      const kingRow = color === 'white' ? 7 : 0;
      // Find king
      let kingCol = 4; // Default e
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
          if (char === 'K') hash ^= Zobrist.castling[0][7]; // White H
          else if (char === 'Q') hash ^= Zobrist.castling[0][0]; // White A
          else if (char === 'k') hash ^= Zobrist.castling[1][7]; // Black h
          else if (char === 'q') hash ^= Zobrist.castling[1][0]; // Black a
          else {
              const code = char.charCodeAt(0);
              if (code >= 65 && code <= 72) { // A-H
                  hash ^= Zobrist.castling[0][code - 65];
              } else if (code >= 97 && code <= 104) { // a-h
                  hash ^= Zobrist.castling[1][code - 97];
              }
          }
      }
      return hash;
  }

  // Apply a move and update the full game state (color, rights, clocks)
  // Returns an object containing the previous state to be restored by undoApplyMove
  applyMove(move) {
    const state = {
      activeColor: this.activeColor,
      castlingRights: this.castlingRights,
      enPassantTarget: this.enPassantTarget,
      halfMoveClock: this.halfMoveClock,
      fullMoveNumber: this.fullMoveNumber,
      zobristKey: this.zobristKey, // Save the key to restore
      capturedPiece: null
    };

    // INCREMENTAL ZOBRIST UPDATE START
    // 1. Remove moving piece from source
    let { c, t } = Zobrist.getPieceIndex(move.piece.color, move.piece.type);
    this.zobristKey ^= Zobrist.pieces[c][t][move.from];

    // 2. Handle captures (remove captured piece from target)
    // We need to know what is at move.to BEFORE we make the move
    const capturedPiece = this.squares[move.to];
    // Wait, applyMove calls makeMove which returns capturedPiece.
    // But we need to update Hash BEFORE squares change if we read from squares,
    // OR we use the returned capturedPiece.

    // Let's call makeMove first, but we need to know what was captured for Hash.
    // Actually, makeMove modifies the board.
    // To do incremental update, we can do it before or after, as long as we have the info.

    // Capture Handling:
    if (capturedPiece) {
        const capIdx = Zobrist.getPieceIndex(capturedPiece.color, capturedPiece.type);
        this.zobristKey ^= Zobrist.pieces[capIdx.c][capIdx.t][move.to];
    } else if (move.flags === 'e' || move.flags === 'ep') {
         // En Passant Capture
         // The captured pawn is not at move.to, but at captureSq.
         const isWhite = move.piece.color === 'white';
         const captureSq = isWhite ? move.to + 16 : move.to - 16;
         // The pawn there is of opposite color
         const capColor = isWhite ? 'black' : 'white';
         const capIdx = Zobrist.getPieceIndex(capColor, 'pawn');
         this.zobristKey ^= Zobrist.pieces[capIdx.c][capIdx.t][captureSq];
    }

    // 3. Place moving piece at target
    // Note: If promotion, piece type changes.
    if (move.promotion) {
        // Remove pawn (done above in step 1: we removed the piece at move.from)
        // Add promoted piece
        const promoType = { 'q': 'queen', 'r': 'rook', 'b': 'bishop', 'n': 'knight' }[move.promotion];
        const promoIdx = Zobrist.getPieceIndex(move.piece.color, promoType);
        this.zobristKey ^= Zobrist.pieces[promoIdx.c][promoIdx.t][move.to];
    } else {
        // Add piece at destination
        this.zobristKey ^= Zobrist.pieces[c][t][move.to];
    }

    // 4. Handle Castling (Rook moves)
    if (move.flags === 'k' || move.flags === 'q') {
        if (move.piece.color === 'white') {
             const rookIdx = Zobrist.getPieceIndex('white', 'rook');
             if (move.flags === 'k') { // h1 -> f1
                 this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][119]; // Remove h1
                 this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][117]; // Add f1
             } else { // a1 -> d1
                 this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][112]; // Remove a1
                 this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][115]; // Add d1
             }
        } else {
             const rookIdx = Zobrist.getPieceIndex('black', 'rook');
             if (move.flags === 'k') { // h8 -> f8
                 this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][7]; // Remove h8
                 this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][5]; // Add f8
             } else { // a8 -> d8
                 this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][0]; // Remove a8
                 this.zobristKey ^= Zobrist.pieces[rookIdx.c][rookIdx.t][3]; // Add d8
             }
        }
    }

    // 5. Update Side to Move
    this.zobristKey ^= Zobrist.sideToMove;

    // 6. Update Castling Rights
    // Remove old rights from hash
    this.zobristKey ^= this.getCastlingHash(this.castlingRights);

    // 7. Update En Passant
    // Remove old EP from hash
    const oldEpIndex = Zobrist.getEpIndex(this.enPassantTarget);
    if (oldEpIndex !== -1) {
        this.zobristKey ^= Zobrist.enPassant[oldEpIndex];
    }

    // --- EXECUTE MOVE on Board ---
    // 1. Update board squares (using existing makeMove)
    const madeCapturedPiece = this.makeMove(move); // This returns the piece object if captured
    state.capturedPiece = madeCapturedPiece;

    // 2. Update Active Color
    this.activeColor = this.activeColor === 'w' ? 'b' : 'w';

    // 3. Update Castling Rights
    this.updateCastlingRights(move, madeCapturedPiece);
    // Add new rights to hash
    this.zobristKey ^= this.getCastlingHash(this.castlingRights);

    // 4. Update En Passant Target
    this.updateEnPassant(move);
    // Add new EP to hash
    const newEpIndex = Zobrist.getEpIndex(this.enPassantTarget);
    if (newEpIndex !== -1) {
        this.zobristKey ^= Zobrist.enPassant[newEpIndex];
    }

    // 5. Update Clocks
    this.halfMoveClock++;
    if (move.piece.type === 'pawn' || madeCapturedPiece) {
      this.halfMoveClock = 0;
    }
    if (this.activeColor === 'w') {
      this.fullMoveNumber++;
    }

    // Save history (push current key)
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

      // Zobrist: Update Side, En Passant (cleared)
      this.zobristKey ^= Zobrist.sideToMove;

      const oldEpIndex = Zobrist.getEpIndex(this.enPassantTarget);
      if (oldEpIndex !== -1) {
          this.zobristKey ^= Zobrist.enPassant[oldEpIndex];
      }

      this.enPassantTarget = '-';
      this.activeColor = this.activeColor === 'w' ? 'b' : 'w';
      this.halfMoveClock++; // No capture/pawn move

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

  // Restore the full game state
  undoApplyMove(move, state) {
    // 1. Restore board squares
    this.unmakeMove(move, state.capturedPiece);

    // 2. Restore State
    this.activeColor = state.activeColor;
    this.castlingRights = state.castlingRights;
    this.enPassantTarget = state.enPassantTarget;
    this.halfMoveClock = state.halfMoveClock;
    this.fullMoveNumber = state.fullMoveNumber;

    // Restore Hash and History
    this.zobristKey = state.zobristKey;
    this.history.pop();
  }

  updateCastlingRights(move, capturedPiece) {
    // If rights are already gone, nothing to do
    if (this.castlingRights === '-') return;

    // Helper to remove a char from string
    const removeRight = (char) => {
      this.castlingRights = this.castlingRights.replace(char, '');
      if (this.castlingRights === '') this.castlingRights = '-';
    };

    // 1. Moving King
    if (move.piece.type === 'king') {
      if (move.piece.color === 'white') {
        removeRight('K');
        removeRight('Q');
      } else {
        removeRight('k');
        removeRight('q');
      }
    }

    // 2. Moving Rook
    if (move.piece.type === 'rook') {
      if (move.from === 119) removeRight('K'); // h1
      else if (move.from === 112) removeRight('Q'); // a1
      else if (move.from === 7) removeRight('k'); // h8
      else if (move.from === 0) removeRight('q'); // a8
    }

    // 3. Capturing Rook
    if (capturedPiece && capturedPiece.type === 'rook') {
       if (move.to === 119) removeRight('K'); // h1
       else if (move.to === 112) removeRight('Q'); // a1
       else if (move.to === 7) removeRight('k'); // h8
       else if (move.to === 0) removeRight('q'); // a8
    }
  }

  updateEnPassant(move) {
    if (move.piece.type === 'pawn') {
      const diff = Math.abs(move.to - move.from);
      if (diff === 32) { // Double push
         // Target is the square skipped over
         // White: from + 16 (or to + 16 if moving up? No white moves from 96-111 (rank 2) to 64-79 (rank 4).
         // White moves -16. Double push -32.
         // From index (e.g., 100 e2). To (68 e4). Target (84 e3).
         // White moves decrease index.
         // Black moves increase index.
         const isWhite = move.piece.color === 'white';
         const epIndex = isWhite ? move.from - 16 : move.from + 16;

         // Convert index to algebraic
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
    // Current key is this.zobristKey.
    // History contains keys of previous positions *after* moves were made.
    // It does NOT contain the initial position key unless we push it.
    // But wait, if we loadFen, we calculate key but don't push to history.
    // So if we return to initial position, we need to count that too?
    // Actually, usually engines store history including the root node if playing a game.
    // But here we might have loaded a position.

    // Standard approach:
    // Check how many times this.zobristKey appears in this.history.
    // If we consider the current position as one occurrence, we need to find 2 more in history.
    // However, if the initial position (from loadFen) was not pushed, we might miss it.

    // Fix: In loadFen, we should verify if we want to track that.
    // For now, let's assume we strictly check history array.
    // If the game started from startpos, and we made moves, the history has the moved positions.
    // But what about the *start* position? It's not in history.
    // So if we return to start position, we have 1 (current).
    // History has nothing equal to start pos if we didn't push it.

    // Ideally, when we start a game or load fen, we should push the initial state to a "game history"
    // separate from the search stack. But here `history` seems to be serving both?
    // In `applyMove` I pushed to `history`.
    // Let's modify `loadFen` to push the initial key to history?
    // No, `loadFen` clears history.

    // Let's count current key in history.
    let count = 0;
    for (let i = this.history.length - 1; i >= 0; i--) { // Iterate backwards (optimization for search)
        if (this.history[i] === this.zobristKey) {
            count++;
        }
        // Optimization: In real chess, repetition must occur within 50 moves (irreversible moves reset repetition check usually,
        // but actually they just make it impossible to reach previous positions).
        // Since my history list is not cleared on irreversible moves (only on loadFen),
        // I should probably check if the move at index `i` was irreversible?
        // But I only store keys.
        // Actually, if halfMoveClock is 0, it means an irreversible move happened.
        // So we only need to check history up to `halfMoveClock` moves back?
        // Zobrist keys handle the board state. If an irreversible move happened (pawn push/capture), the board state is different anyway.
        // EXCEPT: Castling rights lost, En Passant lost. Zobrist includes these.
        // So if rights changed, key changed.
        // So we can just check the whole history list?
        // Yes, unique keys guarantee different states.
    }

    // If `loadFen` does NOT push the key, then the "first" occurrence (the setup) is not in history.
    // So "current board" is occurrence 1.
    // Found in history = occurrences 2, 3...
    // So if count >= 2, we have 3-fold.

    // Wait. My test failed because I expected "false" but maybe logic was missing.
    // Now implementing logic.

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
          if (piece.color === 'white') {
            char = char.toUpperCase();
          }
          placement += char;
        } else {
          emptyCount++;
        }
      }
      if (emptyCount > 0) {
        placement += emptyCount;
      }
      if (r < 7) {
        placement += '/';
      }
    }

    return `${placement} ${this.activeColor} ${this.castlingRights} ${this.enPassantTarget} ${this.halfMoveClock} ${this.fullMoveNumber}`;
  }
}

module.exports = Board;
