const { test, expect } = require('./coverage')

test.describe('Game History & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
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
    await page.click('.square[data-alg="e2"]')
    await page.click('.square[data-alg="e4"]')
    // Wait for move to complete (White Pawn on e4)
    await expect(page.locator('.square[data-alg="e4"] .piece')).toBeVisible()

    // e7-e5
    await page.click('.square[data-alg="e7"]')
    await page.click('.square[data-alg="e5"]')
    // Wait for move to complete (Black Pawn on e5)
    await expect(page.locator('.square[data-alg="e5"] .piece')).toBeVisible()

    // g1-f3
    await page.click('.square[data-alg="g1"]')
    await page.click('.square[data-alg="f3"]')
    // Wait for move to complete (White Knight on f3)
    await expect(page.locator('.square[data-alg="f3"] .piece')).toBeVisible()

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
    const e4 = page.locator('.square[data-alg="e4"]')
    const e5 = page.locator('.square[data-alg="e5"]')

    // After 1. e4: White pawn on e4. Black pawn still on e7 (so e5 is empty).
    await expect(e4.locator('.piece')).toBeVisible()
    await expect(e5.locator('.piece')).not.toBeVisible()

    // Also check highlight active class on history
    await expect(moves.nth(0)).toHaveClass(/active/)
    await expect(moves.nth(1)).not.toHaveClass(/active/)

    // Click on last move (2. Nf3)
    await moves.nth(2).click()

    // Verify f3 has piece
    const f3 = page.locator('.square[data-alg="f3"]')
    await expect(f3.locator('.piece')).toBeVisible()

    // Verify e5 has piece (since we are now after 1... e5)
    await expect(e5.locator('.piece')).toBeVisible()
  })
})
