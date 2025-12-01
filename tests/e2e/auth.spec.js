const { test, expect } = require('./coverage')

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Unroute the mocks from coverage.js to hit the real server
    await page.unroute('**/api/user/me')
    await page.unroute('**/api/user/data')

    // Mock SimpleWebAuthnBrowser library
    await page.route('**/libs/simplewebauthn-browser.min.js', route => {
        route.fulfill({
            status: 200,
            contentType: 'application/javascript',
            body: `
                window.SimpleWebAuthnBrowser = {
                    startRegistration: async () => ({ mockVerification: true }),
                    startAuthentication: async () => ({ mockVerification: true })
                }
            `
        })
    })
  })

  test('should allow a user to register and logout with WebAuthn (Mocked)', async ({ page }) => {
    await page.goto('/')

    const authModal = page.locator('#auth-modal')
    await expect(authModal).toBeVisible({ timeout: 10000 })

    // 2. Register
    const username = `user_${Date.now()}`
    console.log(`Registering: ${username}`)
    await page.fill('#auth-username', username)
    await page.click('#btn-register')

    // Wait for "Logged In" state
    await expect(page.locator('body')).toContainText(`@${username}`, { timeout: 20000 })
    await expect(authModal).not.toBeVisible()

    // 4. Logout
    console.log('Logging out')
    await page.click('#btn-logout')

    // Wait for "Guest" state (Modal appears)
    await expect(authModal).toBeVisible({ timeout: 20000 })
  })

  test('should handle invalid login attempts', async ({ page }) => {
    await page.goto('/')
    const authModal = page.locator('#auth-modal')
    await expect(authModal).toBeVisible()

    // 2. Try to login with non-existent user
    await page.fill('#auth-username', 'non_existent_user')
    await page.click('#btn-login')

    // 3. Verify error message
    await expect(page.locator('#auth-status')).toContainText('Error: User not found')
  })
})
