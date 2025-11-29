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
  const streamerModeBtn = document.getElementById('streamer-mode-btn')
  const showCoordsCheckbox = document.getElementById('show-coords')
  const coordsOutsideCheckbox = document.getElementById('coords-outside')
  const gameModeSelect = document.getElementById('game-mode')
  const analysisModeCheckbox = document.getElementById('analysis-mode')
  const fenInput = document.getElementById('fen-input')
  const loadFenBtn = document.getElementById('load-fen-btn')
  const copyFenBtn = document.getElementById('copy-fen-btn')
  const importPgnBtn = document.getElementById('import-pgn-btn')
  const exportPgnBtn = document.getElementById('export-pgn-btn')

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
  let guessModeData = { moves: [], index: 0, active: false }
  let isAnalysisMode = false
  let ignoreNextBestMove = false
  let isAnalyzing = false
  let pendingAnalysisCmd = null

  let whiteTime = 300000 // 5 minutes in ms
  let blackTime = 300000
  let clockInterval = null
  let lastFrameTime = 0

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
    const parts = msg.split(' ')
    if (msg.startsWith('option name')) parseOption(msg)
    else if (parts[0] === 'uciok') socket.send('isready')
    else if (parts[0] === 'readyok') _handleReadyOk()
    else if (parts[0] === 'bestmove') _handleBestMoveMsg(parts)
    else if (parts[0] === 'info') _handleInfoMsg(msg)
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
      if ((isSelfPlay || isDuelActive) && !game.game_over()) {
        setTimeout(() => {
          if (isSelfPlay || isDuelActive) {
            if (isDuelActive) {
              const nextTurn = game.turn()
              const config = nextTurn === 'w' ? engineAConfig : engineBConfig
              applyEngineConfig(config)
            }
            sendPositionAndGo()
          }
        }, 500) // Small delay for visual pacing
      }
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
    renderBoard()
    renderHistory()
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
    }
    if (info.pv) updatePvDisplay(info.pv)
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

  function startDuel () {
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
    whiteTime = 300000
    blackTime = 300000

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
    whiteTime = 300000
    blackTime = 300000
    isSelfPlay = false
    isDuelActive = false
    updateSelfPlayButton()
    startClock()
    renderBoard()
    renderHistory()
    renderClocks()
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
        whiteTime = Math.max(0, whiteTime - delta)
      } else {
        blackTime = Math.max(0, blackTime - delta)
      }

      renderClocks()
      if (whiteTime <= 0 || blackTime <= 0) {
        checkGameOver()
      }
    }, 100)
  }

  function checkGameOver () {
    if (whiteTime <= 0) {
      logToOutput('Game Over: White timeout')
      clearInterval(clockInterval)
      isSelfPlay = false
      updateSelfPlayButton()
    } else if (blackTime <= 0) {
      logToOutput('Game Over: Black timeout')
      clearInterval(clockInterval)
      isSelfPlay = false
      updateSelfPlayButton()
    } else if (game.game_over()) {
      if (game.in_checkmate()) logToOutput('Game Over: Checkmate')
      else if (game.in_draw()) {
        if (isArmageddon) logToOutput('Game Over: Draw (Black Wins by Armageddon Rule)')
        else logToOutput('Game Over: Draw')
      }
      clearInterval(clockInterval)
      isSelfPlay = false
      updateSelfPlayButton()
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
      return game.board()
    }
    const tempGame = new Chess()
    if (startingFen !== 'startpos') {
      tempGame.load(startingFen)
    }

    const history = game.history({ verbose: true })
    for (let i = 0; i <= currentViewIndex; i++) {
      tempGame.move(history[i])
    }
    return tempGame.board()
  }

  function renderBoard () {
    boardElement.innerHTML = ''
    const board = getBoardState()

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        _createSquare(r, c, board)
      }
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

  function _createSquare (r, c, board) {
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
    if (pieceObj) {
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

    square.dataset.row = row
    square.dataset.col = col
    square.dataset.alg = alg

    if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
      square.classList.add('selected')
    }

    square.addEventListener('click', () => handleSquareClick(row, col))
    boardElement.appendChild(square)
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
    if (currentViewIndex !== -1) return

    const board = game.board()
    const pieceObj = board[row][col]
    const alg = coordsToAlgebraic(row, col)

    // If clicking on a legal destination for the selected piece
    if (selectedSquare) {
      const move = legalMovesForSelectedPiece.find(m => m.to === alg)
      if (move) {
        attemptMove(move)
        return
      }
    }

    // If clicking on own piece, select it
    if (pieceObj && pieceObj.color === game.turn()) {
      selectedSquare = { row, col }
      legalMovesForSelectedPiece = game.moves({ square: alg, verbose: true })
      renderBoard()
      return
    }

    // Deselect if clicking elsewhere
    if (selectedSquare) {
      selectedSquare = null
      legalMovesForSelectedPiece = []
      renderBoard()
    }
  }

  function coordsToAlgebraic (row, col) {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const rank = 8 - row
    return files[col] + rank
  }

  async function attemptMove (targetMove) {
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

    const speed = animationSpeedSelect ? parseInt(animationSpeedSelect.value) : 0
    if (speed > 0) {
      await animateMove(targetMove.from, targetMove.to, speed)
    }

    const result = game.move(targetMove)
    if (result) SoundManager.playSound(result, game)

    selectedSquare = null
    legalMovesForSelectedPiece = []
    currentViewIndex = -1
    renderBoard()
    renderHistory()

    if (gameMode === 'pve') {
      sendPositionAndGo()
    } else {
      checkGameOver()
      // In PvP, we might want to flip the board automatically if enabled (future story)
      // For now, we just let the other player move.
    }
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
      gameMode = e.target.value
      if (gameMode === 'guess') {
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

  connect()
})
