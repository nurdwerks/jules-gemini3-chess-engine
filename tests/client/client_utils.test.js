/**
 * @jest-environment jsdom
 */

describe('ClientUtils', () => {
  beforeAll(() => {
    require('../../public/js/ClientUtils.js')
  })

  test('coordsToAlgebraic converts coordinates correctly', () => {
    expect(window.ClientUtils.coordsToAlgebraic(0, 0)).toBe('a8')
    expect(window.ClientUtils.coordsToAlgebraic(7, 7)).toBe('h1')
    expect(window.ClientUtils.coordsToAlgebraic(3, 4)).toBe('e5')
  })

  test('parseInfo parses basic score correctly', () => {
    const info = window.ClientUtils.parseInfo('info depth 10 score cp 50 nodes 1000 nps 50000 pv e2e4 e7e5')
    expect(info.depth).toBe('10')
    expect(info.score).toEqual({ type: 'cp', value: 50 })
    expect(info.nodes).toBe('1000')
    expect(info.nps).toBe('50000')
    expect(info.pv).toEqual(['e2e4', 'e7e5'])
  })

  test('parseInfo parses mate score', () => {
    const info = window.ClientUtils.parseInfo('info depth 10 score mate 5')
    expect(info.score).toEqual({ type: 'mate', value: 5 })
  })

  test('generate960Fen returns valid string', () => {
    const fen = window.ClientUtils.generate960Fen()
    expect(typeof fen).toBe('string')
    expect(fen).toMatch(/^[\w/]+ [wb] - - 0 1$/)
    expect(fen.split('/')[0]).toHaveLength(8)
  })
})
