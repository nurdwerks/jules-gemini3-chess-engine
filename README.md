# Jules & Gemini 3 Chess Engine

## Purpose
This repository serves as a collaborative testbed for **Jules** and **Gemini 3**. The primary objective is to verify our capabilities in complex software engineering tasks, specifically building a competitive chess engine from scratch using **Node.js**. We use this project to test our reasoning, coding, debugging, and planning skills in a real-world scenario with established rules but high algorithmic complexity.

## Enhancements (Epics)

The following enhancements outline the roadmap for elevating the engine from a basic UCI engine to a competitive, modern chess engine.

### Epic 1: Neural Network Evaluation (NNUE)
**Size:** Large (1-2 weeks)
**Description:** Replace the current Hand-Crafted Evaluation (HCE) with an Efficiently Updatable Neural Network (NNUE).
**User Stories:**
1.  **Load NNUE Architecture (S)**
    *   Create a loader for standard NNUE architecture files (e.g., halfkp_256x2-32-32).
    *   Verify weights are loaded correctly into typed arrays.
2.  **Implement HalfKP Indexing (S)**
    *   Implement the logic to map King square + Piece square to the feature index.
3.  **Implement Accumulator Refresh (S)**
    *   Create the logic to compute the accumulator state from scratch for a given board.
4.  **Implement Incremental Accumulator Update (S)**
    *   Update the accumulator values based on the move (Remove piece, Add piece) without full re-computation.
5.  **Implement Layer 1 & 2 Transforms (S)**
    *   Implement the affine transformation and Clipped ReLU activation for the first hidden layer.
6.  **Implement Output Layer (S)**
    *   Implement the final affine transformation to produce the evaluation score.
7.  **Integrate NNUE into Evaluation (S)**
    *   Switch `Evaluation.evaluate()` to use the NNUE score.
    *   Add `UCI_UseNNUE` option.

### Epic 2: Search Sophistication
**Size:** Medium (3-5 days)
**Description:** Implement advanced search pruning and reduction techniques.
**User Stories:**
1.  **SEE: Attacker Selection (S)**
    *   Implement logic to identify the least valuable attacker on a target square.
2.  **SEE: Swap Algorithm (S)**
    *   Implement the recursive "swap" algorithm to calculate the static exchange evaluation score.
3.  **Null Move Pruning (S)**
    *   Implement the logic to pass the move and search with reduced depth.
    *   Handle verification search if needed.
4.  **Late Move Reduction (LMR) (S)**
    *   Implement depth reduction formula based on move ordering index and depth.
    *   Implement re-search logic if the reduced score beats alpha.
5.  **Futility Pruning (S)**
    *   Implement margin-based pruning for leaf nodes.

### Epic 3: Parallel Search (Lazy SMP)
**Size:** Medium (3-5 days)
**Description:** Utilize multi-core processors using "Lazy SMP".
**User Stories:**
1.  **Define Shared Buffer Layout (S)**
    *   Design the memory structure for `SharedArrayBuffer` to store TT entries (key, score, depth, flag, move).
2.  **Implement Atomic TT Read/Write (S)**
    *   Use `Atomics` to safely read and write 64-bit values (or split 32-bit) to the shared buffer.
3.  **Spawn Worker Threads (S)**
    *   Use `worker_threads` to spawn helper instances.
    *   Replicate the initial board state to workers.
4.  **Implement Message Passing (S)**
    *   Synchronize UCI commands (`stop`, `quit`) across workers.
5.  **Collect Search Results (S)**
    *   Aggregate results from workers or simply use the main thread's best move after time is up.

### Epic 4: Endgame Tablebases (Syzygy)
**Size:** Medium (3-5 days)
**Description:** Integrate Syzygy tablebases for perfect endgames.
**User Stories:**
1.  **Syzygy Header Parser (S)**
    *   Read and parse the header of `.rtbw` and `.rtbz` files to get metadata (piece counts, normalization).
2.  **Syzygy Index Calculation (S)**
    *   Map the current board configuration (Piece locations) to the unique index used by the tablebase.
3.  **Decompression Logic (S)**
    *   Implement the Huffman or specialized decompression logic to read the value for the index.
4.  **Root Probe Integration (S)**
    *   Call the probe function at the start of `search`.
5.  **Search Tree Probe (S)**
    *   Call the WDL probe inside `alphaBeta` when piece count is low.

### Epic 5: UCI Protocol Completeness
**Size:** Small (1-2 days)
**Description:** Ensure full compliance with the UCI standard.
**User Stories:**
1.  **Option Reporting (S)**
    *   Send `option name ...` commands for Hash, Threads, Ponder, MultiPV.
2.  **Handle Hash Option (S)**
    *   Resize the Transposition Table when the `Hash` option is set.
3.  **Handle Ponder Logic (S)**
    *   Implement the state transition for "Pondering" (searching but not moving).
    *   Handle `ponderhit`.

### Epic 6: Chess960 (Fischer Random) Support
**Size:** Medium (3-5 days)
**Description:** Enable the engine to play Fischer Random Chess.
**User Stories:**
1.  **X-FEN Parsing (S)**
    *   Update FEN parser to accept castling rights denoted by File letters (e.g., `HAha`) instead of `KQkq`.
2.  **Update Castling Rights Storage (S)**
    *   Modify `Board` state to store the specific starting files of the Rooks for castling.
3.  **Update King/Rook Placement Logic (S)**
    *   Ensure `loadFen` places pieces correctly for 960 start positions.
4.  **Update 960 Move Generation (S)**
    *   Modify `generateMoves` to produce castling moves where King takes Rook's square (or standard 960 convention).
5.  **Update 960 Move Application (S)**
    *   Modify `applyMove` to handle the special castling move (putting King and Rook on correct final squares).

### Epic 7: Texel Tuning (Evaluation Optimization)
**Size:** Medium (3-5 days)
**Description:** Implement a tuner to automatically optimize evaluation weights.
**User Stories:**
1.  **EPD Dataset Loader (S)**
    *   Create a tool to load millions of positions from EPD files with game results (1.0, 0.5, 0.0).
2.  **Evaluation Error Function (S)**
    *   Implement the sigmoid-based Mean Squared Error function comparing static eval to game result.
3.  **Gradient Descent Solver (S)**
    *   Implement a local minimization algorithm (like Gradient Descent or Gauss-Newton) to adjust weights.
4.  **Expose Tunable Parameters (S)**
    *   Refactor `Evaluation.js` to allow weights to be updated externally during the tuning process.
5.  **Export Tuned Weights (S)**
    *   Save the optimized weights to a JSON or JS file for use in the engine.

### Epic 8: Search Visualization & Debugging
**Size:** Small (2-3 days)
**Description:** Tools to visualize the search tree and debug pruning logic.
**User Stories:**
1.  **JSON Tree Export (S)**
    *   Create a debug mode in `Search` that dumps the visited nodes, scores, and pruning reasons to a large JSON structure.
2.  **Web Tree Viewer (S)**
    *   Create a simple HTML/D3.js page to load the JSON and render the tree interactively.
3.  **Pruning Stats Logging (S)**
    *   Add counters for how many times each pruning technique (Null Move, Futility) triggered.
4.  **PV Consistency Check (S)**
    *   Add a debug check to verify that the Principal Variation returned is actually legal and connected.

### Epic 9: Strength Limitation
**Size:** Small (2-3 days)
**Description:** Allow the engine to play at lower strength levels for testing or human play.
**User Stories:**
1.  **Implement UCI_LimitStrength (S)**
    *   Add the standard UCI option `UCI_LimitStrength` (bool) and `UCI_Elo` (int).
2.  **Elo to Node Mapping (S)**
    *   Create a formula to convert a target Elo (e.g., 1500) to a maximum node count per move.
3.  **Error Injection Logic (S)**
    *   Implement a probability-based mechanism to pick the 2nd or 3rd best move instead of the best move.
4.  **Time Management Override (S)**
    *   Force the engine to move instantly (or strictly adhere to node limits) when in limited strength mode.

### Epic 10: Bitboard Infrastructure
**Size:** Medium (3-5 days)
**Description:** Implement the foundational Bitboard classes to optimize move generation and evaluation eventually.
**User Stories:**
1.  **Bitboard Class & Utils (S)**
    *   Implement a `Bitboard` class (wrapping BigInt) with methods for `popcnt`, `lsb`, `setBit`, `clearBit`.
2.  **Pre-calculate Knight Attacks (S)**
    *   Generate a lookup array for Knight attacks from every square.
3.  **Pre-calculate King Attacks (S)**
    *   Generate a lookup array for King attacks from every square.
4.  **Implement Magic Bitboard Generation (S)**
    *   Implement the code to find/use Magic numbers for generating Slider attacks (Rook/Bishop).
5.  **Implement Slider Attack Lookups (S)**
    *   Create the functions `getRookAttacks(sq, occupancy)` and `getBishopAttacks(sq, occupancy)` using the magics.

## Review of Sized Items

**Medium (M) & Large (L) Items:**

*   **No items sized Medium or Large found.**
*   All User Stories have been successfully decomposed into **Small (S)** tasks.
*   This granular breakdown significantly reduces risk by allowing for rapid iteration, easier debugging, and parallel development where applicable.
*   Complexity remains in the logic (NNUE math, Concurrency), but the implementation steps are now manageable units of work (1-2 days max).
