/* eslint-env browser */
/* global alert */

const TournamentManager = (() => {
  let players = []
  let matches = []
  // eslint-disable-next-line no-unused-vars
  let results = []
  let isActive = false
  let currentMatchIndex = -1
  let rounds = 1

  // DOM Elements
  let setupModal, playersList, standingsTableBody, matchQueueContainer, tournamentPanel

  function init () {
    setupModal = document.getElementById('tournament-setup-modal')
    playersList = document.getElementById('tournament-players-list')
    standingsTableBody = document.querySelector('#tournament-standings-table tbody')
    matchQueueContainer = document.getElementById('tournament-match-queue')
    tournamentPanel = document.getElementById('tournament-panel')

    document.getElementById('tournament-btn').addEventListener('click', openSetup)
    document.getElementById('close-tournament-modal').addEventListener('click', closeSetup)
    document.getElementById('add-tournament-player-btn').addEventListener('click', () => addPlayerInput())
    document.getElementById('start-tournament-confirm-btn').addEventListener('click', startTournament)
    document.getElementById('stop-tournament-btn').addEventListener('click', stopTournament)

    // Add 2 default players
    addPlayerInput('Engine A', 1500)
    addPlayerInput('Engine B', 2000)
  }

  function openSetup () {
    setupModal.classList.add('active')
  }

  function closeSetup () {
    setupModal.classList.remove('active')
  }

  function addPlayerInput (defaultName = '', defaultElo = 1500) {
    const div = document.createElement('div')
    div.classList.add('tournament-player-entry')
    div.innerHTML = `
      <input type="text" placeholder="Name" value="${defaultName}" class="player-name">
      <input type="number" placeholder="Elo" value="${defaultElo}" class="player-elo" style="width: 80px;">
      <button class="remove-player">&times;</button>
    `
    div.querySelector('.remove-player').addEventListener('click', () => div.remove())
    playersList.appendChild(div)
  }

  function startTournament () {
    // Parse players
    players = []
    const entries = playersList.querySelectorAll('.tournament-player-entry')
    entries.forEach(entry => {
      const name = entry.querySelector('.player-name').value
      const elo = parseInt(entry.querySelector('.player-elo').value)
      if (name && !isNaN(elo)) {
        players.push({ name, elo, score: 0, games: 0, id: Math.random().toString(36).substr(2, 9) })
      }
    })

    if (players.length < 2) {
      alert('Need at least 2 players')
      return
    }

    rounds = parseInt(document.getElementById('tournament-rounds').value) || 1

    generateSchedule()
    isActive = true
    currentMatchIndex = -1
    results = []

    closeSetup()
    tournamentPanel.style.display = 'flex'
    renderStandings()
    renderQueue()

    runNextMatch()
  }

  function generateSchedule () {
    matches = []
    // Round Robin
    for (let r = 0; r < rounds; r++) {
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          // Alternate colors based on round?
          // Simple: Round 1: A vs B. Round 2: B vs A.
          if (r % 2 === 0) {
            matches.push({ white: players[i], black: players[j], status: 'pending', id: matches.length })
          } else {
            matches.push({ white: players[j], black: players[i], status: 'pending', id: matches.length })
          }
        }
      }
    }
  }

  function runNextMatch () {
    if (!isActive) return

    currentMatchIndex++
    if (currentMatchIndex >= matches.length) {
      isActive = false
      alert('Tournament Completed!')
      return
    }

    const match = matches[currentMatchIndex]
    match.status = 'active'
    renderQueue()

    if (window.ChessApp && window.ChessApp.startMatch) {
      window.ChessApp.startMatch(
        { name: match.white.name, elo: match.white.elo, limitStrength: true }, // White Config
        { name: match.black.name, elo: match.black.elo, limitStrength: true }, // Black Config
        (result) => handleMatchResult(match, result) // Callback
      )
    } else {
      console.error('ChessApp not found')
    }
  }

  function handleMatchResult (match, result) {
    // Result: 'white' (1-0), 'black' (0-1), 'draw' (1/2-1/2)
    match.status = 'completed'
    match.result = result

    if (result === 'white') {
      match.white.score += 1
    } else if (result === 'black') {
      match.black.score += 1
    } else {
      match.white.score += 0.5
      match.black.score += 0.5
    }

    match.white.games++
    match.black.games++

    renderStandings()
    renderQueue()

    // Small delay before next match
    setTimeout(runNextMatch, 2000)
  }

  function stopTournament () {
    isActive = false
    tournamentPanel.style.display = 'none'
  }

  function renderStandings () {
    // Sort players
    const sorted = [...players].sort((a, b) => b.score - a.score)
    standingsTableBody.innerHTML = ''
    sorted.forEach((p, index) => {
      const tr = document.createElement('tr')
      tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${p.name}</td>
            <td>${p.elo}</td>
            <td>${p.score}</td>
            <td>${p.games}</td>
          `
      standingsTableBody.appendChild(tr)
    })
  }

  function renderQueue () {
    matchQueueContainer.innerHTML = ''
    // Show active and next few matches
    // Or show all?
    matches.forEach((m, idx) => {
      const div = document.createElement('div')
      div.classList.add('tournament-match-item')
      if (m.status === 'active') div.classList.add('active')
      if (m.status === 'completed') div.classList.add('completed')

      let resultStr = ''
      if (m.status === 'completed') {
        if (m.result === 'white') resultStr = '1-0'
        else if (m.result === 'black') resultStr = '0-1'
        else resultStr = '½-½'
      }

      div.innerHTML = `
            <span>#${idx + 1}: ${m.white.name} vs ${m.black.name}</span>
            <span>${resultStr}</span>
          `
      matchQueueContainer.appendChild(div)

      // Auto scroll to active
      if (m.status === 'active') {
        div.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  }

  return {
    init
  }
})()

document.addEventListener('DOMContentLoaded', () => {
  TournamentManager.init()
})
