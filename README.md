# Jules & Gemini 3 Chess Engine

## Purpose
This repository serves as a collaborative testbed for **Jules** and **Gemini 3**. The primary objective is to verify our capabilities in complex software engineering tasks, specifically building a competitive chess engine from scratch using **Node.js**. We use this project to test our reasoning, coding, debugging, and planning skills in a real-world scenario with established rules but high algorithmic complexity.

## Enhancements (Epics)

The following enhancements outline the roadmap for elevating the engine from a basic UCI engine to a competitive, modern chess engine.

### Epic 1: Neural Network Evaluation (NNUE)
**Size:** Large (1-2 weeks)
**Description:** Replace the current Hand-Crafted Evaluation (HCE) with an Efficiently Updatable Neural Network (NNUE). This is the standard for modern chess engines and provides significantly higher playing strength by capturing subtle positional features.
**User Stories:**
1.  **Load NNUE Architecture & Weights (S)**
    *   Create a loader for standard NNUE architecture files (e.g., halfkp_256x2-32-32).
    *   Verify weights are loaded correctly into memory.
2.  **Implement Incremental Accumulator (M)**
    *   Implement the "HalfKP" feature transformer.
    *   Update the accumulator incrementally during `makeMove` and `unmakeMove` to avoid full re-computation (essential for performance).
3.  **Implement Forward Pass / Inference (M)**
    *   Implement the clipped ReLU activation and affine transformations for the remaining layers.
    *   Produce a final score output.
4.  **Integrate NNUE into Evaluation (S)**
    *   Switch the engine to use the NNUE score in the `Evaluation.evaluate()` function.
    *   Add a UCI option to toggle between `HCE` and `NNUE`.
5.  **SIMD Optimization (Optional/Follow-up) (M)**
    *   Use Node.js/V8 intrinsics or WASM to optimize the integer operations in the forward pass.

### Epic 2: Search Sophistication
**Size:** Medium (3-5 days)
**Description:** Implement advanced search pruning and reduction techniques to reduce the branching factor, allowing the engine to search deeper.
**User Stories:**
1.  **Implement Static Exchange Evaluation (SEE) (M)**
    *   Create a function to determine if a capture sequence is profitable (or equal) on a given square.
    *   Use SEE to prune bad captures in Quiescence Search.
2.  **Null Move Pruning (S)**
    *   Allow the engine to pass the move; if the position is still too good for the opponent, assume the position is strong and cut off.
    *   Handle edge cases (Zugzwang risk).
3.  **Late Move Reduction (LMR) (S)**
    *   Reduce the search depth for quiet moves that are ordered late in the list (assuming they are less likely to be best).
    *   Re-search with full depth if the reduced search yields a good score.
4.  **Futility & Late Move Pruning (S)**
    *   Prune moves near the leaf nodes if the static evaluation plus a margin is well below alpha.
    *   Skip quiet moves late in the list at low depths.

### Epic 3: Parallel Search (Lazy SMP)
**Size:** Medium (3-5 days)
**Description:** Utilize multi-core processors to speed up the search. "Lazy SMP" is a technique where helper threads search the same position with slight randomization, populating the shared Transposition Table.
**User Stories:**
1.  **Shared Memory Transposition Table (M)**
    *   Refactor `TranspositionTable` to use `SharedArrayBuffer`.
    *   Ensure atomic operations or lockless logic for writing/reading entries to prevent data corruption.
2.  **Worker Thread Infrastructure (M)**
    *   Implement a `WorkerManager` to spawn and manage Node.js worker threads.
    *   Synchronize board state and UCI commands across workers.
3.  **Implement Lazy SMP Logic (S)**
    *   Configure helper threads to run `search` on the same root position.
    *   Collect the best move from the main thread or whichever thread finishes first/best.

### Epic 4: Endgame Tablebases (Syzygy)
**Size:** Medium (3-5 days)
**Description:** Integrate Syzygy tablebases (WDL and DTZ) to allow the engine to play perfectly in 3, 4, 5, and potentially 6-piece endgames.
**User Stories:**
1.  **Syzygy Probing Interface (M)**
    *   Implement or integrate a library to read `.rtbw` (WDL) and `.rtbz` (DTZ) files.
    *   Create a `SyzygyProbe` class to query the tablebase for a given FEN/Board state.
2.  **Root Probe Logic (S)**
    *   Check tablebases at the root of the search.
    *   If a winning line is found, play it immediately without search.
3.  **Search Tree Integration (S)**
    *   Probe WDL tablebases inside the search tree (when pieces <= 6).
    *   Adjust evaluation score to "Known Win" or "Known Draw" based on tablebase return.

### Epic 5: UCI Protocol Completeness
**Size:** Small (1-2 days)
**Description:** Ensure full compliance with the UCI standard and provide user customization.
**User Stories:**
1.  **Option Reporting (S)**
    *   Send `option name ...` commands upon receiving `uci`.
    *   Support standard options: `Hash`, `Threads`, `Ponder`, `MultiPV`.
2.  **Dynamic Configuration (S)**
    *   Ensure `setoption` correctly updates the engine state (e.g., resizing the Hash table clears it and allocates new memory).
3.  **Pondering Support (S)**
    *   Implement "Ponder" logic (thinking on opponent's time).
    *   Handle `ponderhit` command to switch from ponder to normal search.

## Review of Sized Items

**Medium (M) & Large (L) Items:**

*   **Epic 1 (NNUE) - Large:** This is a significant undertaking. We have broken it down into Stories 1.1 (Load), 1.2 (Accumulator), and 1.3 (Inference). The "Incremental Accumulator" (M) and "Inference" (M) are complex because they require precise math (often needing 16-bit integer SIMD simulation in JS) and rigorous testing against golden values.
*   **Epic 2, Story 1 (SEE) - Medium:** SEE is a recursive algorithm that simulates exchanges on a square. It can be tricky to get right with all piece types, especially X-rays and pins.
*   **Epic 3 (Parallel Search) - Medium:** Concurrency in Node.js (Workers + SharedArrayBuffer) introduces complexity around race conditions and memory safety, which is inherently harder than single-threaded logic.
*   **Epic 4 (Syzygy) - Medium:** The file format for Syzygy is complex (Huffman compression, specific indexing). Implementing a parser from scratch is Large; integrating an existing C++ library via WASM or finding a JS implementation makes it Medium.

All "Medium" stories represent core algorithmic additions that cannot easily be split further without making them non-functional. They are appropriate in size for a focused sprint.
