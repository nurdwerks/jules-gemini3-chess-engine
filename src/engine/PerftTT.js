class PerftTT {
  constructor (sizeMB = 64) {
    const entrySize = 16 // 8 key + 8 data
    // Data layout: Nodes (56 bits) | Depth (8 bits)
    // 56 bits for nodes supports up to ~7.2e16 (72 quadrillion)

    const count = Math.floor((sizeMB * 1024 * 1024) / entrySize)

    // Find closest power of 2 for size to use AND mask
    let size = 1
    while (size * 2 <= count) {
      size *= 2
    }
    this.size = size
    this.mask = BigInt(size - 1)

    this.keys = new BigUint64Array(this.size)
    this.data = new BigUint64Array(this.size)
  }

  clear () {
    this.keys.fill(0n)
    this.data.fill(0n)
  }

  save (key, depth, nodes) {
    const index = Number(key & this.mask)

    // Basic replacement strategy: Replace if new depth >= stored depth
    // Or if the slot is empty (key == 0, assuming 0 is empty/start) or collision with different key
    // Actually, if collision with different key (key mismatch), we have to decide.
    // If stored depth is very high, maybe keep it?
    // But for perft, we usually want the current run's data.
    // Let's use: Always replace if new depth >= stored depth.

    // Unpack stored depth
    const storedData = this.data[index]
    const storedDepth = Number(storedData & 0xFFn)
    const storedKey = this.keys[index]

    if (storedKey === 0n || storedKey !== key || depth >= storedDepth) {
      this.keys[index] = key
      const nodesBig = BigInt(nodes)
      // Store: (Nodes << 8) | Depth
      this.data[index] = (nodesBig << 8n) | BigInt(depth)
    }
  }

  probe (key, depth) {
    const index = Number(key & this.mask)

    if (this.keys[index] === key) {
      const storedData = this.data[index]
      const storedDepth = Number(storedData & 0xFFn)
      if (storedDepth === depth) {
        const nodes = storedData >> 8n
        return nodes
      }
    }
    return null
  }
}

module.exports = PerftTT
