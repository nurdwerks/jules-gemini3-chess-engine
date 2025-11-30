/* eslint-env browser */
/* global localStorage, document */

class LanguageManager {
  constructor () {
    this.currentLang = localStorage.getItem('language') || 'en'
    this.translations = {
      en: {
        'new-game-btn': 'New Game',
        'reset-engine-btn': 'Reset Engine',
        'flip-board-btn': 'Flip Board',
        'analysis-mode-label': 'Analysis Mode',
        'settings-tab': 'Settings',
        'game-tab': 'Game',
        'engine-tab': 'Engine',
        'visuals-tab': 'Visuals',
        'tools-tab': 'Tools',
        'status-ready': 'Ready',
        'status-thinking': 'Thinking...',
        'status-checkmate': 'Checkmate!',
        'status-draw': 'Draw',
        'settings-title': 'Settings',
        'language-label': 'Language:',
        'battery-saver-label': 'Battery Saver:',
        'embed-btn': 'Embed',
        'export-btn': 'Export',
        'offline-badge': 'Offline'
      },
      es: {
        'new-game-btn': 'Nueva Partida',
        'reset-engine-btn': 'Reiniciar Motor',
        'flip-board-btn': 'Girar Tablero',
        'analysis-mode-label': 'Modo Análisis',
        'settings-tab': 'Ajustes',
        'game-tab': 'Partida',
        'engine-tab': 'Motor',
        'visuals-tab': 'Visuales',
        'tools-tab': 'Herramientas',
        'status-ready': 'Listo',
        'status-thinking': 'Pensando...',
        'status-checkmate': '¡Jaque Mate!',
        'status-draw': 'Tablas',
        'settings-title': 'Ajustes',
        'language-label': 'Idioma:',
        'battery-saver-label': 'Ahorro de Batería:',
        'embed-btn': 'Incrustar',
        'export-btn': 'Exportar',
        'offline-badge': 'Sin Conexión'
      }
    }
    this.elements = {}
  }

  init () {
    this._bindEvents()
    this.setLanguage(this.currentLang)
  }

  _bindEvents () {
    const selector = document.getElementById('language-select')
    if (selector) {
      selector.value = this.currentLang
      selector.addEventListener('change', (e) => {
        this.setLanguage(e.target.value)
      })
    }
  }

  setLanguage (lang) {
    if (!this.translations[lang]) return
    this.currentLang = lang
    localStorage.setItem('language', lang)
    const t = this.translations[lang]

    // Update elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n
      if (t[key]) {
        if (el.tagName === 'INPUT' && el.type === 'button') {
          el.value = t[key]
        } else {
          el.textContent = t[key]
        }
      }
    })

    // Also update generic title attributes if needed
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.dataset.i18nTitle
      if (t[key]) el.title = t[key]
    })
  }

  getText (key) {
    return this.translations[this.currentLang][key] || key
  }
}

// Export for tests
if (typeof module !== 'undefined') {
  module.exports = LanguageManager
} else {
  window.LanguageManager = LanguageManager
}
