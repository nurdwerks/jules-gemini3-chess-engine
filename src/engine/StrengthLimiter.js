class StrengthLimiter {
  /**
     * Calculates the maximum nodes per move for a given Elo rating.
     * Formula: nodes = 10 ^ ((Elo - 1200) / 600 + 3)
     *
     * Elo 1200 -> 10^3 = 1000 nodes
     * Elo 1800 -> 10^4 = 10,000 nodes
     * Elo 2400 -> 10^5 = 100,000 nodes
     * Elo 3000 -> 10^6 = 1,000,000 nodes
     *
     * @param {number} elo - Target Elo rating (e.g., 100-3000)
     * @returns {number} - Maximum nodes to search
     */
  static getNodesForElo (elo) {
    if (elo >= 3000) return Infinity // Unlimited strength at max

    // Ensure minimum elo to avoid tiny node counts
    const clampedElo = Math.max(100, elo)

    // Linear interpolation for exponent
    const exponent = (clampedElo - 1200) / 600 + 3

    // Calculate nodes
    let nodes = Math.pow(10, exponent)

    // Round to integer
    nodes = Math.round(nodes)

    // Ensure at least 1 node
    return Math.max(1, nodes)
  }

  static injectError (search) {
    if (search.options.UCI_LimitStrength && search.options.UCI_Elo && search.bestMove) {
      const elo = search.options.UCI_Elo
      if (elo < 2500) {
        const blunderChance = Math.max(0, (2500 - elo) / 5000)
        if (Math.random() < blunderChance) {
          const moves = search.board.generateMoves()
          if (moves.length > 1) {
            const otherMoves = moves.filter(m => !(m.from === search.bestMove.from && m.to === search.bestMove.to))
            if (otherMoves.length > 0) search.bestMove = otherMoves[Math.floor(Math.random() * otherMoves.length)]
          }
        }
      }
    }
  }
}

module.exports = StrengthLimiter
