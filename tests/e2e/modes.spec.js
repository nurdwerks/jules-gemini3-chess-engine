const { test, expect } = require('./coverage')

test.describe('Game Modes', () => {
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

  test('Armageddon Mode', async ({ page }) => {
    // Click Armageddon Button
    await page.click('#armageddon-btn')

    // Verify Toast
    const toastContainer = page.locator('#toast-container')
    await expect(toastContainer).toContainText('Armageddon Mode', { timeout: 5000 })

    // Verify Clocks (White 05:00, Black 04:00)
    // Default is White at bottom, Black at top
    await expect(page.locator('#bottom-player-clock')).toContainText('05:00')
    await expect(page.locator('#top-player-clock')).toContainText('04:00')
  })

  test('Handicap Mode', async ({ page }) => {
    // Select Handicap Knight Odds
    await page.selectOption('#handicap-select', 'knight-b1')

    // Click New Game
    await page.click('#new-game-btn')

    // Wait for board update/reload (New Game might trigger reload or re-render)
    await page.waitForTimeout(500) // Small wait for render

    // Verify Knight b1 is missing.
    const b1 = page.locator('.square[data-alg="b1"]')
    await expect(b1.locator('.piece')).toHaveCount(0)

    // Verify a normal piece exists, e.g. a1 (Rook)
    const a1 = page.locator('.square[data-alg="a1"]')
    await expect(a1.locator('.piece')).toHaveCount(1)
  })
})
