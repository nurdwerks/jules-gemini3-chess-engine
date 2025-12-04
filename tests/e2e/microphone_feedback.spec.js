const { test, expect } = require('./coverage')

test.describe('Microphone Visual Feedback', () => {
  test('Visual feedback changes on speech detection', async ({ page }) => {
    // Mock SpeechRecognition with speechstart/speechend support
    await page.addInitScript(() => {
      window.SpeechRecognition = class MockSpeechRecognition {
        constructor () {
          this.continuous = true
          this.lang = 'en-US'
          this.interimResults = false
          this.onstart = null
          this.onend = null
          this.onresult = null
          this.onspeechstart = null
          this.onspeechend = null
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

      window.triggerSpeechStart = () => {
        if (window._mockRecognition && window._mockRecognition.onspeechstart) {
            window._mockRecognition.onspeechstart()
        }
      }

      window.triggerSpeechEnd = () => {
        if (window._mockRecognition && window._mockRecognition.onspeechend) {
            window._mockRecognition.onspeechend()
        }
      }
    })

    await page.goto('/')
    await page.waitForSelector('#chessboard')

    // Open Accessibility Modal
    await page.click('#accessibility-btn')

    // Enable Voice Control
    await page.check('#voice-control')

    // Check initial state (Listening)
    const indicator = page.locator('#voice-indicator')
    await expect(indicator).toBeVisible()
    await expect(indicator).toContainText('Listening')
    await expect(indicator).not.toHaveClass(/hearing/) // Assuming 'hearing' class will be added

    // Trigger speech start
    await page.evaluate(() => window.triggerSpeechStart())

    // It should now indicate hearing (either by text change or class)
    // For now, let's assume we want it to say "Hearing..." and/or have a class
    // Since I haven't implemented it yet, this expectation should fail or pass if I make it loose.
    // I want it to fail initially to confirm lack of feedback.

    // I will expect a specific class 'hearing' which I plan to add.
    await expect(indicator).toHaveClass(/hearing/)
    // await expect(indicator).toContainText('Hearing') // Optional

    // Trigger speech end
    await page.evaluate(() => window.triggerSpeechEnd())

    // Should revert
    await expect(indicator).not.toHaveClass(/hearing/)
    await expect(indicator).toContainText('Listening')
  })
})
