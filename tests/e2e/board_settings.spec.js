const { test, expect } = require('./coverage');

test.describe('Board Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Open sidebar if closed
    const sidebar = page.locator('.sidebar');
    if (await sidebar.isHidden()) {
        await page.click('#sidebar-toggle-btn');
    }
    await page.waitForTimeout(500);
  });

  test('Auto-Flip toggle', async ({ page }) => {
    const checkbox = page.locator('#auto-flip');
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });

  test('Blindfold Mode toggle', async ({ page }) => {
    const checkbox = page.locator('#blindfold-mode');
    await checkbox.check();

    const board = page.locator('#chessboard');
    await expect(board).toHaveClass(/blindfold/);

    await checkbox.uncheck();
    await expect(board).not.toHaveClass(/blindfold/);
  });

  test('Streamer Mode toggle', async ({ page }) => {
    const btn = page.locator('#streamer-mode-btn');
    await btn.click();

    const body = page.locator('body');
    await expect(body).toHaveClass(/streamer-mode/);
  });

  test('Board Size slider', async ({ page }) => {
    const board = page.locator('#chessboard');

    // Set value via JS to ensure event firing
    await page.evaluate(() => {
        const s = document.getElementById('board-size');
        s.value = 500;
        s.dispatchEvent(new Event('change'));
    });

    await expect(board).toHaveCSS('--board-max-width', '500px');
  });
});
