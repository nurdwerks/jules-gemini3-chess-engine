const { test, expect } = require('./coverage')

test.describe('Self Play Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#chessboard')

    // Wait for connection
    await expect(page.locator('#status')).toContainText('Connected', { timeout: 10000 })

    // Wait for options to populate (confirmation that engine is ready)
    await expect(page.locator('#uci-options fieldset')).not.toHaveCount(0, { timeout: 10000 })

    await page.selectOption('#animation-speed', '0')
  })

  test('Self Play Button Toggle', async ({ page }) => {
    const btn = page.locator('#self-play-btn')

    // Verify initial state
    await expect(btn).toHaveText('Self Play')

    // Click to start
    await btn.click()
    await expect(btn).toHaveText('Stop Self Play')

    // Click to stop
    await btn.click()
    await expect(btn).toHaveText('Self Play')
  })

  test('Engine plays moves in self play and can stop', async ({ page }) => {
    // Start Self Play
    await page.click('#self-play-btn')
    await expect(page.locator('#self-play-btn')).toHaveText('Stop Self Play')

    // Wait for moves
    await expect(async () => {
      const count = await page.locator('.move-san').count()
      expect(count).toBeGreaterThanOrEqual(2)
    }).toPass({ timeout: 30000, intervals: [1000] })

    // Stop
    await page.click('#self-play-btn')
    await expect(page.locator('#self-play-btn')).toHaveText('Self Play')

    // Get current move count
    const countAfterStop = await page.locator('.move-san').count()

    // Wait a bit to ensure it stopped
    await page.waitForTimeout(3000)

    // Verify count hasn't increased (significantly)
    // At most 1 move might complete if it was already in flight
    const countFinal = await page.locator('.move-san').count()
    expect(countFinal).toBeLessThanOrEqual(countAfterStop + 1)
  })
})
