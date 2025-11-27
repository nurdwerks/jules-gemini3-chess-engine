const { parentPort } = require('worker_threads');
const { playGame } = require('./download_and_tune');
const { TranspositionTable } = require('../src/TranspositionTable');
const { NNUE } = require('../src/NNUE');

let tt = null;
let nnue = null;

parentPort.on('message', async (msg) => {
    try {
        if (msg.type === 'init') {
            const { ttBuffer, nnueFile, ttSizeMB } = msg;

            // Reconstruct TT from shared buffer
            // We must ensure the size matches what was created in main thread
            tt = new TranspositionTable(ttSizeMB, ttBuffer);

            nnue = NNUE();
            try {
                await nnue.loadNetwork(nnueFile);
            } catch (e) {
                console.error(`Worker failed to load NNUE from ${nnueFile}:`, e.message);
                // Fallback or exit? Search handles missing NNUE, so we continue.
            }

            parentPort.postMessage({ type: 'ready' });

        } else if (msg.type === 'play') {
            const { fens, startIndex } = msg;
            console.log(`Worker starting batch of ${fens.length} games`);

            for (let i = 0; i < fens.length; i++) {
                try {
                    const fen = fens[i];
                    if (!fen) continue;

                    console.log(`Worker playing game ${startIndex + i}`);
                    // playGame handles FEN parsing and game execution
                    const gameData = playGame(fen, tt, nnue);
                    console.log(`Worker finished game ${startIndex + i}`);

                    if (gameData) {
                        const { result, positions } = gameData;
                        parentPort.postMessage({
                            type: 'result',
                            index: startIndex + i,
                            result,
                            positions
                        });
                    }
                } catch (gameErr) {
                    console.error(`Error processing game ${startIndex + i}:`, gameErr);
                    parentPort.postMessage({
                        type: 'error',
                        index: startIndex + i,
                        message: gameErr.message
                    });
                }
            }

            parentPort.postMessage({ type: 'batch_complete' });
        }
    } catch (err) {
        console.error('Worker error:', err);
        parentPort.postMessage({
            type: 'error',
            index: -1,
            message: `Fatal worker error: ${err.message}`
        });
        // Ensure the main thread is notified to terminate the worker
        parentPort.postMessage({ type: 'batch_complete' });
    }
});
