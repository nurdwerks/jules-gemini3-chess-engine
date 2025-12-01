const { test, expect } = require('./coverage')

test.describe('Castling Tests', () => {
  test.describe('Standard Castling', () => {
    test('White Kingside', async ({ page }) => {
      // FEN with King on e1, Rook on h1, clear path. Rank 2 empty.
      const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'
      await page.goto(`/?fen=${encodeURIComponent(fen)}`)
      await page.waitForSelector('#chessboard')

      // Wait for board to load (e2 empty)
      await expect(page.locator('#chessboard .square[data-alg="e2"] .piece')).toHaveCount(0)
      // Ensure King is at e1
      await expect(page.locator('#chessboard .square[data-alg="e1"] .piece[src*="wk.svg"]')).toBeVisible()

      const e1 = page.locator('#chessboard .square[data-alg="e1"]')
      const g1 = page.locator('#chessboard .square[data-alg="g1"]')

      await e1.dragTo(g1)

      // Expect King on g1, Rook on f1
      await expect(page.locator('#chessboard .square[data-alg="g1"] .piece[src*="wk.svg"]')).toBeVisible()
      await expect(page.locator('#chessboard .square[data-alg="f1"] .piece[src*="wr.svg"]')).toBeVisible()

      // Origins empty
      await expect(page.locator('#chessboard .square[data-alg="e1"] .piece')).toHaveCount(0)
      await expect(page.locator('#chessboard .square[data-alg="h1"] .piece')).toHaveCount(0)
    })

    test('White Queenside', async ({ page }) => {
      const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'
      await page.goto(`/?fen=${encodeURIComponent(fen)}`)
      await page.waitForSelector('#chessboard')

      await expect(page.locator('#chessboard .square[data-alg="e2"] .piece')).toHaveCount(0)
      await expect(page.locator('#chessboard .square[data-alg="e1"] .piece[src*="wk.svg"]')).toBeVisible()

      const e1 = page.locator('#chessboard .square[data-alg="e1"]')
      const c1 = page.locator('#chessboard .square[data-alg="c1"]')

      await e1.dragTo(c1)

      // Expect King on c1, Rook on d1
      await expect(page.locator('#chessboard .square[data-alg="c1"] .piece[src*="wk.svg"]')).toBeVisible()
      await expect(page.locator('#chessboard .square[data-alg="d1"] .piece[src*="wr.svg"]')).toBeVisible()

      await expect(page.locator('#chessboard .square[data-alg="e1"] .piece')).toHaveCount(0)
      await expect(page.locator('#chessboard .square[data-alg="a1"] .piece')).toHaveCount(0)
    })

    test('Black Kingside', async ({ page }) => {
      const fen = 'r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1'
      await page.goto(`/?fen=${encodeURIComponent(fen)}`)
      await page.waitForSelector('#chessboard')

      await expect(page.locator('#chessboard .square[data-alg="e7"] .piece')).toHaveCount(0)
      await expect(page.locator('#chessboard .square[data-alg="e8"] .piece[src*="bk.svg"]')).toBeVisible()

      const e8 = page.locator('#chessboard .square[data-alg="e8"]')
      const g8 = page.locator('#chessboard .square[data-alg="g8"]')

      await e8.dragTo(g8)

      // Expect King on g8, Rook on f8
      await expect(page.locator('#chessboard .square[data-alg="g8"] .piece[src*="bk.svg"]')).toBeVisible()
      await expect(page.locator('#chessboard .square[data-alg="f8"] .piece[src*="br.svg"]')).toBeVisible()

      await expect(page.locator('#chessboard .square[data-alg="e8"] .piece')).toHaveCount(0)
      await expect(page.locator('#chessboard .square[data-alg="h8"] .piece')).toHaveCount(0)
    })

    test('Black Queenside', async ({ page }) => {
      const fen = 'r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1'
      await page.goto(`/?fen=${encodeURIComponent(fen)}`)
      await page.waitForSelector('#chessboard')

      await expect(page.locator('#chessboard .square[data-alg="e7"] .piece')).toHaveCount(0)
      await expect(page.locator('#chessboard .square[data-alg="e8"] .piece[src*="bk.svg"]')).toBeVisible()

      const e8 = page.locator('#chessboard .square[data-alg="e8"]')
      const c8 = page.locator('#chessboard .square[data-alg="c8"]')

      await e8.dragTo(c8)

      // Expect King on c8, Rook on d8
      await expect(page.locator('#chessboard .square[data-alg="c8"] .piece[src*="bk.svg"]')).toBeVisible()
      await expect(page.locator('#chessboard .square[data-alg="d8"] .piece[src*="br.svg"]')).toBeVisible()

      await expect(page.locator('#chessboard .square[data-alg="e8"] .piece')).toHaveCount(0)
      await expect(page.locator('#chessboard .square[data-alg="a8"] .piece')).toHaveCount(0)
    })
  })

  test.describe('Chess960 Castling', () => {
    // Chess960 castling is currently not supported by the frontend chess.js library
    test.fixme('White Kingside (King d1, Rook h1)', async ({ page }) => {
      // King on d1, Rook on h1. Castling K-side should land King on g1, Rook on f1.
      const fen = '4k3/8/8/8/8/8/8/3K3R w K - 0 1'
      await page.goto(`/?fen=${encodeURIComponent(fen)}`)
      await page.waitForSelector('#chessboard')

      await expect(page.locator('#chessboard .square[data-alg="e2"] .piece')).toHaveCount(0)
      await expect(page.locator('#chessboard .square[data-alg="d1"] .piece[src*="wk.svg"]')).toBeVisible()

      const d1 = page.locator('#chessboard .square[data-alg="d1"]')
      const g1 = page.locator('#chessboard .square[data-alg="g1"]')

      // Attempt drag to target square g1
      await d1.dragTo(g1)

      await expect(page.locator('#chessboard .square[data-alg="g1"] .piece[src*="wk.svg"]')).toBeVisible()
      await expect(page.locator('#chessboard .square[data-alg="f1"] .piece[src*="wr.svg"]')).toBeVisible()

      await expect(page.locator('#chessboard .square[data-alg="d1"] .piece')).toHaveCount(0)
      await expect(page.locator('#chessboard .square[data-alg="h1"] .piece')).toHaveCount(0)
    })

    test.fixme('White Queenside (King d1, Rook a1)', async ({ page }) => {
      // King on d1, Rook on a1. Castling Q-side should land King on c1, Rook on d1.
      const fen = '4k3/8/8/8/8/8/8/R2K4 w Q - 0 1'
      await page.goto(`/?fen=${encodeURIComponent(fen)}`)
      await page.waitForSelector('#chessboard')

      await expect(page.locator('#chessboard .square[data-alg="e2"] .piece')).toHaveCount(0)
      await expect(page.locator('#chessboard .square[data-alg="d1"] .piece[src*="wk.svg"]')).toBeVisible()

      const d1 = page.locator('#chessboard .square[data-alg="d1"]')
      const c1 = page.locator('#chessboard .square[data-alg="c1"]')

      await d1.dragTo(c1)

      await expect(page.locator('#chessboard .square[data-alg="c1"] .piece[src*="wk.svg"]')).toBeVisible()
      await expect(page.locator('#chessboard .square[data-alg="d1"] .piece[src*="wr.svg"]')).toBeVisible()

      await expect(page.locator('#chessboard .square[data-alg="d1"] .piece[src*="wk.svg"]')).toHaveCount(0)
      await expect(page.locator('#chessboard .square[data-alg="a1"] .piece')).toHaveCount(0)
    })
  })
})
