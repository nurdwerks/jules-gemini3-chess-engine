class TimeManager {
  constructor (board) {
    this.board = board
    this.reset()
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
    this.moveOverhead = 50
  }

  parseGoCommand (args, color) {
    this.reset()
    this.startTime = Date.now()
    this._parseArgs(args)
    return this.calculateTimeAllocation(color)
  }

  _parseArgs (args) {
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (i + 1 < args.length) {
        if (arg === 'wtime') this.wtime = parseInt(args[i + 1], 10)
        if (arg === 'btime') this.btime = parseInt(args[i + 1], 10)
        if (arg === 'winc') this.winc = parseInt(args[i + 1], 10)
        if (arg === 'binc') this.binc = parseInt(args[i + 1], 10)
        if (arg === 'movestogo') this.movestogo = parseInt(args[i + 1], 10)
        if (arg === 'movetime') this.movetime = parseInt(args[i + 1], 10)
      }
      if (arg === 'infinite') this.infinite = true
    }
  }

  calculateTimeAllocation (color) {
    if (this.movetime > 0) return { hardLimit: this.movetime, softLimit: this.movetime }
    if (this.infinite) return { hardLimit: Infinity, softLimit: Infinity }

    const { time, inc, opponentTime } = this._getTimes(color)
    if (time === 0) return { hardLimit: Infinity, softLimit: Infinity }

    const maxTime = this._getMaxTime(time)
    const movesLeft = this._estimateMovesLeft()
    let targetTime = (time / movesLeft) + (inc * 0.75)

    targetTime = this._adjustForTimeDiff(targetTime, time, opponentTime)

    return this._calculateLimits(maxTime, targetTime)
  }

  _getTimes (color) {
    const time = color === 'w' ? this.wtime : this.btime
    const inc = color === 'w' ? this.winc : this.binc
    const opponentTime = color === 'w' ? this.btime : this.wtime
    return { time, inc, opponentTime }
  }

  _getMaxTime (time) {
    const overhead = this.moveOverhead
    let maxTime = time - overhead
    if (maxTime < 10) maxTime = 10
    return maxTime
  }

  _estimateMovesLeft () {
    if (this.movestogo > 0) return this.movestogo
    if (this.board.fullMoveNumber < 15) return 50
    if (this.board.fullMoveNumber > 40) return 20
    return 30
  }

  _adjustForTimeDiff (targetTime, time, opponentTime) {
    const timeRatio = time / (opponentTime + 1)
    if (timeRatio > 2) return targetTime * 0.8
    if (timeRatio < 0.5) return targetTime * 1.2
    return targetTime
  }

  _calculateLimits (maxTime, targetTime) {
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
      if (isStable) {
        return true
      }
    }
    return false
  }
}

module.exports = TimeManager
