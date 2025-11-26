const { playMatch } = require('./match.js');
const EpdLoader = require('./EpdLoader.js');
const Tuner = require('./Tuner.js');
const fs = require('fs');

const EPD_FILE = 'tuning_data.epd';
const TUNED_PARAMS_FILE = 'tuned_evaluation_params.json';
const SELFPLAY_GAMES = 10; // Small number for testing the pipeline

async function main() {
    console.log('--- Starting Evaluation Tuning Pipeline ---');

    // Step 1: Generate self-play data
    console.log(`\n[Step 1/4] Generating self-play data (${SELFPLAY_GAMES} games)...`);
    // Clear old EPD file if it exists
    if (fs.existsSync(EPD_FILE)) {
        fs.unlinkSync(EPD_FILE);
    }
    await playMatch('./src/engine.js', './src/engine.js', SELFPLAY_GAMES, { epdFile: EPD_FILE });
    console.log(`Self-play complete. Data saved to ${EPD_FILE}.`);


    // Step 2: Load EPD data
    console.log(`\n[Step 2/4] Loading positions from ${EPD_FILE}...`);
    if (!fs.existsSync(EPD_FILE)) {
        console.error('EPD file not found. Aborting.');
        return;
    }
    const positions = await EpdLoader.load(EPD_FILE);
    console.log(`Loaded ${positions.length} positions.`);
    if (positions.length === 0) {
        console.error('No positions loaded. Aborting tuning.');
        return;
    }


    // Step 3: Run the tuner
    console.log('\n[Step 3/4] Running the tuner...');
    const tuner = new Tuner();
    // In a real scenario, you'd use more iterations
    tuner.minimize(positions, 5);
    console.log('Tuning complete.');


    // Step 4: Save the new weights
    console.log(`\n[Step 4/4] Saving tuned parameters to ${TUNED_PARAMS_FILE}...`);
    tuner.saveWeights(TUNED_PARAMS_FILE);
    console.log('Parameters saved.');

    console.log('\n--- Pipeline Finished Successfully ---');
}

if (require.main === module) {
    main().catch(err => {
        console.error('Pipeline failed:', err);
    });
}
