const Board = require('./Board');

class UCI {
  constructor(outputCallback = console.log) {
    this.board = new Board();
    this.output = outputCallback;
  }

  processCommand(command) {
    const parts = command.trim().split(/\s+/);
    if (parts.length === 0) return;

    const cmd = parts[0];

    switch (cmd) {
      case 'uci':
        this.output('id name JulesGemini');
        this.output('id author JulesGemini');
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

      case 'go':
        this.handleGo(parts.slice(1));
        break;

      case 'quit':
        process.exit(0);
        break;

      default:
        // Ignore unknown commands
        break;
    }
  }

  handlePosition(args) {
    let moveStartIndex = 0;
    if (args[0] === 'startpos') {
      this.board = new Board(); // Reset to start
      moveStartIndex = 1;
    } else if (args[0] === 'fen') {
      // Find where 'moves' starts
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

    // Process moves if any
    if (args[moveStartIndex] === 'moves') {
      const moves = args.slice(moveStartIndex + 1);
      for (const moveStr of moves) {
        this.applyAlgebraicMove(moveStr);
      }
    }
  }

  applyAlgebraicMove(moveStr) {
    // Parse algebraic move (e2e4, e7e8q)
    const fromStr = moveStr.slice(0, 2);
    const toStr = moveStr.slice(2, 4);
    const promotionChar = moveStr.length > 4 ? moveStr[4] : null;

    const from = this.board.algebraicToIndex(fromStr);
    const to = this.board.algebraicToIndex(toStr);

    // Generate legal moves to find the matching move object
    const moves = this.board.generateMoves();
    const move = moves.find(m => {
      return m.from === from && m.to === to &&
             (!promotionChar || m.promotion === promotionChar);
    });

    if (move) {
      this.board.applyMove(move);
    } else {
        this.output(`info string Illegal move: ${moveStr}`);
    }
  }

  handleGo(args) {
    // Basic argument parsing for depth/time (omitted for brevity, defaulting to fixed depth)
    let depth = 3;
    if (args.includes('depth')) {
        const idx = args.indexOf('depth');
        if (idx + 1 < args.length) {
            depth = parseInt(args[idx+1], 10);
        }
    }
    // Also support 'movetime' or 'wtime' in future

    const Search = require('./Search');
    const search = new Search(this.board);
    const bestMove = search.search(depth);

    if (bestMove) {
        const fromAlg = this.indexToAlgebraic(bestMove.from);
        const toAlg = this.indexToAlgebraic(bestMove.to);
        const promo = bestMove.promotion ? bestMove.promotion : '';
        this.output(`bestmove ${fromAlg}${toAlg}${promo}`);
    } else {
        this.output('bestmove 0000');
    }
  }

  indexToAlgebraic(index) {
    const { row, col } = this.board.toRowCol(index);
    const file = String.fromCharCode('a'.charCodeAt(0) + col);
    const rank = 8 - row;
    return `${file}${rank}`;
  }
}

module.exports = UCI;
