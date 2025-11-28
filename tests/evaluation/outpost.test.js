const Board = require('../../src/Board')
const Evaluation = require('../../src/Evaluation')

describe('Evaluation: Outposts', () => {
  let board

  beforeEach(() => {
    board = new Board()
  })

  test('Knight Outpost Bonus is applied', () => {
    // White Knight on d5, supported by e4. No enemy pawns.
    board.loadFen('4k3/8/8/3N4/4P3/8/8/4K3 w - - 0 1')

    // 1. Evaluate with 0 bonus
    Evaluation.updateParam('KnightOutpostBonus', 0)
    const scoreLow = Evaluation.evaluate(board)

    // 2. Evaluate with 50 bonus
    Evaluation.updateParam('KnightOutpostBonus', 50)
    const scoreHigh = Evaluation.evaluate(board)

    // Expect difference roughly 50 * multiplier.
    // d5 is Rank 5. White.
    // Rank 4=1x, Rank 5=2x, Rank 6=3x.
    // Multiplier should be 2.
    // Expected Diff = 100.

    // If feature is NOT implemented, scores are equal.
    console.log(`ScoreLow: ${scoreLow}, ScoreHigh: ${scoreHigh}`)
    expect(scoreHigh).toBeGreaterThan(scoreLow + 80)
  })

  test('Bishop Outpost Bonus is applied', () => {
    board.loadFen('4k3/8/8/3B4/4P3/8/8/4K3 w - - 0 1')

    Evaluation.updateParam('BishopOutpostBonus', 0)
    const scoreLow = Evaluation.evaluate(board)

    Evaluation.updateParam('BishopOutpostBonus', 50)
    const scoreHigh = Evaluation.evaluate(board)

    // Rank 5 -> Multiplier 2.
    expect(scoreHigh).toBeGreaterThan(scoreLow + 80)
  })

  test('Outpost logic requires pawn support', () => {
    // Knight on d5, NO pawn support.
    board.loadFen('4k3/8/8/3N4/8/8/4P3/4K3 w - - 0 1')

    Evaluation.updateParam('KnightOutpostBonus', 50)
    const scoreUnsupported = Evaluation.evaluate(board)

    // Add support
    board.loadFen('4k3/8/8/3N4/4P3/8/8/4K3 w - - 0 1')
    const scoreSupported = Evaluation.evaluate(board)

    // Supported should be significantly higher.
    // Diff = PST(e4 vs e2) + OutpostBonus(100).
    // PST diff was ~45.
    // Total diff ~145.
    expect(scoreSupported).toBeGreaterThan(scoreUnsupported + 100)
  })

  test('Outpost logic requires no enemy pawn attacks', () => {
    Evaluation.updateParam('KnightOutpostBonus', 50)

    // Supported, No Enemy
    board.loadFen('4k3/8/8/3N4/4P3/8/8/4K3 w - - 0 1')
    const scoreSafe = Evaluation.evaluate(board)

    // Supported, But Enemy Pawn on e6 (Attacks d5)
    // We add black pawn to scoreSafe scenario (at a7) to equalize material?
    // No, let's use the updateParam method again.

    // Scenario: Knight on d5, Pawn e4. Black Pawn e6.
    board.loadFen('4k3/8/4p3/3N4/4P3/8/8/4K3 w - - 0 1')

    Evaluation.updateParam('KnightOutpostBonus', 0)
    const scoreAttackedLow = Evaluation.evaluate(board)

    Evaluation.updateParam('KnightOutpostBonus', 50)
    const scoreAttackedHigh = Evaluation.evaluate(board)

    // Since it is attacked, it is NOT an outpost.
    // Increasing bonus should have NO effect.
    expect(scoreAttackedHigh).toBe(scoreAttackedLow)
  })
})
