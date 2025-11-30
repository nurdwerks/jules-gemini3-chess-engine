const { test, expect } = require('@playwright/test');

test.describe('Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#chessboard');
  });

  test('Pawn Promotion', async ({ page }) => {
    // Load FEN with white pawn on a7
    const fen = '8/P7/8/8/8/8/8/k6K w - - 0 1';
    await page.fill('#fen-input', fen);
    await page.click('#load-fen-btn');

    // Move pawn a7 -> a8
    const a7 = page.locator('.square[data-alg="a7"]');
    const a8 = page.locator('.square[data-alg="a8"]');

    await a7.click();
    await a8.click();

    // Check promotion modal appears
    const modal = page.locator('#promotion-modal');
    await expect(modal).toBeVisible();

    // Select Queen
    await page.locator('.promo-piece[data-piece="q"]').click();

    // Verify modal closed
    await expect(modal).not.toBeVisible();

    // Verify piece on a8 is a Queen (White)
    // Class typically is piece-w-q or similar, checking .piece and some identifier if possible.
    // The piece-set classes are usually like 'piece-set-cburnett' and 'w' 'q' or filename.
    // Let's check for the presence of a piece first.
    await expect(a8.locator('.piece')).toBeVisible();

    // We can check if the src attribute contains 'wQ' or 'q'
    const img = a8.locator('img.piece');
    await expect(img).toHaveAttribute('src', /wq/i); // Standard cburnett uses wQ.svg
  });

  test('Game Clock', async ({ page }) => {
    // Start New Game (PvE default)
    await page.click('#new-game-btn');

    // Check initial time (assuming default 5 mins)
    // The clock text is 05:00
    const whiteClock = page.locator('#bottom-player-clock');
    await expect(whiteClock).toContainText('05:00');

    // Make a move to start the clock for Black (White moves, then Black's clock starts ticking?
    // Usually clock starts after first move for the side that just moved?)
    // Actually, usually White's clock starts ticking immediately or after they move?
    // In this app, "Time starts after first move" is common.
    // Let's make a move.

    const e2 = page.locator('.square[data-alg="e2"]');
    const e4 = page.locator('.square[data-alg="e4"]');
    await e2.click();
    await e4.click();

    // Wait for engine to move (Black).
    // After Black moves, White's clock should be running (ticking down from 05:00).
    // Or after White moves, Black's clock runs.

    // Let's just wait a bit and see if text changes from "05:00".
    // It might take a second.
    await expect(whiteClock).not.toHaveText('05:00', { timeout: 10000 });
  });
});
