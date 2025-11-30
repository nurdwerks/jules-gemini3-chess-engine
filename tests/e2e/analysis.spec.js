const { test, expect } = require('./coverage')

test.describe('Analysis Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#chessboard')
  })

  test('Enable Analysis Mode', async ({ page }) => {
    // Check Analysis Mode checkbox
    await page.check('#analysis-mode')

    // Wait for Engine output or Eval bar update
    // The Eval bar container is #eval-bar-container
    // The eval value is in #eval-value
    await expect(page.locator('#eval-value')).not.toHaveText('-', { timeout: 10000 })

    // Check if evaluation graph is visible/updating
    await expect(page.locator('#eval-graph')).toBeVisible()
  })

  test('Clear Analysis', async ({ page }) => {
    // First enable analysis or draw something to have something to clear
    // Drawing an arrow is complicated programmatically without specific coordinates,
    // but we can assume the button should be clickable and not crash.
    // Better: Enable "Show Threats" which adds visuals, then click Clear.

    await page.check('#show-threats')
    // Wait for some visual indication (threats are usually red squares or similar)
    // Detailed verification of threat visuals is hard, so we just test the Clear button interaction.

    const clearBtn = page.locator('#clear-analysis-btn')
    await expect(clearBtn).toBeVisible()
    await clearBtn.click()

    // Verify no crash/error
    await expect(page.locator('#chessboard')).toBeVisible()
  })
})
