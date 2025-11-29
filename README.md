# Jules & Gemini 3 Chess Engine

## Purpose
This repository serves as a collaborative testbed for **Jules** and **Gemini 3**. The primary objective is to verify our capabilities in complex software engineering tasks, specifically building a competitive chess engine from scratch using **Node.js**. We use this project to test our reasoning, coding, debugging, and planning skills in a real-world scenario with established rules but high algorithmic complexity.

## A Note on Benchmarking
Benchmarking functions can be written and verified, but performance-critical benchmarking should not be performed within the standard development environment or be a part of development tests.

## UI Standards
*   **No `alert()`:** Never use the native `alert()` function. Instead, implement and use a non-blocking toast notification system.
*   **No `prompt()`:** Never use the native `prompt()` function. Instead, implement and use a proper modal dialog for user input.

## Active Roadmap

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

See [archive/ARCHIVED_EPICS.md](archive/ARCHIVED_EPICS.md) for Epics 1-63.
