const fastify = require('fastify')({ logger: true })
const path = require('path')
const AutoLoad = require('@fastify/autoload')

const start = async () => {
  try {
    // Register Cookie and Session
    await fastify.register(require('@fastify/cookie'))
    await fastify.register(require('@fastify/session'), {
      secret: process.env.SESSION_SECRET || 'secret-key-nurdwerks-chess-very-long-secret-key',
      cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
      saveUninitialized: false
    })

    // Register Form Body (for x-www-form-urlencoded, though mostly JSON is used)
    await fastify.register(require('@fastify/formbody'))
    await fastify.register(require('@fastify/multipart'), {
        limits: {
            fileSize: 50 * 1024 * 1024 // 50MB
        }
    })

    // Register Static
    await fastify.register(require('@fastify/static'), {
      root: path.join(__dirname, '../public'),
      prefix: '/public/',
      maxAge: 0 // Disable caching
    })

    await fastify.register(require('@fastify/static'), {
        root: path.join(__dirname, '../public'),
        prefix: '/',
        decorateReply: false,
        maxAge: 0 // Disable caching
    })

    // Register View Engine
    await fastify.register(require('@fastify/view'), {
      engine: {
        ejs: require('ejs')
      },
      root: path.join(__dirname, '../templates')
    })

    // Register Websocket
    await fastify.register(require('@fastify/websocket'))

    // Autoload Plugins
    await fastify.register(AutoLoad, {
      dir: path.join(__dirname, 'plugins'),
      options: {}
    })

    // Autoload Routes
    await fastify.register(AutoLoad, {
      dir: path.join(__dirname, 'routes'),
      options: {}
    })

    // Start server
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    console.log(`Server VERSION 2 running at http://localhost:3000/`)

    process.on('SIGINT', async () => {
      console.log('Stopping server...')
      await fastify.close()
      process.exit(0)
    })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
