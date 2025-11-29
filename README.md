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
23. **Move History Notation Toggle:** Switch between SAN (Standard Algebraic) and LAN (Long Algebraic) in the history list.
24. **Engine Self-Play Button:** A button to make the engine play against itself from the current position.
25. **ECO Code Display:** Show the ECO code and opening name for the current position if available.
26. **Material Balance Bar:** A simple visual bar showing who is ahead based on material values.
27. **PvP Mode:** A "Two Player" mode that disables the engine and allows two humans to play on the same screen.
28. **FEN Input Field:** A text input to manually paste and edit FEN strings to set up positions directly.
29. **Auto-Queen Toggle:** Option to always automatically promote to Queen without showing a selection modal.
30. **Resign Button:** A button for the human player to resign the game.
31. **Draw Offer:** A button to offer a draw to the engine (engine accepts if score is near 0.00).
32. **Threat Indicator:** Optional toggle to highlight pieces that are currently under attack by the opponent.
33. **Pondering Toggle:** specific UI checkbox to enable/disable the "Ponder" UCI option.
34. **Nodes per Second Graph:** A real-time graph showing the engine's speed (NPS) fluctuations.
35. **Search Depth Gauge:** Visual progress bar showing current search depth versus a target depth.
36. **Hash Usage Monitor:** Display the percentage of the Transposition Table currently in use.
37. **UCI Option Presets:** Ability to save and load configuration profiles (e.g., "Blitz", "Analysis", "Weak").
38. **Game Annotation:** Automatically annotate the move list with symbols like "?", "!", or "??" based on score drops.
39. **PGN Import:** Allow pasting a PGN string to load and replay a full game history.
40. **Custom Theme Editor:** Allow users to pick custom hex colors for the board instead of using presets.
41. **Takeback Move:** Button to undo the last half-move or full turn during a game against the engine.
42. **Voice Announcement:** Use the Web Speech API to announce moves audibly (e.g., "Knight to f3").
43. **Performance Test Suite:** Frontend button to run a small suite of test positions (STS) and report the score.
44. **Debug Overlay:** Toggle an overlay showing internal engine stats like quiescence nodes or cache hit rates.
45. **Daily Puzzle:** Fetch and display a daily chess puzzle for the user to solve.
46. **Move Time Histogram:** A chart showing the time spent thinking on each move of the game.
47. **System Messages Panel:** A dedicated area for system notifications and errors, separate from toasts.
48. **Board Screenshot:** Add a button to download the current board state as a PNG or JPG image.
49. **FEN History List:** Maintain a list of previous FENs to allow jumping back to specific game states.
50. **Variation Tree Visualization:** A graphical tree view of the variations explored by the engine.
51. **Engine Duel:** Configure and run a match between two different engine versions or settings.
52. **Tournament Manager:** A simple UI to automate round-robin matches between configured engines.
53. **King Safety Heatmap:** Visual overlay showing safe and unsafe squares for the king.
54. **Mobility Heatmap:** Highlight squares controlled by the currently selected piece or all pieces.
55. **Click-to-Move:** Support click-origin-then-click-destination interaction in addition to drag-and-drop.
56. **Premoves:** Allow the user to input a move while the engine is still thinking.
57. **Game Speed Slider:** Control the playback speed of game history or self-play matches.
58. **Auto-Flip Board:** Option to automatically rotate the board to face the side whose turn it is.
59. **Zen Mode:** A toggle to hide all UI elements except the board and clock.
60. **Vertical Evaluation Bar:** A gauge next to the board visualizing the current advantage (like Lichess/Chess.com).
61. **Best Move Arrow:** Display a distinct arrow color for the engine's "best move" vs. "ponder move".
62. **Live Tuning UI:** Sliders to adjust evaluation parameters (e.g., mobility weights) in real-time.
63. **Crash Recovery:** Automatically restore the game state if the browser tab is accidentally reloaded.
64. **Local Storage Auto-Save:** Persist the current game to local storage to prevent data loss.
65. **Custom CSS Import:** Allow users to upload or paste custom CSS to style the board.
66. **Move Confirmation:** Optional setting to require a second click to confirm a move (prevention of mouseslips).
