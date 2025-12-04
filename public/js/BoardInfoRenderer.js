/* eslint-env browser */

window.BoardInfoRenderer = class BoardInfoRenderer {
  constructor (elements) {
    this.elements = elements
  }

  updateCapturedPieces (game, startingFen, pieceSet, isFlipped) {
    if (!this.elements.topCaptured || !this.elements.bottomCaptured) return

    const board = game.board()
    const counts = this._calculateBoardCounts(board)
    const startCounts = this._getPieceCounts(startingFen)

    this._renderCapturedUI(counts, startCounts, pieceSet, isFlipped)
    this._renderMaterialDiffUI(counts, isFlipped)
  }

  updateAvatars (userAvatar, engineAvatar, isFlipped) {
    const topAvatar = document.getElementById('top-player-avatar')
    const bottomAvatar = document.getElementById('bottom-player-avatar')

    if (!topAvatar || !bottomAvatar) return

    // isFlipped = false: Bottom = User (White), Top = Engine (Black)
    // isFlipped = true: Bottom = Engine (Black), Top = User (White)

    const uAvatar = userAvatar || 'images/avatars/default.png'
    const eAvatar = engineAvatar || 'images/avatars/default.png'

    if (isFlipped) {
      topAvatar.src = uAvatar
      bottomAvatar.src = eAvatar
    } else {
      bottomAvatar.src = uAvatar
      topAvatar.src = eAvatar
    }

    // Ensure they are visible if src is valid (handled by onerror in HTML, but we can force display here)
    topAvatar.style.display = 'block'
    bottomAvatar.style.display = 'block'
  }

  updateClocks (whiteTime, blackTime, isFlipped, isNoTimer) {
    const format = (ms) => {
      const s = Math.ceil(ms / 1000)
      return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
    }
    let wTime = format(whiteTime)
    let bTime = format(blackTime)

    if (isNoTimer) {
      wTime = '∞'
      bTime = '∞'
    }

    if (isFlipped) {
      this.elements.topPlayerClock.textContent = wTime
      this.elements.bottomPlayerClock.textContent = bTime
    } else {
      this.elements.topPlayerClock.textContent = bTime
      this.elements.bottomPlayerClock.textContent = wTime
    }
  }

  _calculateBoardCounts (board) {
    const counts = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }
    }
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c]
        if (piece) counts[piece.color][piece.type]++
      }
    }
    return counts
  }

  _getPieceCounts (fen) {
    const counts = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }
    }
    if (fen === 'startpos') {
      fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    }
    const boardPart = fen.split(' ')[0]
    for (const char of boardPart) {
      if (['P', 'N', 'B', 'R', 'Q', 'K'].includes(char)) counts.w[char.toLowerCase()]++
      else if (['p', 'n', 'b', 'r', 'q', 'k'].includes(char)) counts.b[char]++
    }
    return counts
  }

  _renderCapturedUI (counts, startCounts, pieceSet, isFlipped) {
    const topColor = isFlipped ? 'w' : 'b'
    const topOpponent = topColor === 'w' ? 'b' : 'w'
    const bottomOpponent = topColor

    this._renderCaptured(counts[topOpponent], startCounts[topOpponent], this.elements.topCaptured, topOpponent, pieceSet)
    this._renderCaptured(counts[bottomOpponent], startCounts[bottomOpponent], this.elements.bottomCaptured, bottomOpponent, pieceSet)
  }

  _renderCaptured (current, start, container, color, pieceSet) {
    container.innerHTML = ''
    const types = ['q', 'r', 'b', 'n', 'p']
    types.forEach(type => {
      const diff = Math.max(0, start[type] - current[type])
      for (let i = 0; i < diff; i++) {
        const img = document.createElement('img')
        img.src = `images/${pieceSet}/${color}${type}.svg`
        container.appendChild(img)
      }
    })
  }

  _renderMaterialDiffUI (counts, isFlipped) {
    const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
    const wMat = this._calculateMaterial(counts.w, values)
    const bMat = this._calculateMaterial(counts.b, values)
    const diff = wMat - bMat

    this.elements.topMaterialDiff.textContent = ''
    this.elements.bottomMaterialDiff.textContent = ''
    if (this.elements.topMaterialBar) this.elements.topMaterialBar.style.width = '0%'
    if (this.elements.bottomMaterialBar) this.elements.bottomMaterialBar.style.width = '0%'

    if (diff !== 0) {
      const topColor = isFlipped ? 'w' : 'b'
      const absDiff = Math.abs(diff)
      const barWidth = Math.min(100, (absDiff / 20) * 100)

      const leader = diff > 0 ? 'w' : 'b'
      const isTopLeader = leader === topColor

      const targetDiff = isTopLeader ? this.elements.topMaterialDiff : this.elements.bottomMaterialDiff
      const targetBar = isTopLeader ? this.elements.topMaterialBar : this.elements.bottomMaterialBar
      const color = leader === 'w' ? '#E3E3E3' : '#6B6B6B'

      targetDiff.textContent = `+${absDiff}`
      if (targetBar) {
        targetBar.style.width = `${barWidth}%`
        targetBar.style.backgroundColor = color
      }
    }
  }

  _calculateMaterial (counts, values) {
    let sum = 0
    for (const t in counts) {
      sum += counts[t] * values[t]
    }
    return sum
  }
}
