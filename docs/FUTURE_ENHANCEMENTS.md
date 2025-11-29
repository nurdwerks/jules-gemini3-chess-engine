# Future Enhancements & Roadmap

This document outlines the detailed backlog of future enhancements for the Jules & Gemini 3 Chess Engine. Each section represents an **Epic**, containing detailed **User Stories** with implementation plans and acceptance criteria.

---



### Epic 70: Time Control
**Size:** Small (2 days)
**Description:** Implementation of chess clocks and time control rules.

**User Stories:**

59. **Move Time limit for Human (S)**
    *   *Description:* Add a clock for the human player to enforce time controls.
    *   *Implementation:* JS Interval decrementing human time when `turn == human`.
    *   *Tasks:*
        - [ ] Timer logic.
        - [ ] Flag fall (Loss) logic.
    *   *Testing Plan:* Let time run out.
    *   *Acceptance Criteria:*
        - [ ] Game ends on flag fall.

60. **Increment Support (S)**
    *   *Description:* Add support for time increments (Fischer clock) in human games.
    *   *Implementation:* Add `inc` to time after move.
    *   *Tasks:*
        - [ ] Update timer logic.
    *   *Testing Plan:* Verify time increases after move.
    *   *Acceptance Criteria:*
        - [ ] Increment added correctly.

61. **Game Clock (S)**
    *   *Description:* Add a visual timer for both white and black.
    *   *Implementation:* Digital readout `MM:SS`.
    *   *Tasks:*
        - [ ] Render clock elements.
    *   *Testing Plan:* Visual check.
    *   *Acceptance Criteria:*
        - [ ] Clocks readable.

62. **Low Time Alert (S)**
    *   *Description:* Visual/Audio warning when time is running low (< 10s).
    *   *Implementation:* Flash clock red. Play "tick" sound.
    *   *Tasks:*
        - [ ] CSS class `.low-time`.
        - [ ] Audio trigger.
    *   *Testing Plan:* Run time down.
    *   *Acceptance Criteria:*
        - [ ] Warning triggers at 10s.

---

### Epic 71: Analysis Visualizations
**Size:** Large (4-5 days)
**Description:** Visual aids to help the user understand engine analysis and board state.

**User Stories:**

63. **Engine Analysis Arrows (S)**
    *   *Description:* Visualize the engine's current best move and PV on the board using arrows.
    *   *Implementation:* SVG overlay on top of board. Draw arrow from `from` to `to`.
    *   *Tasks:*
        - [ ] SVG container.
        - [ ] Arrow drawing function (math for coords).
        - [ ] Parse `bestmove`.
    *   *Testing Plan:* Enable analysis.
    *   *Acceptance Criteria:*
        - [ ] Arrow points correctly.

64. **Best Move Arrow (S)**
    *   *Description:* Display a distinct arrow color for the engine's "best move" vs. "ponder move".
    *   *Implementation:* CSS classes `.arrow-best` (Blue), `.arrow-ponder` (Green).
    *   *Tasks:*
        - [ ] Style definitions.
    *   *Testing Plan:* Visual check.
    *   *Acceptance Criteria:*
        - [ ] Distinct colors used.

65. **Threat Arrow (S)**
    *   *Description:* A specific arrow color/style to show the opponent's immediate threat.
    *   *Implementation:* If eval drops significantly on null move (if implemented) or simple attack logic. Red arrow.
    *   *Tasks:*
        - [ ] Threat detection logic.
    *   *Testing Plan:* Set up hanging piece.
    *   *Acceptance Criteria:*
        - [ ] Threat highlighted.

66. **Last Move Arrow (S)**
    *   *Description:* Option to draw an arrow for the last move instead of just highlighting squares.
    *   *Implementation:* Draw yellow arrow for `lastMove`.
    *   *Tasks:*
        - [ ] Integration with arrow layer.
    *   *Testing Plan:* Make move.
    *   *Acceptance Criteria:*
        - [ ] Arrow appears.

67. **Right-Click to Draw Arrows (S)**
    *   *Description:* Allow the user to draw custom analysis arrows on the board.
    *   *Implementation:* Mouse events on board. Right-down (start), Right-up (end). Store user arrows.
    *   *Tasks:*
        - [ ] Event handling.
        - [ ] Arrow storage/rendering.
    *   *Testing Plan:* Draw multiple arrows.
    *   *Acceptance Criteria:*
        - [ ] Arrows persist until cleared or clicked.

68. **Right-Click to Highlight Squares (S)**
    *   *Description:* Allow the user to highlight specific squares for analysis.
    *   *Implementation:* Right-click square -> toggle highlight class (Red/Green/Blue/Yellow cycle).
    *   *Tasks:*
        - [ ] Cycle logic.
    *   *Testing Plan:* Right click squares.
    *   *Acceptance Criteria:*
        - [ ] Highlights appear.

69. **Clear Analysis (S)**
    *   *Description:* Button to clear all user-drawn arrows and highlights.
    *   *Implementation:* Clear local state arrays. Re-render.
    *   *Tasks:*
        - [ ] "Clear" button (or click off board).
    *   *Testing Plan:* Draw then clear.
    *   *Acceptance Criteria:*
        - [ ] Board clean.

70. **Hover Square Highlight (S)**
    *   *Description:* Highlight the square under the mouse cursor.
    *   *Implementation:* CSS `:hover` on square elements (if div based) or JS mouseover.
    *   *Tasks:*
        - [ ] CSS rule.
    *   *Testing Plan:* Move mouse.
    *   *Acceptance Criteria:*
        - [ ] Subtle highlight follows cursor.

71. **Drag and Drop Ghost (S)**
    *   *Description:* Show a semi-transparent ghost of the piece being dragged.
    *   *Implementation:* Standard HTML5 DnD ghost or custom element following mouse.
    *   *Tasks:*
        - [ ] Set drag image.
    *   *Testing Plan:* Drag piece.
    *   *Acceptance Criteria:*
        - [ ] Ghost visible.

72. **Legal Move Indicators (S)**
    *   *Description:* Improve the visual hints (dots/circles) for legal moves.
    *   *Implementation:* Small circular `div` centered on target squares.
    *   *Tasks:*
        - [ ] SVG dot overlay.
    *   *Testing Plan:* Select Knight.
    *   *Acceptance Criteria:*
        - [ ] Valid moves clearly marked.

73. **Last Move Highlight (S)**
    *   *Description:* Visually emphasize the `from` and `to` squares of the last played move.
    *   *Implementation:* Add `.highlight-last` class to squares.
    *   *Tasks:*
        - [ ] CSS background color (yellowish).
    *   *Testing Plan:* Move piece.
    *   *Acceptance Criteria:*
        - [ ] Source and Dest highlighted.

74. **Check Highlight (S)**
    *   *Description:* Red radial gradient on the square of the king when in check.
    *   *Implementation:* Check detection -> find King -> apply `.check-highlight`.
    *   *Tasks:*
        - [ ] CSS radial gradient.
    *   *Testing Plan:* Put king in check.
    *   *Acceptance Criteria:*
        - [ ] King glows red.

75. **Threat Indicator (S)**
    *   *Description:* Optional toggle to highlight pieces that are currently under attack.
    *   *Implementation:* Loop all pieces -> isAttacked() -> highlight.
    *   *Tasks:*
        - [ ] Attack logic integration.
    *   *Testing Plan:* Toggle on.
    *   *Acceptance Criteria:*
        - [ ] Hanging pieces highlighted.

76. **King Safety Heatmap (S)**
    *   *Description:* Visual overlay showing safe and unsafe squares for the king.
    *   *Implementation:* Color squares green (safe) to red (many attackers).
    *   *Tasks:*
        - [ ] Calculate safety scores per square.
        - [ ] Overlay opacity.
    *   *Testing Plan:* Verify safe squares are green.
    *   *Acceptance Criteria:*
        - [ ] Visualizes danger zones.

77. **Mobility Heatmap (S)**
    *   *Description:* Highlight squares controlled by the currently selected piece or all pieces.
    *   *Implementation:* Visualize `attackedSquares`.
    *   *Tasks:*
        - [ ] Toggle view.
    *   *Testing Plan:* Select Queen.
    *   *Acceptance Criteria:*
        - [ ] All attacked squares lit up.

78. **Square Utilization Map (S)**
    *   *Description:* Heatmap showing which squares have been visited most often.
    *   *Implementation:* Track visit counts in game history.
    *   *Tasks:*
        - [ ] Visualization layer.
    *   *Testing Plan:* Play long game.
    *   *Acceptance Criteria:*
        - [ ] Center squares likely hotter.

79. **PieceTracker (S)**
    *   *Description:* Visual path showing where a specific piece has moved throughout the game.
    *   *Implementation:* Draw lines connecting history of a specific piece ID.
    *   *Tasks:*
        - [ ] Line drawing logic.
    *   *Testing Plan:* Click a Knight.
    *   *Acceptance Criteria:*
        - [ ] Path history shown.

80. **Outpost Highlighter (S)**
    *   *Description:* Highlight knights/bishops that are on strong outpost squares.
    *   *Implementation:* Engine logic reuse (isOutpost).
    *   *Tasks:*
        - [ ] UI highlight class.
    *   *Testing Plan:* Place N on outpost.
    *   *Acceptance Criteria:*
        - [ ] Highlighted.

81. **Weak Square Highlighter (S)**
    *   *Description:* Highlight squares that are undefended and near the king.
    *   *Implementation:* Hole detection logic.
    *   *Tasks:*
        - [ ] Visualization.
    *   *Testing Plan:* Create hole.
    *   *Acceptance Criteria:*
        - [ ] Square highlighted.

82. **Battery Highlighter (S)**
    *   *Description:* Visual indication of aligned pieces.
    *   *Implementation:* Detect Ray alignment.
    *   *Tasks:*
        - [ ] Draw connecting line.
    *   *Testing Plan:* Align R+Q.
    *   *Acceptance Criteria:*
        - [ ] Battery shown.

83. **X-Ray Highlighter (S)**
    *   *Description:* Show attacks through other pieces.
    *   *Implementation:* Bitboard magic attacks (x-ray).
    *   *Tasks:*
        - [ ] Dotted line visual.
    *   *Testing Plan:* X-ray attack.
    *   *Acceptance Criteria:*
        - [ ] Visible.

84. **Pin Visualizer (S)**
    *   *Description:* Draw a line connecting the pinning piece, the pinned piece, and the target.
    *   *Implementation:* Pin detection logic.
    *   *Tasks:*
        - [ ] Line drawing.
    *   *Testing Plan:* Pin a piece.
    *   *Acceptance Criteria:*
        - [ ] Pin relation clear.

85. **Fork Visualizer (S)**
    *   *Description:* Highlight the forking piece and its targets.
    *   *Implementation:* Double attack detection.
    *   *Tasks:*
        - [ ] Highlight targets.
    *   *Testing Plan:* Create fork.
    *   *Acceptance Criteria:*
        - [ ] Fork clear.

86. **Discovered Attack Visualizer (S)**
    *   *Description:* Highlight the moving piece and the piece revealing the attack.
    *   *Implementation:* Move generator check extension logic.
    *   *Tasks:*
        - [ ] Visual cues.
    *   *Testing Plan:* Discovered check.
    *   *Acceptance Criteria:*
        - [ ] Reveal shown.

---

### Epic 72: Statistics & Graphs
**Size:** Medium (3 days)
**Description:** Tools to visualize game data and engine performance metrics.

**User Stories:**

87. **Captured Piece Display (S)**
    *   *Description:* Show a panel listing pieces captured by each side.
    *   *Implementation:* Calculate difference in starting vs current material. Render piece icons.
    *   *Tasks:*
        - [ ] Update logic in `client.js`.
        - [ ] UI container for "Graveyard".
    *   *Testing Plan:* Capture piece.
    *   *Acceptance Criteria:*
        - [ ] Captured piece appears in list.

88. **Piece Jail (S)**
    *   *Description:* Show captured pieces in a "jail" area instead of a simple count.
    *   *Implementation:* Visual styling for the captured piece container (bars?).
    *   *Tasks:*
        - [ ] CSS styling.
    *   *Testing Plan:* Visual check.
    *   *Acceptance Criteria:*
        - [ ] Distinct visual style.

89. **Material Balance Bar (S)**
    *   *Description:* A simple visual bar showing who is ahead based on material values.
    *   *Implementation:* Calculate score (+1, +3). Render bar width relative to max material.
    *   *Tasks:*
        - [ ] Material calculation logic.
        - [ ] Bar rendering.
    *   *Testing Plan:* Capture Queen.
    *   *Acceptance Criteria:*
        - [ ] Bar shifts significantly.

90. **Material Difference Numeric (S)**
    *   *Description:* Just show "+1", "-3" next to the player names.
    *   *Implementation:* Text update in player info panel.
    *   *Tasks:*
        - [ ] Update DOM element.
    *   *Testing Plan:* Verify math.
    *   *Acceptance Criteria:*
        - [ ] Correct score shown.

91. **Evaluation Graph (S)**
    *   *Description:* Display a line chart showing the engine's evaluation score over the course of the game.
    *   *Implementation:* Use `chart.js` or SVG. Push eval to array on each move.
    *   *Tasks:*
        - [ ] Integrate charting library.
        - [ ] Data collection loop.
    *   *Testing Plan:* Play game.
    *   *Acceptance Criteria:*
        - [ ] Chart updates per move.

92. **Vertical Evaluation Bar (S)**
    *   *Description:* A gauge next to the board visualizing the current advantage.
    *   *Implementation:* Tall div with internal colored div. Height % = (Eval + Cap) / 2*Cap.
    *   *Tasks:*
        - [ ] CSS layout.
        - [ ] Update logic.
    *   *Testing Plan:* Check mate score.
    *   *Acceptance Criteria:*
        - [ ] Full bar for white/black win.

93. **Move Time Histogram (S)**
    *   *Description:* A chart showing the time spent thinking on each move of the game.
    *   *Implementation:* Bar chart of `timeTaken`.
    *   *Tasks:*
        - [ ] Track time per move.
        - [ ] Render chart.
    *   *Testing Plan:* Play fast then slow.
    *   *Acceptance Criteria:*
        - [ ] Varied bar heights.

94. **Nodes per Second Graph (S)**
    *   *Description:* A real-time graph showing the engine's speed (NPS) fluctuations.
    *   *Implementation:* Live line chart updating every `info` packet.
    *   *Tasks:*
        - [ ] Websocket handler update.
    *   *Testing Plan:* Observe during search.
    *   *Acceptance Criteria:*
        - [ ] Real-time updates.

95. **Material Chart (S)**
    *   *Description:* Line chart showing total material value over time.
    *   *Implementation:* Plot white vs black material sum per move.
    *   *Tasks:*
        - [ ] Chart logic.
    *   *Testing Plan:* Play game.
    *   *Acceptance Criteria:*
        - [ ] Lines diverge on capture.

96. **Tension Graph (S)**
    *   *Description:* Graph showing the "tension" (number of attacks/defenses) on the board.
    *   *Implementation:* Count total attacks in position. Plot over time.
    *   *Tasks:*
        - [ ] Tension calc function.
    *   *Testing Plan:* Closed vs Open position.
    *   *Acceptance Criteria:*
        - [ ] Tension spikes before trades.

97. **Connectivity Graph (S)**
    *   *Description:* Visual representation of how well pieces support each other.
    *   *Implementation:* Node-link diagram (D3.js) of piece defenders.
    *   *Tasks:*
        - [ ] Graph data structure.
    *   *Testing Plan:* Inspect visual.
    *   *Acceptance Criteria:*
        - [ ] Connected pieces shown.

98. **Move Accuracy Report: Analysis (S)**
    *   *Description:* Simple stats on move quality (Best, Good, Inaccuracy, Blunder) after game.
    *   *Implementation:* Requires full game analysis pass. Compare move eval vs best move eval.
    *   *Tasks:*
        - [ ] Batch analysis logic.
    *   *Acceptance Criteria:*
        - [ ] Moves categorized.

99. **Move Accuracy Report: UI (S)**
    *   *Description:* Report UI.
    *   *Implementation:* Table or Chart of accuracy.
    *   *Tasks:*
        - [ ] Report UI.
    *   *Acceptance Criteria:*
        - [ ] Report generated.

100. **Show WDL Stats (S)**
    *   *Description:* Toggle to show Win/Draw/Loss probabilities from the engine.
    *   *Implementation:* If engine supports `wdl` info, display it.
    *   *Tasks:*
        - [ ] Parse `info wdl`.
        - [ ] Display logic.
    *   *Testing Plan:* Check output.
    *   *Acceptance Criteria:*
        - [ ] WDL percentages shown.

101. **Engine vs. Engine Leaderboard (S)**
    *   *Description:* Track win/loss stats for different engine versions.
    *   *Implementation:* LocalStorage database of match results.
    *   *Tasks:*
        - [ ] Result recording.
        - [ ] Table view.
    *   *Testing Plan:* Finish engine duel.
    *   *Acceptance Criteria:*
        - [ ] Stats update.

---

### Epic 73: Engine Configuration & Tuning
**Size:** Medium (3 days)
**Description:** Fine-tuning controls for the engine's behavior and performance.

**User Stories:**

102. **Engine "Thinking" State (S)**
    *   *Description:* Add a visual indicator (spinner/bar) when the engine is searching.
    *   *Implementation:* Toggle CSS class `thinking` on board border or show icon.
    *   *Tasks:*
        - [ ] UI indicator.
        - [ ] Bind to `search start/stop`.
    *   *Testing Plan:* Start search.
    *   *Acceptance Criteria:*
        - [ ] Indicator active.

103. **Engine Elo Spinner (S)**
    *   *Description:* A numeric input to fine-tune the `UCI_Elo` setting directly.
    *   *Implementation:* UCI `setoption name UCI_Elo value X`.
    *   *Tasks:*
        - [ ] Number input.
        - [ ] Debounce logic.
    *   *Testing Plan:* Change Elo.
    *   *Acceptance Criteria:*
        - [ ] Engine plays weaker/stronger.

104. **Contempt Factor Spinner (S)**
    *   *Description:* Input to adjust the engine's contempt for draws.
    *   *Implementation:* `setoption name Contempt`.
    *   *Tasks:*
        - [ ] Input UI.
    *   *Testing Plan:* Verify option sent.
    *   *Acceptance Criteria:*
        - [ ] Value updates.

105. **MultiPV Slider (S)**
    *   *Description:* Slider to adjust the number of PV lines shown.
    *   *Implementation:* `setoption name MultiPV`.
    *   *Tasks:*
        - [ ] Slider (1-10).
    *   *Testing Plan:* Slide to 3.
    *   *Acceptance Criteria:*
        - [ ] 3 lines shown.

106. **Hash Size Slider (S)**
    *   *Description:* Slider to adjust the hash table size.
    *   *Implementation:* `setoption name Hash`. Requires restart usually.
    *   *Tasks:*
        - [ ] Slider (MB).
    *   *Testing Plan:* Change hash.
    *   *Acceptance Criteria:*
        - [ ] Engine acknowledges.

107. **Syzygy Path Input (S)**
    *   *Description:* Text field to set the path to Syzygy tablebases.
    *   *Implementation:* `setoption name SyzygyPath`.
    *   *Tasks:*
        - [ ] Text Input.
    *   *Testing Plan:* Set path.
    *   *Acceptance Criteria:*
        - [ ] Option sent.

108. **Show DTZ/DTM (S)**
    *   *Description:* Toggle to show Distance to Zero/Mate for endgame tablebases.
    *   *Implementation:* `setoption name SyzygyProbeLimit`.
    *   *Tasks:*
        - [ ] Toggle.
    *   *Testing Plan:* Endgame position.
    *   *Acceptance Criteria:*
        - [ ] DTZ shown.

109. **Pondering Toggle (S)**
    *   *Description:* UI checkbox to enable/disable the "Ponder" UCI option.
    *   *Implementation:* `setoption name Ponder`.
    *   *Tasks:*
        - [ ] Checkbox.
    *   *Testing Plan:* Enable.
    *   *Acceptance Criteria:*
        - [ ] Engine ponders during user time.

110. **UCI Option Presets (S)**
    *   *Description:* Ability to save and load configuration profiles.
    *   *Implementation:* Save option map to LocalStorage.
    *   *Tasks:*
        - [ ] Preset dropdown (Blitz, Analysis).
        - [ ] Save/Load logic.
    *   *Testing Plan:* Switch presets.
    *   *Acceptance Criteria:*
        - [ ] All options update.

111. **Reset Engine (S)**
    *   *Description:* Button to completely restart the engine process.
    *   *Implementation:* Send custom `restart` command to server or reload page.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click reset.
    *   *Acceptance Criteria:*
        - [ ] Engine re-initializes.

112. **Clear Hash Button (S)**
    *   *Description:* Button to explicitly clear the transposition table.
    *   *Implementation:* `setoption name Clear Hash`.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] Hash cleared.

113. **Live Tuning UI (S)**
    *   *Description:* Sliders to adjust evaluation parameters in real-time.
    *   *Implementation:* Expose weights via custom UCI options or side-channel.
    *   *Tasks:*
        - [ ] Dynamic slider generation from `Evaluation.js` params.
    *   *Testing Plan:* Adjust Pawn value.
    *   *Acceptance Criteria:*
        - [ ] Eval changes immediately.

114. **Local Engine Upload (S)**
    *   *Description:* Allow user to upload a `.wasm` or `.js` engine file to run locally.
    *   *Implementation:* Web Workers with user blob.
    *   *Tasks:*
        - [ ] File upload.
        - [ ] Worker instantiation.
    *   *Testing Plan:* Upload Stockfish.js.
    *   *Acceptance Criteria:*
        - [ ] External engine runs.

115. **Book Upload (S)**
    *   *Description:* Allow user to upload a `.bin` Polyglot book to use.
    *   *Implementation:* Send file to server or read in browser (if client-side engine).
    *   *Tasks:*
        - [ ] Upload UI.
    *   *Testing Plan:* Upload book.
    *   *Acceptance Criteria:*
        - [ ] Book moves played.

116. **Network Upload (S)**
    *   *Description:* Allow user to upload an `.nnue` file to use.
    *   *Implementation:* `setoption name UCI_NNUE_File`.
    *   *Tasks:*
        - [ ] Upload UI.
    *   *Testing Plan:* Upload net.
    *   *Acceptance Criteria:*
        - [ ] Net loaded.

117. **Cloud Engine Support (S)**
    *   *Description:* Connect to a remote UCI engine.
    *   *Implementation:* WebSocket proxy to external server.
    *   *Tasks:*
        - [ ] Connection UI (IP/Port).
    *   *Testing Plan:* Connect.
    *   *Acceptance Criteria:*
        - [ ] Remote analysis.

---

### Epic 74: Data Management (PGN/FEN)
**Size:** Medium (3 days)
**Description:** Import, export, and manage chess game data.

**User Stories:**

118. **PGN Export (S)**
    *   *Description:* Button to export the current game history as a PGN string.
    *   *Implementation:* Generate PGN header + move list.
    *   *Tasks:*
        - [ ] `exportPGN()` function.
    *   *Testing Plan:* Click Export.
    *   *Acceptance Criteria:*
        - [ ] Valid PGN string in modal/clipboard.

119. **PGN Import (S)**
    *   *Description:* Allow pasting a PGN string to load and replay a full game history.
    *   *Implementation:* Parse PGN (using library). Apply moves to board.
    *   *Tasks:*
        - [ ] Import Modal.
        - [ ] Parsing logic.
    *   *Testing Plan:* Paste game.
    *   *Acceptance Criteria:*
        - [ ] Game loaded correctly.

120. **Copy PGN to Clipboard (S)**
    *   *Description:* One-click button to copy the full PGN.
    *   *Implementation:* `navigator.clipboard.writeText()`.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click, Paste.
    *   *Acceptance Criteria:*
        - [ ] Clipboard contains PGN.

121. **Download PGN as File (S)**
    *   *Description:* Save the game as `game.pgn`.
    *   *Implementation:* Create blob, trigger download.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] File downloads.

122. **Date/Time in PGN (S)**
    *   *Description:* Automatically add the `Date` and `Time` tags to exported PGNs.
    *   *Implementation:* `new Date().toISOString()`.
    *   *Tasks:*
        - [ ] Update header generation.
    *   *Testing Plan:* Check export.
    *   *Acceptance Criteria:*
        - [ ] Tags present.

123. **Event Name in PGN (S)**
    *   *Description:* Allow setting the `Event` tag for exported PGNs.
    *   *Implementation:* Input field in Settings.
    *   *Tasks:*
        - [ ] Input UI.
    *   *Testing Plan:* Change Event name.
    *   *Acceptance Criteria:*
        - [ ] Tag updates.

124. **Username Input (S)**
    *   *Description:* Field to set the human player's name in the PGN header.
    *   *Implementation:* Input field "Player Name".
    *   *Tasks:*
        - [ ] Input UI.
    *   *Testing Plan:* Set name.
    *   *Acceptance Criteria:*
        - [ ] White/Black tag correct.

125. **FEN Clipboard Copy (S)**
    *   *Description:* Add a 'Copy FEN' button next to the board.
    *   *Implementation:* `board.fen()`.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] FEN in clipboard.

126. **FEN Input Field (S)**
    *   *Description:* A text input to manually paste and edit FEN strings.
    *   *Implementation:* Input box. On change -> `loadFen()`.
    *   *Tasks:*
        - [ ] Input UI.
    *   *Testing Plan:* Paste FEN.
    *   *Acceptance Criteria:*
        - [ ] Board updates.

127. **Copy FEN to Clipboard (URL) (S)**
    *   *Description:* Copy a direct link to the position.
    *   *Implementation:* `window.location.href + "?fen=" + fen`.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Copy, open in new tab.
    *   *Acceptance Criteria:*
        - [ ] Loads position.

128. **FEN History List (S)**
    *   *Description:* Maintain a list of previous FENs to allow jumping back.
    *   *Implementation:* Array of history states.
    *   *Tasks:*
        - [ ] UI List.
    *   *Testing Plan:* Make moves.
    *   *Acceptance Criteria:*
        - [ ] History populated.

129. **Move History Notation Toggle (S)**
    *   *Description:* Switch between SAN and LAN in the history list.
    *   *Implementation:* Toggle formatting logic.
    *   *Tasks:*
        - [ ] Switch.
    *   *Testing Plan:* Toggle.
    *   *Acceptance Criteria:*
        - [ ] e4 vs e2e4.

130. **Log Export (S)**
    *   *Description:* Add a button to download the current session's UCI log as a text file.
    *   *Implementation:* Accumulate logs in array. Download blob.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] Log file contains UCI commands.

131. **Print Score Sheet (S)**
    *   *Description:* Generate a printable PDF or HTML view of the score sheet.
    *   *Implementation:* CSS `@media print`.
    *   *Tasks:*
        - [ ] Print stylesheet.
    *   *Testing Plan:* Ctrl+P.
    *   *Acceptance Criteria:*
        - [ ] Clean layout.

132. **Export Analysis (S)**
    *   *Description:* Save the current engine analysis (PV, score) to a JSON file.
    *   *Implementation:* Dump analysis state object.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] JSON valid.

133. **Import Analysis (S)**
    *   *Description:* Load a saved JSON analysis file to review later.
    *   *Implementation:* Load JSON, populate UI.
    *   *Tasks:*
        - [ ] Upload.
    *   *Testing Plan:* Upload.
    *   *Acceptance Criteria:*
        - [ ] Analysis restored.

---

### Epic 75: Board Editor
**Size:** Medium (3 days)
**Description:** Tools for setting up custom positions.

**User Stories:**

134. **Custom FEN Start (S)**
    *   *Description:* "Setup Position" board editor where users can place pieces freely.
    *   *Implementation:* Palette of pieces. Drag to board.
    *   *Tasks:*
        - [ ] Editor Mode UI.
        - [ ] Piece Palette.
    *   *Testing Plan:* Create position.
    *   *Acceptance Criteria:*
        - [ ] Valid FEN generated.

135. **Castling Rights Editor (S)**
    *   *Description:* Checkboxes to manually toggle castling rights in setup editor.
    *   *Implementation:* Update FEN `KQkq`.
    *   *Tasks:*
        - [ ] Checkboxes.
    *   *Testing Plan:* Toggle.
    *   *Acceptance Criteria:*
        - [ ] FEN updates.

136. **En Passant Target Editor (S)**
    *   *Description:* Input to set the en passant square in setup editor.
    *   *Implementation:* Text input or click square.
    *   *Tasks:*
        - [ ] UI.
    *   *Testing Plan:* Set square.
    *   *Acceptance Criteria:*
        - [ ] FEN updates.

137. **Side to Move Editor (S)**
    *   *Description:* Toggle to switch whose turn it is in setup editor.
    *   *Implementation:* Radio button W/B.
    *   *Tasks:*
        - [ ] UI.
    *   *Testing Plan:* Switch.
    *   *Acceptance Criteria:*
        - [ ] FEN updates.

138. **Move Counter Editor (S)**
    *   *Description:* Input to set the fullmove and halfmove clocks.
    *   *Implementation:* Number inputs.
    *   *Tasks:*
        - [ ] UI.
    *   *Testing Plan:* Change numbers.
    *   *Acceptance Criteria:*
        - [ ] FEN updates.

---

### Epic 76: Developer Tools & Debugging
**Size:** Medium (3 days)
**Description:** Internal tools for developers to debug the engine and client.

**User Stories:**

139. **Perft Benchmark Button (S)**
    *   *Description:* Dev-tool button to run a quick `perft(5)` and show nodes/time.
    *   *Implementation:* Send `perft 5` command.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] Result shown.

140. **Debug Overlay (S)**
    *   *Description:* Toggle an overlay showing internal engine stats (quiescence nodes, cache hits).
    *   *Implementation:* Parse expanded `info` string.
    *   *Tasks:*
        - [ ] Overlay UI.
    *   *Testing Plan:* Enable.
    *   *Acceptance Criteria:*
        - [ ] Stats visible.

141. **Zobrist Key Display (S)**
    *   *Description:* Show the current Zobrist hash key for debugging.
    *   *Implementation:* Request key or compute locally.
    *   *Tasks:*
        - [ ] Display element.
    *   *Testing Plan:* Make move.
    *   *Acceptance Criteria:*
        - [ ] Key updates.

142. **FEN Validation Info (S)**
    *   *Description:* Show why a manually entered FEN is invalid.
    *   *Implementation:* Validator function error message.
    *   *Tasks:*
        - [ ] Error UI.
    *   *Testing Plan:* Enter bad FEN.
    *   *Acceptance Criteria:*
        - [ ] Error explained.

143. **Sanity Check (S)**
    *   *Description:* Button to run `board.validate()` and report internal state consistency.
    *   *Implementation:* Engine command `verify`.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] "State OK" or error.

144. **Force Garbage Collection (S)**
    *   *Description:* Button to trigger GC if exposed.
    *   *Implementation:* `window.gc()` (if run with flags).
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] Does not crash.

145. **Packet Inspector (S)**
    *   *Description:* Log raw UCI messages sent/received in a dedicated debug panel.
    *   *Implementation:* Monitor websocket traffic.
    *   *Tasks:*
        - [ ] Log Panel.
    *   *Testing Plan:* Watch traffic.
    *   *Acceptance Criteria:*
        - [ ] Messages scroll.

146. **Latency Meter (S)**
    *   *Description:* Measure and display the round-trip time for UCI commands.
    *   *Implementation:* Send `isready` -> measure time to `readyok`.
    *   *Tasks:*
        - [ ] Ping loop.
    *   *Testing Plan:* Check MS.
    *   *Acceptance Criteria:*
        - [ ] Latency displayed.

147. **Performance Test Suite (S)**
    *   *Description:* Frontend button to run a small suite of test positions (STS).
    *   *Implementation:* Script to run list of FENs and check bestmove.
    *   *Tasks:*
        - [ ] Test Runner.
    *   *Testing Plan:* Run suite.
    *   *Acceptance Criteria:*
        - [ ] Score reported.

148. **Engine Info Tooltip (S)**
    *   *Description:* Hovering over the engine status shows detailed version info.
    *   *Implementation:* Tooltip with `id name`, `id author`.
    *   *Tasks:*
        - [ ] Tooltip UI.
    *   *Testing Plan:* Hover.
    *   *Acceptance Criteria:*
        - [ ] Info shown.

149. **Memory Usage Indicator (S)**
    *   *Description:* Show the current RAM usage of the engine process.
    *   *Implementation:* Server reports `process.memoryUsage()`.
    *   *Tasks:*
        - [ ] Periodic update.
    *   *Testing Plan:* Observe.
    *   *Acceptance Criteria:*
        - [ ] Value updates.

150. **Thread Usage Indicator (S)**
    *   *Description:* Show how many threads are currently active.
    *   *Implementation:* Config check.
    *   *Tasks:*
        - [ ] UI.
    *   *Testing Plan:* Change threads.
    *   *Acceptance Criteria:*
        - [ ] Count correct.

151. **Hash Usage Monitor (S)**
    *   *Description:* Display the percentage of the Transposition Table currently in use.
    *   *Implementation:* Engine reports `hashfull`.
    *   *Tasks:*
        - [ ] Progress bar.
    *   *Testing Plan:* Fill hash.
    *   *Acceptance Criteria:*
        - [ ] Bar fills.

152. **Search Depth Gauge (S)**
    *   *Description:* Visual progress bar showing current search depth versus a target depth.
    *   *Implementation:* Max depth config vs current `info depth`.
    *   *Tasks:*
        - [ ] Bar UI.
    *   *Testing Plan:* Search to 20.
    *   *Acceptance Criteria:*
        - [ ] Bar grows.

153. **Null Move Input (S)**
    *   *Description:* Allow the user to manually enter a "null move" for analysis.
    *   *Implementation:* Send `0000` move.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] Turn passes.

---

### Epic 77: Move List & Annotation
**Size:** Medium (3 days)
**Description:** Enhanced game record display and annotation capabilities.

**User Stories:**

154. **Game Annotation (S)**
    *   *Description:* Automatically annotate the move list with symbols like "?", "!" based on score drops.
    *   *Implementation:* Compare eval before/after move.
    *   *Tasks:*
        - [ ] Annotation logic.
    *   *Testing Plan:* Make blunder.
    *   *Acceptance Criteria:*
        - [ ] "??" appears.

155. **Variation Tree Visualization (S)**
    *   *Description:* A graphical tree view of the variations explored by the engine.
    *   *Implementation:* D3.js tree layout of PVs.
    *   *Tasks:*
        - [ ] Tree view component.
    *   *Testing Plan:* Enable multiPV.
    *   *Acceptance Criteria:*
        - [ ] Tree expands.

156. **Promote Variation (S)**
    *   *Description:* Button to make a variation the main line in the move list.
    *   *Implementation:* Swap arrays in game history.
    *   *Tasks:*
        - [ ] Context menu "Promote".
    *   *Testing Plan:* Promote line.
    *   *Acceptance Criteria:*
        - [ ] Moves update.

157. **Delete Variation (S)**
    *   *Description:* Button to remove a specific variation branch.
    *   *Implementation:* Splicing logic.
    *   *Tasks:*
        - [ ] Context menu "Delete".
    *   *Testing Plan:* Delete.
    *   *Acceptance Criteria:*
        - [ ] Variation gone.

158. **Delete Remaining Moves (S)**
    *   *Description:* Button to truncate the game history from the current move.
    *   *Implementation:* Slice history.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click at move 10.
    *   *Acceptance Criteria:*
        - [ ] Moves 11+ gone.

159. **Comment Editor (S)**
    *   *Description:* Text area to add detailed comments to the current move.
    *   *Implementation:* Store string in move object. Render in list.
    *   *Tasks:*
        - [ ] Text area.
    *   *Testing Plan:* Add comment.
    *   *Acceptance Criteria:*
        - [ ] Comment visible.

160. **NAG Editor (S)**
    *   *Description:* Interface to add Numeric Annotation Glyphs ($1, $2, etc.) to moves.
    *   *Implementation:* Dropdown of standard NAGs.
    *   *Tasks:*
        - [ ] Dropdown.
    *   *Testing Plan:* Select "!".
    *   *Acceptance Criteria:*
        - [ ] Symbol appears.

161. **Move List Scroll Lock (S)**
    *   *Description:* Option to keep the move list scrolled to the bottom.
    *   *Implementation:* `scrollTop = scrollHeight`.
    *   *Tasks:*
        - [ ] Checkbox.
    *   *Testing Plan:* Make move.
    *   *Acceptance Criteria:*
        - [ ] List scrolls.

162. **Search Filter (S)**
    *   *Description:* Filter the game history by move number or piece.
    *   *Implementation:* Search input. Hide non-matching rows.
    *   *Tasks:*
        - [ ] Input.
    *   *Testing Plan:* Search "Nf3".
    *   *Acceptance Criteria:*
        - [ ] Only Nf3 moves shown.

163. **Opening Book Explorer (S)**
    *   *Description:* A simple UI panel showing book moves available in the current position.
    *   *Implementation:* Query server for book moves.
    *   *Tasks:*
        - [ ] Explorer Panel.
    *   *Testing Plan:* Startpos.
    *   *Acceptance Criteria:*
        - [ ] e4, d4, etc shown.

164. **Opening Name Database (S)**
    *   *Description:* Display the specific opening name dynamically.
    *   *Implementation:* Lookup ECO or name based on PGN/Moves.
    *   *Tasks:*
        - [ ] ECO DB lookup.
    *   *Testing Plan:* Play Sicilian.
    *   *Acceptance Criteria:*
        - [ ] "Sicilian Defense" shown.

165. **ECO Code Display (S)**
    *   *Description:* Show the ECO code and opening name.
    *   *Implementation:* Display code.
    *   *Tasks:*
        - [ ] UI element.
    *   *Testing Plan:* Check.
    *   *Acceptance Criteria:*
        - [ ] Code shown.

---

### Epic 78: Accessibility & Audio
**Size:** Medium (3 days)
**Description:** Making the game accessible to all users.

**User Stories:**

166. **Keyboard Navigation (S)**
    *   *Description:* Support arrow keys for navigating through the game history.
    *   *Implementation:* `keydown` listener. Left/Right arrows -> Undo/Redo.
    *   *Tasks:*
        - [ ] Listener.
    *   *Testing Plan:* Press arrows.
    *   *Acceptance Criteria:*
        - [ ] Board updates.

167. **Voice Announcement (S)**
    *   *Description:* Use Web Speech API to announce moves audibly.
    *   *Implementation:* `speechSynthesis.speak()`.
    *   *Tasks:*
        - [ ] Toggle.
        - [ ] Speech logic.
    *   *Testing Plan:* Make move.
    *   *Acceptance Criteria:*
        - [ ] "Knight to f3" spoken.

168. **Voice Control (S)**
    *   *Description:* Full voice control for navigating UI.
    *   *Implementation:* Web Speech Recognition. Command mapping.
    *   *Tasks:*
        - [ ] Microphone input.
    *   *Testing Plan:* Say "Play e4".
    *   *Acceptance Criteria:*
        - [ ] Move plays.

169. **Screen Reader Support (S)**
    *   *Description:* Ensure all moves and status updates are ARIA-live regions.
    *   *Implementation:* `aria-live="polite"` on status div.
    *   *Tasks:*
        - [ ] HTML attributes.
    *   *Testing Plan:* Use NVDA/VoiceOver.
    *   *Acceptance Criteria:*
        - [ ] Updates announced.

170. **High Contrast Mode (S)**
    *   *Description:* Accessibility mode with maximum contrast colors.
    *   *Implementation:* B/W theme.
    *   *Tasks:*
        - [ ] Toggle.
    *   *Testing Plan:* Check contrast.
    *   *Acceptance Criteria:*
        - [ ] High contrast visible.

171. **Move Sound Effects (S)**
    *   *Description:* Add distinct sounds for move, capture, check, and game over.
    *   *Implementation:* Audio files. Play on event.
    *   *Tasks:*
        - [ ] Source audio.
    *   *Testing Plan:* Play.
    *   *Acceptance Criteria:*
        - [ ] Sounds play.

172. **Checkmate Sound (S)**
    *   *Description:* A unique sound effect for checkmate.
    *   *Implementation:* Distinct file.
    *   *Tasks:*
        - [ ] Logic.
    *   *Testing Plan:* Mate.
    *   *Acceptance Criteria:*
        - [ ] Sound plays.

173. **Stalemate Sound (S)**
    *   *Description:* A unique sound effect for stalemate.
    *   *Implementation:* Distinct file.
    *   *Tasks:*
        - [ ] Logic.
    *   *Testing Plan:* Stalemate.
    *   *Acceptance Criteria:*
        - [ ] Sound plays.

174. **Sound Volume Control (S)**
    *   *Description:* Slider to adjust sound effect volume.
    *   *Implementation:* `audio.volume`.
    *   *Tasks:*
        - [ ] Slider.
    *   *Testing Plan:* Adjust.
    *   *Acceptance Criteria:*
        - [ ] Volume changes.

175. **Sound Pack Upload (S)**
    *   *Description:* Allow user to upload a zip of custom sound effects.
    *   *Implementation:* Blob URL replacement for audio sources.
    *   *Tasks:*
        - [ ] Upload UI.
    *   *Testing Plan:* Upload custom sounds.
    *   *Acceptance Criteria:*
        - [ ] Custom sounds play.

---

### Epic 79: Integration, Social & Misc
**Size:** Medium (3 days)
**Description:** Connectivity, sharing, and miscellaneous polish.

**User Stories:**

176. **Export Settings (S)**
    *   *Description:* Download all current UI settings as a JSON file.
    *   *Implementation:* Dump `localStorage`.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] File downloaded.

177. **Import Settings (S)**
    *   *Description:* Restore UI settings from a JSON file.
    *   *Implementation:* Read JSON, fill `localStorage`, reload.
    *   *Tasks:*
        - [ ] Upload.
    *   *Testing Plan:* Import.
    *   *Acceptance Criteria:*
        - [ ] Settings restored.

178. **Factory Reset (S)**
    *   *Description:* Restore all settings to default values.
    *   *Implementation:* `localStorage.clear()`.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Reset.
    *   *Acceptance Criteria:*
        - [ ] Defaults restored.

179. **Local Storage Auto-Save (S)**
    *   *Description:* Persist the current game to local storage to prevent data loss.
    *   *Implementation:* Save FEN/History on every move.
    *   *Tasks:*
        - [ ] Save logic.
    *   *Testing Plan:* Reload page.
    *   *Acceptance Criteria:*
        - [ ] Game resumes.

180. **Crash Recovery (S)**
    *   *Description:* Automatically restore the game state if the browser tab is accidentally reloaded.
    *   *Implementation:* Same as auto-save.
    *   *Tasks:*
        - [ ] Restoration logic.
    *   *Testing Plan:* Crash.
    *   *Acceptance Criteria:*
        - [ ] Recovered.

181. **Language Selection (S)**
    *   *Description:* Support for multiple languages in the UI.
    *   *Implementation:* Dictionary lookup for strings.
    *   *Tasks:*
        - [ ] Dictionary file.
        - [ ] Dropdown.
    *   *Testing Plan:* Switch language.
    *   *Acceptance Criteria:*
        - [ ] Text updates.

182. **Version Checker (S)**
    *   *Description:* Check against GitHub API if a newer version is available.
    *   *Implementation:* Fetch release tag. Compare with `package.json`.
    *   *Tasks:*
        - [ ] Check logic.
    *   *Testing Plan:* Mock API.
    *   *Acceptance Criteria:*
        - [ ] Notification if outdated.

183. **Changelog Viewer (S)**
    *   *Description:* Display the `CHANGELOG.md` within the UI.
    *   *Implementation:* Fetch markdown, render HTML.
    *   *Tasks:*
        - [ ] Modal.
    *   *Testing Plan:* Open.
    *   *Acceptance Criteria:*
        - [ ] Text visible.

184. **License Viewer (S)**
    *   *Description:* Display the `LICENSE` text within the UI.
    *   *Implementation:* Static text.
    *   *Tasks:*
        - [ ] Modal.
    *   *Testing Plan:* Open.
    *   *Acceptance Criteria:*
        - [ ] Text visible.

185. **Credits Screen (S)**
    *   *Description:* List contributors and libraries used.
    *   *Implementation:* Static list.
    *   *Tasks:*
        - [ ] Modal.
    *   *Testing Plan:* Open.
    *   *Acceptance Criteria:*
        - [ ] Credits shown.

186. **Sponsor Link (S)**
    *   *Description:* Link to GitHub Sponsors or donation page.
    *   *Implementation:* External link `<a>`.
    *   *Tasks:*
        - [ ] Link.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] Opens page.

187. **Feedback Form (S)**
    *   *Description:* Embedded form or link to open a GitHub issue.
    *   *Implementation:* Link to new issue template.
    *   *Tasks:*
        - [ ] Link.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] Opens GitHub.

188. **Lichess API Integration (S)**
    *   *Description:* Button to "Analyze on Lichess".
    *   *Implementation:* Form post to Lichess import URL with PGN.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] Opens Lichess with game.

189. **Chess.com API Integration (S)**
    *   *Description:* Button to "Analyze on Chess.com".
    *   *Implementation:* Link generation.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] Opens Chess.com.

190. **Board Screenshot (S)**
    *   *Description:* Add a button to download the current board state as an image.
    *   *Implementation:* `html2canvas` or similar.
    *   *Tasks:*
        - [ ] Button.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] Image downloaded.

191. **Export to GIF (S)**
    *   *Description:* Generate an animated GIF of the game.
    *   *Implementation:* `gif.js` combining screenshots of each move.
    *   *Tasks:*
        - [ ] Generator logic.
    *   *Testing Plan:* Generate.
    *   *Acceptance Criteria:*
        - [ ] GIF plays.

192. **Social Share (S)**
    *   *Description:* Buttons to share the game PGN/FEN to Twitter/Reddit.
    *   *Implementation:* Intent URLs.
    *   *Tasks:*
        - [ ] Icons.
    *   *Testing Plan:* Click.
    *   *Acceptance Criteria:*
        - [ ] Opens share dialog.

193. **Embed Code (S)**
    *   *Description:* Generate HTML iframe code to embed the board.
    *   *Implementation:* Text area with iframe string.
    *   *Tasks:*
        - [ ] Modal.
    *   *Testing Plan:* Copy.
    *   *Acceptance Criteria:*
        - [ ] Code valid.

194. **QR Code (S)**
    *   *Description:* Generate a QR code for the current game URL.
    *   *Implementation:* QR library.
    *   *Tasks:*
        - [ ] Modal.
    *   *Testing Plan:* Scan.
    *   *Acceptance Criteria:*
        - [ ] URL opens.

195. **Mobile App Prompt (S)**
    *   *Description:* Prompt to install the app on mobile home screen (PWA).
    *   *Implementation:* Manifest.json + service worker + install event.
    *   *Tasks:*
        - [ ] PWA setup.
    *   *Testing Plan:* Lighthouse audit.
    *   *Acceptance Criteria:*
        - [ ] Installable.

196. **Offline Mode Indicator (S)**
    *   *Description:* Visual badge showing if the app is working offline.
    *   *Implementation:* `navigator.onLine`.
    *   *Tasks:*
        - [ ] Indicator UI.
    *   *Testing Plan:* Disconnect net.
    *   *Acceptance Criteria:*
        - [ ] Badge appears.

197. **Engine Avatar (S)**
    *   *Description:* Display a robot icon or avatar for the engine.
    *   *Implementation:* Image.
    *   *Tasks:*
        - [ ] UI.
    *   *Testing Plan:* Visual.
    *   *Acceptance Criteria:*
        - [ ] Visible.

198. **Player Avatar (S)**
    *   *Description:* Allow user to upload or select an avatar for themselves.
    *   *Implementation:* File upload / LocalStorage.
    *   *Tasks:*
        - [ ] UI.
    *   *Testing Plan:* Set avatar.
    *   *Acceptance Criteria:*
        - [ ] Avatar shown.

199. **Chat Box (S)**
    *   *Description:* A simple chat interface for PvP.
    *   *Implementation:* Websocket message relay.
    *   *Tasks:*
        - [ ] Chat UI.
    *   *Testing Plan:* Send message.
    *   *Acceptance Criteria:*
        - [ ] Received.

200. **Emoji Reactions (S)**
    *   *Description:* Allow reacting to moves with emojis.
    *   *Implementation:* Floating emoji animation.
    *   *Tasks:*
        - [ ] UI.
    *   *Testing Plan:* Click emoji.
    *   *Acceptance Criteria:*
        - [ ] Animates.

201. **Confetti Effect (S)**
    *   *Description:* Particle effect on checkmate or win.
    *   *Implementation:* Canvas confetti library.
    *   *Tasks:*
        - [ ] Trigger on win.
    *   *Testing Plan:* Win game.
    *   *Acceptance Criteria:*
        - [ ] Confetti falls.

202. **Shake Effect (S)**
    *   *Description:* Screen shake on blunders or checkmate.
    *   *Implementation:* CSS animation `transform: translate`.
    *   *Tasks:*
        - [ ] Class `.shake`.
    *   *Testing Plan:* Blunder.
    *   *Acceptance Criteria:*
        - [ ] Screen shakes.

203. **Battery Saver Mode (S)**
    *   *Description:* Option to reduce animation framerate on battery.
    *   *Implementation:* Check `navigator.getBattery()`.
    *   *Tasks:*
        - [ ] Logic.
    *   *Testing Plan:* Simulate low battery.
    *   *Acceptance Criteria:*
        - [ ] FPS reduced.

204. **Interactive Tutorial (S)**
    *   *Description:* A step-by-step guide explaining how to use the UI features.
    *   *Implementation:* Overlay pointing to elements.
    *   *Tasks:*
        - [ ] Tutorial flow.
    *   *Testing Plan:* Run tutorial.
    *   *Acceptance Criteria:*
        - [ ] Steps complete.

205. **Keyboard Shortcuts Map (S)**
    *   *Description:* A modal showing all available keyboard shortcuts.
    *   *Implementation:* Static list.
    *   *Tasks:*
        - [ ] Modal.
    *   *Testing Plan:* Open.
    *   *Acceptance Criteria:*
        - [ ] List correct.

206. **Mind Control (S)**
    *   *Description:* (Joke) "Use EEG headset to make moves."
    *   *Implementation:* Text placeholder "Coming Soon".
    *   *Tasks:*
        - [ ] Joke UI.
    *   *Testing Plan:* Look for it.
    *   *Acceptance Criteria:*
        - [ ] Laugh.

207. **Game Over Modal (S)**
    *   *Description:* A popup summary when the game ends.
    *   *Implementation:* Modal with result, reason, stats.
    *   *Tasks:*
        - [ ] Modal.
    *   *Testing Plan:* End game.
    *   *Acceptance Criteria:*
        - [ ] Modal appears.
