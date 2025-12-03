/**
 * @jest-environment jsdom
 */

const fs = require('fs')
const path = require('path')

describe('AuthManager', () => {
  let AuthManager

  beforeAll(() => {
    // Mock SimpleWebAuthnBrowser globally
    window.SimpleWebAuthnBrowser = {
      startRegistration: jest.fn(),
      startAuthentication: jest.fn()
    }

    // Load AuthManager source
    const authManagerPath = path.resolve(__dirname, '../../public/js/AuthManager.js')
    const authManagerSrc = fs.readFileSync(authManagerPath, 'utf8')

    // Execute the script to define AuthManager on window
    eval(authManagerSrc)
    AuthManager = window.AuthManager
  })

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="sidebar-header">
        <h2>Title</h2>
      </div>
      <div id="auth-status"></div>
    `
    // Mock global fetch
    global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ loggedIn: false })
    })
  })

  test('renderUserInfo displays user role', () => {
    const mockClient = {} // Mock client if needed
    const authManager = new AuthManager(mockClient)

    // Mock checkSession to do nothing during init
    authManager.checkSession = jest.fn()

    const user = {
      displayName: 'TestUser',
      username: 'testuser',
      role: 'admin'
    }

    authManager.renderUserInfo(user)

    const sidebarHeader = document.querySelector('.sidebar-header')
    // We expect the text content to include the role "admin"
    expect(sidebarHeader.textContent).toContain('TestUser')
    expect(sidebarHeader.textContent).toContain('testuser')

    // This assertion checks if the role is displayed.
    // Based on current code, this should FAIL.
    expect(sidebarHeader.innerHTML).toContain('admin')
  })
})
