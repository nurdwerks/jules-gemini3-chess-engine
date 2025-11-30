const { test, expect } = require('./coverage')

test.describe('Visual Effects', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#chessboard')
  })

  test('Checkmate triggers Confetti and Shake', async ({ page }) => {
    // 1. Load Mate in 1 FEN
    const fen = '7k/8/8/8/8/8/5R2/K5R1 w - - 0 1' // White to move
    await page.fill('#fen-input', fen)
    await page.click('#load-fen-btn')

    // 2. Play Rh2#
    // f2 -> h2
    const f2 = page.locator('#chessboard .square[data-alg="f2"]')
    const h2 = page.locator('#chessboard .square[data-alg="h2"]')
    await f2.dragTo(h2)

    // 3. Verify Shake
    // The .shake class is added to #chessboard for 500ms.
    await expect(page.locator('#chessboard')).toHaveClass(/shake/, { timeout: 1000 })

    // 4. Verify Confetti
    // The canvas should be visible and have display: block
    const canvas = page.locator('#confetti-canvas')
    await expect(canvas).toBeVisible()
    await expect(canvas).toHaveCSS('display', 'block')

    // 5. Verify Game Over Modal
    await expect(page.locator('#game-over-modal')).toBeVisible()
    await expect(page.locator('#game-over-reason')).toHaveText('Checkmate')
  })
})
