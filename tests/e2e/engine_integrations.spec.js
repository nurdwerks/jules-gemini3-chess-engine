const { test, expect } = require('./coverage');
const path = require('path');

test.describe('Local Engine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Sidebar should be open by default on desktop.
    // Verify sidebar is visible
    const sidebar = page.locator('.sidebar');
    if (await sidebar.isHidden()) {
        await page.click('#sidebar-toggle-btn');
    }
    await page.waitForTimeout(500);
  });

  test('can upload and use local engine', async ({ page }) => {
    // 1. Upload engine
    const fileInput = page.locator('#local-engine-file');
    // Ensure visible
    await expect(fileInput).toBeVisible();

    const filePath = path.resolve(__dirname, 'fixtures/dummy_engine.js');
    await fileInput.setInputFiles(filePath);

    // 2. Wait for toast
    const toast = page.locator('.toast');
    await expect(toast.first()).toBeVisible({ timeout: 5000 });
    const text = await toast.first().textContent();

    if (text.includes('Error')) {
        throw new Error(`Toast reported error: ${text}`);
    }

    await expect(toast.first()).toContainText('Local Engine Loaded');

    // 3. Enable Local Engine
    const checkbox = page.locator('#use-local-engine');
    await expect(checkbox).toBeEnabled();
    await checkbox.check();

    // 4. Verify Toast and Status
    await expect(page.locator('.toast.success').nth(1)).toContainText('Switched to Local Engine');
    await expect(page.locator('#status')).toContainText('Status: Local Engine Active');

    // 5. Verify Engine Name in Output (it sends uci on switch)
    // Start New Game (PvE)
    await page.click('#new-game-btn');

    // Toggle Self Play
    await page.click('#self-play-btn');

    // Wait for history
    await expect(page.locator('#move-history')).toContainText('e4');
  });

  test('can connect to cloud engine', async ({ page }) => {
    // 1. Connect to self as cloud engine
    const urlInput = page.locator('#cloud-engine-url');
    await expect(urlInput).toBeVisible();
    await urlInput.fill('ws://localhost:3000');

    await page.click('#connect-cloud-btn');

    // 2. Wait for success toast
    await expect(page.locator('.toast.success')).toContainText('Cloud Engine Connected');

    // 3. Enable Cloud Engine
    const checkbox = page.locator('#use-cloud-engine');
    await expect(checkbox).toBeEnabled();
    await checkbox.check();

    // 4. Verify Status
    await expect(page.locator('.toast.success').nth(1)).toContainText('Switched to Cloud Engine');
    await expect(page.locator('#status')).toContainText('Status: Cloud Engine Active');

    // 5. Play a move
    await page.click('#new-game-btn');
    // Ensure engine plays
    await page.click('#force-move-btn');
    // The backend engine (which we connected to) should reply bestmove.

    // Wait for move history update.
    // Since we are White (default), force move sends 'stop' to backend.
    // If backend was searching, it sends bestmove.
    // If it wasn't searching, it might not send anything unless we send 'go'.

    // Toggle Self Play is safer
    await page.click('#self-play-btn');

    // Check for move
    await expect(page.locator('#move-history')).toContainText('1.');
  });
});
