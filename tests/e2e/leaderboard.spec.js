const { test, expect } = require('./coverage')

test('Leaderboard Functionality', async ({ page }) => {
  const sessionCheck = page.waitForResponse(resp => resp.url().includes('/api/user/me')).catch(() => {});
  await page.goto('/')
  await sessionCheck;

  // Clear existing data
  await page.evaluate(() => {
      localStorage.removeItem('engine-leaderboard')
  })

  // Nuclear Option
  await page.evaluate(() => {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.remove();
  });

  // Open Leaderboard Modal
  await page.click('#leaderboard-btn')
  await expect(page.locator('#leaderboard-modal')).toBeVisible()

  // Initially empty (header row only? or logic check)
  // Our rendering logic: table.innerHTML = ''; then append trs.
  // So tbody should have 0 rows.
  const rows = await page.locator('#leaderboard-table tbody tr').count()
  expect(rows).toBe(0)

  await page.click('#close-leaderboard-modal', { force: true })
  await expect(page.locator('#leaderboard-modal')).not.toBeVisible()

  // Inject data
  await page.evaluate(() => {
    const data = {
      'Engine A': { w: 2, d: 1, l: 0 },
      'Engine B': { w: 0, d: 1, l: 2 }
    }
    localStorage.setItem('engine-leaderboard', JSON.stringify(data))

    // Trigger render not needed if we re-open, but we can verify exposure
    if (window.leaderboardManager) {
        // window.leaderboardManager.renderLeaderboard()
    }
  })

  // Reopen and check data
  await page.click('#leaderboard-btn')
  await expect(page.locator('#leaderboard-modal')).toBeVisible()

  const firstRow = page.locator('#leaderboard-table tbody tr').first()
  await expect(firstRow).toContainText('Engine A')
  await expect(firstRow.locator('td').nth(0)).toHaveText('Engine A')
  await expect(firstRow.locator('td').nth(1)).toHaveText('3') // Games
  await expect(firstRow.locator('td').nth(2)).toHaveText('2') // W
  await expect(firstRow.locator('td').nth(3)).toHaveText('1') // D
  await expect(firstRow.locator('td').nth(4)).toHaveText('0') // L
  await expect(firstRow.locator('td').nth(5)).toHaveText('83.3%') // Pct

  const secondRow = page.locator('#leaderboard-table tbody tr').nth(1)
  await expect(secondRow.locator('td').nth(0)).toHaveText('Engine B')
  await expect(secondRow.locator('td').nth(5)).toHaveText('16.7%')
})
