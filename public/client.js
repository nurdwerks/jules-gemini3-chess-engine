/* eslint-env browser */
/* global Chess */

document.addEventListener('DOMContentLoaded', () => {
  const boardElement = document.getElementById('chessboard')
  const statusElement = document.getElementById('status')
  const engineOutputElement = document.getElementById('engine-output')
  const uciOptionsElement = document.getElementById('uci-options')
  const moveHistoryElement = document.getElementById('move-history')
  const newGameBtn = document.getElementById('new-game-btn')
  const flipBoardBtn = document.getElementById('flip-board-btn')

  const boardThemeSelect = document.getElementById('board-theme')
  const pieceSetSelect = document.getElementById('piece-set')

  const evalValueElement = document.getElementById('eval-value')
  const depthValueElement = document.getElementById('depth-value')
  const npsValueElement = document.getElementById('nps-value')
  const pvLinesElement = document.getElementById('pv-lines')

  const topPlayerName = document.getElementById('top-player-name')
  const topPlayerClock = document.getElementById('top-player-clock')
  const bottomPlayerName = document.getElementById('bottom-player-name')
  const bottomPlayerClock = document.getElementById('bottom-player-clock')

  // Initialize chess.js
  const game = new Chess()

  let socket
  let selectedSquare = null // { row, col }
  let isFlipped = false
  let gameStarted = false
  let currentViewIndex = -1 // -1 means live view
  let currentPieceSet = 'svg' // 'svg' or 'unicode'
  let legalMovesForSelectedPiece = [] // Array of move objects from chess.js

  let whiteTime = 300000 // 5 minutes in ms
  let blackTime = 300000
  let clockInterval = null
  let lastFrameTime = 0

  function connect () {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    socket = new WebSocket(`${protocol}//${window.location.host}`)

    socket.onopen = () => {
      statusElement.textContent = 'Status: Connected'
      socket.send('uci')
    }

    socket.onmessage = (event) => {
      const msg = event.data
      _handleSocketMessage(msg)
    }

    socket.onclose = () => {
      statusElement.textContent = 'Status: Disconnected'
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

  function _handleBestMoveMsg (parts) {
    const move = parts[1]
    if (move && move !== '(none)') {
      // Engine sends long algebraic (e.g., e2e4, a7a8q)
      const from = move.substring(0, 2)
      const to = move.substring(2, 4)
      const promotion = move.length > 4 ? move[4] : undefined

      game.move({ from, to, promotion })
      currentViewIndex = -1
      renderBoard()
      renderHistory()
      checkGameOver()
    }
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
    if (info.score) evalValueElement.textContent = formatScore(info.score)
    if (info.pv) updatePvDisplay(info.pv)
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
    const container = document.createElement('div')
    container.classList.add('option-item')
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
      uciOptionsElement.appendChild(container)
    }
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

  function startNewGame () {
    game.reset()
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
    } else if (blackTime <= 0) {
      logToOutput('Game Over: Black timeout')
      clearInterval(clockInterval)
    } else if (game.game_over()) {
      if (game.in_checkmate()) logToOutput('Game Over: Checkmate')
      else if (game.in_draw()) logToOutput('Game Over: Draw')
      clearInterval(clockInterval)
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
    if (isFlipped) {
      topPlayerName.textContent = 'White'
      topPlayerClock.textContent = wStr
      bottomPlayerName.textContent = 'Black'
      bottomPlayerClock.textContent = bStr

      _updateClockStyle(topPlayerClock, 'w')
      _updateClockStyle(bottomPlayerClock, 'b')
    } else {
      topPlayerName.textContent = 'Black'
      topPlayerClock.textContent = bStr
      bottomPlayerName.textContent = 'White'
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
    const startFen = game.header().FEN
    if (startFen) {
      tempGame.load(startFen)
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
    const row = isFlipped ? 7 - r : r
    const col = isFlipped ? 7 - c : c
    const alg = coordsToAlgebraic(row, col)

    const square = document.createElement('div')
    square.classList.add('square')
    if ((row + col) % 2 === 0) square.classList.add('white')
    else square.classList.add('black')

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
      } else {
        const img = document.createElement('img')
        img.src = `images/${color}${type}.svg`
        img.classList.add('piece')
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

  function attemptMove (targetMove) {
    game.move(targetMove)

    selectedSquare = null
    legalMovesForSelectedPiece = []
    currentViewIndex = -1
    renderBoard()
    renderHistory()
    sendPositionAndGo()
  }

  function sendPositionAndGo () {
    // Reset stats
    evalValueElement.textContent = '-'
    depthValueElement.textContent = '-'
    npsValueElement.textContent = '-'
    pvLinesElement.textContent = ''

    const history = game.history({ verbose: true })
    const uciMoves = history.map(m => {
      let uci = m.from + m.to
      if (m.promotion) uci += m.promotion
      return uci
    })

    const movesStr = uciMoves.join(' ')
    socket.send(`position startpos moves ${movesStr}`)
    socket.send(`go wtime ${Math.floor(whiteTime)} btime ${Math.floor(blackTime)}`)
  }

  newGameBtn.addEventListener('click', () => {
    startNewGame()
  })

  flipBoardBtn.addEventListener('click', () => {
    isFlipped = !isFlipped
    renderBoard()
    renderClocks()
  })

  boardThemeSelect.addEventListener('change', (e) => {
    setBoardTheme(e.target.value)
  })

  pieceSetSelect.addEventListener('change', (e) => {
    currentPieceSet = e.target.value
    renderBoard()
  })

  function setBoardTheme (theme) {
    // Remove existing theme classes
    ['theme-green', 'theme-blue', 'theme-wood'].forEach(cls => {
        boardElement.classList.remove(cls)
    })

    if (theme !== 'classic') {
      boardElement.classList.add(`theme-${theme}`)
    }
  }

  function getUnicodePiece (color, type) {
    const map = {
      w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
      b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }
    }
    return map[color][type]
  }

  connect()
})
