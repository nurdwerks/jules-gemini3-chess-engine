#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn } = require('child_process');
const { Worker } = require('worker_threads');
const os = require('os');

const Board = require('../src/Board');
const Search = require('../src/Search');
const { TranspositionTable } = require('../src/TranspositionTable');
const { NNUE } = require('../src/NNUE');
const SEE = require('../src/SEE');

const EPD_JSON_PATH = path.join(__dirname, '..', 'epd.json');
const CUMULATIVE_DATA_FILE = path.join(process.cwd(), 'tuning_data_cumulative.epd');

// --- Helper Functions ---

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

async function runTunerAndCleanup(sourceFile, shouldCleanup = true) {
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
         if (shouldCleanup && fs.existsSync(sourceFile)) fs.unlinkSync(sourceFile);
         if (fs.existsSync(CUMULATIVE_DATA_FILE)) fs.unlinkSync(CUMULATIVE_DATA_FILE);
    } else {
        console.log("No cumulative data to tune.");
        if (shouldCleanup && fs.existsSync(sourceFile)) fs.unlinkSync(sourceFile);
    }
}

// --- Game Logic ---

function playGame(startFen, tt, nnue) {
    const board = new Board();
    try {
        if (startFen === 'startpos') board.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        else board.loadFen(startFen);
    } catch (e) {
        console.error(`Invalid FEN: ${startFen}`, e.message);
        return null;
    }

    const gamePositions = [];
    // Store initial position
    gamePositions.push(board.generateFen());

    // Options for search
    const options = {
        Hash: 16, // This is just option passing, actual TT is passed in constructor
        UCI_UseNNUE: true,
        UCI_LimitStrength: false,
        UCI_Elo: 3000,
        UseHistory: true,
        Contempt: 0,
        AspirationWindow: 50,
        UCI_NNUE_File: 'nn-46832cfbead3.nnue' // Filename only, assumes loaded or file present
    };

    const search = new Search(board, tt, nnue);

    let moveCount = 0;
    const MAX_MOVES = 200; // Avoid infinite games
    let result = 0.5; // Default draw
    let gameOver = false;

    while (!gameOver && moveCount < MAX_MOVES) {
        // Search
        // Use hardLimit of 100ms per move (similar to match.js go movetime 100)
        const bestMove = search.search(64, { hardLimit: 100, softLimit: 100 }, options);

        if (!bestMove) {
            break;
        }

        board.applyMove(bestMove);
        moveCount++;
        gamePositions.push(board.generateFen());

        // Check Game Over
        const legalMoves = board.generateMoves();
        if (legalMoves.length === 0) {
            if (board.isInCheck()) {
                result = (board.activeColor === 'w') ? 0.0 : 1.0;
            } else {
                result = 0.5;
            }
            gameOver = true;
        } else if (board.isDrawBy50Moves() || board.isDrawByRepetition()) {
            result = 0.5;
            gameOver = true;
        }
    }

    if (!gameOver && moveCount >= MAX_MOVES) {
        result = 0.5; // Adjudicate draw
    }

    return { result, positions: gamePositions };
}

// --- Main ---

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
        console.error('Usage: node tools/download_and_tune.js <index | local_file_path>');
        console.log('Available datasets:');
        epdLinks.forEach((link, i) => console.log(`  ${i}: ${path.basename(link)}`));
        process.exit(1);
    }

    const inputArg = args[0];
    let destPath;
    let shouldCleanup = true;

    if (fs.existsSync(inputArg)) {
        console.log(`Using local file: ${inputArg}`);
        destPath = inputArg;
        shouldCleanup = false;
    } else {
        const index = parseInt(inputArg, 10);

        if (isNaN(index) || index < 0 || index >= epdLinks.length) {
            console.error(`Error: Argument '${inputArg}' is neither a valid index (0-${epdLinks.length - 1}) nor a valid local file path.`);
            process.exit(1);
        }

        const url = epdLinks[index];
        const filename = path.basename(url);
        destPath = path.join(process.cwd(), filename);

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
    }

    // Prepare Workers
    let numWorkers = os.cpus().length || 2;
    if (process.env.TEST_MODE === 'true') {
        numWorkers = 3;
    }
    console.log(`Using ${numWorkers} worker threads.`);

    // 1. Prepare TT (Shared)
    const TT_SIZE_MB = 64;
    const masterTT = new TranspositionTable(TT_SIZE_MB);
    const ttBuffer = masterTT.buffer;

    // 2. Prepare NNUE File
    const nnueUrl = 'https://tests.stockfishchess.org/api/nn/nn-46832cfbead3.nnue';
    const nnueFilename = 'nn-46832cfbead3.nnue';
    const nnuePath = path.join(process.cwd(), nnueFilename);

    if (!fs.existsSync(nnuePath)) {
        console.log(`Downloading NNUE to ${nnuePath}...`);
        await downloadFile(nnueUrl, nnuePath);
    } else {
        console.log(`Using existing NNUE file: ${nnuePath}`);
    }

    // 3. Process Lines
    const content = fs.readFileSync(destPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    const fens = lines.map(l => l.split(';')[0].trim()).filter(f => f);

    if (fens.length === 0) {
        console.log("File is empty or no valid FENs. Checking for cumulative data...");
        await runTunerAndCleanup(destPath);
        process.exit(0);
    }

    console.log(`Processing ${fens.length} positions using ${numWorkers} workers...`);

    // Clear temp batch results
    const tempOut = path.join(process.cwd(), 'temp_batch_results.epd');
    if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);

    // 4. Distribute Work
    const chunkSize = Math.ceil(fens.length / numWorkers);
    const chunks = [];
    for (let i = 0; i < numWorkers; i++) {
        const start = i * chunkSize;
        const end = start + chunkSize;
        const chunk = fens.slice(start, end);
        if (chunk.length > 0) chunks.push({ id: i, fens: chunk, startIdx: start });
    }

    let completedGames = 0;
    const totalGames = fens.length;
    const startTime = Date.now();
    let workersActive = 0;

    const workerPromises = chunks.map(chunk => {
        return new Promise((resolve, reject) => {
            const worker = new Worker(path.join(__dirname, 'game_worker.js'));
            workersActive++;

            worker.on('message', (msg) => {
                if (msg.type === 'ready') {
                    console.log(`Worker ${chunk.id} ready.`);
                    worker.postMessage({
                        type: 'play',
                        fens: chunk.fens,
                        startIndex: chunk.startIdx
                    });
                } else if (msg.type === 'result') {
                    const { result, positions, index } = msg;
                    let resultStr = "1/2-1/2";
                    if (result === 1.0) resultStr = "1-0";
                    if (result === 0.0) resultStr = "0-1";

                    const outputData = positions.map(f => `${f}; result ${resultStr};`).join('\n') + '\n';
                    fs.appendFileSync(tempOut, outputData);

                    completedGames++;

                    const elapsed = (Date.now() - startTime) / 1000;
                    const rate = completedGames / elapsed;
                    console.log(`[Worker ${chunk.id}] Game ${index} finished (${resultStr}). Progress: ${completedGames}/${totalGames} (${(completedGames/totalGames*100).toFixed(1)}%). Rate: ${rate.toFixed(2)} g/s.`);

                } else if (msg.type === 'batch_complete') {
                    console.log(`Worker ${chunk.id} finished batch.`);
                    worker.terminate();
                    workersActive--;
                    resolve();
                } else if (msg.type === 'error') {
                    console.error(`[Worker ${chunk.id}] Error at index ${msg.index}: ${msg.message}`);
                }
            });

            worker.on('error', (err) => {
                console.error(`Worker ${chunk.id} error:`, err);
                reject(err);
            });

            worker.on('exit', (code) => {
                if (code !== 0 && workersActive > 0) {
                     reject(new Error(`Worker ${chunk.id} stopped with exit code ${code}`));
                }
            });

            worker.postMessage({
                type: 'init',
                ttBuffer: ttBuffer,
                ttSizeMB: TT_SIZE_MB,
                nnueFile: nnuePath
            });
        });
    });

    try {
        await Promise.all(workerPromises);
    } catch (e) {
        console.error("Error during worker execution:", e);
        process.exit(1);
    }

    console.log("All games finished.");

    if (fs.existsSync(tempOut)) {
         const data = fs.readFileSync(tempOut, 'utf8');
         fs.appendFileSync(CUMULATIVE_DATA_FILE, data);
         fs.unlinkSync(tempOut);
         if (shouldCleanup) {
             fs.writeFileSync(destPath, '');
             console.log("Source file cleared.");
         }
    }

    await runTunerAndCleanup(destPath, shouldCleanup);
}

if (require.main === module) {
    main().catch(err => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { playGame, main };
