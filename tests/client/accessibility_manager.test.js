/**
 * @jest-environment jsdom
 */

/* global KeyboardEvent */

describe('AccessibilityManager', () => {
  let AccessibilityManager
  let mockGameManager
  let mockUiManager
  let mockRenderFn
  let mockSpeechSynthesis
  let mockRecognition

  beforeAll(() => {
    // Mock Speech API
    mockSpeechSynthesis = {
      speak: jest.fn(),
      getVoices: jest.fn().mockReturnValue([])
    }
    window.speechSynthesis = mockSpeechSynthesis
    window.SpeechSynthesisUtterance = jest.fn((text) => ({ text }))

    mockRecognition = {
      start: jest.fn(),
      stop: jest.fn(),
      onresult: null,
      onend: null,
      onerror: null
    }
    window.SpeechRecognition = jest.fn(() => mockRecognition)
    window.webkitSpeechRecognition = window.SpeechRecognition

    require('../../public/js/AccessibilityManager.js')
    AccessibilityManager = window.AccessibilityManager
  })

  beforeEach(() => {
    mockGameManager = {
      game: {
        history: jest.fn().mockReturnValue([]),
        moves: jest.fn().mockReturnValue([]),
        turn: jest.fn().mockReturnValue('w')
      },
      currentViewIndex: -1,
      performMove: jest.fn(),
      sendPositionAndGo: jest.fn(),
      startNewGame: jest.fn()
    }
    mockUiManager = {
      showToast: jest.fn()
    }
    mockRenderFn = jest.fn()
    document.body.innerHTML = '<div id="a11y-status"></div>'
    jest.clearAllMocks()
  })

  test('initializes and binds keyboard events', () => {
    const manager = new AccessibilityManager(mockGameManager, mockUiManager, mockRenderFn)
    expect(manager).toBeDefined()
  })

  test('keyboard navigation updates view index', () => {
    new AccessibilityManager(mockGameManager, mockUiManager, mockRenderFn) // eslint-disable-line no-new
    // 2 moves in history: indices 0, 1. Max index = 1.
    mockGameManager.game.history.mockReturnValue(['e4', 'e5'])

    // Simulate Left Arrow (Back)
    // Starting at -1 (Live) -> which is effectively index 1.
    // Moving back should go to index 0.
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
    document.dispatchEvent(event)

    expect(mockGameManager.currentViewIndex).toBe(0)
    expect(mockRenderFn).toHaveBeenCalled()
    // "Move 1" corresponds to index 0 in the display logic of _announceMoveStatus?
    // Math.floor(0 / 2) + 1 = 1. Yes.
    expect(document.getElementById('a11y-status').textContent).toContain('Move 1')
  })

  test('keyboard shortcuts triggers actions', () => {
    new AccessibilityManager(mockGameManager, mockUiManager, mockRenderFn) // eslint-disable-line no-new

    // Setup Mock Buttons
    const forceBtn = document.createElement('button')
    forceBtn.id = 'force-move-btn'
    forceBtn.click = jest.fn()
    document.body.appendChild(forceBtn)

    const zenBtn = document.createElement('input')
    zenBtn.id = 'zen-mode'
    zenBtn.type = 'checkbox'
    zenBtn.click = jest.fn()
    document.body.appendChild(zenBtn)

    const flipBtn = document.createElement('button')
    flipBtn.id = 'flip-board-btn'
    flipBtn.click = jest.fn()
    document.body.appendChild(flipBtn)

    // Arrow Up -> Start
    const arrowUp = new KeyboardEvent('keydown', { key: 'ArrowUp' })
    document.dispatchEvent(arrowUp)
    expect(mockGameManager.currentViewIndex).toBe(-2)

    // Arrow Down -> Live
    const arrowDown = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    document.dispatchEvent(arrowDown)
    expect(mockGameManager.currentViewIndex).toBe(-1)

    // Space -> Force Move
    const space = new KeyboardEvent('keydown', { key: ' ' })
    document.dispatchEvent(space)
    expect(forceBtn.click).toHaveBeenCalled()

    // Escape -> Zen Mode
    const escape = new KeyboardEvent('keydown', { key: 'Escape' })
    document.dispatchEvent(escape)
    expect(zenBtn.click).toHaveBeenCalled()

    // F -> Flip Board
    const keyF = new KeyboardEvent('keydown', { key: 'f' })
    document.dispatchEvent(keyF)
    expect(flipBtn.click).toHaveBeenCalled()
  })

  test('voice announcement speaks move', () => {
    const manager = new AccessibilityManager(mockGameManager, mockUiManager, mockRenderFn)
    manager.setVoiceAnnounce(true)

    manager.announceMove({ color: 'w', piece: 'n', to: 'f3' })
    expect(window.speechSynthesis.speak).toHaveBeenCalledWith(expect.objectContaining({ text: 'White plays Knight to f3' }))
  })

  test('voice control handles new game command', () => {
    const manager = new AccessibilityManager(mockGameManager, mockUiManager, mockRenderFn)
    manager.setVoiceControl(true)

    // Simulate speech result
    const event = {
      results: [[{ transcript: 'new game' }]]
    }
    mockRecognition.onresult(event)

    expect(mockGameManager.startNewGame).toHaveBeenCalled()
    expect(mockUiManager.showToast).toHaveBeenCalledWith(expect.stringContaining('New Game'), 'info')
  })

  test('voice control handles move command', () => {
    const manager = new AccessibilityManager(mockGameManager, mockUiManager, mockRenderFn)
    manager.setVoiceControl(true)

    mockGameManager.game.moves.mockReturnValue([
      { san: 'e4', from: 'e2', to: 'e4' }
    ])

    const event = {
      results: [[{ transcript: 'play e4' }]]
    }
    mockRecognition.onresult(event)

    expect(mockGameManager.performMove).toHaveBeenCalledWith(expect.objectContaining({ from: 'e2', to: 'e4' }), true)
  })
})
