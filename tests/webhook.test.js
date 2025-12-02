const fastify = require('fastify')
const webhookRoute = require('../src/routes/webhook.js')

describe('Webhook API', () => {
  let app
  let exitSpy

  beforeEach(async () => {
    app = fastify()
    app.register(webhookRoute)
    await app.ready()

    // Mock process.exit
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {})
  })

  afterEach(async () => {
    await app.close()
    exitSpy.mockRestore()
  })

  test('POST /webhook should ignore non-PR events', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { 'x-github-event': 'push' },
      payload: {}
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.payload)).toEqual({ status: 'ignored' })
    expect(exitSpy).not.toHaveBeenCalled()
  })

  test('POST /webhook should ignore unmerged PR closed events', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { 'x-github-event': 'pull_request' },
      payload: {
        action: 'closed',
        pull_request: { merged: false }
      }
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.payload)).toEqual({ status: 'ignored' })
    expect(exitSpy).not.toHaveBeenCalled()
  })

  test('POST /webhook should ignore PR open events', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { 'x-github-event': 'pull_request' },
      payload: {
        action: 'opened',
        pull_request: { merged: false }
      }
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.payload)).toEqual({ status: 'ignored' })
    expect(exitSpy).not.toHaveBeenCalled()
  })

  test('POST /webhook should exit server on merged PR closed event', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { 'x-github-event': 'pull_request' },
      payload: {
        action: 'closed',
        pull_request: { merged: true }
      }
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.payload)).toEqual({ status: 'ok', message: 'Server exiting' })

    // Wait for the timeout in the handler to fire (500ms + buffer)
    await new Promise(resolve => setTimeout(resolve, 600))

    expect(exitSpy).toHaveBeenCalledWith(0)
  })
})
