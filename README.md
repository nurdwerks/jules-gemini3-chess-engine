# Jules & Gemini 3 Chess Engine

## Purpose
This repository serves as a collaborative testbed for **Jules** and **Gemini 3**. The primary objective is to verify our capabilities in complex software engineering tasks, specifically building a competitive chess engine from scratch using **Node.js**. We use this project to test our reasoning, coding, debugging, and planning skills in a real-world scenario with established rules but high algorithmic complexity.

## Active Roadmap (Epics)

The following enhancements outline the next phase of development, focusing on competitive strength, optimization, and advanced features.

### Epic 13: Magic Bitboards & Move Gen V2
**Size:** Medium (3-5 days)
**Description:** Migrate the move generation from 0x88 array-based to fully bitboard-based for performance.
**User Stories:**
1.  **Magic Bitboard Generation (S)**
    *   *Description:* Implement generation/loading of magic numbers for sliding pieces.
    *   *Acceptance Criteria:*
        *   [ ] Generates valid magic numbers.
        *   [ ] Lookup table size is optimized.
2.  **Implement Slider Attacks (S)**
    *   *Description:* Implement `getRookAttacks` and `getBishopAttacks` using magics.
    *   *Acceptance Criteria:*
        *   [ ] Returns correct bitmask for any occupancy.
        *   [ ] Performance is significantly faster than ray-casting.
3.  **Refactor Board to Bitboards (S)**
    *   *Description:* Update `Board` class to maintain bitboards for all pieces (in parallel or replacement).
    *   *Acceptance Criteria:*
        *   [ ] `this.bitboards` maintained incrementally.
        *   [ ] `applyMove` updates bitboards.
4.  **Bitboard Move Generation (S)**
    *   *Description:* Rewrite `generateMoves` to use bitwise operations.
    *   *Acceptance Criteria:*
        *   [ ] Matches perft results of 0x88 generator.
        *   [ ] Is measurably faster (benchmarked).

### Epic 14: Polyglot Opening Book
**Size:** Small (2-3 days)
**Description:** Fully integrate Polyglot opening book support.
**User Stories:**
1.  **Load .bin Files (S)**
    *   *Description:* Implement `loadBook` to read standard Polyglot .bin files.
    *   *Acceptance Criteria:*
        *   [ ] Reads file into memory or seeks correctly.
        *   [ ] Handles big-endian binary format.
2.  **Accurate Key Calculation (S)**
    *   *Description:* Ensure Zobrist keys match Polyglot standard exactly.
    *   *Acceptance Criteria:*
        *   [ ] Correctly handles castling rights and en-passant hashing.
        *   [ ] Verified against known Polyglot positions.
3.  **Root Probe Logic (S)**
    *   *Description:* Probe the book at the start of search.
    *   *Acceptance Criteria:*
        *   [ ] Returns weighted random move from book if available.
        *   [ ] Supports `Book` UCI option (true/false, filename).

### Epic 15: Syzygy Tablebases
**Size:** Medium (3-5 days)
**Description:** Complete the integration of Syzygy endgame tablebases.
**User Stories:**
1.  **TB Probe Implementation (S)**
    *   *Description:* Implement the low-level probing logic (WDL).
    *   *Acceptance Criteria:*
        *   [ ] Correctly maps board to TB index.
        *   [ ] Decompresses data to get WDL value.
2.  **Search Integration (S)**
    *   *Description:* Query TB in search when pieces <= 6 (or configured limit).
    *   *Acceptance Criteria:*
        *   [ ] Cutoff if position is known win/loss.
        *   [ ] Use TB value for static evaluation.
3.  **Root Probe (S)**
    *   *Description:* Check for instant win at root.
    *   *Acceptance Criteria:*
        *   [ ] Reports "Mate in X" or TB win immediately.

### Epic 16: Advanced Search Extensions
**Size:** Small (2-3 days)
**Description:** Implement specific extensions to deepen search in critical positions.
**User Stories:**
1.  **Check Extension (S)**
    *   *Description:* Extend search depth by 1 if the side to move is in check.
    *   *Acceptance Criteria:*
        *   [ ] Checks are searched deeper.
        *   [ ] Does not explode tree size (verified).
2.  **Singular Extension (S)**
    *   *Description:* Extend search if the TT move is significantly better than all other moves (one legal good move).
    *   *Acceptance Criteria:*
        *   [ ] Identifies singular moves.
        *   [ ] Extends depth for that branch.

### Epic 17: Advanced Pruning
**Size:** Small (2-3 days)
**Description:** Implement aggressive pruning techniques to reduce tree size.
**User Stories:**
1.  **Razoring (S)**
    *   *Description:* If static eval is far below alpha near leaf nodes, drop into QSearch.
    *   *Acceptance Criteria:*
        *   [ ] Reduces node count.
        *   [ ] Elo gain verified.
2.  **ProbCut (S)**
    *   *Description:* Use a shallow search with a rough heuristic to prune non-promising lines early.
    *   *Acceptance Criteria:*
        *   [ ] Triggered in advanced stages.
        *   [ ] Tunable margins.

### Epic 18: SPSA Tuner
**Size:** Medium (3-5 days)
**Description:** Implement Simultaneous Perturbation Stochastic Approximation (SPSA) for tuning.
**User Stories:**
1.  **SPSA Algorithm (S)**
    *   *Description:* Implement the core SPSA update rule.
    *   *Acceptance Criteria:*
        *   [ ] Perturbs parameters randomly.
        *   [ ] Updates weights based on match results (not just static error).
2.  **Match Runner Integration (S)**
    *   *Description:* Integrate with `tools/match.js` to run games for each iteration.
    *   *Acceptance Criteria:*
        *   [ ] Runs fast games (ultra-bullet) to estimate gradient.
        *   [ ] Converges on better weights than Texel.

### Epic 19: Time Management V2
**Size:** Small (1-2 days)
**Description:** Improve time allocation stability and overhead handling.
**User Stories:**
1.  **Move Overhead (S)**
    *   *Description:* Subtract a configurable overhead (default 50ms) from all time calculations to prevent flagging.
    *   *Acceptance Criteria:*
        *   [ ] `MoveOverhead` UCI option.
        *   [ ] Engine never flags in laggy environments.
2.  **Stability Detection (S)**
    *   *Description:* Stop search early if best move has been stable for X iterations and time usage > optimum.
    *   *Acceptance Criteria:*
        *   [ ] Saves time in easy positions.
        *   [ ] Does not stop if score is volatile.

### Epic 20: Pawn Hash Table
**Size:** Small (2-3 days)
**Description:** Implement a hash table specifically for caching expensive pawn structure evaluation scores.
**User Stories:**
1.  **Pawn Hash Implementation (S)**
    *   *Description:* Create a hash table mapping a unique pawn Zobrist key to a structure score.
    *   *Acceptance Criteria:*
        *   [ ] Correctly handles collisions.
        *   [ ] Persists across searches.
2.  **Integration into Evaluation (S)**
    *   *Description:* Query the table before computing isolated/backward/doubled/passed pawn scores.
    *   *Acceptance Criteria:*
        *   [ ] Speedup in `Evaluation.evaluate()` (benchmarked).
        *   [ ] Identical evaluation output.

### Epic 21: Internal Iterative Deepening (IID)
**Size:** Small (1-2 days)
**Description:** Enhance search accuracy in nodes where no TT move is available by running a reduced-depth search first.
**User Stories:**
1.  **IID Logic (S)**
    *   *Description:* If `depth > 3` and no TT move, run a search at `depth - 2`.
    *   *Acceptance Criteria:*
        *   [ ] Triggers only when appropriate.
        *   [ ] Uses the best move from the reduced search for move ordering.
2.  **Verification (S)**
    *   *Description:* Verify that IID finds better moves in complex positions.
    *   *Acceptance Criteria:*
        *   [ ] Elo gain verified via SPRT.

### Epic 22: Late Move Pruning (LMP)
**Size:** Small (1-2 days)
**Description:** Prune quiet moves late in the move list at low depths to reduce branching factor.
**User Stories:**
1.  **LMP Implementation (S)**
    *   *Description:* If `depth` is small (e.g., < 4) and move count > `limit(depth)`, skip remaining quiet moves.
    *   *Acceptance Criteria:*
        *   [ ] Skips moves correctly.
        *   [ ] Does not prune tactical moves or checks.
2.  **Tuning Limits (S)**
    *   *Description:* Determine optimal move count limits per depth.
    *   *Acceptance Criteria:*
        *   [ ] Formula derived from testing (e.g., `3 + depth * depth`).

### Epic 23: Countermove Heuristic
**Size:** Small (1-2 days)
**Description:** Improve move ordering by prioritizing moves that historically refuted the opponent's specific previous move.
**User Stories:**
1.  **Countermove Table (S)**
    *   *Description:* Maintain a table `CounterMoves[side][prevMove]` storing the best response.
    *   *Acceptance Criteria:*
        *   [ ] Updates when a move causes a beta cutoff.
        *   [ ] Stores valid move indices.
2.  **Ordering Logic (S)**
    *   *Description:* Give a bonus to the countermove in the move picker.
    *   *Acceptance Criteria:*
        *   [ ] Countermove sorted higher than ordinary quiets.

### Epic 24: Multi-Cut Pruning (MCP)
**Size:** Small (2-3 days)
**Description:** Aggressively prune nodes where multiple moves fail high at a reduced depth.
**User Stories:**
1.  **MCP Logic (S)**
    *   *Description:* If not in PV, run a reduced depth search on first C moves. If M moves fail high, return beta.
    *   *Acceptance Criteria:*
        *   [ ] Triggers correctly.
        *   [ ] Returns beta early.
2.  **Parameter Tuning (S)**
    *   *Description:* Tune C (cut check count), M (required cutoffs), and R (reduction).
    *   *Acceptance Criteria:*
        *   [ ] Parameters optimized for strength.

### Epic 25: Advanced King Safety
**Size:** Medium (3-5 days)
**Description:** Replace the basic King safety check with a detailed "Attacker vs. Defender" model.
**User Stories:**
1.  **King Zone Definition (S)**
    *   *Description:* Define the squares around the king + extra ring.
    *   *Acceptance Criteria:*
        *   [ ] Identifies zone correctly for any king square.
2.  **Attacker Weighting (S)**
    *   *Description:* Calculate "Attack Units" based on pieces attacking the zone.
    *   *Acceptance Criteria:*
        *   [ ] Different weights for Queen, Rook, Minor pieces.
        *   [ ] Bonus for multiple attackers.
3.  **Safety Table Lookup (S)**
    *   *Description:* Map total attack units to a penalty score using a nonlinear curve.
    *   *Acceptance Criteria:*
        *   [ ] Higher attack count = exponentially higher penalty.

### Epic 26: Contempt Factor
**Size:** Small (1 day)
**Description:** Implement a "Contempt" setting to avoid draws against weaker opponents.
**User Stories:**
1.  **Contempt Option (S)**
    *   *Description:* Add `Contempt` UCI option (centipawns).
    *   *Acceptance Criteria:*
        *   [ ] Defaults to 0 or configurable.
2.  **Evaluation Adjustment (S)**
    *   *Description:* In root or evaluation, subtract contempt from drawish scores (0.00).
    *   *Acceptance Criteria:*
        *   [ ] Engine avoids 3-fold repetition if score is slightly negative but > -contempt.

### Epic 27: Bench Command
**Size:** Small (1-2 days)
**Description:** Add a `bench` command to standard UCI for performance verification.
**User Stories:**
1.  **Implement Bench (S)**
    *   *Description:* Run a search on a fixed set of positions (e.g., first 50 of Nuernberg suite) to fixed depth.
    *   *Acceptance Criteria:*
        *   [ ] Prints total nodes, time, and NPS.
        *   [ ] Generates a checksum of nodes visited to verify consistency.
2.  **CI Integration (S)**
    *   *Description:* Allow running via command line `node engine.js bench`.
    *   *Acceptance Criteria:*
        *   [ ] Useful for regression testing speed.

### Epic 28: Self-Play Data Generation
**Size:** Medium (3-5 days)
**Description:** Implement a self-play loop to generate data for tuning.
**User Stories:**
1.  **Self-Play Loop (S)**
    *   *Description:* Engine plays against itself using a specified opening book.
    *   *Acceptance Criteria:*
        *   [ ] Plays legal games.
        *   [ ] Handles adjudications (mate, stalemate, material draw).
2.  **Data Export (S)**
    *   *Description:* Save positions and game results to a file (EPD or PGN).
    *   *Acceptance Criteria:*
        *   [ ] Format compatible with `Tuner.js`.

### Epic 29: Searchmoves Support
**Size:** Small (1 day)
**Description:** Implement the `searchmoves` parameter in the `go` command to restrict analysis.
**User Stories:**
1.  **Parse Searchmoves (S)**
    *   *Description:* Extract the list of moves from `go searchmoves ...`.
    *   *Acceptance Criteria:*
        *   [ ] Parses standard UCI move strings.
2.  **Restrict Root Moves (S)**
    *   *Description:* In `Search.search()`, only consider moves in the list at the root.
    *   *Acceptance Criteria:*
        *   [ ] Engine never plays a move not in the list.
        *   [ ] If best move is excluded, picks the best *allowed* move.

## Archived Roadmap (Completed or Superseded)

See [archive/ARCHIVED_EPICS.md](archive/ARCHIVED_EPICS.md) for Epics 1-12.

## Deferred / Won't Implement

### Epic 10: Neural Network Evaluation (NNUE) (Not to be implemented)
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
