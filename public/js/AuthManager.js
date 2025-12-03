
// Since we are loading the UMD bundle in index.html, the functions are available globally under SimpleWebAuthnBrowser
const { startRegistration, startAuthentication } = window.SimpleWebAuthnBrowser

class AuthManager {
  constructor (client) {
    this.client = client
    this.user = null
    this.modal = null
    this.init()
  }

  async init () {
    this.renderModal()
    await this.checkSession()
  }

  renderModal () {
    // Create Modal HTML
    const modal = document.createElement('div')
    modal.id = 'auth-modal'
    modal.style.position = 'fixed'
    modal.style.top = '0'
    modal.style.left = '0'
    modal.style.width = '100%'
    modal.style.height = '100%'
    modal.style.backgroundColor = 'rgba(0,0,0,0.85)'
    modal.style.display = 'flex'
    modal.style.justifyContent = 'center'
    modal.style.alignItems = 'center'
    modal.style.zIndex = '10000'

    modal.innerHTML = `
      <div style="background: var(--bg-secondary); padding: 2rem; border-radius: 8px; text-align: center; max-width: 400px; width: 100%;">
        <h2 style="margin-top: 0;">Welcome to NurdWerks Chess</h2>
        <p>Please log in or register to play.</p>

        <div id="auth-forms">
            <input type="text" id="auth-username" placeholder="Username" style="width: 100%; padding: 10px; margin-bottom: 10px; box-sizing: border-box; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary);">

            <button id="btn-login" class="button button-primary" style="width: 100%; margin-bottom: 10px;">Login with FIDO2</button>
            <button id="btn-register" class="button button-secondary" style="width: 100%; margin-bottom: 10px;">Register New Account</button>
            <button id="btn-guest" class="button" style="width: 100%; background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary);">Play as Guest</button>
        </div>
        <div id="auth-status" style="margin-top: 1rem; color: #ff6b6b; min-height: 1.2em;"></div>
      </div>
    `

    document.body.appendChild(modal)
    this.modal = modal

    document.getElementById('btn-login').addEventListener('click', () => this.login())
    document.getElementById('btn-register').addEventListener('click', () => this.register())
    document.getElementById('btn-guest').addEventListener('click', () => {
        this.modal.style.display = 'none'
    })
  }

  async checkSession () {
    try {
        const res = await fetch('/api/user/me')
        const data = await res.json()
        if (data.loggedIn) {
            this.onLoginSuccess(data.user)
        } else {
            this.modal.style.display = 'flex'
        }
    } catch (e) {
        console.error('Session check failed', e)
    }
  }

  async register () {
    const username = document.getElementById('auth-username').value
    if (!username) return this.setStatus('Please enter a username')

    this.setStatus('Registering...')

    try {
        // Get Options
        const resp = await fetch('/api/auth/register-options', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        })
        const options = await resp.json()
        if(options.error) throw new Error(options.error)

        // Pass to browser authenticator
        const attResp = await startRegistration(options)

        // Verify
        const verifyResp = await fetch('/api/auth/register-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attResp)
        })

        const verifyResult = await verifyResp.json()

        if (verifyResult.verified) {
            this.setStatus('Registration Successful!')
            // Sync Data
            await this.syncData()
            // Reload to get fresh state
            window.location.reload()
        } else {
            this.setStatus('Registration Failed')
        }

    } catch (e) {
        this.setStatus('Error: ' + e.message)
        console.error(e)
    }
  }

  async login () {
    const username = document.getElementById('auth-username').value
    if (!username) return this.setStatus('Please enter a username')

    this.setStatus('Logging in...')

    try {
        const resp = await fetch('/api/auth/login-options', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        })
        const options = await resp.json()
        if(options.error) throw new Error(options.error)

        const asseResp = await startAuthentication(options)

        const verifyResp = await fetch('/api/auth/login-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(asseResp)
        })

        const verifyResult = await verifyResp.json()

        if (verifyResult.verified) {
            this.setStatus('Login Successful!')
            await this.syncData()
            window.location.reload()
        } else {
            this.setStatus('Login Failed')
        }

    } catch (e) {
        this.setStatus('Error: ' + e.message)
        console.error(e)
    }
  }

  async syncData() {
      // 1. Get Server Data
      const res = await fetch('/api/user/data')
      const serverData = await res.json()

      // 2. Identify Local Data (Settings, etc.)
      // List of keys we care about
      const keys = ['lightMode', 'boardTheme', 'pieceSet', 'engineSettings', 'my-repertoire', 'leaderboard', 'gameHistory']
      const localData = {}

      keys.forEach(key => {
          const val = localStorage.getItem(key)
          if(val) localData[key] = val
      })

      // 3. Merge Logic
      const toPush = {}
      let needsPush = false

      keys.forEach(key => {
          if (!serverData[key] && localData[key]) {
              toPush[key] = localData[key]
              needsPush = true
          } else if (serverData[key]) {
              localStorage.setItem(key, serverData[key])
          }
      })

      if (needsPush) {
          await fetch('/api/user/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: toPush })
          })
      }
  }

  onLoginSuccess (user) {
    this.user = user
    if (this.modal) this.modal.remove()
    this.renderUserInfo(user)
  }

  renderUserInfo (user) {
    const container = document.querySelector('.sidebar-header') || document.body
    const userInfo = document.createElement('div')
    userInfo.style.padding = '10px'
    userInfo.style.borderBottom = '1px solid var(--border-color)'
    userInfo.innerHTML = `
        <div style="font-weight: bold; color: var(--accent-color);">
            ${user.displayName}
            <span style="font-size: 0.8em; color: var(--text-secondary); margin-left: 5px; border: 1px solid var(--border-color); padding: 1px 4px; border-radius: 4px;">${user.role || 'user'}</span>
        </div>
        <div style="font-size: 0.8em; color: var(--text-secondary);">@${user.username}</div>
        <button id="btn-logout" class="button button-danger" style="margin-top: 5px; font-size: 0.8em; padding: 2px 5px;">Logout</button>
    `
    // Insert after title
    const title = container.querySelector('h2')
    if (title) {
        title.insertAdjacentElement('afterend', userInfo)
    } else {
        container.prepend(userInfo)
    }

    document.getElementById('btn-logout').addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        window.location.reload()
    })
  }

  setStatus (msg) {
    const el = document.getElementById('auth-status')
    if (el) el.innerText = msg
  }
}

// Export to global scope
window.AuthManager = AuthManager
