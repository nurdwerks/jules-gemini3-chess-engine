const UCI = require('./src/UCI');
const uci = new UCI((msg) => console.log(msg));

// Test Aspiration Window
// We run a search. It should use aspiration window.
// We can't easily spy on internal alpha/beta without logging or mocking.
// But we can check if it produces a move and doesn't crash.

console.log('--- Testing Aspiration Window ---');
uci.processCommand('ucinewgame');
uci.processCommand('position startpos');
uci.processCommand('setoption name AspirationWindow value 25');
// Go depth 4.
// Depth 1: -Inf, Inf
// Depth 2: window around d1 score
// Depth 3: window around d2 score
// ...
uci.processCommand('go depth 4');

// Wait a bit? 'go' is synchronous if hard limit/depth is small?
// My 'go' command in UCI uses `currentSearch.search` which is blocking unless I use Workers.
// Wait, `Search.search` is synchronous in current implementation (it's a loop).
// So it should finish and print bestmove.

console.log('--- Done ---');
