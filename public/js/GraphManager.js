window.GraphManager = (() => {
  const evalGraphSvg = document.getElementById('eval-graph')
  const materialGraphSvg = document.getElementById('material-graph')
  const timeGraphSvg = document.getElementById('time-graph')
  const npsGraphSvg = document.getElementById('nps-graph')
  const tensionGraphSvg = document.getElementById('tension-graph')

  function renderEvalGraph (evalHistory) {
    if (!evalGraphSvg) return
    if (!evalHistory || evalHistory.length === 0) {
      evalGraphSvg.innerHTML = ''
      return
    }

    evalGraphSvg.innerHTML = ''

    const width = evalGraphSvg.clientWidth || 300
    const height = evalGraphSvg.clientHeight || 100
    const padding = 5

    // Scales
    const maxPly = Math.max(20, evalHistory.length)
    const minScore = -500 // -5 pawns
    const maxScore = 500 // +5 pawns

    // Helper to map logic
    const getX = (ply) => (ply / maxPly) * (width - 2 * padding) + padding
    const getY = (score) => {
      // Clamp
      const s = Math.max(minScore, Math.min(maxScore, score))
      // Map to 0..height (inverted, +score is top)
      const pct = (s - minScore) / (maxScore - minScore)
      return height - (pct * (height - 2 * padding) + padding)
    }

    // Zero line
    const zeroY = getY(0)
    const line0 = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line0.setAttribute('x1', 0)
    line0.setAttribute('y1', zeroY)
    line0.setAttribute('x2', width)
    line0.setAttribute('y2', zeroY)
    line0.setAttribute('stroke', '#444')
    line0.setAttribute('stroke-width', '1')
    line0.setAttribute('stroke-dasharray', '4')
    evalGraphSvg.appendChild(line0)

    // Polyline
    const points = evalHistory.map(p => `${getX(p.ply)},${getY(p.score)}`).join(' ')
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
    polyline.setAttribute('points', points)
    polyline.setAttribute('fill', 'none')
    polyline.setAttribute('stroke', '#33B5E5')
    polyline.setAttribute('stroke-width', '2')
    evalGraphSvg.appendChild(polyline)
  }

  function renderMaterialGraph (materialHistory) {
    if (!materialGraphSvg) return
    if (!materialHistory || materialHistory.length === 0) {
      materialGraphSvg.innerHTML = ''
      return
    }

    materialGraphSvg.innerHTML = ''
    const width = materialGraphSvg.clientWidth || 300
    const height = materialGraphSvg.clientHeight || 200
    const padding = 10

    const maxPly = Math.max(20, materialHistory.length)
    const maxMat = 39

    const getX = (ply) => (ply / maxPly) * (width - 2 * padding) + padding
    const getY = (mat) => height - ((mat / maxMat) * (height - 2 * padding) + padding)

    // White Material Line
    const wPoints = materialHistory.map(p => `${getX(p.ply)},${getY(p.w)}`).join(' ')
    const wPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
    wPoly.setAttribute('points', wPoints)
    wPoly.setAttribute('fill', 'none')
    wPoly.setAttribute('stroke', '#E3E3E3')
    wPoly.setAttribute('stroke-width', '2')
    materialGraphSvg.appendChild(wPoly)

    // Black Material Line
    const bPoints = materialHistory.map(p => `${getX(p.ply)},${getY(p.b)}`).join(' ')
    const bPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
    bPoly.setAttribute('points', bPoints)
    bPoly.setAttribute('fill', 'none')
    bPoly.setAttribute('stroke', '#6B6B6B')
    bPoly.setAttribute('stroke-width', '2')
    materialGraphSvg.appendChild(bPoly)
  }

  function renderTimeGraph (timeHistory) {
    if (!timeGraphSvg) return
    if (!timeHistory || timeHistory.length === 0) {
      timeGraphSvg.innerHTML = ''
      return
    }

    timeGraphSvg.innerHTML = ''
    const width = timeGraphSvg.clientWidth || 300
    const height = timeGraphSvg.clientHeight || 200
    const padding = 20

    const maxPly = Math.max(20, timeHistory[timeHistory.length - 1].ply)
    const maxTime = Math.max(1000, ...timeHistory.map(t => t.time))

    const getX = (ply) => (ply / maxPly) * (width - 2 * padding) + padding
    const getY = (time) => height - ((time / maxTime) * (height - 2 * padding) + padding)

    // Bars
    const barW = Math.max(2, ((width - 2 * padding) / maxPly) * 0.8)

    timeHistory.forEach(t => {
      const x = getX(t.ply) - barW / 2
      const y = getY(t.time)
      const h = (height - padding) - y

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.setAttribute('x', x)
      rect.setAttribute('y', y)
      rect.setAttribute('width', barW)
      rect.setAttribute('height', h)
      rect.setAttribute('fill', '#33B5E5') // Blue
      timeGraphSvg.appendChild(rect)
    })
  }

  function renderNpsGraph (npsHistory) {
    if (!npsGraphSvg) return
    if (!npsHistory || npsHistory.length === 0) {
      npsGraphSvg.innerHTML = ''
      return
    }

    npsGraphSvg.innerHTML = ''
    const width = npsGraphSvg.clientWidth || 300
    const height = npsGraphSvg.clientHeight || 200
    const padding = 10

    const maxSamples = npsHistory.length
    const maxNps = Math.max(100000, ...npsHistory.map(n => n.value))

    const getX = (i) => (i / (maxSamples - 1 || 1)) * (width - 2 * padding) + padding
    const getY = (val) => height - ((val / maxNps) * (height - 2 * padding) + padding)

    const points = npsHistory.map((n, i) => `${getX(i)},${getY(n.value)}`).join(' ')
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
    poly.setAttribute('points', points)
    poly.setAttribute('fill', 'none')
    poly.setAttribute('stroke', '#9AC42A') // Green
    poly.setAttribute('stroke-width', '2')
    npsGraphSvg.appendChild(poly)
  }

  function renderTensionGraph (tensionHistory) {
    if (!tensionGraphSvg) return
    if (!tensionHistory || tensionHistory.length === 0) {
      tensionGraphSvg.innerHTML = ''
      return
    }

    tensionGraphSvg.innerHTML = ''
    const width = tensionGraphSvg.clientWidth || 300
    const height = tensionGraphSvg.clientHeight || 200
    const padding = 10

    const maxPly = Math.max(20, tensionHistory[tensionHistory.length - 1].ply)
    const maxTension = Math.max(10, ...tensionHistory.map(t => t.value))

    const getX = (ply) => (ply / maxPly) * (width - 2 * padding) + padding
    const getY = (val) => height - ((val / maxTension) * (height - 2 * padding) + padding)

    const points = tensionHistory.map(t => `${getX(t.ply)},${getY(t.value)}`).join(' ')
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
    poly.setAttribute('points', points)
    poly.setAttribute('fill', 'none')
    poly.setAttribute('stroke', '#F2495C') // Red
    poly.setAttribute('stroke-width', '2')
    tensionGraphSvg.appendChild(poly)
  }

  return {
    renderEvalGraph,
    renderMaterialGraph,
    renderTimeGraph,
    renderNpsGraph,
    renderTensionGraph
  }
})()
