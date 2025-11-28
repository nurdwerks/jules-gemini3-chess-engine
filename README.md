# Jules & Gemini 3 Chess Engine

## Purpose
This repository serves as a collaborative testbed for **Jules** and **Gemini 3**. The primary objective is to verify our capabilities in complex software engineering tasks, specifically building a competitive chess engine from scratch using **Node.js**. We use this project to test our reasoning, coding, debugging, and planning skills in a real-world scenario with established rules but high algorithmic complexity.

## A Note on Benchmarking
Benchmarking functions can be written and verified, but performance-critical benchmarking should not be performed within the standard development environment or be a part of development tests.

## Active Roadmap

### Epic 49: Capture History Heuristic
**Size:** Small (2 days)
**Description:** Improve move ordering for captures using a history table.
**User Stories:**
1.  **Capture History Table (S)**
    *   *Description:* Implement a history table indexed by `[piece][to_square][captured_piece]`.
    *   *Acceptance Criteria:*
        *   [ ] Updates on beta cutoffs caused by captures.
2.  **Integration (S)**
    *   *Description:* Use capture history scores to sort captures (after SEE checks).
    *   *Acceptance Criteria:*
        *   [ ] Reduces node count in tactical positions.

### Epic 50: Singular Extensions
**Size:** Medium (3 days)
**Description:** Extend the search depth for moves that are significantly better than all other alternatives (singular moves) to avoid missing tactical refutations.
**User Stories:**
1.  **Singular Detection (S)**
    *   *Description:* At PV nodes, perform a reduced-depth search with a modified alpha to check if other moves fail low.
    *   *Acceptance Criteria:*
        *   [ ] Identifies when the TT move is "singular".
2.  **Apply Extension (S)**
    *   *Description:* Extend the search depth by 1 (or more) for confirmed singular moves.
    *   *Acceptance Criteria:*
        *   [ ] Increases node count but improves Elo.

### Epic 51: Mate Distance Pruning
**Size:** Small (1 day)
**Description:** Prune branches that cannot possibly lead to a faster mate than one already found.
**User Stories:**
1.  **Pruning Logic (S)**
    *   *Description:* If the current ply plus the distance to mate exceeds the best known mate score, return the mate score immediately.
    *   *Acceptance Criteria:*
        *   [ ] Prunes unnecessary branches in mating lines.
        *   [ ] Finds mates slightly faster.

### Epic 52: Evaluation - Pawn Shield & Storm
**Size:** Medium (3 days)
**Description:** Implement evaluation terms for King Safety based on friendly pawn shields and enemy pawn storms.
**User Stories:**
1.  **Pawn Shield (S)**
    *   *Description:* Implement the logic to detect and score friendly pawns in front of the King (utilizing the existing `ShieldBonus` param).
    *   *Acceptance Criteria:*
        *   [ ] Kings without pawn cover are penalized.
2.  **Pawn Storm (S)**
    *   *Description:* Penalize the King if enemy pawns are advancing on the King's flank.
    *   *Acceptance Criteria:*
        *   [ ] Detects open/semi-open files and advancing enemy pawns.
        *   [ ] Evaluates storm danger based on distance to King.

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
