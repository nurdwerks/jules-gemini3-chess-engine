#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Simple chess logic to track game state
const Board = require('../src/Board');

class EngineProcess {
    constructor(enginePath, name) {
        this.enginePath = enginePath;
        this.name = name;
        this.process = null;
        this.outputBuffer = '';
        this.onDataCallbacks = [];
    }

    start() {
        this.process = spawn(this.enginePath, [], {
             shell: true,
             cwd: process.cwd(),
             stdio: ['pipe', 'pipe', 'pipe']
        });

        this.process.stdout.on('data', (data) => {
             this.emitData(data);
        });

        this.process.stderr.on('data', (data) => {
             // console.error(`[${this.name} ERR] ${data}`);
        });

        this.process.on('error', (err) => {
             console.error(`[${this.name} PROCESS ERROR]`, err);
        });

        this.process.on('exit', (code, signal) => {
             // console.log(`[${this.name} EXIT] Code: ${code}, Signal: ${signal}`);
        });
    }

    emitData(data) {
        const str = data.toString();
        // console.log(`[${this.name}] ${str.trim()}`); // Debug logging
        this.onDataCallbacks.forEach(cb => cb(str));
    }

    send(command) {
        if (this.process) {
             // console.log(`[To ${this.name}] ${command}`); // Debug logging
             this.process.stdin.write(command + '\n');
        }
    }

    async getResponse(keyword, timeout = 5000) {
        return new Promise((resolve, reject) => {
            let buffer = '';
            let resolved = false;

            const onData = (chunk) => {
                if (resolved) return;
                buffer += chunk;
                if (buffer.includes(keyword)) {
                    cleanup();
                    resolve(buffer);
                }
            };

            const cleanup = () => {
                resolved = true;
                this.onDataCallbacks = this.onDataCallbacks.filter(cb => cb !== onData);
                clearTimeout(timer);
            };

            const timer = setTimeout(() => {
                cleanup();
                reject(new Error(`Timeout waiting for keyword: ${keyword} from ${this.name}`));
            }, timeout);

            this.onDataCallbacks.push(onData);
        });
    }

    async getBestMove(timeout = 10000) {
        try {
            const output = await this.getResponse('bestmove', timeout);
            const match = output.match(/bestmove\s+(\S+)/);
            if (match) {
                return match[1];
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    quit() {
        if (this.process) {
            this.send('quit');
            this.process.kill();
        }
    }
}

async function playMatch(engine1Path, engine2Path, games = 10, options = {}) {
    console.log(`Starting match: ${games} games`);
    let results = { p1Wins: 0, p2Wins: 0, draws: 0 };

    for (let i = 0; i < games; i++) {
        const white = i % 2 === 0 ? new EngineProcess(engine1Path, "Engine1") : new EngineProcess(engine2Path, "Engine2");
        const black = i % 2 === 0 ? new EngineProcess(engine2Path, "Engine2") : new EngineProcess(engine1Path, "Engine1");

        white.start();
        black.start();

        try {
            // Initial handshake
            white.send('uci');
            black.send('uci');

            await white.getResponse('uciok');
            await black.getResponse('uciok');

            white.send('isready');
            black.send('isready');
            await white.getResponse('readyok');
            await black.getResponse('readyok');

            white.send('ucinewgame');
            black.send('ucinewgame');

            let board = new Board();
            let history = []; // List of algebraic moves
            let fenHistory = [];
            let gameResult = null;
            let reason = '';
            let movesCount = 0;

            while (true) {
                const activeEngine = board.activeColor === 'w' ? white : black;

                // Construct position command
                let posCmd = 'position startpos';
                if (history.length > 0) {
                    posCmd += ' moves ' + history.join(' ');
                }

                activeEngine.send(posCmd);
                activeEngine.send(`go movetime 50`);

                const moveStr = await activeEngine.getBestMove(2000); // 2s timeout

                if (!moveStr || moveStr === '(none)' || moveStr === '0000') {
                    gameResult = board.activeColor === 'w' ? '0-1' : '1-0';
                    reason = 'Illegal/Null move';
                    break;
                }

                const fromStr = moveStr.slice(0, 2);
                const toStr = moveStr.slice(2, 4);
                const promo = moveStr.length > 4 ? moveStr[4] : null;

                const from = board.algebraicToIndex(fromStr);
                const to = board.algebraicToIndex(toStr);

                const legalMoves = board.generateMoves();
                const move = legalMoves.find(m => m.from === from && m.to === to && (!promo || m.promotion === promo));

                if (!move) {
                     gameResult = board.activeColor === 'w' ? '0-1' : '1-0';
                     reason = `Illegal move played: ${moveStr}`;
                     break;
                }

                board.applyMove(move);
                history.push(moveStr);
                fenHistory.push(board.generateFen());
                movesCount++;

                // Check game end conditions
                if (board.isDrawByRepetition() || board.isDrawBy50Moves()) {
                    gameResult = '1/2-1/2';
                    reason = 'Draw by Rule';
                    break;
                }

                const nextMoves = board.generateMoves();
                if (nextMoves.length === 0) {
                    if (board.isInCheck()) {
                        gameResult = board.activeColor === 'w' ? '0-1' : '1-0';
                        reason = 'Checkmate';
                    } else {
                        gameResult = '1/2-1/2';
                        reason = 'Stalemate';
                    }
                    break;
                }

                if (movesCount > 200) {
                     gameResult = '1/2-1/2';
                     reason = 'Max moves reached';
                     break;
                }
            }

            console.log(`Game ${i+1}: ${gameResult} (${reason}) - W:${white.name} B:${black.name}`);

            if (gameResult === '1-0') {
                if (white.name === 'Engine1') results.p1Wins++; else results.p2Wins++;
            } else if (gameResult === '0-1') {
                if (black.name === 'Engine1') results.p1Wins++; else results.p2Wins++;
            } else {
                results.draws++;
            }

            // EPD Generation
            if (options.epdFile && gameResult) {
                const resultString = gameResult.replace('1/2-1/2', 'draw');
                for (let j = 10; j < fenHistory.length -1; j++) { // Skip opening and final position
                    const fen = fenHistory[j];
                    fs.appendFileSync(options.epdFile, `${fen} c0 "${resultString}";\n`);
                }
            }

        } catch (e) {
            console.error(`Game ${i+1} aborted due to error:`, e);
        } finally {
            white.quit();
            black.quit();
        }
    }

    console.log("Match Finished.");
    console.log(`Engine1: ${results.p1Wins}, Engine2: ${results.p2Wins}, Draws: ${results.draws}`);
    return results;
}

// Run if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    const e1 = args[0] || './src/engine.js';
    const e2 = args[1] || './src/engine.js';
    const games = args[2] ? parseInt(args[2]) : 2;
    const epdFile = args[3] || null;
    playMatch(e1, e2, games, { epdFile });
}
module.exports = { playMatch };
