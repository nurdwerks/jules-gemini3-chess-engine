const fs = require('fs');
const readline = require('readline');

class EpdLoader {
    static async load(filePath) {
        const positions = [];
        const fileStream = fs.createReadStream(filePath);

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            const pos = EpdLoader.parseLine(line);
            if (pos) positions.push(pos);
        }
        return positions;
    }

    static parseLine(line) {
        // EPD format: FEN [commands]
        // Example: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 c0 "startpos"; result 1/2-1/2;
        // We need FEN and Result (1.0, 0.5, 0.0).
        // Result usually in "c0" comment or "result" opcode?
        // Standard EPD opcodes: "c0", "c1" (comments), "id", "pm" (predicted move), "hmvc" (halfmove clock).
        // "result" is often used in datasets (e.g. Texel).
        // "1-0", "0-1", "1/2-1/2" usually at end or in "c0".

        // Simplified parsing:
        // 1. FEN (first 4 fields mandatory, usually 6 in EPD).
        // Extract FEN part.
        // 2. Look for "1-0", "0-1", "1/2-1/2".

        const parts = line.trim().split(';');
        const mainPart = parts[0]; // FEN + some opcodes?

        // Extract result
        let result = null; // 1.0 (white win), 0.0 (black win), 0.5 (draw)

        if (line.includes('1-0')) result = 1.0;
        else if (line.includes('0-1')) result = 0.0;
        else if (line.includes('1/2-1/2')) result = 0.5;

        // Also check "wdl" opcode? "wdl" not standard but used.
        // If result not found, skip or return null.

        if (result === null) return null;

        // Extract FEN
        // FEN is the beginning of the line.
        // Find 4th space? (Board Active Castling EP).
        // Or 6th space?
        // EPD FEN part usually ends before ';'.
        // Let's assume standard FEN format (6 fields).
        const fenRegex = /^([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+ [wb] [KQkq-]+ [a-h1-8-]+ \d+ \d+/;
        const match = line.match(fenRegex);

        if (match) {
            return { fen: match[0], result };
        }

        // Fallback: Try splitting by ' ' and taking first 6?
        const tokens = line.split(/\s+/);
        if (tokens.length >= 4) {
             // Reconstruct minimal FEN (Board Active Castling EP) if others missing
             // But Board.js expects 6.
             // If EPD has 4, add "0 1".
             // Let's assume valid 6-part FEN is present or parsable.
             if (tokens.length >= 6) {
                 const fen = tokens.slice(0, 6).join(' ');
                 return { fen, result };
             }
        }

        return null;
    }
}

module.exports = EpdLoader;
