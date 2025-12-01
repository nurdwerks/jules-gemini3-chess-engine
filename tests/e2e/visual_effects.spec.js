const { test, expect } = require('./coverage')

test('Visual Effects', async ({ page }) => {
  const sessionCheck = page.waitForResponse(resp => resp.url().includes('/api/user/me')).catch(() => {});
  await page.goto('/')
  await sessionCheck;

  // Nuclear Option: Force remove auth modal
  await page.evaluate(() => {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.remove();
  });

  // Test Mind Control Toggle
  await page.check('#mind-control-mode')

  // Expect Toast
  // Wait for any toast
  await expect(page.locator('#toast-container')).toBeVisible()

  // Check for text
  await expect(page.locator('#toast-container')).toContainText('Searching for EEG')

  // Wait for fallback toast
  await expect(page.locator('#toast-container')).toContainText('No Neuralink found', { timeout: 5000 })

  // Should be unchecked
  await expect(page.locator('#mind-control-mode')).not.toBeChecked()

  // Test Confetti
  await page.evaluate(() => {
    if (window.visualEffects) window.visualEffects.startConfetti()
  })
  await expect(page.locator('#confetti-canvas')).toBeVisible()

  // Test Shake
  await page.evaluate(() => {
    if (window.visualEffects) window.visualEffects.triggerShake()
  })
  await expect(page.locator('#chessboard')).toHaveClass(/shake/)
})
