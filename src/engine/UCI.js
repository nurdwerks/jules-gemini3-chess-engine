const Board = require('./Board')
const { NNUE } = require('./NNUE')
const TimeManager = require('./TimeManager')
const Search = require('./Search')
const Bench = require('./Bench')
const Evaluation = require('./Evaluation')
const Polyglot = require('./Polyglot')
const Syzygy = require('./Syzygy')
const { TranspositionTable } = require('./TranspositionTable')
const { Worker } = require('worker_threads')
const path = require('path')

class UCI {
  constructor (outputCallback = console.log) {
    this.board = new Board()
    this.output = outputCallback
    this.currentSearch = null

    this.stopSignal = new Int32Array(new SharedArrayBuffer(4))

    this.options = {
      Hash: 16,
      Threads: 1,
      Ponder: false,
      MultiPV: 1,
      UCI_LimitStrength: false,
      UCI_Elo: 3000,
      AspirationWindow: 50,
      Contempt: 0,
      UseCaptureHistory: true,
      UCI_UseNNUE: !((process.env.TEST_MODE === 'true' || process.env.NODE_ENV === 'test')),
      UCI_NNUE_File: 'https://tests.stockfishchess.org/api/nn/nn-46832cfbead3.nnue',
      BookFile: 'polyglot/gm2001.bin',
      SyzygyPath: '<empty>',
      SyzygyProbeLimit: 6
    }

    this.tt = new TranspositionTable(this.options.Hash)
    this.nnue = new NNUE()
    if (this.options.UCI_UseNNUE) {
      this.nnue.loadNetwork(this.options.UCI_NNUE_File).catch(err => {
        this.output(`info string Failed to load NNUE: ${err.message}`)
        this.options.UCI_UseNNUE = false
      })
    }

    this.book = new Polyglot()
    this.book.loadBook(this.options.BookFile)
    this.syzygy = new Syzygy()
    this.workers = []
    this.startWorkers()
  }

  startWorkers () {
    const sharedBuffer = this.tt.getSharedBuffer()
    const numWorkers = Math.max(1, this.options.Threads)
    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker(path.join(__dirname, 'Worker.js'), {
        workerData: {
          sharedBuffer,
          stopSignalBuffer: this.stopSignal.buffer,
          hashSize: this.options.Hash,
          options: this.options
        }
      })
      worker.on('message', (msg) => this.handleWorkerMessage(msg))
      this.workers.push(worker)
    }
  }

  stopWorkers () {
    const promises = this.workers.map(worker => worker.terminate())
    this.workers = []
    return Promise.all(promises)
  }

  handleWorkerMessage (msg) {
    if (msg.type === 'info') {
      this.output(`info ${msg.data}`)
    } else if (msg.type === 'bestmove') {
      const bestMove = msg.move
      let bestMoveStr = 'bestmove 0000'
      if (bestMove) {
        const fromAlg = this.indexToAlgebraic(bestMove.from)
        const toAlg = this.indexToAlgebraic(bestMove.to)
        bestMoveStr = `bestmove ${fromAlg}${toAlg}${bestMove.promotion || ''}`
      }
      if (this.pendingPonder) {
        this.pendingBestMove = bestMoveStr
      } else {
        this.output(bestMoveStr)
      }
    }
  }

  processCommand (command) {
    const parts = command.trim().split(/\s+/)
    if (parts.length === 0) return
    const cmd = parts[0]

    const handlers = {
      uci: () => this.cmdUCI(),
      isready: () => this.cmdIsReady(),
      ucinewgame: () => this.cmdUciNewGame(),
      position: () => this.handlePosition(parts.slice(1)),
      setoption: () => this.handleSetOption(parts.slice(1)),
      go: () => this.handleGo(parts.slice(1)),
      stop: () => this.cmdStop(),
      ponderhit: () => this.cmdPonderHit(),
      quit: () => process.exit(0),
      debug_tree: () => this.cmdDebugTree(),
      bench: () => this.cmdBench(),
      perft: () => this.cmdPerft(parts.slice(1)),
      verify: () => this.cmdVerify(),
      garbage_collect: () => this.cmdGarbageCollect(),
      zobrist: () => this.cmdZobrist(),
      memory: () => this.cmdMemory(),
      book: () => this.cmdBook()
    }

    if (handlers[cmd]) handlers[cmd]()
  }

  cmdBook () {
    const moves = this.book.getBookMoves(this.board)
    const movesWithAlgebraic = moves.map(m => ({
      ...m,
      move: this.indexToAlgebraic(m.from) + this.indexToAlgebraic(m.to) + (m.promotion || '')
    }))
    this.output(`info string book_moves ${JSON.stringify(movesWithAlgebraic)}`)
  }

  cmdPerft (args) {
    const depth = parseInt(args[0], 10) || 5
    this.output(`info string running perft ${depth}`)
    const start = performance.now()
    const nodes = this.board.perft(depth)
    const time = performance.now() - start
    const nps = Math.floor(nodes / (time / 1000))
    this.output(`perft_result ${nodes} ${Math.floor(time)} ${nps}`)
  }

  cmdVerify () {
    const result = this.board.verify()
    this.output(`sanity ${result}`)
  }

  cmdGarbageCollect () {
    if (global.gc) {
      global.gc()
      this.output('info string GC executed')
    } else {
      this.output('info string GC not exposed (run with --expose-gc)')
    }
  }

  cmdZobrist () {
    this.output(`zobrist 0x${this.board.zobristKey.toString(16)}`)
  }

  cmdMemory () {
    const mem = process.memoryUsage()
    const rss = Math.round(mem.rss / 1024 / 1024)
    this.output(`memory_usage ${rss}`)
  }

  cmdUCI () {
    this.output('id name JulesGemini')
    this.output('id author JulesGemini')
    this.output(`option name Hash type spin default ${this.options.Hash} min 1 max 1024`)
    this.output('option name Clear Hash type button')
    this.output(`option name Threads type spin default ${this.options.Threads} min 1 max 64`)
    this.output(`option name Ponder type check default ${this.options.Ponder}`)
    this.output(`option name MultiPV type spin default ${this.options.MultiPV} min 1 max 500`)
    this.output(`option name UCI_LimitStrength type check default ${this.options.UCI_LimitStrength}`)
    this.output(`option name UCI_Elo type spin default ${this.options.UCI_Elo} min 100 max 3000`)
    this.output(`option name AspirationWindow type spin default ${this.options.AspirationWindow} min 10 max 500`)
    this.output(`option name Contempt type spin default ${this.options.Contempt} min -100 max 100`)
    this.output('option name UseHistory type check default true')
    this.output('option name UseCaptureHistory type check default true')
    this.output(`option name UCI_UseNNUE type check default ${this.options.UCI_UseNNUE}`)
    this.output(`option name UCI_NNUE_File type string default ${this.options.UCI_NNUE_File}`)
    this.output(`option name BookFile type string default ${this.options.BookFile}`)
    this.output(`option name SyzygyPath type string default ${this.options.SyzygyPath}`)
    this.output(`option name SyzygyProbeLimit type spin default ${this.options.SyzygyProbeLimit} min 0 max 7`)

    const params = Evaluation.getParams()
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'number') {
        this.output(`option name ${key} type spin default ${value} min -2000 max 2000`)
      }
    }

    this.output('uciok')
  }

  cmdIsReady () {
    this.output('readyok')
  }

  cmdUciNewGame () {
    this.board = new Board()
  }

  cmdStop () {
    this.pendingPonder = false
    Atomics.store(this.stopSignal, 0, 1)
    for (const worker of this.workers) {
      worker.postMessage({ type: 'stop' })
    }
    if (this.pendingBestMove) {
      this.output(this.pendingBestMove)
      this.pendingBestMove = null
    }
  }

  cmdPonderHit () {
    this.pendingPonder = false
    if (this.pendingBestMove) {
      this.output(this.pendingBestMove)
      this.pendingBestMove = null
    }
  }

  cmdDebugTree () {
    this.currentSearch = new Search(this.board, this.tt)
    const debugPath = path.join(__dirname, '../../public/debug_tree.json')
    this.currentSearch.search(2, { hardLimit: Infinity }, { debug: true, debugFile: debugPath })
    this.currentSearch = null
    this.output('info string Debug tree written to debug_tree.json')
  }

  cmdBench () {
    Bench.run(this)
  }

  handlePosition (args) {
    let moveStartIndex = 0
    if (args[0] === 'startpos') {
      this.board = new Board()
      moveStartIndex = 1
    } else if (args[0] === 'fen') {
      let movesIndex = args.indexOf('moves')
      if (movesIndex === -1) movesIndex = args.length
      const fen = args.slice(1, movesIndex).join(' ')
      try {
        this.board.loadFen(fen)
      } catch (e) {
        this.output(`info string Invalid FEN: ${e.message}`)
        return
      }
      moveStartIndex = movesIndex
    }

    if (args[moveStartIndex] === 'moves') {
      const moves = args.slice(moveStartIndex + 1)
      for (const moveStr of moves) this.applyAlgebraicMove(moveStr)
    }
  }

  applyAlgebraicMove (moveStr) {
    const fromStr = moveStr.slice(0, 2)
    const toStr = moveStr.slice(2, 4)
    const promotionChar = moveStr.length > 4 ? moveStr[4] : null
    const from = this.board.algebraicToIndex(fromStr)
    const to = this.board.algebraicToIndex(toStr)
    const move = this.board.generateMoves().find(m => m.from === from && m.to === to && (!promotionChar || m.promotion === promotionChar))
    if (move) {
      this.board.applyMove(move)
    } else {
      this.output(`info string Illegal move: ${moveStr}`)
    }
  }

  handleGo (args) {
    const isPonder = args.includes('ponder')
    this.pendingBestMove = null

    if (this._handleBookMove(args, isPonder)) return

    const { depth, nodes, timeLimits, searchMoves, tm } = this._parseGoParams(args)

    this.currentSearch = new Search(this.board, this.tt, this.nnue)
    this._executeSearch(depth, nodes, timeLimits, searchMoves, tm, isPonder)
  }

  _handleBookMove (args, isPonder) {
    if (!args.includes('infinite') && !isPonder) {
      const bookMove = this.book.findMove(this.board)
      if (bookMove) {
        const fromAlg = this.indexToAlgebraic(bookMove.from)
        const toAlg = this.indexToAlgebraic(bookMove.to)
        this.output(`bestmove ${fromAlg}${toAlg}${bookMove.promotion || ''}`)
        return true
      }
    }
    return false
  }

  _parseGoParams (args) {
    let searchMoves = null
    if (args.includes('searchmoves')) {
      const idx = args.indexOf('searchmoves')
      searchMoves = args.slice(idx + 1)
    }

    const tm = new TimeManager(this.board)
    const timeLimits = tm.parseGoCommand(args, this.board.activeColor)
    const depth = this.getSearchDepth(args)
    let nodes = null
    const nodesIdx = args.indexOf('nodes')
    if (nodesIdx !== -1) nodes = parseInt(args[nodesIdx + 1], 10)

    if (args.includes('depth') || nodes !== null) {
      if (!args.includes('wtime') && !args.includes('movetime')) {
        timeLimits.hardLimit = Infinity
        timeLimits.softLimit = Infinity
      }
    }

    return { depth, nodes, timeLimits, searchMoves, tm }
  }

  _executeSearch (depth, nodes, timeLimits, searchMoves, tm, isPonder) {
    Atomics.store(this.stopSignal, 0, 0)
    this.pendingPonder = isPonder
    const searchOptions = {
      ...this.options,
      searchMoves,
      nodes
    }

    this.workers.forEach((worker, index) => {
      worker.postMessage({
        type: 'search',
        fen: this.board.generateFen(),
        depth,
        limits: timeLimits,
        options: searchOptions,
        isMain: index === 0
      })
    })
  }

  getSearchDepth (args) {
    if (args.includes('depth')) {
      return parseInt(args[args.indexOf('depth') + 1], 10)
    } else if (args.includes('nodes')) {
      return 128
    } else if (!args.includes('wtime') && !args.includes('movetime') && !args.includes('infinite')) {
      return 5
    }
    return 64
  }

  indexToAlgebraic (index) {
    const { row, col } = this.board.toRowCol(index)
    return `${String.fromCharCode('a'.charCodeAt(0) + col)}${8 - row}`
  }

  handleSetOption (args) {
    let nameIdx = -1; let valueIdx = -1
    for (let i = 0; i < args.length; i++) {
      if (args[i] === 'name') nameIdx = i
      if (args[i] === 'value') valueIdx = i
    }
    if (nameIdx === -1) return
    const name = args.slice(nameIdx + 1, valueIdx !== -1 ? valueIdx : args.length).join(' ')
    const value = this._parseOptionValue(args, valueIdx)
    this.applyOption(name, value)
  }

  _parseOptionValue (args, valueIdx) {
    if (valueIdx !== -1 && valueIdx + 1 < args.length) {
      const valStr = args[valueIdx + 1]
      if (valStr === 'true') return true
      if (valStr === 'false') return false
      return isNaN(parseInt(valStr, 10)) ? valStr : parseInt(valStr, 10)
    }
    return null
  }

  applyOption (name, value) {
    if (name === 'Clear Hash') {
      this.tt.clear()
      this.output('info string Hash cleared')
      return
    }

    if (Object.prototype.hasOwnProperty.call(this.options, name)) {
      this.options[name] = value
      this._handleSpecialOption(name, value)
    } else {
      Evaluation.updateParam(name, value)
    }
  }

  _handleSpecialOption (name, value) {
    if (name === 'Hash' && this.options.Threads === 1) {
      this.tt.resize(value)
      this.output(`info string Hash resized to ${value} MB`)
    } else if (name === 'Threads') {
      this.stopWorkers()
      this.startWorkers()
    } else if (name === 'UCI_UseNNUE' || name === 'UCI_NNUE_File') {
      if (this.options.UCI_UseNNUE) {
        this.nnue.loadNetwork(this.options.UCI_NNUE_File).catch(err => {
          this.output(`info string Failed to load NNUE: ${err.message}`)
          this.options.UCI_UseNNUE = false
        })
      }
    } else if (name === 'BookFile') {
      this.book.loadBook(value)
    } else if (name === 'SyzygyPath') {
      this.syzygy.path = value
    }
  }
}

module.exports = UCI
