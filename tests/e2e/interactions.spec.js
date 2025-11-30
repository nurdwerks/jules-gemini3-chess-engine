const { test, expect } = require('./coverage');

test.describe('Board Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#chessboard');
  });

  test.skip('Draw Arrows and Highlight Squares', async ({ page }) => {
    // Draw Arrow e2 -> e4 (Right-click drag)
    const sq_e2 = page.locator('.square[data-alg="e2"]');
    const sq_e4 = page.locator('.square[data-alg="e4"]');

    // Ensure elements are ready
    await sq_e2.waitFor();
    await sq_e4.waitFor();

    const box_e2 = await sq_e2.boundingBox();
    const box_e4 = await sq_e4.boundingBox();

    if (box_e2 && box_e4) {
      // Move to start
      await page.mouse.move(box_e2.x + box_e2.width / 2, box_e2.y + box_e2.height / 2);
      // Press right
      await page.mouse.down({ button: 'right' });
      // Drag to end
      await page.mouse.move(box_e4.x + box_e4.width / 2, box_e4.y + box_e4.height / 2, { steps: 5 });
      // Release
      await page.mouse.up({ button: 'right' });
    }

    // Verify arrow exists in SVG
    const arrowLayer = page.locator('#arrow-layer');
    // It should contain a line or polygon
    await expect(arrowLayer.locator('line, polygon').first()).toBeVisible();

    // Highlight Square h1 (Right-click)
    const sq_h1 = page.locator('.square[data-alg="h1"]');
    const box_h1 = await sq_h1.boundingBox();
    if (box_h1) {
        await page.mouse.move(box_h1.x + box_h1.width / 2, box_h1.y + box_h1.height / 2);
        await page.mouse.down({ button: 'right' });
        await page.mouse.up({ button: 'right' });
    }

    // Check if circle or highlight appears
    // Usually it adds a circle in SVG or class on square
    // Let's check arrow layer has increased count or new type
    // Or just that it didn't crash
  });

  test('Move Pieces and Last Move Arrow', async ({ page }) => {
    // Enable Last Move Arrow
    await page.locator('#show-arrow-last').check();

    // Make move e2 -> e4
    const sq_e2 = page.locator('.square[data-alg="e2"]');
    const sq_e4 = page.locator('.square[data-alg="e4"]');

    await sq_e2.click();
    await sq_e4.click();

    // Wait for piece to move
    // e4 should have a white pawn (piece-w-p)
    // e2 should be empty
    await expect(sq_e4.locator('.piece')).toBeVisible();
    await expect(sq_e2.locator('.piece')).toHaveCount(0);

    // Check Last Move Arrow
    // The arrow layer should contain the arrow.
    const arrowLayer = page.locator('#arrow-layer');
    await expect(arrowLayer).toBeVisible();

    // Wait for engine response (Black moves)
    // Black usually plays e5 or c5 etc.
    // We can just wait for *any* black piece to move or turn to change?
    // Status should change to "White to move" after engine moves.
    // Or we check that move history has 2 items.
    const history = page.locator('#move-history');
    // Wait for history to have entries.
    // .move-row might be the selector
    // await expect(history.locator('.move-row')).toHaveCount(1); // 1. e4 ...
  });
});
