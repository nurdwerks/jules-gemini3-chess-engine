const Auth = require('../src/Auth.js')
const simpleWebAuthn = require('@simplewebauthn/server')
const db = require('../src/Database.js')

jest.mock('../src/Database.js')
jest.mock('@simplewebauthn/server')

describe('Auth Configuration', () => {
    const mockRequest = { hostname: 'localhost' }

    beforeEach(() => {
        jest.clearAllMocks()
        db.getUser.mockResolvedValue(null) // Simulate new user
        db.saveUser.mockResolvedValue()
        db.setUserCurrentChallenge.mockResolvedValue()
        simpleWebAuthn.generateRegistrationOptions.mockResolvedValue({ challenge: 'mock-challenge' })
    })

    test('getRegisterOptions should NOT restrict authenticatorAttachment to platform', async () => {
        await Auth.getRegisterOptions('newuser', mockRequest)

        const callArgs = simpleWebAuthn.generateRegistrationOptions.mock.calls[0][0]

        // We want to ensure that authenticatorAttachment is NOT 'platform'.
        // It can be undefined (allowing all) or 'cross-platform'.
        // The original issue is that it is strictly 'platform'.

        const authAttachment = callArgs.authenticatorSelection ? callArgs.authenticatorSelection.authenticatorAttachment : undefined

        expect(authAttachment).not.toBe('platform')
    })
})
