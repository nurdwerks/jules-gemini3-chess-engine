const { test, expect } = require('./coverage');

test.describe('Layout & Viewport', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#chessboard');
  });

  test('body should not have scrollbars on desktop', async ({ page }) => {
    // Set a large viewport to simulate desktop
    await page.setViewportSize({ width: 1200, height: 800 });

    // Check computed style using evaluate
    const overflow = await page.evaluate(() => {
        return window.getComputedStyle(document.body).overflow;
    });

    // Check html overflow too.
    const htmlOverflow = await page.evaluate(() => {
        return window.getComputedStyle(document.documentElement).overflow;
    });

    expect(overflow === 'hidden' || htmlOverflow === 'hidden').toBe(true);
  });

  test('sidebar should be scrollable', async ({ page }) => {
     await page.setViewportSize({ width: 1200, height: 600 });
     // Sidebar has many panels, it should overflow
     const sidebarOverflowY = await page.$eval('.sidebar', (el) => getComputedStyle(el).overflowY);
     expect(sidebarOverflowY).toBe('auto');

     const scrollHeight = await page.$eval('.sidebar', el => el.scrollHeight);
     const clientHeight = await page.$eval('.sidebar', el => el.clientHeight);
     expect(scrollHeight).toBeGreaterThan(clientHeight);
  });

  test('chessboard should fit in viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 });
      const board = page.locator('.board-wrapper'); // Check wrapper for squareness
      await expect(board).toBeVisible();

      const box = await board.boundingBox();
      console.log('Board Box:', box);

      expect(box.height).toBeLessThanOrEqual(800);
      expect(box.width).toBeLessThanOrEqual(1200);

      // Ensure it is square (approx)
      expect(Math.abs(box.width - box.height)).toBeLessThan(5); // Allow small rounding diff
  });

  test('mobile layout should allow body scroll', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const bodyOverflow = await page.evaluate(() => {
          return window.getComputedStyle(document.body).overflow;
      });
      // Media query sets overflow to auto
      expect(bodyOverflow).toBe('auto');

      // Check sidebar width
      const sidebarWidth = await page.$eval('.sidebar', el => el.clientWidth);
      expect(sidebarWidth).toBeGreaterThan(300); // Takes full width (minus padding)
  });
});
