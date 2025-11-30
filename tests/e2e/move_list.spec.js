const { test, expect } = require('./coverage')

test.describe('Move List & Annotation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Move list renders moves', async ({ page }) => {
    // Play moves
    await page.evaluate(() => window.gameManager.performMove({ from: 'e2', to: 'e4' }))
    await page.evaluate(() => window.gameManager.performMove({ from: 'e7', to: 'e5' }))

    // Check list
    const history = page.locator('#move-history')
    await expect(history).toContainText('1.')
    await expect(history).toContainText('e4')
    await expect(history).toContainText('e5')
  })

  test('Filter input filters moves', async ({ page }) => {
    await page.evaluate(() => window.gameManager.performMove({ from: 'e2', to: 'e4' })) // 1. e4
    await page.evaluate(() => window.gameManager.performMove({ from: 'e7', to: 'e5' }))
    await page.evaluate(() => window.gameManager.performMove({ from: 'g1', to: 'f3' })) // 2. Nf3

    await expect(page.locator('#move-history .move-san').first()).toBeVisible()

    // Type 'Nf3'
    await page.fill('#history-search-input', 'Nf3')

    // e4 e5 (row 1) should be hidden?
    // My implementation:
    // const text = `${moveNum}. ${whiteSan} ${blackSan}`.toLowerCase()
    // if (!text.includes(this.filterText)) continue (don't create row)

    // Row 1: "1. e4 e5" -> does not contain "nf3"
    // Row 2: "2. Nf3" -> contains "nf3"

    // So row 1 should not exist in DOM or contain text?
    // My implementation clears container and rebuilds.

    const rows = page.locator('.history-row')
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText('Nf3')
  })

  test('Opening Explorer toggle', async ({ page }) => {
    await page.click('button:has-text("Training")') // Ensure panel is open? No, it's open by default?
    // Actually Training panel is collapsible? No, it's a sidebar panel.
    // Button is #opening-explorer-btn

    await page.click('#opening-explorer-btn')
    await expect(page.locator('#opening-panel')).toBeVisible()

    // Close
    await page.click('#close-opening-panel-btn')
    await expect(page.locator('#opening-panel')).toBeHidden()
  })

  test('Variation Tree button', async ({ page }) => {
    // It's in Search Stats panel
    await page.click('#show-tree-btn')
    // It sends debug_tree and waits.
    // We can't easily verify the tree without backend generating it quickly.
    // But we can check if toast appears.
    await expect(page.locator('.toast').filter({ hasText: 'Generating Search Tree' })).toBeVisible()
  })
})
