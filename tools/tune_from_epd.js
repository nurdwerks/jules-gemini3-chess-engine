const Tuner = require('./Tuner.js')
const EpdLoader = require('./EpdLoader.js')
const fs = require('fs')
const path = require('path')

const TUNED_PARAMS_FILE = path.join(__dirname, '..', 'tuned_evaluation_params.json')

async function main () {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error('Usage: node tools/tune_from_epd.js <path_to_epd_file> [iterations]')
    process.exit(1)
  }

  const epdFile = args[0]
  const iterations = args[1] ? parseInt(args[1], 10) : 5

  if (!fs.existsSync(epdFile)) {
    console.error(`Error: File not found: ${epdFile}`)
    process.exit(1)
  }

  console.log(`--- Tuning from EPD: ${epdFile} ---`)

  // Load positions
  console.log('Loading positions...')
  const positions = await EpdLoader.load(epdFile)
  console.log(`Loaded ${positions.length} positions.`)

  if (positions.length === 0) {
    console.error('No valid positions found. Ensure EPD contains FEN and result (1-0, 0-1, 1/2-1/2).')
    process.exit(1)
  }

  // Run Tuner
  console.log(`Running tuner for ${iterations} iterations...`)
  const tuner = new Tuner()

  // Initial error
  const initialError = tuner.calculateError(positions)
  console.log(`Initial Error: ${initialError.toFixed(6)}`)

  tuner.minimize(positions, iterations)

  // Save weights
  console.log(`Saving parameters to ${TUNED_PARAMS_FILE}...`)
  tuner.saveWeights(TUNED_PARAMS_FILE)
  console.log('Done.')
}

if (require.main === module) {
  main().catch(console.error)
}
