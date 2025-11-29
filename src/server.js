const http = require('http')
const fs = require('fs')
const path = require('path')
const WebSocket = require('ws')
const UCI = require('./UCI')
const VoteRoom = require('./VoteRoom')

const PORT = 3000
const voteRoom = new VoteRoom()

const handleUpload = (req, res) => {
  const filename = req.headers['x-filename']
  if (!filename) {
    res.writeHead(400)
    res.end('Missing filename')
    return
  }

  // Security: Validate Extension
  const ext = path.extname(filename).toLowerCase()
  if (ext !== '.bin' && ext !== '.nnue') {
    res.writeHead(400)
    res.end('Invalid file type. Only .bin and .nnue allowed.')
    return
  }

  // Security: Validate Size
  const contentLength = req.headers['content-length']
  if (contentLength && parseInt(contentLength, 10) > 50 * 1024 * 1024) {
    res.writeHead(413)
    res.end('File too large (max 50MB)')
    return
  }

  const safeName = path.basename(filename)
  const targetDir = path.join(__dirname, '../uploads')
  const targetPath = path.join(targetDir, safeName)

  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir)

  const writeStream = fs.createWriteStream(targetPath)
  req.pipe(writeStream)

  writeStream.on('finish', () => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ path: `uploads/${safeName}` }))
  })

  writeStream.on('error', (err) => {
    res.writeHead(500)
    res.end('Upload failed: ' + err.message)
  })
}

const getContentType = (extname) => {
  switch (extname) {
    case '.js': return 'text/javascript; charset=utf-8'
    case '.css': return 'text/css; charset=utf-8'
    case '.json': return 'application/json; charset=utf-8'
    case '.png': return 'image/png'
    case '.jpg': return 'image/jpg'
    case '.svg': return 'image/svg+xml'
    default: return 'text/html; charset=utf-8'
  }
}

const serveStatic = (req, res) => {
  const filePath = path.join(__dirname, '../public', req.url === '/' ? 'index.html' : req.url)
  const extname = path.extname(filePath)
  const contentType = getContentType(extname)

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(__dirname, '../public', '404.html'), (_err2, content404) => {
          if (_err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.end('404 Not Found')
            return
          }
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(content404, 'utf-8')
        })
      } else {
        res.writeHead(500)
        res.end('Server Error: ' + err.code)
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(content, 'utf-8')
    }
  })
}

// HTTP Server to serve static files
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/upload') {
    handleUpload(req, res)
  } else {
    serveStatic(req, res)
  }
})

// WebSocket Server
const wss = new WebSocket.Server({ server })

wss.on('connection', (ws) => {
  console.log('Client connected')

  const uci = new UCI((msg) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg)
    }
  })

  ws.on('message', (message) => {
    const msgStr = message.toString()

    // Check for JSON (Vote Protocol)
    if (msgStr.startsWith('{')) {
      try {
        const data = JSON.parse(msgStr)
        if (data.action === 'join_vote') {
          voteRoom.addClient(ws)
        } else if (data.action === 'leave_vote') {
          voteRoom.removeClient(ws)
        } else if (data.action === 'vote') {
          voteRoom.handleVote(ws, data.move)
        }
        return // Don't process as UCI
      } catch (e) {}
    }

    const cmd = msgStr
    // console.log(`Received command: ${cmd}`); // Optional logging
    uci.processCommand(cmd)
  })

  ws.on('close', () => {
    console.log('Client disconnected')
    voteRoom.removeClient(ws)
    // UCI instance will be garbage collected
  })
})

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`)
})
