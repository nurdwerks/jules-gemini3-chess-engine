const Board = require('./Board');
const { NNUE, Accumulator } = require('./NNUE');

class UCI {
  constructor(outputCallback = console.log) {
    this.board = new Board();
    this.output = outputCallback;
    this.currentSearch = null;

    this.options = {
        Hash: 16,
        Threads: 1,
        Ponder: false,
        MultiPV: 1,
        UCI_LimitStrength: false,
        UCI_Elo: 3000,
        AspirationWindow: 50,
        Contempt: 0,
        UseCaptureHistory: true,
        UCI_UseNNUE: process.env.TEST_MODE === 'true' ? false : true,
        UCI_NNUE_File: 'https://tests.stockfishchess.org/api/nn/nn-46832cfbead3.nnue',
        BookFile: 'polyglot/gm2001.bin',
    };

    // Initialize TT
    const { TranspositionTable } = require('./TranspositionTable');
    this.tt = new TranspositionTable(this.options.Hash);

    // Initialize NNUE
    this.nnue = new NNUE();
    if (this.options.UCI_UseNNUE) {
      this.nnue.loadNetwork(this.options.UCI_NNUE_File).catch(err => {
          this.output(`info string Failed to load NNUE: ${err.message}`);
          this.options.UCI_UseNNUE = false;
      });
    }

    // Initialize Book
    const Polyglot = require('./Polyglot');
    this.book = new Polyglot();
    this.book.loadBook(this.options.BookFile);
    this.workers = [];
    this.startWorkers();
  }

  startWorkers() {
    const { Worker } = require('worker_threads');
    const sharedBuffer = this.tt.getSharedBuffer();

    for (let i = 0; i < this.options.Threads - 1; i++) {
        const worker = new Worker('./src/Worker.js', {
            workerData: {
                sharedBuffer,
                hashSize: this.options.Hash,
                options: this.options
            }
        });
        this.workers.push(worker);
    }
  }

  stopWorkers() {
    const promises = this.workers.map(worker => worker.terminate());
    this.workers = [];
    return Promise.all(promises);
  }

  processCommand(command) {
    const parts = command.trim().split(/\s+/);
    if (parts.length === 0) return;

    const cmd = parts[0];

    switch (cmd) {
      case 'uci':
        this.output('id name JulesGemini');
        this.output('id author JulesGemini');
        this.output(`option name Hash type spin default ${this.options.Hash} min 1 max 1024`);
        this.output(`option name Threads type spin default ${this.options.Threads} min 1 max 64`);
        this.output(`option name Ponder type check default ${this.options.Ponder}`);
        this.output(`option name MultiPV type spin default ${this.options.MultiPV} min 1 max 500`);
        this.output(`option name UCI_LimitStrength type check default ${this.options.UCI_LimitStrength}`);
        this.output(`option name UCI_Elo type spin default ${this.options.UCI_Elo} min 100 max 3000`);
        this.output(`option name AspirationWindow type spin default ${this.options.AspirationWindow} min 10 max 500`);
        this.output(`option name Contempt type spin default ${this.options.Contempt} min -100 max 100`);
        this.output(`option name UseHistory type check default true`);
        this.output(`option name UseCaptureHistory type check default true`);
        this.output(`option name UCI_UseNNUE type check default ${this.options.UCI_UseNNUE}`);
        this.output(`option name UCI_NNUE_File type string default ${this.options.UCI_NNUE_File}`);
        this.output(`option name BookFile type string default ${this.options.BookFile}`);
        this.output('uciok');
        break;
      case 'isready':
        this.output('readyok');
        break;
      case 'ucinewgame':
        this.board = new Board();
        break;
      case 'position':
        this.handlePosition(parts.slice(1));
        break;
      case 'setoption':
        this.handleSetOption(parts.slice(1));
        break;
      case 'go':
        this.handleGo(parts.slice(1));
        break;
      case 'stop':
        if (this.currentSearch) this.currentSearch.stopFlag = true;
        this.stopWorkers();
        if (this.pendingBestMove) {
            this.output(this.pendingBestMove);
            this.pendingBestMove = null;
        }
        break;
      case 'ponderhit':
        if (this.pendingBestMove) {
            this.output(this.pendingBestMove);
            this.pendingBestMove = null;
        }
        break;
      case 'quit':
        process.exit(0);
        break;
      case 'debug_tree':
         const Search = require('./Search');
         this.currentSearch = new Search(this.board, this.tt);
         this.currentSearch.search(2, { hardLimit: Infinity }, { debug: true, debugFile: 'debug_tree.json' });
         this.currentSearch = null;
         this.output('info string Debug tree written to debug_tree.json');
         break;
      case 'bench':
         const Bench = require('./Bench');
         Bench.run(this);
         break;
      default:
        break;
    }
  }

  handlePosition(args) {
    let moveStartIndex = 0;
    if (args[0] === 'startpos') {
      this.board = new Board();
      moveStartIndex = 1;
    } else if (args[0] === 'fen') {
      let movesIndex = args.indexOf('moves');
      if (movesIndex === -1) movesIndex = args.length;
      const fen = args.slice(1, movesIndex).join(' ');
      try {
        this.board.loadFen(fen);
      } catch (e) {
        this.output(`info string Invalid FEN: ${e.message}`);
        return;
      }
      moveStartIndex = movesIndex;
    }

    if (args[moveStartIndex] === 'moves') {
      const moves = args.slice(moveStartIndex + 1);
      for (const moveStr of moves) this.applyAlgebraicMove(moveStr);
    }
  }

  applyAlgebraicMove(moveStr) {
    const fromStr = moveStr.slice(0, 2);
    const toStr = moveStr.slice(2, 4);
    const promotionChar = moveStr.length > 4 ? moveStr[4] : null;
    const from = this.board.algebraicToIndex(fromStr);
    const to = this.board.algebraicToIndex(toStr);
    const move = this.board.generateMoves().find(m => m.from === from && m.to === to && (!promotionChar || m.promotion === promotionChar));
    if (move) {
      this.board.applyMove(move);
    } else {
      this.output(`info string Illegal move: ${moveStr}`);
    }
  }

  handleGo(args) {
    let searchMoves = null;
    if (args.includes('searchmoves')) {
        const idx = args.indexOf('searchmoves');
        searchMoves = args.slice(idx + 1);
    }
    const isPonder = args.includes('ponder');
    this.pendingBestMove = null;
    if (!args.includes('infinite') && !isPonder) {
        const bookMove = this.book.findMove(this.board);
        if (bookMove) {
             const fromAlg = this.indexToAlgebraic(bookMove.from);
             const toAlg = this.indexToAlgebraic(bookMove.to);
             this.output(`bestmove ${fromAlg}${toAlg}${bookMove.promotion || ''}`);
             return;
        }
    }
    const TimeManager = require('./TimeManager');
    const tm = new TimeManager(this.board);
    const timeLimits = tm.parseGoCommand(args, this.board.activeColor);
    let depth = 64;

    const nodesIdx = args.indexOf('nodes');
    let nodes = null;
    if (nodesIdx !== -1) {
        nodes = parseInt(args[nodesIdx + 1], 10);
    }

    if (args.includes('depth')) {
        depth = parseInt(args[args.indexOf('depth') + 1], 10);
        if (!args.includes('wtime') && !args.includes('movetime')) {
             timeLimits.hardLimit = Infinity;
             timeLimits.softLimit = Infinity;
        }
    } else if (nodes !== null) {
        // If nodes specified but not depth, search deep (limited by nodes)
        depth = 128;
        timeLimits.hardLimit = Infinity;
        timeLimits.softLimit = Infinity;
    } else if (!args.includes('wtime') && !args.includes('movetime') && !args.includes('infinite')) {
        depth = 5;
    }
    const Search = require('./Search');
    this.currentSearch = new Search(this.board, this.tt, this.nnue);
    const searchOptions = {
        ...this.options,
        searchMoves,
        nodes,
        onInfo: (info) => this.output(`info ${info}`)
    };
    for (const worker of this.workers) {
        worker.postMessage({ type: 'search', fen: this.board.generateFen(), depth: depth, limits: timeLimits, options: this.options });
    }
    const bestMove = this.currentSearch.search(depth, timeLimits, searchOptions, tm);
    this.currentSearch = null;
    this.stopWorkers();
    let bestMoveStr = 'bestmove 0000';
    if (bestMove) {
        const fromAlg = this.indexToAlgebraic(bestMove.from);
        const toAlg = this.indexToAlgebraic(bestMove.to);
        bestMoveStr = `bestmove ${fromAlg}${toAlg}${bestMove.promotion || ''}`;
    }
    if (isPonder) {
        this.pendingBestMove = bestMoveStr;
    } else {
        this.output(bestMoveStr);
    }
  }

  indexToAlgebraic(index) {
    const { row, col } = this.board.toRowCol(index);
    return `${String.fromCharCode('a'.charCodeAt(0) + col)}${8 - row}`;
  }

  handleSetOption(args) {
    let nameIdx = -1, valueIdx = -1;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === 'name') nameIdx = i;
        if (args[i] === 'value') valueIdx = i;
    }
    if (nameIdx === -1) return;
    const name = args.slice(nameIdx + 1, valueIdx !== -1 ? valueIdx : args.length).join(' ');
    let value = null;
    if (valueIdx !== -1 && valueIdx + 1 < args.length) {
        const valStr = args[valueIdx + 1];
        if (valStr === 'true') value = true;
        else if (valStr === 'false') value = false;
        else value = isNaN(parseInt(valStr, 10)) ? valStr : parseInt(valStr, 10);
    }
    if (this.options.hasOwnProperty(name)) {
        this.options[name] = value;
        if (name === 'Hash' && this.options.Threads === 1) {
            this.tt.resize(value);
            this.output(`info string Hash resized to ${value} MB`);
        } else if (name === 'Threads') {
            this.stopWorkers();
            this.startWorkers();
        } else if (name === 'UCI_UseNNUE' || name === 'UCI_NNUE_File') {
            if (this.options.UCI_UseNNUE) {
                this.nnue.loadNetwork(this.options.UCI_NNUE_File).catch(err => {
                    this.output(`info string Failed to load NNUE: ${err.message}`);
                    this.options.UCI_UseNNUE = false;
                });
            }
        } else if (name === 'BookFile') {
            this.book.loadBook(value);
        }
    } else {
        require('./Evaluation').updateParam(name, value);
    }
  }
}

module.exports = UCI;
