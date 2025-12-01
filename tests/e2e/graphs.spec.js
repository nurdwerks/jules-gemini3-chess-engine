const { test, expect } = require('./coverage')

test('Graphs Visibility', async ({ page }) => {
  await page.goto('/')
  // Check tabs exist
  await expect(page.locator('.tab-btn[data-tab="material-chart"]')).toBeVisible()
  await expect(page.locator('.tab-btn[data-tab="time-chart"]')).toBeVisible()

  // Check material graph svg is visible (default active tab)
  await expect(page.locator('#material-graph')).toBeVisible()
})
