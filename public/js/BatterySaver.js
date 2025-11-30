/* eslint-env browser */
/* global Event, navigator, document */

class BatterySaver {
  constructor (uiManager) {
    this.uiManager = uiManager
    this.enabled = false
    this.savedSpeed = '200'
  }

  init () {
    const cb = document.getElementById('battery-saver')
    if (cb) {
      cb.addEventListener('change', (e) => this.toggle(e.target.checked))
    }

    // Auto-detect
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        if (!battery.charging && battery.level < 0.2) {
          if (cb) {
            cb.checked = true
            this.toggle(true)
          }
        }
      }).catch(() => {})
    }
  }

  toggle (enable) {
    this.enabled = enable
    const speedSelect = document.getElementById('animation-speed')

    if (enable) {
      document.body.classList.add('battery-saver')
      if (speedSelect) {
        this.savedSpeed = speedSelect.value
        speedSelect.value = '0'
        speedSelect.disabled = true
        speedSelect.dispatchEvent(new Event('change'))
      }
    } else {
      document.body.classList.remove('battery-saver')
      if (speedSelect) {
        speedSelect.disabled = false
        speedSelect.value = this.savedSpeed
        speedSelect.dispatchEvent(new Event('change'))
      }
    }
  }
}

if (typeof module !== 'undefined') {
  module.exports = BatterySaver
} else {
  window.BatterySaver = BatterySaver
}
