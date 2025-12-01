const { test, expect } = require('./coverage')

test.describe('Vote Chess', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')

    // Handle auth modal
    const guestBtn = page.locator('#btn-guest')
    if (await guestBtn.isVisible()) {
      await guestBtn.click()
    }

    await page.waitForSelector('#chessboard')
  })

  test('Switch to Vote Chess and Receive Vote Result', async ({ page }) => {
    // Switch to Vote Chess Mode
    await page.selectOption('#game-mode', 'vote')

    // Verify Game Mode State
    const gameMode = await page.evaluate(() => window.gameManager.gameMode)
    expect(gameMode).toBe('vote')

    // Verify Toast appears when receiving a vote result
    // We simulate the socket message callback
    // window.gameManager.socketHandler is an EngineProxy
    // The real SocketHandler is activeEngine
    await page.evaluate(() => {
      const socket = window.gameManager.socketHandler.activeEngine || window.gameManager.socketHandler
      if (socket && socket.callbacks) {
          socket.callbacks.onVoteMessage({ type: 'vote_result', move: 'e2e4' })
      } else {
          throw new Error('GameManager or SocketHandler not initialized correctly')
      }
    })

    // Check for Toast Notification
    const toast = page.locator('.toast')
    await expect(toast).toBeVisible()
    await expect(toast).toContainText('Vote Result: e2e4')
  })
})
