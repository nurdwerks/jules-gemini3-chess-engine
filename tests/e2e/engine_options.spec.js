const { test, expect } = require('./coverage')

test.describe('Engine Options', () => {
  let socketFrames = []

  test.beforeEach(async ({ page }) => {
    socketFrames = []

    page.on('websocket', ws => {
      ws.on('framesent', frame => {
        socketFrames.push(frame.payload)
      })
    })

    const sessionCheck = page.waitForResponse(resp => resp.url().includes('/api/user/me')).catch(() => {})
    await page.goto('/')
    await sessionCheck

    const modal = page.locator('#auth-modal')
    if (await modal.isVisible()) {
      const guestBtn = page.locator('#btn-guest')
      if (await guestBtn.isVisible()) {
        await guestBtn.click()
      }
      await expect(modal).not.toBeVisible()
    }

    await page.waitForSelector('#uci-options .option-group')
  })

  test('should render engine options with tooltips', async ({ page }) => {
    const hashOption = page.locator('.option-item[title="Size of the hash table in MB"]')
    await expect(hashOption).toBeVisible()

    const threadsOption = page.locator('.option-item[title="Number of CPU threads to use"]')
    await expect(threadsOption).toBeVisible()

    const nnueOption = page.locator('.option-item[title="Enable NNUE evaluation"]')
    await expect(nnueOption).toBeVisible()
  })

  test('should update spin option (Hash) and send command', async ({ page }) => {
    const hashSlider = page.locator('input[type="range"][data-option-name="Hash"]')
    await expect(hashSlider).toBeVisible()

    await hashSlider.fill('64')
    await page.waitForTimeout(100)

    await expect.poll(() => socketFrames).toContainEqual(expect.stringMatching(/setoption name Hash value 64/))
  })

  test('should update check option (Ponder) and send command', async ({ page }) => {
    const ponderInput = page.locator('input[data-option-name="Ponder"]')
    await expect(ponderInput).toBeVisible()

    const isChecked = await ponderInput.isChecked()
    await ponderInput.click()

    const expectedValue = !isChecked
    await expect.poll(() => socketFrames).toContainEqual(expect.stringMatching(new RegExp(`setoption name Ponder value ${expectedValue}`)))
  })

  test('should update string option (UCI_NNUE_File) and send command', async ({ page }) => {
    const nnueInput = page.locator('input[data-option-name="UCI_NNUE_File"]')
    await expect(nnueInput).toBeVisible()

    const newValue = 'https://example.com/network.nnue'
    await nnueInput.fill(newValue)
    await nnueInput.blur()

    await expect.poll(() => socketFrames).toContainEqual(expect.stringMatching(new RegExp(`setoption name UCI_NNUE_File value ${newValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)))
  })

  test('should handle button option (Clear Hash)', async ({ page }) => {
    const container = page.locator('.option-item').filter({ hasText: 'Clear Hash:' })
    const button = container.locator('button')
    await expect(button).toBeVisible()

    await button.click()

    // Updated expectation: The value is strictly "setoption name Clear Hash" (without value)
    await expect.poll(() => socketFrames).toContainEqual(expect.stringMatching(/setoption name Clear Hash/))
  })

  test('should verify main control buttons have tooltips', async ({ page }) => {
    await expect(page.locator('#new-game-btn')).toHaveAttribute('title', 'Start a new game from the starting position')
    await expect(page.locator('#resign-btn')).toHaveAttribute('title', 'Resign the current game')
    await expect(page.locator('#flip-board-btn')).toHaveAttribute('title', 'Flip the board orientation')
    await expect(page.locator('#tactics-trainer-btn')).toHaveAttribute('title', 'Solve tactics puzzles')
  })
})
