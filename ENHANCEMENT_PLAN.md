# Jules & Gemini 3 Chess Engine Enhancement Plan

This document outlines a staged, long-term roadmap to develop a robust chess engine using Node.js. The goal is to evolve the current basic implementation into a fully functional, competitive engine.

## Phase 1: Foundation (Board & Move Generation)

**Goal:** Establish a correct and efficient representation of the game state and generate all legal moves.

1.  **Robust Board Representation**
    *   **Representation:** Adopt a 0x88 or Mailbox (1D array of 64 squares) representation for simplicity and efficiency in JavaScript, or transition to Bitboards for maximum performance if needed later.
    *   **FEN Support:** Implement Forsyth-Edwards Notation (FEN) parsing and generation. This allows the engine to be initialized from any position.
    *   **State Tracking:** accurately track:
        *   Side to move (White/Black).
        *   Castling rights (KQkq).
        *   En Passant target square.
        *   Halfmove clock (for 50-move rule).
        *   Fullmove number.

2.  **Move Generation**
    *   **Piece Logic:** Implement complete move logic for Knight, Bishop, Rook, Queen, and King.
    *   **Special Moves:** Implement Castling, En Passant, and Pawn Promotion.
    *   **Attack Detection:** Implement `isSquareAttacked(square, side)` to determine if a square is under threat (essential for check detection and castling).
    *   **Legal Moves:** Differentiate between pseudo-legal moves (geometry only) and legal moves (cannot leave King in check).

3.  **Verification (Perft)**
    *   **Perft (Performance Test):** Implement a Perft function that counts leaf nodes at a specific depth. Compare results against known values (e.g., from the Chess Programming Wiki) to guarantee move generation correctness.

## Phase 2: Game Loop & Interface

**Goal:** Manage the flow of a game and allow external tools to interact with the engine.

1.  **Game Status Management**
    *   Detect Checkmate and Stalemate.
    *   Detect Draw by Repetition (using Zobrist hashing history).
    *   Detect Draw by 50-move rule.
    *   Detect Draw by Insufficient Material.

2.  **UCI Protocol Implementation**
    *   Implement the Universal Chess Interface (UCI) protocol.
    *   **Commands:** Support `uci`, `isready`, `ucinewgame`, `position`, `go`, `stop`, `quit`.
    *   **Output:** Send `id`, `uciok`, `readyok`, `bestmove`, `info` (depth, score, nodes, pv).
    *   This allows testing the engine against other engines using GUIs like Arena or CuteChess.

## Phase 3: Basic AI (Search & Evaluation)

**Goal:** Create an engine that can look ahead and make intelligent decisions.

1.  **Evaluation Function (Static)**
    *   **Material Balance:** Sum the values of pieces (P=100, N=320, B=330, R=500, Q=900, K=20000).
    *   **Piece-Square Tables (PST):** Add bonuses/penalties based on piece location (e.g., Knights in center, Rooks on open files).

2.  **Search Algorithms**
    *   **Minimax:** Basic recursive search to find the best move.
    *   **Alpha-Beta Pruning:** Optimize Minimax to prune irrelevant branches, significantly increasing search depth.
    *   **Iterative Deepening:** Search to depth 1, then 2, then 3, etc., to ensure a best move is always available if time runs out.
    *   **Quiescence Search:** Extend search at leaf nodes for "noisy" positions (captures, checks) to avoid the Horizon Effect.

## Phase 4: Advanced Features & Search Optimizations

**Goal:** Optimize performance and strategic understanding to increase Elo strength.

1.  **Transposition Table (TT)**
    *   **Zobrist Hashing:** distinct 64-bit random numbers for every piece on every square to generate a unique hash for positions.
    *   **TT Logic:** Cache search results (exact score, lower bound, upper bound) to avoid re-searching the same position.

2.  **Search Heuristics & Pruning**
    *   **Principal Variation Search (PVS):** Assume the first move (best move from TT or iterative deepening) is best and search others with a zero window to prove they are worse.
    *   **Aspiration Windows:** Search with a narrow window around the previous score (alpha-beta) rather than (-infinity, +infinity).
    *   **Null Move Pruning:** If passing the move (giving opponent two moves in a row) still results in a beta-cutoff, the position is likely too strong to search fully.
    *   **Futility Pruning:** Prune moves at low depths if they are unlikely to raise alpha even with a large margin.
    *   **Late Move Reductions (LMR):** Reduce search depth for moves ordered late in the list, assuming they are worse.

3.  **Move Ordering Enhancements**
    *   **MVV-LVA:** Sort captures by "Most Valuable Victim - Least Valuable Attacker".
    *   **Killer Moves:** Prioritize moves that caused a cutoff at the same depth in sibling nodes.
    *   **History Heuristic:** Score non-capture moves based on their historical success in the search tree.

4.  **Advanced Evaluation**
    *   **Mobility:** Bonus for the number of safe squares a piece can move to.
    *   **King Safety:** Penalty for exposed King, semi-open files near King.
    *   **Pawn Structure:** Penalties for isolated, doubled, or backward pawns. Bonuses for passed pawns.

## Phase 5: Ecosystem & Infrastructure (Professional Grade)

**Goal:** Create a professional-grade engine ecosystem for tuning and testing.

1.  **Time Management**
    *   **Soft/Hard Limits:** Differentiate between "ideal" time to spend and "maximum" time before forfeiting.
    *   **Lag Compensation:** Account for network/interface latency.

2.  **Opening Knowledge**
    *   **Polyglot Books:** Integrate support for `.bin` Polyglot opening books to play standard openings instantly without search.

3.  **Automated Tuning (CLOP/SPSA)**
    *   **SPSA (Simultaneous Perturbation Stochastic Approximation):** Implement a tuner to automatically adjust evaluation weights (e.g., piece values, PST scores) by playing thousands of fast games.

4.  **Distributed Testing (OpenBench/Fishtest)**
    *   **SPRT (Sequential Probability Ratio Test):** Use statistical tests to verify if a new feature actually increases Elo.
    *   **CI/CD Pipeline:** Automate strength testing against previous versions on every commit.

5.  **Professional Features**
    *   **Endgame Tablebases:** Integrate Syzygy or Nalimov tablebases.
    *   **NNUE:** Replace hand-crafted evaluation with Efficiently Updatable Neural Networks.
    *   **Lazy SMP:** Parallel search using multiple threads.
