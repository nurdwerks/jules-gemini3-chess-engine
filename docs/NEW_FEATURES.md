# Product Backlog: New Features

This document groups the proposed features into strategic Epics, broken down into User Stories with detailed specifications, implementation plans, and acceptance criteria.

**Estimation Scale (Fibonacci):**
*   **1 Point:** Trivial change (Minutes/Hours)
*   **2 Points:** Small change (1 Day)
*   **3 Points:** Medium complexity (2-3 Days)
*   **5 Points:** Large complexity (1 Week)
*   **8 Points:** Very Large/Complex (2 Weeks+)

---

## Epic 1: Engine Intelligence & Analysis
**Goal:** Enhance the engine's capability to analyze positions, explain its reasoning, and play with varied styles.

### Feature: Syzygy Tablebase Support
*   **Story 1.1: Backend Syzygy Probing**
    *   **Description:** As a developer, I want to implement efficient Syzygy WDL probing in the backend so the engine plays perfectly in 6-piece endgames.
    *   **Implementation Details:**
        *   Complete `src/engine/Syzygy.js`.
        *   Use `fs` to read `.rtbw` and `.rtbz` files.
        *   Implement the Fathom probing code (ported to JS or via N-API/Wasm). *Note: A pure JS implementation is preferred for portability if performance allows.*
        *   Integrate `probeWDL` into `Search.js` root and search tree (pruning).
    *   **Acceptance Criteria:**
        *   [ ] `Syzygy.probeWDL(board)` returns correct Win/Loss/Draw scores for known positions.
        *   [ ] `Search.js` uses TB results to cut off search immediately in winning/losing endgames.
        *   [ ] Engine announces "Mate in X" or "Tablebase Win" correctly.
    *   **Points:** 8

*   **Story 1.2: Frontend Tablebase UI**
    *   **Description:** As a user, I want a "Tablebase" panel in the frontend showing the WDL status and Distance-to-Zero (DTZ) for all legal moves.
    *   **Implementation Details:**
        *   Create `public/js/TablebasePanel.js`.
        *   Listen for `info string` messages from UCI containing TB data.
        *   Render a table with columns: Move, Result (Win/Draw/Loss), DTZ.
    *   **Acceptance Criteria:**
        *   [ ] Panel appears automatically when pieces <= 6 (or configured limit).
        *   [ ] Shows correct WDL/DTZ stats for all legal moves.
        *   [ ] Clicking a move makes it on the board.
    *   **Points:** 3

### Feature: Engine Personalities
*   **Story 1.3: UCI Persona Configuration**
    *   **Description:** As a user, I want to select a "Persona" (e.g., Tal, Petrosian) via UCI options to face different playing styles.
    *   **Implementation Details:**
        *   Add `UCI_Persona` combo option in `src/engine/UCI.js`.
        *   Define persona profiles in `src/engine/Personas.js` (e.g., `{ Tal: { dynamic: 1.2, safety: 0.8 }, Petrosian: { safety: 1.5, space: 1.2 } }`).
    *   **Acceptance Criteria:**
        *   [ ] User can select "Tal", "Petrosian", "Stockfish-like" from settings.
        *   [ ] Engine acknowledges the option change.
    *   **Points:** 2

*   **Story 1.4: Dynamic Evaluation Scaling**
    *   **Description:** As a developer, I want to implement dynamic evaluation weight scaling based on the selected persona.
    *   **Implementation Details:**
        *   Modify `src/engine/Evaluation.js` to accept a `weights` object.
        *   Multiply base terms (Material, Mobility, Safety) by persona weights.
        *   Example: Aggressive persona multiplies `KingAttack` score by 1.2.
    *   **Acceptance Criteria:**
        *   [ ] "Tal" persona plays significantly more aggressive moves in test positions.
        *   [ ] "Petrosian" persona avoids creating pawn weaknesses.
    *   **Points:** 5

*   **Story 1.5: Swindler Mode**
    *   **Description:** As a developer, I want to implement "Swindler" logic that uses contempt and complexity metrics to complicate lost positions.
    *   **Implementation Details:**
        *   In `Search.js`, if `score < -200` (losing):
            *   Increase `Contempt` factor.
            *   Prioritize moves with high branching factor (complexity) over "best" moves that lead to simple losses.
            *   Avoid trading pieces (keep complexity high).
    *   **Acceptance Criteria:**
        *   [ ] In a lost position, engine avoids simplifying trades.
        *   [ ] Engine chooses moves that maximize the opponent's error probability (requires simple complexity heuristic).
    *   **Points:** 5

### Feature: Advanced Tuning Dashboard
*   **Story 1.6: Tuning Web Interface**
    *   **Description:** As a developer, I want a Web GUI to start/stop tuning sessions and view real-time error reduction graphs.
    *   **Implementation Details:**
        *   Create `public/tuning.html` (or a view in main app).
        *   Add WebSocket handlers in `src/plugins/tuning.js` to bridge frontend to `tools/Tuner.js`.
        *   Stream `epoch`, `error`, and `elo` data to the client.
    *   **Acceptance Criteria:**
        *   [ ] Button "Start Tuning" triggers backend tuning process.
        *   [ ] Graph updates in real-time as generations pass.
    *   **Points:** 5

*   **Story 1.7: Evaluation Heatmap UI**
    *   **Description:** As a user, I want a visual "Heatmap" UI to manually adjust Piece-Square Tables and see the effect on evaluation.
    *   **Implementation Details:**
        *   Frontend: Render 8x8 grids for each piece type.
        *   Color squares based on PST value (Red=Bad, Green=Good).
        *   Allow clicking/dragging to adjust values and send `setoption` to engine.
    *   **Acceptance Criteria:**
        *   [ ] Visual representation matches `src/engine/EvaluationConstants.js`.
        *   [ ] Changing a square in UI updates the engine's evaluation immediately (verified by `eval` command).
    *   **Points:** 3

### Feature: Natural Language Game Annotation
*   **Story 1.8: Narrative Generation**
    *   **Description:** As a user, I want the engine to generate a text summary of my game, highlighting key turning points and blunders.
    *   **Implementation Details:**
        *   Create `src/analysis/Narrator.js`.
        *   Input: List of moves and Eval history.
        *   Rules:
            *   Eval swing > 2.0 -> "Blunder".
            *   Eval swing > 1.0 -> "Mistake".
            *   Opening phase -> Look up move in `Polyglot` book for name ("French Defense").
    *   **Acceptance Criteria:**
        *   [ ] Generates a paragraph summary after game analysis.
        *   [ ] Correctly identifies the opening name.
        *   [ ] Correctly identifies the move that caused the biggest evaluation drop.
    *   **Points:** 5

*   **Story 1.9: Evaluation to Text Mapping**
    *   **Description:** As a developer, I want to map engine score fluctuations to narrative templates.
    *   **Implementation Details:**
        *   Define templates: `["White is winning", "Black has a slight edge", "The position is equal"]`.
        *   Map numerical ranges (e.g., +0.5 to +1.0) to these templates.
        *   Detect tactical motifs (forks/pins) if possible (using `VisualizationManager.js` logic).
    *   **Acceptance Criteria:**
        *   [ ] Text output varies based on score (not just "Score is 1.5").
        *   [ ] Mentions specifics like "White plays a quiet move" vs "White captures".
    *   **Points:** 3

---

## Epic 2: Training & Education
**Goal:** Provide tools for users to improve their chess skills through practice and study.

### Feature: Interactive Opening Explorer
*   **Story 2.1: Lichess API Integration**
    *   **Description:** As a user, I want to see opening statistics (Win/Draw/Loss) for the current board position sourced from the Lichess Masters database.
    *   **Implementation Details:**
        *   Update `public/js/OpeningExplorer.js`.
        *   On move, fetch `https://explorer.lichess.ovh/masters?fen={fen}`.
        *   Display resulting moves and stats in a table.
        *   Cache results to minimize API calls.
    *   **Acceptance Criteria:**
        *   [ ] Shows top moves played by masters.
        *   [ ] Correctly handles transposition (fen).
        *   [ ] Graceful failure if API is offline.
    *   **Points:** 3

*   **Story 2.2: Opening Practice Mode**
    *   **Description:** As a student, I want a "Practice Mode" that quizzes me on "book moves" for a specific opening line.
    *   **Implementation Details:**
        *   User selects an opening (e.g., "Sicilian Najdorf").
        *   App loads a PGN/Line.
        *   User plays White/Black. If user deviates from book, show "Incorrect" and retry.
        *   Use `Polyglot` book to validate "good" moves.
    *   **Acceptance Criteria:**
        *   [ ] User is prompted to play the correct move.
        *   [ ] Visual feedback for correct/incorrect book moves.
    *   **Points:** 5

### Feature: Puzzle Rush / Spaced Repetition
*   **Story 2.3: Puzzle Rush Logic**
    *   **Description:** As a user, I want a "Puzzle Rush" mode where I solve as many tactics as possible within a time limit (3 or 5 minutes).
    *   **Implementation Details:**
        *   Create `public/js/PuzzleRushManager.js`.
        *   Load random puzzles from `public/puzzles.json`.
        *   Timer countdown.
        *   Game Over if 3 strikes (wrong moves) or time runs out.
    *   **Acceptance Criteria:**
        *   [ ] Timer stops at 0:00.
        *   [ ] Score tracks number of solved puzzles.
        *   [ ] "Three strikes" rule ends the run.
    *   **Points:** 5

*   **Story 2.4: Spaced Repetition System (SRS)**
    *   **Description:** As a learner, I want the system to track puzzles I failed and re-present them later using a Spaced Repetition (SM-2) algorithm.
    *   **Implementation Details:**
        *   Use `localStorage` to store user puzzle history: `{ puzzleId: "123", nextReview: timestamp, interval: 1 }`.
        *   Implement SM-2 algorithm: `I(n) = I(n-1) * EF`.
        *   Filter `puzzles.json` for puzzles due for review.
    *   **Acceptance Criteria:**
        *   [ ] Failed puzzles reappear in the next session.
        *   [ ] Correctly solved puzzles are pushed further into the future.
    *   **Points:** 3

### Feature: Blindfold Training Suite
*   **Story 2.5: Blindfold Toggle**
    *   **Description:** As a user, I want a "Blindfold Mode" where pieces are invisible, and moves are announced via text/audio.
    *   **Implementation Details:**
        *   CSS class `.blindfold-mode` sets piece opacity to 0.
        *   Use `SpeechSynthesis` API to announce moves (San).
    *   **Acceptance Criteria:**
        *   [ ] Pieces are hidden but board is interactive (drag and drop still works, or click-click).
        *   [ ] Last move is announced audibly.
    *   **Points:** 1

*   **Story 2.6: Memory Reconstruction Drill**
    *   **Description:** As a user, I want a "Memory Drill" that shows a position for 5 seconds, hide it, and ask the user to reconstruct it.
    *   **Implementation Details:**
        *   Show board -> `setTimeout` 5s -> Hide pieces.
        *   Open "Board Editor" type interface with empty board.
        *   User places pieces.
        *   "Check" button compares User FEN with Target FEN.
    *   **Acceptance Criteria:**
        *   [ ] Calculates accuracy % (correct pieces on correct squares).
        *   [ ] Highlights missing/wrong pieces on result.
    *   **Points:** 5

---

## Epic 3: Platform & Connectivity
**Goal:** Expand the application from a standalone engine to a connected chess platform.

### Feature: Online Multiplayer Lobby
*   **Story 3.1: WebSocket Lobby**
    *   **Description:** As a user, I want to see a list of connected players in a lobby.
    *   **Implementation Details:**
        *   New Fastify plugin `src/plugins/lobby.js`.
        *   Track connected sockets and usernames.
        *   Broadcast "user_joined" / "user_left" events.
        *   Frontend: `LobbyManager.js` renders user list.
    *   **Acceptance Criteria:**
        *   [ ] Real-time updates of user list.
        *   [ ] User can set a display name.
    *   **Points:** 5

*   **Story 3.2: Challenge System**
    *   **Description:** As a user, I want to challenge another player to a game with custom time controls.
    *   **Implementation Details:**
        *   Send challenge: `{ type: 'challenge', target: 'userId', time: '5+0' }`.
        *   Target receives modal: Accept/Decline.
        *   On Accept: Server creates `GameRoom` and routes moves between players.
    *   **Acceptance Criteria:**
        *   [ ] Challenge flow works (Send -> Accept -> Start).
        *   [ ] Moves are synchronized between clients (no engine moves).
        *   [ ] Clocks sync via server timestamp.
    *   **Points:** 8

*   **Story 3.3: Spectator Mode**
    *   **Description:** As a spectator, I want to watch live games currently in progress.
    *   **Implementation Details:**
        *   List active games in Lobby.
        *   "Watch" button subscribes socket to that game room.
        *   Spectators receive `move` events but cannot send them.
    *   **Acceptance Criteria:**
        *   [ ] Spectator sees moves in real-time.
        *   [ ] Spectator count displayed to players.
    *   **Points:** 5

### Feature: Mobile Progressive Web App (PWA)
*   **Story 3.4: Service Worker & Manifest**
    *   **Description:** As a mobile user, I want to install the app to my home screen and play offline using a Service Worker.
    *   **Implementation Details:**
        *   Create `public/manifest.json`.
        *   Create `public/sw.js`. Cache `index.html`, `style.css`, `client.js`, images, and `chess.js`.
        *   Register SW in `client.js`.
    *   **Acceptance Criteria:**
        *   [ ] Chrome audit (Lighthouse) recognizes it as a PWA.
        *   [ ] App loads while disconnected from internet (after first load).
    *   **Points:** 3

*   **Story 3.5: Mobile Touch Layout**
    *   **Description:** As a mobile user, I want a touch-optimized layout with bottom navigation and large interaction targets.
    *   **Implementation Details:**
        *   Media Queries (`@media (max-width: 600px)`).
        *   Move sidebar content (history, controls) to a bottom tab bar.
        *   Increase touch targets to min 44px.
        *   Disable "hover" effects on touch devices.
    *   **Acceptance Criteria:**
        *   [ ] Layout is usable on iPhone/Android screens.
        *   [ ] No horizontal scrolling.
    *   **Points:** 5

---

## Epic 4: Immersive User Experience
**Goal:** Modernize the interface with rich visuals, audio, and streaming features.

### Feature: Voice Command Interface
*   **Story 4.1: Speech-to-Move**
    *   **Description:** As a user, I want to speak moves (e.g., "Knight to f3") and have them executed on the board.
    *   **Implementation Details:**
        *   Use `window.SpeechRecognition` (or `webkitSpeechRecognition`).
        *   Grammar: `[Piece] [File] [Rank]`.
        *   Parse text -> SAN/LAN -> `attemptMove`.
    *   **Acceptance Criteria:**
        *   [ ] Accurately recognizes standard algebraic notation.
        *   [ ] Handles ambiguity (e.g., "Knight f3" when two knights can go there).
    *   **Points:** 5

*   **Story 4.2: Move Announcement**
    *   **Description:** As a user, I want the game to announce the opponent's moves via Text-to-Speech.
    *   **Implementation Details:**
        *   Use `window.speechSynthesis`.
        *   On `makeMove`, queue utterance: "Black plays pawn to e5".
        *   Debounce if moves are coming too fast (replay).
    *   **Acceptance Criteria:**
        *   [ ] Clear audio output of moves.
        *   [ ] Toggle option to mute.
    *   **Points:** 3

### Feature: 3D Board Visualization
*   **Story 4.3: WebGL Integration**
    *   **Description:** As a user, I want to toggle a 3D view of the board using WebGL.
    *   **Implementation Details:**
        *   Import `Three.js` (cdn or local).
        *   Create `public/js/ThreeRenderer.js`.
        *   Load 3D models (GLTF/OBJ) for pieces.
        *   Sync 3D scene state with 2D `board` state.
    *   **Acceptance Criteria:**
        *   [ ] Board renders in 3D canvas overlay.
        *   [ ] Pieces appear on correct squares.
        *   [ ] Performance > 30FPS on standard laptop.
    *   **Points:** 8

*   **Story 4.4: 3D Interaction**
    *   **Description:** As a user, I want to rotate the camera and see smooth piece animations in 3D.
    *   **Implementation Details:**
        *   `OrbitControls` for camera.
        *   Tweening library (e.g., GSAP or Three.js internal) for piece movement animations.
        *   Raycasting for clicking pieces in 3D space to select/move.
    *   **Acceptance Criteria:**
        *   [ ] User can rotate/zoom camera.
        *   [ ] Pieces slide to destination (not teleport).
        *   [ ] Click-to-move works in 3D.
    *   **Points:** 5

### Feature: Live Broadcast / Streamer Mode
*   **Story 4.5: Green Screen Layout**
    *   **Description:** As a streamer, I want a "Green Screen" mode and high-contrast UI elements for easy OBS integration.
    *   **Implementation Details:**
        *   CSS Class `.streamer-mode`:
            *   Background: `#00FF00` (Chroma Green).
            *   Fonts: Large, Bold, White with Black Outline.
            *   Hide non-essential controls (settings, footer).
    *   **Acceptance Criteria:**
        *   [ ] Background is pure green.
        *   [ ] Board and Clock are clearly visible.
    *   **Points:** 2

*   **Story 4.6: Twitch Chat Integration**
    *   **Description:** As a streamer, I want Twitch Chat integration so viewers can vote on the next move.
    *   **Implementation Details:**
        *   Connect to `tmi.js` (Twitch Messaging Interface) client-side (requires OAuth or anonymous read).
        *   Parse chat messages: `!move e4`.
        *   Aggregate votes and highlight the "Audience Move" on the board.
    *   **Acceptance Criteria:**
        *   [ ] Connects to specified Twitch channel.
        *   [ ] Counts votes correctly.
        *   [ ] Displays top voted move on UI.
    *   **Points:** 5
