const { test, expect } = require('./coverage')

test.describe('Info Modals & Links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#chessboard')
  })

  test('Changelog Modal', async ({ page }) => {
    await page.click('#changelog-btn')
    await expect(page.locator('#info-modal')).toBeVisible()
    await expect(page.locator('#info-modal-title')).toHaveText('Changelog')
    // Should contain some content from CHANGELOG.md (e.g. "Changelog")
    await expect(page.locator('#info-modal-content')).toContainText('Changelog')
    await page.click('#close-info-modal')
    await expect(page.locator('#info-modal')).toBeHidden()
  })

  test('License Modal', async ({ page }) => {
    await page.click('#license-btn')
    await expect(page.locator('#info-modal')).toBeVisible()
    await expect(page.locator('#info-modal-title')).toHaveText('License')
    // Should contain "MIT" or similar if standard
    await expect(page.locator('#info-modal-content')).not.toBeEmpty()
    await page.click('#close-info-modal')
  })

  test('Credits Modal', async ({ page }) => {
    await page.click('#credits-btn')
    await expect(page.locator('#info-modal')).toBeVisible()
    await expect(page.locator('#info-modal-title')).toHaveText('Credits')
    await expect(page.locator('#info-modal-content')).toContainText('NurdWerks')
    await page.click('#close-info-modal')
  })

  test('Shortcuts Modal', async ({ page }) => {
    await page.click('#shortcuts-btn')
    await expect(page.locator('#info-modal')).toBeVisible()
    await expect(page.locator('#info-modal-title')).toHaveText('Shortcuts')
    await expect(page.locator('#info-modal-content')).toContainText('Arrow Left')
    await page.click('#close-info-modal')
  })

  test('External Links (Sponsor/Feedback)', async ({ page, context }) => {
    // We catch the new page popup
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('#sponsor-btn')
    ])
    expect(newPage.url()).toContain('github.com')
    await newPage.close()
  })
})
