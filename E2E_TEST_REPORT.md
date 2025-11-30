# End-to-End (E2E) Test Report

## Executive Summary

This report documents the current coverage of the End-to-End test suite located in `tests/e2e/`. The tests use Playwright to verify the frontend application's functionality. Significant improvements have been made to cover Game Controls, History Navigation, and Settings, bringing the total code coverage to approximately 80%.

## Covered Scenarios

The following scenarios are currently covered by the E2E test suite:

### 1. Basic Application Health (`basic.spec.js`)
- **Title Verification:** Checks if the page title matches "Jules & Gemini Chess".
- **Board Loading:** Verifies that the chessboard and squares are rendered.
- **Basic Interaction:** Verifies that clicking a square does not crash the application.

### 2. Gameplay (`gameplay.spec.js`, `moves.spec.js`)
- **Pawn Promotion:** Verifies the promotion modal appears and that selecting a piece (Queen) correctly promotes the pawn on the board.
- **Game Clock:** Verifies that the clock timer updates (does not stay at "05:00") after moves are made.
- **Move Confirmation:** Verifies that enabling "Move Confirmation" requires a second click to execute a move.
- **Illegal Moves:** Verifies that attempting an illegal move (e.g., Pawn e2-e5 on first move) does not update the board.

### 3. FEN & PGN Handling (`fen_pgn.spec.js`)
- **FEN Loading:** Verifies that entering a custom FEN string correctly updates the board state (piece placement).
- **PGN Import:** Verifies that importing a PGN string correctly populates the move history and updates the board to the final position.

### 4. Game Modes (`modes.spec.js`, `duel.spec.js`)
- **Armageddon Mode:** Verifies that enabling Armageddon Mode sets the correct time controls (White 5:00, Black 4:00) and displays a toast notification.
- **Handicap Mode:** Verifies that selecting a handicap (e.g., Knight Odds) correctly removes the piece from the board upon starting a new game.
- **Engine Duel:** Verifies that the Duel Setup modal appears and that a duel can be started.

### 5. Analysis & Graphs (`analysis.spec.js`, `graphs.spec.js`, `analysis_full.spec.js`)
- **Analysis Mode:** Verifies that enabling Analysis Mode displays the evaluation bar and graph.
- **Clear Analysis:** Checks that the "Clear Analysis" button is clickable and maintains application stability.
- **Graph Visibility:** Verifies that the graph tabs and SVG elements (Material Graph) are rendered.
- **Full Game Analysis:** Verifies that triggering "Analyze Game" opens the report modal and populates the analysis table.

### 6. Settings & Customization (`settings.spec.js`, `sound.spec.js`)
- **Board Theme:** Verifies that changing the board theme applies the corresponding CSS class.
- **UCI Option Persistence:** Verifies that changing a numeric UCI option (e.g., Hash) updates the input value.
- **Sound Settings:** Verifies toggling the sound checkbox executes the sound manager logic.
- **Zen Mode:** Verifies toggling Zen Mode adds the `.zen-mode` class to the body.

### 7. Training Tools (`training.spec.js`)
- **Memory Training:** Verifies starting the mode, the timer appearance, and the palette interaction during reconstruction.
- **Tactics Trainer:** Verifies starting the mode and loading a puzzle (simulated).
- **Endgame Trainer:** Verifies selecting an endgame type (e.g., Lucena) and starting the practice session.

### 8. Visualizations (`visuals.spec.js`)
- **Analysis Visuals:** Verifies toggling various analysis overlays (King Safety, Mobility, Outposts, etc.) while analysis mode is active.

### 9. Tournament (`tournament.spec.js`)
- **Leaderboard:** Verifies that the leaderboard modal opens and displays the table.
- **Tournament Setup:** Verifies adding players to the tournament roster.

### 10. Game Controls (`game_controls.spec.js`, `history_replay.spec.js`)
- **Resign:** Verifies clicking resign terminates the game and logs the result.
- **Offer Draw:** Verifies offering a draw (when eval is 0) results in engine acceptance.
- **Takeback:** Verifies takeback functionality undoes the move on the board (PvP mode tested).
- **Flip Board:** Verifies clicking Flip Board rotates the board view (CSS class).
- **Auto-Queen:** Verifies enabling Auto-Queen skips the promotion modal.
- **Game History List:** Verifies that clicking moves in the history list navigates the board state.

### 11. Engine Integrations (`engine_integrations.spec.js`)
- **Local Engine Upload:** Verifies uploading a `.js` worker file and using it as the engine.
- **Cloud Engine Connection:** Verifies connecting to a WebSocket URL and using it as the engine.
- **Engine Switching:** Verifies toggling between Remote, Local, and Cloud engines.
- **Self Play & Force Move:** Implicitly verifies these controls function with custom engines.

### 12. Board Settings (`board_settings.spec.js`)
- **Visual Toggles:** Verifies Auto-Flip, Blindfold Mode, and Streamer Mode switches update the UI/CSS.
- **Board Sizing:** Verifies the Board Size slider updates the board container width.

---

## Missing Coverage / Untested Features

The following features and UI elements are present in the application (`public/index.html`) but are **not** currently covered by E2E tests:

### 1. Game Controls
- **New Chess960:** Starting a Chess960 game (distinct from standard New Game).

### 2. Specific Game Modes
- **Guess the Move:** "Guess the Move" mode logic and feedback.
- **Vote Chess:** Vote aggregation and move execution (requires WebSocket simulation).

### 3. Board Settings (`.board-settings-panel`)
- **File Uploads:** Uploading custom theme JSONs or piece set images.

### 4. Search & History Features
- **Replay Game:** Using the replay controls (Play/Pause, Speed slider) and verifying board updates.

### 5. Engine Management
- **Presets:** Selecting different engine presets (Blitz/Analysis) and verifying option updates.
- **Reset Engine:** Verifying the reset action (reloading page/session).
- **System Log:** Verifying that critical events (connection status, errors) are logged to the System Log panel.

## Recommendations

1.  **Mock Engine Responses:** To verify deeper logic like "Vote Chess" flows, mocking WebSocket messages is essential.
2.  **Visual Regression Testing:** For features like "Blindfold Mode", screenshot comparison would be more effective.
3.  **Refactor for Testability:** The `UIManager` and `MoveHandler` logic is tightly coupled with DOM events. Refactoring some logic into pure functions would allow for easier unit testing alongside E2E tests.
