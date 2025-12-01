const { test: base, expect } = require('@playwright/test')
const fs = require('fs')
const path = require('path')
const v8toIstanbul = require('v8-to-istanbul')

const test = base.extend({
  page: async ({ page }, use) => {
    // Mock Auth to bypass modal
    await page.route('**/api/user/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          loggedIn: true,
          user: {
            username: 'testuser',
            displayName: 'Test User',
            role: 'user'
          }
        })
      })
    })

    await page.route('**/api/user/data', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      })
    })

    // Start coverage
    await page.coverage.startJSCoverage({
      resetOnNavigation: false
    })

    await use(page)

    // Stop coverage
    const coverage = await page.coverage.stopJSCoverage()

    // Process coverage
    const baseUrl = page.context().request._initializer.baseURL || 'http://localhost:3000'
    for (const entry of coverage) {
      // Filter out external libs and non-project files
      if (entry.url.includes('/libs/') || !entry.url.startsWith(baseUrl)) {
        continue
      }

      // We need to map the URL to the file path
      const urlPath = new URL(entry.url).pathname
      const scriptPath = path.join(__dirname, '../../public', urlPath)

      if (fs.existsSync(scriptPath)) {
        const stats = fs.statSync(scriptPath)
        if (!stats.isFile()) continue

        const converter = v8toIstanbul(scriptPath)
        await converter.load()
        converter.applyCoverage(entry.functions)
        const istanbulCoverage = converter.toIstanbul()

        // Save to .nyc_output
        const coverageDir = path.join(__dirname, '../../.nyc_output')
        fs.mkdirSync(coverageDir, { recursive: true })

        // Generate unique filename
        const id = Math.random().toString(36).substring(2, 15)
        fs.writeFileSync(
          path.join(coverageDir, `coverage-${id}.json`),
          JSON.stringify(istanbulCoverage)
        )
      }
    }
  }
})

module.exports = { test, expect }
