class BatterySaver {
  constructor (uiManager) {
    this.uiManager = uiManager
    this.isLowPower = false
    this.init()
  }

  async init () {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery()
        this.updateStatus(battery)

        battery.addEventListener('chargingchange', () => this.updateStatus(battery))
        battery.addEventListener('levelchange', () => this.updateStatus(battery))
      } catch (e) {
        console.warn('Battery API failed', e)
      }
    }
  }

  updateStatus (battery) {
    const wasLow = this.isLowPower
    // Consider low power if not charging and level < 20%
    this.isLowPower = !battery.charging && battery.level < 0.20

    if (this.isLowPower && !wasLow) {
      this.enablePowerSave()
    } else if (!this.isLowPower && wasLow) {
      this.disablePowerSave()
    }
  }

  enablePowerSave () {
    this.uiManager.showToast('Low Battery: Enabling Power Saver Mode', 'warning')
    // Force animation speed to Instant (0)
    const speedSelect = document.getElementById('animation-speed')
    if (speedSelect) {
      this.savedSpeed = speedSelect.value
      speedSelect.value = '0'
    }

    // Disable heavy visuals
    document.body.classList.add('power-save')
  }

  disablePowerSave () {
    this.uiManager.showToast('Power Restored', 'success')
    const speedSelect = document.getElementById('animation-speed')
    if (speedSelect && this.savedSpeed) {
      speedSelect.value = this.savedSpeed
    }
    document.body.classList.remove('power-save')
  }
}

if (typeof module !== 'undefined') {
  module.exports = BatterySaver
}
