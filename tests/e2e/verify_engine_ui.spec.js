const { test, expect } = require('../e2e/coverage');

test('verify engine ui', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Open sidebar if closed
  const sidebar = page.locator('.sidebar');
  if (await sidebar.isHidden()) {
      await page.click('#sidebar-toggle-btn');
  }
  await page.waitForTimeout(500);

  // Scroll to Engine Options
  const panel = page.locator('.uci-options-panel');
  await panel.scrollIntoViewIfNeeded();

  // Take screenshot of the engine options panel
  await panel.screenshot({ path: 'verification/engine_options.png' });
});
