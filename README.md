# Jules & Gemini 3 Chess Engine

## Purpose
This repository serves as a collaborative testbed for **Jules** and **Gemini 3**. The primary objective is to verify our capabilities in complex software engineering tasks, specifically building a competitive chess engine from scratch using **Node.js**. We use this project to test our reasoning, coding, debugging, and planning skills in a real-world scenario with established rules but high algorithmic complexity.

## Enhancements (Epics)

The following enhancements outline the roadmap for elevating the engine from a basic UCI engine to a competitive, modern chess engine. The Epics are ordered from least complex to most complex.

### Epic 1: UCI Protocol Completeness
**Size:** Small (1-2 days)
**Description:** Ensure full compliance with the UCI standard.
**User Stories:**
1.  **Option Reporting (S)**
    *   *Description:* Send `option name ...` commands for Hash, Threads, Ponder, MultiPV.
    *   *Acceptance Criteria:*
        *   [x] Responds to `uci` with correct `option name <Name> type <Type>` lines.
        *   [x] Reports default values correctly.
2.  **Handle Hash Option (S)**
    *   *Description:* Resize the Transposition Table when the `Hash` option is set.
    *   *Acceptance Criteria:*
        *   [x] `setoption name Hash value 128` allocates 128MB.
        *   [x] Previous TT data is cleared or resized safely.
3.  **Handle Ponder Logic (S)**
    *   *Description:* Implement the state transition for "Pondering" (searching but not moving).
    *   *Acceptance Criteria:*
        *   [x] `go ponder` starts search but does not print `bestmove` immediately on completion.
        *   [x] `ponderhit` command transitions to normal search mode.

### Epic 2: Strength Limitation
**Size:** Small (2-3 days)
**Description:** Allow the engine to play at lower strength levels for testing or human play.
**User Stories:**
1.  **Implement UCI_LimitStrength (S)**
    *   *Description:* Add the standard UCI option `UCI_LimitStrength` (bool) and `UCI_Elo` (int).
    *   *Acceptance Criteria:*
        *   [x] Options appear in `uci` output.
        *   [x] Setting `UCI_Elo` updates internal configuration.
2.  **Elo to Node Mapping (S)**
    *   *Description:* Create a formula to convert a target Elo (e.g., 1500) to a maximum node count per move.
    *   *Acceptance Criteria:*
        *   [ ] Formula produces reasonable node limits (e.g., 1000 nodes for 1200 Elo).
        *   [ ] Tested with various Elo values.
3.  **Error Injection Logic (S)**
    *   *Description:* Implement a probability-based mechanism to pick the 2nd or 3rd best move instead of the best move.
    *   *Acceptance Criteria:*
        *   [ ] At low Elo, engine occasionally plays suboptimal moves (Multipv).
        *   [ ] Error rate decreases as Elo increases.
4.  **Time Management Override (S)**
    *   *Description:* Force the engine to move instantly (or strictly adhere to node limits) when in limited strength mode.
    *   *Acceptance Criteria:*
        *   [ ] Engine does not use full time if node limit is reached.
        *   [ ] Returns move quickly at low Elo.

### Epic 3: Search Visualization & Debugging
**Size:** Small (2-3 days)
**Description:** Tools to visualize the search tree and debug pruning logic.
**User Stories:**
1.  **JSON Tree Export (S)**
    *   *Description:* Create a debug mode in `Search` that dumps the visited nodes, scores, and pruning reasons to a large JSON structure.
    *   *Acceptance Criteria:*
        *   [ ] `debug_tree` command or option enables recording.
        *   [ ] Output file contains hierarchy of moves and scores.
2.  **Web Tree Viewer (S)**
    *   *Description:* Create a simple HTML/D3.js page to load the JSON and render the tree interactively.
    *   *Acceptance Criteria:*
        *   [ ] HTML file loads local JSON.
        *   [ ] Nodes are collapsible/expandable.
        *   [ ] Scores and pruning flags are visible.
3.  **Pruning Stats Logging (S)**
    *   *Description:* Add counters for how many times each pruning technique (Null Move, Futility) triggered.
    *   *Acceptance Criteria:*
        *   [ ] Statistics printed at end of search (e.g., "NullMove: 500 cuts").
        *   [ ] Verifies that pruning is actually active.
4.  **PV Consistency Check (S)**
    *   *Description:* Add a debug check to verify that the Principal Variation returned is actually legal and connected.
    *   *Acceptance Criteria:*
        *   [ ] Throws error if PV move sequence is illegal.
        *   [ ] Verifies PV length matches reported depth (mostly).

### Epic 4: Chess960 (Fischer Random) Support
**Size:** Medium (3-5 days)
**Description:** Enable the engine to play Fischer Random Chess.
**User Stories:**
1.  **X-FEN Parsing (S)**
    *   *Description:* Update FEN parser to accept castling rights denoted by File letters (e.g., `HAha`) instead of `KQkq`.
    *   *Acceptance Criteria:*
        *   [ ] `loadFen` accepts X-FEN strings.
        *   [ ] Internal state reflects correct target rook files.
2.  **Update Castling Rights Storage (S)**
    *   *Description:* Modify `Board` state to store the specific starting files of the Rooks for castling.
    *   *Acceptance Criteria:*
        *   [ ] State object includes castling rook file indices.
        *   [ ] Zobrist hash includes 960-specific castling rights.
3.  **Update King/Rook Placement Logic (S)**
    *   *Description:* Ensure `loadFen` places pieces correctly for 960 start positions.
    *   *Acceptance Criteria:*
        *   [ ] Correctly sets up random back ranks.
        *   [ ] Validates FEN validity (Bishops opposite colors, King between Rooks).
4.  **Update 960 Move Generation (S)**
    *   *Description:* Modify `generateMoves` to produce castling moves where King takes Rook's square (or standard 960 convention).
    *   *Acceptance Criteria:*
        *   [ ] Generates castling moves even if King/Rook are on non-standard squares.
        *   [ ] Filters out castling if obstructed.
5.  **Update 960 Move Application (S)**
    *   *Description:* Modify `applyMove` to handle the special castling move (putting King and Rook on correct final squares).
    *   *Acceptance Criteria:*
        *   [ ] King and Rook land on g/f or c/d files correctly.
        *   [ ] Supports "self-capture" notation if using that convention.

### Epic 5: Search Sophistication
**Size:** Medium (3-5 days)
**Description:** Implement advanced search pruning and reduction techniques.
**User Stories:**
1.  **SEE: Attacker Selection (S)**
    *   *Description:* Implement logic to identify the least valuable attacker on a target square.
    *   *Acceptance Criteria:*
        *   [ ] Function returns lowest value piece (P < N/B < R < Q < K).
        *   [ ] Correctly handles battery/x-ray attackers.
2.  **SEE: Swap Algorithm (S)**
    *   *Description:* Implement the recursive "swap" algorithm to calculate the static exchange evaluation score.
    *   *Acceptance Criteria:*
        *   [ ] Returns positive score for winning capture, negative for losing.
        *   [ ] Passes standard SEE test positions.
3.  **Null Move Pruning (S)**
    *   *Description:* Implement the logic to pass the move and search with reduced depth.
    *   *Acceptance Criteria:*
        *   [ ] Reduces node count significantly in winning positions.
        *   [ ] Logic disabled in endgame (Zugzwang) or if King in check.
4.  **Late Move Reduction (LMR) (S)**
    *   *Description:* Implement depth reduction formula based on move ordering index and depth.
    *   *Acceptance Criteria:*
        *   [ ] Late moves (index > 4) searched with depth - 1 or - 2.
        *   [ ] PV nodes are not reduced.
5.  **Futility Pruning (S)**
    *   *Description:* Implement margin-based pruning for leaf nodes.
    *   *Acceptance Criteria:*
        *   [ ] Returns alpha if static eval + margin < alpha.
        *   [ ] Applied only at low depths (1-3).

### Epic 6: Texel Tuning (Evaluation Optimization)
**Size:** Medium (3-5 days)
**Description:** Implement a tuner to automatically optimize evaluation weights.
**User Stories:**
1.  **EPD Dataset Loader (S)**
    *   *Description:* Create a tool to load millions of positions from EPD files with game results.
    *   *Acceptance Criteria:*
        *   [ ] Parses standard EPD format.
        *   [ ] Extracts "wdl" or result tags (1.0/0.5/0.0).
2.  **Evaluation Error Function (S)**
    *   *Description:* Implement the sigmoid-based Mean Squared Error function comparing static eval to game result.
    *   *Acceptance Criteria:*
        *   [ ] Computes MSE across a dataset.
        *   [ ] `K` scaling factor is configurable.
3.  **Gradient Descent Solver (S)**
    *   *Description:* Implement a local minimization algorithm to adjust weights.
    *   *Acceptance Criteria:*
        *   [ ] Weights converge to lower error over iterations.
        *   [ ] Handles parameter bounds (no negative value for Queen).
4.  **Expose Tunable Parameters (S)**
    *   *Description:* Refactor `Evaluation.js` to allow weights to be updated externally.
    *   *Acceptance Criteria:*
        *   [ ] Weights object is exported/mutable.
        *   [ ] Tuner can modify weights without restarting engine.
5.  **Export Tuned Weights (S)**
    *   *Description:* Save the optimized weights to a JSON or JS file.
    *   *Acceptance Criteria:*
        *   [ ] Output file format matches `Evaluation.js` input.
        *   [ ] Engine plays stronger with new weights (SPRT verified).

### Epic 7: Bitboard Infrastructure
**Size:** Medium (3-5 days)
**Description:** Implement the foundational Bitboard classes to optimize move generation and evaluation eventually.
**User Stories:**
1.  **Bitboard Class & Utils (S)**
    *   *Description:* Implement a `Bitboard` class (wrapping BigInt) with methods for `popcnt`, `lsb`, `setBit`, `clearBit`.
    *   *Acceptance Criteria:*
        *   [ ] Operations work correctly on 64-bit integers.
        *   [ ] Performance is comparable to native BigInt ops.
2.  **Pre-calculate Knight Attacks (S)**
    *   *Description:* Generate a lookup array for Knight attacks from every square.
    *   *Acceptance Criteria:*
        *   [ ] Array[64] contains correct bitmasks.
        *   [ ] Verified against manual edge cases.
3.  **Pre-calculate King Attacks (S)**
    *   *Description:* Generate a lookup array for King attacks from every square.
    *   *Acceptance Criteria:*
        *   [ ] Array[64] contains correct bitmasks.
4.  **Implement Magic Bitboard Generation (S)**
    *   *Description:* Implement the code to find/use Magic numbers for generating Slider attacks (Rook/Bishop).
    *   *Acceptance Criteria:*
        *   [ ] Generates valid magic numbers that produce index collisions only for irrelevant bits.
        *   [ ] Table size is minimized (Plain Magic or Black Magic).
5.  **Implement Slider Attack Lookups (S)**
    *   *Description:* Create the functions `getRookAttacks(sq, occupancy)` and `getBishopAttacks(sq, occupancy)` using the magics.
    *   *Acceptance Criteria:*
        *   [ ] Returns correct attacks blocking at first piece.
        *   [ ] Verified against 0x88 logic.

### Epic 8: Endgame Tablebases (Syzygy)
**Size:** Medium (3-5 days)
**Description:** Integrate Syzygy tablebases for perfect endgames.
**User Stories:**
1.  **Syzygy Header Parser (S)**
    *   *Description:* Read and parse the header of `.rtbw` and `.rtbz` files to get metadata.
    *   *Acceptance Criteria:*
        *   [ ] correctly reads magic bytes and version.
        *   [ ] Extracts min/max piece counts.
2.  **Syzygy Index Calculation (S)**
    *   *Description:* Map the current board configuration to the unique index used by the tablebase.
    *   *Acceptance Criteria:*
        *   [ ] Implements binomial coefficient indexing.
        *   [ ] Matches official Syzygy index specs.
3.  **Decompression Logic (S)**
    *   *Description:* Implement the Huffman or specialized decompression logic to read the value.
    *   *Acceptance Criteria:*
        *   [ ] Decompresses blocks correctly.
        *   [ ] Returns correct WDL value for known positions.
4.  **Root Probe Integration (S)**
    *   *Description:* Call the probe function at the start of `search`.
    *   *Acceptance Criteria:*
        *   [ ] Plays instant move if winning/drawing line found in TB.
        *   [ ] Reports "Mate in X" (if DTZ) or "Tablebase Win".
5.  **Search Tree Probe (S)**
    *   *Description:* Call the WDL probe inside `alphaBeta` when piece count is low.
    *   *Acceptance Criteria:*
        *   [ ] Updates node score to WIN/DRAW/LOSS.
        *   [ ] Does not query DTZ inside search (too slow).

### Epic 9: Parallel Search (Lazy SMP)
**Size:** Medium (3-5 days)
**Description:** Utilize multi-core processors using "Lazy SMP".
**User Stories:**
1.  **Define Shared Buffer Layout (S)**
    *   *Description:* Design the memory structure for `SharedArrayBuffer` to store TT entries.
    *   *Acceptance Criteria:*
        *   [ ] Buffer size matches requested Hash size.
        *   [ ] Entry struct fits efficiently (e.g., 16 bytes).
2.  **Implement Atomic TT Read/Write (S)**
    *   *Description:* Use `Atomics` to safely read and write 64-bit values to the shared buffer.
    *   *Acceptance Criteria:*
        *   [ ] No data corruption under high concurrency.
        *   [ ] Uses `Atomics.store` and `Atomics.load`.
3.  **Spawn Worker Threads (S)**
    *   *Description:* Use `worker_threads` to spawn helper instances.
    *   *Acceptance Criteria:*
        *   [ ] Workers start successfully.
        *   [ ] Workers receive initial board state.
4.  **Implement Message Passing (S)**
    *   *Description:* Synchronize UCI commands (`stop`, `quit`) across workers.
    *   *Acceptance Criteria:*
        *   [ ] `stop` command halts all workers.
        *   [ ] `quit` terminates all workers.
5.  **Collect Search Results (S)**
    *   *Description:* Aggregate results from workers or simply use the main thread's best move.
    *   *Acceptance Criteria:*
        *   [ ] Main thread picks best move from TT or worker reports.
        *   [ ] Engine outputs `bestmove` reliably.

### Epic 10: Neural Network Evaluation (NNUE)
**Size:** Large (1-2 weeks)
**Description:** Replace the current Hand-Crafted Evaluation (HCE) with an Efficiently Updatable Neural Network (NNUE).
**User Stories:**
1.  **Load NNUE Architecture (S)**
    *   *Description:* Create a loader for standard NNUE architecture files.
    *   *Acceptance Criteria:*
        *   [ ] Reads binary file format.
        *   [ ] Matches expected hash/checksum of the net.
2.  **Implement HalfKP Indexing (S)**
    *   *Description:* Implement the logic to map King square + Piece square to the feature index.
    *   *Acceptance Criteria:*
        *   [ ] Correctly calculates indices for white and black perspectives.
        *   [ ] Handles "Dirty" pieces logic if needed.
3.  **Implement Accumulator Refresh (S)**
    *   *Description:* Create the logic to compute the accumulator state from scratch.
    *   *Acceptance Criteria:*
        *   [ ] Result matches golden vectors for startpos.
        *   [ ] Performance is acceptable (< 1ms).
4.  **Implement Incremental Accumulator Update (S)**
    *   *Description:* Update the accumulator values based on the move without full re-computation.
    *   *Acceptance Criteria:*
        *   [ ] Updated accumulator matches "Refresh" accumulator exactly.
        *   [ ] Handles quiet moves and captures correctly.
5.  **Implement Layer 1 & 2 Transforms (S)**
    *   *Description:* Implement the affine transformation and Clipped ReLU activation for the first hidden layer.
    *   *Acceptance Criteria:*
        *   [ ] Implementation matches math definition.
        *   [ ] SIMD intrinsics used if available/mocked.
6.  **Implement Output Layer (S)**
    *   *Description:* Implement the final affine transformation to produce the evaluation score.
    *   *Acceptance Criteria:*
        *   [ ] Output scaled correctly to centipawns.
        *   [ ] Agrees with external NNUE probe tools.
7.  **Integrate NNUE into Evaluation (S)**
    *   *Description:* Switch `Evaluation.evaluate()` to use the NNUE score.
    *   *Acceptance Criteria:*
        *   [ ] `UCI_UseNNUE` toggles evaluation source.
        *   [ ] Search uses NNUE score for node evaluation.

## Review of Sized Items

**Medium (M) & Large (L) Items:**

*   **No items sized Medium or Large found.**
*   All User Stories have been successfully decomposed into **Small (S)** tasks.
*   This granular breakdown significantly reduces risk by allowing for rapid iteration, easier debugging, and parallel development where applicable.
*   Complexity remains in the logic (NNUE math, Concurrency), but the implementation steps are now manageable units of work (1-2 days max).
