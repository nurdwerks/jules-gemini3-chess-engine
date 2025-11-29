/**
 * @jest-environment jsdom
 */

/* eslint-env jest */

describe('UIManager', () => {
  let uiManager
  let callbacks

  beforeAll(() => {
    // Mock BoardInfoRenderer globally
    global.BoardInfoRenderer = class {
      constructor (elements) {
        this.elements = elements
      }
      updateCapturedPieces () {}
    }

    // Load UIManager
    require('../../public/js/UIManager.js')
  })

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="status"></div>
      <div id="engine-output"></div>
      <div id="uci-options"></div>
      <div id="move-history"></div>
      <div id="pv-lines"></div>
      <div id="system-log"></div>
      <span id="eval-value"></span>
      <span id="depth-value"></span>
      <span id="nps-value"></span>
      <span id="wdl-value"></span>
      <div id="eval-bar-fill"></div>
      <div id="top-player-name"></div>
      <div id="top-player-clock"></div>
      <div id="bottom-player-name"></div>
      <div id="bottom-player-clock"></div>
      <div id="top-captured-pieces"></div>
      <div id="bottom-captured-pieces"></div>
      <div id="top-material-diff"></div>
      <div id="bottom-material-diff"></div>
      <div id="top-material-bar"></div>
      <div id="bottom-material-bar"></div>

      <div id="promotion-modal" class="modal"><div class="promo-piece" data-piece="q"><img src=""></div></div>
      <div id="pgn-import-modal" class="modal"></div>
      <div id="duel-setup-modal" class="modal"></div>
      <div id="leaderboard-modal" class="modal"></div>
      <div id="analysis-report-modal" class="modal"></div>

      <input id="fen-input" />
      <textarea id="pgn-input-area"></textarea>
      <input id="time-base" />
      <input id="time-inc" />
      <select id="animation-speed"></select>
      <select id="board-theme"></select>
      <select id="piece-set"></select>
      <select id="ui-theme">
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </select>
      <input id="board-size" />

      <div id="memory-training-controls"></div>
      <div id="tactics-controls"></div>
      <div id="endgame-controls"></div>
      <div id="repertoire-controls"></div>
      <div id="piece-palette"></div>
      <table id="analysis-table"><tbody></tbody></table>
      <div id="analysis-summary"></div>
      <div id="analysis-progress-bar"></div>
      <div id="analysis-progress-fill"></div>
      <table id="leaderboard-table"><tbody></tbody></table>

      <button id="new-game-btn"></button>
      <button id="new-960-btn"></button>
      <button id="flip-board-btn"></button>
      <button id="self-play-btn"></button>
      <button id="fullscreen-btn"></button>
      <button id="sidebar-toggle-btn"></button>
      <button id="streamer-mode-btn"></button>
      <button id="resign-btn"></button>
      <button id="offer-draw-btn"></button>
      <button id="takeback-btn"></button>
      <button id="force-move-btn"></button>
      <button id="clear-analysis-btn"></button>
      <button id="replay-btn"></button>
      <button id="load-fen-btn"></button>
      <button id="copy-fen-btn"></button>
      <button id="import-pgn-btn"></button>
      <button id="export-pgn-btn"></button>
      <button id="close-pgn-modal"></button>
      <button id="load-pgn-confirm-btn"></button>
      <button id="engine-duel-btn"></button>
      <button id="close-duel-modal"></button>
      <button id="start-duel-btn"></button>
      <button id="armageddon-btn"></button>

      <button id="memory-training-btn"></button>
      <button id="memory-submit-btn"></button>
      <button id="memory-give-up-btn"></button>
      <button id="tactics-trainer-btn"></button>
      <button id="tactics-next-btn"></button>
      <button id="endgame-trainer-btn"></button>
      <button id="start-endgame-btn"></button>
      <select id="endgame-select"></select>
      <button id="daily-puzzle-btn"></button>
      <button id="analyze-game-btn"></button>
      <button id="close-analysis-modal"></button>
      <button id="leaderboard-btn"></button>
      <button id="close-leaderboard-modal"></button>
      <button id="reset-leaderboard-btn"></button>
      <button id="repertoire-builder-btn"></button>
      <button id="save-repertoire-btn"></button>

      <div class="tab-btn" data-tab="tab1"></div>
      <div class="tab-content" id="tab1-tab"></div>
      <div id="chessboard"></div>
      <div id="toast-container"></div>

      <input type="checkbox" id="auto-flip" />
      <input type="checkbox" id="auto-queen" />
      <input type="checkbox" id="move-confirmation" />
      <input type="checkbox" id="zen-mode" />
      <input type="checkbox" id="blindfold-mode" />
      <input type="checkbox" id="blindfold-training" />
      <input type="checkbox" id="show-coords" />
      <input type="checkbox" id="show-arrow-last" />
      <input type="checkbox" id="show-threats" />
      <input type="checkbox" id="analysis-mode" />
      <input type="checkbox" id="game-mode" />
    `

    callbacks = {
      onNewGame: jest.fn(),
      onNew960: jest.fn(),
      onFlipBoard: jest.fn(),
      onSelfPlayToggle: jest.fn(),
      onResign: jest.fn(),
      onOfferDraw: jest.fn(),
      onTakeback: jest.fn(),
      onForceMove: jest.fn(),
      onClearAnalysis: jest.fn(),
      onReplayToggle: jest.fn(),
      onLoadFen: jest.fn(),
      onCopyFen: jest.fn(),
      onExportPgn: jest.fn(),
      onLoadPgn: jest.fn(),
      onStartDuel: jest.fn(),
      onArmageddon: jest.fn(),
      onMemoryTraining: jest.fn(),
      onMemorySubmit: jest.fn(),
      onMemoryGiveUp: jest.fn(),
      onTacticsTrainer: jest.fn(),
      onTacticsNext: jest.fn(),
      onEndgameTrainer: jest.fn(),
      onStartEndgame: jest.fn(),
      onDailyPuzzle: jest.fn(),
      onAnalyzeGame: jest.fn(),
      onStopAnalysis: jest.fn(),
      onShowLeaderboard: jest.fn(),
      onResetLeaderboard: jest.fn(),
      onRepertoireBuilder: jest.fn(),
      onSaveRepertoire: jest.fn(),
      onAutoFlipChange: jest.fn(),
      onAutoQueenChange: jest.fn(),
      onMoveConfirmChange: jest.fn(),
      onShowCoordsChange: jest.fn(),
      onShowArrowLastChange: jest.fn(),
      onShowThreatsChange: jest.fn(),
      onAnalysisModeChange: jest.fn(),
      onGameModeChange: jest.fn(),
      onBoardThemeChange: jest.fn(),
      onPieceSetChange: jest.fn(),
      getTurn: jest.fn().mockReturnValue('w')
    }

    uiManager = new window.UIManager(callbacks)
  })

  test('caches elements correctly', () => {
    expect(uiManager.elements.status).not.toBeNull()
    expect(uiManager.elements.engineOutput).not.toBeNull()
    expect(uiManager.elements.uciOptions).not.toBeNull()
    expect(uiManager.elements.moveHistory).not.toBeNull()
  })

  test('binds events correctly', () => {
    document.getElementById('new-game-btn').click()
    expect(callbacks.onNewGame).toHaveBeenCalled()

    document.getElementById('flip-board-btn').click()
    expect(callbacks.onFlipBoard).toHaveBeenCalled()

    document.getElementById('auto-flip').click()
    expect(callbacks.onAutoFlipChange).toHaveBeenCalled()
  })

  test('logToOutput prepends messages', () => {
    uiManager.logToOutput('Test message 1')
    uiManager.logToOutput('Test message 2')
    const children = uiManager.elements.engineOutput.children
    expect(children.length).toBe(2)
    expect(children[0].textContent).toContain('Test message 2')
    expect(children[1].textContent).toContain('Test message 1')
  })

  test('logSystemMessage prepends messages with color', () => {
    uiManager.logSystemMessage('Info message')
    uiManager.logSystemMessage('Error message', 'error')
    const children = uiManager.elements.systemLog.children
    expect(children.length).toBe(2)
    expect(children[0].textContent).toContain('Error message')
    expect(children[0].style.color).toBe('rgb(242, 73, 92)')
    expect(children[1].textContent).toContain('Info message')
  })

  test('showToast adds toast to container', () => {
    jest.useFakeTimers()
    uiManager.showToast('Toast message', 'success')
    const toastContainer = document.getElementById('toast-container')
    expect(toastContainer.children.length).toBe(1)
    expect(toastContainer.children[0].textContent).toBe('Toast message')
    expect(toastContainer.children[0].classList.contains('success')).toBe(true)

    // Simulate animation end
    const toast = toastContainer.children[0]
    // We need to wait for the timeout inside showToast (3000ms)
    jest.advanceTimersByTime(3000)

    // After timeout, it sets animation. Then we wait for animationend.
    toast.dispatchEvent(new Event('animationend'))

    expect(toastContainer.children.length).toBe(0)
    jest.useRealTimers()
  })

  test('updateSearchStats updates DOM', () => {
    const info = {
      depth: 20,
      nps: 2500000,
      wdl: [400, 500, 100],
      score: { type: 'cp', value: 50 },
      pv: ['e2e4', 'e7e5']
    }
    uiManager.updateSearchStats(info)
    expect(document.getElementById('depth-value').textContent).toBe('20')
    expect(document.getElementById('nps-value').textContent).toBe('2.5M')
    expect(document.getElementById('wdl-value').textContent).toBe('40-50-10%')
    expect(document.getElementById('eval-value').textContent).toBe('+0.50')
    expect(document.getElementById('pv-lines').textContent).toBe('e2e4 e7e5')
  })

  test('renderHistory renders moves', () => {
    const game = {
      history: () => ['e4', 'e5', 'Nf3', 'Nc6']
    }
    const onHistoryClick = jest.fn()
    uiManager.renderHistory(game, 2, onHistoryClick) // index 2 is Nf3 (0, 1, 2)
    const moves = document.getElementById('move-history').querySelectorAll('.move-san')
    expect(moves.length).toBe(4)
    expect(moves[0].textContent).toBe('e4')
    expect(moves[2].textContent).toBe('Nf3')
    expect(moves[2].classList.contains('active')).toBe(true)

    moves[1].click()
    expect(onHistoryClick).toHaveBeenCalledWith(1)
  })

  test('parseOption creates UI elements', () => {
    const onSendOption = jest.fn()
    uiManager.parseOption('option name Threads type spin default 1 min 1 max 128', onSendOption)

    const label = document.querySelector('#uci-options label')
    expect(label.textContent).toBe('Threads: ')
    const input = document.querySelector('#uci-options input[type="number"]')
    expect(input).not.toBeNull()
    expect(input.value).toBe('1')
    expect(input.min).toBe('1')
    expect(input.max).toBe('128')

    input.value = 4
    input.dispatchEvent(new Event('change'))
    expect(onSendOption).toHaveBeenCalledWith('Threads', '4')
  })

  test('toggles Zen Mode', () => {
    const checkbox = document.getElementById('zen-mode')
    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change'))
    expect(document.body.classList.contains('zen-mode')).toBe(true)

    checkbox.checked = false
    checkbox.dispatchEvent(new Event('change'))
    expect(document.body.classList.contains('zen-mode')).toBe(false)
  })

  test('toggles Blindfold Mode', () => {
      const checkbox = document.getElementById('blindfold-mode')
      const board = document.getElementById('chessboard')
      checkbox.checked = true
      checkbox.dispatchEvent(new Event('change'))
      expect(board.classList.contains('blindfold')).toBe(true)

      checkbox.checked = false
      checkbox.dispatchEvent(new Event('change'))
      expect(board.classList.contains('blindfold')).toBe(false)
  })

  test('sets UI Theme', () => {
      const select = document.getElementById('ui-theme')
      select.value = 'light'
      select.dispatchEvent(new Event('change'))
      expect(document.body.classList.contains('light-mode')).toBe(true)
      expect(localStorage.getItem('ui-theme')).toBe('light')

      select.value = 'dark'
      select.dispatchEvent(new Event('change'))
      expect(document.body.classList.contains('light-mode')).toBe(false)
  })

  test('Board resizing', () => {
      const input = document.getElementById('board-size')
      input.value = 800
      input.dispatchEvent(new Event('change'))
      expect(document.getElementById('chessboard').style.getPropertyValue('--board-max-width')).toBe('800px')
  })

  test('renderAnalysisRow renders row', () => {
      const task = { moveIndex: 1, san: 'e4' }
      const result = { best: 'e4', diff: 0, eval: '+0.50' }
      uiManager.renderAnalysisRow(task, result)

      const rows = document.querySelectorAll('#analysis-table tr')
      expect(rows.length).toBe(1)
      expect(rows[0].textContent).toContain('e4')
      expect(rows[0].textContent).toContain('+0.50')
  })

  test('renderAnalysisRow handles blunders', () => {
      // Clear previous
      document.querySelector('#analysis-table tbody').innerHTML = ''

      const task = { moveIndex: 2, san: 'h5' }
      const result = { best: 'd4', diff: 400, eval: '-4.00' } // Blunder
      uiManager.renderAnalysisRow(task, result)

      const rows = document.querySelectorAll('#analysis-table tr')
      expect(rows.length).toBe(1)
      const lastRow = rows[0]
      expect(lastRow.innerHTML).toContain('color: #F2495C') // Red for blunder
      expect(lastRow.innerHTML).toContain('??')
  })

  test('updateAnalysisProgress', () => {
      uiManager.updateAnalysisProgress(5, 10)
      const bar = document.getElementById('analysis-progress-fill')
      expect(bar.style.width).toBe('50%')
  })

  test('showPromotionModal resolves with piece type', async () => {
      const promise = uiManager.showPromotionModal('w', 'cburnett')

      expect(document.getElementById('promotion-modal').classList.contains('active')).toBe(true)

      const q = document.querySelector('.promo-piece[data-piece="q"]')
      // The event listener is attached to the CLONED node in showPromotionModal.
      // We need to find the new node.
      // showPromotionModal implementation:
      // const newEl = p.cloneNode(true)
      // p.parentNode.replaceChild(newEl, p)

      // So querying again should get the new element
      const newQ = document.querySelector('.promo-piece[data-piece="q"]')
      newQ.click()

      const result = await promise
      expect(result).toBe('q')
      expect(document.getElementById('promotion-modal').classList.contains('active')).toBe(false)
  })

  test('showPromotionModal rejects on cancel', async () => {
      const promise = uiManager.showPromotionModal('w', 'cburnett')

      const modal = document.getElementById('promotion-modal')
      modal.click()

      await expect(promise).rejects.toThrow('Cancelled')
  })
})
