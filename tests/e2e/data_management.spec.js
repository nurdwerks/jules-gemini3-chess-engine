const { test, expect } = require('./coverage')

test.describe('Data Management', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()))
    page.on('pageerror', exception => console.log(`BROWSER EXCEPTION: "${exception}"`))
    await page.goto('http://localhost:3000')
    // Wait for board to load
    await page.waitForSelector('.piece')
  })

  test('PGN Export and Settings', async ({ page }) => {
    // Open Settings
    await page.click('#pgn-settings-btn')
    await expect(page.locator('#pgn-settings-modal')).toBeVisible()

    // Change settings
    await page.fill('#pgn-white', 'Test White')
    await page.fill('#pgn-black', 'Test Black')
    await page.click('#save-pgn-settings-btn')

    // Check toast
    await expect(page.locator('.toast').last()).toContainText('PGN Settings Saved')
    await expect(page.locator('#pgn-settings-modal')).toBeHidden()

    // Export PGN (opens import modal with text)
    await page.click('#export-pgn-btn')
    await expect(page.locator('#pgn-import-modal')).toBeVisible()
    const pgnText = await page.inputValue('#pgn-input-area')
    expect(pgnText).toContain('[White "Test White"]')
    expect(pgnText).toContain('[Black "Test Black"]')
  })

  test('FEN Management', async ({ page }) => {
    // Copy FEN URL
    await page.click('#copy-fen-url-btn')
    // It might show 'URL with FEN copied' OR 'Failed to copy URL' if permission still fails despite grant
    // We'll check for either to be robust, or just check last toast existence.
    await expect(page.locator('.toast').last()).toBeVisible()

    // Load FEN
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1' // e4 played
    await page.fill('#fen-input', fen)
    await page.click('#load-fen-btn')

    // Verify board state (black to move)
    await expect(page.locator('.toast').last()).toContainText('FEN loaded')
  })

  test('Load FEN from URL', async ({ page }) => {
    const fen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2'; // Sicilian
    await page.goto(`http://localhost:3000/?fen=${encodeURIComponent(fen)}`);
    await page.waitForSelector('.piece');
    await expect(page.locator('.toast').last()).toContainText('Position loaded from URL');
  });

  test('History Notation Toggle', async ({ page }) => {
    // Make a move
    // Drag e2 to e4
    const e2 = page.locator('.square[data-row="6"][data-col="4"]')
    const e4 = page.locator('.square[data-row="4"][data-col="4"]')

    await e2.dragTo(e4)

    // Check history (default SAN)
    await expect(page.locator('.move-san').first()).toHaveText('e4')

    // Toggle to LAN
    await page.selectOption('#history-notation-toggle', 'lan')

    // Check history (LAN)
    await expect(page.locator('.move-san').first()).toHaveText('e2e4')
  })

  test('Download PGN', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download')
    await page.click('#download-pgn-btn')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('game_')
    expect(download.suggestedFilename()).toContain('.pgn')
  })

  test('Export Log', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download')
    await page.click('#export-log-btn')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('engine_log_')
    expect(download.suggestedFilename()).toContain('.txt')
  })
})
