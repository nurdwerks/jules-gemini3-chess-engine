const UCI = require('../../src/UCI')
const Evaluation = require('../../src/Evaluation')

describe('Tuning Infrastructure (Stories 5.3a/5.3b)', () => {
  let uci

  beforeEach(() => {
    uci = new UCI(() => {}) // No-op output
  })

  test('setoption command updates Piece Values', () => {
    // Initial Pawn Value: 100
    // We can't easily read private vars of Evaluation via UCI, but we can check Evaluation.evaluate outcome.
    // Or check if we can export PIECE_VALUES for test.
    // But wait, `Evaluation.updateParam` modifies the module-level constants?
    // Require cache might keep it persistent.

    // Reset default (hacky, but needed since it's global state)
    Evaluation.updateParam('PawnValue', 100)

    // Setup a board with one white pawn
    uci.handlePosition(['startpos', 'moves', 'e2e4']) // Pawn at e4.
    // Actually startpos has 8 pawns.
    // Score should be roughly material + positional.

    // Let's use a simple board with 1 pawn.
    uci.processCommand('position fen 8/4P3/8/8/8/8/8/8 w - - 0 1')
    // White pawn at e7.

    const scoreBefore = Evaluation.evaluate(uci.board)

    // Change Pawn Value to 200
    uci.processCommand('setoption name PawnValue value 200')

    const scoreAfter = Evaluation.evaluate(uci.board)

    // Score should increase by ~100 (plus/minus positional diff, but position is same)
    // Debug logging:
    console.log(`Before: ${scoreBefore}, After: ${scoreAfter}`)
    expect(scoreAfter).toBeGreaterThan(scoreBefore + 90)

    // Reset
    Evaluation.updateParam('PawnValue', 100)
  })

  test('setoption command updates Evaluation Parameters', () => {
    // Check Doubled Pawn Penalty
    Evaluation.updateParam('DoubledPawnPenalty', 10)

    // Setup doubled pawns
    uci.processCommand('position fen 8/4P3/4P3/8/8/8/8/8 w - - 0 1')

    const scoreBefore = Evaluation.evaluate(uci.board)

    // Increase Penalty to 100
    uci.processCommand('setoption name DoubledPawnPenalty value 100')

    const scoreAfter = Evaluation.evaluate(uci.board)

    // Score should decrease (penalty increases)
    // Difference = (NewPenalty - OldPenalty) = 90.
    // Score decreases by 90.
    expect(scoreAfter).toBeLessThan(scoreBefore - 80)

    // Reset
    Evaluation.updateParam('DoubledPawnPenalty', 10)
  })
})
