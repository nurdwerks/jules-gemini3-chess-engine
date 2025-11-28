const Bitboard = {
  popcnt (bb) {
    let c = 0
    while (bb > 0n) {
      bb &= (bb - 1n)
      c++
    }
    return c
  },

  lsb (bb) {
    if (bb === 0n) return -1
    let idx = 0
    while ((bb & 1n) === 0n) {
      bb >>= 1n
      idx++
    }
    return idx
  },

  msb (bb) {
    if (bb === 0n) return -1
    let idx = 63
    const one = 1n
    while (idx >= 0) {
      if ((bb & (one << BigInt(idx))) !== 0n) return idx
      idx--
    }
    return -1
  },

  setBit (bb, square) {
    return bb | (1n << BigInt(square))
  },

  clearBit (bb, square) {
    return bb & ~(1n << BigInt(square))
  },

  getBit (bb, square) {
    return (bb & (1n << BigInt(square))) !== 0n
  },

  knightAttacks: new BigUint64Array(64),
  kingAttacks: new BigUint64Array(64),

  rookMasks: new BigUint64Array(64),
  bishopMasks: new BigUint64Array(64),
  rookMagics: new BigUint64Array(64),
  bishopMagics: new BigUint64Array(64),
  rookShifts: new Int32Array(64),
  bishopShifts: new Int32Array(64),

  rookTable: null,
  bishopTable: null,
  rookOffsets: new Int32Array(64),
  bishopOffsets: new Int32Array(64),

  init () {
    this.initKnightAttacks()
    this.initKingAttacks()
    this.initMagics()
  },

  initKnightAttacks () {
    for (let sq = 0; sq < 64; sq++) {
      let attacks = 0n
      const rank = Math.floor(sq / 8)
      const col = sq % 8
      const jumps = [
        { r: 2, c: 1 }, { r: 2, c: -1 }, { r: -2, c: 1 }, { r: -2, c: -1 },
        { r: 1, c: 2 }, { r: 1, c: -2 }, { r: -1, c: 2 }, { r: -1, c: -2 }
      ]
      for (const jump of jumps) {
        const tr = rank + jump.r
        const tc = col + jump.c
        if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
          attacks |= (1n << BigInt(tr * 8 + tc))
        }
      }
      this.knightAttacks[sq] = attacks
    }
  },

  initKingAttacks () {
    for (let sq = 0; sq < 64; sq++) {
      let attacks = 0n
      const rank = Math.floor(sq / 8)
      const col = sq % 8
      for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
          if (r === 0 && c === 0) continue
          const tr = rank + r
          const tc = col + c
          if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
            attacks |= (1n << BigInt(tr * 8 + tc))
          }
        }
      }
      this.kingAttacks[sq] = attacks
    }
  },

  getKnightAttacks (sq) {
    return this.knightAttacks[sq]
  },

  getKingAttacks (sq) {
    return this.kingAttacks[sq]
  },

  maskRook (sq) {
    let attacks = 0n
    const r = Math.floor(sq / 8)
    const c = sq % 8
    for (let tr = r + 1; tr < 7; tr++) attacks |= (1n << BigInt(tr * 8 + c))
    for (let tr = r - 1; tr > 0; tr--) attacks |= (1n << BigInt(tr * 8 + c))
    for (let tc = c + 1; tc < 7; tc++) attacks |= (1n << BigInt(r * 8 + tc))
    for (let tc = c - 1; tc > 0; tc--) attacks |= (1n << BigInt(r * 8 + tc))
    return attacks
  },

  maskBishop (sq) {
    let attacks = 0n
    const r = Math.floor(sq / 8)
    const c = sq % 8
    for (let tr = r + 1, tc = c + 1; tr < 7 && tc < 7; tr++, tc++) attacks |= (1n << BigInt(tr * 8 + tc))
    for (let tr = r - 1, tc = c + 1; tr > 0 && tc < 7; tr--, tc++) attacks |= (1n << BigInt(tr * 8 + tc))
    for (let tr = r + 1, tc = c - 1; tr < 7 && tc > 0; tr++, tc--) attacks |= (1n << BigInt(tr * 8 + tc))
    for (let tr = r - 1, tc = c - 1; tr > 0 && tc > 0; tr--, tc--) attacks |= (1n << BigInt(tr * 8 + tc))
    return attacks
  },

  calcSlidingAttacks (sq, block, directions) {
    let attacks = 0n
    const r = Math.floor(sq / 8)
    const c = sq % 8

    for (const { dr, dc } of directions) {
      for (let i = 1; i < 8; i++) {
        const tr = r + dr * i
        const tc = c + dc * i
        if (tr < 0 || tr >= 8 || tc < 0 || tc >= 8) break
        const t = 1n << BigInt(tr * 8 + tc)
        attacks |= t
        if ((block & t) !== 0n) break
      }
    }
    return attacks
  },

  calcRookAttacks (sq, block) {
    return this.calcSlidingAttacks(sq, block, [
      { dr: 1, dc: 0 }, { dr: -1, dc: 0 }, { dr: 0, dc: 1 }, { dr: 0, dc: -1 }
    ])
  },

  calcBishopAttacks (sq, block) {
    return this.calcSlidingAttacks(sq, block, [
      { dr: 1, dc: 1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: -1, dc: -1 }
    ])
  },

  initMagics () {
    this.rookTable = new BigUint64Array(262144)
    this.bishopTable = new BigUint64Array(32768)

    let rookIdx = 0
    let bishopIdx = 0

    for (let sq = 0; sq < 64; sq++) {
      this.rookMasks[sq] = this.maskRook(sq)
      const rBits = this.popcnt(this.rookMasks[sq])
      this.rookShifts[sq] = 64 - rBits
      this.rookOffsets[sq] = rookIdx

      this.bishopMasks[sq] = this.maskBishop(sq)
      const bBits = this.popcnt(this.bishopMasks[sq])
      this.bishopShifts[sq] = 64 - bBits
      this.bishopOffsets[sq] = bishopIdx

      rookIdx += (1 << rBits)
      bishopIdx += (1 << bBits)
    }
  },

  getRookAttacks (sq, occupancy) {
    return this.calcRookAttacks(sq, occupancy)
  },

  getBishopAttacks (sq, occupancy) {
    return this.calcBishopAttacks(sq, occupancy)
  },

  to64 (index0x88) {
    const row = index0x88 >> 4
    const col = index0x88 & 7
    return (7 - row) * 8 + col
  }
}

Bitboard.init()

module.exports = Bitboard
