/**
 * @jest-environment jsdom
 */

/* eslint-env jest */
/* global localStorage */

describe('UIManager Accessibility Modal', () => {
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
    require('../../public/js/UIConstants.js')
    require('../../public/js/UIOptionFactory.js')
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

      <div id="promotion-modal" class="modal"></div>
      <div id="pgn-import-modal" class="modal"></div>
      <div id="duel-setup-modal" class="modal"></div>
      <div id="leaderboard-modal" class="modal"></div>
      <div id="analysis-report-modal" class="modal"></div>
      <div id="accessibility-modal" class="modal"></div>

      <input id="fen-input" />
      <textarea id="pgn-input-area"></textarea>
      <input id="time-base" />
      <input id="time-inc" />
      <select id="animation-speed"></select>
      <select id="board-theme"></select>
      <select id="piece-set"></select>
      <select id="ui-theme"></select>
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

      <button id="accessibility-btn"></button>
      <button id="close-accessibility-modal"></button>

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
    `

    callbacks = {}
    uiManager = new window.UIManager(callbacks)
  })

  test('caches accessibility modal', () => {
    expect(uiManager.elements.accessibilityModal).not.toBeNull()
    expect(uiManager.elements.accessibilityModal.id).toBe('accessibility-modal')
  })

  test('opens accessibility modal on button click', () => {
    const btn = document.getElementById('accessibility-btn')
    const modal = document.getElementById('accessibility-modal')

    expect(modal.classList.contains('active')).toBe(false)
    btn.click()
    expect(modal.classList.contains('active')).toBe(true)
  })

  test('closes accessibility modal on close button click', () => {
    const modal = document.getElementById('accessibility-modal')
    const closeBtn = document.getElementById('close-accessibility-modal')

    modal.classList.add('active')
    expect(modal.classList.contains('active')).toBe(true)

    closeBtn.click()
    expect(modal.classList.contains('active')).toBe(false)
  })
})
