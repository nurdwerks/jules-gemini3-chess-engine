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
    *   [ ] Verify pins (optional at this stage, but good to consider).

### Story 1.3b: Move Logic - Stepping Pieces (Knight, King, Pawn)
*   **Size:** Small
*   **Description:** Implement move generation for Knights, Kings, and Pawns (basic moves).
*   **Acceptance Criteria:**
    *   [ ] Knights jump to correct offsets.
    *   [ ] Kings move to adjacent squares.
    *   [ ] Pawns push single, double (start), and capture diagonally.

### Story 1.3c: Move Logic - Special Moves
*   **Size:** Medium
*   **Description:** Implement complex move rules: Castling, En Passant, and Promotion.
*   **Acceptance Criteria:**
    *   [ ] Castling checks for empty squares and rights.
    *   [ ] En Passant captures correct pawn.
    *   [ ] Pawn promotion generates 4 moves (Q, R, B, N).

### Story 1.4: Attack Detection & Legal Move Filtering
*   **Size:** Medium
*   **Description:** Differentiate pseudo-legal moves from legal moves (check detection).
*   **Acceptance Criteria:**
    *   [ ] `isSquareAttacked(square, side)` implemented.
    *   [ ] Generator filters moves leaving King in check.
    *   [ ] Castling forbidden if King is in check or passes through check.

### Story 1.5: Perft (Performance Test) Verification
*   **Size:** Small
*   **Description:** Create a Perft function to verify move generator correctness.
*   **Acceptance Criteria:**
    *   [ ] `perft(depth)` counts leaf nodes accurately.
    *   [ ] Matches known values for "Start Position" and "Kiwipete".
    *   [ ] Debug mode for isolating move generation bugs.

---

## Epic 2: Game Loop & Interface
**Goal:** Manage the flow of a game and allow external tools to interact with the engine.

### Story 2.1: Game Status & Rule Enforcement
*   **Size:** Medium
*   **Description:** Detect game end conditions (Mate, Draw).
*   **Acceptance Criteria:**
    *   [ ] Checkmate and Stalemate detection.
    *   [ ] Draw by 50-Move Rule.
    *   [ ] Draw by Repetition (3-fold).

### Story 2.2a: UCI Protocol - Basic Handshake
*   **Size:** Small
*   **Description:** Implement the basic UCI handshake commands.
*   **Acceptance Criteria:**
    *   [ ] Responds to `uci` with `id` and `uciok`.
    *   [ ] Responds to `isready` with `readyok`.
    *   [ ] Handles `quit` command.

### Story 2.2b: UCI Protocol - State Machine
*   **Size:** Medium
*   **Description:** Manage engine state (Init, Ready, Searching, Pondering).
*   **Acceptance Criteria:**
    *   [ ] Correctly transitions between states based on commands.
    *   [ ] Handles interrupts (e.g., `stop` command during search).

### Story 2.3a: UCI Gameplay - Position Setup
*   **Size:** Medium
*   **Description:** Implement the `position` command.
*   **Acceptance Criteria:**
    *   [ ] Parses `position startpos moves ...`.
    *   [ ] Parses `position fen <fen> moves ...`.
    *   [ ] Updates internal board state correctly.

### Story 2.3b: UCI Gameplay - Search Control
*   **Size:** Medium
*   **Description:** Implement the `go` command and bestmove output.
*   **Acceptance Criteria:**
    *   [ ] Parses `go wtime btime ...`.
    *   [ ] Starts search in a separate flow/async.
    *   [ ] Outputs `bestmove <move>` when done.

---

## Epic 3: Basic AI (Search & Evaluation)
**Goal:** Create an engine that can look ahead and make intelligent decisions.

### Story 3.1a: Static Evaluation - Material
*   **Size:** Small
*   **Description:** Basic material counting.
*   **Acceptance Criteria:**
    *   [ ] Sums piece values (P, N, B, R, Q, K).
    *   [ ] Returns score relative to side to move.

### Story 3.1b: Static Evaluation - PST
*   **Size:** Small
*   **Description:** Add Piece-Square Tables.
*   **Acceptance Criteria:**
    *   [ ] Arrays defined for each piece type.
    *   [ ] Evaluation adds PST bonus based on square.

### Story 3.2a: Search - Basic Minimax
*   **Size:** Medium
*   **Description:** Implement recursive Minimax search.
*   **Acceptance Criteria:**
    *   [ ] Searches to fixed depth.
    *   [ ] Alternates Max/Min layers.
    *   [ ] Returns best move.

### Story 3.2b: Search - Alpha-Beta Pruning
*   **Size:** Medium
*   **Description:** Optimize search with Alpha-Beta.
*   **Acceptance Criteria:**
    *   [ ] Passes alpha/beta bounds.
    *   [ ] Prunes branches when `alpha >= beta`.
    *   [ ] Verified node count reduction vs Minimax.

### Story 3.3: Quiescence Search
*   **Size:** Medium
*   **Description:** Leaf node search for stable positions.
*   **Acceptance Criteria:**
    *   [ ] Called at depth 0.
    *   [ ] Generates only captures.
    *   [ ] Uses Stand-Pat pruning.

---

## Epic 4: Advanced Features & Search Optimizations
**Goal:** Optimize performance and strategic understanding.

### Story 4.1a: Zobrist Hashing
*   **Size:** Medium
*   **Description:** Implement Zobrist hashing for positions.
*   **Acceptance Criteria:**
    *   [ ] Random numbers initialized for [Piece][Square].
    *   [ ] Hash updated incrementally during make/unmake move.
    *   [ ] Detects repetition draws using hash history.

### Story 4.1b: Transposition Table
*   **Size:** Medium
*   **Description:** Implement the TT storage and probing.
*   **Acceptance Criteria:**
    *   [ ] Fixed size hash table (e.g., 64MB).
    *   [ ] Store/Retrieve bounds (Exact, Alpha, Beta).
    *   [ ] Use TT move to order moves.

### Story 4.2a: Iterative Deepening
*   **Size:** Small
*   **Description:** Loop depth 1 to N.
*   **Acceptance Criteria:**
    *   [ ] Loop calls search with increasing depth.
    *   [ ] Checks for time expiry between depths.

### Story 4.2b: Principal Variation Search (PVS)
*   **Size:** Medium
*   **Description:** Implement PVS logic.
*   **Acceptance Criteria:**
    *   [ ] Search PV move with full window.
    *   [ ] Search other moves with null window.
    *   [ ] Re-search if null window fails high.

### Story 4.3a: Move Ordering - MVV-LVA
*   **Size:** Small
*   **Description:** Sort captures.
*   **Acceptance Criteria:**
    *   [ ] Capture moves scored by Victim - Attacker value.
    *   [ ] Sorted before quiet moves.

### Story 4.3b: Move Ordering - History/Killer
*   **Size:** Medium
*   **Description:** Heuristics for quiet moves.
*   **Acceptance Criteria:**
    *   [ ] Store Killer moves per depth.
    *   [ ] Update History table on cutoffs.
    *   [ ] Sort quiet moves using these scores.

### Story 4.4a: Advanced Eval - Mobility/Safety
*   **Size:** Medium
*   **Description:** King safety and piece mobility.
*   **Acceptance Criteria:**
    *   [ ] Count safe squares for pieces.
    *   [ ] Penalty for open King lines.

### Story 4.4b: Advanced Eval - Pawn Structure
*   **Size:** Medium
*   **Description:** Pawn patterns.
*   **Acceptance Criteria:**
    *   [ ] Detect isolated, doubled, backward pawns.
    *   [ ] Bonus for passed pawns.

---

## Epic 5: Ecosystem & Infrastructure
**Goal:** Create a professional-grade ecosystem.

### Story 5.1: Advanced Time Management
*   **Size:** Medium
*   **Description:** Dynamic time allocation.
*   **Acceptance Criteria:**
    *   [ ] Logic for `optimum` vs `max` time.
    *   [ ] Panic handling if score drops significantly.

### Story 5.2: Polyglot Opening Book
*   **Size:** Medium
*   **Description:** .bin book reader.
*   **Acceptance Criteria:**
    *   [ ] Read Polyglot format.
    *   [ ] Match Zobrist key to book entries.
    *   [ ] Select weighted random move.

### Story 5.3a: Tuning Infrastructure
*   **Size:** Large
*   **Description:** Harness for self-play tuning.
*   **Acceptance Criteria:**
    *   [ ] Script to run Engine vs Engine games rapidly.
    *   [ ] Collect game results (W/L/D).

### Story 5.3b: SPSA Algorithm
*   **Size:** Medium
*   **Description:** Implement the tuner logic.
*   **Acceptance Criteria:**
    *   [ ] Update parameters based on match results.
    *   [ ] Converge towards optimal values.

### Story 5.4a: SPRT Testing Script
*   **Size:** Medium
*   **Description:** Local script for statistical testing.
*   **Acceptance Criteria:**
    *   [ ] Run matches until H0/H1 hypothesis confirmed.
    *   [ ] Output Elo gain/loss confidence interval.

### Story 5.4b: CI Pipeline Integration
*   **Size:** Medium
*   **Description:** Automate testing on GitHub.
*   **Acceptance Criteria:**
    *   [ ] CI job runs unit tests.
    *   [ ] CI job runs short SPRT against previous release.
