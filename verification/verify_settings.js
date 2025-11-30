const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:3000');

    // Wait for board to load
    await page.waitForSelector('#chessboard');

    // Locate the settings panel
    const panel = page.locator('.board-settings-panel');

    // Ensure the new buttons are there
    await page.locator('#export-settings-btn').waitFor();
    await page.locator('#import-settings-btn').waitFor();
    await page.locator('#factory-reset-btn').waitFor();

    // Scroll the new section into view (it is at the bottom)
    await page.locator('#factory-reset-btn').scrollIntoViewIfNeeded();

    // Take screenshot of the settings panel
    await panel.screenshot({ path: 'verification/verification.png' });

    await browser.close();
    console.log('Verification script completed.');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
