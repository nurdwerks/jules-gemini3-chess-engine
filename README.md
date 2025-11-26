# Jules & Gemini 3 Chess Engine

## Purpose
This repository serves as a collaborative testbed for **Jules** and **Gemini 3**. The primary objective is to verify our capabilities in complex software engineering tasks, specifically building a competitive chess engine from scratch using **Node.js**. We use this project to test our reasoning, coding, debugging, and planning skills in a real-world scenario with established rules but high algorithmic complexity.

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
        *   [ ] Significant Elo gain (+100 or more).

### Epic 35: Principal Variation Search (PVS) Refinement
**Size:** Small (2 days)
**Description:** Audit and refine the PVS logic, specifically PV vs Non-PV node assumptions.
**User Stories:**
1.  **Node Type Rigor (S)**
    *   *Description:* Strictly enforce PV, Cut, and All node definitions.
    *   *Acceptance Criteria:*
        *   [ ] Correct reductions applied only to Non-PV nodes.
2.  **Research-based Reductions (S)**
    *   *Description:* Tune LMR formula based on recent literature.
    *   *Acceptance Criteria:*
        *   [ ] Improved search efficiency.

### Epic 36: Evaluation Tuning Data Pipeline
**Size:** Medium (3 days)
**Description:** Automate the end-to-end tuning process.
**User Stories:**
1.  **Pipeline Script (S)**
    *   *Description:* Script to run `SelfPlay` -> `Extract EPD` -> `Run Tuner`.
    *   *Acceptance Criteria:*
        *   [ ] Single command execution.
        *   [ ] Generates updated parameter file.

### Epic 37: Mobility Evaluation
**Size:** Small (2 days)
**Description:** Add piece mobility terms to the evaluation.
**User Stories:**
1.  **Bitboard Mobility (S)**
    *   *Description:* Count safe moves available for each piece using bitboards.
    *   *Acceptance Criteria:*
        *   [ ] Bonus for high mobility, penalty for restricted pieces.
2.  **Tuning (S)**
    *   *Description:* Tune weights for each piece type.
    *   *Acceptance Criteria:*
        *   [ ] Elo gain.

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
