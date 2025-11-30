/**
 * @jest-environment jsdom
 */

const BatterySaver = require('../../public/js/BatterySaver.js')

describe('BatterySaver', () => {
  let batterySaver
  let mockUiManager
  let mockBattery

  beforeEach(() => {
    document.body.innerHTML = `
      <select id="animation-speed">
        <option value="0">Instant</option>
        <option value="200" selected>Fast</option>
      </select>
    `

    mockUiManager = {
      showToast: jest.fn()
    }

    mockBattery = {
      charging: true,
      level: 1.0,
      addEventListener: jest.fn()
    }

    global.navigator.getBattery = jest.fn(() => Promise.resolve(mockBattery))

    batterySaver = new BatterySaver(mockUiManager)
  })

  test('should initialize and listen to events', async () => {
    await batterySaver.init()
    expect(global.navigator.getBattery).toHaveBeenCalled()
    expect(mockBattery.addEventListener).toHaveBeenCalledWith('chargingchange', expect.any(Function))
    expect(mockBattery.addEventListener).toHaveBeenCalledWith('levelchange', expect.any(Function))
  })

  test('should enable power save when battery low', async () => {
    await batterySaver.init()

    // Simulate low battery
    mockBattery.charging = false
    mockBattery.level = 0.15
    batterySaver.updateStatus(mockBattery)

    expect(batterySaver.isLowPower).toBe(true)
    expect(mockUiManager.showToast).toHaveBeenCalledWith(expect.stringContaining('Low Battery'), 'warning')
    expect(document.getElementById('animation-speed').value).toBe('0')
    expect(document.body.classList.contains('power-save')).toBe(true)
  })

  test('should disable power save when charging', async () => {
    await batterySaver.init()

    // First enable it
    mockBattery.charging = false
    mockBattery.level = 0.15
    batterySaver.updateStatus(mockBattery)

    // Then plug in
    mockBattery.charging = true
    batterySaver.updateStatus(mockBattery)

    expect(batterySaver.isLowPower).toBe(false)
    expect(mockUiManager.showToast).toHaveBeenCalledWith(expect.stringContaining('Power Restored'), 'success')
    expect(document.getElementById('animation-speed').value).toBe('200') // Restored to saved value
    expect(document.body.classList.contains('power-save')).toBe(false)
  })
})
