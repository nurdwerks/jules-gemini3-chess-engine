const fp = require('fastify-plugin')
const UCI = require('../engine/UCI')
const VoteRoom = require('../VoteRoom')

// Singleton VoteRoom
const voteRoom = new VoteRoom()

module.exports = fp(async function (fastify, opts) {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    const ws = connection.socket

    // UCI instance per connection
    const uci = new UCI((msg) => {
      if (ws.readyState === 1) { // WebSocket.OPEN is 1
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
            // Broadcast to all clients
            // Note: fastify-websocket exposes fastify.websocketServer which is the wss
            // But voteRoom manages its own list of clients potentially?
            // Let's look at VoteRoom.js logic. It likely assumes it manages the list.
            // But here "wss.clients.forEach" was used in server.js for chat/reaction.

            fastify.websocketServer.clients.forEach(client => {
              if (client !== ws && client.readyState === 1) {
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
      voteRoom.removeClient(ws)
      // uci cleanup if needed? uci.stopWorkers() is called in UCI commands usually.
      // But if client disconnects, we might want to kill the uci search.
      uci.cmdStop()
      // UCI class spawns workers in constructor. We should probably terminate them on disconnect.
      if (uci.workers) {
          uci.stopWorkers()
      }
    })
  })
})
