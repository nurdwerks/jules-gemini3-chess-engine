const LanguageManager = require('../../public/js/LanguageManager')

describe('LanguageManager', () => {
  let languageManager
  let mockElement

  beforeEach(() => {
    // Mock localStorage
    const store = {}
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = value }),
        clear: jest.fn(() => { for (const k in store) delete store[k] })
      },
      writable: true
    })

    mockElement = {
      dataset: { i18n: 'new-game-btn' },
      textContent: '',
      tagName: 'BUTTON'
    }

    // Spy on document methods instead of replacing global.document
    jest.spyOn(document, 'getElementById').mockImplementation((id) => {
      return { addEventListener: jest.fn(), value: 'en' }
    })

    jest.spyOn(document, 'querySelectorAll').mockImplementation((sel) => {
      if (sel === '[data-i18n]') return [mockElement]
      if (sel === '[data-i18n-title]') return []
      return []
    })

    languageManager = new LanguageManager()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('should initialize with default language', () => {
    expect(languageManager.currentLang).toBe('en')
  })

  test('should load language from localStorage', () => {
    window.localStorage.getItem.mockReturnValue('es')
    const lm = new LanguageManager()
    expect(lm.currentLang).toBe('es')
  })

  test('should set language and update text', () => {
    languageManager.setLanguage('es')
    expect(languageManager.currentLang).toBe('es')
    expect(window.localStorage.setItem).toHaveBeenCalledWith('language', 'es')
    expect(mockElement.textContent).toBe('Nueva Partida')
  })

  test('should return correct text via getText', () => {
    languageManager.setLanguage('es')
    expect(languageManager.getText('status-checkmate')).toBe('¡Jaque Mate!')
  })
})
