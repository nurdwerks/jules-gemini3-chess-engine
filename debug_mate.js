const Board = require('./src/Board');
const Search = require('./src/Search');

const board = new Board();
const search = new Search(board);

// Setup "Mate in 1" position
board.loadFen('r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4');

// Check pieces
const queen = board.getPiece(3, 7); // h5 (Rank 5, Col h) -> Row 3, Col 7
console.log('Piece at h5:', queen);

// Generate moves for White
const moves = board.generateMoves();
const qMoves = moves.filter(m => m.from === 55); // h5
console.log('Queen moves:', qMoves.map(m => board.toRowCol(m.to)));

// Look for Qxf7
const toF7 = board.algebraicToIndex('f7');
const qxf7 = qMoves.find(m => m.to === toF7);
console.log('Qxf7 move exists:', !!qxf7);

if (qxf7) {
    console.log('Applying Qxf7...');
    const state = board.applyMove(qxf7);

    // Now Black to move.
    const blackMoves = board.generateMoves();
    console.log('Black moves count:', blackMoves.length);
    if (blackMoves.length > 0) {
        blackMoves.forEach(m => {
            const from = board.toRowCol(m.from);
            const to = board.toRowCol(m.to);
            console.log(`Black Move: ${from.row},${from.col} -> ${to.row},${to.col}`);
        });
    } else {
        // Checkmate?
        const kingIndex = board.squares.findIndex(p => p && p.type === 'king' && p.color === 'black');
        console.log('King Index:', kingIndex);
        console.log('Is King Attacked:', board.isSquareAttacked(kingIndex, 'white'));
    }

    board.undoApplyMove(qxf7, state);
}

// Run Search Depth 2
console.log('Running Search Depth 2...');
const bestMove = search.search(2);
console.log('Best Move:', bestMove);
if (bestMove) {
    console.log('From:', bestMove.from, 'To:', bestMove.to);
}
