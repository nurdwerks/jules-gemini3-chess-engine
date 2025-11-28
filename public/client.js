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

  // Unicode Chess Pieces
  const pieces = {
    w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
    b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
  }

  function connect () {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    socket = new WebSocket(`${protocol}//${window.location.host}`)

    socket.onopen = () => {
      statusElement.textContent = 'Status: Connected'
      socket.send('uci')
    }

    socket.onmessage = (event) => {
      const msg = event.data
      // logToOutput(msg);

      const parts = msg.split(' ')
      if (msg.startsWith('option name')) {
        parseOption(msg)
      } else if (parts[0] === 'uciok') {
        socket.send('isready')
      } else if (parts[0] === 'readyok') {
        if (!gameStarted) {
          gameStarted = true
          startNewGame()
        }
      } else if (parts[0] === 'bestmove') {
        const move = parts[1]
        if (move && move !== '(none)') {
          makeMove(move)
          turn = (turn === 'w') ? 'b' : 'w'
          renderBoard()
        }
      } else if (parts[0] === 'info') {
        // Optionally parse score/depth here
        if (msg.includes('score cp') || msg.includes('mate')) {
          logToOutput(msg)
        }
      }
    }

    socket.onclose = () => {
      statusElement.textContent = 'Status: Disconnected'
    }
  }

  function logToOutput (msg) {
    const line = document.createElement('div')
    line.textContent = msg
    engineOutputElement.appendChild(line)
    engineOutputElement.scrollTop = engineOutputElement.scrollHeight
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

    if (type === 'spin') {
      input = document.createElement('input')
      input.type = 'number'
      if (min) input.min = min
      if (max) input.max = max
      if (defaultValue) input.value = defaultValue

      input.addEventListener('change', () => {
        sendOption(name, input.value)
      })
    } else if (type === 'check') {
      input = document.createElement('input')
      input.type = 'checkbox'
      if (defaultValue === 'true') input.checked = true

      input.addEventListener('change', () => {
        sendOption(name, input.checked)
      })
    } else if (type === 'string') {
      input = document.createElement('input')
      input.type = 'text'
      if (defaultValue) input.value = defaultValue

      input.addEventListener('change', () => {
        sendOption(name, input.value)
      })
    } else if (type === 'button') {
      input = document.createElement('button')
      input.textContent = 'Trigger'
      input.addEventListener('click', () => {
        sendOption(name)
      })
    } else if (type === 'combo') {
      input = document.createElement('select')
      if (vars) {
        vars.forEach(v => {
          const option = document.createElement('option')
          option.value = v
          option.textContent = v
          if (v === defaultValue) option.selected = true
          input.appendChild(option)
        })
      }
      input.addEventListener('change', () => {
        sendOption(name, input.value)
      })
    }

    if (input) {
      container.appendChild(input)
      uciOptionsElement.appendChild(container)
    }
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
          square.textContent = pieces[color][type]
          // Make black pieces black (default is black but let's be safe if CSS changes text color)
          // Wait, CSS sets color: black for both squares.
          // But usually black pieces are solid and white pieces are hollow in Unicode.
          // Actually, unicode black pieces are filled, white are hollow.
          // So we can just rely on the character.
        }

        square.dataset.row = row
        square.dataset.col = col

        if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
          square.classList.add('selected')
        }

        // Highlight last move from/to if needed (omitted for simplicity for now)

        square.addEventListener('click', () => handleSquareClick(row, col))
        boardElement.appendChild(square)
      }
    }
  }

  function handleSquareClick (row, col) {
    // Basic interaction logic
    const piece = boardState[row][col]
    const isWhitePiece = (piece !== '.' && piece === piece.toUpperCase())
    const isBlackPiece = (piece !== '.' && piece === piece.toLowerCase())
    const isOwnPiece = (turn === 'w' && isWhitePiece) || (turn === 'b' && isBlackPiece)

    if (selectedSquare) {
      // Attempt to move
      if (selectedSquare.row === row && selectedSquare.col === col) {
        // Deselect
        selectedSquare = null
        renderBoard()
      } else if (isOwnPiece) {
        // Change selection
        selectedSquare = { row, col }
        renderBoard()
      } else {
        // Move!
        const fromRow = selectedSquare.row
        const fromCol = selectedSquare.col
        const toRow = row
        const toCol = col

        const move = coordsToAlgebraic(fromRow, fromCol) + coordsToAlgebraic(toRow, toCol)

        // Check promotion (simplistic: always queen)
        // White pawn moving to row 0
        if (boardState[fromRow][fromCol] === 'P' && toRow === 0) {
          attemptMove(move + 'q')
        }
        // Black pawn moving to row 7
        else if (boardState[fromRow][fromCol] === 'p' && toRow === 7) {
          attemptMove(move + 'q')
        } else {
          attemptMove(move)
        }

        selectedSquare = null
      }
    } else {
      if (isOwnPiece) {
        selectedSquare = { row, col }
        renderBoard()
      }
    }
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

    // Castling Logic (simplistic check based on king movement)
    if (piece.toLowerCase() === 'k' && Math.abs(from.col - to.col) > 1) {
      // Kingside
      if (to.col > from.col) {
        // Move rook from h to f
        const rookRow = from.row
        const rookFromCol = 7
        const rookToCol = 5
        boardState[rookRow][rookToCol] = boardState[rookRow][rookFromCol]
        boardState[rookRow][rookFromCol] = '.'
      }
      // Queenside
      else {
        // Move rook from a to d
        const rookRow = from.row
        const rookFromCol = 0
        const rookToCol = 3
        boardState[rookRow][rookToCol] = boardState[rookRow][rookFromCol]
        boardState[rookRow][rookFromCol] = '.'
      }
    }

    // En Passant Logic (simplistic)
    // If pawn moves diagonally to an empty square, it's en passant capture
    if (piece.toLowerCase() === 'p' && Math.abs(from.col - to.col) === 1 && boardState[to.row][to.col] === '.') {
      // Capture the pawn behind the destination
      // White moves up (decreasing row index), captures pawn at row+1
      // Black moves down (increasing row index), captures pawn at row-1
      const captureRow = (piece === 'P') ? to.row + 1 : to.row - 1
      boardState[captureRow][to.col] = '.'
    }

    boardState[to.row][to.col] = piece
    boardState[from.row][from.col] = '.'

    if (promotion) {
      // Assume queen for now if logic above defaulted, but we should respect 'promotion' char
      // piece is 'P' or 'p'
      const newPiece = (piece === 'P') ? promotion.toUpperCase() : promotion.toLowerCase()
      boardState[to.row][to.col] = newPiece
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
