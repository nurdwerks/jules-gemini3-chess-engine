const crypto = require('crypto')

module.exports = async function (fastify, opts) {
  // Parse JSON and keep raw body for signature verification
  fastify.addContentTypeParser('application/json', { parseAs: 'buffer' }, function (req, body, done) {
    try {
      const json = JSON.parse(body.toString())
      req.rawBody = body
      done(null, json)
    } catch (err) {
      err.statusCode = 400
      done(err, undefined)
    }
  })

  fastify.post('/webhook', async (request, reply) => {
    const secret = process.env.GITHUB_WEBHOOK_SECRET
    if (!secret) {
      fastify.log.error('GITHUB_WEBHOOK_SECRET is not set')
      return reply.code(500).send({ error: 'Server configuration error' })
    }

    const signature = request.headers['x-hub-signature-256']
    if (!signature) {
      return reply.code(401).send({ error: 'Missing signature' })
    }

    if (!request.rawBody) {
       return reply.code(400).send({ error: 'Missing body' })
    }

    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(request.rawBody)
    const expectedSignature = `sha256=${hmac.digest('hex')}`

    try {
      const signatureBuffer = Buffer.from(signature)
      const expectedBuffer = Buffer.from(expectedSignature)

      if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
        return reply.code(401).send({ error: 'Invalid signature' })
      }
    } catch (e) {
      return reply.code(401).send({ error: 'Invalid signature' })
    }

    const event = request.headers['x-github-event']
    const payload = request.body || {}

    if (event === 'pull_request') {
      const action = payload.action
      const pullRequest = payload.pull_request || {}
      const merged = pullRequest.merged

      if (action === 'closed' && merged) {
        fastify.log.info('Pull request merged! Exiting server...')
        reply.send({ status: 'ok', message: 'Server exiting' })

        // Exit after a short delay to allow response to complete
        setTimeout(() => {
          process.exit(0)
        }, 500)
        return
      }
    }

    return { status: 'ignored' }
  })
}
