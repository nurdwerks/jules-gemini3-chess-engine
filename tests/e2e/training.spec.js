const { test, expect } = require('./coverage')

test.describe('Training Tools', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#chessboard')
  })

  test('Memory Training', async ({ page }) => {
    // Open Memory Training
    await page.click('#memory-training-btn')

    // Verify training controls appear
    // The panel might need time to transition or the visibility is controlled by JS classes
    // Force wait for selector
    const controls = page.locator('#memory-training-controls')
    await expect(controls).toBeVisible({ timeout: 10000 })

    // Check timer
    await expect(page.locator('#memory-timer')).toContainText('Time:')

    // Check Give Up button
    const giveUpBtn = page.locator('#memory-give-up-btn')
    await expect(giveUpBtn).toBeVisible()

    // Wait for timer to finish (5 seconds)
    // The palette appears when timer hits 0
    await expect(page.locator('#piece-palette')).toBeVisible({ timeout: 8000 })

    // Select a piece from palette (e.g., White Pawn)
    // Note: src is constructed with lowercase type (e.g. wp.svg)
    const whitePawn = page.locator('.palette-piece img[src*="wp"]').first()
    await whitePawn.click()

    // Place it on the board (e.g., e4)
    // Need to click a square
    // Since board is cleared, square exists but is empty.
    const e4 = page.locator('.square[data-alg="e4"]')
    await e4.click()

    // Verify piece is placed
    await expect(e4.locator('.piece')).toBeVisible()

    // Test Submit (Check Result)
    await page.click('#memory-submit-btn')
    // Should get a result (toast or alert).
    // Not critical to verify exact score, but action coverage.
  })

  test('Tactics Trainer', async ({ page }) => {
    await page.click('#tactics-trainer-btn')

    const controls = page.locator('#tactics-controls')
    await expect(controls).toBeVisible({ timeout: 10000 })

    // Click Next Puzzle
    await page.click('#tactics-next-btn')

    // Verify board updates (pieces change) - hard to verify exact state without knowing puzzle
    // But we can check if a move can be made or if "Incorrect move" toast appears on wrong move

    // Only if e2 has a piece. Puzzles are random.
    // Safe bet: check that we are in tactics mode.
    const status = page.locator('#tactics-desc')
    await expect(status).toBeVisible()
  })

  test('Endgame Trainer', async ({ page }) => {
    await page.click('#endgame-trainer-btn')
    await expect(page.locator('#endgame-controls')).toBeVisible()

    // Select Lucena
    await page.selectOption('#endgame-select', 'lucena')
    await page.click('#start-endgame-btn')

    // Verify board has few pieces (Lucena is R+P vs R)
    // Standard Lucena FEN usually has White Rook, White Pawn, Black King, Black Rook
    // We can check piece count.
    await expect(page.locator('.piece')).toHaveCount(4)
  })
})
