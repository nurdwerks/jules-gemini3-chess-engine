const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000');

    // 1. Open Accessibility Panel (sidebar is open by default on desktop)
    // Check 'High Contrast'
    await page.check('#high-contrast');

    // Check 'Voice Announcements'
    await page.check('#voice-announce');

    // Wait a bit
    await page.waitForTimeout(500);

    // Take screenshot
    if (!fs.existsSync('verification')) fs.mkdirSync('verification');
    await page.screenshot({ path: 'verification/accessibility_high_contrast.png', fullPage: true });

    console.log('Screenshot taken: verification/accessibility_high_contrast.png');

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
