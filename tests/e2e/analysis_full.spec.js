const { test, expect } = require('./coverage');

test.describe('Full Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#chessboard');
  });

  test('Run Full Game Analysis', async ({ page }) => {
    // Make some moves so there is a game to analyze
    const e2 = page.locator('.square[data-alg="e2"]');
    const e4 = page.locator('.square[data-alg="e4"]');
    await e2.click();
    await e4.click();

    // Wait for engine response (Black move)
    await expect(page.locator('#move-history .move-san').nth(1)).toBeVisible();

    // Click Analyze Game
    // Note: Analysis button is in history panel
    await page.click('#analyze-game-btn');

    // Check Modal
    await expect(page.locator('#analysis-report-modal')).toBeVisible();
    await expect(page.locator('#analysis-summary')).toContainText('Analyzing...');

    // Wait for completion (it might be fast for 2 moves)
    // The engine mock might return analysis quickly.
    await expect(page.locator('#analysis-summary')).toContainText('Analysis Complete', { timeout: 15000 });

    // Check table has rows
    await expect(page.locator('#analysis-table tr')).not.toHaveCount(0);

    // Close modal
    await page.click('#close-analysis-modal');
    await expect(page.locator('#analysis-report-modal')).not.toBeVisible();

    // Now that we have analysis data (from the report generation), toggle visuals
    // Enable Analysis Mode to ensure real-time visuals are active
    await page.check('#analysis-mode');

    // Toggle all visual options
    const checkboxes = [
      '#viz-king-safety',
      '#viz-mobility',
      '#viz-utilization',
      '#viz-piece-tracker',
      '#viz-outpost',
      '#viz-weak-square',
      '#viz-battery',
      '#viz-xray',
      '#viz-pin',
      '#viz-fork',
      '#viz-discovered'
    ];

    for (const id of checkboxes) {
      await page.check(id);
      // Small wait to allow render
      await page.waitForTimeout(100);
      await page.uncheck(id);
    }
  });
});
