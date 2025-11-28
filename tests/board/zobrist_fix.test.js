const Zobrist = require('../../src/Zobrist')

describe('Zobrist Fix', () => {
  test('getEpIndex returns correct index for valid inputs', () => {
    expect(Zobrist.getEpIndex('a3')).toBe(0)
    expect(Zobrist.getEpIndex('h6')).toBe(7)
    expect(Zobrist.getEpIndex('c4')).toBe(2)
  })

  test('getEpIndex returns -1 for dash', () => {
    expect(Zobrist.getEpIndex('-')).toBe(-1)
  })

  test('getEpIndex returns -1 for invalid inputs', () => {
    expect(Zobrist.getEpIndex('A3')).toBe(-1) // Uppercase
    expect(Zobrist.getEpIndex('i3')).toBe(-1) // Out of bounds > h
    expect(Zobrist.getEpIndex(' ')).toBe(-1) // Space
    expect(Zobrist.getEpIndex('3')).toBe(-1) // Digit
  })
})
