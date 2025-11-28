const { parentPort, workerData } = require('worker_threads')
const Search = require('./Search')
const Board = require('./Board')
const { TranspositionTable } = require('./TranspositionTable')

// Worker Data: { sharedBuffer, hashSize, options }
const { sharedBuffer, hashSize, options } = workerData

// Init TT
const tt = new TranspositionTable(hashSize, sharedBuffer)

// Init Board (Need a way to set position from messages)
const board = new Board()
let currentSearch = null

parentPort.on('message', (msg) => {
  if (msg.type === 'search') {
    // Update board
    if (msg.fen) board.loadFen(msg.fen)

    currentSearch = new Search(board, tt)

    const searchOptions = { ...options, ...(msg.options || {}) }
    currentSearch.search(msg.depth || 64, msg.limits, searchOptions)

    parentPort.postMessage({ type: 'done' })
  } else if (msg.type === 'stop') {
    if (currentSearch) {
      currentSearch.stopFlag = true
    }
  } else if (msg.type === 'quit') {
    process.exit(0)
  }
})
