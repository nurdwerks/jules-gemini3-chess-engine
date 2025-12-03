const { test, expect } = require('./coverage')

test.describe('Move Handler Logic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#chessboard')
  })

  test('Move Confirmation', async ({ page }) => {
    // Enable Move Confirmation
    await page.check('#move-confirmation')

    // Attempt move e2-e4
    const e2 = page.locator('#chessboard .square[data-alg="e2"]')
    const e4 = page.locator('#chessboard .square[data-alg="e4"]')

    // First click (select)
    await e2.click()
    // Second click (target) -> Should trigger confirmation request
    await e4.click()

    // Expect toast "Click again to confirm move"
    // Multiple toasts might exist (e.g., "New Game Started"), so we check if *one* of them contains the text.
    await expect(page.locator('.toast').filter({ hasText: 'Click again to confirm move' })).toBeVisible()

    // Piece should NOT have moved (e2 still occupied)
    await expect(e2.locator('.piece')).toBeVisible()

    // Third click (confirm)
    await e4.click()

    // Piece should have moved (e2 empty, e4 occupied)
    await expect(e2.locator('.piece')).toHaveCount(0)
    await expect(e4.locator('.piece')).toBeVisible()
  })

  test('Illegal Move', async ({ page }) => {
    // Attempt e2-e5 (illegal for pawn on first move)
    const e2 = page.locator('#chessboard .square[data-alg="e2"]')
    const e5 = page.locator('#chessboard .square[data-alg="e5"]')

    await e2.click()
    await e5.click()

    // Piece should not move
    await expect(e2.locator('.piece')).toBeVisible()
    await expect(e5.locator('.piece')).toHaveCount(0)
    // Selection might clear or stay, but move not made.
  })
})
