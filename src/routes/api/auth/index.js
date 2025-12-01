const Auth = require('../../../Auth')
const db = require('../../../Database')

const getRpId = (request) => {
    return request.hostname.split(':')[0]
}

const getOrigin = (request) => {
    return request.headers.origin || `http://${request.hostname}`
}

module.exports = async function (fastify, opts) {
    fastify.post('/register-options', async (request, reply) => {
        const { username } = request.body
        if (!username) return reply.code(400).send({ error: 'Username required' })

        try {
            const rpID = getRpId(request)
            const options = await Auth.getRegisterOptions(username, rpID)
            request.session.username = username // Store intent
            return options
        } catch (e) {
            return reply.code(500).send({ error: e.message })
        }
    })

    fastify.post('/register-verify', async (request, reply) => {
        const { username } = request.session
        const body = request.body

        try {
            const rpID = getRpId(request)
            const origin = getOrigin(request)
            const { verified, user } = await Auth.verifyRegister(username, body, rpID, origin)
            if (verified) {
                // Assign role
                if (!user.role) {
                     if (user.username === 'admin') {
                         user.role = 'admin'
                         await db.saveUser(user.username, user)
                     } else {
                         user.role = 'user'
                         await db.saveUser(user.username, user)
                     }
                }

                request.session.loggedIn = true
                request.session.user = user
                return { verified: true }
            } else {
                return reply.code(400).send({ verified: false })
            }
        } catch (e) {
            return reply.code(500).send({ error: e.message })
        }
    })

    fastify.post('/login-options', async (request, reply) => {
        const { username } = request.body

        try {
            const rpID = getRpId(request)
            const options = await Auth.getLoginOptions(username, rpID)
            request.session.username = username
            return options
        } catch (e) {
            return reply.code(500).send({ error: e.message })
        }
    })

    fastify.post('/login-verify', async (request, reply) => {
        const { username } = request.session
        const body = request.body

        try {
            const rpID = getRpId(request)
            const origin = getOrigin(request)
            const { verified, user } = await Auth.verifyLogin(username, body, rpID, origin)
            if (verified) {
                request.session.loggedIn = true
                request.session.user = user
                return { verified: true }
            } else {
                return reply.code(400).send({ verified: false })
            }
        } catch (e) {
            return reply.code(500).send({ error: e.message })
        }
    })

    fastify.post('/logout', async (request, reply) => {
        request.session.destroy()
        return { success: true }
    })
}
