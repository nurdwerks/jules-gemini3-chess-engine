
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
    UCI_NNUE_File: 'Evaluation'
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
    BookFile: 'Path to the Polyglot opening book file'
  }
}
