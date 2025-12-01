module.exports = async function (fastify, opts) {
  fastify.get('/', async (request, reply) => {
    return reply.view('index.ejs', {
        user: request.session.user || null
    })
  })
}
