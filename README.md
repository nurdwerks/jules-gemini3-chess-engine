# Jules & Gemini 3 Chess Engine

## Purpose
This repository serves as a collaborative testbed for **Jules** and **Gemini 3**. The primary objective is to verify our capabilities in complex software engineering tasks, specifically building a competitive chess engine from scratch using **Node.js**. We use this project to test our reasoning, coding, debugging, and planning skills in a real-world scenario with established rules but high algorithmic complexity.

## A Note on Benchmarking
Benchmarking functions can be written and verified, but performance-critical benchmarking should not be performed within the standard development environment or be a part of development tests.

## Active Roadmap (Epics)

The following enhancements outline the next phase of development, focusing on competitive strength, optimization, and advanced features.

### Epic 31: NNUE Integration (Revisit Epic 10)
**Size:** Large (2 weeks)
**Description:** Implement Efficiently Updatable Neural Network (NNUE) evaluation.
**User Stories:**
1.  **Architecture Support (M)**
    *   *Description:* Support standard HalfKP-256x2-32-32 architecture.
    *   *Acceptance Criteria:*
        *   [ ] Loads binary network file.
        *   [ ] Computes correct accumulation.
2.  **Search Integration (M)**
    *   *Description:* Replace/Hybridize HCE with NNUE score.
    *   *Acceptance Criteria:*
        *   [ ] The implementation is expected to yield a significant Elo gain.

### Epic 38: Passed Pawn Extensions
**Size:** Small (1 day)
**Description:** Extend search depth when a pawn is passed and advanced (Rank 6/7).
**User Stories:**
1.  **Detection & Extension (S)**
    *   *Description:* Identify advanced passed pawns and add extensions.
    *   *Acceptance Criteria:*
        *   [ ] Finds promotion tactics faster.

### Epic 39: Code Cleanup & Strict Typing
**Size:** Large (1 week)
**Description:** Refactor codebase for maintainability and type safety (preparation for TypeScript migration or JSDoc enforcement).
**User Stories:**
1.  **Remove 0x88 Legacy (M)**
    *   *Description:* Completely remove 0x88 arrays if bitboards are fully stable.
    *   *Acceptance Criteria:*
        *   [ ] Pure bitboard architecture.
2.  **JSDoc Coverage (M)**
    *   *Description:* Add detailed JSDoc for all core classes and methods.
    *   *Acceptance Criteria:*
        *   [ ] 100% documentation coverage.

## Archived Roadmap (Completed or Superseded)

See [archive/ARCHIVED_EPICS.md](archive/ARCHIVED_EPICS.md) for Epics 1-34.

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

### Epic 40: Advanced Time Management
**Size:** Medium (4 days)
**Description:** Implement more sophisticated time management logic that adapts to the game state (e.g., opponent's time, move number, search stability).
**User Stories:**
1.  **Game Phase Awareness (S)**
    *   *Description:* Adjust time allocation based on the current game phase (opening, middlegame, endgame).
    *   *Acceptance Criteria:*
        *   [ ] Spends less time in the opening and more in complex middlegames.
        *   [ ] Recognizes critical endgame positions and allocates more time.
2.  **Search Stability Factoring (M)**
    *   *Description:* Use search stability (i.e., how much the best move changes between iterations) to decide when to stop.
    *   *Acceptance Criteria:*
        *   [ ] Stops search early if the best move is stable for several iterations.
        *   [ ] Extends search if the evaluation or best move is unstable.
3.  **Opponent Time Tracking (S)**
    *   *Description:* Factor the opponent's remaining time into time allocation calculations.
    *   *Acceptance Criteria:*
        *   [ ] Uses less time when the opponent is in severe time trouble.
        *   [ ] Avoids risky lines when having a large time advantage.

### Epic 41: Syzygy Endgame Tablebase Integration
**Size:** Medium (3 days)
**Description:** Fully integrate 7-piece Syzygy endgame tablebases to provide perfect play in endgame positions.
**User Stories:**
1.  **Tablebase Probing (M)**
    *   *Description:* Implement probing for both Win-Draw-Loss (WDL) and Distance-to-Zero (DTZ) information.
    *   *Acceptance Criteria:*
        *   [ ] Correctly identifies winning, drawing, and losing positions from the tablebases.
        *   [ ] Retrieves the optimal move and distance to mate/conversion.
2.  **Search Integration (M)**
    *   *Description:* Integrate tablebase results into the search algorithm to override static evaluation and guide the search.
    *   *Acceptance Criteria:*
        *   [ ] Search immediately terminates and returns the tablebase result when a position is found.
        *   [ ] Principal Variation is populated with the optimal line from the tablebase.
        *   [ ] Mates are reported with perfect accuracy.

### Epic 42: Advanced Search Extensions
**Size:** Medium (4 days)
**Description:** Implement several targeted search extensions to handle specific tactical and strategic situations more effectively.
**User Stories:**
1.  **Singular Reply Extension (M)**
    *   *Description:* If a move has only one legal reply, extend the search to see the opponent's forced response.
    *   *Acceptance Criteria:*
        *   [ ] Detects forced replies and extends the search by one ply.
        *   [ ] Improves tactical calculation in forcing sequences.
2.  **Recapture Extension (S)**
    *   *Description:* Extend the search when a capture is immediately recaptured on the same square.
    *   *Acceptance Criteria:*
        *   [ ] Identifies recapture sequences and extends the search.
        *   [ ] Prevents the horizon effect in simple exchanges.
3.  **Check Extension Refinement (S)**
    *   *Description:* Refine check extensions to be more selective, avoiding extensions on trivial or perpetual checks.
    *   *Acceptance Criteria:*
        *   [ ] Reduces search explosion in positions with many useless checks.
        *   [ ] Maintains or improves tactical strength.

### Epic 43: Test Suite and Benchmarking Expansion
**Size:** Large (1 week)
**Description:** Expand the automated testing and benchmarking suite to ensure correctness and measure performance regressions/improvements systematically.
**User Stories:**
1.  **Strategic Test Suite (M)**
    *   *Description:* Create a new test suite with positions that evaluate strategic understanding (e.g., pawn structures, outposts, king safety).
    *   *Acceptance Criteria:*
        *   [ ] Engine selects the correct strategic move in a variety of test cases.
        *   [ ] Provides a baseline for evaluating changes to the evaluation function.
2.  **Perft Optimization (S)**
    *   *Description:* Optimize the `perft` function for maximum speed to allow for deeper correctness checks.
    *   *Acceptance Criteria:*
        *   [ ] Perft runs significantly faster (e.g., >50% improvement).
        *   [ ] Allows for running higher-depth perft tests in the CI pipeline.

### Epic 44: Opening Book Enhancements
**Size:** Medium (3 days)
**Description:** Improve the opening book functionality to support more formats, weighted move selection, and easier management.
**User Stories:**
1.  **Polyglot Book Support (M)**
    *   *Description:* Add support for the widely-used Polyglot opening book format.
    *   *Acceptance Criteria:*
        *   [ ] Can load and read `.bin` Polyglot book files.
        *   [ ] Correctly plays moves from the book according to the current position's hash.
2.  **Weighted Move Selection (S)**
    *   *Description:* Implement weighted random selection of moves from the opening book to increase opening variety.
    *   *Acceptance Criteria:*
        *   [ ] Selects moves based on weights/probabilities defined in the book.
        *   [ ] Avoids playing the same opening line deterministically.
3.  **Book Management Tool (S)**
    *   *Description:* Create a simple command-line tool to create, merge, or filter opening books from PGN files.
    *   *Acceptance Criteria:*
        *   [ ] Tool can convert a PGN file into a custom opening book format.
        *   [ ] Allows for basic book manipulation without external software.
