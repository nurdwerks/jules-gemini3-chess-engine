# Jules & Gemini 3 Chess Engine Enhancement Plan

This document outlines a staged, long-term roadmap to develop a robust chess engine using Node.js. The goal is to evolve the current basic implementation into a fully functional, competitive engine. Each phase is treated as an **Epic** containing specific **Story Issues** to be implemented.

---

## Epic 1: Foundation (Board & Move Generation)
**Goal:** Establish a correct and efficient representation of the game state and generate all legal moves. This is the bedrock upon which the AI will be built.

### Story 1.1: Implement Robust Board Representation (0x88 or Mailbox)
*   **Description:** Replace the current simple 2D array with a specialized board representation (e.g., 0x88 or Mailbox) to optimize validity checks and index calculations. This is crucial for the performance of move generation.
*   **Acceptance Criteria:**
    *   [ ] The board is represented as a 1-dimensional array (e.g., size 128 for 0x88).
    *   [ ] A helper function `isValidSquare(index)` efficiently determines if a square is on the board using bitwise operations.
    *   [ ] Existing piece classes and setup logic are refactored to work with the new array structure.
    *   [ ] Unit tests verify that all 64 squares are correctly mapped and accessed.

### Story 1.2: Implement FEN Parsing and Generation
*   **Description:** Implement support for Forsyth-Edwards Notation (FEN). This standard string format allows the engine to load specific chess positions for testing, debugging, and gameplay.
*   **Acceptance Criteria:**
    *   [ ] `loadFen(fenString)` correctly initializes the board, active color, castling rights, en passant target, and move clocks.
    *   [ ] `generateFen()` returns a valid FEN string representing the current internal board state.
    *   [ ] Invalid FEN strings cause the function to throw a descriptive error (or return false).
    *   [ ] Unit tests cover edge cases like "no castling rights", "en passant available", and "move 1".

### Story 1.3: Implement Complete Move Logic
*   **Description:** Implement the specific movement rules for all piece types (Pawn, Knight, Bishop, Rook, Queen, King), including special moves.
*   **Acceptance Criteria:**
    *   [ ] Sliding pieces (B, R, Q) generate moves until they hit an obstacle or edge.
    *   [ ] Knights and Kings generate moves to their specific offsets.
    *   [ ] Pawns correctly handle single push, double push (from rank 2/7), and diagonal captures.
    *   [ ] **Castling:** Logic checks for empty squares between King and Rook and appropriate castling rights.
    *   [ ] **En Passant:** Logic identifies when a pawn can capture an enemy pawn that just moved two squares.

### Story 1.4: Attack Detection & Legal Move Filtering
*   **Description:** Differentiate between "pseudo-legal" moves (geometrically valid) and "legal" moves (do not leave King in check).
*   **Acceptance Criteria:**
    *   [ ] Implement `isSquareAttacked(square, attackingSide)` to check if a specific square is under threat.
    *   [ ] Move generator filters out any move that results in the friendly King being in check.
    *   [ ] Castling is strictly forbidden if the King is in check, passes through check, or lands in check.

### Story 1.5: Perft (Performance Test) Verification
*   **Description:** Create a Perft function to count the number of leaf nodes in the move generation tree at a given depth. This is the standard method for verifying the correctness of a chess engine's move generator.
*   **Acceptance Criteria:**
    *   [ ] `perft(depth)` accurately counts nodes for standard test positions (e.g., "Start Position", "Kiwipete").
    *   [ ] Results match the known correct values from the Chess Programming Wiki.
    *   [ ] A debug mode prints the node count for each root move to allow isolation of bugs.

---

## Epic 2: Game Loop & Interface
**Goal:** Manage the flow of a game and allow external tools (GUIs) to interact with the engine via the UCI protocol.

### Story 2.1: Game Status & Rule Enforcement
*   **Description:** The engine must correctly identify when the game has ended.
*   **Acceptance Criteria:**
    *   [ ] **Checkmate:** Detected when the side to move is in check and has no legal moves.
    *   [ ] **Stalemate:** Detected when the side to move is NOT in check but has no legal moves.
    *   [ ] **Draw by 50-Move Rule:** Claimed when 50 moves occur without a pawn move or capture.
    *   [ ] **Draw by Repetition:** Detected when the exact same board position occurs 3 times (requires history tracking).

### Story 2.2: UCI Protocol Input/Output Loop
*   **Description:** Implement the Universal Chess Interface (UCI) protocol to allow the engine to communicate with chess GUIs (like Arena, Fritz, or Lichess).
*   **Acceptance Criteria:**
    *   [ ] Engine reads commands from `stdin` and writes to `stdout`.
    *   [ ] `uci` command returns `id name`, `id author`, and `uciok`.
    *   [ ] `isready` command returns `readyok`.
    *   [ ] `quit` command terminates the process.

### Story 2.3: UCI Gameplay Commands (`position` & `go`)
*   **Description:** Implement the core commands to set up the board and start thinking.
*   **Acceptance Criteria:**
    *   [ ] `position startpos moves e2e4 ...` sets the board to start and applies the move list.
    *   [ ] `position fen <fen> moves ...` sets the board to the FEN and applies moves.
    *   [ ] `go` command starts the search.
    *   [ ] `go` supports parameters: `wtime`, `btime`, `winc`, `binc` (for time management), and `depth`.
    *   [ ] Engine outputs `bestmove <move>` when search is complete.

---

## Epic 3: Basic AI (Search & Evaluation)
**Goal:** Create an engine that can look ahead and make intelligent decisions, moving beyond random play.

### Story 3.1: Static Evaluation Function
*   **Description:** Create a function to numerically score a position from the perspective of the side to move.
*   **Acceptance Criteria:**
    *   [ ] **Material:** Correctly sums values (P=100, N=320, B=330, R=500, Q=900, K=20000).
    *   [ ] **PST:** Applies Piece-Square Tables to encourage developing pieces to good squares (e.g., Knights to center).
    *   [ ] Function returns a positive score if the side to move is winning, negative if losing.

### Story 3.2: Minimax & Alpha-Beta Search
*   **Description:** Implement the Alpha-Beta pruning algorithm to efficiently search the game tree.
*   **Acceptance Criteria:**
    *   [ ] Recursive search function explores to a fixed `depth`.
    *   [ ] **Pruning:** Branches are cut off immediately when `alpha >= beta`.
    *   [ ] Returns the best move found and its score.
    *   [ ] Node count is tracked to measure performance (Nodes Per Second).

### Story 3.3: Quiescence Search
*   **Description:** To prevent the "Horizon Effect" (where the engine stops searching in the middle of a capture sequence), implement a Quiescence Search at leaf nodes.
*   **Acceptance Criteria:**
    *   [ ] When main search depth reaches 0, `quiescenceSearch` is called.
    *   [ ] Only generates and searches capturing moves.
    *   [ ] Uses a "stand-pat" score (current evaluation) to prune bad captures.

---

## Epic 4: Advanced Features & Search Optimizations
**Goal:** Optimize performance and strategic understanding to significantly increase Elo strength.

### Story 4.1: Transposition Table (TT) & Zobrist Hashing
*   **Description:** Implement a hash map to store results of previously searched positions, allowing the engine to skip redundant work.
*   **Acceptance Criteria:**
    *   [ ] **Zobrist Hashing:** Unique 64-bit hash generated for the board position, updated incrementally.
    *   [ ] **TT Storage:** Table stores Entry Type (Exact, LowerBound, UpperBound), Depth, Score, and Best Move.
    *   [ ] **TT Probing:** Search checks TT before generating moves; returns score immediately if depth is sufficient.

### Story 4.2: Iterative Deepening & PVS
*   **Description:** Search deeper and deeper (Depth 1, 2, 3...) to ensure a move is always ready and to improve move ordering.
*   **Acceptance Criteria:**
    *   [ ] Loop increments depth until time runs out.
    *   [ ] **PVS (Principal Variation Search):** Assumes the first move (PV move) is best and searches it with a full window, while searching other moves with a "null window" to prove they are worse.

### Story 4.3: Move Ordering Heuristics
*   **Description:** Improve the order in which moves are searched to maximize Alpha-Beta cutoffs.
*   **Acceptance Criteria:**
    *   [ ] **MVV-LVA:** Captures are sorted by "Most Valuable Victim - Least Valuable Attacker".
    *   [ ] **Killer Moves:** Moves that caused a beta-cutoff at the same depth in sibling nodes are tried early.
    *   [ ] **History Heuristic:** Quiet moves are scored based on their historical success in the search.

### Story 4.4: Advanced Evaluation Terms
*   **Description:** Add sophisticated positional understanding to the evaluation function.
*   **Acceptance Criteria:**
    *   [ ] **Mobility:** Bonus for pieces with many safe target squares.
    *   [ ] **King Safety:** Penalty for open files near the King or lack of pawn shield.
    *   [ ] **Pawn Structure:** Penalty for doubled, isolated, or backward pawns; bonus for passed pawns.

---

## Epic 5: Ecosystem & Infrastructure (Professional Grade)
**Goal:** Create a professional-grade engine ecosystem for tuning, testing, and knowledge.

### Story 5.1: Advanced Time Management
*   **Description:** Implement logic to allocate time dynamically based on the game situation.
*   **Acceptance Criteria:**
    *   [ ] Calculate `optimum_time` (e.g., 5% of remaining time + increment).
    *   [ ] Calculate `maximum_time` to avoid forfeiting on time.
    *   [ ] Stop search immediately if `maximum_time` is exceeded.

### Story 5.2: Polyglot Opening Book Support
*   **Description:** Allow the engine to use `.bin` Polyglot opening books to play standard openings instantly.
*   **Acceptance Criteria:**
    *   [ ] Engine checks for `book.bin` on startup.
    *   [ ] If position is in book, play the book move immediately without searching.
    *   [ ] Support weighting to choose moves with higher probability.

### Story 5.3: Automated Tuning (SPSA)
*   **Description:** Implement a tuner to automatically adjust evaluation weights.
*   **Acceptance Criteria:**
    *   [ ] Tuning script plays self-play games with slightly perturbed parameters (SPSA algorithm).
    *   [ ] Parameters (e.g., Bishop Value) are updated based on match results to minimize error/maximize wins.

### Story 5.4: CI/CD & Distributed Testing
*   **Description:** Set up a pipeline to test engine strength automatically.
*   **Acceptance Criteria:**
    *   [ ] Integration with tools like OpenBench or local SPRT (Sequential Probability Ratio Test) scripts.
    *   [ ] New commits are tested against the previous master branch to prevent regression.
