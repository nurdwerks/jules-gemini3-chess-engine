const fs = require('fs')
const path = require('path')

module.exports = async function (fastify, opts) {
    fastify.get('/debug_tree.json', async (request, reply) => {
        const filepath = path.join(__dirname, '../../debug_tree.json')
        if (!fs.existsSync(filepath)) return reply.code(404).send('Not found')
        const stream = fs.createReadStream(filepath)
        reply.type('application/json')
        return stream
    })

    fastify.get('/changelog', async (request, reply) => {
        const filepath = path.join(__dirname, '../../CHANGELOG.md')
        const stream = fs.createReadStream(filepath)
        reply.type('text/markdown')
        return stream
    })

    fastify.get('/license', async (request, reply) => {
        const filepath = path.join(__dirname, '../../LICENSE')
        const stream = fs.createReadStream(filepath)
        reply.type('text/plain')
        return stream
    })

    fastify.get('/version', async (request, reply) => {
        const pkg = require('../../package.json')
        return { version: pkg.version }
    })
}
