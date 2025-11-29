/**
 * @jest-environment jsdom
 */

const fs = require('fs')
const path = require('path')

const chessScript = fs.readFileSync(path.resolve(__dirname, '../../public/libs/chess.js'), 'utf8')
// eslint-disable-next-line no-eval
eval(chessScript)
if (typeof exports !== 'undefined' && exports.Chess) window.Chess = exports.Chess

describe('VisualizationManager', () => {
  let VisualizationManager
  let game

  beforeAll(() => {
      document.body.innerHTML = `
        <input id="viz-king-safety" type="checkbox" />
        <input id="viz-mobility" type="checkbox" />
        <input id="viz-utilization" type="checkbox" />
        <input id="viz-piece-tracker" type="checkbox" />
        <input id="viz-outpost" type="checkbox" />
        <input id="viz-weak-square" type="checkbox" />
        <input id="viz-battery" type="checkbox" />
        <input id="viz-xray" type="checkbox" />
        <input id="viz-pin" type="checkbox" />
        <input id="viz-fork" type="checkbox" />
        <input id="viz-discovered" type="checkbox" />
      `

      global.ClientUtils = {
          coordsToAlgebraic: (r, c) => {
             const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
             const rank = 8 - r
             return files[c] + rank
          }
      }
      global.ArrowManager = {
          setVizLines: jest.fn()
      }

      require('../../public/js/VisualizationManager.js')
      VisualizationManager = window.VisualizationManager
  })

  beforeEach(() => {
      game = new window.Chess()
      document.querySelectorAll('input').forEach(el => el.checked = false)
      global.ArrowManager.setVizLines.mockClear()
  })

  test('King Safety', () => {
      document.getElementById('viz-king-safety').checked = true
      VisualizationManager.calculate(game)
      const h = VisualizationManager.getHighlights('e2')
      expect(h).toContain('highlight-red')
  })

  test('Mobility', () => {
      document.getElementById('viz-mobility').checked = true
      VisualizationManager.calculate(game)
      const h = VisualizationManager.getHighlights('e3')
      expect(h).toContain('viz-mobility')
  })

  test('Outpost', () => {
      document.getElementById('viz-outpost').checked = true
      game.load('rnbqkbnr/pppppppp/8/4N3/8/8/PPPPPPPP/RNBQKB1R b KQkq - 1 1')
      VisualizationManager.calculate(game)
      const h = VisualizationManager.getHighlights('e5')
      expect(h).toContain('viz-outpost')
  })

  test('Battery', () => {
      document.getElementById('viz-battery').checked = true
      game.load('8/8/8/8/8/8/Q7/R7 w - - 0 1')
      VisualizationManager.calculate(game)
      expect(global.ArrowManager.setVizLines).toHaveBeenCalled()
      const lines = global.ArrowManager.setVizLines.mock.calls[0][0]
      expect(lines.some(l => l.className === 'viz-line-battery')).toBe(true)
  })

  test('Fork', () => {
      document.getElementById('viz-fork').checked = true
      game.load('8/3q1r2/8/4N3/8/8/8/8 w - - 0 1')
      VisualizationManager.calculate(game)
      const h = VisualizationManager.getHighlights('e5')
      expect(h).toContain('viz-fork-source')
      const t1 = VisualizationManager.getHighlights('d7')
      expect(t1).toContain('viz-fork-target')
  })

  test('Pin', () => {
      document.getElementById('viz-pin').checked = true
      // White King at e1. White Pawn at e2. Black Rook at e8.
      game.load('4r3/8/8/8/8/8/4P3/4K3 w - - 0 1')

      VisualizationManager.calculate(game)

      const lines = global.ArrowManager.setVizLines.mock.calls[0][0]
      expect(lines.some(l => l.className === 'viz-line-pin')).toBe(true)
  })
})
