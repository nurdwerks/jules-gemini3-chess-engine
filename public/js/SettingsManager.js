/* global localStorage, Blob, URL, FileReader, confirm, document, window */

class SettingsManager {
  constructor (uiManager, soundManagerClass, accessibilityManager) {
    this.uiManager = uiManager
    this.SoundManager = soundManagerClass
    this.accessibilityManager = accessibilityManager
    this.bindEvents()
  }

  bindEvents () {
    this.bindExportImportEvents()
    this.bindSoundEvents()
    this.bindAccessibilityEvents()
    this.bindAvatarEvents()
  }

  bindExportImportEvents () {
    const exportBtn = document.getElementById('export-settings-btn')
    if (exportBtn) exportBtn.addEventListener('click', () => this.exportSettings())

    const importBtn = document.getElementById('import-settings-btn')
    const importFile = document.getElementById('import-settings-file')
    if (importBtn && importFile) {
      importBtn.addEventListener('click', () => importFile.click())
      importFile.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.importSettings(e.target.files[0])
        }
      })
    }

    const resetBtn = document.getElementById('factory-reset-btn')
    if (resetBtn) resetBtn.addEventListener('click', () => this.factoryReset())
  }

  bindSoundEvents () {
    if (!this.SoundManager) return

    const soundEnabledCb = document.getElementById('sound-enabled')
    if (soundEnabledCb) {
      this.SoundManager.setEnabled(soundEnabledCb.checked)
      soundEnabledCb.addEventListener('change', (e) => this.SoundManager.setEnabled(e.target.checked))
    }

    const volumeControl = document.getElementById('volume-control')
    if (volumeControl) {
      volumeControl.addEventListener('input', (e) => this.SoundManager.setVolume(e.target.value))
    }

    const soundPackUpload = document.getElementById('sound-pack-upload')
    if (soundPackUpload) {
      soundPackUpload.addEventListener('change', (e) => {
        const file = e.target.files[0]
        if (file) {
          this.SoundManager.loadSoundPack(file)
            .then(count => this.uiManager.showToast(`Loaded ${count} custom sounds`, 'success'))
            .catch(() => this.uiManager.showToast('Failed to load sound pack', 'error'))
        }
      })
    }
  }

  bindAvatarEvents () {
    const userAvatarInput = document.getElementById('upload-user-avatar')
    if (userAvatarInput) {
      userAvatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (evt) => {
            const dataUrl = evt.target.result
            localStorage.setItem('user-avatar', dataUrl)
            this.updateAvatars()
            this.uiManager.showToast('User avatar updated', 'success')
          }
          reader.readAsDataURL(file)
        }
      })
    }

    const engineAvatarInput = document.getElementById('upload-engine-avatar')
    if (engineAvatarInput) {
      engineAvatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (evt) => {
            const dataUrl = evt.target.result
            localStorage.setItem('engine-avatar', dataUrl)
            this.updateAvatars()
            this.uiManager.showToast('Engine avatar updated', 'success')
          }
          reader.readAsDataURL(file)
        }
      })
    }
  }

  updateAvatars () {
    const board = document.getElementById('chessboard')
    const isFlipped = board && board.classList.contains('flipped')
    if (this.uiManager.updateAvatars) {
      this.uiManager.updateAvatars(isFlipped)
    }
  }

  bindAccessibilityEvents () {
    const highContrastCb = document.getElementById('high-contrast')
    if (highContrastCb) {
      highContrastCb.addEventListener('change', (e) => {
        if (e.target.checked) document.body.classList.add('high-contrast')
        else document.body.classList.remove('high-contrast')
      })
    }

    if (!this.accessibilityManager) return

    const voiceAnnounceCb = document.getElementById('voice-announce')
    if (voiceAnnounceCb) {
      voiceAnnounceCb.addEventListener('change', (e) => this.accessibilityManager.setVoiceAnnounce(e.target.checked))
    }

    const voiceControlCb = document.getElementById('voice-control')
    if (voiceControlCb) {
      voiceControlCb.addEventListener('change', (e) => this.accessibilityManager.setVoiceControl(e.target.checked))
    }
  }

  exportSettings () {
    const settings = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      settings[key] = localStorage.getItem(key)
    }

    const json = JSON.stringify(settings, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chess_settings_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    this.uiManager.showToast('Settings exported', 'success')
  }

  importSettings (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target.result)
        for (const key in settings) {
          localStorage.setItem(key, settings[key])
        }
        this.uiManager.showToast('Settings imported. Reloading...', 'success')
        setTimeout(() => window.location.reload(), 1000)
      } catch (err) {
        console.error('Import Error:', err)
        this.uiManager.showToast('Failed to import settings', 'error')
      }
    }
    reader.readAsText(file)
  }

  factoryReset () {
    if (confirm('Are you sure you want to reset all settings? This cannot be undone.')) {
      localStorage.clear()
      this.uiManager.showToast('Settings reset. Reloading...', 'success')
      setTimeout(() => window.location.reload(), 1000)
    }
  }
}

if (typeof module !== 'undefined') {
  module.exports = SettingsManager
}
