/**
 * @jest-environment jsdom
 */

/* global localStorage */

const AutoSaveManager = require('../../public/js/AutoSaveManager.js')

describe('AutoSaveManager', () => {
  let autoSaveManager
  let mockGameManager
  let mockUiManager
  let mockGame

  beforeEach(() => {
    // Clear JSDOM localStorage
    localStorage.clear()

    mockGame = {
      fen: jest.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'),
      pgn: jest.fn().mockReturnValue(''),
      load_pgn: jest.fn()
    }

    mockGameManager = {
      gameStarted: true,
      gameMode: 'pve',
      whiteTime: 300,
      blackTime: 300,
      startNewGame: jest.fn()
    }

    mockUiManager = {
      showToast: jest.fn()
    }

    autoSaveManager = new AutoSaveManager(mockGameManager, mockUiManager, mockGame)
  })

  test('should save game state to localStorage', () => {
    mockGame.fen.mockReturnValue('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1')
    mockGame.pgn.mockReturnValue('1. e4')

    autoSaveManager.saveGame()

    const saved = JSON.parse(localStorage.getItem('autosave_game_state'))
    expect(saved.fen).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1')
    expect(saved.pgn).toBe('1. e4')
    expect(saved.mode).toBe('pve')
    expect(saved.whiteTime).toBe(300)
  })

  test('should not save if game not started', () => {
    mockGameManager.gameStarted = false
    autoSaveManager.saveGame()
    expect(localStorage.getItem('autosave_game_state')).toBeNull()
  })

  test('should check for saved game and ignore startpos', () => {
    const state = {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    }
    localStorage.setItem('autosave_game_state', JSON.stringify(state))

    expect(autoSaveManager.checkForSavedGame()).toBe(false)
  })

  test('should check for saved game and return state if valid', () => {
    const validState = {
      fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      pgn: '1. e4',
      mode: 'pvp'
    }
    localStorage.setItem('autosave_game_state', JSON.stringify(validState))

    const result = autoSaveManager.checkForSavedGame()
    expect(result.fen).toBe(validState.fen)
  })

  test('should restore game state', () => {
    const state = {
      fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      pgn: '1. e4',
      mode: 'pvp',
      whiteTime: 250,
      blackTime: 240
    }

    autoSaveManager.restoreGame(state)

    expect(mockGameManager.startNewGame).toHaveBeenCalledWith(state.fen)
    expect(mockGame.load_pgn).toHaveBeenCalledWith(state.pgn)
    expect(mockGameManager.gameMode).toBe('pvp')
    expect(mockGameManager.whiteTime).toBe(250)
    expect(mockUiManager.showToast).toHaveBeenCalled()
  })

  test('should clear save', () => {
    localStorage.setItem('autosave_game_state', 'some data')
    autoSaveManager.clearSave()
    expect(localStorage.getItem('autosave_game_state')).toBeNull()
  })
})
