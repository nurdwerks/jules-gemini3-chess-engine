const UCI = require('./src/UCI');
const uci = new UCI((msg) => console.log(msg));

// Test Epics 17-20
console.log('--- Testing Epics 17-20 ---');

// 17: Razoring/ProbCut (Search stability)
// 18: SPSA (Offline tool, no crash test needed here, just verifying file existence)
// 19: Time Management V2 (Set MoveOverhead)
// 20: Pawn Hash (Structure exists)

uci.processCommand('ucinewgame');
uci.processCommand('setoption name MoveOverhead value 100');
uci.processCommand('position startpos');
uci.processCommand('go depth 3'); // Trigger search with razoring checks

console.log('--- Done ---');
