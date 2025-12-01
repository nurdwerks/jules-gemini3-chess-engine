const { test, expect } = require('./coverage');

test.describe('Debug Features', () => {

  test.beforeEach(async ({ page }) => {
    const sessionCheck = page.waitForResponse(resp => resp.url().includes('/api/user/me')).catch(() => {});
    await page.goto('/');
    await sessionCheck;

    // Wait for basic UI
    await expect(page.locator('#chessboard')).toBeAttached();
  });

  test('Debug Overlay toggles and updates with engine info', async ({ page }) => {
    const debugCheckbox = page.locator('#dev-debug-overlay');

    await expect(debugCheckbox).toBeAttached();
    await debugCheckbox.check({ force: true });

    const overlay = page.locator('.debug-overlay');
    await expect(overlay).toBeVisible();

    // Mock engine info message to verify UI updates
    await page.evaluate(() => {
        const msg = 'info depth 10 seldepth 15 multipv 1 score cp 50 nodes 1000 nps 200000 time 5 pv e2e4 e7e5';
        // gameManager.socketHandler is EngineProxy. activeEngine is SocketHandler.
        // We inject the message directly into the socket handler logic.
        if (window.gameManager.socketHandler.activeEngine && window.gameManager.socketHandler.activeEngine._handleMessage) {
            window.gameManager.socketHandler.activeEngine._handleMessage(msg);
        } else {
            console.error('Could not find activeEngine or _handleMessage');
        }
    });

    // Expect overlay to update with mocked values
    await expect(overlay).toContainText('Depth: 10', { timeout: 5000 });
    await expect(overlay).toContainText('Nodes: 1000');
    await expect(overlay).toContainText('NPS: 200000');

    // Disable overlay
    await debugCheckbox.uncheck({ force: true });
    await expect(overlay).not.toBeVisible();
  });

  test('Packet Inspector logs UCI commands', async ({ page }) => {
    const inspectorCheckbox = page.locator('#dev-packet-inspector');
    await expect(inspectorCheckbox).toBeAttached();
    await inspectorCheckbox.check({ force: true });

    const container = page.locator('#packet-inspector-container');
    await expect(container).toBeVisible();

    const log = page.locator('#packet-log');
    await expect(log).toBeVisible();

    // Click "Sanity Check" to send "verify"
    await page.locator('#sanity-check-btn').click({ force: true });

    // Wait for OUT log
    await expect(log).toContainText(/OUT: verify/, { timeout: 5000 });
  });

});
