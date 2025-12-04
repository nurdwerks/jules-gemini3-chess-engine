const { test, expect } = require('./coverage')

test('Engine Duel Mode', async ({ page }) => {
  // Mock logged-in user to enable features
  await page.addInitScript(() => {
    Object.defineProperty(window, 'INITIAL_USER', {
      value: { username: 'testuser', role: 'user' },
      writable: false
    });
  });

  await page.goto('/')
  await page.click('#engine-duel-btn')
  await expect(page.locator('#duel-setup-modal')).toBeVisible()

  await page.click('#start-duel-btn')
  // Should verify duel started. Toast "Active: Engine A" or similar
  // Wait for the modal to close or game to start
  await expect(page.locator('#duel-setup-modal')).not.toBeVisible()
  await expect(page.locator('#toast-container')).toContainText('Active: Engine A')
})
