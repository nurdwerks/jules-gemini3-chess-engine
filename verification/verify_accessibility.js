const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto('http://localhost:3000')

  // Wait for sidebar
  await page.waitForSelector('.sidebar', { state: 'visible' })

  // Check High Contrast Mode
  await page.check('#high-contrast')
  await page.waitForTimeout(500) // Wait for style application
  await page.screenshot({ path: 'verification/high_contrast_mode.png', fullPage: true })

  console.log('Screenshot taken: verification/high_contrast_mode.png')

  await browser.close()
})()
