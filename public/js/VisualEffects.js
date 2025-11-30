/* global requestAnimationFrame, cancelAnimationFrame */

class VisualEffects {
  constructor (uiManager) {
    this.uiManager = uiManager
    this.canvas = document.getElementById('confetti-canvas')
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null
    this.particles = []
    this.animationId = null

    this.bindEvents()
  }

  bindEvents () {
    const mindControl = document.getElementById('mind-control-mode')
    if (mindControl) {
      mindControl.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.uiManager.showToast('Searching for EEG device...', 'info')
          setTimeout(() => {
            this.uiManager.showToast('No Neuralink found. Using fallback: Mouse.', 'warning')
            e.target.checked = false
          }, 2000)
        }
      })
    }
  }

  triggerShake () {
    const board = document.getElementById('chessboard')
    if (board) {
      board.classList.remove('shake')
      // Trigger reflow
      const _ = board.offsetWidth // eslint-disable-line no-unused-vars
      board.classList.add('shake')
      setTimeout(() => board.classList.remove('shake'), 500)
    }
  }

  startConfetti () {
    if (!this.canvas || !this.ctx) return
    this.canvas.style.display = 'block'
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight

    this.particles = []
    const colors = ['#F2495C', '#5794F2', '#73BF69', '#FADE2A', '#EA4AAA']

    for (let i = 0; i < 200; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height - this.canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 5,
        speedY: Math.random() * 3 + 2,
        speedX: Math.random() * 2 - 1,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 10 - 5
      })
    }

    if (this.animationId) cancelAnimationFrame(this.animationId)
    this.animateConfetti()

    setTimeout(() => this.stopConfetti(), 5000)
  }

  animateConfetti () {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.particles.forEach(p => {
      p.y += p.speedY
      p.x += p.speedX
      p.rotation += p.rotationSpeed

      this.ctx.save()
      this.ctx.translate(p.x, p.y)
      this.ctx.rotate(p.rotation * Math.PI / 180)
      this.ctx.fillStyle = p.color
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
      this.ctx.restore()

      if (p.y > this.canvas.height) {
        p.y = -20
        p.x = Math.random() * this.canvas.width
      }
    })

    this.animationId = requestAnimationFrame(() => this.animateConfetti())
  }

  stopConfetti () {
    if (this.animationId) cancelAnimationFrame(this.animationId)
    if (this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.canvas.style.display = 'none'
    }
  }
}

if (typeof module !== 'undefined') {
  module.exports = VisualEffects
}
