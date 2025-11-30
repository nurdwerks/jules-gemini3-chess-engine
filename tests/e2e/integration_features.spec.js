const { test, expect } = require('./coverage')

test.describe('Integration Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#chessboard')
  })

  test('Info Modals', async ({ page }) => {
    // Changelog
    await page.click('#changelog-btn')
    await expect(page.locator('#info-modal')).toHaveClass(/active/)
    await expect(page.locator('#info-modal-title')).toHaveText('Changelog')
    await page.click('#close-info-modal')
    await expect(page.locator('#info-modal')).not.toHaveClass(/active/)

    // License
    await page.click('#license-btn')
    await expect(page.locator('#info-modal')).toHaveClass(/active/)
    await expect(page.locator('#info-modal-title')).toHaveText('License')
    await page.click('#close-info-modal')

    // Credits
    await page.click('#credits-btn')
    await expect(page.locator('#info-modal')).toHaveClass(/active/)
    await expect(page.locator('#info-modal-title')).toHaveText('Credits')
    await page.click('#close-info-modal')

    // Shortcuts
    await page.click('#shortcuts-btn')
    await expect(page.locator('#info-modal')).toHaveClass(/active/)
    await expect(page.locator('#info-modal-title')).toHaveText('Shortcuts')
    await page.click('#close-info-modal')
  })

  test('Keyboard Shortcuts', async ({ page }) => {
    // F - Flip
    await page.keyboard.press('f')
    await expect(page.locator('#chessboard')).toHaveClass(/flipped/)
    await page.keyboard.press('f')
    await expect(page.locator('#chessboard')).not.toHaveClass(/flipped/)

    // Escape - Zen Mode
    await page.keyboard.press('Escape')
    await expect(page.locator('body')).toHaveClass(/zen-mode/)
    await page.keyboard.press('Escape')
    await expect(page.locator('body')).not.toHaveClass(/zen-mode/)
  })

  test('Settings Reset', async ({ page }) => {
    page.on('dialog', dialog => dialog.accept()) // Auto accept confirm
    await page.click('#factory-reset-btn')
    await expect(page.locator('.toast').first()).toBeVisible()
    await expect(page.locator('.toast').first()).toContainText('Settings reset')
  })

  test('Version API', async ({ page }) => {
    const response = await page.request.get('/version')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.version).toBeDefined()
  })
})
