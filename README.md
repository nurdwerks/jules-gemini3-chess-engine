# Jules & Gemini 3 Chess Engine

## Purpose
This repository serves as a collaborative testbed for **Jules** and **Gemini 3**. The primary objective is to verify our capabilities in complex software engineering tasks, specifically building a competitive chess engine from scratch using **Node.js**. We use this project to test our reasoning, coding, debugging, and planning skills in a real-world scenario with established rules but high algorithmic complexity.

## A Note on Benchmarking
Benchmarking functions can be written and verified, but performance-critical benchmarking should not be performed within the standard development environment or be a part of development tests.

## UI Standards
*   **No `alert()`:** Never use the native `alert()` function. Instead, implement and use a non-blocking toast notification system.
*   **No `prompt()`:** Never use the native `prompt()` function. Instead, implement and use a proper modal dialog for user input.

## Active Roadmap

*No active epics. Please select the next epic from the backlog.*

## Archived Roadmap (Completed or Superseded)

See [archive/ARCHIVED_EPICS.md](archive/ARCHIVED_EPICS.md) for Epics 1-64.

## Future Enhancements (Brainstorming)

Here are some small, non-epic ideas for enhancing the application:

1.  **PGN Export:** Add a button to the frontend to export the current game history as a PGN string.
2.  **FEN Clipboard Copy:** Add a 'Copy FEN' button next to the board.
3.  **Board Flipping:** Implement a button to flip the board view (Black at bottom).
4.  **Piece Set Selection:** Add a UI option to switch between different piece themes (e.g., Alpha, Merida, Cburnett).
5.  **Board Color Themes:** Add a UI option to change the board square colors (e.g., Green/White, Blue/White, Wood).
6.  **Engine Analysis Arrows:** Visualize the engine's current best move and PV on the board using arrows.
7.  **Captured Piece Display:** Show a panel listing pieces captured by each side, with material difference.
8.  **Move Sound Effects:** Add distinct sounds for move, capture, check, and game over, with a mute toggle.
9.  **Keyboard Navigation:** Support arrow keys for navigating backward and forward through the game history.
10. **Game Clock:** Add a visual timer for both white and black, syncing with the engine's time management.
11. **Evaluation Graph:** Display a line chart showing the engine's evaluation score over the course of the game.
12. **Blindfold Mode:** Add an option to hide pieces on the board for visualization training.
13. **Coordinate Toggle:** Add a setting to show/hide rank and file coordinates on the board edges.
14. **Last Move Highlight:** Visually emphasize the `from` and `to` squares of the last played move.
15. **Legal Move Indicators:** Improve the visual hints (dots/circles) for legal moves when a piece is selected.
16. **Opening Book Explorer:** A simple UI panel showing book moves available in the current position.
17. **Perft Benchmark Button:** A dev-tool button in the UI to run a quick `perft(5)` on the current position and show nodes/time.
18. **Engine "Thinking" State:** Add a visual indicator (spinner or progress bar) when the engine is searching.
19. **Force Move:** Add a button to force the engine to move immediately (sending `stop` command).
20. **Promotion Modal:** Replace the default browser prompt (if any) or automatic Queen promotion with a custom modal for selecting promotion piece.
21. **Fullscreen Mode:** Add a button to toggle fullscreen mode for the board interface.
22. **Log Export:** Add a button to download the current session's UCI log as a text file.
