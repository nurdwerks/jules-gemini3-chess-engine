class InfoManager {
  constructor (uiManager) {
    this.uiManager = uiManager
    this.modal = document.getElementById('info-modal')
    this.modalTitle = document.getElementById('info-modal-title')
    this.modalContent = document.getElementById('info-modal-content')
    this.closeBtn = document.getElementById('close-info-modal')

    this.bindEvents()
  }

  bindEvents () {
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close())

    // Close on click outside
    window.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close()
    })

    const changelogBtn = document.getElementById('changelog-btn')
    if (changelogBtn) changelogBtn.addEventListener('click', () => this.showChangelog())

    const licenseBtn = document.getElementById('license-btn')
    if (licenseBtn) licenseBtn.addEventListener('click', () => this.showLicense())

    const creditsBtn = document.getElementById('credits-btn')
    if (creditsBtn) creditsBtn.addEventListener('click', () => this.showCredits())

    const shortcutsBtn = document.getElementById('shortcuts-btn')
    if (shortcutsBtn) shortcutsBtn.addEventListener('click', () => this.showShortcuts())

    const sponsorBtn = document.getElementById('sponsor-btn')
    if (sponsorBtn) sponsorBtn.addEventListener('click', () => window.open('https://github.com/sponsors', '_blank'))

    const feedbackBtn = document.getElementById('feedback-btn')
    if (feedbackBtn) feedbackBtn.addEventListener('click', () => window.open('https://github.com/jules-gemini/chess-engine/issues', '_blank'))
  }

  open (title, content) {
    this.modalTitle.textContent = title
    this.modalContent.innerHTML = content
    this.modal.classList.add('active')
  }

  close () {
    this.modal.classList.remove('active')
  }

  showChangelog () {
    // Attempt to fetch from server if route exists, else generic
    return fetch('/changelog')
      .then(res => {
        if (!res.ok) throw new Error('Not found')
        return res.text()
      })
      .then(text => this.open('Changelog', text))
      .catch(() => this.open('Changelog', 'Could not load changelog.'))
  }

  showLicense () {
    return fetch('/license')
      .then(res => {
        if (!res.ok) throw new Error('Not found')
        return res.text()
      })
      .then(text => this.open('License', text))
      .catch(() => this.open('License', 'Could not load license.'))
  }

  showCredits () {
    const credits = `
      <h3>Jules & Gemini Chess Engine</h3>
      <p>Developed as a testbed for complex software engineering tasks.</p>

      <h4>Libraries</h4>
      <ul>
        <li><strong>chess.js</strong> - Move generation and validation</li>
        <li><strong>D3.js</strong> - Tree visualization</li>
        <li><strong>playwright</strong> - End-to-end testing</li>
        <li><strong>jest</strong> - Unit testing</li>
      </ul>

      <h4>Assets</h4>
      <ul>
        <li>Piece sets: Cburnett, Merida, Alpha, Pixel (Custom)</li>
        <li>Sound effects: Lichess (Standard)</li>
      </ul>

      <h4>Special Thanks</h4>
      <p>Open source chess community.</p>
    `
    this.open('Credits', credits)
  }

  showShortcuts () {
    const shortcuts = `
      <h3>Keyboard Shortcuts</h3>
      <table style="width: 100%; text-align: left;">
        <tr><th>Key</th><th>Action</th></tr>
        <tr><td>Arrow Left</td><td>Undo Move (Analysis) / Replay Back</td></tr>
        <tr><td>Arrow Right</td><td>Replay Forward</td></tr>
        <tr><td>Arrow Up</td><td>Start/End</td></tr>
        <tr><td>Arrow Down</td><td>Start/End</td></tr>
        <tr><td>Space</td><td>Force Engine Move</td></tr>
        <tr><td>Escape</td><td>Toggle Zen Mode</td></tr>
        <tr><td>F</td><td>Flip Board</td></tr>
      </table>
    `
    this.open('Shortcuts', shortcuts)
  }
}

if (typeof module !== 'undefined') {
  module.exports = InfoManager
}
