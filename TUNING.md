# Engine Tuning Guide

This document explains how to tune the engine's evaluation parameters using the Texel tuning method. The engine supports two main workflows: generating self-play data from scratch or tuning from an existing dataset (EPD file).

## Prerequisites

*   Node.js (v14 or later recommended)
*   Dependencies installed (`npm install`)

## Evaluation Parameters

The engine's evaluation parameters are defined in `src/Evaluation.js`. This includes piece values, mobility bonuses, and pawn structure penalties.

When the engine starts, it checks for a `tuned_evaluation_params.json` file in the root directory. If found, it overrides the default values with these parameters.

## Option A: Full Pipeline (Self-Play + Tune)

To generate new training data and tune the engine in one go, use the provided npm script:

```bash
npm run tune
```

This command executes `tools/pipeline.js`, which performs the following steps:
1.  **Self-Play**: Runs a match between two instances of the engine to generate game positions.
2.  **Data Collection**: Saves positions and game results to `tuning_data.epd`.
3.  **Tuning**: Runs the coordinate descent tuner to minimize the evaluation error on the generated positions.
4.  **Save**: Writes the optimized parameters to `tuned_evaluation_params.json`.

*Note: You can adjust the number of games in `tools/pipeline.js` by modifying the `SELFPLAY_GAMES` constant.*

## Option B: Tuning with Existing EPD Files

If you already have a dataset of positions (e.g., from previous runs or external sources), you can tune the engine directly without generating new games.

### 1. Prepare your EPD file
The file should be in Extended Position Description (EPD) format. Each line must contain a FEN string and a game result (`1-0`, `0-1`, or `1/2-1/2`).

Example `data.epd`:
```
rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1; result 1/2-1/2;
rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2; result 1-0;
```

### 2. Run the Tuner
Use the `tools/tune_from_epd.js` script:

```bash
node tools/tune_from_epd.js <path_to_epd> [iterations]
```

*   `<path_to_epd>`: Path to your .epd file.
*   `[iterations]`: (Optional) Number of tuning iterations. Defaults to 5.

**Example:**
```bash
node tools/tune_from_epd.js my_games.epd 10
```

This will load the positions, run the optimization, and update `tuned_evaluation_params.json`.

## Technical Details

The tuning algorithm is a local coordinate descent (similar to Texel tuning). It iteratively adjusts each parameter by a small amount (+1/-1) and checks if the mean squared error between the static evaluation and the actual game result decreases.

*   **Tuner Logic**: `tools/Tuner.js`
*   **EPD Parsing**: `tools/EpdLoader.js`
*   **Pipeline Orchestration**: `tools/pipeline.js`
