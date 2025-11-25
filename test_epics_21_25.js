const UCI = require('./src/UCI');
const uci = new UCI((msg) => console.log(msg));

// Test Epics 21-25
console.log('--- Testing Epics 21-25 ---');
// 21: IID (Search depth > 3)
// 22: LMP (Search depth 3)
// 23: Countermove (Search multiple depths)
// 24: MCP (Search)
// 25: King Safety (Evaluation)

uci.processCommand('ucinewgame');
uci.processCommand('position startpos');
// Run a search deeper than 3 to trigger IID and MCP checks.
uci.processCommand('go depth 4');

console.log('--- Done ---');
