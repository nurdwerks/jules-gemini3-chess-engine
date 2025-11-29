/**
 * @jest-environment jsdom
 */

/* global localStorage */

describe('LeaderboardManager', () => {
  let LeaderboardManager
  let uiManager
  let leaderboardManager

  beforeAll(() => {
    require('../../public/js/LeaderboardManager.js')
    LeaderboardManager = window.LeaderboardManager
  })

  beforeEach(() => {
    uiManager = {
      elements: {
        leaderboardTable: document.createElement('tbody')
      }
    }
    leaderboardManager = new LeaderboardManager(uiManager)
    localStorage.clear()
  })

  test('updateLeaderboard updates storage', () => {
    leaderboardManager.updateLeaderboard('EngineA', 'EngineB', 'white')

    const data = JSON.parse(localStorage.getItem('engine-leaderboard'))
    expect(data.EngineA.w).toBe(1)
    expect(data.EngineB.l).toBe(1)

    leaderboardManager.updateLeaderboard('EngineA', 'EngineB', 'draw')
    const data2 = JSON.parse(localStorage.getItem('engine-leaderboard'))
    expect(data2.EngineA.d).toBe(1)
    expect(data2.EngineB.d).toBe(1)
  })

  test('renderLeaderboard renders table', () => {
    leaderboardManager.updateLeaderboard('EngineA', 'EngineB', 'white')
    leaderboardManager.renderLeaderboard()

    const rows = uiManager.elements.leaderboardTable.querySelectorAll('tr')
    expect(rows.length).toBe(2) // EngineA and EngineB

    const firstRow = rows[0]
    expect(firstRow.textContent).toContain('EngineA')
    expect(firstRow.textContent).toContain('100.0%') // 1/1
  })

  test('renderLeaderboard handles empty', () => {
    leaderboardManager.renderLeaderboard()
    const rows = uiManager.elements.leaderboardTable.querySelectorAll('tr')
    expect(rows.length).toBe(0)
  })
})
