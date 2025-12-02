const { test, expect } = require('./coverage')

test.describe('Authentication - Multiple Users & Sessions', () => {

  // Helper to setup CDP for a page
  async function setupWebAuthn(page) {
    const client = await page.context().newCDPSession(page)
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
    return client
  }

  test('Multiple distinct users can register and login sequentially', async ({ page }) => {
    // Unroute default mocks to hit real server
    await page.unroute('**/api/user/me')
    await page.unroute('**/api/user/data')

    const client = await setupWebAuthn(page)

    await page.goto('/')
    const authModal = page.locator('#auth-modal')
    await expect(authModal).toBeVisible()

    const user1 = `user_A_${Date.now()}`
    const user2 = `user_B_${Date.now()}`

    // 1. Register User 1
    await page.fill('#auth-username', user1)
    await page.click('#btn-register')
    await expect(page.locator('body')).toContainText(`@${user1}`)
    await expect(authModal).not.toBeVisible()

    // 2. Logout User 1
    await page.click('#btn-logout')
    // Wait for modal to reappear
    await expect(authModal).toBeVisible()

    // 3. Register User 2
    await page.fill('#auth-username', user2)
    await page.click('#btn-register')
    await expect(page.locator('body')).toContainText(`@${user2}`)
    await expect(authModal).not.toBeVisible()

    // 4. Logout User 2
    await page.click('#btn-logout')
    await expect(authModal).toBeVisible()

    // 5. Login User 1
    await page.fill('#auth-username', user1)
    await page.click('#btn-login')
    await expect(page.locator('body')).toContainText(`@${user1}`)
    await expect(authModal).not.toBeVisible()

    // 6. Logout User 1
    await page.click('#btn-logout')
    await expect(authModal).toBeVisible()

    // 7. Login User 2
    await page.fill('#auth-username', user2)
    await page.click('#btn-login')
    await expect(page.locator('body')).toContainText(`@${user2}`)

    // Cleanup
    await client.send('WebAuthn.disable')
    await client.detach()
  })

  test('Same user can login from multiple contexts (simulated devices)', async ({ browser }) => {
    // Context 1 simulates Device A
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()
    // Unroute mocks
    await page1.unroute('**/api/user/me')
    await page1.unroute('**/api/user/data')

    const client1 = await setupWebAuthn(page1)

    // Context 2 simulates Device B
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()
    // Unroute mocks
    await page2.unroute('**/api/user/me')
    await page2.unroute('**/api/user/data')

    const client2 = await setupWebAuthn(page2)

    const username = `multi_device_${Date.now()}`

    // 1. Register on Device A
    await page1.goto('/')
    await expect(page1.locator('#auth-modal')).toBeVisible()
    await page1.fill('#auth-username', username)
    await page1.click('#btn-register')
    await expect(page1.locator('body')).toContainText(`@${username}`)

    // 2. Register on Device B (Adding second credential for same user)
    // In this app, "Register" for an existing user acts as adding a new credential
    await page2.goto('/')
    await expect(page2.locator('#auth-modal')).toBeVisible()
    await page2.fill('#auth-username', username)
    await page2.click('#btn-register')
    await expect(page2.locator('body')).toContainText(`@${username}`)

    // 3. Verify Login on Device A (Logout first to prove we can log back in)
    await page1.click('#btn-logout')
    await expect(page1.locator('#auth-modal')).toBeVisible()
    await page1.fill('#auth-username', username)
    await page1.click('#btn-login')
    await expect(page1.locator('body')).toContainText(`@${username}`)

    // 4. Verify Login on Device B (Logout first)
    await page2.click('#btn-logout')
    await expect(page2.locator('#auth-modal')).toBeVisible()
    await page2.fill('#auth-username', username)
    await page2.click('#btn-login')
    await expect(page2.locator('body')).toContainText(`@${username}`)

    // Cleanup
    await client1.send('WebAuthn.disable')
    await client1.detach()
    await client2.send('WebAuthn.disable')
    await client2.detach()
    await context1.close()
    await context2.close()
  })
})
