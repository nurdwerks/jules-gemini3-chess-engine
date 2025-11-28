#!/usr/bin/env node

const { playMatch } = require('./match.js')

// SPRT Parameters
const alpha = 0.05
const beta = 0.05
const elo0 = 0
const elo1 = 5

// Convert Elo to winning probability
function eloToProb (elo) {
  return 1 / (1 + Math.pow(10, -elo / 400))
}

const u0 = eloToProb(elo0)
const u1 = eloToProb(elo1)

const A = Math.log(beta / (1 - alpha))
const B = Math.log((1 - beta) / alpha)

console.log('SPRT Configuration:')
console.log(`H0: Elo = ${elo0} (Score ${u0.toFixed(3)})`)
console.log(`H1: Elo = ${elo1} (Score ${u1.toFixed(3)})`)
console.log(`Bounds: A=${A.toFixed(3)}, B=${B.toFixed(3)}`)

async function runSPRT (testEngine, baseEngine) {
  let llr = 0
  let wins = 0
  let losses = 0
  let draws = 0
  let games = 0

  while (llr > A && llr < B) {
    // Run a pair of games
    const results = await playMatch(testEngine, baseEngine, 2)

    const w = results.p1Wins
    const l = results.p2Wins
    const d = results.draws

    wins += w
    losses += l
    draws += d
    games += (w + l + d)

    // Update LLR for W wins, L losses, D draws
    const llr_win = Math.log(u1 / u0)
    const llr_loss = Math.log((1 - u1) / (1 - u0))
    const llr_draw = Math.log((Math.sqrt(u1 * (1 - u1))) / Math.sqrt(u0 * (1 - u0))) // Often approximated?

    llr += w * llr_win
    llr += l * llr_loss
    llr += d * ((llr_win + llr_loss) / 2)

    const score = (wins + 0.5 * draws) / games
    const eloDiff = -400 * Math.log10(1 / score - 1)

    console.log(`Games: ${games} (W:${wins} L:${losses} D:${draws}). Score: ${(score * 100).toFixed(2)}%. Elo: ${eloDiff.toFixed(2)}. LLR: ${llr.toFixed(2)} [${A.toFixed(2)}, ${B.toFixed(2)}]`)
  }

  if (llr >= B) {
    console.log('H1 Accepted: Engine is stronger.')
  } else {
    console.log('H0 Accepted: Engine is not stronger.')
  }
}

if (require.main === module) {
  const args = process.argv.slice(2)
  const e1 = args[0] || './src/engine.js'
  const e2 = args[1] || './src/engine.js'
  runSPRT(e1, e2).catch(console.error)
}
