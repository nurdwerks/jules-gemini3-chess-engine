const { test, expect } = require('./coverage')

test.describe('Accessibility Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#chessboard')
  })

  test('High Contrast Mode Toggle', async ({ page }) => {
    await page.check('#high-contrast')
    await expect(page.locator('body')).toHaveClass(/high-contrast/)

    await page.uncheck('#high-contrast')
    await expect(page.locator('body')).not.toHaveClass(/high-contrast/)
  })

  test('Keyboard Navigation', async ({ page }) => {
    // Make a move first (e2-e4)
    const e2Piece = page.locator('#chessboard .square[data-alg="e2"] .piece')
    const e4Square = page.locator('#chessboard .square[data-alg="e4"]')

    // Wait for piece to be visible and stable
    await expect(e2Piece).toBeVisible()

    await e2Piece.dragTo(e4Square)

    // Verify piece is on e4
    await expect(page.locator('#chessboard .square[data-alg="e4"] .piece')).toBeVisible()

    // Wait for history to populate (check history list)
    await expect(page.locator('#move-history')).toContainText('e4')

    // Click body to ensure no input is focused
    await page.click('body')

    // Press Left Arrow multiple times to ensure we go back to start (in case engine moved)
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')

    // Should be back at start position (e2 occupied, e4 empty)
    await expect(page.locator('#chessboard .square[data-alg="e2"] .piece')).toBeVisible()
    await expect(page.locator('#chessboard .square[data-alg="e4"] .piece')).not.toBeVisible()

    // Press Right Arrow
    await page.keyboard.press('ArrowRight')

    // Should be at move 1 (e4 occupied)
    await expect(page.locator('#chessboard .square[data-alg="e4"] .piece')).toBeVisible()
  })

  test('Voice Announcement Toggle', async ({ page }) => {
    // Mock speechSynthesis
    await page.evaluate(() => {
      window._utterances = []
      const mockSynthesis = {
        speak: (u) => {
          window._utterances.push(u.text)
        },
        getVoices: () => [],
        cancel: () => {},
        paused: false,
        pending: false,
        speaking: false
      }

      try {
        delete window.speechSynthesis
        window.speechSynthesis = mockSynthesis
      } catch (e) {
        Object.defineProperty(window, 'speechSynthesis', {
          value: mockSynthesis,
          writable: true
        })
      }

      window.SpeechSynthesisUtterance = class { constructor (t) { this.text = t } }
    })

    await page.check('#voice-announce')

    // Make a move: d2-d4
    const d2Piece = page.locator('#chessboard .square[data-alg="d2"] .piece')
    const d4Square = page.locator('#chessboard .square[data-alg="d4"]')

    await expect(d2Piece).toBeVisible()
    await d2Piece.dragTo(d4Square)

    // Check if speak was called
    // We poll or wait a bit
    await page.waitForTimeout(1000)
    const texts = await page.evaluate(() => window._utterances)

    // "White plays Pawn to d4"
    const match = texts.some(t => /White plays Pawn/.test(t))
    expect(match).toBe(true)
  })

  test('Sound Volume Control', async ({ page }) => {
    const slider = page.locator('#volume-control')
    await slider.fill('0.5')
    await expect(slider).toHaveValue('0.5')
  })
})
