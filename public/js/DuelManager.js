/* eslint-env browser */

class DuelManager {
  constructor (gameManager, socketHandler, uiManager) {
    this.gameManager = gameManager
    this.socketHandler = socketHandler
    this.uiManager = uiManager
  }

  startDuel () {
    this.gameManager.isDuelActive = true
    this.gameManager.engineAConfig = {
      name: document.getElementById('engine-a-name').value,
      elo: document.getElementById('engine-a-elo').value,
      limitStrength: document.getElementById('engine-a-limit').checked
    }
    this.gameManager.engineBConfig = {
      name: document.getElementById('engine-b-name').value,
      elo: document.getElementById('engine-b-elo').value,
      limitStrength: document.getElementById('engine-b-limit').checked
    }
    this.gameManager.startNewGame()
    this.applyEngineConfig(this.gameManager.engineAConfig)
    this.gameManager.sendPositionAndGo()
  }

  applyEngineConfig (config) {
    this.sendOption('UCI_LimitStrength', config.limitStrength)
    this.sendOption('UCI_Elo', config.elo)
    this.uiManager.showToast(`Active: ${config.name}`)
  }

  sendOption (name, value) {
    let command = `setoption name ${name}`
    if (value !== undefined) command += ` value ${value}`
    this.socketHandler.send(command)
    this.uiManager.logToOutput(`> ${command}`)
  }

  updateLeaderboard (wName, bName, result) {
    const data = JSON.parse(localStorage.getItem('engine-leaderboard') || '{}')
    if (!data[wName]) data[wName] = { w: 0, d: 0, l: 0 }
    if (!data[bName]) data[bName] = { w: 0, d: 0, l: 0 }

    if (result === 'white') {
      data[wName].w++
      data[bName].l++
    } else if (result === 'black') {
      data[wName].l++
      data[bName].w++
    } else {
      data[wName].d++
      data[bName].d++
    }
    localStorage.setItem('engine-leaderboard', JSON.stringify(data))
  }

  renderLeaderboard () {
    const table = this.uiManager.elements.leaderboardTable
    if (!table) return
    table.innerHTML = ''
    const data = JSON.parse(localStorage.getItem('engine-leaderboard') || '{}')
    const entries = Object.entries(data).map(([name, stats]) => {
      const games = stats.w + stats.d + stats.l
      const score = stats.w + stats.d * 0.5
      const pct = games > 0 ? (score / games) * 100 : 0
      return { name, ...stats, games, pct }
    }).sort((a, b) => b.pct - a.pct)

    entries.forEach(e => {
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td style="padding: 5px;">${e.name}</td>
        <td style="padding: 5px;">${e.games}</td>
        <td style="padding: 5px;">${e.w}</td>
        <td style="padding: 5px;">${e.d}</td>
        <td style="padding: 5px;">${e.l}</td>
        <td style="padding: 5px;">${e.pct.toFixed(1)}%</td>
      `
      table.appendChild(tr)
    })
  }

  resetLeaderboard () {
    localStorage.removeItem('engine-leaderboard')
    this.renderLeaderboard()
  }
}

window.DuelManager = DuelManager
