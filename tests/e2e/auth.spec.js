const { test, expect } = require('./coverage')

test.describe('Authentication Flow (CDP)', () => {
  let client

  test.beforeEach(async ({ page }) => {
    // Unroute the mocks from coverage.js to hit the real server
    await page.unroute('**/api/user/me')
    await page.unroute('**/api/user/data')

    // Initialize CDP Session
    client = await page.context().newCDPSession(page)
    await client.send('WebAuthn.enable')
    await client.send('WebAuthn.addVirtualAuthenticator', {
      options: {
        protocol: 'ctap2',
        transport: 'internal',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true
      }
    })
  })

  test.afterEach(async () => {
    if (client) {
      await client.send('WebAuthn.disable')
      await client.detach()
    }
  })

  test('Registration and Login Success Flow', async ({ page }) => {
    await page.goto('/')

    const authModal = page.locator('#auth-modal')
    await expect(authModal).toBeVisible()

    const username = `cdp_user_${Date.now()}`

    // 1. Register Success
    await page.fill('#auth-username', username)
    await page.click('#btn-register')

    // Expect to be logged in (checking for username in UI)
    await expect(page.locator('body')).toContainText(`@${username}`)
    await expect(authModal).not.toBeVisible()

    // 2. Logout
    await page.click('#btn-logout')
    // Wait for page reload/modal appearance
    await expect(authModal).toBeVisible()

    // 3. Login Success
    await page.fill('#auth-username', username)
    await page.click('#btn-login')

    // Expect to be logged in again
    await expect(page.locator('body')).toContainText(`@${username}`)
    await expect(authModal).not.toBeVisible()
  })

  test('Login Failure (User not found)', async ({ page }) => {
    await page.goto('/')
    const authModal = page.locator('#auth-modal')
    await expect(authModal).toBeVisible()

    const username = `non_existent_user_${Date.now()}`
    await page.fill('#auth-username', username)
    await page.click('#btn-login')

    // Expect error message
    await expect(page.locator('#auth-status')).toContainText('Error: User not found')
    // Modal should still be visible
    await expect(authModal).toBeVisible()
  })

  test('Registration Failure (Empty Username)', async ({ page }) => {
    await page.goto('/')
    const authModal = page.locator('#auth-modal')
    await expect(authModal).toBeVisible()

    // Leave username empty
    await page.fill('#auth-username', '')
    await page.click('#btn-register')

    // Expect validation error
    await expect(page.locator('#auth-status')).toContainText('Please enter a username')
    // Modal should still be visible
    await expect(authModal).toBeVisible()
  })
})
