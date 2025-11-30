const { test, expect } = require('./coverage')

test.describe('Accessibility & Sound Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
    // Sidebar is visible by default on desktop.
    // Only click toggle if we are in mobile view or if logic changes.
    // For now, assume default is visible.
    await page.waitForSelector('.sidebar', { state: 'visible' })
  })

  test('UI Elements exist', async ({ page }) => {
    await expect(page.locator('.panel.accessibility-panel')).toBeVisible()
    await expect(page.locator('#sound-enabled')).toBeChecked()
    await expect(page.locator('#volume-control')).toBeVisible()
    await expect(page.locator('#voice-announce')).toBeVisible()
    await expect(page.locator('#voice-control')).toBeVisible()
    await expect(page.locator('#high-contrast')).toBeVisible()
    await expect(page.locator('#sound-pack-upload')).toBeVisible()
  })

  test('High Contrast Mode toggle', async ({ page }) => {
    const body = page.locator('body')
    await expect(body).not.toHaveClass(/high-contrast/)

    await page.check('#high-contrast')
    await expect(body).toHaveClass(/high-contrast/)

    await page.uncheck('#high-contrast')
    await expect(body).not.toHaveClass(/high-contrast/)
  })

  test('Voice Announce toggle', async ({ page }) => {
    await page.check('#voice-announce')
    await expect(page.locator('#voice-announce')).toBeChecked()

    await page.uncheck('#voice-announce')
    await expect(page.locator('#voice-announce')).not.toBeChecked()
  })

  test('ARIA Live Region', async ({ page }) => {
    await expect(page.locator('#a11y-status')).toHaveAttribute('aria-live', 'polite')
  })
})
