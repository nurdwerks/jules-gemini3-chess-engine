class TimeManager {
  constructor (board) {
    this.board = board
    this.wtime = 0
    this.btime = 0
    this.winc = 0
    this.binc = 0
    this.movestogo = 0
    this.movetime = 0
    this.infinite = false
    this.startTime = 0
  }

  reset () {
    this.wtime = 0
    this.btime = 0
    this.winc = 0
    this.binc = 0
    this.movestogo = 0
    this.movetime = 0
    this.infinite = false
    this.startTime = 0
  }

  parseGoCommand (args, color) {
    this.reset()
    this.startTime = Date.now()
    this.extractGoParams(args)
    return this.calculateTimeAllocation(color)
  }

  extractGoParams (args) {
    const paramMap = {
      wtime: 'wtime',
      btime: 'btime',
      winc: 'winc',
      binc: 'binc',
      movestogo: 'movestogo',
      movetime: 'movetime'
    }
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (paramMap[arg] && i + 1 < args.length) {
        this[paramMap[arg]] = parseInt(args[i + 1], 10)
      } else if (arg === 'infinite') {
        this.infinite = true
      }
    }
  }

  calculateTimeAllocation (color) {
    if (this.movetime > 0) return { hardLimit: this.movetime, softLimit: this.movetime }
    if (this.infinite) return { hardLimit: Infinity, softLimit: Infinity }

    const time = color === 'w' ? this.wtime : this.btime
    if (time === 0) return { hardLimit: Infinity, softLimit: Infinity }

    const inc = color === 'w' ? this.winc : this.binc
    const opponentTime = color === 'w' ? this.btime : this.wtime

    const overhead = this.moveOverhead || 50
    const maxTime = Math.max(10, time - overhead)

    const movesLeft = this.estimateMovesLeft()
    let targetTime = (time / movesLeft) + (inc * 0.75)
    targetTime = this.adjustForOpponentTime(targetTime, time, opponentTime)

    return this.calculateLimits(targetTime, maxTime)
  }

  estimateMovesLeft () {
    if (this.movestogo > 0) return this.movestogo
    if (this.board.fullMoveNumber < 15) return 50
    if (this.board.fullMoveNumber > 40) return 20
    return 30
  }

  adjustForOpponentTime (targetTime, time, opponentTime) {
    const timeRatio = time / (opponentTime + 1)
    if (timeRatio > 2) return targetTime * 0.8
    if (timeRatio < 0.5) return targetTime * 1.2
    return targetTime
  }

  calculateLimits (targetTime, maxTime) {
    let softLimit = Math.min(maxTime, targetTime)
    let hardLimit = Math.min(maxTime, softLimit * 4)

    if (softLimit < 10) softLimit = 10
    if (hardLimit < softLimit) hardLimit = softLimit

    return { hardLimit, softLimit }
  }

  setMoveOverhead (overhead) {
    this.moveOverhead = overhead
  }

  shouldStop (elapsed, softLimit, isStable) {
    if (elapsed >= softLimit) {
      if (isStable) return true
    }
    return false
  }
}

module.exports = TimeManager
