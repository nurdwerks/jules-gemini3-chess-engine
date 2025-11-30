const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:3000');

    // Open Settings Panel (it's visible by default in sidebar)
    // Check for Export Settings button
    const exportBtn = page.locator('#export-settings-btn');
    await exportBtn.waitFor({ timeout: 5000 });
    console.log('Export Settings button found');

    // Check External Analysis buttons
    const lichessBtn = page.locator('#analyze-lichess-btn');
    await lichessBtn.waitFor();
    console.log('Lichess button found');

    // Trigger Game Over Modal
    await page.evaluate(() => {
        // Mock gameManager callback
        if (window.gameManager && window.gameManager.callbacks && window.gameManager.callbacks.onGameOver) {
            window.gameManager.callbacks.onGameOver({ winner: 'white', reason: 'Verification Test' });
        } else {
            throw new Error('GameManager not found');
        }
    });

    const modal = page.locator('#game-over-modal');
    await modal.waitFor({ state: 'visible' });
    console.log('Game Over modal visible');

    const title = await page.locator('#game-over-result').textContent();
    if (title !== 'White Wins!') throw new Error('Incorrect modal title: ' + title);

    await page.screenshot({ path: 'verification/verification.png' });
    console.log('Screenshot taken');

  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
