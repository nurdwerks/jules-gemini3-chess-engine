/**
 * @jest-environment jsdom
 */

const VisualEffects = require('../../public/js/VisualEffects.js')

describe('VisualEffects', () => {
  let visualEffects
  let mockUiManager
  let mockCtx

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="confetti-canvas"></canvas>
      <div id="chessboard"></div>
      <input type="checkbox" id="mind-control-mode">
    `

    mockCtx = {
      clearRect: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      fillRect: jest.fn()
    }

    const canvas = document.getElementById('confetti-canvas')
    canvas.getContext = jest.fn().mockReturnValue(mockCtx)

    mockUiManager = {
      showToast: jest.fn()
    }

    global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 0))
    global.cancelAnimationFrame = jest.fn()

    visualEffects = new VisualEffects(mockUiManager)
  })

  test('should trigger shake', () => {
    visualEffects.triggerShake()
    const board = document.getElementById('chessboard')
    expect(board.classList.contains('shake')).toBe(true)
  })

  test('should start confetti', () => {
    visualEffects.startConfetti()
    const canvas = document.getElementById('confetti-canvas')
    expect(canvas.style.display).toBe('block')
    expect(mockCtx.clearRect).toHaveBeenCalled()
  })

  test('should handle mind control joke', () => {
    const cb = document.getElementById('mind-control-mode')
    cb.checked = true
    cb.dispatchEvent(new Event('change'))

    expect(mockUiManager.showToast).toHaveBeenCalledWith('Searching for EEG device...', 'info')

    // Fast-forward timeout
    jest.useFakeTimers()
    const cb2 = document.getElementById('mind-control-mode')
    cb2.checked = true
    cb2.dispatchEvent(new Event('change'))

    jest.runAllTimers()
    expect(mockUiManager.showToast).toHaveBeenCalledWith('No Neuralink found. Using fallback: Mouse.', 'warning')
    expect(cb2.checked).toBe(false)
    jest.useRealTimers()
  })
})
