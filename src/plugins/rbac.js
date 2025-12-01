const fp = require('fastify-plugin')
const db = require('../Database')

module.exports = fp(async function (fastify, opts) {
  fastify.decorateRequest('hasRole', function (role) {
    const user = this.session.user
    if (!user) return false
    // If user has no role, assume 'user'
    const userRole = user.role || 'user'

    if (userRole === 'admin') return true // Admin has all access
    if (role === userRole) return true

    return false
  })

  // Middleware/Hook to protect routes
  // Usage: { preHandler: fastify.auth([fastify.verifyRole('admin')]) } ?
  // Or just a decorator function to use in routes.

  fastify.decorate('verifyRole', function (role) {
    return async function (request, reply) {
      if (!request.session.loggedIn || !request.session.user) {
        reply.code(401).send({ error: 'Unauthorized' })
        return
      }

      if (!request.hasRole(role)) {
        reply.code(403).send({ error: 'Forbidden' })
        return
      }
    }
  })
})
