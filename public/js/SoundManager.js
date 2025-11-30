/* eslint-env browser */
/* global JSZip */

window.SoundManager = (() => {
  let context = null
  let enabled = true
  let masterGain = null
  let volume = 1.0

  // Audio Buffers
  const soundBuffers = {
    move: null,
    capture: null,
    check: null,
    checkmate: null,
    stalemate: null,
    gameStart: null,
    gameOver: null
  }

  const defaultTones = {
    move: { type: 'triangle', freq: 200, duration: 0.1 },
    capture: { type: 'square', freq: 600, duration: 0.1 },
    check: { type: 'sine', freq: [600, 800], duration: 0.15 },
    checkmate: { type: 'sawtooth', freq: [400, 600, 800], duration: 0.3 },
    stalemate: { type: 'sine', freq: [300, 200], duration: 0.4 }
  }

  const init = () => {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      context = new AudioContext()
      masterGain = context.createGain()
      masterGain.connect(context.destination)
      masterGain.gain.value = volume
    }
    if (context.state === 'suspended') {
      context.resume().catch(e => console.warn(e))
    }
  }

  const loadSound = async (key, arrayBuffer) => {
    init()
    try {
      const buffer = await context.decodeAudioData(arrayBuffer)
      soundBuffers[key] = buffer
    } catch (e) {
      console.warn(`Failed to decode audio for ${key}`, e)
    }
  }

  const playBuffer = (key) => {
    if (!context || !soundBuffers[key]) return false
    try {
      const source = context.createBufferSource()
      source.buffer = soundBuffers[key]
      source.connect(masterGain)
      source.start(0)
      return true
    } catch (e) {
      console.warn(`Failed to play buffer ${key}`, e)
      return false
    }
  }

  const playTone = (type, freq, duration, startTime = 0) => {
    if (!context) return
    try {
      const osc = context.createOscillator()
      const gain = context.createGain()
      osc.type = type

      const now = context.currentTime + startTime
      if (Array.isArray(freq)) {
         // Arpeggio or slide
         freq.forEach((f, i) => {
            osc.frequency.setValueAtTime(f, now + (i * (duration / freq.length)))
         })
      } else {
         osc.frequency.setValueAtTime(freq, now)
      }

      gain.gain.setValueAtTime(0.1, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

      osc.connect(gain)
      gain.connect(masterGain)
      osc.start(now)
      osc.stop(now + duration)
    } catch (e) {
      console.warn('Audio play failed', e)
    }
  }

  // Synthesize fallback sounds
  const playFallback = (type) => {
    init()
    const def = defaultTones[type]
    if (!def) return

    if (type === 'check') {
        playTone('sine', 600, 0.15, 0)
        playTone('sine', 800, 0.15, 0.1)
    } else if (type === 'checkmate') {
        playTone('square', 400, 0.15, 0)
        playTone('square', 600, 0.15, 0.15)
        playTone('square', 800, 0.3, 0.3)
    } else if (type === 'stalemate') {
        playTone('sine', 300, 0.2, 0)
        playTone('sine', 200, 0.4, 0.2)
    } else {
        playTone(def.type, def.freq, def.duration)
    }
  }

  const processZip = async (file) => {
    if (!window.JSZip) {
      console.error('JSZip not loaded')
      return
    }
    try {
      const zip = await JSZip.loadAsync(file)
      // Look for standard names: move.mp3, capture.wav, etc.
      const mappings = [
        { key: 'move', names: ['move.mp3', 'move.wav', 'move.ogg'] },
        { key: 'capture', names: ['capture.mp3', 'capture.wav', 'capture.ogg'] },
        { key: 'check', names: ['check.mp3', 'check.wav', 'check.ogg'] },
        { key: 'checkmate', names: ['checkmate.mp3', 'checkmate.wav', 'checkmate.ogg'] },
        { key: 'stalemate', names: ['stalemate.mp3', 'stalemate.wav', 'stalemate.ogg'] },
        { key: 'gameStart', names: ['start.mp3', 'start.wav', 'start.ogg'] },
        { key: 'gameOver', names: ['end.mp3', 'end.wav', 'end.ogg'] }
      ]

      let count = 0
      for (const map of mappings) {
        for (const name of map.names) {
          const f = zip.file(name)
          if (f) {
            const ab = await f.async('arraybuffer')
            await loadSound(map.key, ab)
            count++
            break // Found one for this key
          }
        }
      }
      return count
    } catch (e) {
      console.error('Error reading sound pack zip', e)
      throw e
    }
  }

  return {
    setEnabled: (val) => {
        enabled = val
        if (val) init()
    },
    setVolume: (val) => {
        volume = Math.max(0, Math.min(1, parseFloat(val)))
        if (masterGain) masterGain.gain.value = volume
    },
    init,
    loadSoundPack: processZip,
    playTick: () => {
      if (!enabled) return
      init()
      playTone('square', 800, 0.05)
    },
    playSound: (moveResult, game) => {
      if (!enabled) return
      init()

      let type = 'move'

      // Determine priority
      if (game.in_checkmate()) type = 'checkmate'
      else if (game.in_draw()) type = 'stalemate'
      else if (game.in_check()) type = 'check'
      else if (moveResult && (moveResult.flags.includes('c') || moveResult.flags.includes('e'))) type = 'capture'

      // Try buffer first, then fallback
      if (!playBuffer(type)) {
        playFallback(type)
      }
    }
  }
})()
