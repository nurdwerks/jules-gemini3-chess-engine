window.UIConstants = {
  OPTION_GROUPS: {
    Hash: 'Engine',
    'Clear Hash': 'Engine',
    Threads: 'Engine',
    Ponder: 'Engine',
    MultiPV: 'Engine',
    UCI_LimitStrength: 'Search',
    UCI_Elo: 'Search',
    AspirationWindow: 'Search',
    Contempt: 'Search',
    UseHistory: 'Search',
    UseCaptureHistory: 'Search',
    BookFile: 'Search',
    UCI_UseNNUE: 'Evaluation',
    UCI_NNUE_File: 'Evaluation',
    SyzygyPath: 'Endgame',
    SyzygyProbeLimit: 'Endgame'
  },
  OPTION_TOOLTIPS: {
    Hash: 'Size of the hash table in MB',
    'Clear Hash': 'Clear the hash table',
    Threads: 'Number of CPU threads to use',
    Ponder: "Let the engine think during the opponent's time",
    MultiPV: 'Number of best lines to show',
    UCI_LimitStrength: 'Limit the engine strength',
    UCI_Elo: 'Target Elo rating',
    AspirationWindow: 'Size of the aspiration window in centipawns',
    Contempt: 'Contempt factor (negative for drawishness)',
    UseHistory: 'Use history heuristic',
    UseCaptureHistory: 'Use capture history heuristic',
    UCI_UseNNUE: 'Enable NNUE evaluation',
    UCI_NNUE_File: 'Path or URL to the NNUE network file',
    BookFile: 'Path to the Polyglot opening book file',
    SyzygyPath: 'Path to Syzygy tablebases',
    SyzygyProbeLimit: 'Max pieces for Syzygy probing',
    PawnValue: 'Value of a pawn in centipawns',
    KnightValue: 'Value of a knight in centipawns',
    BishopValue: 'Value of a bishop in centipawns',
    RookValue: 'Value of a rook in centipawns',
    QueenValue: 'Value of a queen in centipawns',
    DoubledPawnPenalty: 'Penalty for doubled pawns',
    IsolatedPawnPenalty: 'Penalty for isolated pawns',
    BackwardPawnPenalty: 'Penalty for backward pawns',
    KnightMobilityBonus: 'Score bonus for knight mobility',
    BishopMobilityBonus: 'Score bonus for bishop mobility',
    RookMobilityBonus: 'Score bonus for rook mobility',
    QueenMobilityBonus: 'Score bonus for queen mobility',
    ShieldBonus: 'Bonus for king pawn shield',
    KnightOutpostBonus: 'Bonus for knight outpost',
    BishopOutpostBonus: 'Bonus for bishop outpost'
  },
  PRESETS: {
    blitz: { Hash: 64, Threads: 1, MultiPV: 1, Contempt: 0, UCI_LimitStrength: false },
    analysis: { Hash: 256, Threads: 4, MultiPV: 3, Contempt: 0, UCI_LimitStrength: false },
    stock: { Hash: 16, Threads: 1, MultiPV: 1, Contempt: 0, UCI_LimitStrength: false }
  },
  inferGroup: (name) => {
    if (['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King', 'Doubled', 'Isolated', 'Backward', 'Shield', 'Outpost', 'Mobility'].some(k => name.includes(k))) {
      return 'Tuning'
    }
    return 'Other'
  }
}
