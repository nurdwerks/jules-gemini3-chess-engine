const Auth = require('../src/Auth.js')
const db = require('../src/Database.js')

jest.mock('../src/Database.js')
jest.mock('@simplewebauthn/server', () => ({
    generateAuthenticationOptions: jest.fn().mockResolvedValue({ challenge: 'mock-challenge' }),
    generateRegistrationOptions: jest.fn().mockResolvedValue({ challenge: 'mock-challenge' }),
    verifyAuthenticationResponse: jest.fn().mockResolvedValue({ verified: true, authenticationInfo: { newCounter: 1 } }),
    verifyRegistrationResponse: jest.fn().mockResolvedValue({ verified: true, registrationInfo: { credentialID: new Uint8Array([1,2,3]), credentialPublicKey: new Uint8Array([4,5,6]), counter: 0 } })
}))

const { generateAuthenticationOptions } = require('@simplewebauthn/server')

describe('Auth Logic', () => {

    const mockRequest = { hostname: 'localhost' }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('getLoginOptions should handle serialized Uint8Array (JSON object) credentialID', async () => {
        // Mock DB returning a user with serialized credentialID
        const serializedID = { '0': 1, '1': 2, '2': 3, '3': 4, length: 4 } // Simulate JSON object from LevelDB
        // Actually, JSON.stringify(new Uint8Array([1])) gives {"0":1}. It does not have length property when parsed back unless we add it or it's array.
        // Wait, JSON.parse(JSON.stringify(new Uint8Array([1]))) is {"0":1}.
        const objID = { '0': 1, '1': 2, '2': 3, '3': 4 }

        db.getUser.mockResolvedValue({
            username: 'testuser',
            authenticators: [{
                credentialID: objID,
                transports: ['usb']
            }]
        })

        await Auth.getLoginOptions('testuser', mockRequest)

        // Verify generateAuthenticationOptions was called with correct ID
        expect(generateAuthenticationOptions).toHaveBeenCalledWith(expect.objectContaining({
            allowCredentials: expect.arrayContaining([
                expect.objectContaining({
                    id: 'AQIDBA' // Base64URL of [1, 2, 3, 4]
                })
            ])
        }))
    })

    test('getLoginOptions should handle Buffer credentialID', async () => {
        const bufID = Buffer.from([1, 2, 3, 4])
        db.getUser.mockResolvedValue({
            username: 'testuser',
            authenticators: [{
                credentialID: bufID,
                transports: ['usb']
            }]
        })

        await Auth.getLoginOptions('testuser', mockRequest)

        expect(generateAuthenticationOptions).toHaveBeenCalledWith(expect.objectContaining({
            allowCredentials: expect.arrayContaining([
                expect.objectContaining({
                    id: 'AQIDBA'
                })
            ])
        }))
    })

    test('getLoginOptions should handle serialized Buffer {type: Buffer}', async () => {
        const bufObj = { type: 'Buffer', data: [1, 2, 3, 4] }
        db.getUser.mockResolvedValue({
            username: 'testuser',
            authenticators: [{
                credentialID: bufObj,
                transports: ['usb']
            }]
        })

        await Auth.getLoginOptions('testuser', mockRequest)

        expect(generateAuthenticationOptions).toHaveBeenCalledWith(expect.objectContaining({
            allowCredentials: expect.arrayContaining([
                expect.objectContaining({
                    id: 'AQIDBA'
                })
            ])
        }))
    })
})

describe('Root Admin Logic', () => {
    const username = 'rootuser'
    const credentialID = Buffer.from([1, 2, 3, 4])
    const credentialIDBase64Url = 'AQIDBA' // Base64URL of [1, 2, 3, 4]

    const mockRequest = {
        hostname: 'localhost',
        headers: { origin: 'http://localhost:3000' },
        body: {
            id: credentialIDBase64Url,
            response: { transports: [] }
        }
    }

    const originalEnv = process.env
    let capturedSavedUser = null;

    beforeEach(() => {
        jest.clearAllMocks()
        process.env = { ...originalEnv }
        capturedSavedUser = null;

        db.getUser.mockResolvedValue({
            username: username,
            role: 'user',
            authenticators: [{
                credentialID: credentialID,
                credentialPublicKey: Buffer.from([]),
                counter: 0,
                transports: []
            }]
        })

        db.getUserCurrentChallenge.mockResolvedValue('mock-challenge')

        db.saveUser.mockImplementation((u, data) => {
            capturedSavedUser = JSON.parse(JSON.stringify(data));
            return Promise.resolve();
        })
    })

    afterAll(() => {
        process.env = originalEnv
    })

    test('Should return user with role "user" when ROOT_ADMIN is not set', async () => {
        const { user } = await Auth.verifyLogin(username, mockRequest)
        expect(user.role).toBe('user')
    })

    test('Should return user with role "admin" when ROOT_ADMIN matches username', async () => {
        process.env.ROOT_ADMIN = username
        const { user } = await Auth.verifyLogin(username, mockRequest)
        expect(user.role).toBe('admin')
    })

    test('Should return user with role "user" when ROOT_ADMIN does not match username', async () => {
        process.env.ROOT_ADMIN = 'otheradmin'
        const { user } = await Auth.verifyLogin(username, mockRequest)
        expect(user.role).toBe('user')
    })

    test('Should not save admin role to database', async () => {
        process.env.ROOT_ADMIN = username
        await Auth.verifyLogin(username, mockRequest)

        expect(capturedSavedUser).not.toBeNull()
        expect(capturedSavedUser.role).toBe('user')
    })
})
