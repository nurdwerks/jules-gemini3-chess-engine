module.exports = async function (fastify, opts) {
  fastify.get('/', {
    preHandler: fastify.verifyRole('admin')
  }, async (request, reply) => {
    return reply.view('admin.ejs', {
        user: request.session.user
    })
  })
}
