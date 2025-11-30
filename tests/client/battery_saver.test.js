const BatterySaver = require('../../public/js/BatterySaver')

describe('BatterySaver', () => {
  let batterySaver
  let mockSelect
  let mockCheckbox

  beforeEach(() => {
    mockSelect = document.createElement('select')
    ;['0', '200', '500'].forEach(val => {
      const opt = document.createElement('option')
      opt.value = val
      mockSelect.appendChild(opt)
    })
    mockSelect.value = '200'
    mockSelect.dispatchEvent = jest.fn()

    mockCheckbox = document.createElement('input')
    mockCheckbox.type = 'checkbox'
    mockCheckbox.checked = false
    mockCheckbox.addEventListener = jest.fn() // Spy on addEventListener

    jest.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (id === 'battery-saver') return mockCheckbox
      if (id === 'animation-speed') return mockSelect
      return null
    })

    // Mock navigator.getBattery
    global.navigator.getBattery = jest.fn().mockResolvedValue({
      charging: true,
      level: 1.0,
      addEventListener: jest.fn()
    })

    batterySaver = new BatterySaver({})
  })

  afterEach(() => {
    jest.restoreAllMocks()
    document.body.className = ''
  })

  test('should initialize and bind events', () => {
    batterySaver.init()
    expect(mockCheckbox.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  test('should toggle battery saver mode on', () => {
    batterySaver.toggle(true)
    expect(document.body.classList.contains('battery-saver')).toBe(true)
    expect(mockSelect.value).toBe('0')
    expect(mockSelect.disabled).toBe(true)
    expect(mockSelect.dispatchEvent).toHaveBeenCalled()
  })

  test('should toggle battery saver mode off and restore speed', () => {
    batterySaver.savedSpeed = '500'
    batterySaver.toggle(false)
    expect(document.body.classList.contains('battery-saver')).toBe(false)
    expect(mockSelect.value).toBe('500')
    expect(mockSelect.disabled).toBe(false)
  })
})
