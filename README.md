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

Here are some small, non-epic ideas for enhancing the application, categorized by functionality:

### User Interface & Experience
1.  **Board Flipping:** Implement a button to flip the board view (Black at bottom).
2.  **Piece Set Selection:** Add a UI option to switch between different piece themes (e.g., Alpha, Merida, Cburnett).
3.  **Board Color Themes:** Add a UI option to change the board square colors (e.g., Green/White, Blue/White, Wood).
4.  **Board Size Slider:** Slider to dynamically resize the board (Small, Medium, Large).
5.  **Fullscreen Mode:** Add a button to toggle fullscreen mode for the board interface.
6.  **Zen Mode:** A toggle to hide all UI elements except the board and clock.
7.  **Compact Layout:** A dense UI layout for small screens/mobile.
8.  **Sidebar Toggle:** Button to collapse the sidebar (move list/controls) for a larger board view.
9.  **Coordinate Toggle:** Add a setting to show/hide rank and file coordinates on the board edges.
10. **Coordinates Outside Board:** Option to render coordinates outside the board square instead of overlaying them.
11. **Dark Mode Toggle:** A dedicated toggle for the entire UI theme (Light/Dark), separate from board colors.
12. **Piece Style: 3D:** Add a set of 3D-rendered piece images.
13. **Piece Style: Pixel Art:** Add a retro 8-bit piece set.
14. **Board Style: Glass:** A translucent/glass-effect board theme.
15. **Board Style: Newspaper:** A black and white high-contrast print style theme.
16. **Custom Theme Editor:** Allow users to pick custom hex colors for the board instead of using presets.
17. **Custom CSS Import:** Allow users to upload or paste custom CSS to style the board.
18. **Engine Avatar:** Display a robot icon or avatar for the engine that changes expression based on evaluation.
19. **Player Avatar:** Allow user to upload or select an avatar for themselves.
20. **Confetti Effect:** Particle effect on checkmate or win.
21. **Shake Effect:** Screen shake on blunders or checkmate.
22. **Piece Animation Speed:** Configurable speed for piece movement animations.
23. **Evaluation Bar Animation:** Smooth transition animations for the evaluation bar as the score changes.

### Game Play & Modes
24. **PvP Mode:** A "Two Player" mode that disables the engine and allows two humans to play on the same screen.
25. **Engine Self-Play Button:** A button to make the engine play against itself from the current position.
26. **Engine Duel:** Configure and run a match between two different engine versions or settings.
27. **Tournament Manager:** A simple UI to automate round-robin matches between configured engines.
28. **Blindfold Mode:** Add an option to hide pieces on the board for visualization training.
29. **Blindfold Training:** A mode where pieces disappear after a few seconds.
30. **Memory Training:** Show a position for 5 seconds, then ask the user to reconstruct it.
31. **Tactics Trainer:** Load random tactical positions from a database for the user to solve.
32. **Endgame Trainer:** Load standard endgame positions (e.g., K+P vs K) for practice.
33. **Guess the Move:** A game mode where the user guesses the next GM move in a loaded game.
34. **Vote Chess:** (Brainstorming) Allow multiple viewers to vote on the next move (Twitch integration).
35. **Daily Puzzle:** Fetch and display a daily chess puzzle for the user to solve.
36. **Handicap Mode:** Allow starting the game with material odds (e.g., Knight odds).
37. **Armageddon Mode:** Preset time controls for Armageddon (White has more time but must win).
38. **Chess960 Generator:** Button to generate a random Fischer Random (Chess960) starting position.
39. **Resign Button:** A button for the human player to resign the game.
40. **Draw Offer:** A button to offer a draw to the engine.
41. **Takeback Move:** Button to undo the last half-move or full turn during a game against the engine.
42. **Force Move:** Add a button to force the engine to move immediately.
43. **Premoves:** Allow the user to input a move while the engine is still thinking.
44. **Move Confirmation:** Optional setting to require a second click to confirm a move.
45. **Auto-Queen Toggle:** Option to always automatically promote to Queen without showing a selection modal.
46. **Promotion Modal:** Custom modal for selecting promotion piece.
47. **Move Time limit for Human:** Add a clock for the human player to enforce time controls.
48. **Increment Support:** Add support for time increments (Fischer clock) in human games.
49. **Game Clock:** Add a visual timer for both white and black.
50. **Low Time Alert:** Visual/Audio warning when time is running low (< 10s).
51. **Game Over Modal:** A popup summary when the game ends (Result, Reason, Elo change).

### Analysis & Visualization
52. **Engine Analysis Arrows:** Visualize the engine's current best move and PV on the board using arrows.
53. **Best Move Arrow:** Display a distinct arrow color for the engine's "best move" vs. "ponder move".
54. **Threat Arrow:** A specific arrow color/style to show the opponent's immediate threat.
55. **Last Move Arrow:** Option to draw an arrow for the last move instead of just highlighting squares.
56. **Right-Click to Draw Arrows:** Allow the user to draw custom analysis arrows on the board.
57. **Right-Click to Highlight Squares:** Allow the user to highlight specific squares for analysis.
58. **Clear Analysis:** Button to clear all user-drawn arrows and highlights.
59. **Hover Square Highlight:** Highlight the square under the mouse cursor.
60. **Drag and Drop Ghost:** Show a semi-transparent ghost of the piece being dragged.
61. **Legal Move Indicators:** Improve the visual hints (dots/circles) for legal moves.
62. **Last Move Highlight:** Visually emphasize the `from` and `to` squares of the last played move.
63. **Check Highlight:** Red radial gradient on the square of the king when in check.
64. **Threat Indicator:** Optional toggle to highlight pieces that are currently under attack.
65. **Captured Piece Display:** Show a panel listing pieces captured by each side.
66. **Material Balance Bar:** A simple visual bar showing who is ahead based on material values.
67. **Material Difference Numeric:** Just show "+1", "-3" next to the player names.
68. **Evaluation Graph:** Display a line chart showing the engine's evaluation score over the course of the game.
69. **Vertical Evaluation Bar:** A gauge next to the board visualizing the current advantage.
70. **Move Time Histogram:** A chart showing the time spent thinking on each move of the game.
71. **Nodes per Second Graph:** A real-time graph showing the engine's speed (NPS) fluctuations.
72. **Variation Tree Visualization:** A graphical tree view of the variations explored by the engine.
73. **King Safety Heatmap:** Visual overlay showing safe and unsafe squares for the king.
74. **Mobility Heatmap:** Highlight squares controlled by the currently selected piece or all pieces.
75. **Square Utilization Map:** Heatmap showing which squares have been visited most often.
76. **PieceTracker:** Visual path showing where a specific piece has moved throughout the game.
77. **Tension Graph:** Graph showing the "tension" (number of attacks/defenses) on the board.
78. **Connectivity Graph:** Visual representation of how well pieces support each other.
79. **Outpost Highlighter:** Highlight knights/bishops that are on strong outpost squares.
80. **Weak Square Highlighter:** Highlight squares that are undefended and near the king.
81. **Battery Highlighter:** Visual indication of aligned pieces.
82. **X-Ray Highlighter:** Show attacks through other pieces.
83. **Pin Visualizer:** Draw a line connecting the pinning piece, the pinned piece, and the target.
84. **Fork Visualizer:** Highlight the forking piece and its targets.
85. **Discovered Attack Visualizer:** Highlight the moving piece and the piece revealing the attack.
86. **Game Annotation:** Automatically annotate the move list with symbols like "?", "!" based on score drops.
87. **Move Accuracy Report:** Simple stats on move quality (Best, Good, Inaccuracy, Blunder) after game.
88. **Opening Book Explorer:** A simple UI panel showing book moves available in the current position.
89. **Opening Name Database:** Display the specific opening name dynamically.
90. **ECO Code Display:** Show the ECO code and opening name.
91. **Show WDL Stats:** Toggle to show Win/Draw/Loss probabilities from the engine.
92. **Show DTZ/DTM:** Toggle to show Distance to Zero/Mate for endgame tablebases.

### Engine Configuration & Tuning
93. **Engine "Thinking" State:** Add a visual indicator (spinner/bar) when the engine is searching.
94. **Engine Elo Spinner:** A numeric input to fine-tune the `UCI_Elo` setting directly.
95. **Contempt Factor Spinner:** Input to adjust the engine's contempt for draws.
96. **MultiPV Slider:** Slider to adjust the number of PV lines shown.
97. **Hash Size Slider:** Slider to adjust the hash table size.
98. **Syzygy Path Input:** Text field to set the path to Syzygy tablebases.
99. **Pondering Toggle:** UI checkbox to enable/disable the "Ponder" UCI option.
100. **UCI Option Presets:** Ability to save and load configuration profiles.
101. **Reset Engine:** Button to completely restart the engine process.
102. **Clear Hash Button:** Button to explicitly clear the transposition table.
103. **Live Tuning UI:** Sliders to adjust evaluation parameters in real-time.
104. **Local Engine Upload:** Allow user to upload a `.wasm` or `.js` engine file to run locally.
105. **Book Upload:** Allow user to upload a `.bin` Polyglot book to use.
106. **Network Upload:** Allow user to upload an `.nnue` file to use.
107. **Hash Usage Monitor:** Display the percentage of the Transposition Table currently in use.
108. **Search Depth Gauge:** Visual progress bar showing current search depth versus a target depth.

### Data Management (PGN/FEN)
109. **PGN Export:** Button to export the current game history as a PGN string.
110. **PGN Import:** Allow pasting a PGN string to load and replay a full game history.
111. **Copy PGN to Clipboard:** One-click button to copy the full PGN.
112. **Download PGN as File:** Save the game as `game.pgn`.
113. **Date/Time in PGN:** Automatically add the `Date` and `Time` tags to exported PGNs.
114. **Event Name in PGN:** Allow setting the `Event` tag for exported PGNs.
115. **Username Input:** Field to set the human player's name in the PGN header.
116. **FEN Clipboard Copy:** Add a 'Copy FEN' button next to the board.
117. **FEN Input Field:** A text input to manually paste and edit FEN strings.
118. **Custom FEN Start:** "Setup Position" board editor where users can place pieces freely.
119. **Copy FEN to Clipboard (URL):** Copy a direct link to the position.
120. **FEN History List:** Maintain a list of previous FENs to allow jumping back.
121. **Move History Notation Toggle:** Switch between SAN and LAN in the history list.
122. **Log Export:** Add a button to download the current session's UCI log as a text file.
123. **Print Score Sheet:** Generate a printable PDF or HTML view of the score sheet.
124. **Export Analysis:** Save the current engine analysis (PV, score) to a JSON file.
125. **Import Analysis:** Load a saved JSON analysis file to review later.
126. **Export Settings:** Download all current UI settings as a JSON file.
127. **Import Settings:** Restore UI settings from a JSON file.
128. **Factory Reset:** Restore all settings to default values.
129. **Local Storage Auto-Save:** Persist the current game to local storage to prevent data loss.
130. **Crash Recovery:** Automatically restore the game state if the browser tab is accidentally reloaded.

### Developer Tools & Debugging
131. **Perft Benchmark Button:** Dev-tool button to run a quick `perft(5)` and show nodes/time.
132. **Debug Overlay:** Toggle an overlay showing internal engine stats (quiescence nodes, cache hits).
133. **Zobrist Key Display:** Show the current Zobrist hash key for debugging.
134. **FEN Validation Info:** Show why a manually entered FEN is invalid.
135. **Sanity Check:** Button to run `board.validate()` and report internal state consistency.
136. **Force Garbage Collection:** Button to trigger GC if exposed.
137. **Packet Inspector:** Log raw UCI messages sent/received in a dedicated debug panel.
138. **Latency Meter:** Measure and display the round-trip time for UCI commands.
139. **System Messages Panel:** A dedicated area for system notifications and errors.
140. **Performance Test Suite:** Frontend button to run a small suite of test positions (STS).
141. **Engine Info Tooltip:** Hovering over the engine status shows detailed version info.
142. **Memory Usage Indicator:** Show the current RAM usage of the engine process.
143. **Thread Usage Indicator:** Show how many threads are currently active.
144. **Null Move Input:** Allow the user to manually enter a "null move" for analysis.
145. **Promote Variation:** Button to make a variation the main line in the move list.
146. **Delete Variation:** Button to remove a specific variation branch.
147. **Delete Remaining Moves:** Button to truncate the game history from the current move.
148. **Comment Editor:** Text area to add detailed comments to the current move.
149. **NAG Editor:** Interface to add Numeric Annotation Glyphs ($1, $2, etc.) to moves.

### Accessibility & Audio
150. **Keyboard Navigation:** Support arrow keys for navigating through the game history.
151. **Voice Announcement:** Use Web Speech API to announce moves audibly.
152. **Voice Control:** Full voice control for navigating UI.
153. **Screen Reader Support:** Ensure all moves and status updates are ARIA-live regions.
154. **High Contrast Mode:** Accessibility mode with maximum contrast colors.
155. **Move Sound Effects:** Add distinct sounds for move, capture, check, and game over.
156. **Checkmate Sound:** A unique sound effect for checkmate.
157. **Stalemate Sound:** A unique sound effect for stalemate.
158. **Sound Volume Control:** Slider to adjust sound effect volume.
159. **Low Time Alert:** Audio warning when time is running low.

### Miscellaneous & Fun
160. **Castling Rights Editor:** Checkboxes to manually toggle castling rights in setup editor.
161. **En Passant Target Editor:** Input to set the en passant square in setup editor.
162. **Side to Move Editor:** Toggle to switch whose turn it is in setup editor.
163. **Move Counter Editor:** Input to set the fullmove and halfmove clocks.
164. **Piece Jail:** Show captured pieces in a "jail" area instead of a simple count.
165. **Board Screenshot:** Add a button to download the current board state as an image.
166. **Export to GIF:** Generate an animated GIF of the game.
167. **Social Share:** Buttons to share the game PGN/FEN to Twitter/Reddit.
168. **Embed Code:** Generate HTML iframe code to embed the board.
169. **QR Code:** Generate a QR code for the current game URL.
170. **Mobile App Prompt:** Prompt to install the app on mobile home screen (PWA).
171. **Offline Mode Indicator:** Visual badge showing if the app is working offline.
172. **Battery Saver Mode:** Option to reduce animation framerate on battery.
173. **Interactive Tutorial:** A step-by-step guide explaining how to use the UI features.
174. **Keyboard Shortcuts Map:** A modal showing all available keyboard shortcuts.
175. **Language Selection:** Support for multiple languages in the UI.
176. **Version Checker:** Check against GitHub API if a newer version is available.
177. **Changelog Viewer:** Display the `CHANGELOG.md` within the UI.
178. **License Viewer:** Display the `LICENSE` text within the UI.
179. **Credits Screen:** List contributors and libraries used.
180. **Sponsor Link:** Link to GitHub Sponsors or donation page.
181. **Feedback Form:** Embedded form or link to open a GitHub issue.
182. **Lichess API Integration:** Button to "Analyze on Lichess".
183. **Chess.com API Integration:** Button to "Analyze on Chess.com".
184. **Cloud Engine Support:** Connect to a remote UCI engine.
185. **Streamer Mode:** A layout optimized for OBS capture.
186. **Opening Repertoire Builder:** Allow users to save their favorite opening lines.
187. **Engine vs. Engine Leaderboard:** Track win/loss stats for different engine versions.
188. **Chat Box:** A simple chat interface for PvP.
189. **Emoji Reactions:** Allow reacting to moves with emojis.
190. **Game Speed Slider:** Control the playback speed of game history.
191. **Auto-Flip Board:** Automatically rotate the board to face the side whose turn it is.
192. **Click-to-Move:** Support click-origin-then-click-destination interaction.
193. **Right-Click to Cancel:** Right-clicking while dragging a piece cancels the move.
194. **Move List Scroll Lock:** Option to keep the move list scrolled to the bottom.
195. **Search Filter:** Filter the game history by move number or piece.
196. **Theme Upload:** Allow user to upload a JSON theme file.
197. **Piece Set Upload:** Allow user to upload a folder/zip of SVG piece images.
198. **Sound Pack Upload:** Allow user to upload a zip of custom sound effects.
199. **Material Chart:** Line chart showing total material value over time.
200. **Mind Control:** (Joke) "Use EEG headset to make moves."
