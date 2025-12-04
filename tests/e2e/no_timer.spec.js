const { test, expect } = require('./coverage');

test.describe('No Timer Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Ensure we are connected
    await expect(page.locator('#status')).toContainText('Connected');
    // Wait for initial auto-start toast to disappear or just wait a bit
    await page.waitForTimeout(1000);
  });

  test('should enable no timer mode and persist state', async ({ page }) => {
    // 1. Open sidebar if not visible
    if (await page.locator('.sidebar.collapsed').count() > 0) {
      await page.click('#sidebar-toggle-btn');
    }

    // 2. Check "No Timer" checkbox
    const noTimerCheckbox = page.locator('#no-timer-mode');
    await expect(noTimerCheckbox).toBeVisible();
    await noTimerCheckbox.check();

    // 3. Verify inputs are disabled
    await expect(page.locator('#time-base')).toBeDisabled();
    await expect(page.locator('#time-inc')).toBeDisabled();

    // 4. Start New Game
    await page.click('#new-game-btn');

    // Check that at least one toast says "New Game Started"
    await expect(page.locator('.toast').filter({ hasText: 'New Game Started' }).first()).toBeVisible();

    // 5. Make a move (White e2-e4)
    await page.evaluate(() => {
       window.moveHandler.handleSquareClick(6, 4); // e2
       window.moveHandler.handleSquareClick(4, 4); // e4
    });

    // 6. Verify Engine Move (wait for black to move)
    // The history list renders .history-row. 1 row = 2 moves (White, Black).
    // So we expect 1 row.
    await expect(page.locator('#move-history .history-row').first()).toBeVisible({ timeout: 15000 });

    // 7. Verify Clock is not decrementing
    const isNoTimer = await page.evaluate(() => window.gameManager.isNoTimer);
    expect(isNoTimer).toBe(true);

    // Get current time
    const initialWhiteTime = await page.evaluate(() => window.gameManager.whiteTime);
    await page.waitForTimeout(1500);
    const finalWhiteTime = await page.evaluate(() => window.gameManager.whiteTime);

    // Should be exactly equal because _updateClock returns early
    expect(finalWhiteTime).toBe(initialWhiteTime);

    // 8. Verify Persistence
    await page.reload();
    await expect(page.locator('#status')).toContainText('Connected');

    // Wait for UI to sync
    await expect(noTimerCheckbox).toBeChecked();
    await expect(page.locator('#time-base')).toBeDisabled();

    // Verify game state restored
    // Wait for restoration toast
    await expect(page.locator('.toast').filter({ hasText: 'Restored' }).first()).toBeVisible();

    const isNoTimerRestored = await page.evaluate(() => window.gameManager.isNoTimer);
    expect(isNoTimerRestored).toBe(true);
  });
});
