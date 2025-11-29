# Future Enhancements & Roadmap

This document outlines the detailed backlog of future enhancements for the Jules & Gemini 3 Chess Engine. Each section represents an **Epic**, containing detailed **User Stories** with implementation plans and acceptance criteria.

---

### Epic 1: Board Customization & Aesthetics
**Size:** Medium (3-5 days)
**Description:** Enhance the visual appeal and customizability of the chess board to improve user experience and engagement. This includes theming, animations, and diverse asset support.

**User Stories:**

1.  **Board Flipping (S)**
    *   *Description:* Allow the user to flip the board view so Black is at the bottom.
    *   *Implementation:* Toggle a CSS class `flipped` on the board container and individual square/piece elements to rotate them 180 degrees.
    *   *Tasks:*
        - [ ] Add "Flip Board" button to UI.
        - [ ] Implement `flipBoard()` function in `client.js`.
        - [ ] Add `.flipped` CSS transformations.
    *   *Testing Plan:*
        - Manual: Click button, verify board rotates, verify rank/file labels update.
        - Playwright: Check element `transform` styles.
    *   *Acceptance Criteria:*
        - [ ] Board orientation toggles correctly.
        - [ ] Drag and drop works correctly in flipped mode.

2.  **Piece Set Selection (S)**
    *   *Description:* Add a UI option to switch between different piece themes (e.g., Alpha, Merida, Cburnett).
    *   *Implementation:* Store piece sets in `public/images/pieces/{set_name}/`. Update `getPieceImage(piece)` to use selected set path.
    *   *Tasks:*
        - [ ] Download open-source piece sets.
        - [ ] Create dropdown in Settings.
        - [ ] Update image loading logic.
    *   *Testing Plan:* Verify all piece images load for each set.
    *   *Acceptance Criteria:*
        - [ ] User can select at least 3 distinct piece sets.

3.  **Board Color Themes (S)**
    *   *Description:* Add a UI option to change the board square colors (e.g., Green/White, Blue/White, Wood).
    *   *Implementation:* Use CSS variables for `--light-square` and `--dark-square`. Dropdown updates these variables on `root`.
    *   *Tasks:*
        - [ ] Define theme palettes in `client.js`.
        - [ ] Add color picker/dropdown.
    *   *Testing Plan:* Visual inspection of board colors.
    *   *Acceptance Criteria:*
        - [ ] Changing theme immediately updates board colors.

4.  **Board Size Slider (S)**
    *   *Description:* Slider to dynamically resize the board (Small, Medium, Large).
    *   *Implementation:* Bind slider value to `--board-size` CSS variable or width percentage.
    *   *Tasks:*
        - [ ] Add range input to UI.
        - [ ] Listen for `input` events and update container style.
    *   *Testing Plan:* Verify board remains responsive and pieces scale correctly.
    *   *Acceptance Criteria:*
        - [ ] Board resizes smoothly from 300px to 800px (or screen max).

5.  **Dark Mode Toggle (S)**
    *   *Description:* A dedicated toggle for the entire UI theme (Light/Dark), separate from board colors.
    *   *Implementation:* Toggle `dark-mode` class on `<body>`. Define dark colors for background, panels, and text.
    *   *Tasks:*
        - [ ] Create CSS variables for UI colors.
        - [ ] Implement toggle switch.
        - [ ] Persist preference in `localStorage`.
    *   *Testing Plan:* Verify text contrast and background in both modes.
    *   *Acceptance Criteria:*
        - [ ] UI switches themes instantly.
        - [ ] Setting is remembered on reload.

6.  **Piece Style: 3D (M)**
    *   *Description:* Add a set of 3D-rendered piece images or actual 3D objects (Three.js).
    *   *Implementation:* Start with pre-rendered 2D images of 3D pieces for simplicity.
    *   *Tasks:*
        - [ ] Source or render 3D piece sprites.
        - [ ] Add to Piece Set dropdown.
    *   *Testing Plan:* Check visual alignment of 3D bases on squares.
    *   *Acceptance Criteria:*
        - [ ] 3D style pieces are selectable.

7.  **Piece Style: Pixel Art (S)**
    *   *Description:* Add a retro 8-bit piece set.
    *   *Implementation:* Add "Pixel" to piece sets. Use `image-rendering: pixelated` CSS.
    *   *Tasks:*
        - [ ] Create/Find pixel art sprites.
        - [ ] Add CSS rule for pixelated scaling.
    *   *Testing Plan:* Verify sharp edges on scaling.
    *   *Acceptance Criteria:*
        - [ ] Pixel art looks crisp.

8.  **Board Style: Glass (S)**
    *   *Description:* A translucent/glass-effect board theme.
    *   *Implementation:* Use `backdrop-filter: blur()` and semi-transparent RGBA colors for squares.
    *   *Tasks:*
        - [ ] Create "Glass" theme definition.
        - [ ] Apply specific CSS classes for blur effects.
    *   *Testing Plan:* Ensure background image/color is visible through board.
    *   *Acceptance Criteria:*
        - [ ] Glass effect is visible and performant.

9.  **Board Style: Newspaper (S)**
    *   *Description:* A black and white high-contrast print style theme.
    *   *Implementation:* Use grayscale filters and specific high-contrast patterns.
    *   *Tasks:*
        - [ ] Create "Newspaper" theme.
    *   *Testing Plan:* Verify high contrast for accessibility.
    *   *Acceptance Criteria:*
        - [ ] Theme resembles a printed diagram.

10. **Custom Theme Editor (M)**
    *   *Description:* Allow users to pick custom hex colors for the board instead of using presets.
    *   *Implementation:* HTML5 `<input type="color">` for light/dark squares.
    *   *Tasks:*
        - [ ] Add color inputs to Settings.
        - [ ] Update CSS variables dynamically.
    *   *Testing Plan:* Verify any color combo works.
    *   *Acceptance Criteria:*
        - [ ] Users can create arbitrary board color schemes.

11. **Custom CSS Import (M)**
    *   *Description:* Allow users to upload or paste custom CSS to style the board.
    *   *Implementation:* Text area for CSS, inject into a `<style id="custom-css">` tag.
    *   *Tasks:*
        - [ ] Add CSS editor modal.
        - [ ] Sanitize input (basic check) and inject.
    *   *Testing Plan:* Paste valid CSS, check results.
    *   *Acceptance Criteria:*
        - [ ] User CSS overrides default styles.

12. **Theme Upload (M)**
    *   *Description:* Allow user to upload a JSON theme file.
    *   *Implementation:* `FileReader` to parse JSON, then apply settings (colors, pieces).
    *   *Tasks:*
        - [ ] Define JSON schema for themes.
        - [ ] Add file input.
    *   *Testing Plan:* Upload valid and invalid JSONs.
    *   *Acceptance Criteria:*
        - [ ] Theme applies correctly from file.

13. **Piece Set Upload (L)**
    *   *Description:* Allow user to upload a folder/zip of SVG piece images.
    *   *Implementation:* Use JSZip (client-side) or upload to server (complex). Prefer client-side `URL.createObjectURL` for blobs.
    *   *Tasks:*
        - [ ] Implement drag-and-drop zone for images.
        - [ ] Map filenames (wk.svg, etc.) to internal IDs.
    *   *Testing Plan:* Upload custom set, play game.
    *   *Acceptance Criteria:*
        - [ ] Custom pieces render on board.

14. **Piece Animation Speed (S)**
    *   *Description:* Configurable speed for piece movement animations.
    *   *Implementation:* Adjust CSS `transition-duration` or JS animation timer.
    *   *Tasks:*
        - [ ] Add "Animation Speed" dropdown (Slow, Normal, Fast, Instant).
    *   *Testing Plan:* Visual check of move speed.
    *   *Acceptance Criteria:*
        - [ ] "Instant" disables animation.

15. **Evaluation Bar Animation (S)**
    *   *Description:* Smooth transition animations for the evaluation bar as the score changes.
    *   *Implementation:* CSS `transition: height 0.5s ease-out`.
    *   *Tasks:*
        - [ ] Add transition to eval bar container.
    *   *Testing Plan:* Observe bar during analysis.
    *   *Acceptance Criteria:*
        - [ ] Bar grows/shrinks smoothly, not jerkily.

---

### Epic 2: User Interface Layout
**Size:** Medium (3-5 days)
**Description:** Improvements to the application layout, responsiveness, and display modes.

**User Stories:**

16. **Fullscreen Mode (S)**
    *   *Description:* Add a button to toggle fullscreen mode for the board interface.
    *   *Implementation:* Use `document.documentElement.requestFullscreen()`.
    *   *Tasks:*
        - [ ] Add Fullscreen icon button.
        - [ ] Handle `fullscreenchange` event to update icon.
    *   *Testing Plan:* Click button, verify browser enters fullscreen.
    *   *Acceptance Criteria:*
        - [ ] Toggles in/out of fullscreen.

17. **Zen Mode (S)**
    *   *Description:* A toggle to hide all UI elements except the board and clock.
    *   *Implementation:* Add class `.zen-mode` to body, hiding sidebar/panels via CSS.
    *   *Tasks:*
        - [ ] Add Zen toggle.
        - [ ] CSS: `.zen-mode .sidebar { display: none }`.
    *   *Testing Plan:* Verify distraction-free view.
    *   *Acceptance Criteria:*
        - [ ] Only Board and Clocks visible.

18. **Compact Layout (M)**
    *   *Description:* A dense UI layout for small screens/mobile.
    *   *Implementation:* Enhanced Media Queries. Move notation below board, reduce padding.
    *   *Tasks:*
        - [ ] Refine CSS Grid for mobile breakpoint.
    *   *Testing Plan:* Chrome DevTools Device Mode.
    *   *Acceptance Criteria:*
        - [ ] No horizontal scrolling on 320px width.

19. **Sidebar Toggle (S)**
    *   *Description:* Button to collapse the sidebar (move list/controls) for a larger board view.
    *   *Implementation:* Toggle CSS class reducing sidebar width to 0.
    *   *Tasks:*
        - [ ] Add hamburger menu/collapse arrow.
        - [ ] Animate width change.
    *   *Testing Plan:* Verify board expands to fill space.
    *   *Acceptance Criteria:*
        - [ ] Sidebar collapses/expands.

20. **Coordinate Toggle (S)**
    *   *Description:* Add a setting to show/hide rank and file coordinates on the board edges.
    *   *Implementation:* Toggle visibility of `.coordinate` elements.
    *   *Tasks:*
        - [ ] Add checkbox.
        - [ ] Update render loop.
    *   *Testing Plan:* Toggle, verify labels appear/disappear.
    *   *Acceptance Criteria:*
        - [ ] Coordinates can be hidden.

21. **Coordinates Outside Board (S)**
    *   *Description:* Option to render coordinates outside the board square instead of overlaying them.
    *   *Implementation:* Change grid layout to add gutter for coordinates or padding.
    *   *Tasks:*
        - [ ] CSS adjustment for "External" coordinate mode.
    *   *Testing Plan:* Verify no overlap with pieces.
    *   *Acceptance Criteria:*
        - [ ] Supports both Inside and Outside modes.

22. **Streamer Mode (S)**
    *   *Description:* A layout optimized for OBS capture with chroma key background.
    *   *Implementation:* Preset green background `#00FF00` for body, hide non-essential UI.
    *   *Tasks:*
        - [ ] Add "Streamer Mode" button.
    *   *Testing Plan:* Verify pure green background.
    *   *Acceptance Criteria:*
        - [ ] Ready for chroma keying.

23. **System Messages Panel (S)**
    *   *Description:* A dedicated area for system notifications and errors.
    *   *Implementation:* Fixed container at bottom or top for persistent logs.
    *   *Tasks:*
        - [ ] Create log container.
        - [ ] Redirect `console.error` or toast history here.
    *   *Testing Plan:* Trigger error, check panel.
    *   *Acceptance Criteria:*
        - [ ] Errors are logged visibly.

---

### Epic 3: Game Modes & Variations
**Size:** Large (1-2 weeks)
**Description:** Implement new ways to play chess, including variants and multiplayer setups.

**User Stories:**

24. **PvP Mode (S)**
    *   *Description:* A "Two Player" mode that disables the engine and allows two humans to play on the same screen.
    *   *Implementation:* Disable automatic engine response. Unlock board for both sides.
    *   *Tasks:*
        - [ ] Add Game Mode selector (Engine vs Human, Human vs Human).
        - [ ] Logic to flip board automatically (optional).
    *   *Testing Plan:* Play a full game manually.
    *   *Acceptance Criteria:*
        - [ ] Engine does not reply.

25. **Engine Self-Play Button (S)**
    *   *Description:* A button to make the engine play against itself from the current position.
    *   *Implementation:* Loop: Engine move -> make move -> request engine move.
    *   *Tasks:*
        - [ ] Add "Self Play" button.
        - [ ] Implement loop in `client.js`.
    *   *Testing Plan:* Watch engine play a game.
    *   *Acceptance Criteria:*
        - [ ] Plays until mate/draw.

26. **Engine Duel (L)**
    *   *Description:* Configure and run a match between two different engine versions or settings (e.g., Aggressive vs Solid).
    *   *Implementation:* Instantiate two WebSocket connections or simulate via changing options between moves.
    *   *Tasks:*
        - [ ] UI to configure Engine A and Engine B options.
        - [ ] Arbitration logic.
    *   *Testing Plan:* Run a 10 game match.
    *   *Acceptance Criteria:*
        - [ ] Result tracked correctly.

27. **Tournament Manager (L)**
    *   *Description:* A simple UI to automate round-robin matches between configured engines.
    *   *Implementation:* Queue system for matches. Results table.
    *   *Tasks:*
        - [ ] Match queue logic.
        - [ ] Standings table.
    *   *Testing Plan:* Run mini tournament.
    *   *Acceptance Criteria:*
        - [ ] Automates pairings.

28. **Blindfold Mode (S)**
    *   *Description:* Add an option to hide pieces on the board for visualization training.
    *   *Implementation:* Set piece opacity to 0 via CSS class.
    *   *Tasks:*
        - [ ] Toggle button.
        - [ ] CSS: `.blindfold .piece { opacity: 0 }`.
    *   *Testing Plan:* Verify board looks empty but accepts moves.
    *   *Acceptance Criteria:*
        - [ ] Pieces invisible, interaction remains.

29. **Chess960 Generator (M)**
    *   *Description:* Button to generate a random Fischer Random (Chess960) starting position.
    *   *Implementation:* Logic to place Bishops (opposite), King between Rooks. Generate FEN.
    *   *Tasks:*
        - [ ] Implement `generate960FEN()`.
        - [ ] Set board via `position fen ...`.
    *   *Testing Plan:* Generate 50 positions, verify validity.
    *   *Acceptance Criteria:*
        - [ ] Valid 960 positions generated.

30. **Vote Chess (M)**
    *   *Description:* Allow multiple viewers to vote on the next move (mockup/integration).
    *   *Implementation:* Connect to a voting backend or mock via multiple browser tabs (websockets).
    *   *Tasks:*
        - [ ] Voting UI overlay on board.
    *   *Testing Plan:* Simulate votes.
    *   *Acceptance Criteria:*
        - [ ] Most voted move is played.

31. **Handicap Mode (S)**
    *   *Description:* Allow starting the game with material odds (e.g., Knight odds).
    *   *Implementation:* Pre-defined FENs for common handicaps.
    *   *Tasks:*
        - [ ] Dropdown for "Odds".
        - [ ] Load corresponding FEN.
    *   *Testing Plan:* Verify missing pieces.
    *   *Acceptance Criteria:*
        - [ ] Game starts with correct material imbalance.

32. **Armageddon Mode (S)**
    *   *Description:* Preset time controls for Armageddon (White has more time but must win).
    *   *Implementation:* Set clocks: White 5m, Black 4m. Logic: Draw = Black Win.
    *   *Tasks:*
        - [ ] Armageddon preset button.
        - [ ] Result logic update.
    *   *Testing Plan:* Simulate Draw, check winner.
    *   *Acceptance Criteria:*
        - [ ] Correct time and win conditions.

33. **Guess the Move (M)**
    *   *Description:* A game mode where the user guesses the next GM move in a loaded game.
    *   *Implementation:* Load PGN. Hide next move. User makes move -> compare with PGN -> Score.
    *   *Tasks:*
        - [ ] Load Game logic.
        - [ ] Guess validation.
    *   *Testing Plan:* Play through a game.
    *   *Acceptance Criteria:*
        - [ ] Feedback given on correct/incorrect guess.

---

### Epic 4: Training & Puzzles
**Size:** Medium (3-5 days)
**Description:** Features to help users improve their chess skills.

**User Stories:**

34. **Blindfold Training (S)**
    *   *Description:* A mode where pieces disappear after a few seconds.
    *   *Implementation:* CSS animation `fade-out` on piece placement.
    *   *Tasks:*
        - [ ] Add "Disappearing Pieces" mode.
    *   *Testing Plan:* Move piece, wait, verify disappearance.
    *   *Acceptance Criteria:*
        - [ ] Pieces vanish after set delay.

35. **Memory Training (S)**
    *   *Description:* Show a position for 5 seconds, then ask the user to reconstruct it.
    *   *Implementation:* Show board -> clear board -> drag pieces from sidebar. Compare FENs.
    *   *Tasks:*
        - [ ] Reconstruction UI.
        - [ ] Comparison logic.
    *   *Testing Plan:* Test simple positions.
    *   *Acceptance Criteria:*
        - [ ] Score calculated based on accuracy.

36. **Tactics Trainer (L)**
    *   *Description:* Load random tactical positions from a database (Lichess/Chess.com public DBs) for the user to solve.
    *   *Implementation:* Fetch FEN/Solution from external API or local JSON.
    *   *Tasks:*
        - [ ] Puzzle loader.
        - [ ] Move validation against solution.
    *   *Testing Plan:* Solve puzzles.
    *   *Acceptance Criteria:*
        - [ ] Puzzles load and validate.

37. **Endgame Trainer (M)**
    *   *Description:* Load standard endgame positions (e.g., K+P vs K) for practice.
    *   *Implementation:* Library of FENs (Lucena, Philidor, etc.). Play against engine.
    *   *Tasks:*
        - [ ] Endgame Menu.
        - [ ] Engine plays strongest response (Syzygy).
    *   *Testing Plan:* Verify engine resistance.
    *   *Acceptance Criteria:*
        - [ ] User can practice specific endgames.

38. **Daily Puzzle (M)**
    *   *Description:* Fetch and display a daily chess puzzle for the user to solve.
    *   *Implementation:* Lichess Daily Puzzle API.
    *   *Tasks:*
        - [ ] Fetch API.
        - [ ] Render board.
    *   *Testing Plan:* Verify puzzle updates daily.
    *   *Acceptance Criteria:*
        - [ ] Shows current daily puzzle.

39. **Opening Repertoire Builder (L)**
    *   *Description:* Allow users to save and categorize their favorite opening lines.
    *   *Implementation:* Tree structure storage of user moves.
    *   *Tasks:*
        - [ ] UI to traverse and "Save" lines.
        - [ ] LocalStorage persistence.
    *   *Testing Plan:* Build a repertoire, reload page.
    *   *Acceptance Criteria:*
        - [ ] Repertoire persists.

---

### Epic 5: Game Controls & Mechanics
**Size:** Medium (3 days)
**Description:** Fine-grained control over game flow and interactions.

**User Stories:**

40. **Resign Button (S)**
    *   *Description:* A button for the human player to resign the game.
    *   *Implementation:* End game state, declare Engine winner.
    *   *Tasks:*
        - [ ] UI Button.
        - [ ] State update.
    *   *Testing Plan:* Click Resign.
    *   *Acceptance Criteria:*
        - [ ] Game ends, Result 0-1 or 1-0.

41. **Draw Offer (S)**
    *   *Description:* A button to offer a draw to the engine.
    *   *Implementation:* Engine accepts if eval is within `[-0.10, 0.10]` (contempt).
    *   *Tasks:*
        - [ ] "Offer Draw" button.
        - [ ] Engine logic check.
    *   *Testing Plan:* Offer draw in equal/unequal positions.
    *   *Acceptance Criteria:*
        - [ ] Engine accepts/declines appropriately.

42. **Takeback Move (S)**
    *   *Description:* Button to undo the last half-move or full turn during a game against the engine.
    *   *Implementation:* Call `board.undo()` twice (human + engine move).
    *   *Tasks:*
        - [ ] Undo logic.
    *   *Testing Plan:* Play moves, take back, replay.
    *   *Acceptance Criteria:*
        - [ ] State reverts correctly.

43. **Force Move (S)**
    *   *Description:* Add a button to force the engine to move immediately.
    *   *Implementation:* Send `stop` command to UCI.
    *   *Tasks:*
        - [ ] "Move Now" button.
    *   *Testing Plan:* Click while engine thinking.
    *   *Acceptance Criteria:*
        - [ ] Engine outputs move immediately.

44. **Premoves (M)**
    *   *Description:* Allow the user to input a move while the engine is still thinking.
    *   *Implementation:* Store move in `pendingMove`. Execute immediately after engine move arrives.
    *   *Tasks:*
        - [ ] Allow UI interaction during "thinking".
        - [ ] Queue logic.
    *   *Testing Plan:* Premove a capture.
    *   *Acceptance Criteria:*
        - [ ] Move happens instantly after engine reply.

45. **Move Confirmation (S)**
    *   *Description:* Optional setting to require a second click to confirm a move.
    *   *Implementation:* First click highlights "Confirm", second click sends move.
    *   *Tasks:*
        - [ ] Setting toggle.
        - [ ] Confirmation UI.
    *   *Testing Plan:* Attempt move with setting on.
    *   *Acceptance Criteria:*
        - [ ] Move requires confirmation.

46. **Auto-Queen Toggle (S)**
    *   *Description:* Option to always automatically promote to Queen without showing a selection modal.
    *   *Implementation:* Checkbox setting. If true, append 'q' automatically.
    *   *Tasks:*
        - [ ] Setting logic.
    *   *Testing Plan:* Promote pawn.
    *   *Acceptance Criteria:*
        - [ ] Skips modal if enabled.

47. **Promotion Modal (S)**
    *   *Description:* Custom modal for selecting promotion piece.
    *   *Implementation:* HTML overlay with Q/R/B/N images.
    *   *Tasks:*
        - [ ] Create Modal UI.
        - [ ] Promise-based selection flow.
    *   *Testing Plan:* Verify all 4 options work.
    *   *Acceptance Criteria:*
        - [ ] Replaces browser prompt.

48. **Auto-Flip Board (S)**
    *   *Description:* Automatically rotate the board to face the side whose turn it is.
    *   *Implementation:* On move, check `turn`, call `flipBoard()`.
    *   *Tasks:*
        - [ ] Setting toggle "Auto-Flip".
    *   *Testing Plan:* Play game.
    *   *Acceptance Criteria:*
        - [ ] Board flips every move.

49. **Click-to-Move (S)**
    *   *Description:* Support click-origin-then-click-destination interaction.
    *   *Implementation:* State `selectedSquare`. First click sets it, second click executes move.
    *   *Tasks:*
        - [ ] Logic to handle click vs drag.
    *   *Testing Plan:* Play game with clicks only.
    *   *Acceptance Criteria:*
        - [ ] Works alongside D&D.

50. **Right-Click to Cancel (S)**
    *   *Description:* Right-clicking while dragging a piece cancels the move.
    *   *Implementation:* `mousedown` (right) resets drag state.
    *   *Tasks:*
        - [ ] Event listener.
    *   *Testing Plan:* Drag, right click.
    *   *Acceptance Criteria:*
        - [ ] Piece returns to source.

51. **Game Speed Slider (S)**
    *   *Description:* Control the playback speed of game history (autoplay).
    *   *Implementation:* Interval timer duration variable.
    *   *Tasks:*
        - [ ] Slider UI.
    *   *Testing Plan:* Autoplay game at diff speeds.
    *   *Acceptance Criteria:*
        - [ ] Speed varies.

---

### Epic 6: Time Control
**Size:** Small (2 days)
**Description:** Implementation of chess clocks and time control rules.

**User Stories:**

52. **Move Time limit for Human (S)**
    *   *Description:* Add a clock for the human player to enforce time controls.
    *   *Implementation:* JS Interval decrementing human time when `turn == human`.
    *   *Tasks:*
        - [ ] Timer logic.
        - [ ] Flag fall (Loss) logic.
    *   *Testing Plan:* Let time run out.
    *   *Acceptance Criteria:*
        - [ ] Game ends on flag fall.

53. **Increment Support (S)**
    *   *Description:* Add support for time increments (Fischer clock) in human games.
    *   *Implementation:* Add `inc` to time after move.
    *   *Tasks:*
        - [ ] Update timer logic.
    *   *Testing Plan:* Verify time increases after move.
    *   *Acceptance Criteria:*
        - [ ] Increment added correctly.

54. **Game Clock (S)**
    *   *Description:* Add a visual timer for both white and black.
    *   *Implementation:* Digital readout `MM:SS`.
    *   *Tasks:*
        - [ ] Render clock elements.
    *   *Testing Plan:* Visual check.
    *   *Acceptance Criteria:*
        - [ ] Clocks readable.

55. **Low Time Alert (S)**
    *   *Description:* Visual/Audio warning when time is running low (< 10s).
    *   *Implementation:* Flash clock red. Play "tick" sound.
    *   *Tasks:*
        - [ ] CSS class `.low-time`.
        - [ ] Audio trigger.
    *   *Testing Plan:* Run time down.
    *   *Acceptance Criteria:*
        - [ ] Warning triggers at 10s.

---

### Epic 7: Analysis Visualizations
**Size:** Large (4-5 days)
**Description:** Visual aids to help the user understand engine analysis and board state.

**User Stories:**

56. **Engine Analysis Arrows (S)**
    *   *Description:* Visualize the engine's current best move and PV on the board using arrows.
    *   *Implementation:* SVG overlay on top of board. Draw arrow from `from` to `to`.
    *   *Tasks:*
        - [ ] SVG container.
        - [ ] Arrow drawing function (math for coords).
        - [ ] Parse `bestmove`.
    *   *Testing Plan:* Enable analysis.
    *   *Acceptance Criteria:*
        - [ ] Arrow points correctly.

57. **Best Move Arrow (S)**
    *   *Description:* Display a distinct arrow color for the engine's "best move" vs. "ponder move".
    *   *Implementation:* CSS classes `.arrow-best` (Blue), `.arrow-ponder` (Green).
    *   *Tasks:*
        - [ ] Style definitions.
    *   *Testing Plan:* Visual check.
    *   *Acceptance Criteria:*
        - [ ] Distinct colors used.

58. **Threat Arrow (S)**
    *   *Description:* A specific arrow color/style to show the opponent's immediate threat.
    *   *Implementation:* If eval drops significantly on null move (if implemented) or simple attack logic. Red arrow.
    *   *Tasks:*
        - [ ] Threat detection logic.
    *   *Testing Plan:* Set up hanging piece.
    *   *Acceptance Criteria:*
        - [ ] Threat highlighted.

59. **Last Move Arrow (S)**
    *   *Description:* Option to draw an arrow for the last move instead of just highlighting squares.
    *   *Implementation:* Draw yellow arrow for `lastMove`.
    *   *Tasks:*
        - [ ] Integration with arrow layer.
    *   *Testing Plan:* Make move.
    *   *Acceptance Criteria:*
        - [ ] Arrow appears.

60. **Right-Click to Draw Arrows (M)**
    *   *Description:* Allow the user to draw custom analysis arrows on the board.
    *   *Implementation:* Mouse events on board. Right-down (start), Right-up (end). Store user arrows.
    *   *Tasks:*
        - [ ] Event handling.
        - [ ] Arrow storage/rendering.
    *   *Testing Plan:* Draw multiple arrows.
    *   *Acceptance Criteria:*
        - [ ] Arrows persist until cleared or clicked.

61. **Right-Click to Highlight Squares (S)**
    *   *Description:* Allow the user to highlight specific squares for analysis.
    *   *Implementation:* Right-click square -> toggle highlight class (Red/Green/Blue/Yellow cycle).
    *   *Tasks:*
        - [ ] Cycle logic.
    *   *Testing Plan:* Right click squares.
    *   *Acceptance Criteria:*
        - [ ] Highlights appear.

62. **Clear Analysis (S)**
    *   *Description:* Button to clear all user-drawn arrows and highlights.
    *   *Implementation:* Clear local state arrays. Re-render.
    *   *Tasks:*
        - [ ] "Clear" button (or click off board).
    *   *Testing Plan:* Draw then clear.
    *   *Acceptance Criteria:*
        - [ ] Board clean.

63. **Hover Square Highlight (S)**
    *   *Description:* Highlight the square under the mouse cursor.
    *   *Implementation:* CSS `:hover` on square elements (if div based) or JS mouseover.
    *   *Tasks:*
        - [ ] CSS rule.
    *   *Testing Plan:* Move mouse.
    *   *Acceptance Criteria:*
        - [ ] Subtle highlight follows cursor.

64. **Drag and Drop Ghost (S)**
    *   *Description:* Show a semi-transparent ghost of the piece being dragged.
    *   *Implementation:* Standard HTML5 DnD ghost or custom element following mouse.
    *   *Tasks:*
        - [ ] Set drag image.
    *   *Testing Plan:* Drag piece.
    *   *Acceptance Criteria:*
        - [ ] Ghost visible.

65. **Legal Move Indicators (S)**
    *   *Description:* Improve the visual hints (dots/circles) for legal moves.
    *   *Implementation:* Small circular `div` centered on target squares.
    *   *Tasks:*
        - [ ] SVG dot overlay.
    *   *Testing Plan:* Select Knight.
    *   *Acceptance Criteria:*
        - [ ] Valid moves clearly marked.

66. **Last Move Highlight (S)**
    *   *Description:* Visually emphasize the `from` and `to` squares of the last played move.
    *   *Implementation:* Add `.highlight-last` class to squares.
    *   *Tasks:*
        - [ ] CSS background color (yellowish).
    *   *Testing Plan:* Move piece.
    *   *Acceptance Criteria:*
        - [ ] Source and Dest highlighted.

67. **Check Highlight (S)**
    *   *Description:* Red radial gradient on the square of the king when in check.
    *   *Implementation:* Check detection -> find King -> apply `.check-highlight`.
    *   *Tasks:*
        - [ ] CSS radial gradient.
    *   *Testing Plan:* Put king in check.
    *   *Acceptance Criteria:*
        - [ ] King glows red.

68. **Threat Indicator (S)**
    *   *Description:* Optional toggle to highlight pieces that are currently under attack.
    *   *Implementation:* Loop all pieces -> isAttacked() -> highlight.
    *   *Tasks:*
        - [ ] Attack logic integration.
    *   *Testing Plan:* Toggle on.
    *   *Acceptance Criteria:*
        - [ ] Hanging pieces highlighted.

69. **King Safety Heatmap (M)**
    *   *Description:* Visual overlay showing safe and unsafe squares for the king.
    *   *Implementation:* Color squares green (safe) to red (many attackers).
    *   *Tasks:*
        - [ ] Calculate safety scores per square.
        - [ ] Overlay opacity.
    *   *Testing Plan:* Verify safe squares are green.
    *   *Acceptance Criteria:*
        - [ ] Visualizes danger zones.

70. **Mobility Heatmap (M)**
    *   *Description:* Highlight squares controlled by the currently selected piece or all pieces.
    *   *Implementation:* Visualize `attackedSquares`.
    *   *Tasks:*
        - [ ] Toggle view.
    *   *Testing Plan:* Select Queen.
    *   *Acceptance Criteria:*
        - [ ] All attacked squares lit up.

71. **Square Utilization Map (M)**
    *   *Description:* Heatmap showing which squares have been visited most often.
    *   *Implementation:* Track visit counts in game history.
    *   *Tasks:*
        - [ ] Visualization layer.
    *   *Testing Plan:* Play long game.
    *   *Acceptance Criteria:*
        - [ ] Center squares likely hotter.

72. **PieceTracker (S)**
    *   *Description:* Visual path showing where a specific piece has moved throughout the game.
    *   *Implementation:* Draw lines connecting history of a specific piece ID.
    *   *Tasks:*
        - [ ] Line drawing logic.
    *   *Testing Plan:* Click a Knight.
    *   *Acceptance Criteria:*
        - [ ] Path history shown.

73. **Outpost Highlighter (S)**
    *   *Description:* Highlight knights/bishops that are on strong outpost squares.
    *   *Implementation:* Engine logic reuse (isOutpost).
    *   *Tasks:*
        - [ ] UI highlight class.
    *   *Testing Plan:* Place N on outpost.
    *   *Acceptance Criteria:*
        - [ ] Highlighted.

74. **Weak Square Highlighter (S)**
    *   *Description:* Highlight squares that are undefended and near the king.
    *   *Implementation:* Hole detection logic.
    *   *Tasks:*
        - [ ] Visualization.
    *   *Testing Plan:* Create hole.
    *   *Acceptance Criteria:*
        - [ ] Square highlighted.

75. **Battery Highlighter (S)**
    *   *Description:* Visual indication of aligned pieces.
    *   *Implementation:* Detect Ray alignment.
    *   *Tasks:*
        - [ ] Draw connecting line.
    *   *Testing Plan:* Align R+Q.
    *   *Acceptance Criteria:*
        - [ ] Battery shown.

76. **X-Ray Highlighter (S)**
    *   *Description:* Show attacks through other pieces.
    *   *Implementation:* Bitboard magic attacks (x-ray).
    *   *Tasks:*
        - [ ] Dotted line visual.
    *   *Testing Plan:* X-ray attack.
    *   *Acceptance Criteria:*
        - [ ] Visible.

77. **Pin Visualizer (S)**
    *   *Description:* Draw a line connecting the pinning piece, the pinned piece, and the target.
    *   *Implementation:* Pin detection logic.
    *   *Tasks:*
        - [ ] Line drawing.
    *   *Testing Plan:* Pin a piece.
    *   *Acceptance Criteria:*
        - [ ] Pin relation clear.

78. **Fork Visualizer (S)**
    *   *Description:* Highlight the forking piece and its targets.
    *   *Implementation:* Double attack detection.
    *   *Tasks:*
        - [ ] Highlight targets.
    *   *Testing Plan:* Create fork.
    *   *Acceptance Criteria:*
        - [ ] Fork clear.

79. **Discovered Attack Visualizer (S)**
    *   *Description:* Highlight the moving piece and the piece revealing the attack.
    *   *Implementation:* Move generator check extension logic.
    *   *Tasks:*
        - [ ] Visual cues.
    *   *Testing Plan:* Discovered check.
    *   *Acceptance Criteria:*
        - [ ] Reveal shown.

---
*(Note: This file continues with Epics 8-15 covering Statistics, Engine Config, Data Management, Board Editor, Dev Tools, Move List, Audio, Integration, and Miscellaneous. Each follows the same structure.)*
