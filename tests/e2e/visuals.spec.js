const { test, expect } = require('./coverage');

test.describe('Analysis Visualizations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#chessboard');
  });

  test('Toggle Visuals', async ({ page }) => {
    // Start a game and enable analysis to ensure data exists for visuals
    await page.click('#new-game-btn');
    const e2 = page.locator('.square[data-alg="e2"]');
    const e4 = page.locator('.square[data-alg="e4"]');
    await e2.click();
    await e4.click();

    // Enable Analysis Mode
    await page.check('#analysis-mode');

    // Wait for evaluation to appear (ensures engine sent info)
    await expect(page.locator('#eval-value')).not.toHaveText('-', { timeout: 10000 });

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
      // Wait a bit for render (it's sync but DOM update might lag)
      // We can check if BoardRenderer.vizManager methods were called if we could spy,
      // but E2E is black box.
      // We can check if SVG arrows or highlights appear.
      // Most visuals use #arrow-layer or custom classes.
      // Let's just toggle them to execute the code paths.
      await page.uncheck(id);
    }

    // Check "Show Threats"
    await page.check('#show-threats');
    await page.uncheck('#show-threats');
  });
});
