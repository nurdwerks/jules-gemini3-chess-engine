# End-to-End (E2E) Test Report

## Executive Summary

This report documents the current coverage of the End-to-End test suite located in `tests/e2e/`. The tests use Playwright to verify the frontend application's functionality. While core gameplay mechanics, basic modes, and settings are tested, significant portions of the advanced features, training tools, and specific UI interactions remain untested.

## Covered Scenarios

The following scenarios are currently covered by the E2E test suite:

### 1. Basic Application Health (`basic.spec.js`)
- **Title Verification:** Checks if the page title matches "Jules & Gemini Chess".
- **Board Loading:** Verifies that the chessboard and squares are rendered.
- **Basic Interaction:** Verifies that clicking a square does not crash the application.

### 2. Gameplay (`gameplay.spec.js`)
- **Pawn Promotion:** Verifies the promotion modal appears and that selecting a piece (Queen) correctly promotes the pawn on the board.
- **Game Clock:** Verifies that the clock timer updates (does not stay at "05:00") after moves are made.

### 3. FEN & PGN Handling (`fen_pgn.spec.js`)
- **FEN Loading:** Verifies that entering a custom FEN string correctly updates the board state (piece placement).
- **PGN Import:** Verifies that importing a PGN string correctly populates the move history and updates the board to the final position.

### 4. Game Modes (`modes.spec.js`, `duel.spec.js`)
- **Armageddon Mode:** Verifies that enabling Armageddon Mode sets the correct time controls (White 5:00, Black 4:00) and displays a toast notification.
- **Handicap Mode:** Verifies that selecting a handicap (e.g., Knight Odds) correctly removes the piece from the board upon starting a new game.
- **Engine Duel:** Verifies that the Duel Setup modal appears and that a duel can be started (toast notification confirmation).

### 5. Analysis & Graphs (`analysis.spec.js`, `graphs.spec.js`)
- **Analysis Mode:** Verifies that enabling Analysis Mode displays the evaluation bar and graph.
- **Clear Analysis:** Checks that the "Clear Analysis" button is clickable and maintains application stability.
- **Graph Visibility:** Verifies that the graph tabs and SVG elements (Material Graph) are rendered.

### 6. Settings & Customization (`settings.spec.js`)
- **Board Theme:** Verifies that changing the board theme applies the corresponding CSS class.
- **UCI Option Persistence:** Verifies that changing a numeric UCI option (e.g., Hash) updates the input value.

### 7. Board Interactions (`interactions.spec.js`)
- **Piece Movement:** Verifies that dragging/clicking to move a piece updates the board state and history.
- **Last Move Arrow:** Verifies that the last move arrow is rendered after a move.
- *(Note: Arrow drawing tests are currently skipped due to implementation complexities).*

---

## Missing Coverage / Untested Features

The following features and UI elements are present in the application (`public/index.html`) but are **not** currently covered by E2E tests:

### 1. Game Controls
- **Resign:** Button functionality and game-over state triggering.
- **Offer Draw:** Sending a draw offer and handling the engine's response (accept/decline).
- **Takeback:** Undo move functionality.
- **Force Move:** Forcing the engine to move immediately.
- **New Chess960:** Starting a Chess960 game (distinct from standard New Game).
- **Flip Board:** Manually toggling board orientation via the button.
- **Self Play:** Starting a self-play session (distinct from Engine Duel).
- **Tournament Mode:** Full tournament setup, execution, and standings table verification.
- **Leaderboard:** Viewing and resetting the leaderboard.

### 2. Time Controls
- **Custom Time Settings:** Setting specific Base Time and Increment values and verifying they apply to the game.

### 3. Specific Game Modes
- **PvP Mode:** Player vs. Player interaction (disabling engine moves).
- **Guess the Move:** "Guess the Move" mode logic and feedback.
- **Vote Chess:** Vote aggregation and move execution (requires WebSocket simulation).

### 4. Training Tools (`.training-panel`)
- **Memory Training:** Interaction with the memory timer, piece palette, and scoring/give-up logic.
- **Tactics Trainer:** Loading puzzles, making moves, and success/failure feedback.
- **Endgame Trainer:** Selecting specific endgames (e.g., Lucena) and starting the practice session.
- **Daily Puzzle:** Fetching and loading the daily puzzle.
- **Opening Builder:** Saving and retrieving repertoire lines from LocalStorage.

### 5. Board Settings & Visualizations (`.board-settings-panel`)
- **Auto-Flip:** Automatic board rotation on turn change.
- **Auto-Queen:** Bypassing the promotion modal when enabled.
- **Zen Mode:** Toggling the UI layout (hiding panels).
- **Blindfold Mode / Disappearing Pieces:** Visual verification of piece opacity/visibility.
- **Streamer Mode:** Green screen background application.
- **Show Coordinates / Coordinates Outside:** Toggling coordinate visibility and position.
- **Show Threats:** Visual verification of threat highlighting.
- **Analysis Visuals:** Toggling individual overlays (King Safety, Mobility, Outposts, etc.) and verifying DOM updates (SVG overlays or square classes).
- **Sliders:** Board Size and Animation Speed adjustments.
- **Piece Sets:** Changing piece sets and verifying image sources.
- **Sound Effects:** Verifying sound toggle state (audio output is hard to test, but state can be verified).
- **Custom Theme:** Logic for applying custom colors and injecting Custom CSS.
- **File Uploads:** Uploading custom theme JSONs or piece set images.

### 6. Search & History Features
- **Search Stats:** Verifying specific values (Depth, NPS, WDL) match engine output in the dashboard.
- **Replay Game:** Using the replay controls (Play/Pause, Speed slider) and verifying board updates.
- **Analyze Game Button:** Triggering the full game analysis report.
- **Game History List:** Verifying that clicking a move in the history list jumps to that board state.

### 7. Engine Management
- **Presets:** Selecting different engine presets (Blitz/Analysis) and verifying option updates.
- **Reset Engine:** Verifying the reset action (reloading page/session).
- **System Log:** Verifying that critical events (connection status, errors) are logged to the System Log panel.

## Recommendations

1.  **Prioritize Training Tools:** The Training Panel features (Memory, Tactics, Endgame) are completely untested and represent significant user-facing functionality.
2.  **Verify Game Controls:** Basic controls like Resign, Takeback, and Offer Draw are fundamental and should be verified.
3.  **Test Custom Time Controls:** Ensuring custom time controls are correctly passed to the engine is critical for proper game management.
4.  **Mock WebSocket for Advanced Modes:** For Vote Chess and Tournament modes, consider mocking WebSocket messages to simulate server/engine responses deterministically.
