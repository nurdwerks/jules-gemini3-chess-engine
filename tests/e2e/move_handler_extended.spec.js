const { test, expect } = require('./coverage')

test.beforeEach(async ({ page }) => {
  const sessionCheck = page.waitForResponse(resp => resp.url().includes('/api/user/me')).catch(() => {});
  await page.goto('/')
  await sessionCheck;

  // Nuclear Option: Force remove auth modal and ensure visibility
  await page.evaluate(() => {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.remove();
    const style = document.createElement('style');
    style.innerHTML = `
      #chessboard .square { visibility: visible !important; opacity: 1 !important; }
    `;
    document.head.appendChild(style);
  });
})

test('Move Confirmation', async ({ page }) => {
  await page.evaluate(() => {
      if (window.gameManager) window.gameManager.startNewGame('startpos')
  })

  // Enable confirmation directly (it's in sidebar)
  // Ensure sidebar is visible or scroll to it if needed
  await page.check('#move-confirmation')

  await page.waitForSelector('#chessboard .square[data-alg="e2"]');

  // Move e2-e4
  await page.click('#chessboard .square[data-alg="e2"]')
  // Verify selection
  await expect(page.locator('#chessboard .square[data-alg="e2"]')).toHaveClass(/selected/)

  await page.click('#chessboard .square[data-alg="e4"]')

  // Expect toast
  await expect(page.locator('#toast-container')).toContainText('Click again')

  // Piece shouldn't have moved (still on e2)
  await expect(page.locator('#chessboard .square[data-alg="e2"] img')).toBeVisible()
  await expect(page.locator('#chessboard .square[data-alg="e4"] img')).not.toBeVisible()

  // Click again
  await page.click('#chessboard .square[data-alg="e4"]')

  // Piece should move
  await expect(page.locator('#chessboard .square[data-alg="e4"] img')).toBeVisible()
  await expect(page.locator('#chessboard .square[data-alg="e2"] img')).not.toBeVisible()
})

test('Pawn Promotion', async ({ page }) => {
  // Load position
  const fen = '8/4P3/8/8/8/8/8/k6K w - - 0 1'
  await page.evaluate((fen) => {
    if (window.gameManager) {
        window.gameManager.startNewGame(fen)
        // window.boardRenderer.render(...) is called by startNewGame
    }
  }, fen)

  // Wait for board update
  await expect(page.locator('#chessboard .square[data-alg="e7"] img')).toBeVisible()

  // Move e7-e8
  await page.click('#chessboard .square[data-alg="e7"]')
  await page.click('#chessboard .square[data-alg="e8"]')

  // Modal should appear
  await expect(page.locator('#promotion-modal')).toBeVisible()

  // Select Queen
  await page.click('.promo-piece[data-piece="q"]')

  // Check e8 has Queen
  await expect(page.locator('#chessboard .square[data-alg="e8"] img')).toHaveAttribute('src', /wq/i)
})
