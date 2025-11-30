const express = require('express')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const path = require('path')
const http = require('http')
const WebSocket = require('ws')
const UCI = require('./UCI')
const VoteRoom = require('./VoteRoom')
const Auth = require('./Auth')
const db = require('./Database')
const fs = require('fs')

const PORT = 3000
const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })
const voteRoom = new VoteRoom()

// Middleware
app.use(bodyParser.json())
app.use(cookieParser())
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key-jules-gemini-chess',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // Secure true if HTTPS
}))

// Static Files
app.use(express.static(path.join(__dirname, '../public')))

// Upload Route
app.post('/upload', (req, res) => {
    const filename = req.headers['x-filename']
    if (!filename) return res.status(400).send('Missing filename')

    const ext = path.extname(filename).toLowerCase()
    if (ext !== '.bin' && ext !== '.nnue') return res.status(400).send('Invalid file type')

    const contentLength = req.headers['content-length']
    if (contentLength && parseInt(contentLength, 10) > 50 * 1024 * 1024) {
      return res.status(413).send('File too large')
    }

    const safeName = path.basename(filename)
    const targetDir = path.join(__dirname, '../uploads')
    const targetPath = path.join(targetDir, safeName)

    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir)

    const writeStream = fs.createWriteStream(targetPath)
    req.pipe(writeStream)

    writeStream.on('finish', () => {
      res.json({ path: `uploads/${safeName}` })
    })

    writeStream.on('error', (err) => {
      res.status(500).send('Upload failed: ' + err.message)
    })
})

// Special Files
app.get('/debug_tree.json', (req, res) => res.sendFile(path.join(__dirname, '../debug_tree.json')))
app.get('/changelog', (req, res) => res.sendFile(path.join(__dirname, '../CHANGELOG.md')))
app.get('/license', (req, res) => res.sendFile(path.join(__dirname, '../LICENSE')))
app.get('/version', (req, res) => {
    const pkg = require('../package.json')
    res.json({ version: pkg.version })
})

// --- Auth Routes ---

app.post('/api/auth/register-options', async (req, res) => {
    const { username } = req.body
    if (!username) return res.status(400).json({ error: 'Username required' })

    try {
        const options = await Auth.getRegisterOptions(username)
        req.session.username = username // Store intent
        res.json(options)
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

app.post('/api/auth/register-verify', async (req, res) => {
    const { username } = req.session // Retrieve from session
    const body = req.body

    try {
        const { verified, user } = await Auth.verifyRegister(username, body)
        if (verified) {
            req.session.loggedIn = true
            req.session.user = user
            res.json({ verified: true })
        } else {
            res.status(400).json({ verified: false })
        }
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

app.post('/api/auth/login-options', async (req, res) => {
    const { username } = req.body

    try {
        const options = await Auth.getLoginOptions(username)
        req.session.username = username
        res.json(options)
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

app.post('/api/auth/login-verify', async (req, res) => {
    const { username } = req.session
    const body = req.body

    try {
        const { verified, user } = await Auth.verifyLogin(username, body)
        if (verified) {
            req.session.loggedIn = true
            req.session.user = user
            res.json({ verified: true })
        } else {
            res.status(400).json({ verified: false })
        }
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

app.get('/api/user/me', (req, res) => {
    if (req.session.loggedIn) {
        res.json({ loggedIn: true, user: req.session.user })
    } else {
        res.json({ loggedIn: false })
    }
})

app.post('/api/user/sync', async (req, res) => {
    if (!req.session.loggedIn) return res.status(401).json({ error: 'Unauthorized' })

    const { data } = req.body
    try {
        const username = req.session.user.username
        await db.updateUserData(username, data)
        const updatedUser = await db.getUser(username)
        req.session.user = updatedUser // Update session
        res.json({ success: true, userData: updatedUser.userData })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

app.get('/api/user/data', async (req, res) => {
    if (!req.session.loggedIn) return res.status(401).json({ error: 'Unauthorized' })
    try {
        const username = req.session.user.username
        const user = await db.getUser(username)
        res.json(user.userData || {})
    } catch(e) {
        res.status(500).json({ error: e.message })
    }
})

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy()
    res.json({ success: true })
})


// WebSocket Server
wss.on('connection', (ws, req) => {
  // console.log('Client connected')
  // We can access session via request if we share the session store,
  // but for now we'll rely on the HTTP gatecheck.

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
        } else if (data.type === 'chat' || data.type === 'reaction') {
          wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(data))
            }
          })
        }
        return // Don't process as UCI
      } catch (e) {}
    }

    const cmd = msgStr
    uci.processCommand(cmd)
  })

  ws.on('close', () => {
    // console.log('Client disconnected')
    voteRoom.removeClient(ws)
  })
})

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`)
})
