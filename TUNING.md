# Engine Tuning Guide

This document explains how to tune the engine's evaluation parameters using the Texel tuning method. The engine supports workflows for self-play data generation, tuning from existing datasets, and rescoring positions.

## Prerequisites

*   Node.js (v14 or later recommended)
*   Dependencies installed (`npm install`)

## Process Flows

The tuning process involves a cyclical workflow of data generation, evaluation, and optimization.

```mermaid
graph TD
    A[Start] --> B{Data Source?};
    B -- "Self-Play (npm run tune)" --> C[Generate Games vs Self];
    B -- "External EPD (download_and_tune.js)" --> D[Load EPD Positions];
    C -- "Parallel Workers" --> W1[Worker Threads];
    D -- "Parallel Workers" --> W1;
    W1 --> E[Game Results (FEN + Score)];
    E --> F[Accumulate Data];
    F --> G[Texel Tuner];
    G -- "Coordinate Descent" --> H[Update tuned_evaluation_params.json];
    H --> I[End / Restart];
```

## What is Being Tuned

The engine's static evaluation function uses a set of configurable parameters to assess position quality. The tuner optimizes these values to minimize the error between the engine's static evaluation and the actual game outcomes.

The following parameters are tuned (defined in `src/Evaluation.js`):

*   **Piece Values**: Base centi-pawn value for Pawn, Knight, Bishop, Rook, Queen.
*   **Pawn Structure**:
    *   `DoubledPawnPenalty`: Penalty for having two pawns on the same file.
    *   `IsolatedPawnPenalty`: Penalty for a pawn with no friendly pawns on adjacent files.
    *   `BackwardPawnPenalty`: Penalty for a pawn that cannot safely advance.
*   **Mobility**:
    *   `KnightMobilityBonus`: Bonus per safe square available to a Knight.
    *   `BishopMobilityBonus`: Bonus per safe square available to a Bishop.
    *   `RookMobilityBonus`: Bonus per safe square available to a Rook.
    *   `QueenMobilityBonus`: Bonus per safe square available to a Queen.
*   **King Safety**:
    *   `ShieldBonus`: Bonus for pawns shielding the king.

When the engine starts, it checks for a `tuned_evaluation_params.json` file in the root directory. If found, it overrides the default values with these parameters.

## Option A: Full Pipeline (Self-Play + Tune)

To generate new training data from scratch (starting from `startpos`) and tune the engine:

```bash
npm run tune
```

This executes `tools/pipeline.js`, which runs self-play matches in parallel, collects data, and runs the tuner.

## Option B: Tuning from Opening Book / Rescoring

To generate games starting from specific positions (e.g., an opening book or test suite), use the `tools/download_and_tune.js` script. You can specify an index from `epd.json` OR a local file path.

**Using a Local EPD File:**
To tune using a local EPD file (e.g., `my_openings.epd`), pass the file path as an argument:

```bash
node tools/download_and_tune.js my_openings.epd
```

The script will:
1.  Verify the file exists.
2.  Use parallel worker threads to play games starting from the positions in the file.
3.  Accumulate the results.
4.  Run the tuner to optimize parameters.

*Note: User-provided local files are NOT deleted after processing.*

**Using a Standard Dataset:**
To use a known dataset (indexed in `epd.json`), pass the index:

```bash
node tools/download_and_tune.js 0
```
(See `node tools/download_and_tune.js` for list of available datasets).

## Option C: Tuning with Existing Data (No Game Generation)

If you already have a dataset of positions *with results* (e.g., from previous runs), you can tune the engine directly without generating new games.

**1. Prepare your EPD file**
Format: `FEN; result <1-0|0-1|1/2-1/2>;`

**2. Run the Tuner**
```bash
node tools/tune_from_epd.js <path_to_epd> [iterations]
```
Example: `node tools/tune_from_epd.js data.epd 10`

## Technical Details

The tuning algorithm is a local coordinate descent (similar to Texel tuning). It iteratively adjusts each parameter by a small amount (+1/-1) and checks if the mean squared error between the static evaluation and the actual game result decreases.

*   **Tuner Logic**: `tools/Tuner.js`
*   **EPD Parsing**: `tools/EpdLoader.js`
*   **Pipeline Orchestration**: `tools/pipeline.js` & `tools/download_and_tune.js`
