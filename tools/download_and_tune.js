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
                fs.unlink(dest, () => {}); // Delete the file async. (But we don't check result)
                reject(err);
            });
        });

        request.on('error', (err) => {
            reject(err);
        });
    });
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
        console.error('Usage: node tools/download_and_tune.js <index> [--process-one]');
        console.log('Available datasets:');
        epdLinks.forEach((link, i) => console.log(`  ${i}: ${path.basename(link)}`));
        process.exit(1);
    }

    const index = parseInt(args[0], 10);
    const processOne = args.includes('--process-one');

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
        console.log(`File '${filename}' already exists locally. Skipping download.`);
    } else {
        console.log(`Downloading...`);
        try {
            await downloadFile(url, destPath);
            console.log('Download complete.');
        } catch (err) {
            console.error(`Download failed: ${err.message}`);
            // Clean up partial file if it exists and failed
            if (fs.existsSync(destPath)) {
                fs.unlinkSync(destPath);
            }
            process.exit(1);
        }
    }

    if (processOne) {
        console.log("Processing first line...");
        const content = fs.readFileSync(destPath, 'utf8');
        const lines = content.split('\n').filter(l => l.trim().length > 0);

        if (lines.length === 0) {
            console.log("File is empty. Nothing to process.");
            process.exit(0);
        }

        const firstLine = lines[0];
        const remainingLines = lines.slice(1);

        // Rewrite file without first line
        fs.writeFileSync(destPath, remainingLines.join('\n') + (remainingLines.length > 0 ? '\n' : ''));
        console.log(`Removed first line. Remaining: ${remainingLines.length}`);

        // Process first line
        const tempFile = path.join(process.cwd(), 'temp_single_line.epd');
        const tempOut = path.join(process.cwd(), 'temp_single_result.epd');
        fs.writeFileSync(tempFile, firstLine);

        // Check if line has result?
        const parsed = EpdLoader.parseLine(firstLine);
        if (parsed && parsed.result !== null) {
            console.log("Line has result. Appending to cumulative data.");
            fs.appendFileSync(CUMULATIVE_DATA_FILE, firstLine + '\n');
        } else {
            console.log("Line needs result. Running match...");
            // Run match on this single line
             const matchScript = path.join(__dirname, 'match.js');
             const match = spawn('node', [
                matchScript,
                '--epd', tempFile,
                '--output', tempOut,
                '--games', '1',
                '--concurrency', '1',
                '--silent'
            ], { stdio: 'inherit' });

            await new Promise((resolve, reject) => {
                match.on('close', (code) => {
                    if (code === 0) resolve();
                    else reject(new Error(`Match failed code ${code}`));
                });
                match.on('error', reject);
            });

            if (fs.existsSync(tempOut)) {
                const res = fs.readFileSync(tempOut, 'utf8');
                fs.appendFileSync(CUMULATIVE_DATA_FILE, res);
                console.log("Result generated and saved.");
                fs.unlinkSync(tempOut);
            } else {
                console.error("No result generated.");
            }
        }

        fs.unlinkSync(tempFile);

        // Tune on cumulative
        if (fs.existsSync(CUMULATIVE_DATA_FILE)) {
             const tunerScript = path.join(__dirname, 'tune_from_epd.js');
             console.log(`Running tuner on ${CUMULATIVE_DATA_FILE}...`);
             const child = spawn('node', [tunerScript, CUMULATIVE_DATA_FILE], { stdio: 'inherit' });

             child.on('close', (code) => {
                console.log(`Tuner finished with code ${code}`);
                process.exit(code);
            });
        } else {
            console.log("No cumulative data to tune yet.");
        }
        return;
    }

    // Default behavior (process whole file)
    console.log('Validating EPD format...');
    const positions = await EpdLoader.load(destPath);
    let targetFile = destPath;

    if (positions.length === 0) {
        console.log('No valid results found in EPD (e.g. 1-0, 0-1, 1/2-1/2).');
        console.log('Assuming dataset is a test suite or opening book.');
        console.log('Starting self-play to generate tuning data from these positions...');

        // Run match.js
        const matchScript = path.join(__dirname, 'match.js');
        const generatedEpd = path.join(process.cwd(), 'tuning_data_generated.epd');

        // Count lines in EPD to decide games?
        const content = fs.readFileSync(destPath, 'utf8');
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        // Limit games to avoid timeouts in restricted environments, but enough for tuning.
        const gameCount = Math.min(lines.length, 40);

        console.log(`Running ${gameCount} games with concurrency 4...`);

        const match = spawn('node', [
            matchScript,
            '--epd', destPath,
            '--output', generatedEpd,
            '--games', gameCount.toString(),
            '--concurrency', '4',
            '--silent'
        ], { stdio: 'inherit' });

        await new Promise((resolve, reject) => {
            match.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`Match process failed with code ${code}`));
            });
            match.on('error', reject);
        });

        console.log(`Generated tuning data at ${generatedEpd}`);
        targetFile = generatedEpd;
    } else {
        console.log(`Found ${positions.length} positions with results.`);
    }

    // Run the tuner
    const tunerScript = path.join(__dirname, 'tune_from_epd.js');
    console.log(`Running: node ${tunerScript} ${targetFile}`);

    const child = spawn('node', [tunerScript, targetFile], {
        stdio: 'inherit'
    });

    child.on('close', (code) => {
        console.log(`Tuner process exited with code ${code}`);
        process.exit(code);
    });

    child.on('error', (err) => {
        console.error('Failed to start tuner process:', err);
        process.exit(1);
    });
}

if (require.main === module) {
    main().catch(err => {
        console.error(err);
        process.exit(1);
    });
}
