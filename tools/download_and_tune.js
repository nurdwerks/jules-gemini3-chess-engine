#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn } = require('child_process');

const EPD_JSON_PATH = path.join(__dirname, '..', 'epd.json');

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

    // Run the tuner
    const tunerScript = path.join(__dirname, 'tune_from_epd.js');
    console.log(`Running: node ${tunerScript} ${filename}`);

    const child = spawn('node', [tunerScript, destPath], {
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
