/* eslint-env browser */

window.OpeningExplorer = class OpeningExplorer {
  constructor (gameManager, socketHandler, uiManager) {
    this.gameManager = gameManager
    this.socketHandler = socketHandler
    this.uiManager = uiManager
    this.panel = document.getElementById('opening-panel')
    this.tableBody = document.querySelector('#opening-table tbody')
    this.nameEl = document.getElementById('opening-name')
    this.ecoEl = document.getElementById('opening-eco')
    this.isOpen = false

    this._setupEvents()
  }

  _setupEvents () {
    const btn = document.getElementById('opening-explorer-btn')
    if (btn) {
      btn.addEventListener('click', () => {
        this.toggle()
      })
    }
    const closeBtn = document.getElementById('close-opening-panel-btn')
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.close()
      })
    }
  }

  toggle () {
    if (this.isOpen) this.close()
    else this.open()
  }

  open () {
    this.isOpen = true
    this.panel.style.display = 'flex'
    this.refresh()
  }

  close () {
    this.isOpen = false
    this.panel.style.display = 'none'
  }

  refresh () {
    if (!this.isOpen) return
    this.socketHandler.send('book')
    this._updateOpeningName()
  }

  handleBookInfo (jsonStr) {
    try {
      const moves = JSON.parse(jsonStr)
      this.renderMoves(moves)
    } catch (e) {
      console.error('Failed to parse book moves', e)
    }
  }

  renderMoves (moves) {
    if (!this.tableBody) return
    this.tableBody.innerHTML = ''
    const totalWeight = moves.reduce((sum, m) => sum + m.weight, 0)

    moves.forEach(m => {
      const tr = document.createElement('tr')
      const pct = totalWeight > 0 ? ((m.weight / totalWeight) * 100).toFixed(1) : 0
      tr.innerHTML = `
                <td style="padding: 5px;">${m.move}</td>
                <td style="padding: 5px;">${m.weight}</td>
                <td style="padding: 5px;">${pct}%</td>
            `
      tr.style.cursor = 'pointer'
      tr.style.borderBottom = '1px solid var(--grafana-border)'
      tr.addEventListener('mouseenter', () => { tr.style.backgroundColor = 'var(--grafana-input-bg)' })
      tr.addEventListener('mouseleave', () => { tr.style.backgroundColor = 'transparent' })

      tr.addEventListener('click', () => {
        const fromSq = m.move.substring(0, 2)
        const toSq = m.move.substring(2, 4)
        const promo = m.move.length > 4 ? m.move[4] : undefined
        this.gameManager.performMove({ from: fromSq, to: toSq, promotion: promo })
      })
      this.tableBody.appendChild(tr)
    })
  }

  _updateOpeningName () {
    // ECO Database Placeholder
    // I will implement a basic check here or later.
  }
}
