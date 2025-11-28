const http = require('http')
const fs = require('fs')
const path = require('path')
const WebSocket = require('ws')
const UCI = require('./UCI')

const PORT = 3000

// HTTP Server to serve static files
const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, '../public', req.url === '/' ? 'index.html' : req.url)
  const extname = path.extname(filePath)
  let contentType = 'text/html'

  switch (extname) {
    case '.js':
      contentType = 'text/javascript; charset=utf-8'
      break
    case '.css':
      contentType = 'text/css; charset=utf-8'
      break
    case '.json':
      contentType = 'application/json; charset=utf-8'
      break
    case '.png':
      contentType = 'image/png'
      break
    case '.jpg':
      contentType = 'image/jpg'
      break
    case '.svg':
      contentType = 'image/svg+xml'
      break
  }

  // Default HTML to utf-8
  if (contentType === 'text/html') {
    contentType = 'text/html; charset=utf-8'
  }

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
    const cmd = message.toString()
    // console.log(`Received command: ${cmd}`); // Optional logging
    uci.processCommand(cmd)
  })

  ws.on('close', () => {
    console.log('Client disconnected')
    // UCI instance will be garbage collected
  })
})

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`)
})
