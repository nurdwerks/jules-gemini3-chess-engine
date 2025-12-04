const { test, expect } = require('./coverage')

test.describe('Game Controls', () => {
  test.beforeEach(async ({ page }) => {
    // Mock logged-in user to enable features
    await page.addInitScript(() => {
        Object.defineProperty(window, 'INITIAL_USER', {
            value: { username: 'testuser', role: 'user' },
            writable: false
        });
    });
    await page.goto('/')
    await page.waitForSelector('#chessboard')
  })

  test('Resign Game', async ({ page }) => {
    // Start a new game first
    await page.click('#new-game-btn')

    // Ensure game started notification or state
    await expect(page.locator('#toast-container')).toContainText('New Game Started', { timeout: 5000 })

    // Click Resign
    await page.click('#resign-btn')

    // Verify Toast
    await expect(page.locator('#toast-container')).toContainText('You resigned.')

    // Verify Engine Output Log
    const outputPanel = page.locator('#engine-output')
    await expect(outputPanel).toContainText('Game Over')
    await expect(outputPanel).toContainText('resigns')
  })

  test('Offer Draw (Accepted)', async ({ page }) => {
    // Start New Game
    await page.click('#new-game-btn')

    // Offer Draw immediately (Eval should be 0)
    await page.click('#offer-draw-btn')

    // Verify Toast
    await expect(page.locator('#toast-container')).toContainText('Engine accepted draw offer.')

    // Verify Game Over log not strictly required by test logic, but good practice.
    // The client code stops the clock and gameStarted = false.
  })

  test('Flip Board', async ({ page }) => {
    const chessboard = page.locator('#chessboard')

    // Initially not flipped
    await expect(chessboard).not.toHaveClass(/flipped/)

    // Click Flip
    await page.click('#flip-board-btn')

    // Verify flipped class
    await expect(chessboard).toHaveClass(/flipped/)

    // Click again to revert
    await page.click('#flip-board-btn')
    await expect(chessboard).not.toHaveClass(/flipped/)
  })

  test('Takeback Move (PvP)', async ({ page }) => {
    // Switch to PvP to avoid engine interference
    await page.selectOption('#game-mode', 'pvp')

    // Start Game
    await page.click('#new-game-btn')

    // Make a move: e2 -> e4
    const e2 = page.locator('#chessboard .square[data-alg="e2"]')
    const e4 = page.locator('#chessboard .square[data-alg="e4"]')
    await e2.click()
    await e4.click()

    // Verify piece is on e4
    await expect(e4.locator('.piece')).toBeVisible()
    await expect(e2.locator('.piece')).not.toBeVisible()

    // Click Takeback
    await page.click('#takeback-btn')

    // Wait for undo (MoveHandler has 100ms delay)
    await page.waitForTimeout(200)

    // Verify piece is back on e2
    await expect(e2.locator('.piece')).toBeVisible()
    await expect(e4.locator('.piece')).not.toBeVisible()
  })

  test('Auto-Queen Promotion', async ({ page }) => {
    // Enable Auto-Queen
    await page.check('#auto-queen')

    // Set up board for promotion
    const fen = '8/P7/8/8/8/8/8/k6K w - - 0 1'
    await page.fill('#fen-input', fen)
    await page.click('#load-fen-btn')

    // Move pawn a7 -> a8
    const a7 = page.locator('#chessboard .square[data-alg="a7"]')
    const a8 = page.locator('#chessboard .square[data-alg="a8"]')

    await a7.click()
    await a8.click()

    // Verify NO modal appears
    const modal = page.locator('#promotion-modal')
    await expect(modal).not.toBeVisible()

    // Verify piece on a8 is a Queen (src contains 'wQ')
    const img = a8.locator('img.piece')
    await expect(img).toBeVisible()
    await expect(img).toHaveAttribute('src', /wq/i)
  })

  test('Timer should start immediately when Self Play is enabled', async ({ page }) => {
    // 1. Click Self Play button
    await page.click('#self-play-btn')

    // 2. Check if clock is running immediately
    const isClockRunning = await page.evaluate(() => {
      return !!window.gameManager.clockInterval
    })

    expect(isClockRunning).toBe(true)
  })
})
