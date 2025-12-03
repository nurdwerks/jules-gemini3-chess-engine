const { test, expect } = require('./coverage')

test.describe('Self Play Castling Handling', () => {
  test('Frontend handles Chess960 castling notation (e.g. e1h1) in standard games during self play', async ({ page }) => {
    // Regression test for issue where engine sending 960 castling notation caused a freeze

    // FEN: White to move, can castle kingside.
    const fen = '4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1'

    await page.goto(`/?fen=${encodeURIComponent(fen)}`)
    await page.waitForSelector('#chessboard')
    await expect(page.locator('#status')).toContainText('Connected', { timeout: 10000 })

    // Enable Self Play
    await page.click('#self-play-btn')

    // Simulate engine response: bestmove e1h1 (Kingside castling 960 style)
    // This should be converted to e1g1 by the frontend to match chess.js standard behavior.
    await page.evaluate(() => {
      const activeEngine = window.gameManager.socketHandler.activeEngine
      if (activeEngine && activeEngine.callbacks && activeEngine.callbacks.onBestMove) {
        activeEngine.callbacks.onBestMove(['bestmove', 'e1h1'])
      }
    })

    // Check if castling happened on board (King at g1, Rook at f1)
    await expect(page.locator('#chessboard .square[data-alg="g1"] .piece[src*="wk.svg"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#chessboard .square[data-alg="f1"] .piece[src*="wr.svg"]')).toBeVisible()

    // Verify self play continues (loop is active)
    const isSelfPlay = await page.evaluate(() => window.gameManager.isSelfPlay)
    expect(isSelfPlay).toBe(true)
  })
})
