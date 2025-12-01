const { test, expect } = require('./coverage');

test('External Integrations', async ({ page }) => {
  await page.goto('/');
  const sidebar = page.locator('.sidebar');
  if (await sidebar.isHidden()) await page.click('#sidebar-toggle-btn');

  // Test Lichess Analysis (Form Submit)
  await page.evaluate(() => {
    // Mock form submit
    HTMLFormElement.prototype.submit = function() {
      window.lastFormAction = this.action;
    };

    // Mock window.open
    window.open = (url, target) => {
      window.lastOpenedUrl = url;
    };
  });

  const btn = page.locator('#analyze-lichess-btn');
  await expect(btn).toBeVisible();
  await btn.click();

  const formAction = await page.evaluate(() => window.lastFormAction);
  expect(formAction).toContain('lichess.org/import');

  // Test Chess.com Analysis (window.open)
  await page.click('#analyze-chesscom-btn');
  const openedUrl2 = await page.evaluate(() => window.lastOpenedUrl);
  expect(openedUrl2).toContain('chess.com/analysis');

  // Test Twitter Share
  await page.click('#share-twitter-btn');
  const openedUrl3 = await page.evaluate(() => window.lastOpenedUrl);
  expect(openedUrl3).toContain('twitter.com/intent/tweet');

  // Test Reddit Share
  await page.click('#share-reddit-btn');
  const openedUrl4 = await page.evaluate(() => window.lastOpenedUrl);
  expect(openedUrl4).toContain('reddit.com/submit');

  // Test QR Code
  await page.click('#share-qr-btn');
  await expect(page.locator('#qr-modal')).toBeVisible();
  // QRCode.js might use canvas or img. Check for either.
  // Using evaluate to check visibility of children
  await expect(page.locator('#qrcode-container')).toBeVisible();
  const hasContent = await page.evaluate(() => {
      const container = document.getElementById('qrcode-container');
      return container && container.children.length > 0;
  });
  expect(hasContent).toBe(true);

  await page.click('#close-qr-modal');

  // Test Embed
  await page.click('#embed-btn');
  await expect(page.locator('#embed-modal')).toBeVisible();
  const embedCode = await page.inputValue('#embed-code-area');
  expect(embedCode).toContain('<iframe');
});
