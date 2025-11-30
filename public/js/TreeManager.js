/* eslint-env browser */
/* global d3 */

window.TreeManager = class TreeManager {
  constructor (socketHandler, uiManager) {
    this.socketHandler = socketHandler
    this.uiManager = uiManager
    this.modal = document.getElementById('tree-modal')
    this.container = document.getElementById('d3-tree-container')

    this._setupEvents()
  }

  _setupEvents () {
    const btn = document.getElementById('show-tree-btn')
    if (btn) {
      btn.addEventListener('click', () => {
        this.generateAndShow()
      })
    }
    const closeBtn = document.getElementById('close-tree-modal')
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.modal.classList.remove('active')
      })
    }
  }

  generateAndShow () {
    this.uiManager.showToast('Generating Search Tree (Depth 2)...', 'info')
    this.socketHandler.send('debug_tree')
  }

  onTreeReady () {
    this.modal.classList.add('active')
    this.fetchAndRender()
  }

  fetchAndRender () {
    fetch('/debug_tree.json')
      .then(res => res.json())
      .then(data => this.render(data))
      .catch(err => {
        console.error(err)
        this.uiManager.showToast('Failed to load tree: ' + err.message, 'error')
      })
  }

  render (data) {
    if (!window.d3) {
      this.container.textContent = 'D3 library not loaded.'
      return
    }

    this.container.innerHTML = ''
    const width = 1200
    const height = 800

    // Transform flat nodes list or nested?
    // Engine outputs { nodes: [root1, root2...] } where roots have children.
    // We create a single root for D3 hierarchy.
    const rootData = { name: 'Root', children: data.nodes }

    const svg = d3.select('#d3-tree-container').append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .call(d3.zoom().on('zoom', (event) => {
        g.attr('transform', event.transform)
      }))
      .append('g')

    const g = svg.append('g')
      .attr('transform', 'translate(50,50)')

    const treeLayout = d3.tree().size([height - 100, width - 200])
    const root = d3.hierarchy(rootData, d => d.children)

    update(root)

    function update (source) {
      const treeData = treeLayout(root)
      const nodes = treeData.descendants()
      const links = treeData.links()

      nodes.forEach(d => { d.y = d.depth * 150 })

      // Nodes
      const node = g.selectAll('g.node')
        .data(nodes, d => d.id || (d.id = Math.random())) // Use persistent ID if available

      const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${source.y0 || source.y},${source.x0 || source.x})`)
        .on('click', click)
        .style('cursor', 'pointer')

      nodeEnter.append('circle')
        .attr('r', 10)
        .style('fill', d => d._children ? 'lightsteelblue' : '#fff')
        .style('stroke', 'steelblue')
        .style('stroke-width', '3px')

      nodeEnter.append('text')
        .attr('dy', '.35em')
        .attr('x', d => d.children || d._children ? -13 : 13)
        .attr('text-anchor', d => d.children || d._children ? 'end' : 'start')
        .text(d => d.data.move || d.data.name || '')
        .style('font', '12px sans-serif')
        .style('fill', '#333')

      nodeEnter.append('text')
        .attr('dy', '1.5em')
        .attr('x', 0)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('fill', '#666')
        .text(d => d.data.score !== undefined ? d.data.score : '')

      const nodeUpdate = node.merge(nodeEnter).transition().duration(200)
        .attr('transform', d => `translate(${d.y},${d.x})`)

      nodeUpdate.select('circle')
        .style('fill', d => d._children ? 'lightsteelblue' : '#fff')

      const nodeExit = node.exit().transition().duration(200)
        .attr('transform', d => `translate(${source.y},${source.x})`)
        .remove()

      nodeExit.select('circle').attr('r', 1e-6)
      nodeExit.select('text').style('fill-opacity', 1e-6)

      // Links
      const link = g.selectAll('path.link')
        .data(links, d => d.target.id)

      const linkEnter = link.enter().insert('path', 'g')
        .attr('class', 'link')
        .attr('d', d => {
          const o = { x: source.x0 || source.x, y: source.y0 || source.y }
          return diagonal(o, o)
        })
        .style('fill', 'none')
        .style('stroke', '#ccc')
        .style('stroke-width', '2px')

      link.merge(linkEnter).transition().duration(200)
        .attr('d', d => diagonal(d.source, d.target))

      link.exit().transition().duration(200)
        .attr('d', d => {
          const o = { x: source.x, y: source.y }
          return diagonal(o, o)
        })
        .remove()

      nodes.forEach(d => {
        d.x0 = d.x
        d.y0 = d.y
      })

      function click (event, d) {
        if (d.children) {
          d._children = d.children
          d.children = null
        } else {
          d.children = d._children
          d._children = null
        }
        update(d)
      }
    }

    function diagonal (s, d) {
      return `M ${s.y} ${s.x}
                    C ${(s.y + d.y) / 2} ${s.x},
                      ${(s.y + d.y) / 2} ${d.x},
                      ${d.y} ${d.x}`
    }
  }
}
