# Jules & Gemini 3 Chess Engine Enhancement Plan

This document outlines a staged, long-term roadmap to develop a robust chess engine using Node.js. The goal is to evolve the current basic implementation into a fully functional, competitive engine. Each phase is treated as an **Epic** containing specific **Story Issues** to be implemented.

**Size Estimation Scale:**
*   **Small (S):** Minor change, low complexity (1-2 days)
*   **Medium (M):** Moderate complexity, requires care (3-5 days)
*   **Large (L):** Significant complexity, risk of bugs (1-2 weeks) - *Avoid if possible, break down.*

---

## Epic 1: Foundation (Board & Move Generation)
**Goal:** Establish a correct and efficient representation of the game state and generate all legal moves.

### Story 1.1: Implement Robust Board Representation (0x88 or Mailbox)
*   **Size:** Medium
*   **Description:** Replace the current simple 2D array with a specialized board representation (e.g., 0x88 or Mailbox) to optimize validity checks and index calculations.
*   **Acceptance Criteria:**
    *   [x] Board is represented as a 1-dimensional array.
    *   [x] Helper function `isValidSquare(index)` efficiently determines if a square is on the board.
    *   [x] Existing piece classes and setup logic are refactored.
    *   [x] Unit tests verify all 64 squares are correctly mapped.

### Story 1.2: Implement FEN Parsing and Generation
*   **Size:** Medium
*   **Description:** Implement support for Forsyth-Edwards Notation (FEN) to load and save positions.
*   **Acceptance Criteria:**
    *   [x] `loadFen(fenString)` correctly initializes board, color, castling, en passant, and clocks.
    *   [x] `generateFen()` returns a valid FEN string.
    *   [x] Invalid FEN strings cause specific errors.
    *   [x] Unit tests cover edge cases (e.g., no castling, en passant).

### Story 1.3a: Move Logic - Sliding Pieces
*   **Size:** Medium
*   **Description:** Implement move generation for Bishops, Rooks, and Queens.
*   **Acceptance Criteria:**
    *   [x] Generate moves in all valid directions until blocked or edge.
    *   [x] Correctly identify captures vs. quiet moves.
    *   [x] Verify pins (optional at this stage, but good to consider).

### Story 1.3b: Move Logic - Stepping Pieces (Knight, King, Pawn)
*   **Size:** Small
*   **Description:** Implement move generation for Knights, Kings, and Pawns (basic moves).
*   **Acceptance Criteria:**
    *   [x] Knights jump to correct offsets.
    *   [x] Kings move to adjacent squares.
    *   [x] Pawns push single, double (start), and capture diagonally.

### Story 1.3c: Move Logic - Special Moves
*   **Size:** Medium
*   **Description:** Implement complex move rules: Castling, En Passant, and Promotion.
*   **Acceptance Criteria:**
    *   [x] Castling checks for empty squares and rights.
    *   [x] En Passant captures correct pawn.
    *   [x] Pawn promotion generates 4 moves (Q, R, B, N).

### Story 1.4: Attack Detection & Legal Move Filtering
*   **Size:** Medium
*   **Description:** Differentiate pseudo-legal moves from legal moves (check detection).
*   **Acceptance Criteria:**
    *   [x] `isSquareAttacked(square, side)` implemented.
    *   [x] Generator filters moves leaving King in check.
    *   [x] Castling forbidden if King is in check or passes through check.

### Story 1.5: Perft (Performance Test) Verification
*   **Size:** Small
*   **Description:** Create a Perft function to verify move generator correctness.
*   **Acceptance Criteria:**
    *   [x] `perft(depth)` counts leaf nodes accurately.
    *   [x] Matches known values for "Start Position" and "Kiwipete".
    *   [x] Debug mode for isolating move generation bugs.

---

## Epic 2: Game Loop & Interface
**Goal:** Manage the flow of a game and allow external tools to interact with the engine.

### Story 2.1: Game Status & Rule Enforcement
*   **Size:** Medium
*   **Description:** Detect game end conditions (Mate, Draw).
*   **Acceptance Criteria:**
    *   [x] Checkmate and Stalemate detection. (Implemented in Search/Board)
    *   [x] Draw by 50-Move Rule.
    *   [x] Draw by Repetition (3-fold).

### Story 2.2a: UCI Protocol - Basic Handshake
*   **Size:** Small
*   **Description:** Implement the basic UCI handshake commands.
*   **Acceptance Criteria:**
    *   [x] Responds to `uci` with `id` and `uciok`.
    *   [x] Responds to `isready` with `readyok`.
    *   [x] Handles `quit` command.

### Story 2.2b: UCI Protocol - State Machine
*   **Size:** Medium
*   **Description:** Manage engine state (Init, Ready, Searching, Pondering).
*   **Acceptance Criteria:**
    *   [x] Correctly transitions between states based on commands.
    *   [x] Handles interrupts (e.g., `stop` command during search).

### Story 2.3a: UCI Gameplay - Position Setup
*   **Size:** Medium
*   **Description:** Implement the `position` command.
*   **Acceptance Criteria:**
    *   [x] Parses `position startpos moves ...`.
    *   [x] Parses `position fen <fen> moves ...`.
    *   [x] Updates internal board state correctly.

### Story 2.3b: UCI Gameplay - Search Control
*   **Size:** Medium
*   **Description:** Implement the `go` command and bestmove output.
*   **Acceptance Criteria:**
    *   [x] Parses `go wtime btime ...`. (Partially, structure exists)
    *   [x] Starts search in a separate flow/async. (Sync for now)
    *   [x] Outputs `bestmove <move>` when done.

---

## Epic 3: Basic AI (Search & Evaluation)
**Goal:** Create an engine that can look ahead and make intelligent decisions.

### Story 3.1a: Static Evaluation - Material
*   **Size:** Small
*   **Description:** Basic material counting.
*   **Acceptance Criteria:**
    *   [x] Sums piece values (P, N, B, R, Q, K).
    *   [x] Returns score relative to side to move.

### Story 3.1b: Static Evaluation - PST
*   **Size:** Small
*   **Description:** Add Piece-Square Tables.
*   **Acceptance Criteria:**
    *   [x] Arrays defined for each piece type.
    *   [x] Evaluation adds PST bonus based on square.

### Story 3.2a: Search - Basic Minimax
*   **Size:** Medium
*   **Description:** Implement recursive Minimax search.
*   **Acceptance Criteria:**
    *   [x] Searches to fixed depth.
    *   [x] Alternates Max/Min layers.
    *   [x] Returns best move.

### Story 3.2b: Search - Alpha-Beta Pruning
*   **Size:** Medium
*   **Description:** Optimize search with Alpha-Beta.
*   **Acceptance Criteria:**
    *   [x] Passes alpha/beta bounds.
    *   [x] Prunes branches when `alpha >= beta`.
    *   [x] Verified node count reduction vs Minimax.

### Story 3.3: Quiescence Search
*   **Size:** Medium
*   **Description:** Leaf node search for stable positions.
*   **Acceptance Criteria:**
    *   [x] Called at depth 0.
    *   [x] Generates only captures.
    *   [x] Uses Stand-Pat pruning.

---

## Epic 4: Advanced Features & Search Optimizations
**Goal:** Optimize performance and strategic understanding.

### Story 4.1a: Zobrist Hashing
*   **Size:** Medium
*   **Description:** Implement Zobrist hashing for positions.
*   **Acceptance Criteria:**
    *   [x] Random numbers initialized for [Piece][Square].
    *   [x] Hash updated incrementally during make/unmake move.
    *   [x] Detects repetition draws using hash history.

### Story 4.1b: Transposition Table
*   **Size:** Medium
*   **Description:** Implement the TT storage and probing.
*   **Acceptance Criteria:**
    *   [x] Fixed size hash table (e.g., 64MB).
    *   [x] Store/Retrieve bounds (Exact, Alpha, Beta).
    *   [x] Use TT move to order moves.

### Story 4.2a: Iterative Deepening
*   **Size:** Small
*   **Description:** Loop depth 1 to N.
*   **Acceptance Criteria:**
    *   [x] Loop calls search with increasing depth.
    *   [x] Checks for time expiry between depths.

### Story 4.2b: Principal Variation Search (PVS)
*   **Size:** Medium
*   **Description:** Implement PVS logic.
*   **Acceptance Criteria:**
    *   [x] Search PV move with full window.
    *   [x] Search other moves with null window.
    *   [x] Re-search if null window fails high.

### Story 4.3a: Move Ordering - MVV-LVA
*   **Size:** Small
*   **Description:** Sort captures.
*   **Acceptance Criteria:**
    *   [x] Capture moves scored by Victim - Attacker value.
    *   [x] Sorted before quiet moves.

### Story 4.3b: Move Ordering - History/Killer
*   **Size:** Medium
*   **Description:** Heuristics for quiet moves.
*   **Acceptance Criteria:**
    *   [x] Store Killer moves per depth.
    *   [x] Update History table on cutoffs.
    *   [x] Sort quiet moves using these scores.

### Story 4.4a: Advanced Eval - Mobility/Safety
*   **Size:** Medium
*   **Description:** King safety and piece mobility.
*   **Acceptance Criteria:**
    *   [x] Count safe squares for pieces.
    *   [x] Penalty for open King lines.

### Story 4.4b: Advanced Eval - Pawn Structure
*   **Size:** Medium
*   **Description:** Pawn patterns.
*   **Acceptance Criteria:**
    *   [x] Detect isolated, doubled, backward pawns.
    *   [x] Bonus for passed pawns.

---

## Epic 5: Ecosystem & Infrastructure
**Goal:** Create a professional-grade ecosystem.

### Story 5.1: Advanced Time Management
*   **Size:** Medium
*   **Description:** Dynamic time allocation.
*   **Acceptance Criteria:**
    *   [x] Logic for `optimum` vs `max` time.
    *   [x] Panic handling if score drops significantly. (Partially, soft limit implemented)

### Story 5.2: Polyglot Opening Book
*   **Size:** Medium
*   **Description:** .bin book reader.
*   **Acceptance Criteria:**
    *   [x] Read Polyglot format.
    *   [x] Match Zobrist key to book entries.
    *   [x] Select weighted random move.

### Story 5.3a: Tuning Infrastructure
*   **Size:** Large
*   **Description:** Harness for self-play tuning.
*   **Acceptance Criteria:**
    *   [x] Script to run Engine vs Engine games rapidly.
    *   [x] Collect game results (W/L/D).

### Story 5.3b: SPSA Algorithm
*   **Size:** Medium
*   **Description:** Implement the tuner logic.
*   **Acceptance Criteria:**
    *   [x] Update parameters based on match results.
    *   [x] Converge towards optimal values.

### Story 5.4a: SPRT Testing Script
*   **Size:** Medium
*   **Description:** Local script for statistical testing.
*   **Acceptance Criteria:**
    *   [x] Run matches until H0/H1 hypothesis confirmed.
    *   [x] Output Elo gain/loss confidence interval.

### Story 5.4b: CI Pipeline Integration
*   **Size:** Medium
*   **Description:** Automate testing on GitHub.
*   **Acceptance Criteria:**
    *   [ ] CI job runs unit tests.
    *   [ ] CI job runs short SPRT against previous release.
