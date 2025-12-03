/**
 * @jest-environment jsdom
 */

describe('ArrowManager', () => {
  let ArrowManager

  beforeAll(() => {
    document.body.innerHTML = '<svg id="arrow-layer" viewBox="0 0 100 100"></svg>'
    require('../../public/js/ArrowManager.js')
    ArrowManager = window.ArrowManager
  })

  test('addUserArrow draws arrow', () => {
    ArrowManager.addUserArrow('e2', 'e4')
    const svg = document.getElementById('arrow-layer')
    const arrow = svg.querySelector('.arrow-user')
    expect(arrow).not.toBeNull()

    // Toggle
    ArrowManager.addUserArrow('e2', 'e4')
    expect(svg.querySelector('.arrow-user')).toBeNull()
  })

  test('setLastMoveArrow draws arrow', () => {
    ArrowManager.setLastMoveArrow('e2', 'e4')
    const svg = document.getElementById('arrow-layer')
    const arrow = svg.querySelector('.arrow-last')
    expect(arrow).not.toBeNull()

    ArrowManager.clearLastMoveArrow()
    expect(svg.querySelector('.arrow-last')).toBeNull()
  })

  test('setEngineArrow draws arrow', () => {
    ArrowManager.setEngineArrow('e2', 'e4')
    const svg = document.getElementById('arrow-layer')
    const arrow = svg.querySelector('.arrow-best')
    expect(arrow).not.toBeNull()

    ArrowManager.clearEngineArrows()
    expect(svg.querySelector('.arrow-best')).toBeNull()
  })

  test('toggleUserHighlight', () => {
    ArrowManager.toggleUserHighlight('e2')
    expect(ArrowManager.getUserHighlight('e2')).toBe('highlight-red')

    ArrowManager.toggleUserHighlight('e2')
    expect(ArrowManager.getUserHighlight('e2')).toBe('highlight-green')

    ArrowManager.clearUserHighlights()
    expect(ArrowManager.getUserHighlight('e2')).toBeUndefined()
  })

  test('setVizLines', () => {
    ArrowManager.setVizLines([{ from: 'e2', to: 'e4', className: 'viz-line' }])
    const svg = document.getElementById('arrow-layer')
    const line = svg.querySelector('.viz-line')
    expect(line).not.toBeNull()
  })
})
