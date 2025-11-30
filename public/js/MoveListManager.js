/* eslint-env browser */

window.MoveListManager = class MoveListManager {
  constructor (game, gameManager, uiManager) {
    this.game = game
    this.gameManager = gameManager
    this.uiManager = uiManager
    this.container = document.getElementById('move-history')
    this.searchInput = document.getElementById('history-search-input')
    this.scrollLockCheckbox = document.getElementById('history-scroll-lock')
    this.contextMenu = document.getElementById('move-context-menu')
    this.nagModal = document.getElementById('nag-modal')
    this.activeMoveIndex = -1
    this.filterText = ''

    this._setupEvents()
    this._renderNagModal()
  }

  _setupEvents () {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.filterText = e.target.value.toLowerCase()
        if (this.lastRenderArgs) {
          this.render(this.lastRenderArgs.currentViewIndex, this.lastRenderArgs.onHistoryClick, this.lastRenderArgs.notation)
        }
      })
    }

    document.addEventListener('click', () => {
      if (this.contextMenu && this.contextMenu.style.display === 'block') {
        this.contextMenu.style.display = 'none'
      }
    })

    if (this.contextMenu) {
      this.contextMenu.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
          this._handleContextAction(e.target.dataset.action)
        })
      })
    }

    const closeNag = document.getElementById('close-nag-modal')
    if (closeNag) {
      closeNag.addEventListener('click', () => this.nagModal.classList.remove('active'))
    }
  }

  _renderNagModal () {
    const grid = this.nagModal ? this.nagModal.querySelector('.nag-grid') : null
    if (!grid) return
    const nags = [
      { code: '$1', label: '!', desc: 'Good move' },
      { code: '$2', label: '?', desc: 'Mistake' },
      { code: '$3', label: '!!', desc: 'Brilliant' },
      { code: '$4', label: '??', desc: 'Blunder' },
      { code: '$5', label: '!?', desc: 'Interesting' },
      { code: '$6', label: '?!', desc: 'Dubious' },
      { code: '$10', label: '=', desc: 'Drawish' },
      { code: '$13', label: '∞', desc: 'Unclear' },
      { code: '$14', label: '⩲', desc: 'White slight adv' },
      { code: '$15', label: '⩱', desc: 'Black slight adv' },
      { code: '$16', label: '±', desc: 'White mod adv' },
      { code: '$17', label: '∓', desc: 'Black mod adv' },
      { code: '$18', label: '+-', desc: 'White win' },
      { code: '$19', label: '-+', desc: 'Black win' }
    ]

    nags.forEach(nag => {
      const btn = document.createElement('button')
      btn.className = 'nag-btn'
      btn.textContent = `${nag.label} (${nag.desc})`
      btn.style.fontSize = '12px'
      btn.style.padding = '5px'
      btn.style.cursor = 'pointer'
      btn.addEventListener('click', () => {
        this._applyNag(nag.code)
        this.nagModal.classList.remove('active')
      })
      grid.appendChild(btn)
    })
  }

  render (currentViewIndex, onHistoryClick, notation = 'san') {
    this.lastRenderArgs = { currentViewIndex, onHistoryClick, notation }
    const history = this.game.history({ verbose: true })
    const metadata = this.gameManager.moveMetadata || []
    this.container.innerHTML = ''

    for (let i = 0; i < history.length; i += 2) {
      this._processRow(i, history, metadata, currentViewIndex, onHistoryClick, notation)
    }

    if (this.scrollLockCheckbox && this.scrollLockCheckbox.checked && currentViewIndex === -1) {
      this.container.scrollTop = this.container.scrollHeight
    }
  }

  _processRow (i, history, metadata, currentViewIndex, onHistoryClick, notation) {
    const moveNum = Math.floor(i / 2) + 1
    const whiteMoveObj = history[i]
    const blackMoveObj = history[i + 1]
    const whiteMeta = metadata[i] || {}
    const blackMeta = metadata[i + 1] || {}

    const getStr = (m) => notation === 'lan' ? (m.from + m.to + (m.promotion || '')) : m.san
    const whiteSan = getStr(whiteMoveObj)
    const blackSan = blackMoveObj ? getStr(blackMoveObj) : ''

    if (this.filterText) {
      const text = `${moveNum}. ${whiteSan} ${blackSan}`.toLowerCase()
      if (!text.includes(this.filterText)) return
    }

    const rowDiv = this._createRowElement(moveNum, whiteSan, whiteMeta, i, currentViewIndex, onHistoryClick)
    if (blackMoveObj) {
      const blackWrapper = this._createMoveElement(blackSan, blackMeta, i + 1, currentViewIndex, onHistoryClick)
      rowDiv.appendChild(blackWrapper)
    }
    this._appendComments(rowDiv, whiteMeta, blackMeta)
    this.container.appendChild(rowDiv)
  }

  _createRowElement (moveNum, whiteSan, whiteMeta, i, currentViewIndex, onHistoryClick) {
    const rowDiv = document.createElement('div')
    rowDiv.className = 'history-row'
    rowDiv.style.display = 'flex'
    rowDiv.style.flexWrap = 'wrap'
    rowDiv.style.borderBottom = '1px solid var(--grafana-border)'

    const numDiv = document.createElement('div')
    numDiv.classList.add('move-number')
    numDiv.textContent = moveNum + '.'
    rowDiv.appendChild(numDiv)

    const whiteWrapper = this._createMoveElement(whiteSan, whiteMeta, i, currentViewIndex, onHistoryClick)
    rowDiv.appendChild(whiteWrapper)
    return rowDiv
  }

  _appendComments (rowDiv, whiteMeta, blackMeta) {
    if (whiteMeta.comment || (blackMeta && blackMeta.comment)) {
      const commentDiv = document.createElement('div')
      commentDiv.style.width = '100%'
      commentDiv.style.fontSize = '11px'
      commentDiv.style.color = 'var(--grafana-text-secondary)'
      commentDiv.style.padding = '2px 5px'
      commentDiv.style.fontStyle = 'italic'
      const wC = whiteMeta.comment ? `(W) ${whiteMeta.comment} ` : ''
      const bC = blackMeta && blackMeta.comment ? `(B) ${blackMeta.comment}` : ''
      commentDiv.textContent = wC + bC
      rowDiv.appendChild(commentDiv)
    }
  }

  _createMoveElement (san, meta, index, currentViewIndex, onClick) {
    const div = document.createElement('div')
    div.classList.add('move-san')

    let label = san
    if (meta.nag) {
      const nagMap = { $1: '!', $2: '?', $3: '!!', $4: '??', $5: '!?', $6: '?!' }
      if (nagMap[meta.nag]) label += nagMap[meta.nag]
      else if (meta.nag.startsWith('$')) label += meta.nag
    }
    if (meta.annotation) label += meta.annotation

    div.textContent = label

    if (currentViewIndex === index) div.classList.add('active')

    div.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      this.activeMoveIndex = index
      if (this.contextMenu) {
        this.contextMenu.style.top = `${e.pageY}px`
        this.contextMenu.style.left = `${e.pageX}px`
        this.contextMenu.style.display = 'block'
      }
    })

    div.addEventListener('click', () => onClick(index))
    return div
  }

  _handleContextAction (action) {
    if (this.activeMoveIndex === -1) return
    const meta = this.gameManager.moveMetadata[this.activeMoveIndex] || {}

    if (action === 'comment') this._actionComment(meta)
    else if (action === 'nag') this._actionNag()
    else if (action === 'delete-rest') this._actionDeleteRest()

    if (this.contextMenu) this.contextMenu.style.display = 'none'
  }

  _actionComment (meta) {
    // eslint-disable-next-line no-alert
    const comment = prompt('Enter comment:', meta.comment || '')
    if (comment !== null) {
      meta.comment = comment
      this._updateMeta(this.activeMoveIndex, meta)
    }
  }

  _actionNag () {
    if (this.nagModal) this.nagModal.classList.add('active')
  }

  _actionDeleteRest () {
    // eslint-disable-next-line no-alert
    if (confirm('Delete all moves after this one?')) {
      this._deleteRest(this.activeMoveIndex)
    }
  }

  _applyNag (nagCode) {
    if (this.activeMoveIndex === -1) return
    const meta = this.gameManager.moveMetadata[this.activeMoveIndex] || {}
    meta.nag = nagCode
    this._updateMeta(this.activeMoveIndex, meta)
  }

  _updateMeta (index, newMeta) {
    while (this.gameManager.moveMetadata.length <= index) {
      this.gameManager.moveMetadata.push({})
    }
    this.gameManager.moveMetadata[index] = newMeta
    if (this.lastRenderArgs) {
      this.render(this.lastRenderArgs.currentViewIndex, this.lastRenderArgs.onHistoryClick, this.lastRenderArgs.notation)
    }
  }

  _deleteRest (index) {
    const history = this.game.history()
    const targetPly = index + 1
    const currentPly = history.length
    const undoCount = currentPly - targetPly
    if (undoCount < 0) return

    for (let i = 0; i < undoCount; i++) {
      this.gameManager.undo()
    }

    this.gameManager.moveMetadata = this.gameManager.moveMetadata.slice(0, targetPly)

    if (this.lastRenderArgs) {
      this.render(-1, this.lastRenderArgs.onHistoryClick, this.lastRenderArgs.notation)
    }
  }
}
