const { test, expect } = require('./coverage')

test.describe('Guess the Move Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')

    // Handle auth modal
    const guestBtn = page.locator('#btn-guest')
    if (await guestBtn.isVisible()) {
      await guestBtn.click()
    }

    await page.waitForSelector('#chessboard')
  })

  test('Activate Guess the Move Mode', async ({ page }) => {
    // Select Guess the Move
    await page.selectOption('#game-mode', 'guess')

    // Verify Game Manager State
    const gameMode = await page.evaluate(() => window.gameManager.gameMode)
    expect(gameMode).toBe('guess')

    // Since the logic is currently limited to setting the mode, we verify the UI state persists
    // Verify the select element still has 'guess' selected
    await expect(page.locator('#game-mode')).toHaveValue('guess')
  })
})
