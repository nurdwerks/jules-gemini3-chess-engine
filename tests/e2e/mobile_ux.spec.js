const { test, expect } = require('./coverage');

test.describe('Mobile Layout', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');

        // Handle Auth Modal
        try {
            const guestBtn = page.locator('#btn-guest');
            if (await guestBtn.isVisible({ timeout: 2000 })) {
                await guestBtn.click();
            }
        } catch (e) {
            // Modal might not appear or already be gone
        }
    });

    test('Captured pieces should not push timer off screen on mobile', async ({ page }) => {
        // Use a mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        // Wait for page to load
        await page.waitForSelector('#top-player');

        // Check if the timer is visible
        const clock = page.locator('#top-player-clock');
        await expect(clock).toBeVisible();

        // Check layout structure (clock should be to the right of details)
        const clockBox = await clock.boundingBox();
        const detailsBox = await page.locator('.player-details').first().boundingBox();
        const capturedBox = await page.locator('.captured-pieces').first().boundingBox();

        // Ensure elements are present
        expect(clockBox).not.toBeNull();
        expect(detailsBox).not.toBeNull();
        expect(capturedBox).not.toBeNull();

        // Check Avatar visibility - it might be hidden by error handler, so we don't strict check it.
        // But we rely on grid areas.

        // Verify Grid Layout (Y coordinates)

        // Clock should be roughly aligned with Details (Row 1)
        expect(Math.abs(clockBox.y - detailsBox.y)).toBeLessThan(20);

        // Captured should be BELOW Clock
        expect(capturedBox.y).toBeGreaterThan(clockBox.y + clockBox.height - 5); // -5 for tolerance

        // Captured should span width (approx check)
        // We expect captured pieces to be below details/clock.
    });

    test('Material Bar should be hidden on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        const bar = page.locator('.material-bar-container').first();
        await expect(bar).toBeHidden();
    });
});

test.describe('Game Over Logic', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');

        // Handle Auth Modal
        try {
            const guestBtn = page.locator('#btn-guest');
            if (await guestBtn.isVisible({ timeout: 2000 })) {
                await guestBtn.click();
            }
        } catch (e) {
            // Modal might not appear or already be gone
        }
    });

    test('Should not auto-restart after game over', async ({ page }) => {
        // Wait for game to be ready
        await page.waitForSelector('#chessboard');

        // Check initial state: "New Game" button should verify game is running?
        // Actually, on load, a game is started.

        // Simulate Game Over by resigning
        // Make sure sidebar is visible if it's collapsed (mobile?) - Default desktop view has sidebar.
        await page.setViewportSize({ width: 1280, height: 720 });

        await page.click('#resign-btn');

        // Verify Game Over Modal
        await expect(page.locator('#game-over-modal')).toBeVisible();

        // Close modal
        await page.click('#close-game-over-modal');

        // Ensure modal is closed
        await expect(page.locator('#game-over-modal')).not.toBeVisible();

        // Wait a bit to see if it restarts automatically
        await page.waitForTimeout(1000);

        // The modal should NOT appear again
        await expect(page.locator('#game-over-modal')).not.toBeVisible();

        // Engine should NOT be thinking (class on board)
        const thinking = await page.evaluate(() => {
            const board = document.getElementById('chessboard');
            return board.classList.contains('thinking-border');
        });
        expect(thinking).toBeFalsy();
    });
});
