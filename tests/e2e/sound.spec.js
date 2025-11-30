const { test } = require('./coverage')

test.describe('Sound Manager', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#chessboard')
  })

  test('Toggle Sound', async ({ page }) => {
    const soundToggle = page.locator('#sound-enabled')
    await soundToggle.uncheck()
    await soundToggle.check()

    // Trigger a move to fire sound logic
    const e2 = page.locator('.square[data-alg="e2"]')
    const e4 = page.locator('.square[data-alg="e4"]')
    await e2.click()
    await e4.click()

    // We can't verify sound played, but code path executed.
  })
})
