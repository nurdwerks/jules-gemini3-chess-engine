const { test, expect } = require('./coverage')

test.describe('Game History & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Handle auth modal
    const guestBtn = page.locator('#btn-guest')
    if (await guestBtn.isVisible()) {
      await guestBtn.click()
    }
    await page.waitForSelector('#chessboard')
  })

  test('Navigate History List', async ({ page }) => {
    // Set Animation Speed to Instant to avoid timing issues
    await page.selectOption('#animation-speed', '0')

    // Switch to PvP
    await page.selectOption('#game-mode', 'pvp')
    await page.click('#new-game-btn')

    // Make Moves: 1. e4 e5 2. Nf3
    // e2-e4
    await page.click('#chessboard .square[data-alg="e2"]')
    await page.click('#chessboard .square[data-alg="e4"]')
    // Wait for move to complete (White Pawn on e4)
    await expect(page.locator('#chessboard .square[data-alg="e4"] .piece')).toBeVisible()

    // e7-e5
    await page.click('#chessboard .square[data-alg="e7"]')
    await page.click('#chessboard .square[data-alg="e5"]')
    // Wait for move to complete (Black Pawn on e5)
    await expect(page.locator('#chessboard .square[data-alg="e5"] .piece')).toBeVisible()

    // g1-f3
    await page.click('#chessboard .square[data-alg="g1"]')
    await page.click('#chessboard .square[data-alg="f3"]')
    // Wait for move to complete (White Knight on f3)
    await expect(page.locator('#chessboard .square[data-alg="f3"] .piece')).toBeVisible()

    // Check history list has moves
    const historyContainer = page.locator('#move-history')
    await expect(historyContainer).toContainText('e4')
    await expect(historyContainer).toContainText('e5')
    await expect(historyContainer).toContainText('Nf3')

    // Click on first move (1. e4)
    // The structure is usually .move-san
    // First .move-san is e4, second is e5, third is Nf3
    const moves = page.locator('.move-san')
    await moves.nth(0).click()

    // Verify board state: e4 occupied, e5 EMPTY (since we went back to after 1. e4)
    const e4 = page.locator('#chessboard .square[data-alg="e4"]')
    const e5 = page.locator('#chessboard .square[data-alg="e5"]')

    // After 1. e4: White pawn on e4. Black pawn still on e7 (so e5 is empty).
    await expect(e4.locator('.piece')).toBeVisible()
    await expect(e5.locator('.piece')).not.toBeVisible()

    // Also check highlight active class on history
    await expect(moves.nth(0)).toHaveClass(/active/)
    await expect(moves.nth(1)).not.toHaveClass(/active/)

    // Click on last move (2. Nf3)
    await moves.nth(2).click()

    // Verify f3 has piece
    const f3 = page.locator('#chessboard .square[data-alg="f3"]')
    await expect(f3.locator('.piece')).toBeVisible()

    // Verify e5 has piece (since we are now after 1... e5)
    await expect(e5.locator('.piece')).toBeVisible()
  })

  test('Replay Game Controls', async ({ page }) => {
    // Setup a game with moves
    await page.selectOption('#animation-speed', '0')
    await page.selectOption('#game-mode', 'pvp')
    await page.click('#new-game-btn')

    // 1. e4 e5
    await page.click('#chessboard .square[data-alg="e2"]')
    await page.click('#chessboard .square[data-alg="e4"]')
    await expect(page.locator('#chessboard .square[data-alg="e4"] .piece')).toBeVisible()

    await page.click('#chessboard .square[data-alg="e7"]')
    await page.click('#chessboard .square[data-alg="e5"]')
    await expect(page.locator('#chessboard .square[data-alg="e5"] .piece')).toBeVisible()

    // Now trigger Replay
    // Initially, we are at the end of the game (index 1, assuming 0-based moves 0, 1)

    // Click Replay Button
    await page.click('#replay-btn')

    // Replay resets view to start (empty board / start pos) then plays moves
    // We wait for the view index to change.

    // Wait a bit for replay to start (interval is 800ms)
    // The replay logic: sets index to -1, then increments.

    // We can check if the board goes back to start pos briefly.
    // At start pos, e4 is empty.

    // However, 800ms is slow. We might miss the check if we are not careful.
    // Let's rely on the fact that it eventually reaches the end.
    // Or we can check intermediate state if we are fast enough.

    // Let's just verify that after clicking, the board *eventually* shows the moves again.

    // Check start pos (re-render happens immediately)
    // We need to wait for the interval to tick.

    // Let's wait 1 second (interval 800ms). Should be at move 1 (e4).
    await page.waitForTimeout(1000)

    // Verify e4 has piece (White Pawn)
    await expect(page.locator('#chessboard .square[data-alg="e4"] .piece')).toBeVisible()

    // Verify e5 might NOT be there yet (move 2 comes at 1600ms)
    // Actually:
    // T=0: index=-1 (Start)
    // T=800: index=0 (1. e4)
    // T=1600: index=1 (1... e5)

    await expect(page.locator('#chessboard .square[data-alg="e5"] .piece')).not.toBeVisible()

    // Wait another second
    await page.waitForTimeout(1000)

    // Now e5 should be visible
    await expect(page.locator('#chessboard .square[data-alg="e5"] .piece')).toBeVisible()

    // Stop Replay by clicking again?
    // The code: toggleReplay clears interval if exists.
    await page.click('#replay-btn')

    // Wait and verify it doesn't loop or change anymore?
    // Ideally we'd check internal state or just be happy it played.
  })
})
