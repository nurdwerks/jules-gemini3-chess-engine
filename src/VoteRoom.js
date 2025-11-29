const { Chess } = require('chess.js')

class VoteRoom {
  constructor () {
    this.chess = new Chess()
    this.clients = new Set()
    this.votes = {} // { moveSan: count }
    this.timer = null
    this.timePerMove = 10000 // 10 seconds
    this.timerStart = 0
    this.timerInterval = null
  }

  addClient (ws) {
    this.clients.add(ws)
    // Send current state
    this.sendState(ws)
    // Start if not started and we have clients
    if (!this.timer && this.clients.size > 0) {
      this.start()
    }
  }

  removeClient (ws) {
    this.clients.delete(ws)
    if (this.clients.size === 0) {
      this.stop()
    }
  }

  handleVote (ws, moveData) {
    // moveData could be { from, to, promotion } or SAN string
    try {
      // Validate move by trying it on a temp board
      const temp = new Chess(this.chess.fen())
      const result = temp.move(moveData)
      if (!result) return // Invalid move

      const key = result.san
      this.votes[key] = (this.votes[key] || 0) + 1
      this.broadcastVotes()
    } catch (e) {
      // ignore invalid
    }
  }

  start () {
    if (this.timer) return
    this.startTurn()
  }

  stop () {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    this.votes = {}
  }

  startTurn () {
    this.votes = {}
    this.timerStart = Date.now()

    this.broadcast({
      type: 'vote_start',
      fen: this.chess.fen(),
      timeLeft: this.timePerMove
    })

    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.endTurn()
    }, this.timePerMove)
  }

  endTurn () {
    // Pick best move
    let bestMove = null

    const entries = Object.entries(this.votes)
    if (entries.length > 0) {
      // Sort by votes
      entries.sort((a, b) => b[1] - a[1])
      bestMove = entries[0][0]
    } else {
      // Random move
      const moves = this.chess.moves()
      if (moves.length > 0) {
        bestMove = moves[Math.floor(Math.random() * moves.length)]
      }
    }

    if (bestMove) {
      this.chess.move(bestMove)
      this.broadcast({
        type: 'vote_result',
        move: bestMove,
        fen: this.chess.fen()
      })

      if (this.chess.isGameOver()) {
        const result = this.chess.isDraw() ? 'draw' : (this.chess.turn() === 'w' ? 'black' : 'white')
        this.broadcast({ type: 'game_over', result })
        this.reset()
      } else {
        // Next turn
        this.startTurn()
      }
    } else {
      if (this.chess.isGameOver()) {
        this.broadcast({ type: 'game_over' })
        this.reset()
      } else {
        // Stalemate or something odd? Just restart turn
        this.startTurn()
      }
    }
  }

  reset () {
    setTimeout(() => {
      this.chess.reset()
      this.startTurn()
    }, 5000)
  }

  sendState (ws) {
    ws.send(JSON.stringify({
      type: 'vote_state',
      fen: this.chess.fen(),
      votes: this.votes,
      timeLeft: Math.max(0, this.timePerMove - (Date.now() - this.timerStart))
    }))
  }

  broadcastVotes () {
    this.broadcast({
      type: 'vote_update',
      votes: this.votes
    })
  }

  broadcast (msg) {
    const data = JSON.stringify(msg)
    for (const client of this.clients) {
      if (client.readyState === 1) { // OPEN
        client.send(data)
      }
    }
  }
}

module.exports = VoteRoom
