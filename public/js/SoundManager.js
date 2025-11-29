window.SoundManager = (() => {
  let context = null
  let enabled = true

  const init = () => {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      context = new AudioContext()
    }
    if (context.state === 'suspended') {
      context.resume().catch(e => console.warn(e))
    }
  }

  const playTone = (freq, type, duration, startTime = 0) => {
    if (!enabled || !context) return
    try {
      const osc = context.createOscillator()
      const gain = context.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, context.currentTime + startTime)
      gain.gain.setValueAtTime(0.1, context.currentTime + startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + startTime + duration)
      osc.connect(gain)
      gain.connect(context.destination)
      osc.start(context.currentTime + startTime)
      osc.stop(context.currentTime + startTime + duration)
    } catch (e) {
      console.warn('Audio play failed', e)
    }
  }

  return {
    setEnabled: (val) => { enabled = val; if (val) init() },
    init,
    playTick: () => {
      if (!enabled || !context) return
      init()
      try {
        const osc = context.createOscillator()
        const gain = context.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(800, context.currentTime)
        gain.gain.setValueAtTime(0.05, context.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.05)
        osc.connect(gain)
        gain.connect(context.destination)
        osc.start(context.currentTime)
        osc.stop(context.currentTime + 0.05)
      } catch (e) {
        console.warn('Audio play failed', e)
      }
    },
    playSound: (moveResult, game) => {
      if (!enabled) return
      init()

      // Priority: Check > Capture > Move
      if (game.in_check()) {
        // Check sound: Two tones
        playTone(600, 'sine', 0.15)
        playTone(800, 'sine', 0.15, 0.1)
      } else if (moveResult.flags.includes('c') || moveResult.flags.includes('e')) {
        // Capture sound: Sharp snap (high square wave)
        playTone(600, 'square', 0.1)
      } else {
        // Move sound: Soft tap (low triangle)
        playTone(200, 'triangle', 0.1)
      }
    }
  }
})()
