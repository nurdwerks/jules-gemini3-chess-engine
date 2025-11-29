# Archived Roadmap (Completed or Superseded)

The following Epics were part of the initial development phase and are either completed, partially completed, or superseded by new epics.

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
        *   [x] Formula produces reasonable node limits (e.g., 1000 nodes for 1200 Elo).
        *   [x] Tested with various Elo values.
3.  **Error Injection Logic (S)**
    *   *Description:* Implement a probability-based mechanism to pick the 2nd or 3rd best move instead of the best move.
    *   *Acceptance Criteria:*
        *   [x] At low Elo, engine occasionally plays suboptimal moves (Multipv).
        *   [x] Error rate decreases as Elo increases.
4.  **Time Management Override (S)**
    *   *Description:* Force the engine to move instantly (or strictly adhere to node limits) when in limited strength mode.
    *   *Acceptance Criteria:*
        *   [x] Engine does not use full time if node limit is reached.
        *   [x] Returns move quickly at low Elo.

### Epic 3: Search Visualization & Debugging
**Size:** Small (2-3 days)
**Description:** Tools to visualize the search tree and debug pruning logic.
**User Stories:**
1.  **JSON Tree Export (S)**
    *   *Description:* Create a debug mode in `Search` that dumps the visited nodes, scores, and pruning reasons to a large JSON structure.
    *   *Acceptance Criteria:*
        *   [x] `debug_tree` command or option enables recording.
        *   [x] Output file contains hierarchy of moves and scores.
2.  **Web Tree Viewer (S)**
    *   *Description:* Create a simple HTML/D3.js page to load the JSON and render the tree interactively.
    *   *Acceptance Criteria:*
        *   [x] HTML file loads local JSON.
        *   [x] Nodes are collapsible/expandable.
        *   [x] Scores and pruning flags are visible.
3.  **Pruning Stats Logging (S)**
    *   *Description:* Add counters for how many times each pruning technique (Null Move, Futility) triggered.
    *   *Acceptance Criteria:*
        *   [x] Statistics printed at end of search (e.g., "NullMove: 500 cuts").
        *   [x] Verifies that pruning is actually active.
4.  **PV Consistency Check (S)**
    *   *Description:* Add a debug check to verify that the Principal Variation returned is actually legal and connected.
    *   *Acceptance Criteria:*
        *   [x] Throws error if PV move sequence is illegal.
        *   [x] Verifies PV length matches reported depth (mostly).

### Epic 4: Chess960 (Fischer Random) Support
**Size:** Medium (3-5 days)
**Description:** Enable the engine to play Fischer Random Chess.
**User Stories:**
1.  **X-FEN Parsing (S)**
    *   *Description:* Update FEN parser to accept castling rights denoted by File letters (e.g., `HAha`) instead of `KQkq`.
    *   *Acceptance Criteria:*
        *   [x] `loadFen` accepts X-FEN strings.
        *   [x] Internal state reflects correct target rook files.
2.  **Update Castling Rights Storage (S)**
    *   *Description:* Modify `Board` state to store the specific starting files of the Rooks for castling.
    *   *Acceptance Criteria:*
        *   [x] State object includes castling rook file indices.
        *   [ ] Zobrist hash includes 960-specific castling rights.
3.  **Update King/Rook Placement Logic (S)**
    *   *Description:* Ensure `loadFen` places pieces correctly for 960 start positions.
    *   *Acceptance Criteria:*
        *   [x] Correctly sets up random back ranks.
        *   [x] Validates FEN validity (Bishops opposite colors, King between Rooks).
4.  **Update 960 Move Generation (S)**
    *   *Description:* Modify `generateMoves` to produce castling moves where King takes Rook's square (or standard 960 convention).
    *   *Acceptance Criteria:*
        *   [x] Generates castling moves even if King/Rook are on non-standard squares.
        *   [x] Filters out castling if obstructed.
5.  **Update 960 Move Application (S)**
    *   *Description:* Modify `applyMove` to handle the special castling move (putting King and Rook on correct final squares).
    *   *Acceptance Criteria:*
        *   [x] King and Rook land on g/f or c/d files correctly.
        *   [x] Supports "self-capture" notation if using that convention.

### Epic 5: Search Sophistication
**Size:** Medium (3-5 days)
**Description:** Implement advanced search pruning and reduction techniques.
**User Stories:**
1.  **SEE: Attacker Selection (S)**
    *   *Description:* Implement logic to identify the least valuable attacker on a target square.
    *   *Acceptance Criteria:*
        *   [x] Function returns lowest value piece (P < N/B < R < Q < K).
        *   [x] Correctly handles battery/x-ray attackers.
2.  **SEE: Swap Algorithm (S)**
    *   *Description:* Implement the recursive "swap" algorithm to calculate the static exchange evaluation score.
    *   *Acceptance Criteria:*
        *   [x] Returns positive score for winning capture, negative for losing.
        *   [x] Passes standard SEE test positions.
3.  **Null Move Pruning (S)**
    *   *Description:* Implement the logic to pass the move and search with reduced depth.
    *   *Acceptance Criteria:*
        *   [x] Reduces node count significantly in winning positions.
        *   [x] Logic disabled in endgame (Zugzwang) or if King in check.
4.  **Late Move Reduction (LMR) (S)**
    *   *Description:* Implement depth reduction formula based on move ordering index and depth.
    *   *Acceptance Criteria:*
        *   [x] Late moves (index > 4) searched with depth - 1 or - 2.
        *   [x] PV nodes are not reduced.
5.  **Futility Pruning (S)**
    *   *Description:* Implement margin-based pruning for leaf nodes.
    *   *Acceptance Criteria:*
        *   [x] Returns alpha if static eval + margin < alpha.
        *   [x] Applied only at low depths (1-3).

### Epic 6: Texel Tuning (Evaluation Optimization)
**Size:** Medium (3-5 days)
**Description:** Implement a tuner to automatically optimize evaluation weights.
**User Stories:**
1.  **EPD Dataset Loader (S)**
    *   *Description:* Create a tool to load millions of positions from EPD files with game results.
    *   *Acceptance Criteria:*
        *   [x] Parses standard EPD format.
        *   [x] Extracts "wdl" or result tags (1.0/0.5/0.0).
2.  **Evaluation Error Function (S)**
    *   *Description:* Implement the sigmoid-based Mean Squared Error function comparing static eval to game result.
    *   *Acceptance Criteria:*
        *   [x] Computes MSE across a dataset.
        *   [x] `K` scaling factor is configurable.
3.  **Gradient Descent Solver (S)**
    *   *Description:* Implement a local minimization algorithm to adjust weights.
    *   *Acceptance Criteria:*
        *   [x] Weights converge to lower error over iterations.
        *   [x] Handles parameter bounds (no negative value for Queen).
4.  **Expose Tunable Parameters (S)**
    *   *Description:* Refactor `Evaluation.js` to allow weights to be updated externally.
    *   *Acceptance Criteria:*
        *   [x] Weights object is exported/mutable.
        *   [x] Tuner can modify weights without restarting engine.
5.  **Export Tuned Weights (S)**
    *   *Description:* Save the optimized weights to a JSON or JS file.
    *   *Acceptance Criteria:*
        *   [x] Output file format matches `Evaluation.js` input.
        *   [x] Engine plays stronger with new weights (SPRT verified).

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

### Epic 11: Aspiration Windows
**Size:** Small (2-3 days)
**Description:** Improve search efficiency by searching with a narrow window around the previous best score.
**User Stories:**
1.  **Implement Window Logic (S)**
    *   *Description:* In the root search loop, start with alpha = prevScore - window, beta = prevScore + window.
    *   *Acceptance Criteria:*
        *   [x] Search uses narrow window.
        *   [x] Window size (e.g., 50cp) is configurable.
2.  **Handle Fail-Low/Fail-High (S)**
    *   *Description:* If search returns <= alpha or >= beta, re-search with wider window.
    *   *Acceptance Criteria:*
        *   [x] Re-searches correctly with open window (-Inf, Inf) or exponentially growing window.
        *   [x] Correct score returned ultimately.

### Epic 12: Static Exchange Evaluation (SEE) Integration
**Size:** Small (2-3 days)
**Description:** Integrate the existing SEE logic into the search for better move ordering and pruning.
**User Stories:**
1.  **SEE Move Ordering (S)**
    *   *Description:* Use SEE to order captures (winning captures first, losing captures last).
    *   *Acceptance Criteria:*
        *   [x] Captures with negative SEE score are ordered after quiet moves.
        *   [x] Captures with positive SEE score are ordered by MVV-LVA.
2.  **SEE Pruning in QSearch (S)**
    *   *Description:* Prune captures in Quiescence Search if SEE < 0.
    *   *Acceptance Criteria:*
        *   [x] Does not search losing captures in QSearch.
        *   [x] Does not introduce significant tactical blunders (SPRT verified).

### Epic 13: Magic Bitboards & Move Gen V2
**Size:** Medium (3-5 days)
**Description:** Migrate the move generation from 0x88 array-based to fully bitboard-based for performance.
**User Stories:**
1.  **Magic Bitboard Generation (S)**
    *   *Description:* Implement generation/loading of magic numbers for sliding pieces.
    *   *Acceptance Criteria:*
        *   [x] Generates valid magic numbers.
        *   [x] Lookup table size is optimized.
2.  **Implement Slider Attacks (S)**
    *   *Description:* Implement `getRookAttacks` and `getBishopAttacks` using magics.
    *   *Acceptance Criteria:*
        *   [x] Returns correct bitmask for any occupancy.
        *   [x] Performance is significantly faster than ray-casting.
3.  **Refactor Board to Bitboards (S)**
    *   *Description:* Update `Board` class to maintain bitboards for all pieces (in parallel or replacement).
    *   *Acceptance Criteria:*
        *   [x] `this.bitboards` maintained incrementally.
        *   [x] `applyMove` updates bitboards.
4.  **Bitboard Move Generation (S)**
    *   *Description:* Rewrite `generateMoves` to use bitwise operations.
    *   *Acceptance Criteria:*
        *   [x] Matches perft results of 0x88 generator.
        *   [x] Is measurably faster (benchmarked).

### Epic 14: Polyglot Opening Book
**Size:** Small (2-3 days)
**Description:** Fully integrate Polyglot opening book support.
**User Stories:**
1.  **Load .bin Files (S)**
    *   *Description:* Implement `loadBook` to read standard Polyglot .bin files.
    *   *Acceptance Criteria:*
        *   [x] Reads file into memory or seeks correctly.
        *   [x] Handles big-endian binary format.
2.  **Accurate Key Calculation (S)**
    *   *Description:* Ensure Zobrist keys match Polyglot standard exactly.
    *   *Acceptance Criteria:*
        *   [x] Correctly handles castling rights and en-passant hashing.
        *   [x] Verified against known Polyglot positions.
3.  **Root Probe Logic (S)**
    *   *Description:* Probe the book at the start of search.
    *   *Acceptance Criteria:*
        *   [x] Returns weighted random move from book if available.
        *   [x] Supports `Book` UCI option (true/false, filename).

### Epic 15: Syzygy Tablebases
**Size:** Medium (3-5 days)
**Description:** Complete the integration of Syzygy endgame tablebases.
**User Stories:**
1.  **TB Probe Implementation (S)**
    *   *Description:* Implement the low-level probing logic (WDL).
    *   *Acceptance Criteria:*
        *   [x] Correctly maps board to TB index.
        *   [x] Decompresses data to get WDL value.
2.  **Search Integration (S)**
    *   *Description:* Query TB in search when pieces <= 6 (or configured limit).
    *   *Acceptance Criteria:*
        *   [x] Cutoff if position is known win/loss.
        *   [x] Use TB value for static evaluation.
3.  **Root Probe (S)**
    *   *Description:* Check for instant win at root.
    *   *Acceptance Criteria:*
        *   [x] Reports "Mate in X" or TB win immediately.

### Epic 16: Advanced Search Extensions
**Size:** Small (2-3 days)
**Description:** Implement specific extensions to deepen search in critical positions.
**User Stories:**
1.  **Check Extension (S)**
    *   *Description:* Extend search depth by 1 if the side to move is in check.
    *   *Acceptance Criteria:*
        *   [x] Checks are searched deeper.
        *   [x] Does not explode tree size (verified).
2.  **Singular Extension (S)**
    *   *Description:* Extend search if the TT move is significantly better than all other moves (one legal good move).
    *   *Acceptance Criteria:*
        *   [x] Identifies singular moves.
        *   [x] Extends depth for that branch.

### Epic 17: Advanced Pruning
**Size:** Small (2-3 days)
**Description:** Implement aggressive pruning techniques to reduce tree size.
**User Stories:**
1.  **Razoring (S)**
    *   *Description:* If static eval is far below alpha near leaf nodes, drop into QSearch.
    *   *Acceptance Criteria:*
        *   [x] Reduces node count.
        *   [x] Elo gain verified.
2.  **ProbCut (S)**
    *   *Description:* Use a shallow search with a rough heuristic to prune non-promising lines early.
    *   *Acceptance Criteria:*
        *   [x] Triggered in advanced stages.
        *   [x] Tunable margins.

### Epic 18: SPSA Tuner
**Size:** Medium (3-5 days)
**Description:** Implement Simultaneous Perturbation Stochastic Approximation (SPSA) for tuning.
**User Stories:**
1.  **SPSA Algorithm (S)**
    *   *Description:* Implement the core SPSA update rule.
    *   *Acceptance Criteria:*
        *   [x] Perturbs parameters randomly.
        *   [x] Updates weights based on match results (not just static error).
2.  **Match Runner Integration (S)**
    *   *Description:* Integrate with `tools/match.js` to run games for each iteration.
    *   *Acceptance Criteria:*
        *   [x] Runs fast games (ultra-bullet) to estimate gradient.
        *   [x] Converges on better weights than Texel.

### Epic 19: Time Management V2
**Size:** Small (1-2 days)
**Description:** Improve time allocation stability and overhead handling.
**User Stories:**
1.  **Move Overhead (S)**
    *   *Description:* Subtract a configurable overhead (default 50ms) from all time calculations to prevent flagging.
    *   *Acceptance Criteria:*
        *   [x] `MoveOverhead` UCI option.
        *   [x] Engine never flags in laggy environments.
2.  **Stability Detection (S)**
    *   *Description:* Stop search early if best move has been stable for X iterations and time usage > optimum.
    *   *Acceptance Criteria:*
        *   [x] Saves time in easy positions.
        *   [x] Does not stop if score is volatile.

### Epic 20: Pawn Hash Table
**Size:** Small (2-3 days)
**Description:** Implement a hash table specifically for caching expensive pawn structure evaluation scores.
**User Stories:**
1.  **Pawn Hash Implementation (S)**
    *   *Description:* Create a hash table mapping a unique pawn Zobrist key to a structure score.
    *   *Acceptance Criteria:*
        *   [x] Correctly handles collisions.
        *   [x] Persists across searches.
2.  **Integration into Evaluation (S)**
    *   *Description:* Query the table before computing isolated/backward/doubled/passed pawn scores.
    *   *Acceptance Criteria:*
        *   [x] Speedup in `Evaluation.evaluate()` (benchmarked).
        *   [x] Identical evaluation output.

### Epic 21: Internal Iterative Deepening (IID)
**Size:** Small (1-2 days)
**Description:** Enhance search accuracy in nodes where no TT move is available by running a reduced-depth search first.
**User Stories:**
1.  **IID Logic (S)**
    *   *Description:* If `depth > 3` and no TT move, run a search at `depth - 2`.
    *   *Acceptance Criteria:*
        *   [x] Triggers only when appropriate.
        *   [x] Uses the best move from the reduced search for move ordering.
2.  **Verification (S)**
    *   *Description:* Verify that IID finds better moves in complex positions.
    *   *Acceptance Criteria:*
        *   [x] Elo gain verified via SPRT.

### Epic 22: Late Move Pruning (LMP)
**Size:** Small (1-2 days)
**Description:** Prune quiet moves late in the move list at low depths to reduce branching factor.
**User Stories:**
1.  **LMP Implementation (S)**
    *   *Description:* If `depth` is small (e.g., < 4) and move count > `limit(depth)`, skip remaining quiet moves.
    *   *Acceptance Criteria:*
        *   [x] Skips moves correctly.
        *   [x] Does not prune tactical moves or checks.
2.  **Tuning Limits (S)**
    *   *Description:* Determine optimal move count limits per depth.
    *   *Acceptance Criteria:*
        *   [x] Formula derived from testing (e.g., `3 + depth * depth`).

### Epic 23: Countermove Heuristic
**Size:** Small (1-2 days)
**Description:** Improve move ordering by prioritizing moves that historically refuted the opponent's specific previous move.
**User Stories:**
1.  **Countermove Table (S)**
    *   *Description:* Maintain a table `CounterMoves[side][prevMove]` storing the best response.
    *   *Acceptance Criteria:*
        *   [x] Updates when a move causes a beta cutoff.
        *   [x] Stores valid move indices.
2.  **Ordering Logic (S)**
    *   *Description:* Give a bonus to the countermove in the move picker.
    *   *Acceptance Criteria:*
        *   [x] Countermove sorted higher than ordinary quiets.

### Epic 24: Multi-Cut Pruning (MCP)
**Size:** Small (2-3 days)
**Description:** Aggressively prune nodes where multiple moves fail high at a reduced depth.
**User Stories:**
1.  **MCP Logic (S)**
    *   *Description:* If not in PV, run a reduced depth search on first C moves. If M moves fail high, return beta.
    *   *Acceptance Criteria:*
        *   [x] Triggers correctly.
        *   [x] Returns beta early.
2.  **Parameter Tuning (S)**
    *   *Description:* Tune C (cut check count), M (required cutoffs), and R (reduction).
    *   *Acceptance Criteria:*
        *   [x] Parameters optimized for strength.

### Epic 25: Advanced King Safety
**Size:** Medium (3-5 days)
**Description:** Replace the basic King safety check with a detailed "Attacker vs. Defender" model.
**User Stories:**
1.  **King Zone Definition (S)**
    *   *Description:* Define the squares around the king + extra ring.
    *   *Acceptance Criteria:*
        *   [x] Identifies zone correctly for any king square.
2.  **Attacker Weighting (S)**
    *   *Description:* Calculate "Attack Units" based on pieces attacking the zone.
    *   *Acceptance Criteria:*
        *   [x] Different weights for Queen, Rook, Minor pieces.
        *   [x] Bonus for multiple attackers.
3.  **Safety Table Lookup (S)**
    *   *Description:* Map total attack units to a penalty score using a nonlinear curve.
    *   *Acceptance Criteria:*
        *   [x] Higher attack count = exponentially higher penalty.

### Epic 26: Contempt Factor
**Size:** Small (1 day)
**Description:** Implement a "Contempt" setting to avoid draws against weaker opponents.
**User Stories:**
1.  **Contempt Option (S)**
    *   *Description:* Add `Contempt` UCI option (centipawns).
    *   *Acceptance Criteria:*
        *   [x] Defaults to 0 or configurable.
2.  **Evaluation Adjustment (S)**
    *   *Description:* In root or evaluation, subtract contempt from drawish scores (0.00).
    *   *Acceptance Criteria:*
        *   [x] Engine avoids 3-fold repetition if score is slightly negative but > -contempt.

### Epic 27: Bench Command
**Size:** Small (1-2 days)
**Description:** Add a `bench` command to standard UCI for performance verification.
**User Stories:**
1.  **Implement Bench (S)**
    *   *Description:* Run a search on a fixed set of positions (e.g., first 50 of Nuernberg suite) to fixed depth.
    *   *Acceptance Criteria:*
        *   [x] Prints total nodes, time, and NPS.
        *   [x] Generates a checksum of nodes visited to verify consistency.
2.  **CI Integration (S)**
    *   *Description:* Allow running via command line `node engine.js bench`.
    *   *Acceptance Criteria:*
        *   [x] Useful for regression testing speed.

### Epic 28: Self-Play Data Generation
**Size:** Medium (3-5 days)
**Description:** Implement a self-play loop to generate data for tuning.
**User Stories:**
1.  **Self-Play Loop (S)**
    *   *Description:* Engine plays against itself using a specified opening book.
    *   *Acceptance Criteria:*
        *   [x] Plays legal games.
        *   [x] Handles adjudications (mate, stalemate, material draw).
2.  **Data Export (S)**
    *   *Description:* Save positions and game results to a file (EPD or PGN).
    *   *Acceptance Criteria:*
        *   [x] Format compatible with `Tuner.js`.

### Epic 29: Searchmoves Support
**Size:** Small (1 day)
**Description:** Implement the `searchmoves` parameter in the `go` command to restrict analysis.
**User Stories:**
1.  **Parse Searchmoves (S)**
    *   *Description:* Extract the list of moves from `go searchmoves ...`.
    *   *Acceptance Criteria:*
        *   [x] Parses standard UCI move strings.
2.  **Restrict Root Moves (S)**
    *   *Description:* In `Search.search()`, only consider moves in the list at the root.
    *   *Acceptance Criteria:*
        *   [x] Engine never plays a move not in the list.
        *   [x] If best move is excluded, picks the best *allowed* move.
### Epic 30: History Heuristic
**Size:** Small (2 days)
**Description:** Implement a history table to order quiet moves that fail high but are not killer moves.
**User Stories:**
1.  **History Table (S)**
    *   *Description:* Create a table indexed by `[color][piece][to_square]` (or `[from][to]`).
    *   *Acceptance Criteria:*
        *   [x] Updates score on beta cutoffs (depth squared bonus).
        *   [x] Decays scores periodically to favor recent good moves.
2.  **Ordering Integration (S)**
    *   *Description:* Use history score to sort quiet moves after killers.
    *   *Acceptance Criteria:*
        *   [x] Effective move ordering verified by node reduction.

### Epic 32: Delta Pruning
**Size:** Small (1 day)
**Description:** Implement Delta Pruning in Quiescence Search.
**User Stories:**
1.  **Delta Logic (S)**
    *   *Description:* If `stand_pat + safety_margin < alpha`, prune the node (unless checking).
    *   *Acceptance Criteria:*
        *   [x] Reduces QSearch nodes.
        *   [x] No significant tactical regressions.

### Epic 33: Lazy SMP Polish
**Size:** Medium (3 days)
**Description:** Refine the parallel search implementation for stability and scaling.
**User Stories:**
1.  **Shared TT Optimization (S)**
    *   *Description:* Ensure lockless or efficient locking TT access across threads.
    *   *Acceptance Criteria:*
        *   [x] No race conditions corrupting critical data.
2.  **Strength Scaling (S)**
    *   *Description:* Verify NPS scales linearly with threads.
    *   *Acceptance Criteria:*
        *   [ ] Elo gain with 2 vs 1 thread.

### Epic 34: Chess960 Full Support
**Size:** Small (2 days)
**Description:** Ensure 100% compliance with Chess960 castling rules and evaluation.
**User Stories:**
1.  **Castling Verification (S)**
    *   *Description:* Audit all castling paths in 960 mode.
    *   *Acceptance Criteria:*
        *   [x] Passes specialized 960 test suites (e.g. from Stockfish).
2.  **Eval Adjustments (S)**
    *   *Description:* Ensure King safety eval handles 960 King positions correctly.
    *   *Acceptance Criteria:*
        *   [x] King safety terms don't assume E1/E8 start.

### Epic 35: Principal Variation Search (PVS) Refinement
**Size:** Small (2 days)
**Description:** Audit and refine the PVS logic, specifically PV vs Non-PV node assumptions.
**User Stories:**
1.  **Node Type Rigor (S)**
    *   *Description:* Strictly enforce PV, Cut, and All node definitions.
    *   *Acceptance Criteria:*
        *   [x] Correct reductions applied only to Non-PV nodes.
2.  **Research-based Reductions (S)**
    *   *Description:* Tune LMR formula based on recent literature.
    *   *Acceptance Criteria:*
        *   [x] Improved search efficiency.

### Epic 36: Evaluation Tuning Data Pipeline
**Size:** Medium (3 days)
**Description:** Automate the end-to-end tuning process.
**User Stories:**
1.  **Pipeline Script (S)**
    *   *Description:* Script to run `SelfPlay` -> `Extract EPD` -> `Run Tuner`.
    *   *Acceptance Criteria:*
        *   [x] Single command execution.
        *   [x] Generates updated parameter file.

### Epic 37: Mobility Evaluation
**Size:** Small (2 days)
**Description:** Add piece mobility terms to the evaluation.
**User Stories:**
1.  **Bitboard Mobility (S)**
    *   *Description:* Count safe moves available for each piece using bitboards.
    *   *Acceptance Criteria:*
        *   [x] Bonus for high mobility, penalty for restricted pieces.
2.  **Tuning (S)**
    *   *Description:* Tune weights for each piece type.
    *   *Acceptance Criteria:*
        *   [x] Elo gain.

### Epic 38: Passed Pawn Extensions
**Size:** Small (1 day)
**Description:** Extend search depth when a pawn is passed and advanced (Rank 6/7).
**User Stories:**
1.  **Detection & Extension (S)**
    *   *Description:* Identify advanced passed pawns and add extensions.
    *   *Acceptance Criteria:*
        *   [x] Finds promotion tactics faster.
### Epic 40: Advanced Time Management
**Size:** Medium (4 days)
**Description:** Implement more sophisticated time management logic that adapts to the a game state (e.g., opponent's time, move number, search stability).
**User Stories:**
1.  **Game Phase Awareness (S)**
    *   *Description:* Adjust time allocation based on the current game phase (opening, middlegame, endgame).
    *   *Acceptance Criteria:*
        *   [x] Spends less time in the opening and more in complex middlegames.
        *   [x] Recognizes critical endgame positions and allocates more time.
2.  **Search Stability Factoring (M)**
    *   *Description:* Use search stability (i.e., how much the best move changes between iterations) to decide when to stop.
    *   *Acceptance Criteria:*
        *   [x] Stops search early if the best move is stable for several iterations.
        *   [x] Extends search if the evaluation or best move is unstable.
3.  **Opponent Time Tracking (S)**
    *   *Description:* Factor the opponent's remaining time into time allocation calculations.
    *   *Acceptance Criteria:*
        *   [x] Uses less time when the opponent is in severe time trouble.
        *   [x] Avoids risky lines when having a large time advantage.

### Epic 44: Opening Book Enhancements
**Size:** Medium (3 days)
**Description:** Improve the opening book functionality to support more formats, weighted move selection, and easier management.
**User Stories:**
1.  **Polyglot Book Support (M)**
    *   *Description:* Add support for the widely-used Polyglot opening book format.
    *   *Acceptance Criteria:*
        *   [x] Can load and read `.bin` Polyglot book files.
        *   [x] Correctly plays moves from the book according to the current position's hash.
2.  **Weighted Move Selection (S)**
    *   *Description:* Implement weighted random selection of moves from the opening book to increase opening variety.
    *   *Acceptance Criteria:*
        *   [x] Selects moves based on weights/probabilities defined in the book.
        *   [x] Avoids playing the same opening line deterministically.
3.  **Book Management Tool (S)**
    *   *Description:* Create a simple command-line tool to create, merge, or filter opening books from PGN files.
    *   *Acceptance Criteria:*
        *   [x] Tool can convert a PGN file into a custom opening book format.
        *   [x] Allows for basic book manipulation without external software.

### Epic 45: MultiPV Search
**Size:** Medium (3-5 days)
**Description:** Enable the engine to analyze and report multiple principal variations (best lines) simultaneously.
**User Stories:**
1.  **Iterative Root Search (S)**
    *   *Description:* Modify the root search loop to select the top `k` moves instead of just one.
    *   *Acceptance Criteria:*
        *   [x] `MultiPV` option controls the number of lines.
        *   [x] Moves found in previous PVs are excluded from subsequent searches in the same iteration.
2.  **UCI Reporting (S)**
    *   *Description:* Report standard `info multipv <id> ...` strings.
    *   *Acceptance Criteria:*
        *   [x] Output matches UCI standard.
        *   [x] GUI displays multiple lines.

### Epic 46: ProbCut Pruning
**Size:** Small (2-3 days)
**Description:** Implement Probabilistic Cut (ProbCut) to aggressively prune nodes with high static evaluations.
**User Stories:**
1.  **ProbCut Logic (S)**
    *   *Description:* Perform a shallow search with a widened window if static eval is very high/low.
    *   *Acceptance Criteria:*
        *   [x] Triggers at appropriate depths.
        *   [x] Prunes nodes successfully.
2.  **Regression Testing (S)**
    *   *Description:* Ensure no significant Elo loss or tactical blindness.
    *   *Acceptance Criteria:*
        *   [x] Passes tactical test suites.
        *   [x] Neutral or positive Elo in SPRT.

### Epic 47: Outpost Evaluation
**Size:** Small (2 days)
**Description:** Enhance evaluation by rewarding Knights and Bishops on strong outpost squares.
**User Stories:**
1.  **Identify Outposts (S)**
    *   *Description:* Detect squares supported by friendly pawns and not attackable by enemy pawns.
    *   *Acceptance Criteria:*
        *   [x] Correctly identifies outpost squares via bitboards.
2.  **Scoring Terms (S)**
    *   *Description:* Add tunable bonuses for outposts, scaled by rank (e.g., Rank 4/5/6).
    *   *Acceptance Criteria:*
        *   [x] Engine prefers placing knights on outposts.

### Epic 48: Exact Node Search (`go nodes`)
**Size:** Small (1 day)
**Description:** Support the `go nodes <x>` UCI command for precise debugging and regression testing.
**User Stories:**
1.  **UCI Parsing (S)**
    *   *Description:* Parse `nodes <x>` from the `go` command.
    *   *Acceptance Criteria:*
        *   [x] Extracts node count correctly.
2.  **Search Limits (S)**
    *   *Description:* Terminate search exactly when (or immediately after) the node count is reached.
    *   *Acceptance Criteria:*
        *   [x] Search stops close to the limit.
        *   [x] Reported nodes count is consistent.
### Epic 49: Capture History Heuristic
**Size:** Small (2 days)
**Description:** Improve move ordering for captures using a history table.
**User Stories:**
1.  **Capture History Table (S)**
    *   *Description:* Implement a history table indexed by `[piece][to_square][captured_piece]`.
    *   *Acceptance Criteria:*
        *   [x] Updates on beta cutoffs caused by captures.
2.  **Integration (S)**
    *   *Description:* Use capture history scores to sort captures (after SEE checks).
    *   *Acceptance Criteria:*
        *   [x] Reduces node count in tactical positions.

### Epic 50: Singular Extensions
**Size:** Medium (3 days)
**Description:** Extend the search depth for moves that are significantly better than all other alternatives (singular moves) to avoid missing tactical refutations.
**User Stories:**
1.  **Singular Detection (S)**
    *   *Description:* At PV nodes, perform a reduced-depth search with a modified alpha to check if other moves fail low.
    *   *Acceptance Criteria:*
        *   [x] Identifies when the TT move is "singular".
2.  **Apply Extension (S)**
    *   *Description:* Extend the search depth by 1 (or more) for confirmed singular moves.
    *   *Acceptance Criteria:*
        *   [x] Increases node count but improves Elo.

### Epic 51: Mate Distance Pruning
**Size:** Small (1 day)
**Description:** Prune branches that cannot possibly lead to a faster mate than one already found.
**User Stories:**
1.  **Pruning Logic (S)**
    *   *Description:* If the current ply plus the distance to mate exceeds the best known mate score, return the mate score immediately.
    *   *Acceptance Criteria:*
        *   [x] Prunes unnecessary branches in mating lines.
        *   [x] Finds mates slightly faster.

### Epic 52: Evaluation - Pawn Shield & Storm
**Size:** Medium (3 days)
**Description:** Implement evaluation terms for King Safety based on friendly pawn shields and enemy pawn storms.
**User Stories:**
1.  **Pawn Shield (S)**
    *   *Description:* Implement the logic to detect and score friendly pawns in front of the King (utilizing the existing `ShieldBonus` param).
    *   *Acceptance Criteria:*
        *   [x] Kings without pawn cover are penalized.
2.  **Pawn Storm (S)**
    *   *Description:* Penalize the King if enemy pawns are advancing on the King's flank.
    *   *Acceptance Criteria:*
        *   [x] Detects open/semi-open files and advancing enemy pawns.
        *   [x] Evaluates storm danger based on distance to King.

### Epic 53: Perft Optimization
**Size:** Small (2 days)
**Description:** Optimize the `perft` function to allow for faster regression testing and debugging.
**User Stories:**
1.  **Bulk Counting (S)**
    *   *Description:* At `depth=1`, simply count the generated moves instead of making/unmaking them.
    *   *Acceptance Criteria:*
        *   [x] Perft speed increases significantly.
2.  **Transposition Table (S)**
    *   *Description:* Use a dedicated TT to cache perft results for identical positions.
    *   *Acceptance Criteria:*
        *   [x] Massive speedup for high-depth perft checks.
### Epic 54: History Malus
**Size:** Small (1-2 days)
**Description:** Penalize moves that consistently fail low by reducing their history score, allowing them to be pruned later.
**User Stories:**
1.  **Negative History Update (S)**
    *   *Description:* When a move fails low (does not cause a cutoff), decrease its history score.
    *   *Acceptance Criteria:*
        *   [x] Bad moves are sorted later in future searches.
2.  **Pruning Integration (S)**
    *   *Description:* Use the negative history to support more aggressive pruning logic (e.g. History Pruning).
    *   *Acceptance Criteria:*
        *   [x] Elo gain verified.

### Epic 55: Move Validation and Legal Move Highlighting
**Size:** Medium (3-5 days)
**Description:** Implement robust move validation in the client to prevent illegal moves and visual cues to guide the user.
**User Stories:**
1.  **Legal Move Generation (M)**
    *   *Description:* Implement or integrate a lightweight JS chess library (e.g., chess.js) or query the engine to determine legal moves for the current position.
    *   *Acceptance Criteria:*
        *   [x] Users cannot make illegal moves (e.g., leaving king in check).
2.  **Highlighting (S)**
    *   *Description:* When a piece is selected, highlight all legal destination squares.
    *   *Acceptance Criteria:*
        *   [x] Clicking a piece shows dots or highlights on valid target squares.

### Epic 56: Enhanced Search Visualization
**Size:** Medium (3-5 days)
**Description:** Replace the raw text log with a visual dashboard for engine search data.
**User Stories:**
1.  **PV Line Display (S)**
    *   *Description:* Show the Principal Variation (PV) line in a clean, readable format (e.g., using piece symbols).
    *   *Acceptance Criteria:*
        *   [x] Best line is clearly visible and updates in real-time.
2.  **Search Stats (S)**
    *   *Description:* Display depth, nodes per second, and current evaluation score in dedicated statistic cards.
    *   *Acceptance Criteria:*
        *   [x] Key metrics are prominent and easy to read.

### Epic 57: Game History and Notation Panel
**Size:** Small (2 days)
**Description:** Display the game's move history in standard chess notation.
**User Stories:**
1.  **SAN Display (S)**
    *   *Description:* Record and list moves in Standard Algebraic Notation (e.g., Nf3, e5).
    *   *Acceptance Criteria:*
        *   [x] Moves are listed sequentially in a scrollable panel.
2.  **Interactive History (S)**
    *   *Description:* Allow clicking on past moves to view the board state at that point.
    *   *Acceptance Criteria:*
        *   [x] Clicking a previous move updates the board to that position (read-only view).

### Epic 58: Clock and Time Management UI
**Size:** Small (1-2 days)
**Description:** Add visible chess clocks for both players.
**User Stories:**
1.  **Clock UI (S)**
    *   *Description:* Display digital clocks for White and Black.
    *   *Acceptance Criteria:*
        *   [x] Clocks are visible near the board.
2.  **Countdown Logic (S)**
    *   *Description:* Implement countdown logic that syncs with the engine's time usage.
    *   *Acceptance Criteria:*
        *   [x] Clocks count down while the respective side is thinking.

### Epic 59: Interactive Board Customization
**Size:** Small (1-2 days)
**Description:** Allow users to personalize the board's appearance.
**User Stories:**
1.  **Theme Selection (S)**
    *   *Description:* Provide a dropdown to select different board color themes (e.g., Green, Blue, Wood).
    *   *Acceptance Criteria:*
        *   [x] Board colors change immediately upon selection.
2.  **Piece Sets (S)**
    *   *Description:* Support SVG-based piece sets alongside the Unicode default.
    *   *Acceptance Criteria:*
        *   [x] Users can toggle between Unicode and SVG pieces.

### Epic 60: PGN and FEN Import/Export
**Size:** Medium (3 days)
**Description:** Facilitate game sharing and custom position setup.
**User Stories:**
1.  **FEN Handling (S)**
    *   *Description:* Add a "Copy FEN" button and a "Paste FEN" input to set the board state.
    *   *Acceptance Criteria:*
        *   [x] Board updates correctly from a valid FEN string.
2.  **PGN Export (S)**
    *   *Description:* Add a button to download the current game as a PGN file.
    *   *Acceptance Criteria:*
        *   [x] A valid .pgn file is generated and downloaded.

### Epic 61: Engine Analysis Mode
**Size:** Medium (3 days)
**Description:** Enable continuous engine analysis without auto-playing moves.
**User Stories:**
1.  **Analysis Toggle (S)**
    *   *Description:* Add a switch to enable "Analysis Mode".
    *   *Acceptance Criteria:*
        *   [x] When enabled, the engine analyzes the current position indefinitely (`go infinite`).
2.  **Interactive Exploration (S)**
    *   *Description:* Allow the user to make moves on the board during analysis to see how the evaluation changes.
    *   *Acceptance Criteria:*
        *   [x] Making a move updates the position and restarts the analysis automatically.

### Epic 62: Sound Effects Integration
**Size:** Small (1 day)
**Description:** Add audio feedback for better game immersion.
**User Stories:**
1.  **Audio Events (S)**
    *   *Description:* Play distinct sounds for moves, captures, and checks.
    *   *Acceptance Criteria:*
        *   [x] Sounds play at appropriate times.
2.  **Mute Control (S)**
    *   *Description:* Provide a volume/mute toggle.
    *   *Acceptance Criteria:*
        *   [x] Users can disable sound effects.

### Epic 63: Responsive Layout Improvements
**Size:** Medium (3 days)
**Description:** Optimize the interface for mobile and tablet devices.
**User Stories:**
1.  **Flexible Grid (S)**
    *   *Description:* Adjust CSS Grid/Flexbox layouts to stack panels vertically on smaller screens.
    *   *Acceptance Criteria:*
        *   [x] UI is usable on a mobile width (e.g., 375px).
2.  **Touch Optimizations (S)**
    *   *Description:* Ensure piece dragging (or tap-to-move) works smoothly on touch screens.
    *   *Acceptance Criteria:*
        *   [x] Mobile users can play a game without issues.
