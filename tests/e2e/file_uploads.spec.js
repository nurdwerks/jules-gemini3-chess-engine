const { test, expect } = require('./coverage')
const path = require('path')

test.describe('File Uploads', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')

    // Handle auth modal
    const guestBtn = page.locator('#btn-guest')
    if (await guestBtn.isVisible()) {
      await guestBtn.click()
    }

    await page.waitForSelector('#chessboard')
  })

  test('Upload User Avatar', async ({ page }) => {
    // We need a dummy image file.
    // Since we are in browser env via playwright, we can generate a buffer.
    const buffer = Buffer.from('fake image data')

    // Trigger upload
    await page.setInputFiles('#upload-user-avatar', {
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: buffer
    })

    // Verify toast
    const toast = page.locator('.toast')
    await expect(toast).toBeVisible()
    await expect(toast).toContainText('User avatar updated')

    // Verify localStorage was updated (requires evaluate)
    const stored = await page.evaluate(() => localStorage.getItem('user-avatar'))
    expect(stored).toBeTruthy()
    expect(stored).toContain('data:image/png;base64')
  })

  test('Upload Engine Avatar', async ({ page }) => {
     const buffer = Buffer.from('fake engine image')

     await page.setInputFiles('#upload-engine-avatar', {
       name: 'engine.png',
       mimeType: 'image/png',
       buffer: buffer
     })

     const toast = page.locator('.toast')
     await expect(toast).toBeVisible()
     await expect(toast).toContainText('Engine avatar updated')

     const stored = await page.evaluate(() => localStorage.getItem('engine-avatar'))
     expect(stored).toBeTruthy()
  })
})
