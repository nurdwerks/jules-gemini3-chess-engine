#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn } = require('child_process');
const EpdLoader = require('./EpdLoader');

const EPD_JSON_PATH = path.join(__dirname, '..', 'epd.json');
const CUMULATIVE_DATA_FILE = path.join(process.cwd(), 'tuning_data_cumulative.epd');

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : require('http');

        const request = protocol.get(url, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                const newUrl = response.headers.location;
                console.log(`Redirecting to ${newUrl}...`);
                downloadFile(newUrl, dest).then(resolve).catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Server responded with ${response.statusCode}: ${response.statusMessage}`));
                return;
            }

            const file = fs.createWriteStream(dest);
            response.pipe(file);

            file.on('finish', () => {
                file.close(() => resolve(dest));
            });

            file.on('error', (err) => {
                fs.unlink(dest, () => {});
                reject(err);
            });
        });

        request.on('error', (err) => {
            reject(err);
        });
    });
}

async function runTunerAndCleanup(sourceFile) {
    if (fs.existsSync(CUMULATIVE_DATA_FILE)) {
         const tunerScript = path.join(__dirname, 'tune_from_epd.js');
         console.log(`Running tuner on ${CUMULATIVE_DATA_FILE}...`);

         const child = spawn('node', [tunerScript, CUMULATIVE_DATA_FILE], { stdio: 'inherit' });

         await new Promise((resolve, reject) => {
            child.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`Tuner exited with code ${code}`));
            });
            child.on('error', reject);
         });

         console.log("Tuning complete. Cleaning up files...");
         if (fs.existsSync(sourceFile)) fs.unlinkSync(sourceFile);
         if (fs.existsSync(CUMULATIVE_DATA_FILE)) fs.unlinkSync(CUMULATIVE_DATA_FILE);
    } else {
        console.log("No cumulative data to tune.");
        if (fs.existsSync(sourceFile)) fs.unlinkSync(sourceFile);
    }
}

async function main() {
    const args = process.argv.slice(2);

    // Load EPD links
    let epdLinks;
    try {
        const content = fs.readFileSync(EPD_JSON_PATH, 'utf8');
        epdLinks = JSON.parse(content);
    } catch (err) {
        console.error(`Error reading ${EPD_JSON_PATH}:`, err.message);
        process.exit(1);
    }

    if (args.length === 0) {
        console.error('Usage: node tools/download_and_tune.js <index>');
        console.log('Available datasets:');
        epdLinks.forEach((link, i) => console.log(`  ${i}: ${path.basename(link)}`));
        process.exit(1);
    }

    const index = parseInt(args[0], 10);

    if (isNaN(index) || index < 0 || index >= epdLinks.length) {
        console.error(`Error: Index ${index} is out of bounds (0-${epdLinks.length - 1}).`);
        process.exit(1);
    }

    const url = epdLinks[index];
    const filename = path.basename(url);
    const destPath = path.join(process.cwd(), filename);

    console.log(`Selected Dataset: ${filename}`);
    console.log(`URL: ${url}`);

    if (fs.existsSync(destPath)) {
        console.log(`File '${filename}' already exists locally.`);
    } else {
        console.log(`Downloading...`);
        try {
            await downloadFile(url, destPath);
            console.log('Download complete.');
        } catch (err) {
            console.error(`Download failed: ${err.message}`);
            if (fs.existsSync(destPath)) {
                fs.unlinkSync(destPath);
            }
            process.exit(1);
        }
    }

    // Batch Processing Logic
    const content = fs.readFileSync(destPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);

    if (lines.length === 0) {
        console.log("File is empty. Checking for cumulative data...");
        await runTunerAndCleanup(destPath);
        process.exit(0);
    }

    console.log(`File has ${lines.length} positions. Running match to generate tuning data...`);

    const tempOut = path.join(process.cwd(), 'temp_batch_results.epd');
    const matchScript = path.join(__dirname, 'match.js');

    // Run match for ALL lines
    // match.js usage: --epd <file> --output <file> --games <count>
    // It will cycle through startFens. If games == lines.length, it plays 1 game from each position.

    const match = spawn('node', [
        matchScript,
        '--epd', destPath,
        '--output', tempOut,
        '--games', lines.length.toString(),
        '--concurrency', '1',
        '--silent'
    ], { stdio: 'inherit' });

    try {
        await new Promise((resolve, reject) => {
            match.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`Match failed code ${code}`));
            });
            match.on('error', reject);
        });
    } catch (e) {
        console.error("Match process encountered an error:", e);
        // Do not delete destPath so we can retry
        process.exit(1);
    }

    if (fs.existsSync(tempOut)) {
         const data = fs.readFileSync(tempOut, 'utf8');
         const resultLines = data.split('\n').filter(l => l.trim().length > 0);
         console.log(`Match finished. Generated ${resultLines.length} positions.`);

         fs.appendFileSync(CUMULATIVE_DATA_FILE, data);
         fs.unlinkSync(tempOut);

         // Clear source file to indicate completion (and avoid re-processing)
         fs.writeFileSync(destPath, '');
         console.log("Source file cleared.");
    } else {
        console.warn("No output file from match. Maybe no games were played?");
    }

    // Run tuner
    await runTunerAndCleanup(destPath);
}

if (require.main === module) {
    main().catch(err => {
        console.error(err);
        process.exit(1);
    });
}
