const { test, expect } = require('@playwright/test')

test.describe('FEN and PGN Loading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#chessboard')
  })

  test('Load FEN', async ({ page }) => {
    const fen = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2' // After 1. e4 e5

    await page.fill('#fen-input', fen)
    await page.click('#load-fen-btn')

    // Verify board state
    // e4 and e5 should be occupied by pawns
    // e2 and e7 should be empty
    await expect(page.locator('.square[data-alg="e4"] .piece')).toBeVisible()
    await expect(page.locator('.square[data-alg="e5"] .piece')).toBeVisible()
    await expect(page.locator('.square[data-alg="e2"] .piece')).toHaveCount(0)
    await expect(page.locator('.square[data-alg="e7"] .piece')).toHaveCount(0)
  })

  test('Import PGN', async ({ page }) => {
    const pgn = `[Event "Test"]
[Site "Localhost"]
[Date "2024.01.01"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 *`

    await page.click('#import-pgn-btn')
    await expect(page.locator('#pgn-import-modal')).toBeVisible()

    await page.fill('#pgn-input-area', pgn)
    await page.click('#load-pgn-confirm-btn')

    // Verify modal closed
    await expect(page.locator('#pgn-import-modal')).not.toBeVisible()

    // Verify move history
    const history = page.locator('#move-history')
    await expect(history).toContainText('e4')
    await expect(history).toContainText('e5')
    await expect(history).toContainText('Nf3')
    await expect(history).toContainText('Nc6')

    // Verify final board state (Nc6 is on c6)
    await expect(page.locator('.square[data-alg="c6"] .piece')).toBeVisible()
  })
})
