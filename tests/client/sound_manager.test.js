/**
 * @jest-environment jsdom
 */

describe('SoundManager', () => {
  let SoundManager
  let audioContextMock
  let oscillatorMock
  let gainMock

  beforeAll(() => {
    oscillatorMock = {
      type: '',
      frequency: { setValueAtTime: jest.fn() },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    }
    gainMock = {
      gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
      connect: jest.fn()
    }
    audioContextMock = {
      createOscillator: jest.fn().mockReturnValue(oscillatorMock),
      createGain: jest.fn().mockReturnValue(gainMock),
      currentTime: 0,
      state: 'running',
      resume: jest.fn().mockResolvedValue(),
      destination: {}
    }

    window.AudioContext = jest.fn(() => audioContextMock)
    window.webkitAudioContext = window.AudioContext

    require('../../public/js/SoundManager.js')
    SoundManager = window.SoundManager
  })

  beforeEach(() => {
    jest.clearAllMocks()
    SoundManager.setEnabled(true)
  })

  test('init creates AudioContext', () => {
    SoundManager.init()
    expect(window.AudioContext).toHaveBeenCalled()
  })

  test('playTick creates oscillator and plays', () => {
    SoundManager.playTick()
    expect(audioContextMock.createOscillator).toHaveBeenCalled()
    expect(oscillatorMock.start).toHaveBeenCalled()
    expect(oscillatorMock.stop).toHaveBeenCalled()
  })

  test('playSound plays move sound', () => {
    const move = { flags: 'n' }
    const game = { in_check: () => false, in_checkmate: () => false, in_draw: () => false }
    SoundManager.playSound(move, game)
    expect(audioContextMock.createOscillator).toHaveBeenCalled()
    expect(oscillatorMock.type).toBe('triangle')
  })

  test('playSound plays capture sound', () => {
    const move = { flags: 'c' }
    const game = { in_check: () => false, in_checkmate: () => false, in_draw: () => false }
    SoundManager.playSound(move, game)
    expect(audioContextMock.createOscillator).toHaveBeenCalled()
    expect(oscillatorMock.type).toBe('square')
  })

  test('playSound plays check sound', () => {
    const move = { flags: 'n' }
    const game = { in_check: () => true, in_checkmate: () => false, in_draw: () => false }
    SoundManager.playSound(move, game)
    // Check plays 2 tones
    expect(audioContextMock.createOscillator).toHaveBeenCalledTimes(2)
  })

  test('disabled sound does not play', () => {
    SoundManager.setEnabled(false)
    SoundManager.playTick()
    expect(audioContextMock.createOscillator).not.toHaveBeenCalled()
  })

  test('resumes context if suspended', () => {
    audioContextMock.state = 'suspended'
    SoundManager.init()
    expect(audioContextMock.resume).toHaveBeenCalled()
  })
})
