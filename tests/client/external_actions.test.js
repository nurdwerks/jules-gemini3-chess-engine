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

    global.Blob = class {}
    global.URL.createObjectURL = jest.fn()
    global.URL.revokeObjectURL = jest.fn()

    require('../../public/js/ExternalActions.js')
    ExternalActions = window.ExternalActions

    externalActions = new ExternalActions(pgnManager, boardRenderer, uiManager, game)
  })

  test('Analyze on Lichess submits form', () => {
    const formMock = {
      method: '',
      action: '',
      target: '',
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

  test('Export GIF', async () => {
    // Mock GIF
    const gifInstance = {
      on: jest.fn(),
      render: jest.fn(),
      addFrame: jest.fn()
    }
    global.GIF = jest.fn(() => gifInstance)

    // Mock window.Chess
    const chessInstance = {
      load_pgn: jest.fn(),
      undo: jest.fn()
        .mockReturnValueOnce(true) // First undo works
        .mockReturnValueOnce(false), // Second undo fails (start of game)
      move: jest.fn(),
      board: jest.fn().mockReturnValue([]),
      header: jest.fn()
    }
    window.Chess = jest.fn(() => chessInstance)

    // Mock game.history
    game.history = jest.fn().mockReturnValue([
      { from: 'e2', to: 'e4' }
    ])

    // Mock BoardRenderer constructor and instance
    const tempRenderer = {
      render: jest.fn(),
      setPieceSet: jest.fn(),
      getScreenshotUrl: jest.fn().mockReturnValue('blob:svg')
    }
    window.BoardRenderer = jest.fn(() => tempRenderer)

    // Mock _embedImagesInSvg to avoid fetch
    externalActions._embedImagesInSvg = jest.fn().mockResolvedValue('blob:svgWithImages')

    // Mock Image
    global.Image = class {
      constructor () {
        setTimeout(() => this.onload && this.onload(), 0)
      }
    }

    await externalActions.exportGif()

    expect(pgnManager.exportPgn).toHaveBeenCalled()
    expect(window.Chess).toHaveBeenCalled()
    expect(chessInstance.load_pgn).toHaveBeenCalledWith('1. e4 e5')
    expect(chessInstance.undo).toHaveBeenCalled()
    expect(gifInstance.addFrame).toHaveBeenCalledTimes(2) // Start + 1 move
    expect(gifInstance.render).toHaveBeenCalled()
  })
})
