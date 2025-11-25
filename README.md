# Jules & Gemini 3 Chess Engine

## Purpose
This repository serves as a collaborative testbed for **Jules** and **Gemini 3**. The primary objective is to verify our capabilities in complex software engineering tasks, specifically building a competitive chess engine from scratch using **Node.js**. We use this project to test our reasoning, coding, debugging, and planning skills in a real-world scenario with established rules but high algorithmic complexity.

## Active Roadmap (Epics)

The following enhancements outline the next phase of development, focusing on competitive strength, optimization, and advanced features.

### Epic 11: Aspiration Windows
**Size:** Small (2-3 days)
**Description:** Improve search efficiency by searching with a narrow window around the previous best score.
**User Stories:**
1.  **Implement Window Logic (S)**
    *   *Description:* In the root search loop, start with alpha = prevScore - window, beta = prevScore + window.
    *   *Acceptance Criteria:*
        *   [ ] Search uses narrow window.
        *   [ ] Window size (e.g., 50cp) is configurable.
2.  **Handle Fail-Low/Fail-High (S)**
    *   *Description:* If search returns <= alpha or >= beta, re-search with wider window.
    *   *Acceptance Criteria:*
        *   [ ] Re-searches correctly with open window (-Inf, Inf) or exponentially growing window.
        *   [ ] Correct score returned ultimately.

### Epic 12: Static Exchange Evaluation (SEE) Integration
**Size:** Small (2-3 days)
**Description:** Integrate the existing SEE logic into the search for better move ordering and pruning.
**User Stories:**
1.  **SEE Move Ordering (S)**
    *   *Description:* Use SEE to order captures (winning captures first, losing captures last).
    *   *Acceptance Criteria:*
        *   [ ] Captures with negative SEE score are ordered after quiet moves.
        *   [ ] Captures with positive SEE score are ordered by MVV-LVA.
2.  **SEE Pruning in QSearch (S)**
    *   *Description:* Prune captures in Quiescence Search if SEE < 0.
    *   *Acceptance Criteria:*
        *   [ ] Does not search losing captures in QSearch.
        *   [ ] Does not introduce significant tactical blunders (SPRT verified).

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

## Archived Roadmap (Completed or Superseded)

See [archive/ARCHIVED_EPICS.md](archive/ARCHIVED_EPICS.md) for Epics 1-9.

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
