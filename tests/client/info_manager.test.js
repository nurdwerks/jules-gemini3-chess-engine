/**
 * @jest-environment jsdom
 */

const InfoManager = require('../../public/js/InfoManager.js')

describe('InfoManager', () => {
  let infoManager
  let mockUiManager

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="info-modal">
        <h3 id="info-modal-title"></h3>
        <div id="info-modal-content"></div>
        <button id="close-info-modal"></button>
      </div>
      <button id="changelog-btn"></button>
      <button id="license-btn"></button>
      <button id="credits-btn"></button>
      <button id="shortcuts-btn"></button>
      <button id="sponsor-btn"></button>
      <button id="feedback-btn"></button>
    `

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('Mock Content')
      })
    )

    // Mock window.open
    global.window.open = jest.fn()

    mockUiManager = {}
    infoManager = new InfoManager(mockUiManager)
  })

  test('should open modal with content', () => {
    infoManager.open('Test Title', 'Test Content')
    const modal = document.getElementById('info-modal')
    expect(modal.classList.contains('active')).toBe(true)
    expect(document.getElementById('info-modal-title').textContent).toBe('Test Title')
    expect(document.getElementById('info-modal-content').innerHTML).toBe('Test Content')
  })

  test('should close modal', () => {
    infoManager.open('Title', 'Content')
    infoManager.close()
    const modal = document.getElementById('info-modal')
    expect(modal.classList.contains('active')).toBe(false)
  })

  test('should fetch and show changelog', async () => {
    await infoManager.showChangelog()
    expect(global.fetch).toHaveBeenCalledWith('/changelog')
    expect(document.getElementById('info-modal-title').textContent).toBe('Changelog')
    expect(document.getElementById('info-modal-content').innerHTML).toBe('Mock Content')
  })

  test('should fetch and show license', async () => {
    await infoManager.showLicense()
    expect(global.fetch).toHaveBeenCalledWith('/license')
    expect(document.getElementById('info-modal-title').textContent).toBe('License')
  })

  test('should show credits', () => {
    infoManager.showCredits()
    expect(document.getElementById('info-modal-title').textContent).toBe('Credits')
    expect(document.getElementById('info-modal-content').textContent).toContain('Jules & Gemini')
  })

  test('should show shortcuts', () => {
    infoManager.showShortcuts()
    expect(document.getElementById('info-modal-title').textContent).toBe('Shortcuts')
    expect(document.getElementById('info-modal-content').innerHTML).toContain('Keyboard Shortcuts')
  })

  test('should open external links', () => {
    document.getElementById('sponsor-btn').click()
    expect(global.window.open).toHaveBeenCalledWith('https://github.com/sponsors', '_blank')

    document.getElementById('feedback-btn').click()
    expect(global.window.open).toHaveBeenCalledWith('https://github.com/jules-gemini/chess-engine/issues', '_blank')
  })
})
