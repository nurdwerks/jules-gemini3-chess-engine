module.exports = async function (fastify, opts) {
  fastify.post('/webhook', async (request, reply) => {
    // TODO: Add HMAC signature verification to secure this endpoint
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
