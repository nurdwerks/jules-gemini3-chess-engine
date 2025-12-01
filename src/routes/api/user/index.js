const db = require('../../../Database')

module.exports = async function (fastify, opts) {
  fastify.get('/me', async (request, reply) => {
      if (request.session.loggedIn) {
          return { loggedIn: true, user: request.session.user }
      }
      return { loggedIn: false }
  })

  fastify.get('/data', async (request, reply) => {
    if (!request.session.loggedIn) return reply.code(401).send({ error: 'Unauthorized' })
    try {
        const username = request.session.user.username
        const user = await db.getUser(username)
        return user.userData || {}
    } catch(e) {
        return reply.code(500).send({ error: e.message })
    }
  })

  fastify.post('/sync', async (request, reply) => {
    if (!request.session.loggedIn) return reply.code(401).send({ error: 'Unauthorized' })

    const { data } = request.body
    try {
        const username = request.session.user.username
        await db.updateUserData(username, data)
        const updatedUser = await db.getUser(username)
        request.session.user = updatedUser // Update session
        return { success: true, userData: updatedUser.userData }
    } catch (e) {
        return reply.code(500).send({ error: e.message })
    }
  })

  // Admin Routes
  fastify.get('/list', {
      preHandler: fastify.verifyRole('admin')
  }, async (request, reply) => {
      const users = await db.getAllUsers()
      return users.map(u => ({ username: u.username, displayName: u.displayName, role: u.role || 'user' }))
  })

  fastify.post('/role', {
      preHandler: fastify.verifyRole('admin')
  }, async (request, reply) => {
      const { username, role } = request.body
      if (!['user', 'admin'].includes(role)) return reply.code(400).send({ error: 'Invalid role' })

      const user = await db.getUser(username)
      if (!user) return reply.code(404).send({ error: 'User not found' })

      user.role = role
      await db.saveUser(username, user)
      return { success: true }
  })
}
