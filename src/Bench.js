const Search = require('./Search')
const { TranspositionTable } = require('./TranspositionTable')

class Bench {
  static run (uci, depth = 12) {
    const positions = [
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Start
      'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1', // Kiwipete
      '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1' // Endgame
    ]

    console.log(`Benchmarking ${positions.length} positions at depth ${depth}...`)

    const runBenchmark = (threads) => {
      let totalNodes = 0
      let totalTime = 0
      const startTotal = Date.now()

      console.log(`\nRunning with ${threads} threads`)
      uci.options.Threads = threads
      uci.stopWorkers()
      uci.startWorkers()

      for (const fen of positions) {
        uci.board.loadFen(fen)
        const search = new Search(uci.board, uci.tt)
        const start = Date.now()

        search.search(depth, { hardLimit: Infinity }, uci.options)

        const end = Date.now()
        const nodes = search.nodes
        const time = end - start

        console.log(`Position: ${fen}`)
        console.log(`Nodes: ${nodes}, Time: ${time}ms, NPS: ${Math.floor(nodes / (time / 1000 + 0.001))}`)

        totalNodes += nodes
        totalTime += time
      }
      const totalElapsed = Date.now() - startTotal
      console.log('---------------------------')
      console.log(`Total Nodes: ${totalNodes}`)
      console.log(`Total Time: ${totalElapsed}ms`)
      const nps = Math.floor(totalNodes / (totalElapsed / 1000))
      console.log(`Mean NPS: ${nps}`)
      return nps
    }

    const nps1 = runBenchmark(1)
    const nps4 = runBenchmark(4)

    console.log('===========================')
    console.log(`NPS with 1 thread: ${nps1}`)
    console.log(`NPS with 4 threads: ${nps4}`)

    const scaling = (nps4 / nps1).toFixed(2)
    console.log(`Scaling: ${scaling}x`)

    return nps4
  }
}

module.exports = Bench
