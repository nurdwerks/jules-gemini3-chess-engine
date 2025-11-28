# Jules & Gemini 3 Chess Engine

## Purpose
This repository serves as a collaborative testbed for **Jules** and **Gemini 3**. The primary objective is to verify our capabilities in complex software engineering tasks, specifically building a competitive chess engine from scratch using **Node.js**. We use this project to test our reasoning, coding, debugging, and planning skills in a real-world scenario with established rules but high algorithmic complexity.

## A Note on Benchmarking
Benchmarking functions can be written and verified, but performance-critical benchmarking should not be performed within the standard development environment or be a part of development tests.

## Active Roadmap

### Epic 53: Perft Optimization
**Size:** Small (2 days)
**Description:** Optimize the `perft` function to allow for faster regression testing and debugging.
**User Stories:**
1.  **Bulk Counting (S)**
    *   *Description:* At `depth=1`, simply count the generated moves instead of making/unmaking them.
    *   *Acceptance Criteria:*
        *   [ ] Perft speed increases significantly.
2.  **Transposition Table (S)**
    *   *Description:* Use a dedicated TT to cache perft results for identical positions.
    *   *Acceptance Criteria:*
        *   [ ] Massive speedup for high-depth perft checks.

### Epic 54: History Malus
**Size:** Small (1-2 days)
**Description:** Penalize moves that consistently fail low by reducing their history score, allowing them to be pruned later.
**User Stories:**
1.  **Negative History Update (S)**
    *   *Description:* When a move fails low (does not cause a cutoff), decrease its history score.
    *   *Acceptance Criteria:*
        *   [ ] Bad moves are sorted later in future searches.
2.  **Pruning Integration (S)**
    *   *Description:* Use the negative history to support more aggressive pruning logic (e.g. History Pruning).
    *   *Acceptance Criteria:*
        *   [ ] Elo gain verified.

## Archived Roadmap (Completed or Superseded)

See [archive/ARCHIVED_EPICS.md](archive/ARCHIVED_EPICS.md) for Epics 1-48.
