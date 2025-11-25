const UCI = require('./src/UCI');
const uci = new UCI((msg) => console.log(msg));

// Test Epics 26-29
console.log('--- Testing Epics 26-29 ---');
// 26: Contempt (Set option)
// 27: Bench (Run bench)
// 28: SelfPlay (Mocked)
// 29: Searchmoves (Run go searchmoves)

// 26
uci.processCommand('setoption name Contempt value 20');

// 27
console.log('Running Bench...');
uci.processCommand('bench');

// 29
console.log('Running Searchmoves...');
uci.processCommand('ucinewgame');
uci.processCommand('position startpos');
// Restrict to a3a4 (bad move)
uci.processCommand('go depth 1 searchmoves a2a3');

console.log('--- Done ---');
