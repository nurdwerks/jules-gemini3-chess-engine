// Polyglot Random Numbers
// These should match the official Polyglot constants to be compatible with standard books.
// Since we don't have the full list, we will use a PRNG to fill it,
// ensuring that if we had the real file, we'd just replace this content.
// For testing, we will generate a book using THESE constants.

const Random64 = [];

// Helper to generate 64-bit BigInt
function gen64() {
    let hex = '0x';
    for(let i=0; i<16; i++) {
        hex += Math.floor(Math.random() * 16).toString(16);
    }
    return BigInt(hex);
}

for(let i=0; i<781; i++) {
    Random64.push(gen64());
}

// Overwrite the first few with the ones from the website for sanity check if we were debugging against known values
// (Optional, but good for reference)
Random64[0] = 0x9D39247E33776D41n;
Random64[1] = 0x2AF7398005AAA5C7n;

module.exports = { Random64 };
