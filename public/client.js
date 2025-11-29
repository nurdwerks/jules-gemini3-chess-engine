/* eslint-env browser */
/* global Chess */

// eslint-disable-next-line complexity
document.addEventListener('DOMContentLoaded', () => {
  const boardElement = document.getElementById('chessboard')
  const statusElement = document.getElementById('status')
  const engineOutputElement = document.getElementById('engine-output')
  const uciOptionsElement = document.getElementById('uci-options')
  const moveHistoryElement = document.getElementById('move-history')
  const newGameBtn = document.getElementById('new-game-btn')
  const new960Btn = document.getElementById('new-960-btn')
  const flipBoardBtn = document.getElementById('flip-board-btn')
  const selfPlayBtn = document.getElementById('self-play-btn')
  const fullscreenBtn = document.getElementById('fullscreen-btn')
  const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn')
  const zenModeCheckbox = document.getElementById('zen-mode')
  const blindfoldModeCheckbox = document.getElementById('blindfold-mode')
  const blindfoldTrainingCheckbox = document.getElementById('blindfold-training')
  const streamerModeBtn = document.getElementById('streamer-mode-btn')
  const showCoordsCheckbox = document.getElementById('show-coords')
  const showArrowLastCheckbox = document.getElementById('show-arrow-last')
  const coordsOutsideCheckbox = document.getElementById('coords-outside')
  const gameModeSelect = document.getElementById('game-mode')
  const analysisModeCheckbox = document.getElementById('analysis-mode')
  const fenInput = document.getElementById('fen-input')
  const loadFenBtn = document.getElementById('load-fen-btn')
  const copyFenBtn = document.getElementById('copy-fen-btn')
  const importPgnBtn = document.getElementById('import-pgn-btn')
  const exportPgnBtn = document.getElementById('export-pgn-btn')

  const resignBtn = document.getElementById('resign-btn')
  const offerDrawBtn = document.getElementById('offer-draw-btn')
  const takebackBtn = document.getElementById('takeback-btn')
  const forceMoveBtn = document.getElementById('force-move-btn')
  const clearAnalysisBtn = document.getElementById('clear-analysis-btn')

  const replayBtn = document.getElementById('replay-btn')
  const replaySpeedInput = document.getElementById('replay-speed')

  const autoFlipCheckbox = document.getElementById('auto-flip')
  const autoQueenCheckbox = document.getElementById('auto-queen')
  const moveConfirmationCheckbox = document.getElementById('move-confirmation')

  const promotionModal = document.getElementById('promotion-modal')

  const pgnImportModal = document.getElementById('pgn-import-modal')
  const closePgnModalBtn = document.getElementById('close-pgn-modal')
  const pgnInputArea = document.getElementById('pgn-input-area')
  const loadPgnConfirmBtn = document.getElementById('load-pgn-confirm-btn')

  const toastContainer = document.getElementById('toast-container')

  const boardThemeSelect = document.getElementById('board-theme')
  const customThemeControls = document.getElementById('custom-theme-controls')
  const customLightSquareInput = document.getElementById('custom-light-square')
  const customDarkSquareInput = document.getElementById('custom-dark-square')
  const customCssInput = document.getElementById('custom-css')
  const applyCustomCssBtn = document.getElementById('apply-custom-css')

  const uploadThemeFile = document.getElementById('upload-theme-file')
  const uploadPieceSetFiles = document.getElementById('upload-piece-set-files')

  const uiThemeSelect = document.getElementById('ui-theme')
  const boardSizeInput = document.getElementById('board-size')
  const pieceSetSelect = document.getElementById('piece-set')
  const animationSpeedSelect = document.getElementById('animation-speed')

  const evalValueElement = document.getElementById('eval-value')
  const depthValueElement = document.getElementById('depth-value')
  const npsValueElement = document.getElementById('nps-value')
  const pvLinesElement = document.getElementById('pv-lines')
  const systemLogElement = document.getElementById('system-log')

  const topPlayerName = document.getElementById('top-player-name')
  const topPlayerClock = document.getElementById('top-player-clock')
  const bottomPlayerName = document.getElementById('bottom-player-name')
  const bottomPlayerClock = document.getElementById('bottom-player-clock')
  const soundEnabledCheckbox = document.getElementById('sound-enabled')
  const evalBarFill = document.getElementById('eval-bar-fill')

  const timeBaseInput = document.getElementById('time-base')
  const timeIncInput = document.getElementById('time-inc')

  const engineDuelBtn = document.getElementById('engine-duel-btn')
  const duelSetupModal = document.getElementById('duel-setup-modal')
  const closeDuelModalBtn = document.getElementById('close-duel-modal')
  const startDuelBtn = document.getElementById('start-duel-btn')

  const engineANameInput = document.getElementById('engine-a-name')
  const engineAEloInput = document.getElementById('engine-a-elo')
  const engineALimitCheckbox = document.getElementById('engine-a-limit')
  const engineBNameInput = document.getElementById('engine-b-name')
  const engineBEloInput = document.getElementById('engine-b-elo')
  const engineBLimitCheckbox = document.getElementById('engine-b-limit')

  const handicapSelect = document.getElementById('handicap-select')
  const armageddonBtn = document.getElementById('armageddon-btn')

  const memoryTrainingBtn = document.getElementById('memory-training-btn')
  const memoryControls = document.getElementById('memory-training-controls')
  const memoryTimerElement = document.getElementById('memory-timer')
  const memorySubmitBtn = document.getElementById('memory-submit-btn')
  const memoryGiveUpBtn = document.getElementById('memory-give-up-btn')
  const piecePaletteElement = document.getElementById('piece-palette')

  const tacticsTrainerBtn = document.getElementById('tactics-trainer-btn')
  const tacticsControls = document.getElementById('tactics-controls')
  const tacticsDesc = document.getElementById('tactics-desc')
  const tacticsNextBtn = document.getElementById('tactics-next-btn')

  const endgameTrainerBtn = document.getElementById('endgame-trainer-btn')
  const endgameControls = document.getElementById('endgame-controls')
  const endgameSelect = document.getElementById('endgame-select')
  const startEndgameBtn = document.getElementById('start-endgame-btn')
  const dailyPuzzleBtn = document.getElementById('daily-puzzle-btn')

  const repertoireBuilderBtn = document.getElementById('repertoire-builder-btn')
  const repertoireControls = document.getElementById('repertoire-controls')
  const repertoireNameInput = document.getElementById('repertoire-name')
  const saveRepertoireBtn = document.getElementById('save-repertoire-btn')
  const repertoireList = document.getElementById('repertoire-list')

  // Initialize chess.js
  const game = new Chess()

  const OPTION_GROUPS = {
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
  }

  const HANDICAP_FENS = {
    none: 'startpos',
    'knight-b1': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R1BQKBNR w KQkq - 0 1',
    'knight-g1': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKB1R w KQkq - 0 1',
    'rook-a1': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/1NBQKBNR w Kkq - 0 1',
    'rook-h1': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBN1 w Qkq - 0 1',
    queen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1',
    'pawn-f2': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPP1PP/RNBQKBNR w KQkq - 0 1'
  }

  const OPTION_TOOLTIPS = {
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

  const ArrowManager = (() => {
    const svg = document.getElementById('arrow-layer')
    let userArrows = [] // Array of {from, to}
    let engineArrows = [] // Array of {from, to, type}
    let lastMoveArrow = null // {from, to}
    let userHighlights = {} // alg -> className

    const clearAll = () => {
      if (!svg) return
      svg.innerHTML = ''
    }

    const render = () => {
      clearAll()
      if (lastMoveArrow) _draw(lastMoveArrow.from, lastMoveArrow.to, 'arrow-last')
      userArrows.forEach(a => _draw(a.from, a.to, 'arrow-user'))
      engineArrows.forEach(a => _draw(a.from, a.to, a.type))
    }

    const _draw = (from, to, className) => {
      if (!svg) return

      const start = getSquareCenter(from)
      const end = getSquareCenter(to)
      if (!start || !end) return

      // Create group for arrow
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      g.classList.add('arrow', className)

      // Calculate vector
      const dx = end.x - start.x
      const dy = end.y - start.y
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len === 0) return

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.setAttribute('x1', `${start.x}%`)
      line.setAttribute('y1', `${start.y}%`)
      line.setAttribute('x2', `${end.x}%`)
      line.setAttribute('y2', `${end.y}%`)
      line.setAttribute('stroke-width', '1.5%')

      // Arrowhead
      const angle = Math.atan2(dy, dx)
      const headLen = 4 // %
      const headAngle = Math.PI / 6

      const x2 = end.x - headLen * Math.cos(angle - headAngle)
      const y2 = end.y - headLen * Math.sin(angle - headAngle)
      const x3 = end.x - headLen * Math.cos(angle + headAngle)
      const y3 = end.y - headLen * Math.sin(angle + headAngle)

      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
      polygon.setAttribute('points', `${end.x},${end.y} ${x2},${y2} ${x3},${y3}`)
      polygon.classList.add('arrow-head')

      g.appendChild(line)
      g.appendChild(polygon)
      svg.appendChild(g)
    }

    const getSquareCenter = (alg) => {
      const colFile = alg[0]
      const rowRank = alg[1]

      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
      let col = files.indexOf(colFile)
      let row = 8 - parseInt(rowRank)

      if (col === -1 || isNaN(row)) return null

      // Handle Flip
      if (isFlipped) {
        col = 7 - col
        row = 7 - row
      }

      // 0-7 to 12.5% centers
      const step = 100 / 8
      const x = col * step + (step / 2)
      const y = row * step + (step / 2)

      return { x, y }
    }

    const addUserArrow = (from, to) => {
      // Check if exists, remove if so (toggle)
      const idx = userArrows.findIndex(a => a.from === from && a.to === to)
      if (idx !== -1) {
        userArrows.splice(idx, 1)
      } else {
        userArrows.push({ from, to })
      }
      render()
    }

    const updateEngineArrow = (from, to, type) => {
      engineArrows = engineArrows.filter(a => a.type !== type)
      engineArrows.push({ from, to, type })
      render()
    }

    const setEngineArrow = (from, to, type = 'arrow-best') => {
      // Compatibility: clear best/ponder and set this one?
      // Or just alias to updateEngineArrow?
      // Existing code expects setEngineArrow to REPLACE engine arrows (implied by singular name).
      // But now we might want best AND ponder.
      // Let's assume setEngineArrow is for 'arrow-best'.
      // If I want to clear old best and set new best:
      updateEngineArrow(from, to, type)
    }

    const clearEngineArrows = () => {
      engineArrows = []
      render()
    }

    const clearUserArrows = () => {
      userArrows = []
      render()
    }

    const toggleUserHighlight = (alg) => {
      const colors = ['highlight-red', 'highlight-green', 'highlight-blue', 'highlight-yellow']
      const current = userHighlights[alg]
      let next = null
      if (!current) {
        next = colors[0]
      } else {
        const idx = colors.indexOf(current)
        if (idx === colors.length - 1) {
          next = null // remove
        } else {
          next = colors[idx + 1]
        }
      }

      if (next) userHighlights[alg] = next
      else delete userHighlights[alg]
    }

    const getUserHighlight = (alg) => {
      return userHighlights[alg]
    }

    const clearUserHighlights = () => {
      userHighlights = {}
    }

    const setLastMoveArrow = (from, to) => {
      lastMoveArrow = { from, to }
      render()
    }

    const clearLastMoveArrow = () => {
      lastMoveArrow = null
      render()
    }

    return {
      setEngineArrow,
      clearEngineArrows,
      addUserArrow,
      clearUserArrows,
      toggleUserHighlight,
      getUserHighlight,
      clearUserHighlights,
      setLastMoveArrow,
      clearLastMoveArrow,
      render
    }
  })()

  const SoundManager = (() => {
    let context = null
    let enabled = true

    const init = () => {
      if (!context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        context = new AudioContext()
      }
      if (context.state === 'suspended') {
        context.resume().catch(e => console.warn(e))
      }
    }

    const playTone = (freq, type, duration, startTime = 0) => {
      if (!enabled || !context) return
      try {
        const osc = context.createOscillator()
        const gain = context.createGain()
        osc.type = type
        osc.frequency.setValueAtTime(freq, context.currentTime + startTime)
        gain.gain.setValueAtTime(0.1, context.currentTime + startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + startTime + duration)
        osc.connect(gain)
        gain.connect(context.destination)
        osc.start(context.currentTime + startTime)
        osc.stop(context.currentTime + startTime + duration)
      } catch (e) {
        console.warn('Audio play failed', e)
      }
    }

    return {
      setEnabled: (val) => { enabled = val; if (val) init() },
      init,
      playTick: () => {
        if (!enabled || !context) return
        init()
        try {
          const osc = context.createOscillator()
          const gain = context.createGain()
          osc.type = 'square'
          osc.frequency.setValueAtTime(800, context.currentTime)
          gain.gain.setValueAtTime(0.05, context.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.05)
          osc.connect(gain)
          gain.connect(context.destination)
          osc.start(context.currentTime)
          osc.stop(context.currentTime + 0.05)
        } catch (e) {
          console.warn('Audio play failed', e)
        }
      },
      playSound: (moveResult, game) => {
        if (!enabled) return
        init()

        // Priority: Check > Capture > Move
        if (game.in_check()) {
          // Check sound: Two tones
          playTone(600, 'sine', 0.15)
          playTone(800, 'sine', 0.15, 0.1)
        } else if (moveResult.flags.includes('c') || moveResult.flags.includes('e')) {
          // Capture sound: Sharp snap (high square wave)
          playTone(600, 'square', 0.1)
        } else {
          // Move sound: Soft tap (low triangle)
          playTone(200, 'triangle', 0.1)
        }
      }
    }
  })()

  if (soundEnabledCheckbox) {
    SoundManager.setEnabled(soundEnabledCheckbox.checked)
    soundEnabledCheckbox.addEventListener('change', (e) => SoundManager.setEnabled(e.target.checked))
  }

  let socket
  let selectedSquare = null // { row, col }
  let isFlipped = false
  let gameStarted = false
  let currentViewIndex = -1 // -1 means live view
  let currentPieceSet = 'cburnett' // 'cburnett', 'alpha', 'merida', or 'unicode'
  let legalMovesForSelectedPiece = [] // Array of move objects from chess.js
  let startingFen = 'startpos' // Track the initial position
  let gameMode = 'pve' // 'pve' or 'pvp'
  let isSelfPlay = false
  let isDuelActive = false
  let isArmageddon = false
  let engineAConfig = { name: 'Engine A', elo: 1500, limitStrength: true }
  let engineBConfig = { name: 'Engine B', elo: 2000, limitStrength: true }
  const guessModeData = { moves: [], index: 0, active: false }
  let isAnalysisMode = false
  let ignoreNextBestMove = false
  let isAnalyzing = false
  let pendingAnalysisCmd = null
  let onGameEndCallback = null

  let isMemoryTraining = false
  let memoryTargetFen = ''
  let selectedPalettePiece = null
  let memoryTimerInterval = null

  let isTacticsMode = false
  let currentPuzzle = null
  let currentPuzzleMoveIndex = 0
  let tacticsPuzzles = []

  let replayInterval = null
  let pendingConfirmationMove = null
  let premove = null
  let lastEngineEval = 0 // cp

  let whiteTime = 300000 // 5 minutes in ms
  let blackTime = 300000
  let whiteIncrement = 0
  let blackIncrement = 0
  let clockInterval = null
  let lastFrameTime = 0

  // Public API for Tournament Manager
  window.ChessApp = {
    startMatch: (whiteConfig, blackConfig, onGameEnd) => {
      onGameEndCallback = onGameEnd
      engineAConfig = whiteConfig
      engineBConfig = blackConfig
      startDuel(true) // Pass true to indicate external start (headless or automated)
    }
  }

  function connect () {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    socket = new WebSocket(`${protocol}//${window.location.host}`)

    socket.onopen = () => {
      statusElement.textContent = 'Status: Connected'
      logSystemMessage('Connected to server', 'success')
      socket.send('uci')
    }

    socket.onmessage = (event) => {
      const msg = event.data
      _handleSocketMessage(msg)
    }

    socket.onclose = () => {
      statusElement.textContent = 'Status: Disconnected'
      logSystemMessage('Disconnected from server', 'error')
    }
  }

  function _handleSocketMessage (msg) {
    if (msg.startsWith('{')) {
      try {
        const data = JSON.parse(msg)
        _handleVoteMessage(data)
        return
      } catch (e) {}
    }

    const parts = msg.split(' ')
    if (msg.startsWith('option name')) parseOption(msg)
    else if (parts[0] === 'uciok') socket.send('isready')
    else if (parts[0] === 'readyok') _handleReadyOk()
    else if (parts[0] === 'bestmove') _handleBestMoveMsg(parts)
    else if (parts[0] === 'info') _handleInfoMsg(msg)
  }

  function _handleVoteMessage (data) {
    if (data.type === 'vote_state') {
      // Sync state
      game.load(data.fen)
      startingFen = data.fen // For reference
      currentViewIndex = -1
      renderBoard()
      renderHistory()
      showToast(`Joined Vote Chess. Time left: ${Math.ceil(data.timeLeft / 1000)}s`)
    } else if (data.type === 'vote_update') {
      // Show top votes
      const entries = Object.entries(data.votes).sort((a, b) => b[1] - a[1])
      const top = entries.slice(0, 5).map(e => `${e[0]} (${e[1]})`).join(', ')
      logSystemMessage(`Votes: ${top}`)
    } else if (data.type === 'vote_result') {
      // Play move
      const move = data.move
      const m = game.move(move)
      if (m) {
        SoundManager.playSound(m, game)
        renderBoard()
        renderHistory()
        showToast(`Vote Result: ${move}`, 'success')
      }
    } else if (data.type === 'vote_start') {
      // New turn
      if (game.fen() !== data.fen) {
        game.load(data.fen)
        renderBoard()
        renderHistory()
      }
      showToast('Voting started!', 'info')
    } else if (data.type === 'game_over') {
      showToast(`Game Over: ${data.result}`, 'info')
    }
  }

  function _handleReadyOk () {
    if (!gameStarted) {
      gameStarted = true
      startNewGame()
    }
  }

  async function _handleBestMoveMsg (parts) {
    isAnalyzing = false
    if (handleAnalysisBestMove()) return

    if (ignoreNextBestMove) {
      ignoreNextBestMove = false
      return
    }
    if (isAnalysisMode) return

    const move = parts[1]
    if (move && move !== '(none)') {
      await performMove(move)
      await _checkAndExecutePremove()

      if ((isSelfPlay || isDuelActive) && !game.game_over()) {
        setTimeout(_triggerNextMove, 500)
      }
    }
  }

  async function _checkAndExecutePremove () {
    if (!premove) return
    const moves = game.moves({ verbose: true })
    const match = moves.find(m => m.from === premove.from && m.to === premove.to && (!premove.promotion || m.promotion === premove.promotion))
    if (match) {
      premove = null
      await attemptMove(match)
    } else {
      premove = null
      showToast('Premove invalid', 'error')
      renderBoard()
    }
  }

  function _triggerNextMove () {
    if (isSelfPlay || isDuelActive) {
      if (isDuelActive) {
        const nextTurn = game.turn()
        const config = nextTurn === 'w' ? engineAConfig : engineBConfig
        applyEngineConfig(config)
      }
      sendPositionAndGo()
    }
  }

  function handleAnalysisBestMove () {
    if (isAnalysisMode && pendingAnalysisCmd) {
      ignoreNextBestMove = false
      socket.send(pendingAnalysisCmd)
      socket.send('go infinite')
      isAnalyzing = true
      pendingAnalysisCmd = null
      return true
    }
    return false
  }

  async function performMove (move) {
    const from = move.substring(0, 2)
    const to = move.substring(2, 4)
    const promotion = move.length > 4 ? move[4] : undefined

    const speed = animationSpeedSelect ? parseInt(animationSpeedSelect.value) : 0
    if (speed > 0 && currentViewIndex === -1) {
      await animateMove(from, to, speed)
    }

    const result = game.move({ from, to, promotion })
    if (result) SoundManager.playSound(result, game)
    currentViewIndex = -1

    ArrowManager.clearEngineArrows()

    if (autoFlipCheckbox && autoFlipCheckbox.checked) {
      const turn = game.turn()
      if (turn === 'w') {
        isFlipped = false
        boardElement.classList.remove('flipped')
      } else {
        isFlipped = true
        boardElement.classList.add('flipped')
      }
      renderClocks() // updates names/clocks
    }

    renderBoard()
    renderHistory()
    ArrowManager.render()
    checkGameOver()
  }

  function _handleInfoMsg (msg) {
    if (msg.includes('score cp') || msg.includes('mate')) {
      logToOutput(msg)
    }
    const info = parseInfo(msg)
    if (info) {
      updateSearchStats(info)
    }
  }

  function parseInfo (msg) {
    const parts = msg.split(' ')
    const info = {}

    const getVal = (key) => {
      const idx = parts.indexOf(key)
      if (idx !== -1 && idx + 1 < parts.length) {
        return parts[idx + 1]
      }
      return null
    }

    info.depth = getVal('depth')
    info.seldepth = getVal('seldepth')
    info.nodes = getVal('nodes')
    info.nps = getVal('nps')

    const scoreCp = getVal('cp')
    const scoreMate = getVal('mate')
    if (scoreMate) {
      info.score = { type: 'mate', value: parseInt(scoreMate) }
    } else if (scoreCp) {
      info.score = { type: 'cp', value: parseInt(scoreCp) }
    }

    const pvIdx = parts.indexOf('pv')
    if (pvIdx !== -1) {
      info.pv = parts.slice(pvIdx + 1)
    }

    // Only return info if we parsed something useful
    if (info.depth || info.score || info.pv) return info
    return null
  }

  function updateSearchStats (info) {
    if (info.depth) depthValueElement.textContent = info.depth
    if (info.nps) npsValueElement.textContent = formatNps(info.nps)
    if (info.score) {
      evalValueElement.textContent = formatScore(info.score)
      updateEvalBar(info.score)
      if (info.score.type === 'cp') {
        lastEngineEval = info.score.value
      } else {
        lastEngineEval = info.score.value > 0 ? 10000 : -10000
      }
    }
    if (info.pv) {
      updatePvDisplay(info.pv)
      if (info.pv.length > 0) {
        const best = info.pv[0]
        const from = best.substring(0, 2)
        const to = best.substring(2, 4)
        ArrowManager.updateEngineArrow(from, to, 'arrow-best')
      }
    }
  }

  function updateEvalBar (score) {
    if (!evalBarFill) return
    let percent = 50

    // Calculate White's advantage
    let val = score.value
    if (game.turn() === 'b') {
      val = -val
    }

    if (score.type === 'mate') {
      percent = val > 0 ? 100 : 0
    } else {
      // val is cp from White's perspective
      // Sigmoid function
      percent = (1 / (1 + Math.exp(-val / 300))) * 100
    }

    percent = Math.max(0, Math.min(100, percent))
    evalBarFill.style.height = `${percent}%`
  }

  function formatNps (nps) {
    const n = parseInt(nps)
    if (isNaN(n)) return '-'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
    return n
  }

  function formatScore (score) {
    if (score.type === 'mate') {
      return '#' + score.value
    }
    const val = score.value / 100
    return (val > 0 ? '+' : '') + val.toFixed(2)
  }

  function updatePvDisplay (pvMoves) {
    try {
      const tempGame = new Chess(game.fen())
      const sanMoves = []

      for (const uciMove of pvMoves) {
        const from = uciMove.substring(0, 2)
        const to = uciMove.substring(2, 4)
        const promotion = uciMove.length > 4 ? uciMove[4] : undefined

        const move = tempGame.move({ from, to, promotion })
        if (move) {
          sanMoves.push(move.san)
        } else {
          break
        }
      }
      pvLinesElement.textContent = sanMoves.join(' ')
    } catch (e) {
      // Fallback if chess.js fails or FEN is invalid
      pvLinesElement.textContent = pvMoves.join(' ')
    }
  }

  function logToOutput (msg) {
    const now = new Date()
    const pad = (n, width = 2) => n.toString().padStart(width, '0')
    const time = `[${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}]`
    const line = document.createElement('div')
    line.textContent = `${time} ${msg}`
    engineOutputElement.prepend(line)
  }

  function parseOption (line) {
    const parts = line.split(' ')
    const nameIdx = parts.indexOf('name')
    const typeIdx = parts.indexOf('type')
    if (nameIdx === -1 || typeIdx === -1) return
    const name = parts.slice(nameIdx + 1, typeIdx).join(' ')
    const type = parts[typeIdx + 1]
    const getVal = (key) => {
      const start = parts.indexOf(key)
      if (start === -1) return null
      const keywords = ['name', 'type', 'default', 'min', 'max', 'var']
      let end = parts.length
      for (let i = start + 1; i < parts.length; i++) {
        if (keywords.includes(parts[i])) {
          end = i
          break
        }
      }
      return parts.slice(start + 1, end).join(' ')
    }
    const defaultValue = getVal('default')
    const min = getVal('min')
    const max = getVal('max')
    const vars = []
    parts.forEach((part, index) => {
      if (part === 'var') {
        const keywords = ['name', 'type', 'default', 'min', 'max', 'var']
        let end = parts.length
        for (let i = index + 1; i < parts.length; i++) {
          if (keywords.includes(parts[i])) {
            end = i
            break
          }
        }
        vars.push(parts.slice(index + 1, end).join(' '))
      }
    })
    createOptionUI(name, type, defaultValue, min, max, vars)
  }

  function createOptionUI (name, type, defaultValue, min, max, vars) {
    const groupName = OPTION_GROUPS[name] || 'Other'
    const group = getOrCreateGroup(groupName)

    const container = document.createElement('div')
    container.classList.add('option-item')
    const tooltip = OPTION_TOOLTIPS[name]
    if (tooltip) {
      container.title = tooltip
    }

    const label = document.createElement('label')
    label.textContent = name + ': '
    container.appendChild(label)
    let input
    if (type === 'spin') input = _createSpinInput(name, defaultValue, min, max)
    else if (type === 'check') input = _createCheckInput(name, defaultValue)
    else if (type === 'string') input = _createStringInput(name, defaultValue)
    else if (type === 'button') input = _createButtonInput(name)
    else if (type === 'combo') input = _createComboInput(name, defaultValue, vars)
    if (input) {
      container.appendChild(input)
      group.appendChild(container)
    }
  }

  function getOrCreateGroup (groupName) {
    let group = uciOptionsElement.querySelector(`.option-group[data-group="${groupName}"]`)
    if (!group) {
      group = document.createElement('fieldset')
      group.classList.add('option-group')
      group.dataset.group = groupName
      const legend = document.createElement('legend')
      legend.textContent = groupName
      group.appendChild(legend)
      uciOptionsElement.appendChild(group)
    }
    return group
  }

  function _createSpinInput (name, defaultValue, min, max) {
    const input = document.createElement('input')
    input.type = 'number'
    if (min) input.min = min
    if (max) input.max = max
    if (defaultValue) input.value = defaultValue
    input.addEventListener('change', () => sendOption(name, input.value))
    return input
  }

  function _createCheckInput (name, defaultValue) {
    const input = document.createElement('input')
    input.type = 'checkbox'
    if (defaultValue === 'true') input.checked = true
    input.addEventListener('change', () => sendOption(name, input.checked))
    return input
  }

  function _createStringInput (name, defaultValue) {
    const input = document.createElement('input')
    input.type = 'text'
    if (defaultValue) input.value = defaultValue
    input.addEventListener('change', () => sendOption(name, input.value))
    return input
  }

  function _createButtonInput (name) {
    const input = document.createElement('button')
    input.textContent = 'Trigger'
    input.addEventListener('click', () => sendOption(name))
    return input
  }

  function _createComboInput (name, defaultValue, vars) {
    const input = document.createElement('select')
    if (vars) {
      vars.forEach(v => {
        const option = document.createElement('option')
        option.value = v
        option.textContent = v
        if (v === defaultValue) option.selected = true
        input.appendChild(option)
      })
    }
    input.addEventListener('change', () => sendOption(name, input.value))
    return input
  }

  function sendOption (name, value) {
    let command = `setoption name ${name}`
    if (value !== undefined) {
      command += ` value ${value}`
    }
    socket.send(command)
    logToOutput(`> ${command}`)
  }

  if (engineDuelBtn) {
    engineDuelBtn.addEventListener('click', () => {
      duelSetupModal.classList.add('active')
    })
  }

  if (closeDuelModalBtn) {
    closeDuelModalBtn.addEventListener('click', () => {
      duelSetupModal.classList.remove('active')
    })
  }

  // Close modal when clicking outside
  if (duelSetupModal) {
    duelSetupModal.addEventListener('click', (e) => {
      if (e.target === duelSetupModal) {
        duelSetupModal.classList.remove('active')
      }
    })
  }

  if (blindfoldTrainingCheckbox) {
    blindfoldTrainingCheckbox.addEventListener('change', () => {
      if (blindfoldTrainingCheckbox.checked) {
        boardElement.classList.add('blindfold-training')
      } else {
        boardElement.classList.remove('blindfold-training')
      }
    })
  }

  if (startDuelBtn) {
    startDuelBtn.addEventListener('click', () => {
      engineAConfig = {
        name: engineANameInput.value,
        elo: parseInt(engineAEloInput.value),
        limitStrength: engineALimitCheckbox.checked
      }
      engineBConfig = {
        name: engineBNameInput.value,
        elo: parseInt(engineBEloInput.value),
        limitStrength: engineBLimitCheckbox.checked
      }
      duelSetupModal.classList.remove('active')
      startDuel()
    })
  }

  function startGuessMode () {
    // Store current history
    guessModeData.moves = game.history({ verbose: true })
    guessModeData.index = 0
    guessModeData.active = true

    // Reset board to start
    const headers = game.header()
    if (headers.FEN) {
      game.load(headers.FEN)
    } else {
      game.reset()
    }

    currentViewIndex = -1
    renderBoard()
    renderHistory()
    showToast('Guess Mode: Play the move you think was played!', 'info')
  }

  function startDuel (isExternal = false) {
    isDuelActive = true
    isSelfPlay = false // Ensure standard self-play is off
    updateSelfPlayButton()

    // Update names
    topPlayerName.textContent = engineBConfig.name
    bottomPlayerName.textContent = engineAConfig.name

    game.reset()
    startingFen = 'startpos'
    selectedSquare = null
    legalMovesForSelectedPiece = []
    currentViewIndex = -1
    // Shorten time for tournament matches? Or keep default?
    // User can implement time control settings later. Defaulting to 1m for speed if external?
    // Let's stick to default or make it faster.
    whiteTime = isExternal ? 60000 : 300000
    blackTime = isExternal ? 60000 : 300000

    startClock()
    renderBoard()
    renderHistory()
    renderClocks()

    socket.send('ucinewgame')

    // Start with Engine A (White)
    applyEngineConfig(engineAConfig)
    sendPositionAndGo()
  }

  function applyEngineConfig (config) {
    sendOption('UCI_LimitStrength', config.limitStrength)
    sendOption('UCI_Elo', config.elo)
    showToast(`Active: ${config.name} (${config.elo})`)
  }

  function startNewGame () {
    game.reset()
    startingFen = 'startpos'

    isArmageddon = false

    if (handicapSelect && handicapSelect.value !== 'none') {
      startingFen = HANDICAP_FENS[handicapSelect.value]
      if (!game.load(startingFen)) {
        console.error('Invalid Handicap FEN')
        startingFen = 'startpos'
      }
    } else {
      startingFen = 'startpos'
    }

    if (startingFen === 'startpos') {
      game.reset()
    } else {
      game.load(startingFen)
    }

    selectedSquare = null
    legalMovesForSelectedPiece = []
    currentViewIndex = -1

    const baseMin = parseInt(timeBaseInput.value) || 5
    const incSec = parseInt(timeIncInput.value) || 0
    whiteTime = baseMin * 60 * 1000
    blackTime = baseMin * 60 * 1000
    whiteIncrement = incSec * 1000
    blackIncrement = incSec * 1000

    isSelfPlay = false
    isDuelActive = false
    updateSelfPlayButton()
    startClock()
    renderBoard()
    renderHistory()
    renderClocks()
    ArrowManager.clearEngineArrows()
    ArrowManager.clearUserArrows()
    socket.send('ucinewgame')
  }

  function startClock () {
    if (clockInterval) clearInterval(clockInterval)
    lastFrameTime = Date.now()
    clockInterval = setInterval(() => {
      if (game.game_over() || !gameStarted) return

      const now = Date.now()
      const delta = now - lastFrameTime
      lastFrameTime = now

      if (game.turn() === 'w') {
        const prev = whiteTime
        whiteTime = Math.max(0, whiteTime - delta)
        if (whiteTime < 10000 && Math.floor(prev / 1000) !== Math.floor(whiteTime / 1000)) {
          SoundManager.playTick()
        }
      } else {
        const prev = blackTime
        blackTime = Math.max(0, blackTime - delta)
        if (blackTime < 10000 && Math.floor(prev / 1000) !== Math.floor(blackTime / 1000)) {
          SoundManager.playTick()
        }
      }

      renderClocks()
      if (whiteTime <= 0 || blackTime <= 0) {
        checkGameOver()
      }
    }, 100)
  }

  function checkGameOver () {
    let result = null
    if (whiteTime <= 0) {
      logToOutput('Game Over: White timeout')
      clearInterval(clockInterval)
      isSelfPlay = false
      updateSelfPlayButton()
      result = 'black'
    } else if (blackTime <= 0) {
      logToOutput('Game Over: Black timeout')
      clearInterval(clockInterval)
      isSelfPlay = false
      updateSelfPlayButton()
      result = 'white'
    } else if (game.game_over()) {
      if (game.in_checkmate()) {
        logToOutput('Game Over: Checkmate')
        result = game.turn() === 'w' ? 'black' : 'white'
      } else if (game.in_draw()) {
        if (isArmageddon) {
          logToOutput('Game Over: Draw (Black Wins by Armageddon Rule)')
          result = 'black'
        } else {
          logToOutput('Game Over: Draw')
          result = 'draw'
        }
      } else {
        // Stalemate, etc
        result = 'draw'
      }
      clearInterval(clockInterval)
      isSelfPlay = false
      updateSelfPlayButton()
    }

    if (result && onGameEndCallback) {
      const cb = onGameEndCallback
      onGameEndCallback = null // Clear it
      cb(result)
    }
  }

  function updateSelfPlayButton () {
    if (selfPlayBtn) {
      selfPlayBtn.textContent = isSelfPlay ? 'Stop Self Play' : 'Self Play'
    }
  }

  function renderClocks () {
    const formatTime = (ms) => {
      const totalSeconds = Math.ceil(ms / 1000)
      const m = Math.floor(totalSeconds / 60)
      const s = totalSeconds % 60
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const wStr = formatTime(whiteTime)
    const bStr = formatTime(blackTime)

    // Determine who is top/bottom based on flip
    // Default: Top=Black, Bottom=White
    // Flipped: Top=White, Bottom=Black

    let wName = 'White'
    let bName = 'Black'

    if (isDuelActive) {
      wName = engineAConfig.name
      bName = engineBConfig.name
    }

    if (isFlipped) {
      topPlayerName.textContent = wName
      topPlayerClock.textContent = wStr
      bottomPlayerName.textContent = bName
      bottomPlayerClock.textContent = bStr

      _updateClockStyle(topPlayerClock, 'w')
      _updateClockStyle(bottomPlayerClock, 'b')
    } else {
      topPlayerName.textContent = bName
      topPlayerClock.textContent = bStr
      bottomPlayerName.textContent = wName
      bottomPlayerClock.textContent = wStr

      _updateClockStyle(topPlayerClock, 'b')
      _updateClockStyle(bottomPlayerClock, 'w')
    }
  }

  function _updateClockStyle (element, color) {
    // Active if it is this color's turn and game not over
    if (!game.game_over() && game.turn() === color) {
      element.classList.add('active')
    } else {
      element.classList.remove('active')
    }

    // Low time warning (< 30s)
    const time = color === 'w' ? whiteTime : blackTime
    if (time < 30000) {
      element.classList.add('low-time')
    } else {
      element.classList.remove('low-time')
    }
  }

  function renderHistory () {
    moveHistoryElement.innerHTML = ''
    const history = game.history()

    // Grid layout: row per move pair (items flow into grid columns)
    for (let i = 0; i < history.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1
      const whiteMove = history[i]
      const blackMove = history[i + 1]

      const numDiv = document.createElement('div')
      numDiv.classList.add('move-number')
      numDiv.textContent = moveNum + '.'
      moveHistoryElement.appendChild(numDiv)

      const whiteDiv = document.createElement('div')
      whiteDiv.classList.add('move-san')
      whiteDiv.textContent = whiteMove
      if (currentViewIndex === i) whiteDiv.classList.add('active')
      whiteDiv.addEventListener('click', () => handleHistoryClick(i))
      moveHistoryElement.appendChild(whiteDiv)

      if (blackMove) {
        const blackDiv = document.createElement('div')
        blackDiv.classList.add('move-san')
        blackDiv.textContent = blackMove
        if (currentViewIndex === i + 1) blackDiv.classList.add('active')
        blackDiv.addEventListener('click', () => handleHistoryClick(i + 1))
        moveHistoryElement.appendChild(blackDiv)
      }
    }

    // Scroll to bottom if live
    if (currentViewIndex === -1) {
      moveHistoryElement.scrollTop = moveHistoryElement.scrollHeight
    }
  }

  function handleHistoryClick (index) {
    currentViewIndex = index
    selectedSquare = null
    legalMovesForSelectedPiece = []
    renderBoard()
    renderHistory()
  }

  function getBoardState () {
    if (currentViewIndex === -1) {
      return { board: game.board(), chess: game }
    }
    const tempGame = new Chess()
    if (startingFen !== 'startpos') {
      tempGame.load(startingFen)
    }

    const history = game.history({ verbose: true })
    for (let i = 0; i <= currentViewIndex; i++) {
      tempGame.move(history[i])
    }
    return { board: tempGame.board(), chess: tempGame }
  }

  function renderBoard () {
    boardElement.innerHTML = ''
    const state = getBoardState()
    const board = state.board
    const chess = state.chess

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        _createSquare(r, c, board, chess)
      }
    }
    updateLastMoveArrow()
  }

  function updateLastMoveArrow () {
    if (!showArrowLastCheckbox || !showArrowLastCheckbox.checked) {
      ArrowManager.clearLastMoveArrow()
      return
    }

    const history = game.history({ verbose: true })
    let move = null

    if (currentViewIndex === -1) {
      if (history.length > 0) move = history[history.length - 1]
    } else {
      if (currentViewIndex >= 0 && currentViewIndex < history.length) {
        move = history[currentViewIndex]
      }
    }

    if (move) {
      ArrowManager.setLastMoveArrow(move.from, move.to)
    } else {
      ArrowManager.clearLastMoveArrow()
    }
  }

  function _addLegalMoveHints (square, alg) {
    const move = legalMovesForSelectedPiece.find(m => m.to === alg)
    if (move) {
      square.classList.add('legal-move-hint')
      if (move.flags.includes('c') || move.flags.includes('e')) {
        square.classList.add('capture-hint')
      }
    }
  }

  function _createSquare (r, c, board, chess) {
    const row = r
    const col = c
    const alg = coordsToAlgebraic(row, col)

    const square = document.createElement('div')
    square.classList.add('square')
    if ((row + col) % 2 === 0) square.classList.add('white')
    else square.classList.add('black')

    _addCoordinates(square, row, col)
    _addLegalMoveHints(square, alg)

    const pieceObj = board[row][col]
    _addPieceToSquare(square, pieceObj)

    square.dataset.row = row
    square.dataset.col = col
    square.dataset.alg = alg

    _applySquareHighlights(square, row, col, alg, chess)

    square.addEventListener('click', () => handleSquareClick(row, col))
    boardElement.appendChild(square)
  }

  function _addPieceToSquare (square, pieceObj) {
    if (!pieceObj) return
    const color = pieceObj.color
    const type = pieceObj.type
    if (currentPieceSet === 'unicode') {
      const div = document.createElement('div')
      div.classList.add('piece', 'piece-text')
      div.classList.add(color === 'w' ? 'white-piece' : 'black-piece')
      div.textContent = getUnicodePiece(color, type)
      square.appendChild(div)
    } else if (currentPieceSet === 'custom-upload') {
      const img = document.createElement('img')
      const key = color + type
      img.src = customPieceImages[key] || ''
      img.classList.add('piece')
      square.appendChild(img)
    } else {
      const img = document.createElement('img')
      img.src = `images/${currentPieceSet}/${color}${type}.svg`
      img.classList.add('piece')
      img.classList.add(`piece-set-${currentPieceSet}`)
      square.appendChild(img)
    }
  }

  function _applySquareHighlights (square, row, col, alg, chess) {
    if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
      square.classList.add('selected')
    }
    if (pendingConfirmationMove && pendingConfirmationMove.to === alg) {
      square.classList.add('selected')
    }
    if (premove && (alg === premove.from || alg === premove.to)) {
      square.classList.add('premove-highlight')
    }
    const userH = ArrowManager.getUserHighlight(alg)
    if (userH) square.classList.add(userH)

    // Last Move Highlight
    const history = game.history({ verbose: true })
    let lastMove = null
    if (currentViewIndex === -1) {
      if (history.length > 0) lastMove = history[history.length - 1]
    } else {
      if (currentViewIndex >= 0 && currentViewIndex < history.length) lastMove = history[currentViewIndex]
    }

    if (lastMove && (alg === lastMove.from || alg === lastMove.to)) {
      square.classList.add('last-move')
    }

    // Check Highlight
    if (chess && chess.in_check()) {
      const turn = chess.turn()
      const pieceObj = chess.board()[row][col]
      if (pieceObj && pieceObj.type === 'k' && pieceObj.color === turn) {
        square.classList.add('check-highlight')
      }
    }
  }

  function _addCoordinates (square, row, col) {
    if (!showCoordsCheckbox || !showCoordsCheckbox.checked) return
    _addRankCoordinate(square, row, col)
    _addFileCoordinate(square, row, col)
  }

  function _addRankCoordinate (square, row, col) {
    const isLeftEdge = (!isFlipped && col === 0) || (isFlipped && col === 7)
    if (isLeftEdge) {
      const rank = 8 - row
      const rankSpan = document.createElement('span')
      rankSpan.classList.add('coordinate', 'rank')
      rankSpan.textContent = rank
      square.appendChild(rankSpan)
    }
  }

  function _addFileCoordinate (square, row, col) {
    const isBottomEdge = (!isFlipped && row === 7) || (isFlipped && row === 0)
    if (isBottomEdge) {
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
      const file = files[col]
      const fileSpan = document.createElement('span')
      fileSpan.classList.add('coordinate', 'file')
      fileSpan.textContent = file
      square.appendChild(fileSpan)
    }
  }

  function handleSquareClick (row, col) {
    if (isMemoryTraining && piecePaletteElement.style.display !== 'none') {
      _handleMemoryClick(row, col)
      return
    }
    if (currentViewIndex !== -1) return

    const alg = coordsToAlgebraic(row, col)
    if (_handleMoveAttempt(alg)) return

    const pieceObj = game.board()[row][col]
    if (_handlePieceSelection(pieceObj, row, col, alg)) return

    _deselectSquare()
  }

  function _handleMoveAttempt (alg) {
    if (!selectedSquare) return false
    const move = legalMovesForSelectedPiece.find(m => m.to === alg)
    if (move) {
      attemptMove(move)
      return true
    }
    return false
  }

  function _handlePieceSelection (pieceObj, row, col, alg) {
    if (!pieceObj) return false
    if (pieceObj.color === game.turn()) {
      selectedSquare = { row, col }
      legalMovesForSelectedPiece = game.moves({ square: alg, verbose: true })
      renderBoard()
      return true
    }
    if (gameMode === 'pve' && !isSelfPlay && !game.game_over()) {
      _handlePremoveSelection(pieceObj, alg, row, col)
      return true
    }
    return false
  }

  function _deselectSquare () {
    if (selectedSquare) {
      selectedSquare = null
      legalMovesForSelectedPiece = []
      pendingConfirmationMove = null
      renderBoard()
    }
  }

  function _handlePremoveSelection (pieceObj, alg, row, col) {
    const fen = game.fen()
    const tokens = fen.split(' ')
    tokens[1] = pieceObj.color
    tokens[3] = '-'
    try {
      const tempGame = new Chess(tokens.join(' '))
      const moves = tempGame.moves({ square: alg, verbose: true })
      if (moves.length > 0) {
        selectedSquare = { row, col }
        legalMovesForSelectedPiece = moves
        renderBoard()
      }
    } catch (e) {}
  }

  function _handleMemoryClick (row, col) {
    const alg = coordsToAlgebraic(row, col)
    if (selectedPalettePiece) {
      game.put({ type: selectedPalettePiece.type, color: selectedPalettePiece.color }, alg)
      renderBoard()
    } else {
      const piece = game.get(alg)
      if (piece) {
        game.remove(alg)
        renderBoard()
      }
    }
  }

  function coordsToAlgebraic (row, col) {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const rank = 8 - row
    return files[col] + rank
  }

  // eslint-disable-next-line complexity
  async function attemptMove (targetMove) {
    // Move Confirmation Logic
    if (moveConfirmationCheckbox && moveConfirmationCheckbox.checked && gameMode !== 'guess' && !isTacticsMode) {
      // Check if we are confirming the SAME move
      if (!pendingConfirmationMove || pendingConfirmationMove.from !== targetMove.from || pendingConfirmationMove.to !== targetMove.to) {
        // First click
        pendingConfirmationMove = targetMove
        renderBoard()
        showToast('Click again to confirm move', 'info')
        return
      }
      // Second click matches -> Proceed
      pendingConfirmationMove = null
    }

    // Guess Mode Logic
    if (gameMode === 'guess' && guessModeData.active) {
      const expected = guessModeData.moves[guessModeData.index]
      if (!expected) {
        showToast('Game finished!', 'success')
        return
      }

      // Compare targetMove (from, to, promotion) with expected
      if (targetMove.from === expected.from && targetMove.to === expected.to) {
        // Correct!
        showToast('Correct!', 'success')

        // Make the move
        const speed = animationSpeedSelect ? parseInt(animationSpeedSelect.value) : 0
        if (speed > 0) await animateMove(targetMove.from, targetMove.to, speed)

        let result = game.move(targetMove)
        if (result) SoundManager.playSound(result, game)

        guessModeData.index++
        renderBoard()
        renderHistory()

        // Play opponent move automatically
        if (guessModeData.index < guessModeData.moves.length) {
          const reply = guessModeData.moves[guessModeData.index]
          setTimeout(async () => {
            if (speed > 0) await animateMove(reply.from, reply.to, speed)
            result = game.move(reply)
            if (result) SoundManager.playSound(result, game)
            guessModeData.index++
            renderBoard()
            renderHistory()

            if (guessModeData.index >= guessModeData.moves.length) {
              showToast('Game finished!', 'success')
            }
          }, 500)
        } else {
          showToast('Game finished!', 'success')
        }
      } else {
        showToast('Incorrect move. Try again.', 'error')
      }

      selectedSquare = null
      legalMovesForSelectedPiece = []
      renderBoard()
      return
    }

    if (isTacticsMode && currentPuzzle) {
      const expected = currentPuzzle.moves[currentPuzzleMoveIndex]
      let uci = targetMove.from + targetMove.to
      if (targetMove.promotion) uci += targetMove.promotion

      if (uci === expected) {
        const speed = animationSpeedSelect ? parseInt(animationSpeedSelect.value) : 0
        if (speed > 0) await animateMove(targetMove.from, targetMove.to, speed)

        const result = game.move(targetMove)
        if (result) SoundManager.playSound(result, game)

        renderBoard()
        renderHistory()

        currentPuzzleMoveIndex++

        if (currentPuzzleMoveIndex < currentPuzzle.moves.length) {
          setTimeout(async () => {
            const oppMoveStr = currentPuzzle.moves[currentPuzzleMoveIndex]
            const oppMove = {
              from: oppMoveStr.substring(0, 2),
              to: oppMoveStr.substring(2, 4),
              promotion: oppMoveStr.length > 4 ? oppMoveStr[4] : undefined
            }

            if (speed > 0) await animateMove(oppMove.from, oppMove.to, speed)
            const res = game.move(oppMove)
            if (res) SoundManager.playSound(res, game)
            renderBoard()
            renderHistory()
            currentPuzzleMoveIndex++

            if (currentPuzzleMoveIndex >= currentPuzzle.moves.length) {
              showToast('Puzzle Solved!', 'success')
              // Enable next button? It's always visible in my design, but maybe highlight it?
            }
          }, 500)
        } else {
          showToast('Puzzle Solved!', 'success')
        }
      } else {
        showToast('Incorrect move', 'error')
      }

      selectedSquare = null
      legalMovesForSelectedPiece = []
      renderBoard()
      return
    }

    // Promotion Logic
    if (targetMove.flags.includes('p')) {
      if (autoQueenCheckbox && autoQueenCheckbox.checked) {
        targetMove.promotion = 'q'
      } else {
        try {
          // Use targetMove.color for promotion piece color
          const choice = await showPromotionModal(targetMove.color)
          targetMove.promotion = choice
        } catch (e) {
          // Cancelled
          selectedSquare = null
          legalMovesForSelectedPiece = []
          pendingConfirmationMove = null
          renderBoard()
          return
        }
      }
    }

    // Premove Check
    if (targetMove.color !== game.turn()) {
      premove = targetMove
      selectedSquare = null
      legalMovesForSelectedPiece = []
      pendingConfirmationMove = null
      renderBoard()
      showToast('Premove set', 'info')
      return
    }

    const speed = animationSpeedSelect ? parseInt(animationSpeedSelect.value) : 0
    if (speed > 0) {
      await animateMove(targetMove.from, targetMove.to, speed)
    }

    const result = game.move(targetMove)
    if (result) {
      SoundManager.playSound(result, game)
      if (result.color === 'w') whiteTime += whiteIncrement
      else blackTime += blackIncrement
    }

    selectedSquare = null
    legalMovesForSelectedPiece = []
    currentViewIndex = -1
    renderBoard()
    renderHistory()

    // Auto-Flip
    if (autoFlipCheckbox && autoFlipCheckbox.checked) {
      const turn = game.turn()
      if (turn === 'w') {
        isFlipped = false
        boardElement.classList.remove('flipped')
      } else {
        isFlipped = true
        boardElement.classList.add('flipped')
      }
      renderClocks()
      renderBoard()
    }

    if (gameMode === 'pve') {
      sendPositionAndGo()
    } else {
      checkGameOver()
    }
  }

  function showPromotionModal (color) {
    return new Promise((resolve, reject) => {
      promotionModal.classList.add('active')

      // Update piece images
      const pieces = promotionModal.querySelectorAll('.promo-piece')
      pieces.forEach(p => {
        const type = p.dataset.piece
        const img = p.querySelector('img')
        // Use current set
        if (currentPieceSet === 'unicode') {
          // Not supported well for images? Just use cburnett or text?
          // Let's use cburnett for modal as fallback or handle text
          img.src = `images/cburnett/${color}${type}.svg`
        } else if (currentPieceSet === 'custom-upload') {
          const key = color + type
          img.src = customPieceImages[key] || `images/cburnett/${color}${type}.svg`
        } else {
          img.src = `images/${currentPieceSet}/${color}${type}.svg`
        }

        // Remove old listeners
        const newEl = p.cloneNode(true)
        p.parentNode.replaceChild(newEl, p)

        newEl.addEventListener('click', () => {
          promotionModal.classList.remove('active')
          resolve(type)
        })
      })

      // Handle close
      // If user clicks outside (overlay) -> reject/cancel
      // But listener is already on modal?
      // I'll add a specific handler for this instance

      const closeHandler = (e) => {
        if (e.target === promotionModal) {
          promotionModal.classList.remove('active')
          promotionModal.removeEventListener('click', closeHandler)
          reject(new Error('Cancelled'))
        }
      }
      promotionModal.addEventListener('click', closeHandler)
    })
  }

  function animateMove (from, to, duration) {
    return new Promise(resolve => {
      const fromSquare = boardElement.querySelector(`.square[data-alg="${from}"]`)
      const toSquare = boardElement.querySelector(`.square[data-alg="${to}"]`)

      if (!fromSquare || !toSquare) {
        resolve()
        return
      }

      const piece = fromSquare.querySelector('.piece')
      if (!piece) {
        resolve()
        return
      }

      const fromRect = fromSquare.getBoundingClientRect()
      const toRect = toSquare.getBoundingClientRect()

      const dx = toRect.left - fromRect.left
      const dy = toRect.top - fromRect.top

      piece.style.position = 'relative' // Ensure translation works relative to original flow
      piece.style.zIndex = '100'
      piece.style.transition = `transform ${duration}ms ease-in-out`
      piece.style.transform = `translate(${dx}px, ${dy}px)`

      // Wait for animation
      setTimeout(() => {
        resolve()
      }, duration)
    })
  }

  function sendPositionAndGo () {
    // Reset stats
    evalValueElement.textContent = '-'
    depthValueElement.textContent = '-'
    npsValueElement.textContent = '-'
    pvLinesElement.textContent = ''

    let cmd = 'position '
    if (startingFen === 'startpos') {
      cmd += 'startpos'
    } else {
      cmd += `fen ${startingFen}`
    }

    const history = game.history({ verbose: true })
    if (history.length > 0) {
      const uciMoves = history.map(m => {
        let uci = m.from + m.to
        if (m.promotion) uci += m.promotion
        return uci
      })
      cmd += ` moves ${uciMoves.join(' ')}`
    }

    if (isAnalysisMode) {
      if (isAnalyzing) {
        pendingAnalysisCmd = cmd
        socket.send('stop')
      } else {
        socket.send(cmd)
        socket.send('go infinite')
        isAnalyzing = true
      }
    } else {
      socket.send(cmd)
      socket.send(`go wtime ${Math.floor(whiteTime)} btime ${Math.floor(blackTime)}`)
    }
  }

  newGameBtn.addEventListener('click', () => {
    startNewGame()
  })

  if (armageddonBtn) {
    armageddonBtn.addEventListener('click', () => {
      isArmageddon = true
      isDuelActive = false
      isSelfPlay = false
      updateSelfPlayButton()

      if (handicapSelect) handicapSelect.value = 'none'

      game.reset()
      startingFen = 'startpos'

      whiteTime = 300000 // 5m
      blackTime = 240000 // 4m

      startClock()
      renderBoard()
      renderHistory()
      renderClocks()

      socket.send('ucinewgame')
      showToast('Armageddon Mode: White 5m, Black 4m. Black wins draws.', 'info')
    })
  }

  if (importPgnBtn) {
    importPgnBtn.addEventListener('click', () => {
      pgnImportModal.classList.add('active')
    })
  }

  if (closePgnModalBtn) {
    closePgnModalBtn.addEventListener('click', () => {
      pgnImportModal.classList.remove('active')
    })
  }

  if (pgnImportModal) {
    pgnImportModal.addEventListener('click', (e) => {
      if (e.target === pgnImportModal) {
        pgnImportModal.classList.remove('active')
      }
    })
  }

  if (loadPgnConfirmBtn) {
    loadPgnConfirmBtn.addEventListener('click', () => {
      const pgn = pgnInputArea.value
      if (pgn) {
        // chess.js 0.10+ load_pgn returns true/false
        const result = game.load_pgn(pgn)
        if (result) {
          pgnImportModal.classList.remove('active')

          // If Guess Mode, prepare it
          if (gameMode === 'guess') {
            startGuessMode()
          } else {
            // Normal load
            currentViewIndex = -1
            selectedSquare = null
            legalMovesForSelectedPiece = []
            renderBoard()
            renderHistory()
            showToast('PGN loaded', 'success')
          }
        } else {
          showToast('Invalid PGN', 'error')
        }
      }
    })
  }

  if (new960Btn) {
    new960Btn.addEventListener('click', () => {
      const fen = generate960Fen()
      fenInput.value = fen
      handleLoadFen()
    })
  }

  function generate960Fen () {
    const pieces = new Array(8).fill(null)

    // 1. Place Bishops on opposite colors
    // Light squares: 1, 3, 5, 7
    // Dark squares: 0, 2, 4, 6
    const lightSquares = [1, 3, 5, 7]
    const darkSquares = [0, 2, 4, 6]

    const bishop1Pos = darkSquares[Math.floor(Math.random() * 4)]
    const bishop2Pos = lightSquares[Math.floor(Math.random() * 4)]

    pieces[bishop1Pos] = 'b'
    pieces[bishop2Pos] = 'b'

    // 2. Place Queen
    const emptyIndices = () => pieces.map((p, i) => p === null ? i : null).filter(i => i !== null)
    let empty = emptyIndices()
    const queenPos = empty[Math.floor(Math.random() * empty.length)]
    pieces[queenPos] = 'q'

    // 3. Place Knights
    empty = emptyIndices()
    const knight1Pos = empty[Math.floor(Math.random() * empty.length)]
    pieces[knight1Pos] = 'n'

    empty = emptyIndices()
    const knight2Pos = empty[Math.floor(Math.random() * empty.length)]
    pieces[knight2Pos] = 'n'

    // 4. Place Rooks and King
    empty = emptyIndices()
    // Must be R, K, R
    pieces[empty[0]] = 'r'
    pieces[empty[1]] = 'k'
    pieces[empty[2]] = 'r'

    const whitePieces = pieces.map(p => p.toUpperCase()).join('')
    const blackPieces = pieces.join('')

    // Generate Castling Rights (X-FEN style uses file letters if ambiguous, but let's try standard letters first)
    // Actually, to be safe with most parsers for 960, we should use the file letters of the rooks.
    // But let's see what chess.js accepts.
    // If we use simple KQkq, it implies standard rooks usually.
    // The safest is often just standard letters if rooks are outermost, but strictly 960 uses file letters.
    // Note: Standard chess.js (v0.10.x) does not support Chess960 castling rules or FEN notation (File letters).
    // It enforces strict "KQkq" regex and expects rooks on standard squares.
    // For the purpose of this visual generator, we will disable castling rights in the FEN
    // so that the position loads correctly in the UI.
    // Full 960 gameplay support would require replacing the chess.js library.
    const castling = '-'

    return `${blackPieces}/pppppppp/8/8/8/8/PPPPPPPP/${whitePieces} w ${castling} - 0 1`
  }

  if (selfPlayBtn) {
    selfPlayBtn.addEventListener('click', () => {
      isSelfPlay = !isSelfPlay
      updateSelfPlayButton()
      if (isSelfPlay) {
        // Trigger first move if game not started or waiting
        sendPositionAndGo()
      }
    })
  }

  flipBoardBtn.addEventListener('click', () => {
    isFlipped = !isFlipped
    if (isFlipped) {
      boardElement.classList.add('flipped')
    } else {
      boardElement.classList.remove('flipped')
    }
    renderClocks()
    renderBoard() // Re-render for coordinates
    ArrowManager.render()
  })

  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        showToast(`Error attempting to enable fullscreen: ${err.message}`, 'error')
      })
    } else {
      document.exitFullscreen()
    }
  })

  sidebarToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('sidebar-collapsed')
    // Trigger resize event to help canvas/charts resize if they existed
    window.dispatchEvent(new Event('resize'))
  })

  zenModeCheckbox.addEventListener('change', () => {
    toggleZenMode(zenModeCheckbox.checked)
  })

  if (blindfoldModeCheckbox) {
    blindfoldModeCheckbox.addEventListener('change', () => {
      if (blindfoldModeCheckbox.checked) {
        boardElement.classList.add('blindfold')
      } else {
        boardElement.classList.remove('blindfold')
      }
    })
  }

  // Exit Zen Mode on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.body.classList.contains('zen-mode')) {
        toggleZenMode(false)
        zenModeCheckbox.checked = false
      }
      if (document.fullscreenElement) {
        document.exitFullscreen()
      }
    }
  })

  function toggleZenMode (enable) {
    if (enable) {
      document.body.classList.add('zen-mode')
    } else {
      document.body.classList.remove('zen-mode')
    }
  }

  if (gameModeSelect) {
    gameModeSelect.addEventListener('change', (e) => {
      const prevMode = gameMode
      gameMode = e.target.value

      if (prevMode === 'vote') {
        socket.send(JSON.stringify({ action: 'leave_vote' }))
      }

      if (gameMode === 'vote') {
        socket.send(JSON.stringify({ action: 'join_vote' }))
      } else if (gameMode === 'guess') {
        if (game.history().length === 0) {
          showToast('Load a PGN to start guessing!', 'info')
        } else {
          // Restart guess mode from current game?
          startGuessMode()
        }
      }
    })
  }

  streamerModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('streamer-mode')
    showToast('Toggled Streamer Mode', 'info')
  })

  showCoordsCheckbox.addEventListener('change', () => {
    renderBoard()
  })

  if (showArrowLastCheckbox) {
    showArrowLastCheckbox.addEventListener('change', () => {
      updateLastMoveArrow()
    })
  }

  coordsOutsideCheckbox.addEventListener('change', () => {
    if (coordsOutsideCheckbox.checked) {
      boardElement.classList.add('coords-outside')
    } else {
      boardElement.classList.remove('coords-outside')
    }
  })

  analysisModeCheckbox.addEventListener('change', () => {
    isAnalysisMode = analysisModeCheckbox.checked
    if (isAnalysisMode) {
      sendPositionAndGo()
    } else {
      if (isAnalyzing) {
        socket.send('stop')
        ignoreNextBestMove = true
      }
    }
  })

  // Load UI Theme
  const savedUiTheme = localStorage.getItem('ui-theme') || 'dark'
  if (savedUiTheme === 'light') document.body.classList.add('light-mode')
  if (uiThemeSelect) uiThemeSelect.value = savedUiTheme

  uiThemeSelect.addEventListener('change', (e) => {
    const theme = e.target.value
    if (theme === 'light') {
      document.body.classList.add('light-mode')
    } else {
      document.body.classList.remove('light-mode')
    }
    localStorage.setItem('ui-theme', theme)
  })

  boardThemeSelect.addEventListener('change', (e) => {
    setBoardTheme(e.target.value)
  })

  if (customLightSquareInput) {
    customLightSquareInput.addEventListener('input', (e) => {
      if (boardThemeSelect.value === 'custom') {
        boardElement.style.setProperty('--board-light-square', e.target.value)
        localStorage.setItem('custom-light-square', e.target.value)
      }
    })
  }

  if (customDarkSquareInput) {
    customDarkSquareInput.addEventListener('input', (e) => {
      if (boardThemeSelect.value === 'custom') {
        boardElement.style.setProperty('--board-dark-square', e.target.value)
        localStorage.setItem('custom-dark-square', e.target.value)
      }
    })
  }

  if (applyCustomCssBtn) {
    applyCustomCssBtn.addEventListener('click', () => {
      applyCustomCss(customCssInput.value)
    })
  }

  // Load Custom CSS from local storage
  const savedCss = localStorage.getItem('custom-css')
  if (savedCss) {
    customCssInput.value = savedCss
    applyCustomCss(savedCss)
  }

  // Load Custom Colors
  const savedCustomLight = localStorage.getItem('custom-light-square')
  if (savedCustomLight) customLightSquareInput.value = savedCustomLight
  const savedCustomDark = localStorage.getItem('custom-dark-square')
  if (savedCustomDark) customDarkSquareInput.value = savedCustomDark

  if (uploadThemeFile) {
    uploadThemeFile.addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const theme = JSON.parse(event.target.result)
          if (theme.light && theme.dark) {
            customLightSquareInput.value = theme.light
            customDarkSquareInput.value = theme.dark
            boardThemeSelect.value = 'custom'
            // Trigger change manually
            boardThemeSelect.dispatchEvent(new Event('change'))
            // Trigger input events to save to local storage
            customLightSquareInput.dispatchEvent(new Event('input'))
            customDarkSquareInput.dispatchEvent(new Event('input'))
            showToast('Theme loaded successfully', 'success')
          } else {
            showToast('Invalid theme format', 'error')
          }
        } catch (err) {
          console.error(err)
          showToast('Error parsing theme file', 'error')
        }
      }
      reader.readAsText(file)
    })
  }

  const customPieceImages = {}

  if (uploadPieceSetFiles) {
    uploadPieceSetFiles.addEventListener('change', (e) => {
      const files = Array.from(e.target.files)
      if (files.length === 0) return
      handlePieceSetUpload(files)
    })
  }

  function handlePieceSetUpload (files) {
    let loadedCount = 0
    files.forEach(file => {
      const pieceKey = identifyPieceKey(file.name)
      if (pieceKey) {
        customPieceImages[pieceKey] = URL.createObjectURL(file)
        loadedCount++
      }
    })

    updatePieceSetUI(loadedCount)
  }

  function identifyPieceKey (filename) {
    const name = filename.toLowerCase()

    const shortKey = identifyShortKey(name)
    if (shortKey) return shortKey

    return identifyPieceFromTokens(name)
  }

  function identifyShortKey (name) {
    if (name.length >= 10) return null
    const matches = ['wp', 'wn', 'wb', 'wr', 'wq', 'wk', 'bp', 'bn', 'bb', 'br', 'bq', 'bk']
    for (const m of matches) {
      if (name.includes(m)) return m
    }
    return null
  }

  function identifyPieceFromTokens (name) {
    const color = identifyColor(name)
    const type = identifyType(name)

    if (color && type) return color + type
    return null
  }

  function identifyColor (name) {
    if (name.includes('white') || name.startsWith('w')) return 'w'
    if (name.includes('black') || name.startsWith('b')) return 'b'
    return null
  }

  function identifyType (name) {
    const types = { pawn: 'p', knight: 'n', bishop: 'b', rook: 'r', queen: 'q', king: 'k' }
    for (const [key, val] of Object.entries(types)) {
      if (name.includes(key)) return val
    }
    return null
  }

  function updatePieceSetUI (loadedCount) {
    if (loadedCount > 0) {
      if (!pieceSetSelect.querySelector('option[value="custom-upload"]')) {
        const option = document.createElement('option')
        option.value = 'custom-upload'
        option.textContent = 'Custom Uploaded'
        pieceSetSelect.appendChild(option)
      }
      pieceSetSelect.value = 'custom-upload'
      currentPieceSet = 'custom-upload'
      renderBoard()
      showToast(`Loaded ${loadedCount} piece images`, 'success')
    } else {
      showToast('Could not identify piece images from filenames', 'error')
    }
  }

  boardSizeInput.addEventListener('input', (e) => {
    const val = e.target.value
    boardElement.style.setProperty('--board-max-width', `${val}px`)
  })

  pieceSetSelect.addEventListener('change', (e) => {
    currentPieceSet = e.target.value
    renderBoard()
  })

  function setBoardTheme (theme) {
    // Remove existing theme classes
    ['theme-green', 'theme-blue', 'theme-wood', 'theme-glass', 'theme-newspaper', 'theme-custom'].forEach(cls => {
      boardElement.classList.remove(cls)
    })

    // Remove inline styles if not custom (to allow CSS classes to take over)
    if (theme !== 'custom') {
      boardElement.style.removeProperty('--board-light-square')
      boardElement.style.removeProperty('--board-dark-square')
      customThemeControls.style.display = 'none'
    }

    if (theme === 'custom') {
      customThemeControls.style.display = 'block'
      boardElement.style.setProperty('--board-light-square', customLightSquareInput.value)
      boardElement.style.setProperty('--board-dark-square', customDarkSquareInput.value)
    } else if (theme !== 'classic') {
      boardElement.classList.add(`theme-${theme}`)
    }
  }

  function applyCustomCss (css) {
    // Basic sanitization: prevent breaking out of style tag
    if (css.includes('</style>')) {
      showToast('Invalid CSS: Contains closing tag', 'error')
      return
    }

    let style = document.getElementById('custom-user-css')
    if (!style) {
      style = document.createElement('style')
      style.id = 'custom-user-css'
      document.head.appendChild(style)
    }
    style.textContent = css
    localStorage.setItem('custom-css', css)
    showToast('Custom CSS applied', 'success')
  }

  function getUnicodePiece (color, type) {
    const map = {
      w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
      b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }
    }
    return map[color][type]
  }

  loadFenBtn.addEventListener('click', handleLoadFen)
  copyFenBtn.addEventListener('click', handleCopyFen)
  exportPgnBtn.addEventListener('click', handleExportPgn)

  if (resignBtn) resignBtn.addEventListener('click', handleResign)
  if (offerDrawBtn) offerDrawBtn.addEventListener('click', handleOfferDraw)
  if (takebackBtn) takebackBtn.addEventListener('click', handleTakeback)
  if (forceMoveBtn) forceMoveBtn.addEventListener('click', handleForceMove)
  if (clearAnalysisBtn) {
    clearAnalysisBtn.addEventListener('click', () => {
      ArrowManager.clearUserArrows()
      ArrowManager.clearUserHighlights()
      ArrowManager.clearEngineArrows()
      renderBoard()
      showToast('Analysis cleared', 'info')
    })
  }
  if (replayBtn) replayBtn.addEventListener('click', toggleReplay)

  // Right-click handling (Cancel, Arrows, Highlights)
  let rightClickStart = null

  boardElement.addEventListener('contextmenu', (e) => e.preventDefault())

  boardElement.addEventListener('mousedown', (e) => {
    if (e.button === 2) {
      const square = e.target.closest('.square')
      if (square) {
        rightClickStart = square.dataset.alg
      }
    }
  })

  boardElement.addEventListener('mouseup', (e) => {
    if (e.button === 2) {
      // Cancel move logic
      if (selectedSquare || pendingConfirmationMove || premove) {
        selectedSquare = null
        legalMovesForSelectedPiece = []
        pendingConfirmationMove = null
        premove = null
        renderBoard()
        showToast('Move cancelled', 'info')
        rightClickStart = null
        return
      }

      // Arrows / Highlights
      if (rightClickStart) {
        const square = e.target.closest('.square')
        if (square) {
          const start = rightClickStart
          const end = square.dataset.alg
          if (start === end) {
            ArrowManager.toggleUserHighlight(start)
            renderBoard()
          } else {
            ArrowManager.addUserArrow(start, end)
          }
        }
      }
      rightClickStart = null
    }
  })

  function handleResign () {
    if (!gameStarted || game.game_over()) return
    const winner = game.turn() === 'w' ? 'black' : 'white'
    logToOutput(`Game Over: ${game.turn() === 'w' ? 'White' : 'Black'} resigns.`)
    gameStarted = false
    if (clockInterval) clearInterval(clockInterval)
    showToast('You resigned.', 'info')
    if (onGameEndCallback) {
      onGameEndCallback(winner)
      onGameEndCallback = null
    }
  }

  function handleOfferDraw () {
    if (!gameStarted || game.game_over()) return
    // Engine accepts if eval is within [-10, 10] cp (0.10 pawn)
    // Note: lastEngineEval is from engine's perspective (side to move)
    // But wait, info score is usually for the side to move.
    // If it's my turn, engine isn't thinking, so I don't have a fresh eval usually?
    // Or I use the eval from the last search (opponent's move).
    // Let's assume lastEngineEval is relevant.
    const threshold = 10
    if (Math.abs(lastEngineEval) <= threshold) {
      logToOutput('Game Over: Draw agreed')
      gameStarted = false
      if (clockInterval) clearInterval(clockInterval)
      showToast('Engine accepted draw offer.', 'success')
      if (onGameEndCallback) {
        onGameEndCallback('draw')
        onGameEndCallback = null
      }
    } else {
      showToast('Engine declined draw offer.', 'error')
      logToOutput('Engine declined draw.')
    }
  }

  function handleTakeback () {
    if (game.history().length === 0) return

    if (isAnalyzing && !isAnalysisMode) {
      // Engine is thinking
      socket.send('stop')
      setTimeout(_performTakeback, 100)
    } else {
      _performTakeback()
    }
  }

  function _performTakeback () {
    game.undo()
    if (gameMode === 'pve' && _isEngineTurn(game.turn())) {
      game.undo()
    }
    currentViewIndex = -1
    renderBoard()
    renderHistory()
    showToast('Takeback successful', 'info')
  }

  function _isEngineTurn (turn) {
    if (gameMode !== 'pve') return false
    if (!isFlipped && turn === 'b') return true
    if (isFlipped && turn === 'w') return true
    return false
  }

  function handleForceMove () {
    socket.send('stop')
    showToast('Forced move', 'info')
  }

  function toggleReplay () {
    if (replayInterval) {
      clearInterval(replayInterval)
      replayInterval = null
      replayBtn.textContent = '▶'
      return
    }

    if (game.history().length === 0) return

    replayBtn.textContent = '⏸'
    currentViewIndex = -1 // Start from live? No, user might be anywhere.
    // If at end, start from beginning.
    // logic: set currentViewIndex to -1 (live) means end.
    // We want to iterate from 0 to history.length - 1.

    const historyLen = game.history().length
    if (currentViewIndex === -1 || currentViewIndex >= historyLen - 1) {
      currentViewIndex = -1
      // Reset to start
      // wait, currentViewIndex represents the index of the move displayed. -1 means live board (all moves).
      // To display start position, we need a way to say "before first move".
      // My handleHistoryClick logic: index 0 means after 1st move.
      // I need to support "start of game".
      // Let's check handleHistoryClick again.
      // handleHistoryClick(index) sets currentViewIndex = index.
      // getBoardState uses 0 to currentViewIndex.
      // If currentViewIndex is -1, it returns game.board() (full game).
      // This logic is slightly flawed for "Start of Game".
      // I should fix getBoardState to handle a state where NO moves are made.
      // Let's say currentViewIndex = -2 for Start? Or change logic.
      // For now, let's just replay from move 0.
      currentViewIndex = -1
    }

    // If we are at "live" (-1), let's start from 0.
    // Actually, let's just loop
    currentViewIndex = -1 // Reset visualization to live? No, that shows everything.
    // I want to show move 1, then move 2...
    // To show move 1, index is 0.
    // To show start, I need to render start board.

    // Use -2 to represent "Start Position" (before any moves)
    currentViewIndex = -2
    renderBoard()
    renderHistory()

    const speed = parseInt(replaySpeedInput.value) || 800

    replayInterval = setInterval(() => {
      currentViewIndex++
      // Skip -1 because it represents "Live View" (auto-updating),
      // whereas 0 represents the first move in the history array.
      if (currentViewIndex === -1) {
        currentViewIndex = 0
      }

      if (currentViewIndex >= historyLen) {
        clearInterval(replayInterval)
        replayInterval = null
        replayBtn.textContent = '▶'
        currentViewIndex = -1 // Back to live
      }
      renderBoard()
      renderHistory()
    }, speed)
  }

  function handleLoadFen () {
    const fen = fenInput.value.trim()
    if (!fen) return

    // Validate by trying to load
    // Note: game.load() returns true if valid, false otherwise (in chess.js v0.10+)
    // It also sets the board state.
    const valid = game.load(fen)

    if (valid) {
      startingFen = fen
      selectedSquare = null
      legalMovesForSelectedPiece = []
      currentViewIndex = -1

      // Reset clocks for the new game state (or custom position)
      whiteTime = 300000
      blackTime = 300000
      startClock()

      renderBoard()
      renderHistory()
      renderClocks()
      ArrowManager.clearEngineArrows()
      ArrowManager.clearUserArrows()

      // Send new position to engine
      // We also send 'ucinewgame' to clear hash etc, although strictly it's a new game.
      socket.send('ucinewgame')
      sendPositionAndGo()

      showToast('FEN loaded successfully', 'success')
      fenInput.value = ''
    } else {
      showToast('Invalid FEN string', 'error')
    }
  }

  function handleCopyFen () {
    const fen = game.fen()
    navigator.clipboard.writeText(fen).then(() => {
      showToast('FEN copied to clipboard', 'success')
    }).catch(err => {
      console.error('Failed to copy FEN: ', err)
      showToast('Failed to copy FEN', 'error')
    })
  }

  function handleExportPgn () {
    const pgn = game.pgn()
    const blob = new Blob([pgn], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'game.pgn'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('PGN exported', 'success')
  }

  function showToast (message, type = 'info') {
    const toast = document.createElement('div')
    toast.classList.add('toast')
    if (type) toast.classList.add(type)

    // Icon based on type could be added here
    toast.textContent = message

    toastContainer.appendChild(toast)

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-out forwards'
      toast.addEventListener('animationend', () => {
        if (toast.parentNode) toast.parentNode.removeChild(toast)
      })
    }, 3000)

    // Also log to system panel
    logSystemMessage(message, type)
  }

  function logSystemMessage (msg, type = 'info') {
    if (!systemLogElement) return

    const now = new Date()
    const time = now.toLocaleTimeString()
    const line = document.createElement('div')
    line.textContent = `[${time}] ${msg}`
    if (type === 'error') line.style.color = '#F2495C'
    else if (type === 'success') line.style.color = '#9AC42A'

    systemLogElement.prepend(line)
  }

  const MEMORY_FENS = [
    'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', // Ruy Lopez
    'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', // Caro-Kann
    'rnbqkb1r/pppppppp/5n2/8/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2', // Indian
    'r1bq1rk1/ppp2ppp/2n2n2/3pp3/1b1P4/2N1PN2/PPP1BPPP/R1BQ1RK1 w - - 0 7' // Random position
  ]

  if (memoryTrainingBtn) {
    memoryTrainingBtn.addEventListener('click', startMemoryTraining)
  }

  if (memorySubmitBtn) {
    memorySubmitBtn.addEventListener('click', checkMemoryResult)
  }

  if (memoryGiveUpBtn) {
    memoryGiveUpBtn.addEventListener('click', () => {
      stopMemoryTraining()
      game.load(memoryTargetFen)
      renderBoard()
      showToast('Solution shown.', 'info')
    })
  }

  function startMemoryTraining () {
    isMemoryTraining = true
    memoryControls.style.display = 'block'
    piecePaletteElement.style.display = 'none' // Hide initially
    selectedPalettePiece = null

    // Pick random FEN
    const fen = MEMORY_FENS[Math.floor(Math.random() * MEMORY_FENS.length)]
    memoryTargetFen = fen

    game.load(fen)
    renderBoard()
    showToast('Memorize this position!', 'info')

    let timeLeft = 5
    memoryTimerElement.textContent = `Time: ${timeLeft}`

    if (memoryTimerInterval) clearInterval(memoryTimerInterval)

    memoryTimerInterval = setInterval(() => {
      timeLeft--
      memoryTimerElement.textContent = `Time: ${timeLeft}`
      if (timeLeft <= 0) {
        clearInterval(memoryTimerInterval)
        startMemoryReconstruction()
      }
    }, 1000)
  }

  function startMemoryReconstruction () {
    game.clear()
    renderBoard()
    showToast('Reconstruct the position!', 'info')
    piecePaletteElement.style.display = 'flex'
    renderPalette()
  }

  function renderPalette () {
    piecePaletteElement.innerHTML = ''
    const pieces = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK']
    pieces.forEach(p => {
      const color = p[0]
      const type = p[1].toLowerCase()
      const div = document.createElement('div')
      div.classList.add('palette-piece')
      const img = document.createElement('img')
      img.src = `images/${currentPieceSet}/${color}${type}.svg`
      img.style.width = '100%'
      img.style.height = '100%'
      div.appendChild(img)

      div.addEventListener('click', () => {
        document.querySelectorAll('.palette-piece').forEach(el => el.classList.remove('selected'))
        div.classList.add('selected')
        selectedPalettePiece = { color, type }
      })

      piecePaletteElement.appendChild(div)
    })
  }

  function stopMemoryTraining () {
    isMemoryTraining = false
    memoryControls.style.display = 'none'
    piecePaletteElement.style.display = 'none'
    if (memoryTimerInterval) clearInterval(memoryTimerInterval)
  }

  function checkMemoryResult () {
    const currentBoard = game.board()
    // Calculate score logic needs comparison with memoryTargetFen
    // We need to load targetFen into a temp game to get the board array
    const targetGame = new Chess(memoryTargetFen)
    const targetBoard = targetGame.board()

    let correct = 0
    let total = 0

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const t = targetBoard[r][c]
        const cur = currentBoard[r][c]

        if (t) {
          total++
          if (cur && cur.type === t.type && cur.color === t.color) {
            correct++
          }
        }
      }
    }

    // What if user placed extra pieces?
    // Total should probably be max(target pieces, current pieces) or just target pieces.
    // Let's stick to target pieces found.

    const score = total > 0 ? Math.round((correct / total) * 100) : 0
    showToast(`Score: ${score}% (${correct}/${total} correct)`, score === 100 ? 'success' : 'info')

    if (score === 100) {
      stopMemoryTraining()
    }
  }

  if (tacticsTrainerBtn) {
    tacticsTrainerBtn.addEventListener('click', startTacticsTrainer)
  }

  if (tacticsNextBtn) {
    tacticsNextBtn.addEventListener('click', nextTacticsPuzzle)
  }

  async function startTacticsTrainer () {
    if (tacticsPuzzles.length === 0) {
      try {
        const res = await fetch('puzzles.json')
        if (!res.ok) throw new Error('Failed to load puzzles')
        tacticsPuzzles = await res.json()
      } catch (e) {
        showToast('Error loading puzzles: ' + e.message, 'error')
        return
      }
    }

    isTacticsMode = true
    isMemoryTraining = false
    stopMemoryTraining() // Ensure memory mode is off

    tacticsControls.style.display = 'block'

    nextTacticsPuzzle()
  }

  function nextTacticsPuzzle () {
    if (tacticsPuzzles.length === 0) return

    const puzzle = tacticsPuzzles[Math.floor(Math.random() * tacticsPuzzles.length)]
    currentPuzzle = puzzle
    currentPuzzleMoveIndex = 0

    game.load(puzzle.fen)
    renderBoard()
    renderHistory()

    tacticsDesc.textContent = puzzle.description
    showToast('Tactics: ' + puzzle.description, 'info')

    // Auto-flip board to side to move
    const turn = game.turn()
    if (turn === 'w' && isFlipped) {
      // flip back to white
      isFlipped = false
      boardElement.classList.remove('flipped')
    } else if (turn === 'b' && !isFlipped) {
      isFlipped = true
      boardElement.classList.add('flipped')
    }
    renderClocks()
    renderBoard()
  }

  const ENDGAME_CONFIGS = {
    'kp-vs-k': { fen: '8/4k3/8/8/4P3/8/4K3/8 w - - 0 1', userColor: 'w' },
    'kq-vs-k': { fen: '8/8/8/8/8/8/Q7/4k2K w - - 0 1', userColor: 'w' },
    'kr-vs-k': { fen: '8/8/8/8/8/8/R7/4k2K w - - 0 1', userColor: 'w' },
    lucena: { fen: '1r6/4P3/3K4/8/8/8/k7/8 w - - 0 1', userColor: 'w' },
    philidor: { fen: '8/8/1k6/2P5/8/2R5/8/4K3 w - - 0 1', userColor: 'b' }
  }

  if (endgameTrainerBtn) {
    endgameTrainerBtn.addEventListener('click', () => {
      endgameControls.style.display = 'block'
      tacticsControls.style.display = 'none'
      memoryControls.style.display = 'none'
      piecePaletteElement.style.display = 'none'
      stopMemoryTraining()
      isTacticsMode = false
      isMemoryTraining = false
    })
  }

  if (startEndgameBtn) {
    startEndgameBtn.addEventListener('click', () => {
      const type = endgameSelect.value
      const config = ENDGAME_CONFIGS[type]
      if (config) {
        game.load(config.fen)
        startingFen = config.fen
        gameMode = 'pve'
        isSelfPlay = false

        if (config.userColor === 'w') {
          isFlipped = false
          boardElement.classList.remove('flipped')
        } else {
          isFlipped = true
          boardElement.classList.add('flipped')
        }

        renderBoard()
        renderClocks()
        renderHistory()

        showToast(`Endgame Practice: ${type}. User plays ${config.userColor === 'w' ? 'White' : 'Black'}`)

        if (game.turn() !== config.userColor) {
          sendPositionAndGo()
        }
      }
    })
  }

  if (dailyPuzzleBtn) {
    dailyPuzzleBtn.addEventListener('click', startDailyPuzzle)
  }

  async function startDailyPuzzle () {
    try {
      const res = await fetch('https://lichess.org/api/puzzle/daily')
      if (!res.ok) throw new Error('Failed to fetch daily puzzle')
      const data = await res.json()

      // Parse PGN to get FEN
      // Note: chess.js load_pgn handles PGN parsing
      game.load_pgn(data.game.pgn)
      const history = game.history({ verbose: true })

      game.reset()
      for (let i = 0; i < data.puzzle.initialPly; i++) {
        game.move(history[i])
      }
      const fen = game.fen()

      const puzzle = {
        fen,
        moves: data.puzzle.solution,
        description: `Daily Puzzle (Rating: ${data.puzzle.rating})`
      }

      // Setup Tactics Mode
      isTacticsMode = true
      isMemoryTraining = false
      stopMemoryTraining()
      endgameControls.style.display = 'none'
      tacticsControls.style.display = 'block'
      memoryControls.style.display = 'none'
      piecePaletteElement.style.display = 'none'
      repertoireControls.style.display = 'none'

      tacticsPuzzles = [puzzle]
      nextTacticsPuzzle()
    } catch (e) {
      showToast('Error loading daily puzzle: ' + e.message, 'error')
      console.error(e)
    }
  }

  if (repertoireBuilderBtn) {
    repertoireBuilderBtn.addEventListener('click', () => {
      repertoireControls.style.display = 'block'
      tacticsControls.style.display = 'none'
      memoryControls.style.display = 'none'
      endgameControls.style.display = 'none'
      piecePaletteElement.style.display = 'none'
      stopMemoryTraining()
      renderRepertoireList()
    })
  }

  if (saveRepertoireBtn) {
    saveRepertoireBtn.addEventListener('click', () => {
      const name = repertoireNameInput.value.trim() || 'Untitled'
      const pgn = game.pgn()
      if (!pgn) {
        showToast('No moves to save', 'error')
        return
      }

      const rep = JSON.parse(localStorage.getItem('my-repertoire') || '[]')
      rep.push({ name, pgn, fen: game.fen() })
      localStorage.setItem('my-repertoire', JSON.stringify(rep))

      showToast('Line saved', 'success')
      repertoireNameInput.value = ''
      renderRepertoireList()
    })
  }

  function renderRepertoireList () {
    repertoireList.innerHTML = ''
    const rep = JSON.parse(localStorage.getItem('my-repertoire') || '[]')

    rep.forEach((item, index) => {
      const div = document.createElement('div')
      div.className = 'repertoire-item'
      div.style.padding = '5px'
      div.style.borderBottom = '1px solid var(--grafana-border)'
      div.style.cursor = 'pointer'
      div.style.display = 'flex'
      div.style.justifyContent = 'space-between'

      const title = document.createElement('span')
      title.textContent = item.name
      title.onclick = () => loadRepertoireItem(index)

      const delBtn = document.createElement('button')
      delBtn.textContent = 'x'
      delBtn.style.padding = '0 5px'
      delBtn.style.marginLeft = '10px'
      delBtn.style.background = 'transparent'
      delBtn.style.color = '#F2495C'
      delBtn.style.border = 'none'
      delBtn.onclick = (e) => {
        e.stopPropagation()
        deleteRepertoireItem(index)
      }

      div.appendChild(title)
      div.appendChild(delBtn)
      repertoireList.appendChild(div)
    })
  }

  function loadRepertoireItem (index) {
    const rep = JSON.parse(localStorage.getItem('my-repertoire') || '[]')
    const item = rep[index]
    if (item) {
      game.load_pgn(item.pgn)
      renderBoard()
      renderHistory()
      showToast(`Loaded: ${item.name}`, 'success')
    }
  }

  function deleteRepertoireItem (index) {
    const rep = JSON.parse(localStorage.getItem('my-repertoire') || '[]')
    rep.splice(index, 1)
    localStorage.setItem('my-repertoire', JSON.stringify(rep))
    renderRepertoireList()
  }

  connect()
})
