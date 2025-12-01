const fastify = require('fastify')
const authRoute = require('../src/routes/api/auth/index.js')
const Auth = require('../src/Auth.js')

jest.mock('../src/Auth.js')
jest.mock('../src/Database.js')

describe('Auth API', () => {
    let app

    beforeEach(async () => {
        app = fastify()
        app.register(require('@fastify/cookie'))
        app.register(require('@fastify/session'), { secret: 'a-secret-key-for-testing-only-1234567890', cookie: { secure: false } })
        app.register(require('@fastify/formbody'))

        // Register the plugin under test
        app.register(authRoute)

        await app.ready()
    })

    afterEach(async () => {
        await app.close()
        jest.clearAllMocks()
    })

    test('POST /register-options should return options', async () => {
        Auth.getRegisterOptions.mockResolvedValue({ challenge: 'mock-challenge' })

        const response = await app.inject({
            method: 'POST',
            url: '/register-options',
            payload: { username: 'testuser' }
        })

        expect(response.statusCode).toBe(200)
        expect(JSON.parse(response.payload)).toEqual({ challenge: 'mock-challenge' })
        expect(Auth.getRegisterOptions).toHaveBeenCalledWith('testuser', expect.any(String))
    })

    test('POST /register-options should 400 without username', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/register-options',
            payload: {}
        })
        expect(response.statusCode).toBe(400)
    })

    test('POST /register-verify should verify and log in', async () => {
        Auth.verifyRegister.mockResolvedValue({ verified: true, user: { username: 'testuser', role: 'user' } })

        // Simulate session by setting it?
        // Fastify-session stores session in a store. Default is memory.
        // We can simulate the flow by first calling register-options (which sets session.username)
        // or we can mock the session handling if possible.
        // With app.inject, cookies are handled.

        // Step 1: Set session username
        // We can cheat by using a route that sets session or just relying on /register-options

        Auth.getRegisterOptions.mockResolvedValue({})
        let res = await app.inject({
            method: 'POST',
            url: '/register-options',
            payload: { username: 'testuser' }
        })

        const cookies = {}
        res.cookies.forEach(c => {
            cookies[c.name] = c.value
        })

        // Step 2: Verify
        res = await app.inject({
            method: 'POST',
            url: '/register-verify',
            payload: { response: 'mock-response' },
            cookies: cookies // Pass the session cookie
        })

        expect(res.statusCode).toBe(200)
        expect(JSON.parse(res.payload)).toEqual({ verified: true })
        expect(Auth.verifyRegister).toHaveBeenCalledWith('testuser', { response: 'mock-response' }, expect.any(String), expect.any(String))
    })
})
