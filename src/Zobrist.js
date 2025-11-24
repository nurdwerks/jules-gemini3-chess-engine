// Zobrist Hashing keys
// Using BigInt for 64-bit keys

const Zobrist = {
  pieces: [], // [color][pieceType][square]
  sideToMove: 0n,
  castling: [], // [16]
  enPassant: [], // [8] (File A-H)

  // Initialize keys with random BigInts
  init() {
    const randomBigInt = () => {
      // 64 bits = 8 bytes.
      // Math.random() gives 52 bits of precision.
      // Let's just combine two 32-bit randoms.
      const high = BigInt(Math.floor(Math.random() * 0xFFFFFFFF));
      const low = BigInt(Math.floor(Math.random() * 0xFFFFFFFF));
      return (high << 32n) | low;
    };

    // Pieces: 2 colors, 6 types, 128 squares
    // Colors: 0=White, 1=Black
    // Types: 0=Pawn, 1=Knight, 2=Bishop, 3=Rook, 4=Queen, 5=King
    this.pieces = new Array(2).fill(null).map(() =>
      new Array(6).fill(null).map(() =>
        new Array(128).fill(0n).map(() => randomBigInt())
      )
    );

    this.sideToMove = randomBigInt();

    this.castling = new Array(16).fill(0n).map(() => randomBigInt());

    this.enPassant = new Array(8).fill(0n).map(() => randomBigInt());
  },

  // Helper to map piece to index
  // color: 'white', 'black' -> 0, 1
  // type: 'pawn'...'king' -> 0..5
  getPieceIndex(color, type) {
    const c = color === 'white' ? 0 : 1;
    let t = 0;
    switch (type) {
      case 'pawn': t = 0; break;
      case 'knight': t = 1; break;
      case 'bishop': t = 2; break;
      case 'rook': t = 3; break;
      case 'queen': t = 4; break;
      case 'king': t = 5; break;
    }
    return { c, t };
  },

  // Castling index helper
  // Returns integer 0-15 based on 'KQkq' string
  getCastlingIndex(rights) {
    let index = 0;
    if (rights.includes('K')) index |= 1;
    if (rights.includes('Q')) index |= 2;
    if (rights.includes('k')) index |= 4;
    if (rights.includes('q')) index |= 8;
    return index;
  },

  // En Passant file helper
  // Returns 0-7 or -1 if none
  getEpIndex(epTarget) {
    if (epTarget === '-') return -1;
    return epTarget.charCodeAt(0) - 'a'.charCodeAt(0);
  }
};

Zobrist.init();

module.exports = Zobrist;
