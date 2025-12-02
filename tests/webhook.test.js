const fastify = require('fastify')
const webhookRoute = require('../src/routes/webhook.js')
const crypto = require('crypto')

describe('Webhook API', () => {
  let app
  let exitSpy
  const secret = 'test-secret'

  beforeEach(async () => {
    process.env.GITHUB_WEBHOOK_SECRET = secret
    app = fastify()
    app.register(webhookRoute)
    await app.ready()

    // Mock process.exit
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {})
  })

  afterEach(async () => {
    delete process.env.GITHUB_WEBHOOK_SECRET
    await app.close()
    exitSpy.mockRestore()
  })

  const sign = (payload) => {
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(JSON.stringify(payload))
    return `sha256=${hmac.digest('hex')}`
  }

  test('POST /webhook should return 500 if secret is not set', async () => {
    delete process.env.GITHUB_WEBHOOK_SECRET
    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { 'x-github-event': 'push' },
      payload: {}
    })
    expect(response.statusCode).toBe(500)
  })

  test('POST /webhook should return 401 if signature is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { 'x-github-event': 'push' },
      payload: {}
    })
    expect(response.statusCode).toBe(401)
    expect(JSON.parse(response.payload)).toEqual({ error: 'Missing signature' })
  })

  test('POST /webhook should return 401 if signature is invalid', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        'x-github-event': 'push',
        'x-hub-signature-256': 'sha256=invalid'
      },
      payload: {}
    })
    expect(response.statusCode).toBe(401)
    expect(JSON.parse(response.payload)).toEqual({ error: 'Invalid signature' })
  })

  test('POST /webhook should ignore non-PR events with valid signature', async () => {
    const payload = {}
    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        'x-github-event': 'push',
        'x-hub-signature-256': sign(payload)
      },
      payload
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.payload)).toEqual({ status: 'ignored' })
    expect(exitSpy).not.toHaveBeenCalled()
  })

  test('POST /webhook should ignore unmerged PR closed events', async () => {
    const payload = {
      action: 'closed',
      pull_request: { merged: false }
    }
    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        'x-github-event': 'pull_request',
        'x-hub-signature-256': sign(payload)
      },
      payload
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.payload)).toEqual({ status: 'ignored' })
    expect(exitSpy).not.toHaveBeenCalled()
  })

  test('POST /webhook should ignore PR open events', async () => {
    const payload = {
      action: 'opened',
      pull_request: { merged: false }
    }
    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        'x-github-event': 'pull_request',
        'x-hub-signature-256': sign(payload)
      },
      payload
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.payload)).toEqual({ status: 'ignored' })
    expect(exitSpy).not.toHaveBeenCalled()
  })

  test('POST /webhook should exit server on merged PR closed event', async () => {
    const payload = {
      action: 'closed',
      pull_request: { merged: true }
    }
    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        'x-github-event': 'pull_request',
        'x-hub-signature-256': sign(payload)
      },
      payload
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.payload)).toEqual({ status: 'ok', message: 'Server exiting' })

    // Wait for the timeout in the handler to fire (500ms + buffer)
    await new Promise(resolve => setTimeout(resolve, 600))

    expect(exitSpy).toHaveBeenCalledWith(0)
  })
})
