# Technical Debt & Refactoring Plan

This document outlines the current technical debt in the repository and provides a roadmap for refactoring large components, improving documentation, and enhancing test coverage.

## 1. Identified Technical Debt

### Code Structure & Maintainability
*   **Large Files:** `src/Search.js` (~1100 lines) and `src/Board.js` (~1150 lines) have grown significantly and contain mixed responsibilities.
*   **Large Functions:** Several core functions have high cyclomatic complexity and are difficult to read/maintain:
    *   `Search.alphaBeta`: Handles search logic, pruning, extensions, and move ordering in a single massive block.
    *   `Search.quiescence`: Similar complexity for the quiescence search.
    *   `Board.generateMoves`: Handles move generation for all piece types, including special moves (castling, en passant, promotions) and 0x88/bitboard hybrid logic.
*   **Magic Numbers:** Numerous hardcoded values in `Search.js` (pruning margins, LMR constants) and `Evaluation.js` (piece values, mobility weights) should be extracted to named constants or configuration files.
*   **Linting & Formatting:** No linter (ESLint) or formatter (Prettier) is configured, leading to potential style inconsistencies.

### Testing & Verification
*   **Missing Coverage Reports:** Test suite runs with `npm test`, but there is no coverage reporting or enforcement.
*   **Test Quality:** Some tests rely on implementation details (e.g., specific object structures) rather than public APIs.
*   **Flaky Tests:** References in memory to occasional worker termination issues or timeout risks with large network files.

### Documentation
*   **JSDoc Coverage:** Public API methods in `Board` and `Search` lack comprehensive JSDoc comments explaining parameters, return values, and side effects.
*   **Architecture Docs:** Limited documentation on the interaction between `UCI`, `Search`, and `Worker`.

---

## 2. Refactoring Plan: Breaking Up Large Functions

### `Search.alphaBeta`
**Current State:** A monolithic function handling all search logic.
**Refactoring Strategy:** Extract distinct heuristics into private helper methods.
*   **Pruning Logic:**
    *   `_tryNullMovePruning(depth, beta)`
    *   `_tryFutilityPruning(depth, staticEval, alpha, beta)`
    *   `_tryRazoring(depth, staticEval, alpha)`
    *   `_tryLateMovePruning(depth, movesSearched)`
*   **Extensions:**
    *   `_calculateExtensions(move, inCheck)`
*   **Move Ordering:**
    *   Move the sorting logic fully into `MoveSorter` class or keep `orderMoves` but simplify the lambda inside.

### `Search.quiescence`
**Current State:** Handles standing pat, delta pruning, and capture generation/scoring.
**Refactoring Strategy:**
*   Extract `_calculateStandPat(alpha, beta)` to handle initial static eval and delta pruning checks.
*   Extract `_scoreCapture(move)` for MVV-LVA/SEE logic.

### `Board.generateMoves`
**Current State:** Iterates through all piece types and generates moves in one pass.
**Refactoring Strategy:** Break down by piece type.
*   `_generatePawnMoves(us, them, occupancy)`
*   `_generateKnightMoves(us, occupancy)`
*   `_generateSlidingMoves(type, us, occupancy)` (handling Bishops, Rooks, Queens)
*   `_generateKingMoves(us, occupancy)`
*   `_generateCastlingMoves(us, occupancy)`
*   The main `generateMoves` function will simply call these helpers and aggregate results.

---

## 3. Refactoring Plan: Breaking Up Large Files

### `src/Search.js`
**Goal:** Separate core search algorithm from heuristics and data management.
*   **New File: `src/SearchHeuristics.js`**
    *   Move `History`, `KillerMoves`, and `CounterMoves` logic here.
    *   Class `SearchHeuristics` can encapsulate storage and update methods (`addHistory`, `getKiller`, etc.).
*   **New File: `src/MoveSorter.js`**
    *   Move `orderMoves` and related scoring logic (MVV-LVA, SEE integration) here.
    *   `Search` class instantiates `MoveSorter`.
*   **New File: `src/SearchStats.js`**
    *   Encapsulate node counting, pruning stats, and time management checks (maybe).

### `src/Board.js`
**Goal:** Decouple FEN parsing, Zobrist hashing, and core board state.
*   **New File: `src/FenParser.js`**
    *   Move `loadFen` and `generateFen` logic here.
    *   `Board` delegates parsing to `FenParser.parse(fen_string)`.
*   **New File: `src/MoveGenerator.js`**
    *   Move `generateMoves` and the proposed helper methods (`_generatePawnMoves`, etc.) to a dedicated class.
    *   This separates "State" (`Board.js`) from "Logic" (`MoveGenerator.js`).

---

## 4. Documentation Plan

**Goal:** Achieve high JSDoc coverage for all public interfaces.

### Target Areas
*   **`src/Board.js`**: Document `makeMove`, `unmakeMove`, `generateMoves`, `loadFen`, `isKingInCheck`.
    *   *Params:* strict types (e.g., `move` object structure).
    *   *Returns:* clear description of return values (e.g., `captured` piece).
*   **`src/Search.js`**: Document `search`, `alphaBeta` (even if private, for dev clarity), `quiescence`.
    *   *Params:* explain `alpha`, `beta`, `depth`.
*   **`src/Evaluation.js`**: Explain the scoring terms and the `PARAMS` object structure.

### Standard Format
```javascript
/**
 * Executes a move on the board state, updating bitboards and hashes.
 * @param {Object} move - The move object (from, to, flags, piece, etc.).
 * @returns {Piece|null} The captured piece, if any, or null.
 */
makeMove(move) { ... }
```

---

## 5. Implementing Testing Code Coverage

**Goal:** Enforce a minimum level of test coverage to prevent regression during refactoring.

### Implementation Steps
1.  **Update `package.json`**:
    *   Modify the `test` script: `"test": "jest --coverage"`
2.  **Configure Jest**:
    *   Add `jest` configuration in `package.json` or `jest.config.js`:
    ```json
    "jest": {
      "collectCoverage": true,
      "coverageReporters": ["text", "lcov"],
      "coverageDirectory": "coverage",
      "coverageThreshold": {
        "global": {
          "branches": 70,
          "functions": 80,
          "lines": 80,
          "statements": 80
        }
      }
    }
    ```
3.  **CI Integration (Future)**:
    *   Ensure any future CI pipeline fails if coverage drops below thresholds.

### Immediate Actions
*   Run `npm test -- --coverage` to establish a baseline.
*   Identify areas with < 50% coverage and prioritize writing tests for them before major refactoring.
