#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn } = require('child_process');

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
        Hash: 16,
        UCI_UseNNUE: true,
        UCI_LimitStrength: false,
        UCI_Elo: 3000,
        UseHistory: true,
        Contempt: 0,
        AspirationWindow: 50,
        UCI_NNUE_File: 'https://tests.stockfishchess.org/api/nn/nn-46832cfbead3.nnue'
    };

    // Use a fresh search instance or reuse? Reusing is better for history/killers if we wanted,
    // but here we want each game to be independent usually,
    // BUT preserving TT is good. Search constructor takes TT.
    // We create a new Search instance per game to reset history/killers,
    // but pass the shared TT.

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
            // No move found? Should be mate or stalemate checked below.
            // If checkmate/stalemate logic wasn't triggered before search, maybe now?
            break;
        }

        board.applyMove(bestMove);
        moveCount++;
        gamePositions.push(board.generateFen());

        // Check Game Over
        const legalMoves = board.generateMoves();
        if (legalMoves.length === 0) {
            if (board.isInCheck()) {
                // Checkmate
                // Active color lost.
                result = (board.activeColor === 'w') ? 0.0 : 1.0;
            } else {
                // Stalemate
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

    // Initialize Engine Components
    console.log("Initializing Engine (NNUE + TT)...");
    const tt = new TranspositionTable(64); // 64MB TT
    const nnue = NNUE();
    // Use default NNUE file
    const nnueFile = 'https://tests.stockfishchess.org/api/nn/nn-46832cfbead3.nnue';
    try {
        await nnue.loadNetwork(nnueFile);
        console.log("NNUE loaded.");
    } catch (e) {
        console.warn("Failed to load NNUE, falling back to HCE:", e.message);
        // Note: Search handles null nnue gracefully
    }

    // Process Lines
    const content = fs.readFileSync(destPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);

    if (lines.length === 0) {
        console.log("File is empty. Checking for cumulative data...");
        await runTunerAndCleanup(destPath);
        process.exit(0);
    }

    console.log(`File has ${lines.length} positions. Processing sequentially...`);

    // Clear temp batch results if exists (or cumulative data file?)
    // The original script appended to CUMULATIVE_DATA_FILE.
    // We can append directly to CUMULATIVE_DATA_FILE or a temp file.
    // Writing to temp file is safer in case of crash.
    const tempOut = path.join(process.cwd(), 'temp_batch_results.epd');
    if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);

    let completed = 0;
    const startTime = Date.now();

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Parse EPD line (fen is typically first part before ';')
        const parts = line.split(';');
        const fen = parts[0].trim();

        if (!fen) continue;

        // Play game
        const gameData = playGame(fen, tt, nnue);

        if (gameData) {
            const { result, positions } = gameData;

            // Format result
            let resultStr = "1/2-1/2";
            if (result === 1.0) resultStr = "1-0";
            if (result === 0.0) resultStr = "0-1";

            const outputData = positions.map(f => `${f}; result ${resultStr};`).join('\n') + '\n';
            fs.appendFileSync(tempOut, outputData);
        }

        completed++;
        if (completed % 10 === 0) {
            const elapsed = (Date.now() - startTime) / 1000;
            const rate = completed / elapsed;
            console.log(`Progress: ${completed}/${lines.length} games. Rate: ${rate.toFixed(2)} games/sec.`);
        }
    }

    console.log("All games finished.");

    if (fs.existsSync(tempOut)) {
         const data = fs.readFileSync(tempOut, 'utf8');
         fs.appendFileSync(CUMULATIVE_DATA_FILE, data);
         fs.unlinkSync(tempOut);

         // Clear source file to indicate completion
         fs.writeFileSync(destPath, '');
         console.log("Source file cleared.");
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

module.exports = { playGame, main };
