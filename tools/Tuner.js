const Evaluation = require('../src/Evaluation');
const Board = require('../src/Board');

class Tuner {
    constructor() {
        this.K = 1.0; // Scaling factor (usually around 1.0 for centipawns/400?)
        // Sigmoid: 1 / (1 + 10^(-score/400))
    }

    static sigmoid(score, K = 1.0) {
        // Score is in centipawns.
        // K scales the score.
        // Standard Elo formula: 1 / (1 + 10^(-diff/400)).
        // Here diff is 'score'.
        return 1.0 / (1.0 + Math.pow(10, - (K * score) / 400.0));
    }

    calculateError(positions, nnue = null) {
        let totalError = 0.0;
        const board = new Board();

        for (const pos of positions) {
            board.loadFen(pos.fen);
            // Static Eval
            let score;
            if (nnue && nnue.network) {
                score = nnue.evaluate(board);
            } else {
                score = Evaluation.evaluate(board);
            }
            // Result: 1.0, 0.5, 0.0
            const result = pos.result;

            const winProb = Tuner.sigmoid(score, this.K);
            const error = result - winProb;
            totalError += error * error;
        }

        return totalError / positions.length;
    }

    minimize(positions, iterations = 10, learningRate = 10.0, nnue = null) {
        let params;
        let updateParam;

        if (nnue && nnue.network) {
             params = nnue.getParams();
             updateParam = (key, val) => nnue.updateParam(key, val);
        } else {
             params = Evaluation.getParams();
             updateParam = (key, val) => Evaluation.updateParam(key, val);
        }

        const keys = Object.keys(params);

        for (let iter = 0; iter < iterations; iter++) {
            let improved = false;
            for (const key of keys) {
                const originalValue = params[key];
                const initialError = this.calculateError(positions, nnue);

                // Try +1
                updateParam(key, originalValue + 1);
                const errorPlus = this.calculateError(positions, nnue);

                if (errorPlus < initialError) {
                    // Keep +1
                    params[key] = originalValue + 1;
                    improved = true;
                    continue;
                }

                // Try -1
                updateParam(key, originalValue - 1);
                const errorMinus = this.calculateError(positions, nnue);

                if (errorMinus < initialError) {
                    // Keep -1
                    params[key] = originalValue - 1;
                    improved = true;
                } else {
                    // Restore
                    updateParam(key, originalValue);
                }
            }

            if (!improved) break; // Converged locally
        }
    }

    saveWeights(filePath) {
        const params = Evaluation.getParams();
        const fs = require('fs');
        fs.writeFileSync(filePath, JSON.stringify(params, null, 2));
    }
}

module.exports = Tuner;
