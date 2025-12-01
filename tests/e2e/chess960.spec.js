const { test, expect } = require('./coverage')

test.describe('Chess960', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')

    // Handle auth modal
    const guestBtn = page.locator('#btn-guest')
    if (await guestBtn.isVisible()) {
      await guestBtn.click()
    }

    await page.waitForSelector('#chessboard')
  })

  test('Start New Chess960 Game', async ({ page }) => {
    const fenInput = page.locator('#fen-input')
    const initialFen = await fenInput.inputValue()

    // Click New Chess960 Button
    await page.click('#new-960-btn')

    // Expect FEN input to contain a FEN string (not empty)
    await expect(fenInput).not.toBeEmpty()

    // Get the new FEN
    const newFen = await fenInput.inputValue()

    // It should be a valid FEN (basic check)
    expect(newFen).toMatch(/^([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+ [wb] -|[KkQq]+| - \d+ \d+$/)

    // Verify pieces are on the board
    await expect(page.locator('.piece').first()).toBeVisible()

    const pieceCount = await page.locator('.piece').count()
    expect(pieceCount).toBe(32)
  })
})
