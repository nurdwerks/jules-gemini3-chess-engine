/**
 * Handles Syzygy Endgame Tablebase probing.
 */
const fs = require('fs').promises

class Syzygy {
  constructor () {
    this.enabled = false
    this.path = null
    this.tables = {}
  }

  async loadTable (path) {
    let handle
    try {
      handle = await fs.open(path, 'r')
      const buffer = Buffer.alloc(4)
      await handle.read(buffer, 0, 4, 0)

      const magic = buffer.readUInt32LE(0)

      this.tables[path] = { magic }
      this.enabled = true
      return true
    } catch (e) {
      return false
    } finally {
      if (handle) {
        await handle.close()
      }
    }
  }

  probeWDL (board) {
    if (!this.enabled) return null
    // Mock probe
    return null
  }

  probeDTZ (board) {
    if (!this.enabled) return null
    return null
  }

  static binomial (n, k) {
    if (k < 0 || k > n) {
      return 0
    }
    if (k === 0 || k === n) {
      return 1
    }
    if (k > n / 2) {
      k = n - k
    }
    let res = 1
    for (let i = 1; i <= k; i++) {
      res = res * (n - i + 1) / i
    }
    return res
  }
}

module.exports = Syzygy
