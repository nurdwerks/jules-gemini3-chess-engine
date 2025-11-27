#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const Board = require('../src/Board');
const fs = require('fs');

const DEFAULT_ENGINE_PATH = path.join(__dirname, '../src/engine.js');

function squareToAlgebraic(index) {
    const row = index >> 4;
    const col = index & 7;
    return String.fromCharCode('a'.charCodeAt(0) + col) + (8 - row);
}

async function runMatch() {
    const args = process.argv.slice(2);

    // Parse arguments
    const getArg = (name, defaultValue) => {
        const idx = args.indexOf(name);
        return idx !== -1 ? args[idx + 1] : defaultValue;
    };

    const games = parseInt(getArg('--games', 10), 10);
    const concurrency = parseInt(getArg('--concurrency', 1), 10);
    const fenArg = getArg('--fen', 'startpos');
    const epdFile = getArg('--epd', null);
    const outputFile = getArg('--output', null);
    const enginePath = getArg('--engine', DEFAULT_ENGINE_PATH);
    const silent = args.includes('--silent');

    if (!fs.existsSync(enginePath)) {
        console.error(`Engine not found at: ${enginePath}`);
        process.exit(1);
    }

    let startFens = [];
    if (epdFile) {
        if (fs.existsSync(epdFile)) {
            const content = fs.readFileSync(epdFile, 'utf8');
            startFens = content.split('\n').filter(line => line.trim().length > 0).map(line => {
                const parts = line.split(';');
                return parts[0].trim();
            });
            if (!silent) console.log(`Loaded ${startFens.length} start positions from ${epdFile}`);
        } else {
            console.error(`EPD file not found: ${epdFile}`);
            process.exit(1);
        }
    }

    if (!silent) console.log(`Starting match: ${games} games with concurrency ${concurrency}...`);
    if (outputFile) fs.writeFileSync(outputFile, ''); // Clear output file

    let whiteWins = 0;
    let blackWins = 0;
    let draws = 0;
    let completedGames = 0;

    const runGame = async (gameIndex) => {
        const startFen = startFens.length > 0 ? startFens[gameIndex % startFens.length] : fenArg;
        try {
            const result = await playGame(gameIndex + 1, startFen, outputFile, enginePath);
            if (result === 1.0) whiteWins++;
            else if (result === 0.0) blackWins++;
            else draws++;
        } catch (err) {
            console.error(`Game ${gameIndex + 1} failed:`, err);
        } finally {
            completedGames++;
            if (!silent && completedGames % 10 === 0) {
                 console.log(`Progress: ${completedGames}/${games} (W: ${whiteWins}, B: ${blackWins}, D: ${draws})`);
            }
        }
    };

    // Parallel execution queue
    const queue = [];
    for (let i = 0; i < games; i++) {
        queue.push(i);
    }

    const workers = [];
    for (let i = 0; i < concurrency; i++) {
        workers.push((async () => {
            while (queue.length > 0) {
                const gameIndex = queue.shift();
                await runGame(gameIndex);
            }
        })());
    }

    await Promise.all(workers);

    if (!silent) {
        console.log('--- Match Finished ---');
        console.log(`White Wins: ${whiteWins}`);
        console.log(`Black Wins: ${blackWins}`);
        console.log(`Draws: ${draws}`);
    }
}

function playGame(gameId, startFen, outputFile, enginePath) {
    return new Promise((resolve, reject) => {
        const engine1 = spawn(process.execPath, [enginePath]);
        const engine2 = spawn(process.execPath, [enginePath]);

        let resolved = false;
        const cleanup = (result) => {
            if (resolved) return;
            resolved = true;

            engine1.removeAllListeners();
            engine2.removeAllListeners();
            engine1.stdout.removeAllListeners();
            engine2.stdout.removeAllListeners();

            engine1.kill();
            engine2.kill();

            resolve(result);
        };

        engine1.on('error', (err) => { cleanup(); reject(err); });
        engine2.on('error', (err) => { cleanup(); reject(err); });
        engine1.on('close', (code) => { if(!resolved && code !== 0 && code !== null) { cleanup(); reject(new Error(`E1 exited code ${code}`)); } });
        engine2.on('close', (code) => { if(!resolved && code !== 0 && code !== null) { cleanup(); reject(new Error(`E2 exited code ${code}`)); } });

        const board = new Board();
        try {
            if (startFen === 'startpos') board.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
            else board.loadFen(startFen);
        } catch(e) {
            cleanup();
            reject(e);
            return;
        }

        const gamePositions = [];
        gamePositions.push(board.generateFen());

        let moves = [];
        const send = (engine, msg) => {
            if (engine.stdin.writable) engine.stdin.write(msg + '\n');
        };

        send(engine1, 'uci');
        send(engine2, 'uci');

        let engine1Ready = false;
        let engine2Ready = false;
        let gameOver = false;
        let result = 0.5;

        // Helper to check stalemate/checkmate
        const isCheckmate = (b) => {
            const m = b.generateMoves();
            return m.length === 0 && b.isInCheck();
        };
        const isStalemate = (b) => {
             const m = b.generateMoves();
             return m.length === 0 && !b.isInCheck();
        };

        const onMove = (moveStr) => {
            if (gameOver) return;

            const legalMoves = board.generateMoves();
            const move = legalMoves.find(m => {
                const s = squareToAlgebraic(m.from) + squareToAlgebraic(m.to) + (m.promotion || '');
                return s === moveStr;
            });

            if (!move) {
                console.error(`Illegal move by ${board.activeColor}: ${moveStr}`);
                gameOver = true;
                result = (board.activeColor === 'w') ? 0.0 : 1.0;
                saveAndCleanup(result);
                return;
            }

            board.applyMove(move);
            moves.push(moveStr);
            gamePositions.push(board.generateFen());

            if (isCheckmate(board)) {
                gameOver = true;
                result = (board.activeColor === 'w') ? 0.0 : 1.0;
                saveAndCleanup(result);
                return;
            }
            if (isStalemate(board) || board.isDrawByRepetition() || board.isDrawBy50Moves()) {
                gameOver = true;
                result = 0.5;
                saveAndCleanup(result);
                return;
            }

            const nextEngine = board.activeColor === 'w' ? engine1 : engine2;
            const positionCmd = startFen === 'startpos'
                ? `position startpos moves ${moves.join(' ')}`
                : `position fen ${startFen} moves ${moves.join(' ')}`;
            send(nextEngine, positionCmd);
            send(nextEngine, 'go movetime 100');
        };

        const saveAndCleanup = (res) => {
             if (outputFile) {
                let resultStr = "1/2-1/2";
                if (res === 1.0) resultStr = "1-0";
                if (res === 0.0) resultStr = "0-1";
                const data = gamePositions.map(f => `${f}; result ${resultStr};`).join('\n') + '\n';
                fs.appendFileSync(outputFile, data);
            }
            cleanup(res);
        };

        const setupEngine = (engine, name) => {
            let buffer = '';
            engine.stdout.on('data', (data) => {
                buffer += data.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.trim() === 'uciok') {
                        if (name === 'E1') engine1Ready = true;
                        else engine2Ready = true;

                        if (engine1Ready && engine2Ready) {
                            const firstEngine = board.activeColor === 'w' ? engine1 : engine2;
                            send(firstEngine, `position fen ${startFen === 'startpos' ? 'startpos' : startFen}`);
                            send(firstEngine, 'go movetime 100');
                        }
                    }
                    if (line.startsWith('bestmove')) {
                        const parts = line.split(' ');
                        const move = parts[1];
                        if (move === '(none)') {
                            if (board.isInCheck()) result = (board.activeColor === 'w') ? 0.0 : 1.0;
                            else result = 0.5;
                            gameOver = true;
                            saveAndCleanup(result);
                        } else {
                            onMove(move);
                        }
                    }
                }
            });
        };

        setupEngine(engine1, 'E1');
        setupEngine(engine2, 'E2');
    });
}

if (require.main === module) {
    runMatch().catch(console.error);
}

module.exports = runMatch;
