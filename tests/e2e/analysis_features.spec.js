const { test, expect } = require('./coverage')

test.describe('Analysis & Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#chessboard')
  })

  test('Full Game Analysis', async ({ page }) => {
    // 1. Play a short game (Fool's Mate) to have history
    // f3
    await page.evaluate(() => {
      window.gameManager.performMove({ from: 'f2', to: 'f3' })
    })
    await page.waitForTimeout(100)
    // e5
    await page.evaluate(() => {
      window.gameManager.performMove({ from: 'e7', to: 'e5' })
    })
    await page.waitForTimeout(100)
    // g4
    await page.evaluate(() => {
      window.gameManager.performMove({ from: 'g2', to: 'g4' })
    })
    await page.waitForTimeout(100)
    // Qh4#
    await page.evaluate(() => {
      window.gameManager.performMove({ from: 'd8', to: 'h4' })
    })
    await page.waitForTimeout(500) // Wait for game over processing

    // Close Game Over modal if it appears
    const gameOverModal = page.locator('#game-over-modal')
    if (await gameOverModal.isVisible()) {
      // Force click the close button or hidden button
      await page.locator('#close-game-over-modal').click({ force: true })
      await expect(gameOverModal).toBeHidden()
    }

    // 2. Click Analyze Game
    // Ensure no other modal is blocking
    await page.click('#analyze-game-btn', { force: true })

    // 3. Verify Modal appears
    await expect(page.locator('#analysis-report-modal')).toBeVisible()

    // 4. Verify progress
    await expect(page.locator('#analysis-summary')).toContainText(/Analyzing|Complete/)

    // 5. Wait for at least one row in the table
    await expect(page.locator('#analysis-table tr')).not.toHaveCount(0)
  })

  test('GIF Creation (1 move per second)', async ({ page }) => {
    // Mock GIF library
    await page.evaluate(() => {
      window.GIF = class GIFMock {
        constructor (options) {
          this.options = options
          window.gifInstance = this
          this.frames = []
          this.onCallbacks = {}
        }
        addFrame (img, options) {
          this.frames.push({ img, options })
        }
        on (event, cb) {
          this.onCallbacks[event] = cb
        }
        render () {
          // Simulate finish immediately
          if (this.onCallbacks['finished']) {
            // Mock blob
            this.onCallbacks['finished'](new Blob(['fake-gif'], { type: 'image/gif' }))
          }
        }
      }
    })

    // Play a move so there is something to record
    await page.evaluate(() => {
      window.gameManager.performMove({ from: 'e2', to: 'e4' })
    })

    await page.click('#export-gif-btn')

    // Verify GIF generation initiated
    await expect(page.locator('.toast').filter({ hasText: 'Generating GIF' })).toBeVisible()

    // Wait for frames to be added
    await page.waitForFunction(() => {
        return window.gifInstance && window.gifInstance.frames.length > 0
    })

    // Verify delay option
    const delay = await page.evaluate(() => {
      return window.gifInstance ? window.gifInstance.frames[0].options.delay : null
    })
    expect(delay).toBe(1000)
  })

  test('Configuration Helper Popups', async ({ page }) => {
    // 1. Expand Options if needed
    // Find the label for 'Hash'. Use exact text matching to avoid 'Clear Hash'
    const label = page.getByText('Hash:', { exact: true })
    await expect(label).toBeVisible()

    // 2. Click the label
    await label.click()

    // 3. Verify Toast appears with description
    // Description for Hash is "Size of the hash table in MB"
    // Wait for the specific toast
    await expect(page.locator('.toast').filter({ hasText: 'Size of the hash table in MB' })).toBeVisible()

    // 4. Test a static option (Zen Mode)
    // Close the previous toast or wait
    await page.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()))

    // Find label for Zen Mode
    const zenLabel = page.getByText('Zen Mode:', { exact: true })
    await zenLabel.click()

    await expect(page.locator('.toast').filter({ hasText: 'Hide all UI elements except the board' })).toBeVisible()
  })
})
