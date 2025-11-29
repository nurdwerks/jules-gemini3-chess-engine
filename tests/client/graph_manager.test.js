/**
 * @jest-environment jsdom
 */

describe('GraphManager', () => {
  let GraphManager

  beforeAll(() => {
    // Setup DOM first
    document.body.innerHTML = `
      <svg id="eval-graph"></svg>
      <svg id="material-graph"></svg>
      <svg id="time-graph"></svg>
      <svg id="nps-graph"></svg>
      <svg id="tension-graph"></svg>
    `
    require('../../public/js/GraphManager.js')
    GraphManager = window.GraphManager
  })

  test('renderEvalGraph renders polyline', () => {
    const history = [
      { ply: 1, score: 10 },
      { ply: 2, score: 20 },
      { ply: 3, score: -10 }
    ]
    GraphManager.renderEvalGraph(history)
    const svg = document.getElementById('eval-graph')
    const polyline = svg.querySelector('polyline')
    expect(polyline).not.toBeNull()
    expect(polyline.getAttribute('points')).toBeTruthy()
  })

  test('renderMaterialGraph renders two polylines', () => {
    const history = [
      { ply: 1, w: 39, b: 39 },
      { ply: 2, w: 39, b: 35 }
    ]
    GraphManager.renderMaterialGraph(history)
    const svg = document.getElementById('material-graph')
    const polylines = svg.querySelectorAll('polyline')
    expect(polylines.length).toBe(2)
  })

  test('renderTimeGraph renders rects', () => {
    const history = [
      { ply: 1, time: 1000 },
      { ply: 2, time: 500 }
    ]
    GraphManager.renderTimeGraph(history)
    const svg = document.getElementById('time-graph')
    const rects = svg.querySelectorAll('rect')
    expect(rects.length).toBe(2)
  })

  test('renderNpsGraph renders polyline', () => {
    const history = [
      { value: 1000 },
      { value: 2000 }
    ]
    GraphManager.renderNpsGraph(history)
    const svg = document.getElementById('nps-graph')
    const polyline = svg.querySelector('polyline')
    expect(polyline).not.toBeNull()
  })

  test('renderTensionGraph renders polyline', () => {
    const history = [
      { ply: 1, value: 0 },
      { ply: 2, value: 50 }
    ]
    GraphManager.renderTensionGraph(history)
    const svg = document.getElementById('tension-graph')
    const polyline = svg.querySelector('polyline')
    expect(polyline).not.toBeNull()
  })

  test('handles empty history', () => {
    GraphManager.renderEvalGraph([])
    const svg = document.getElementById('eval-graph')
    expect(svg.innerHTML).toBe('')
  })
})
