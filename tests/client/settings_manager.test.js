/* eslint-env jest */
/* global localStorage */
const SettingsManager = require('../../public/js/SettingsManager.js')

describe('SettingsManager', () => {
  let settingsManager
  let mockUiManager
  let mockSoundManager
  let mockAccessibilityManager

  beforeEach(() => {
    jest.useFakeTimers()
    mockUiManager = {
      showToast: jest.fn()
    }
    mockSoundManager = {
      setEnabled: jest.fn(),
      setVolume: jest.fn(),
      loadSoundPack: jest.fn().mockResolvedValue(5)
    }
    mockAccessibilityManager = {
      setVoiceAnnounce: jest.fn(),
      setVoiceControl: jest.fn()
    }

    // Mock DOM elements
    document.body.innerHTML = `
      <button id="export-settings-btn"></button>
      <button id="import-settings-btn"></button>
      <input type="file" id="import-settings-file">
      <button id="factory-reset-btn"></button>
      <input type="checkbox" id="sound-enabled">
      <input type="range" id="volume-control">
      <input type="checkbox" id="voice-announce">
      <input type="checkbox" id="voice-control">
      <input type="checkbox" id="high-contrast">
      <input type="file" id="sound-pack-upload">
    `

    // Mock URL and Blob
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:test')
    global.URL.revokeObjectURL = jest.fn()
    global.Blob = class {
      constructor (content, options) {
        this.content = content
        this.options = options
      }
    }

    // Mock FileReader
    global.FileReader = class {
      readAsText (file) {
        this.onload({ target: { result: JSON.stringify({ test: 'value' }) } })
      }
    }

    // Mock Window methods
    delete window.location
    window.location = { reload: jest.fn() }
    window.confirm = jest.fn(() => true)

    // Mock anchor click to prevent navigation error in JSDOM
    const originalCreateElement = document.createElement.bind(document)
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const el = originalCreateElement(tagName)
      if (tagName === 'a') {
        el.click = jest.fn()
      }
      return el
    })

    settingsManager = new SettingsManager(mockUiManager, mockSoundManager, mockAccessibilityManager)
  })

  afterEach(() => {
    localStorage.clear()
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  test('should bind events correctly', () => {
    // Simulate click
    const exportBtn = document.getElementById('export-settings-btn')
    exportBtn.click()
    expect(mockUiManager.showToast).toHaveBeenCalledWith('Settings exported', 'success')
  })

  test('exportSettings should save to file', () => {
    localStorage.setItem('foo', 'bar')
    settingsManager.exportSettings()

    expect(global.URL.createObjectURL).toHaveBeenCalled()
    expect(mockUiManager.showToast).toHaveBeenCalledWith('Settings exported', 'success')
  })

  test('importSettings should load from file', () => {
    const file = new Blob(['{"foo":"bar"}'], { type: 'application/json' })
    settingsManager.importSettings(file)

    // FileReader mock calls onload immediately

    // Advance timers for reload
    expect(window.location.reload).not.toHaveBeenCalled()
    jest.runAllTimers()

    expect(localStorage.getItem('test')).toBe('value')
    expect(mockUiManager.showToast).toHaveBeenCalledWith(expect.stringContaining('imported'), 'success')
    expect(window.location.reload).toHaveBeenCalled()
  })

  test('factoryReset should clear localStorage', () => {
    localStorage.setItem('foo', 'bar')
    settingsManager.factoryReset()
    expect(window.confirm).toHaveBeenCalled()
    expect(localStorage.length).toBe(0)
    expect(mockUiManager.showToast).toHaveBeenCalledWith(expect.stringContaining('reset'), 'success')

    jest.runAllTimers()
    expect(window.location.reload).toHaveBeenCalled()
  })

  test('Accessibility controls', () => {
    const cb = document.getElementById('high-contrast')
    cb.checked = true
    cb.dispatchEvent(new Event('change'))
    expect(document.body.classList.contains('high-contrast')).toBe(true)

    cb.checked = false
    cb.dispatchEvent(new Event('change'))
    expect(document.body.classList.contains('high-contrast')).toBe(false)
  })
})
