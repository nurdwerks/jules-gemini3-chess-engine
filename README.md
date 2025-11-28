# Jules & Gemini 3 Chess Engine

## Purpose
This repository serves as a collaborative testbed for **Jules** and **Gemini 3**. The primary objective is to verify our capabilities in complex software engineering tasks, specifically building a competitive chess engine from scratch using **Node.js**. We use this project to test our reasoning, coding, debugging, and planning skills in a real-world scenario with established rules but high algorithmic complexity.

## A Note on Benchmarking
Benchmarking functions can be written and verified, but performance-critical benchmarking should not be performed within the standard development environment or be a part of development tests.

## UI Standards
*   **No `alert()`:** Never use the native `alert()` function. Instead, implement and use a non-blocking toast notification system.
*   **No `prompt()`:** Never use the native `prompt()` function. Instead, implement and use a proper modal dialog for user input.

## Active Roadmap

### Epic 58: Clock and Time Management UI
**Size:** Small (1-2 days)
**Description:** Add visible chess clocks for both players.
**User Stories:**
1.  **Clock UI (S)**
    *   *Description:* Display digital clocks for White and Black.
    *   *Acceptance Criteria:*
        *   [ ] Clocks are visible near the board.
2.  **Countdown Logic (S)**
    *   *Description:* Implement countdown logic that syncs with the engine's time usage.
    *   *Acceptance Criteria:*
        *   [ ] Clocks count down while the respective side is thinking.

### Epic 59: Interactive Board Customization
**Size:** Small (1-2 days)
**Description:** Allow users to personalize the board's appearance.
**User Stories:**
1.  **Theme Selection (S)**
    *   *Description:* Provide a dropdown to select different board color themes (e.g., Green, Blue, Wood).
    *   *Acceptance Criteria:*
        *   [ ] Board colors change immediately upon selection.
2.  **Piece Sets (S)**
    *   *Description:* Support SVG-based piece sets alongside the Unicode default.
    *   *Acceptance Criteria:*
        *   [ ] Users can toggle between Unicode and SVG pieces.

### Epic 60: PGN and FEN Import/Export
**Size:** Medium (3 days)
**Description:** Facilitate game sharing and custom position setup.
**User Stories:**
1.  **FEN Handling (S)**
    *   *Description:* Add a "Copy FEN" button and a "Paste FEN" input to set the board state.
    *   *Acceptance Criteria:*
        *   [ ] Board updates correctly from a valid FEN string.
2.  **PGN Export (S)**
    *   *Description:* Add a button to download the current game as a PGN file.
    *   *Acceptance Criteria:*
        *   [ ] A valid .pgn file is generated and downloaded.

### Epic 61: Engine Analysis Mode
**Size:** Medium (3 days)
**Description:** Enable continuous engine analysis without auto-playing moves.
**User Stories:**
1.  **Analysis Toggle (S)**
    *   *Description:* Add a switch to enable "Analysis Mode".
    *   *Acceptance Criteria:*
        *   [ ] When enabled, the engine analyzes the current position indefinitely (`go infinite`).
2.  **Interactive Exploration (S)**
    *   *Description:* Allow the user to make moves on the board during analysis to see how the evaluation changes.
    *   *Acceptance Criteria:*
        *   [ ] Making a move updates the position and restarts the analysis automatically.

### Epic 62: Sound Effects Integration
**Size:** Small (1 day)
**Description:** Add audio feedback for better game immersion.
**User Stories:**
1.  **Audio Events (S)**
    *   *Description:* Play distinct sounds for moves, captures, and checks.
    *   *Acceptance Criteria:*
        *   [ ] Sounds play at appropriate times.
2.  **Mute Control (S)**
    *   *Description:* Provide a volume/mute toggle.
    *   *Acceptance Criteria:*
        *   [ ] Users can disable sound effects.

### Epic 63: Responsive Layout Improvements
**Size:** Medium (3 days)
**Description:** Optimize the interface for mobile and tablet devices.
**User Stories:**
1.  **Flexible Grid (S)**
    *   *Description:* Adjust CSS Grid/Flexbox layouts to stack panels vertically on smaller screens.
    *   *Acceptance Criteria:*
        *   [ ] UI is usable on a mobile width (e.g., 375px).
2.  **Touch Optimizations (S)**
    *   *Description:* Ensure piece dragging (or tap-to-move) works smoothly on touch screens.
    *   *Acceptance Criteria:*
        *   [ ] Mobile users can play a game without issues.

### Epic 64: Advanced UCI Option Controls
**Size:** Small (2 days)
**Description:** Improve the usability of the engine configuration panel.
**User Stories:**
1.  **Button Support (S)**
    *   *Description:* Correctly handle UCI 'button' type options (e.g., Clear Hash).
    *   *Acceptance Criteria:*
        *   [ ] Clicking the button sends the correct UCI command.
2.  **Grouping and Tooltips (S)**
    *   *Description:* Group related options and add tooltips if descriptions are available.
    *   *Acceptance Criteria:*
        *   [ ] Options are organized logically (e.g., Search, Eval, System).

## Archived Roadmap (Completed or Superseded)

See [archive/ARCHIVED_EPICS.md](archive/ARCHIVED_EPICS.md) for Epics 1-56.
