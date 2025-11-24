const { parentPort, workerData } = require('worker_threads');
const Search = require('./Search');
const Board = require('./Board');
const { TranspositionTable } = require('./TranspositionTable');

// Worker Data: { sharedBuffer, hashSize, options }
const { sharedBuffer, hashSize, options } = workerData;

// Init TT
const tt = new TranspositionTable(hashSize, sharedBuffer);

// Init Board (Need a way to set position from messages)
const board = new Board();

// We assume workers just help search.
// Main thread sends "search" command with board FEN/Moves and limits.

parentPort.on('message', (msg) => {
    if (msg.type === 'search') {
        // Update board
        // msg.fen, msg.moves?
        if (msg.fen) board.loadFen(msg.fen);
        // If moves?

        const search = new Search(board, tt);

        // Run search (blocking for now? workers are async to main thread)
        // We need to stop when main thread says stop.
        // Shared 'stop' flag?
        // For Lazy SMP, workers just run.
        // If we use 'Atomics' on a stop flag in buffer?
        // Or just let them run until we terminate worker?

        // Search needs to be interruptible via message?
        // Search is blocking loop.
        // We can't check messages easily inside search unless we poll.
        // Or use Atomics.wait? No.
        // We need a SharedArrayBuffer for 'stopFlag'.

        // For minimal implementation, we just let it run until we terminate the worker?
        // That works for 'stop'.

        search.search(msg.depth || 64, msg.limits, options);

        // Report best move? Lazy SMP usually main thread decides.
        // Workers just populate TT.
        parentPort.postMessage({ type: 'done' });
    }
    else if (msg.type === 'quit') {
        process.exit(0);
    }
});
