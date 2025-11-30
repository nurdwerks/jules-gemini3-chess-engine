const SettingsManager = require('../../public/js/SettingsManager')

describe('SettingsManager', () => {
  let settingsManager
  let uiManager
  let soundManager
  let accessibilityManager
  let mockLocalStorage
  let originalReload

  beforeEach(() => {
    // Mock UI Elements
    document.body.innerHTML = `
      <button id="export-settings-btn"></button>
      <button id="import-settings-btn"></button>
      <input type="file" id="import-settings-file">
      <button id="factory-reset-btn"></button>
      <input type="checkbox" id="sound-enabled">
      <input type="range" id="volume-control">
      <input type="file" id="sound-pack-upload">
      <input type="checkbox" id="high-contrast">
      <input type="checkbox" id="voice-announce">
      <input type="checkbox" id="voice-control">
    `

    // Mock Managers
    uiManager = {
      showToast: jest.fn()
    }
    soundManager = {
      setEnabled: jest.fn(),
      setVolume: jest.fn(),
      loadSoundPack: jest.fn().mockResolvedValue(10)
    }
    accessibilityManager = {
      setVoiceAnnounce: jest.fn(),
      setVoiceControl: jest.fn()
    }

    // Mock LocalStorage
    mockLocalStorage = {}

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => mockLocalStorage[key] || null),
        setItem: jest.fn((key, val) => { mockLocalStorage[key] = val }),
        clear: jest.fn(() => { mockLocalStorage = {} }),
        removeItem: jest.fn((key) => { delete mockLocalStorage[key] }),
        key: jest.fn((i) => Object.keys(mockLocalStorage)[i]),
        get length () { return Object.keys(mockLocalStorage).length }
      },
      writable: true
    })

    // Mock URL.createObjectURL and confirm
    global.URL.createObjectURL = jest.fn()
    global.URL.revokeObjectURL = jest.fn()
    global.confirm = jest.fn(() => true)

    // Mock window.location.reload
    originalReload = window.location.reload
    delete window.location
    window.location = { reload: jest.fn() }

    settingsManager = new SettingsManager(uiManager, soundManager, accessibilityManager)
  })

  afterEach(() => {
    window.location.reload = originalReload
  })

  test('should export settings', () => {
    mockLocalStorage.testKey = 'testValue'

    // Mock anchor click
    const clickMock = jest.fn()
    const anchorMock = {
      click: clickMock,
      href: '',
      download: ''
    }
    document.createElement = jest.fn((tag) => {
      if (tag === 'a') return anchorMock
      return document.constructor.prototype.createElement.call(document, tag)
    })
    document.body.appendChild = jest.fn()
    document.body.removeChild = jest.fn()

    settingsManager.exportSettings()

    expect(global.URL.createObjectURL).toHaveBeenCalled()
    expect(clickMock).toHaveBeenCalled()
    expect(uiManager.showToast).toHaveBeenCalledWith('Settings exported', 'success')
  })

  test('should factory reset', () => {
    mockLocalStorage.testKey = 'testValue'
    settingsManager.factoryReset()

    expect(window.localStorage.clear).toHaveBeenCalled()
    expect(uiManager.showToast).toHaveBeenCalledWith(expect.stringContaining('Settings reset'), 'success')

    jest.useFakeTimers()
    settingsManager.factoryReset()
    jest.advanceTimersByTime(1000)
    expect(window.location.reload).toHaveBeenCalled()
    jest.useRealTimers()
  })

  test('should bind sound events', () => {
    const checkbox = document.getElementById('sound-enabled')
    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change'))
    expect(soundManager.setEnabled).toHaveBeenCalledWith(true)

    const volume = document.getElementById('volume-control')
    volume.value = '0.5'
    volume.dispatchEvent(new Event('input'))
    expect(soundManager.setVolume).toHaveBeenCalledWith('0.5')
  })

  test('should bind accessibility events', () => {
    const highContrast = document.getElementById('high-contrast')
    highContrast.checked = true
    highContrast.dispatchEvent(new Event('change'))
    expect(document.body.classList.contains('high-contrast')).toBe(true)

    const voice = document.getElementById('voice-announce')
    voice.checked = true
    voice.dispatchEvent(new Event('change'))
    expect(accessibilityManager.setVoiceAnnounce).toHaveBeenCalledWith(true)
  })
})
