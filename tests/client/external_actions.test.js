/**
 * @jest-environment jsdom
 */

/* eslint-env jest */

describe('External Actions', () => {
  let ExternalActions
  let pgnManager
  let boardRenderer
  let uiManager
  let game
  let externalActions

  beforeEach(() => {
    // Mock DOM for form submission
    document.body.innerHTML = ''

    // Mocks
    window.open = jest.fn()

    pgnManager = {
      exportPgn: jest.fn().mockReturnValue('1. e4 e5')
    }

    boardRenderer = {
      getScreenshotUrl: jest.fn().mockReturnValue('blob:url')
    }

    uiManager = {
      showToast: jest.fn()
    }

    game = {}

    global.Blob = class { constructor() {} }
    global.URL.createObjectURL = jest.fn()
    global.URL.revokeObjectURL = jest.fn()

    require('../../public/js/ExternalActions.js')
    ExternalActions = window.ExternalActions

    externalActions = new ExternalActions(pgnManager, boardRenderer, uiManager, game)
  })

  test('Analyze on Lichess submits form', () => {
    const formMock = {
      method: '', action: '', target: '',
      appendChild: jest.fn(),
      submit: jest.fn()
    }
    const inputMock = { type: '', name: '', value: '' }

    const originalCreateElement = document.createElement.bind(document)
    document.createElement = jest.fn((tag) => {
      if (tag === 'form') return formMock
      if (tag === 'input') return inputMock
      return originalCreateElement(tag)
    })
    document.body.appendChild = jest.fn()
    document.body.removeChild = jest.fn()

    externalActions.analyzeLichess()

    expect(formMock.action).toBe('https://lichess.org/import')
    expect(formMock.submit).toHaveBeenCalled()
    expect(inputMock.value).toBe('1. e4 e5')

    document.createElement = originalCreateElement
  })

  test('Analyze on Chess.com opens window', () => {
    externalActions.analyzeChessCom()
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('chess.com/analysis?pgn='),
      '_blank'
    )
  })

  test('Share Twitter', () => {
    externalActions.shareTwitter()
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank'
    )
  })

  test('Share Reddit', () => {
    externalActions.shareReddit()
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('reddit.com/submit'),
      '_blank'
    )
  })

  test('Download Screenshot', () => {
    // Mock anchor click
    const clickMock = jest.fn()
    const anchorMock = {
      click: clickMock,
      href: '',
      download: ''
    }
    const originalCreateElement = document.createElement.bind(document)
    document.createElement = jest.fn((tag) => {
        if (tag === 'a') return anchorMock
        return originalCreateElement(tag)
    })
    document.body.appendChild = jest.fn()
    document.body.removeChild = jest.fn()

    externalActions.downloadScreenshot()

    expect(boardRenderer.getScreenshotUrl).toHaveBeenCalled()
    expect(clickMock).toHaveBeenCalled()
    expect(uiManager.showToast).toHaveBeenCalled()

    document.createElement = originalCreateElement
  })
})
