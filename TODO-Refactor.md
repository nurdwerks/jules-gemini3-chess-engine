# Refactor Plan: Deprecate Bitboards

This document outlines the plan to deprecate the use of bitboards in the test suite (and potentially the engine) in favor of the `squares` (0x88) array representation.

## Context

The engine currently maintains two parallel board representations:
1.  `squares`: A 0x88 array of piece objects.
2.  `bitboards`: A set of BigInt bitboards for piece types and colors.

To simplify the codebase and testing infrastructure, we aim to deprecate usage of bitboards in tests, relying solely on the `squares` representation.

## Identified Bitboard Usage in Tests

The following test files currently depend on bitboards:

### 1. `tests/bitboard.test.js`
*   **Description**: Contains unit tests for the `src/Bitboard.js` utility class.
*   **Usage**: Tests static methods like `setBit`, `getBit`, `popcnt`, `lsb`, `getKnightAttacks`, and `getRookAttacks`.
*   **Refactor Plan**:
    *   If bitboards are removed from the engine entirely, this file should be **deleted**.
    *   If bitboards are kept as an internal implementation detail, these tests can remain but should be treated as low-level unit tests, not general engine logic tests.

### 2. `tests/board_consistency.test.js`
*   **Description**: Verifies synchronization between `squares` and `bitboards`.
*   **Usage**: Iterates through `board.bitboards` to ensure every set bit corresponds to a piece in `board.squares`, and vice-versa.
*   **Refactor Plan**:
    *   This test is tightly coupled to the dual-representation architecture.
    *   **Delete** this file when bitboards are deprecated or if the synchronization requirement is removed.

### 3. `tests/regression_generate_moves_crash.test.js`
*   **Description**: Regression test for a crash caused by state desynchronization.
*   **Usage**:
    *   Intentionally corrupts the `squares` array (removes the King).
    *   Explicitly accesses `board.bitboards.white` and `board.bitboards.king` to verify that the internal bitboard state still contains the King, setting up the crash scenario.
*   **Refactor Plan**:
    *   This test relies on the existence of `bitboards` to create a specific inconsistent state.
    *   If bitboards are deprecated, this test becomes obsolete as the specific desynchronization state cannot exist.
    *   **Modify** to remove bitboard checks or **Delete** if the regression scenario is no longer possible.

## Execution Steps

1.  **Stop adding new tests** that rely on `board.bitboards` or `Bitboard` methods. Use `board.squares` for state verification.
2.  **Evaluate engine dependency**: Determine if `src/Bitboard.js` and `board.bitboards` can be removed from `src/Board.js` and `src/Search.js` without critical performance loss or functional regression.
3.  **Remove tests**:
    *   Delete `tests/board_consistency.test.js`.
    *   Delete `tests/bitboard.test.js` (if class is removed).
    *   Update `tests/regression_generate_moves_crash.test.js`.
4.  **Remove code**: Remove `src/Bitboard.js` and bitboard logic from `src/Board.js` (if decided).

## Bitboard Usage in Source Code

### `src/Board.js`
*   **Line 3**: `require('./Bitboard')` (Top-level)
*   **Line 70**: `toggleBitboard`
*   **Line 84, 86, 117, 137, 138, 145, 146, 151, 152, 159, 160, 165, 166**: `makeMove`
*   **Line 191, 194, 206, 225, 226, 232, 233, 238, 239, 246, 247, 252, 253**: `unmakeMove`
*   **Line 318, 335, 338, 341**: `isSquareAttacked`
*   **Line 364, 383, 384, 391, 392, 485, 486, 493, 494, 501, 502, 509**: `generateMoves`

### `src/Evaluation.js`
*   **Line 4**: `require('./Bitboard')` (Top-level)
*   **Line 151**: `isPassedPawn`
*   **Line 466, 469, 472, 475, 483**: `evaluateMobility`
*   **Line 542**: `require('./Bitboard')` (Inside `evaluateKingSafety`)
*   **Line 543, 555, 556, 567, 568, 579, 580**: `evaluateKingSafety`

### `src/NNUE.js`
*   **Line 3**: `require('./Bitboard')` (Top-level)
*   **Line 143, 149**: `getHalfKPIndices`
*   **Line 175, 187, 188, 199**: `getChangedIndices`
