/**
 * @jest-environment jsdom
 */

describe('Screenshot Feature', () => {
  let BoardRenderer
  let boardElement
  let game
  let renderer

  beforeEach(() => {
    // Mock XMLSerializer
    global.XMLSerializer = class {
      serializeToString (node) {
        return '<svg>serialized</svg>'
      }
    }
    // Mock Blob and URL
    global.Blob = class {
      constructor (content, options) {
        this.content = content
        this.options = options
      }
    }
    global.URL.createObjectURL = jest.fn(blob => 'blob:url')
    global.URL.revokeObjectURL = jest.fn()

    // Mock BoardRenderer and dependencies
    require('../../public/js/ClientUtils.js')
    require('../../public/js/BoardRenderer.js')
    BoardRenderer = window.BoardRenderer

    boardElement = document.createElement('div')
    game = {
      board: () => [],
      history: () => [],
      fen: () => 'startpos',
      turn: () => 'w'
    }

    renderer = new BoardRenderer(boardElement, game)
  })

  test('getScreenshotUrl returns a blob url', () => {
    // Setup some squares
    const square = document.createElement('div')
    square.classList.add('square')
    square.dataset.row = 0
    square.dataset.col = 0
    boardElement.appendChild(square)

    // Add a piece
    const piece = document.createElement('img')
    piece.classList.add('piece')
    piece.src = 'test.svg'
    square.appendChild(piece)

    const url = renderer.getScreenshotUrl()

    expect(global.URL.createObjectURL).toHaveBeenCalled()
    expect(url).toBe('blob:url')
  })
})
