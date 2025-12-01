const path = require('path')
const fs = require('fs')

module.exports = async function (fastify, opts) {
  // Handle binary uploads
  fastify.addContentTypeParser('*', (req, body, done) => {
      done(null, body)
  })

  fastify.post('/upload', async (request, reply) => {
    const filename = request.headers['x-filename']
    if (!filename) return reply.code(400).send('Missing filename')

    const ext = path.extname(filename).toLowerCase()
    if (ext !== '.bin' && ext !== '.nnue') return reply.code(400).send('Invalid file type')

    const safeName = path.basename(filename)
    const targetDir = path.join(__dirname, '../../uploads')

    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir)

    const targetPath = path.join(targetDir, safeName)
    const writeStream = fs.createWriteStream(targetPath)

    try {
        await new Promise((resolve, reject) => {
            request.body.pipe(writeStream)
            writeStream.on('finish', resolve)
            writeStream.on('error', reject)
        })
        return { path: `uploads/${safeName}` }
    } catch (err) {
        return reply.code(500).send('Upload failed: ' + err.message)
    }
  })
}
