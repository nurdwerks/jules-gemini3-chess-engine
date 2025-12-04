const { test, expect } = require('./coverage')

test.describe('Accessibility Button Position', () => {
  test.beforeEach(async ({ page }) => {
    const sessionCheck = page.waitForResponse(resp => resp.url().includes('/api/user/me')).catch(() => {})
    await page.goto('/')
    await sessionCheck

    // Handle auth
    const modal = page.locator('#auth-modal')
    if (await modal.isVisible()) {
      const guestBtn = page.locator('#btn-guest')
      if (await guestBtn.isVisible()) {
        await guestBtn.click()
      }
      await expect(modal).not.toBeVisible()
    }
  })

  test('should be at bottom left on mobile', async ({ page }) => {
    // Set viewport to mobile
    await page.setViewportSize({ width: 375, height: 667 })

    const btn = page.locator('#accessibility-btn')
    await expect(btn).toBeVisible()

    // Check computed styles
    const box = await btn.boundingBox()
    expect(box).not.toBeNull()

    // It should be near the bottom left
    const viewport = page.viewportSize()

    // bottom: 10px, left: 10px
    // y should be roughly height - 10 - height_of_btn
    // x should be 10

    expect(box.x).toBeCloseTo(10, 1) // allow 1px diff
    expect(box.y).toBeCloseTo(viewport.height - 10 - box.height, 1)
  })

  test('should be at bottom left on desktop', async ({ page }) => {
    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 })

    const btn = page.locator('#accessibility-btn')
    await expect(btn).toBeVisible()

    const box = await btn.boundingBox()
    const viewport = page.viewportSize()

    // bottom: 20px, left: 20px
    expect(box.x).toBeCloseTo(20, 1)
    expect(box.y).toBeCloseTo(viewport.height - 20 - box.height, 1)
  })
})
