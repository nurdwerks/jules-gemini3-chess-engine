const { test, expect } = require('./coverage')

test('Guest user restricted features', async ({ page }) => {
  const sessionCheck = page.waitForResponse(resp => resp.url().includes('/api/user/me')).catch(() => {});
  await page.goto('/')
  await sessionCheck;

  // Click "Play as Guest"
  await expect(async () => {
      const modal = page.locator('#auth-modal')
      if (await modal.isVisible()) {
          const guestBtn = page.locator('#btn-guest')
          if (await guestBtn.isVisible()) {
              await guestBtn.click()
          }
      }
      await expect(modal).not.toBeVisible()
  }).toPass({ timeout: 10000 })

  // Verify panels are hidden
  await expect(page.locator('.uci-options-panel')).toBeHidden()
  await expect(page.locator('.search-stats-panel')).toBeHidden()
  await expect(page.locator('.engine-output-panel')).toBeHidden()
  await expect(page.locator('.developer-panel')).toBeHidden()
  await expect(page.locator('.graphs-panel')).toBeHidden()
  await expect(page.locator('.training-panel')).toBeHidden()
  await expect(page.locator('.opening-panel')).toBeHidden()

  // Verify controls
  await expect(page.locator('#force-move-btn')).toBeHidden()
  await expect(page.locator('#self-play-btn')).toBeHidden()
  await expect(page.locator('#engine-duel-btn')).toBeHidden()
  await expect(page.locator('#tournament-btn')).toBeHidden()
  await expect(page.locator('#leaderboard-btn')).toBeHidden()
  await expect(page.locator('#armageddon-btn')).toBeHidden()

  // Verify Analysis Mode checkbox is hidden or disabled
  await expect(page.locator('#analysis-mode').locator('xpath=..')).toBeHidden() // hiding the parent label container

  // Verify Game Mode options
  // PVE, PVP, Guess, Vote. PVE uses engine. Guess uses engine for analysis? Vote uses engine?
  // "Only allow PGN and Fen import and manipulation... Disable and hide all other features"
  // PvP is arguably "manipulation". PvE is engine.
  // The user said: "Disable and hide any functionality that would use the UCI engine"
  // So PVE is definitely out. PvP is fine. Guess The Move might use engine for evaluation?
  // "Guess the Move" mode compares user moves against history. If it uses engine to eval the move, it should be disabled.
  // Let's assume only PvP (local sandbox) is allowed if it doesn't use engine.
  // But wait, "Only allow PGN and Fen import and manipulation". Maybe PvP isn't even intended?
  // I will just hide the Game Mode selector entirely if only one mode is allowed (e.g. Sandbox/Analysis without engine).
  // Or maybe just leave "PvP" which effectively acts as a board.

  // Checking PGN Import is available
  await expect(page.locator('.import-export-panel')).toBeVisible()
  await expect(page.locator('#import-pgn-btn')).toBeVisible()
  await expect(page.locator('#fen-input')).toBeVisible()

  // Accessibility should be available
  await expect(page.locator('#accessibility-btn')).toBeVisible()
})
