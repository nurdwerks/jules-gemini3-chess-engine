window.ArrowManager = (() => {
  const svg = document.getElementById('arrow-layer')
  let userArrows = [] // Array of {from, to}
  let engineArrows = [] // Array of {from, to, type}
  let lastMoveArrow = null // {from, to}
  let userHighlights = {} // alg -> className
  let isFlipped = false // Added state

  const clearAll = () => {
    if (!svg) return
    svg.innerHTML = ''
  }

  let vizLines = []

  const getSquareCenter = (alg) => {
    const colFile = alg[0]
    const rowRank = alg[1]

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    let col = files.indexOf(colFile)
    let row = 8 - parseInt(rowRank)

    if (col === -1 || isNaN(row)) return null

    // Handle Flip
    if (isFlipped) {
      col = 7 - col
      row = 7 - row
    }

    // 0-7 to 12.5% centers
    const step = 100 / 8
    const x = col * step + (step / 2)
    const y = row * step + (step / 2)

    return { x, y }
  }

  const _drawLine = (from, to, className) => {
    if (!svg) return
    const start = getSquareCenter(from)
    const end = getSquareCenter(to)
    if (!start || !end) return

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', `${start.x}%`)
    line.setAttribute('y1', `${start.y}%`)
    line.setAttribute('x2', `${end.x}%`)
    line.setAttribute('y2', `${end.y}%`)
    line.classList.add(className)
    svg.appendChild(line)
  }

  const _draw = (from, to, className) => {
    if (!svg) return

    const start = getSquareCenter(from)
    const end = getSquareCenter(to)
    if (!start || !end) return

    // Create group for arrow
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.classList.add('arrow', className)

    // Calculate vector
    const dx = end.x - start.x
    const dy = end.y - start.y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len === 0) return

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', `${start.x}%`)
    line.setAttribute('y1', `${start.y}%`)
    line.setAttribute('x2', `${end.x}%`)
    line.setAttribute('y2', `${end.y}%`)
    line.setAttribute('stroke-width', '1.5%')

    // Arrowhead
    const angle = Math.atan2(dy, dx)
    const headLen = 4 // %
    const headAngle = Math.PI / 6

    const x2 = end.x - headLen * Math.cos(angle - headAngle)
    const y2 = end.y - headLen * Math.sin(angle - headAngle)
    const x3 = end.x - headLen * Math.cos(angle + headAngle)
    const y3 = end.y - headLen * Math.sin(angle + headAngle)

    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    polygon.setAttribute('points', `${end.x},${end.y} ${x2},${y2} ${x3},${y3}`)
    polygon.classList.add('arrow-head')

    g.appendChild(line)
    g.appendChild(polygon)
    svg.appendChild(g)
  }

  const render = () => {
    clearAll()
    if (lastMoveArrow) _draw(lastMoveArrow.from, lastMoveArrow.to, 'arrow-last')
    userArrows.forEach(a => _draw(a.from, a.to, 'arrow-user'))
    engineArrows.forEach(a => _draw(a.from, a.to, a.type))
    vizLines.forEach(l => _drawLine(l.from, l.to, l.className))
  }

  const setVizLines = (lines) => {
    vizLines = lines || []
    render()
  }

  const addUserArrow = (from, to) => {
    // Check if exists, remove if so (toggle)
    const idx = userArrows.findIndex(a => a.from === from && a.to === to)
    if (idx !== -1) {
      userArrows.splice(idx, 1)
    } else {
      userArrows.push({ from, to })
    }
    render()
  }

  const updateEngineArrow = (from, to, type) => {
    engineArrows = engineArrows.filter(a => a.type !== type)
    engineArrows.push({ from, to, type })
    render()
  }

  const setEngineArrow = (from, to, type = 'arrow-best') => {
    updateEngineArrow(from, to, type)
  }

  const clearEngineArrows = () => {
    engineArrows = []
    render()
  }

  const clearUserArrows = () => {
    userArrows = []
    render()
  }

  const toggleUserHighlight = (alg) => {
    const colors = ['highlight-red', 'highlight-green', 'highlight-blue', 'highlight-yellow']
    const current = userHighlights[alg]
    let next = null
    if (!current) {
      next = colors[0]
    } else {
      const idx = colors.indexOf(current)
      if (idx === colors.length - 1) {
        next = null // remove
      } else {
        next = colors[idx + 1]
      }
    }

    if (next) userHighlights[alg] = next
    else delete userHighlights[alg]
  }

  const getUserHighlight = (alg) => {
    return userHighlights[alg]
  }

  const clearUserHighlights = () => {
    userHighlights = {}
  }

  const setLastMoveArrow = (from, to) => {
    lastMoveArrow = { from, to }
    render()
  }

  const clearLastMoveArrow = () => {
    lastMoveArrow = null
    render()
  }

  return {
    setFlipped: (val) => { isFlipped = val; render() },
    setEngineArrow,
    clearEngineArrows,
    addUserArrow,
    clearUserArrows,
    toggleUserHighlight,
    getUserHighlight,
    clearUserHighlights,
    setLastMoveArrow,
    clearLastMoveArrow,
    updateEngineArrow,
    setVizLines,
    render
  }
})()
