# Jules & Gemini 3 Chess Engine

## Overview
This project serves as a testbed for evaluating the capabilities of **Jules** and **Gemini 3**. The objective is to build a chess engine using **Node.js**.

## Methodology: Test Driven Development (TDD)
All development will follow the TDD cycle:
1.  **Red:** Write a failing test.
2.  **Green:** Write the minimum code to pass the test.
3.  **Refactor:** Improve the code while keeping tests green.

### Testing Stack
-   **Frontend/E2E:** [Puppeteer](https://pptr.dev/) will be used to verify the UI and user interactions.
-   **Unit Testing:** [Jest](https://jestjs.io/) will be used for game logic. We chose Jest because it provides a complete testing solution with built-in assertions and mocking capabilities.

## Roadmap & Development Steps

### Phase 1: Setup and Infrastructure
-   [ ] Initialize Node.js project.
-   [ ] Configure Jest and Puppeteer.
-   [ ] Create the initial README (This step).

### Phase 2: Board Representation
-   [ ] **Test:** Define the initial board state.
-   [ ] **Impl:** Create the Board class and Piece definitions.

### Phase 3: Frontend Rendering
-   [ ] **Test (Puppeteer):** Verify that an 8x8 grid is rendered.
-   [ ] **Impl:** Build a simple HTML/CSS interface to display the board.

### Phase 4: Game Logic & Movement
-   [ ] **Test:** Unit tests for valid moves for each piece type.
-   [ ] **Impl:** Implement move validation and game rules (check, checkmate).

### Phase 5: User Interaction
-   [ ] **Test (Puppeteer):** Simulate drag-and-drop or click-to-move interactions.
-   [ ] **Impl:** Connect frontend events to the game logic.

### Phase 6: The Engine
-   [ ] **Test:** Verify engine responds to moves.
-   [ ] **Impl:** Implement a basic chess AI.
