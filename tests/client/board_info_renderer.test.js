/**
 * @jest-environment jsdom
 */

const fs = require('fs')
const path = require('path')

const chessScript = fs.readFileSync(path.resolve(__dirname, '../../public/libs/chess.js'), 'utf8')
// eslint-disable-next-line no-eval
eval(chessScript)
if (typeof exports !== 'undefined' && exports.Chess) window.Chess = exports.Chess

describe('BoardInfoRenderer', () => {
  let BoardInfoRenderer
  let game
  let elements
  let renderer

  beforeAll(() => {
    require('../../public/js/BoardInfoRenderer.js')
    BoardInfoRenderer = window.BoardInfoRenderer
  })

  beforeEach(() => {
    game = new window.Chess()
    elements = {
        topCaptured: document.createElement('div'),
        bottomCaptured: document.createElement('div'),
        topMaterialDiff: document.createElement('div'),
        bottomMaterialDiff: document.createElement('div'),
        topMaterialBar: document.createElement('div'),
        bottomMaterialBar: document.createElement('div')
    }
    renderer = new BoardInfoRenderer(elements)
  })

  test('updateCapturedPieces with startpos', () => {
      renderer.updateCapturedPieces(game, 'startpos', 'cburnett', false)
      expect(elements.topCaptured.innerHTML).toBe('')
      expect(elements.bottomCaptured.innerHTML).toBe('')
      expect(elements.topMaterialDiff.textContent).toBe('')
  })

  test('updateCapturedPieces with captured pieces', () => {
      // Remove white pawn at e2, black pawn at e7
      game.remove('e2')
      game.remove('e7')

      renderer.updateCapturedPieces(game, 'startpos', 'cburnett', false)

      expect(elements.topCaptured.querySelectorAll('img').length).toBe(1)
      expect(elements.topCaptured.querySelector('img').src).toContain('wp.svg')

      expect(elements.bottomCaptured.querySelectorAll('img').length).toBe(1)
      expect(elements.bottomCaptured.querySelector('img').src).toContain('bp.svg')
  })

  test('material diff', () => {
      game.remove('d8') // Remove black queen

      renderer.updateCapturedPieces(game, 'startpos', 'cburnett', false)

      expect(elements.bottomMaterialDiff.textContent).toBe('+9')
      expect(elements.topMaterialDiff.textContent).toBe('')
  })

  test('flipped board', () => {
      game.remove('d8') // Remove black queen

      renderer.updateCapturedPieces(game, 'startpos', 'cburnett', true)
      expect(elements.topMaterialDiff.textContent).toBe('+9')
  })
})
