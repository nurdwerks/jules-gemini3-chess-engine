const fastify = require('fastify')({ logger: true })
const path = require('path')
const AutoLoad = require('fastify-autoload')

const start = async () => {
  try {
    // Register Cookie and Session
    await fastify.register(require('@fastify/cookie'))
    await fastify.register(require('@fastify/session'), {
      secret: process.env.SESSION_SECRET || 'secret-key-jules-gemini-chess-very-long-secret-key',
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
      prefix: '/public/' // Serve public assets under /public/ or root? Old app served at root.
    })
    // Also serve public at root to match old behavior if needed, but usually templates handle it.
    // The old app: app.use(express.static(path.join(__dirname, '../public')))
    // This means /client.js was available at /client.js.
    // So I should map root.
    await fastify.register(require('@fastify/static'), {
        root: path.join(__dirname, '../public'),
        prefix: '/',
        decorateReply: false // Avoid conflict
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
    console.log(`Server running at http://localhost:3000/`)

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
