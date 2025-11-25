const UCI = require('./src/UCI');
const uci = new UCI((msg) => console.log(msg));

// Test SEE
// Position: White Queen at d1, Black Pawn at d4 defended by Pawn c5.
// White takes d4? Bad capture.
// FEN: 8/8/8/2p5/3p4/8/8/3Q4 w - - 0 1
// Queen (900) takes Pawn (100). Recapture by Pawn (100).
// Gain: 100. Loss: 900. Net: -800.
// SEE should be negative.
// In QSearch, this move should be pruned.
// In Search, this move should be ordered last.

// We can't easily see internal ordering/pruning without debug logs or spying.
// But we can run a `go depth 1` and see if it picks it?
// If it's the ONLY capture, QSearch might prune it and return stand-pat.
// If stand-pat is alpha, it returns alpha.
// If stand-pat is bad?
// Actually, if it's the only legal move? No, there are quiet moves.
// But `go depth 1` runs normal search.
// If we run `debug_tree` maybe?

console.log('--- Testing SEE ---');
const fen = '8/8/8/2p5/3p4/8/8/3Q4 w - - 0 1';
uci.processCommand('ucinewgame');
uci.processCommand(`position fen ${fen}`);
// If we search depth 1, Queen takes d4 is a blunder.
// Normal search should avoid it anyway.
// But we want to verify SEE logic doesn't crash.
uci.processCommand('go depth 2');

console.log('--- Done ---');
