#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// SPSA Constants
const c = 2 // Step size for perturbation
const a = 10 // Step size for update
const A = 10 // Stability constant
const alpha = 0.602
const gamma = 0.101

// Parameters to tune (keys must match Evaluation.Params)
const PARAM_NAMES = [
  'PawnValue',
  'KnightValue',
  'BishopValue',
  'RookValue',
  'QueenValue',
  'DoubledPawnPenalty',
  'IsolatedPawnPenalty',
  'BackwardPawnPenalty',
  'MobilityBonus',
  'ShieldBonus'
]

// Initial values (will be loaded from engine or hardcoded for start)
let theta = [100, 320, 330, 500, 900, 10, 15, 10, 2, 5]

async function runTuner (iterations = 10) {
  console.log('Starting SPSA Tuner...')

  for (let k = 0; k < iterations; k++) {
    const ak = a / Math.pow(k + 1 + A, alpha)
    const ck = c / Math.pow(k + 1, gamma)

    // Bernoulli distribution +/- 1
    const delta = theta.map(() => Math.random() < 0.5 ? 1 : -1)

    // Perturb parameters
    const thetaPlus = theta.map((val, i) => val + ck * delta[i])
    const thetaMinus = theta.map((val, i) => val - ck * delta[i])

    // Evaluate Theta Plus
    console.log(`Iteration ${k + 1}: Evaluating Theta+`)
    const scorePlus = await evaluateParameters(thetaPlus)

    // Evaluate Theta Minus
    console.log(`Iteration ${k + 1}: Evaluating Theta-`)
    const scoreMinus = await evaluateParameters(thetaMinus)

    // Estimate gradient
    const gh = delta.map((d, i) => (scorePlus - scoreMinus) / (2 * ck * d))

    // Update theta
    theta = theta.map((val, i) => val - ak * gh[i])

    console.log(`Iteration ${k + 1} complete.`)
    console.log('Updated Theta:', PARAM_NAMES.map((n, i) => `${n}=${Math.round(theta[i])}`).join(', '))
  }
}

async function evaluateParameters (params) {
  // Eval Plus: Play Theta+ vs Reference.
  const wrapperPlus = createWrapperScript('engine_plus.js', params)
  const scoreP = await runMatchAndGetScore(wrapperPlus, './src/engine.js') // Ref is default engine

  return scoreP
}

async function runMatchAndGetScore (engineTest, engineRef) {
  const { playMatch } = require('./match.js')

  // Run 10 games for speed? SPSA is noisy, needs many games.
  // For this demo, let's do 4 games.
  const games = 4

  const results = await playMatch(engineTest, engineRef, games)
  // p1 is Test, p2 is Ref.
  const points = results.p1Wins + 0.5 * results.draws
  const total = games
  const score = points / total

  // We want to MAXIMIZE score. SPSA minimizes loss.
  // So return -score.
  return -score
}

function createWrapperScript (filename, params) {
  const fullPath = path.resolve(__dirname, filename)
  const enginePath = path.resolve(__dirname, '../src/engine.js')

  const content = `#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const engine = spawn('${enginePath}', [], { shell: true });

engine.stdout.pipe(process.stdout);
process.stdin.pipe(engine.stdin);

// Inject options
const commands = [
${PARAM_NAMES.map((n, i) => `'setoption name ${n} value ${Math.round(params[i])}'`).join(',\n')}
];

commands.forEach(cmd => engine.stdin.write(cmd + '\\n'));
`

  fs.writeFileSync(fullPath, content)
  fs.chmodSync(fullPath, '755')
  return fullPath
}

if (require.main === module) {
  runTuner(2).catch(console.error)
}
