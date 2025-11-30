/* eslint-env browser */

window.ChatManager = class ChatManager {
  constructor (uiManager, socketHandler, visualEffects) {
    this.uiManager = uiManager
    this.socketHandler = socketHandler
    this.visualEffects = visualEffects
    this.chatInput = document.getElementById('chat-input')
    this.chatSendBtn = document.getElementById('chat-send-btn')
    this.chatMessages = document.getElementById('chat-messages')
    this.emojiTrigger = document.getElementById('emoji-trigger-btn')
    this.emojiPicker = document.getElementById('emoji-picker')

    this.init()
  }

  init () {
    if (this.chatSendBtn) {
      this.chatSendBtn.addEventListener('click', () => this.sendMessage())
    }
    if (this.chatInput) {
      this.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.sendMessage()
      })
    }
    if (this.emojiTrigger) {
      this.emojiTrigger.addEventListener('click', () => {
        this.emojiPicker.style.display = this.emojiPicker.style.display === 'none' ? 'grid' : 'none'
      })
    }

    this.renderEmojiPicker()
  }

  renderEmojiPicker () {
    const emojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '🔥', '❤️', '♟️', '🤯']
    if (!this.emojiPicker) return
    this.emojiPicker.innerHTML = ''
    emojis.forEach(emoji => {
      const btn = document.createElement('div')
      btn.textContent = emoji
      btn.style.cursor = 'pointer'
      btn.style.fontSize = '20px'
      btn.style.textAlign = 'center'
      btn.addEventListener('click', () => {
        this.sendReaction(emoji)
        this.emojiPicker.style.display = 'none'
      })
      this.emojiPicker.appendChild(btn)
    })
  }

  sendMessage () {
    const text = this.chatInput.value.trim()
    if (!text) return

    const msg = { type: 'chat', text, sender: 'Player' } // TODO: use actual name
    this.socketHandler.send(JSON.stringify(msg))
    this.addMessage(msg, true)
    this.chatInput.value = ''
  }

  sendReaction (emoji) {
    const msg = { type: 'reaction', emoji, sender: 'Player' }
    this.socketHandler.send(JSON.stringify(msg))
    this.showReaction(emoji, true) // Show locally immediately
  }

  addMessage (data, isSelf) {
    if (!this.chatMessages) return
    const div = document.createElement('div')
    div.style.marginBottom = '5px'
    const name = isSelf ? 'You' : this.escapeHtml(data.sender || 'Opponent')
    const color = isSelf ? '#33B5E5' : '#EAB839'
    div.innerHTML = `<strong style="color: ${color}">${name}:</strong> ${this.escapeHtml(data.text)}`
    this.chatMessages.appendChild(div)
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight
  }

  showReaction (emoji, isSelf) {
    if (this.visualEffects) {
      this.visualEffects.showFloatingEmoji(emoji, isSelf)
    }
  }

  escapeHtml (text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, (m) => map[m])
  }
}
