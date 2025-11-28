/* eslint-env browser */
document.addEventListener('DOMContentLoaded', () => {
  const boardElement = document.getElementById('chessboard')
  const statusElement = document.getElementById('status')
  const engineOutputElement = document.getElementById('engine-output')
  const uciOptionsElement = document.getElementById('uci-options')
  const newGameBtn = document.getElementById('new-game-btn')
  const flipBoardBtn = document.getElementById('flip-board-btn')

  let socket
  let boardState = [] // 8x8 array representation
  let turn = 'w'
  let selectedSquare = null
  let isFlipped = false
  let movesHistory = [] // List of UCI moves (e.g., 'e2e4')
  let gameStarted = false

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
      makeMove(move)
      turn = (turn === 'w') ? 'b' : 'w'
      renderBoard()
    }
  }

  function _handleInfoMsg (msg) {
    if (msg.includes('score cp') || msg.includes('mate')) {
      logToOutput(msg)
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
    // Format: option name <name> type <type> [default <default>] [min <min>] [max <max>] [var <var>]
    const parts = line.split(' ')
    const nameIdx = parts.indexOf('name')
    const typeIdx = parts.indexOf('type')

    if (nameIdx === -1 || typeIdx === -1) return

    // Extract name (can be multiple words)
    const name = parts.slice(nameIdx + 1, typeIdx).join(' ')
    const type = parts[typeIdx + 1]

    // Helper to find value between keywords
    const getVal = (key) => {
      const start = parts.indexOf(key)
      if (start === -1) return null
      // Find end: next keyword or end of string
      // Keywords: name, type, default, min, max, var
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

    // Handle vars for combo
    const vars = []
    parts.forEach((part, index) => {
      if (part === 'var') {
        // The value follows 'var', might be multi-word
        // But UCI spec says "var <value>". If value has spaces, it might be tricky without quotes.
        // However, standard UCI often assumes single tokens or predictable parsing.
        // Let's assume 'var' takes the rest until next keyword.
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

  function initBoard () {
    boardState = [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ]
    movesHistory = []
    turn = 'w'
  }

  function renderBoard () {
    boardElement.innerHTML = ''
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        _createSquare(r, c)
      }
    }
  }

  function _createSquare (r, c) {
    const row = isFlipped ? 7 - r : r
    const col = isFlipped ? 7 - c : c

    const square = document.createElement('div')
    square.classList.add('square')
    if ((row + col) % 2 === 0) square.classList.add('white')
    else square.classList.add('black')

    const pieceChar = boardState[row][col]
    if (pieceChar !== '.') {
      const color = (pieceChar === pieceChar.toUpperCase()) ? 'w' : 'b'
      const type = pieceChar.toLowerCase()
      const img = document.createElement('img')
      img.src = `images/${color}${type}.svg`
      img.classList.add('piece')
      square.appendChild(img)
    }

    square.dataset.row = row
    square.dataset.col = col

    if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
      square.classList.add('selected')
    }

    square.addEventListener('click', () => handleSquareClick(row, col))
    boardElement.appendChild(square)
  }

  function handleSquareClick (row, col) {
    const piece = boardState[row][col]
    const isOwnPiece = _isOwnPiece(piece, turn)

    if (selectedSquare) {
      if (selectedSquare.row === row && selectedSquare.col === col) {
        selectedSquare = null
        renderBoard()
      } else if (isOwnPiece) {
        selectedSquare = { row, col }
        renderBoard()
      } else {
        _handleMoveAttempt(row, col)
      }
    } else {
      if (isOwnPiece) {
        selectedSquare = { row, col }
        renderBoard()
      }
    }
  }

  function _isOwnPiece (piece, turn) {
    const isWhitePiece = (piece !== '.' && piece === piece.toUpperCase())
    const isBlackPiece = (piece !== '.' && piece === piece.toLowerCase())
    return (turn === 'w' && isWhitePiece) || (turn === 'b' && isBlackPiece)
  }

  function _handleMoveAttempt (row, col) {
    const fromRow = selectedSquare.row
    const fromCol = selectedSquare.col
    const toRow = row
    const toCol = col

    const move = coordsToAlgebraic(fromRow, fromCol) + coordsToAlgebraic(toRow, toCol)

    if (boardState[fromRow][fromCol] === 'P' && toRow === 0) {
      attemptMove(move + 'q')
    } else if (boardState[fromRow][fromCol] === 'p' && toRow === 7) {
      attemptMove(move + 'q')
    } else {
      attemptMove(move)
    }

    selectedSquare = null
  }

  function coordsToAlgebraic (row, col) {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const rank = 8 - row
    return files[col] + rank
  }

  function algebraicToCoords (alg) {
    const files = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7 }
    const col = files[alg[0]]
    const row = 8 - parseInt(alg[1])
    return { row, col }
  }

  function attemptMove (move) {
    // Optimistically update board (will be corrected or engine will scream if illegal)
    // Ideally we wait for engine? No, typical UCI clients update then ask engine.
    // We do not have move generator here, so we trust user (and engine will eventually correct or ignore).
    // Actually, for a "fully functioning" client, we should probably validate.
    // But without a move generator in JS, we can't fully validate.
    // We will send the move to the engine. If the engine replies with a bestmove, we assume the game continues.
    // To be safe, let's just update our local board and send the move sequence.

    makeMove(move)
    turn = (turn === 'w') ? 'b' : 'w'
    renderBoard()

    // Send to engine
    sendPositionAndGo()
  }

  function makeMove (move) {
    movesHistory.push(move)
    const fromAlg = move.substring(0, 2)
    const toAlg = move.substring(2, 4)
    const promotion = move.length > 4 ? move[4] : null

    const from = algebraicToCoords(fromAlg)
    const to = algebraicToCoords(toAlg)

    const piece = boardState[from.row][from.col]

    _handleCastling(piece, from, to)
    _handleEnPassant(piece, from, to)

    boardState[to.row][to.col] = piece
    boardState[from.row][from.col] = '.'

    if (promotion) {
      const newPiece = (piece === 'P') ? promotion.toUpperCase() : promotion.toLowerCase()
      boardState[to.row][to.col] = newPiece
    }
  }

  function _handleCastling (piece, from, to) {
    if (piece.toLowerCase() === 'k' && Math.abs(from.col - to.col) > 1) {
      if (to.col > from.col) {
        const rookRow = from.row
        const rookFromCol = 7
        const rookToCol = 5
        boardState[rookRow][rookToCol] = boardState[rookRow][rookFromCol]
        boardState[rookRow][rookFromCol] = '.'
      } else {
        const rookRow = from.row
        const rookFromCol = 0
        const rookToCol = 3
        boardState[rookRow][rookToCol] = boardState[rookRow][rookFromCol]
        boardState[rookRow][rookFromCol] = '.'
      }
    }
  }

  function _handleEnPassant (piece, from, to) {
    if (piece.toLowerCase() === 'p' && Math.abs(from.col - to.col) === 1 && boardState[to.row][to.col] === '.') {
      const captureRow = (piece === 'P') ? to.row + 1 : to.row - 1
      boardState[captureRow][to.col] = '.'
    }
  }

  function sendPositionAndGo () {
    const movesStr = movesHistory.join(' ')
    socket.send(`position startpos moves ${movesStr}`)
    socket.send('go wtime 300000 btime 300000 movestogo 40') // Simple time control
  }

  function startNewGame () {
    initBoard()
    renderBoard()
    socket.send('ucinewgame')
    // Do not send 'isready' here to avoid infinite loop with readyok -> startNewGame
    // The engine is ready enough or processes commands sequentially.
  }

  newGameBtn.addEventListener('click', () => {
    startNewGame()
  })

  flipBoardBtn.addEventListener('click', () => {
    isFlipped = !isFlipped
    renderBoard()
  })

  initBoard()
  renderBoard()
  connect()
})
