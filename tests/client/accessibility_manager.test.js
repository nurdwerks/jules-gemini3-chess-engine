/**
 * @jest-environment jsdom
 */

/* global KeyboardEvent */

describe('AccessibilityManager', () => {
  let AccessibilityManager
  let accessibilityManager
  let gameManagerMock
  let uiManagerMock
  let renderFnMock
  let speechSynthesisMock
  let speechRecognitionMock
  let recognitionInstance

  beforeAll(() => {
    // Mock SpeechSynthesis
    speechSynthesisMock = {
      speak: jest.fn(),
      cancel: jest.fn()
    }
    window.speechSynthesis = speechSynthesisMock
    window.SpeechSynthesisUtterance = jest.fn()

    // Mock SpeechRecognition
    recognitionInstance = {
      start: jest.fn(),
      stop: jest.fn(),
      abort: jest.fn()
    }
    speechRecognitionMock = jest.fn(() => recognitionInstance)
    window.SpeechRecognition = speechRecognitionMock
    window.webkitSpeechRecognition = speechRecognitionMock

    require('../../public/js/AccessibilityManager.js')
    AccessibilityManager = window.AccessibilityManager
  })

  beforeEach(() => {
    jest.clearAllMocks()

    gameManagerMock = {
      game: {
        history: jest.fn().mockReturnValue([]),
        moves: jest.fn().mockReturnValue([])
      },
      currentViewIndex: -1,
      performMove: jest.fn(),
      startNewGame: jest.fn(),
      sendPositionAndGo: jest.fn()
    }

    uiManagerMock = {
      showToast: jest.fn()
    }

    renderFnMock = jest.fn()

    // Reset document
    document.body.innerHTML = '<div id="a11y-status"></div>'

    accessibilityManager = new AccessibilityManager(gameManagerMock, uiManagerMock, renderFnMock)
  })

  test('initializes keyboard and speech recognition', () => {
    expect(window.SpeechRecognition).toHaveBeenCalled()
  })

  describe('Keyboard Navigation', () => {
    test('ArrowLeft navigates back', () => {
      // Setup history with 2 moves
      gameManagerMock.game.history.mockReturnValue(['e4', 'e5'])
      // Current view is live (-1)
      gameManagerMock.currentViewIndex = -1

      // Trigger ArrowLeft
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
      document.dispatchEvent(event)

      // Expect to go to index 0 (move before last)
      expect(gameManagerMock.currentViewIndex).toBe(0)
      expect(renderFnMock).toHaveBeenCalled()
      expect(document.getElementById('a11y-status').textContent).toContain('Move 1')
    })

    test('ArrowRight navigates forward', () => {
      gameManagerMock.game.history.mockReturnValue(['e4', 'e5'])
      gameManagerMock.currentViewIndex = 0 // At first move

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      document.dispatchEvent(event)

      expect(gameManagerMock.currentViewIndex).toBe(1)
      expect(renderFnMock).toHaveBeenCalled()
    })

    test('ignores keydown in inputs', () => {
      document.body.innerHTML += '<input id="test-input" />'
      const input = document.getElementById('test-input')
      input.focus()

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
      Object.defineProperty(document, 'activeElement', { value: input, configurable: true })
      document.dispatchEvent(event)

      expect(renderFnMock).not.toHaveBeenCalled()
    })
  })

  describe('Voice Announcement', () => {
    test('announceMove speaks move', () => {
      accessibilityManager.setVoiceAnnounce(true)
      const move = { color: 'w', piece: 'n', to: 'f3', san: 'Nf3' }
      accessibilityManager.announceMove(move)

      expect(window.SpeechSynthesisUtterance).toHaveBeenCalled()
      expect(speechSynthesisMock.speak).toHaveBeenCalled()
    })

    test('announceMove does nothing if disabled', () => {
      accessibilityManager.setVoiceAnnounce(false)
      accessibilityManager.announceMove({})
      expect(speechSynthesisMock.speak).not.toHaveBeenCalled()
    })
  })

  describe('Voice Control', () => {
    test('enabling starts recognition', () => {
      accessibilityManager.setVoiceControl(true)
      expect(recognitionInstance.start).toHaveBeenCalled()
    })

    test('disabling stops recognition', () => {
      accessibilityManager.setVoiceControl(false)
      expect(recognitionInstance.stop).toHaveBeenCalled()
    })

    test('handles "new game" command', () => {
      accessibilityManager.setVoiceControl(true)
      // Simulate result
      recognitionInstance.onresult({
        results: [[{ transcript: 'start new game' }]]
      })

      expect(gameManagerMock.startNewGame).toHaveBeenCalled()
      expect(uiManagerMock.showToast).toHaveBeenCalledWith(expect.stringContaining('Starting New Game'), 'info')
    })

    test('handles move command', () => {
      accessibilityManager.setVoiceControl(true)
      gameManagerMock.game.moves.mockReturnValue([
        { san: 'e4', from: 'e2', to: 'e4', piece: 'p' },
        { san: 'Nf3', from: 'g1', to: 'f3', piece: 'n' }
      ])

      recognitionInstance.onresult({
        results: [[{ transcript: 'play e4' }]]
      })

      expect(gameManagerMock.performMove).toHaveBeenCalledWith({ from: 'e2', to: 'e4', promotion: undefined }, true)
    })

    test('handles phonetic move command', () => {
      accessibilityManager.setVoiceControl(true)
      gameManagerMock.game.moves.mockReturnValue([
        { san: 'Nf3', from: 'g1', to: 'f3', piece: 'n' }
      ])

      recognitionInstance.onresult({
        results: [[{ transcript: 'knight f3' }]]
      })

      expect(gameManagerMock.performMove).toHaveBeenCalledWith({ from: 'g1', to: 'f3', promotion: undefined }, true)
    })
  })
})
