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
67. **Opening Name Database:** Display the specific opening name (e.g., "Sicilian Defense: Najdorf Variation") dynamically as moves are played.
68. **Sound Volume Control:** A slider to adjust the volume of sound effects, independent of the system volume.
69. **Piece Animation Speed:** Configurable speed for piece movement animations (Slow, Normal, Fast, Instant).
70. **Evaluation Bar Animation:** Smooth transition animations for the evaluation bar as the score changes.
71. **Threat Arrow:** A specific arrow color/style to show the opponent's immediate threat if they were to move again.
72. **Checkmate Sound:** A unique sound effect distinct from regular checks when checkmate is delivered.
73. **Stalemate Sound:** A unique sound effect for stalemate or draw.
74. **Game Over Modal:** A popup summary when the game ends (Result, Reason, Elo change if applicable).
75. **Coordinates Outside Board:** Option to render coordinates outside the board square instead of overlaying them.
76. **Dark Mode Toggle:** A dedicated toggle for the entire UI theme (Light/Dark), separate from board colors.
77. **Piece Style: 3D:** Add a set of 3D-rendered piece images.
78. **Piece Style: Pixel Art:** Add a retro 8-bit piece set.
79. **Board Style: Glass:** A translucent/glass-effect board theme.
80. **Board Style: Newspaper:** A black and white high-contrast print style theme.
81. **Engine Avatar:** Display a robot icon or avatar for the engine that changes expression based on evaluation (e.g., sweating when losing).
82. **Player Avatar:** Allow user to upload or select an avatar for themselves.
83. **Username Input:** Simple field to set the human player's name in the PGN header.
84. **Date/Time in PGN:** Automatically add the `Date` and `Time` tags to exported PGNs.
85. **Event Name in PGN:** Allow setting the `Event` tag for exported PGNs.
86. **Copy PGN to Clipboard:** One-click button to copy the full PGN.
87. **Copy FEN to Clipboard (URL):** Copy a direct link to the position (e.g., `?fen=...`) if URL routing is implemented.
88. **Download PGN as File:** Save the game as `game.pgn`.
89. **Print Score Sheet:** Generate a printable PDF or HTML view of the score sheet.
90. **Move List Scroll Lock:** Option to keep the move list scrolled to the bottom automatically.
91. **Highlight King Check:** Red radial gradient on the square of the king when in check.
92. **Last Move Arrow:** Option to draw an arrow for the last move instead of just highlighting squares.
93. **Hover Square Highlight:** Highlight the square under the mouse cursor.
94. **Drag and Drop Ghost:** Show a semi-transparent ghost of the piece being dragged.
95. **Right-Click to Cancel:** Right-clicking while dragging a piece cancels the move.
96. **Right-Click to Draw Arrows:** Allow the user to draw custom analysis arrows on the board.
97. **Right-Click to Highlight Squares:** Allow the user to highlight specific squares (red/green/blue) for analysis.
98. **Clear Analysis:** Button to clear all user-drawn arrows and highlights.
99. **Engine Info Tooltip:** Hovering over the engine status shows detailed version and author info.
100. **Memory Usage Indicator:** Show the current RAM usage of the engine process (if retrievable).
101. **Thread Usage Indicator:** Show how many threads are currently active.
102. **Custom FEN Start:** "Setup Position" board editor where users can place pieces freely.
103. **Castling Rights Editor:** Checkboxes to manually toggle castling rights in the setup editor.
104. **En Passant Target Editor:** Input to set the en passant square in the setup editor.
105. **Side to Move Editor:** Toggle to switch whose turn it is in the setup editor.
106. **Move Counter Editor:** Input to set the fullmove and halfmove clocks.
107. **Piece Jail:** Show captured pieces in a "jail" area instead of a simple count.
108. **Material Difference Numeric:** Just show "+1", "-3" next to the player names.
109. **Engine Elo Spinner:** A numeric input to fine-tune the `UCI_Elo` setting directly.
110. **Contempt Factor Spinner:** Input to adjust the engine's contempt for draws.
111. **MultiPV Slider:** Slider to adjust the number of PV lines shown (1-5).
112. **Hash Size Slider:** Slider to adjust the hash table size (in MB).
113. **Syzygy Path Input:** Text field to set the path to Syzygy tablebases.
114. **Show WDL Stats:** Toggle to show Win/Draw/Loss probabilities from the engine (if supported).
115. **Show DTZ/DTM:** Toggle to show Distance to Zero/Mate for endgame tablebases.
116. **Reset Engine:** Button to completely restart the engine process (useful if it hangs).
117. **Clear Hash Button:** Button to explicitly clear the transposition table.
118. **Lichess API Integration:** (Brainstorming) Button to "Analyze on Lichess".
119. **Chess.com API Integration:** (Brainstorming) Button to "Analyze on Chess.com".
120. **Export to GIF:** Generate an animated GIF of the game.
