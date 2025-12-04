const { test, expect } = require('./coverage')

test.describe('Accessibility Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#chessboard')
  })

  test('High Contrast Mode Toggle', async ({ page }) => {
    await page.click('#accessibility-btn')
    await expect(page.locator('#accessibility-modal')).toBeVisible()

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
    await page.click('#accessibility-btn')
    await expect(page.locator('#accessibility-modal')).toBeVisible()

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

    // Close modal to allow interaction with board
    await page.click('#close-accessibility-modal')
    await expect(page.locator('#accessibility-modal')).not.toBeVisible()

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
    await page.click('#accessibility-btn')
    await expect(page.locator('#accessibility-modal')).toBeVisible()

    const slider = page.locator('#volume-control')
    await slider.fill('0.5')
    await expect(slider).toHaveValue('0.5')
  })

  test('Voice Control Instructions Visible', async ({ page }) => {
    await page.click('#accessibility-btn')
    await expect(page.locator('#accessibility-modal')).toBeVisible()

    // Check if the instruction text is present
    await expect(page.locator('text=Say "New Game", "e4", or "Knight f3" to play.')).toBeVisible()
  })

  test('Voice Indicator Appears', async ({ page }) => {
    // Inject mock before reload
    await page.addInitScript(() => {
      window.SpeechRecognition = class MockSpeechRecognition {
        constructor () {
          this.continuous = false
          this.lang = ''
          this.interimResults = false
          this.onstart = null
          this.onend = null
          this.onresult = null
        }

        start () {
          if (this.onstart) setTimeout(() => this.onstart(), 10)
        }

        stop () {
          if (this.onend) setTimeout(() => this.onend(), 10)
        }
      }
      window.webkitSpeechRecognition = window.SpeechRecognition
    })

    await page.reload()
    await page.waitForSelector('#chessboard')

    await page.click('#accessibility-btn')
    await expect(page.locator('#accessibility-modal')).toBeVisible()

    // Enable Voice Control
    await page.check('#voice-control')

    // Expect indicator
    await expect(page.locator('#voice-indicator')).toBeVisible()
    await expect(page.locator('#voice-indicator')).toContainText('Listening')

    // Disable
    await page.uncheck('#voice-control')
    await expect(page.locator('#voice-indicator')).not.toBeVisible()
  })

  test('Voice Control Functionality', async ({ page }) => {
    await page.addInitScript(() => {
      window.SpeechRecognition = class MockSpeechRecognition {
        constructor () {
          this.continuous = true
          this.lang = 'en-US'
          this.interimResults = false
          this.onstart = null
          this.onend = null
          this.onresult = null
          window._mockRecognition = this
        }

        start () {
          if (this.onstart) setTimeout(() => this.onstart(), 10)
        }

        stop () {
          if (this.onend) setTimeout(() => this.onend(), 10)
        }
      }
      window.webkitSpeechRecognition = window.SpeechRecognition

      window.triggerVoiceCommand = (text) => {
        if (window._mockRecognition && window._mockRecognition.onresult) {
          const event = {
            results: [
              [{ transcript: text }]
            ]
          }
          window._mockRecognition.onresult(event)
        }
      }
    })

    await page.reload()
    await page.waitForSelector('#chessboard')

    await page.click('#accessibility-btn')
    await page.check('#voice-control')
    await page.click('#close-accessibility-modal')

    // Trigger "e4"
    await page.evaluate(() => window.triggerVoiceCommand('e4'))

    // Verify move e4 is played
    await expect(page.locator('#chessboard .square[data-alg="e4"] .piece')).toBeVisible()
    await expect(page.locator('.toast').last()).toContainText('Voice: e4')
  })
})
