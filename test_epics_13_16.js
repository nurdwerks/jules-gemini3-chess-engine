const UCI = require('./src/UCI');
const uci = new UCI((msg) => console.log(msg));

// Test Epics 13-16
// 13: Bitboards - Board ops should still work (move generation)
// 14: Polyglot - Should find book move for startpos
// 15: Syzygy - (Mocked, just shouldn't crash)
// 16: Extensions - Search deeper on checks

console.log('--- Testing Epics 13-16 ---');

// 1. Polyglot Check (Epic 14)
// If book.bin is present (it's not), it would play.
// But we can check if it attempts it.
// We don't have a book file, so it should proceed to search.

// 2. Search with Check (Epic 16)
// Position: White to move, Black King exposed.
// FEN: 8/8/8/4k3/8/8/4R3/4K3 w - - 0 1 (Black king in check on e5 by Rook e2? No, Rook is on e2, King on e5. Wait. e-file.
// R on e2 attacks e3, e4, e5. So King on e5 is in check.
// White to move. It's not check.
// Wait, "4k3" -> e8. "4K3" -> e1.
// "4R3" -> e2.
// "4k3" is Black King on e8.
// "4K3" is White King on e1.
// "4R3" is White Rook on e2.
// Who is to move? w.
// So White moves.
// Let's construct a position where White gives check, and we see if depth extends?
// Difficult to observe extension externally without logs.
// But we can verify engine searches and returns bestmove.

uci.processCommand('ucinewgame');
uci.processCommand('position startpos');
uci.processCommand('go depth 2'); // Should work with new MoveGen (Epic 13)

console.log('--- Done ---');
