/* eslint-env browser */

window.TutorialManager = class TutorialManager {
  constructor (uiManager) {
    this.uiManager = uiManager
    this.steps = [
      {
        target: null,
        title: 'Welcome to Jules & Gemini Chess!',
        text: 'This is a powerful chess engine built with Node.js and WebSockets. Let\'s take a quick tour.'
      },
      {
        target: 'chessboard',
        title: 'The Board',
        text: 'This is where the action happens. Drag pieces to move, or click squares. You can also customize the board theme in Settings.'
      },
      {
        target: '.controls-panel',
        title: 'Game Controls',
        text: 'Start new games, flip the board, or play against the engine here. You can also try different game modes like "Engine Duel" or "Vote Chess".'
      },
      {
        target: '.import-export-panel',
        title: 'Import & Export',
        text: 'Load positions from FEN/PGN, or export your game. You can now also export GIFs and share via QR codes!'
      },
      {
        target: '.uci-options-panel',
        title: 'Engine Options',
        text: 'Tweak the engine\'s strength, threads, and hash size. Use "Presets" for quick configuration.'
      },
      {
        target: null,
        title: 'Have Fun!',
        text: 'Enjoy your game! If you find any bugs, report them via the Feedback button.'
      }
    ]
    this.currentStep = 0
    this.overlay = null
    this.tooltip = null
  }

  start () {
    this.currentStep = 0
    this.createOverlay()
    this.showStep()
  }

  createOverlay () {
    this.overlay = document.createElement('div')
    this.overlay.style.position = 'fixed'
    this.overlay.style.top = '0'
    this.overlay.style.left = '0'
    this.overlay.style.width = '100%'
    this.overlay.style.height = '100%'
    this.overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
    this.overlay.style.zIndex = '9998'
    document.body.appendChild(this.overlay)

    this.tooltip = document.createElement('div')
    this.tooltip.className = 'tutorial-tooltip'
    this.tooltip.style.position = 'absolute'
    this.tooltip.style.backgroundColor = 'var(--grafana-panel-bg)'
    this.tooltip.style.border = '1px solid var(--grafana-accent-blue)'
    this.tooltip.style.padding = '20px'
    this.tooltip.style.borderRadius = '4px'
    this.tooltip.style.zIndex = '9999'
    this.tooltip.style.maxWidth = '300px'
    this.tooltip.style.color = 'var(--grafana-text-primary)'
    this.tooltip.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)'

    this.nextBtn = document.createElement('button')
    this.nextBtn.textContent = 'Next'
    this.nextBtn.onclick = () => this.nextStep()

    this.skipBtn = document.createElement('button')
    this.skipBtn.textContent = 'Skip'
    this.skipBtn.style.backgroundColor = 'transparent'
    this.skipBtn.style.border = '1px solid var(--grafana-text-secondary)'
    this.skipBtn.style.marginLeft = '10px'
    this.skipBtn.onclick = () => this.end()

    document.body.appendChild(this.tooltip)
  }

  showStep () {
    const step = this.steps[this.currentStep]
    if (!step) {
      this.end()
      return
    }

    let targetEl = null
    if (step.target) {
      targetEl = document.getElementById(step.target) || document.querySelector(step.target)
    }

    this.tooltip.innerHTML = `<h3>${step.title}</h3><p>${step.text}</p>`
    const btnContainer = document.createElement('div')
    btnContainer.style.marginTop = '10px'
    btnContainer.style.textAlign = 'right'

    if (this.currentStep === this.steps.length - 1) {
      this.nextBtn.textContent = 'Finish'
    } else {
      this.nextBtn.textContent = 'Next'
    }

    btnContainer.appendChild(this.nextBtn)
    btnContainer.appendChild(this.skipBtn)
    this.tooltip.appendChild(btnContainer)

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const rect = targetEl.getBoundingClientRect()

      targetEl.style.position = 'relative'
      targetEl.style.zIndex = '9999'
      targetEl.classList.add('tutorial-highlight')

      let top = rect.bottom + 10
      const left = rect.left

      if (top + 200 > window.innerHeight) {
        top = rect.top - 200
      }

      this.tooltip.style.top = `${top}px`
      this.tooltip.style.left = `${left}px`
      this.tooltip.style.transform = 'none'
    } else {
      this.tooltip.style.top = '50%'
      this.tooltip.style.left = '50%'
      this.tooltip.style.transform = 'translate(-50%, -50%)'
    }
  }

  nextStep () {
    const step = this.steps[this.currentStep]
    if (step && step.target) {
      const el = document.getElementById(step.target) || document.querySelector(step.target)
      if (el) {
        el.style.zIndex = ''
        el.style.position = ''
        el.classList.remove('tutorial-highlight')
      }
    }

    this.currentStep++
    this.showStep()
  }

  end () {
    if (this.overlay) document.body.removeChild(this.overlay)
    if (this.tooltip) document.body.removeChild(this.tooltip)

    const step = this.steps[this.currentStep]
    if (step && step.target) {
      const el = document.getElementById(step.target) || document.querySelector(step.target)
      if (el) {
        el.style.zIndex = ''
        el.style.position = ''
        el.classList.remove('tutorial-highlight')
      }
    }
  }
}
