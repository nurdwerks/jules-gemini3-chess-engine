/**
 * @jest-environment jsdom
 */
const fs = require('fs')
const path = require('path')

describe('Frontend Coverage', () => {
  const publicJsDir = path.resolve(__dirname, '../../public/js')
  const files = fs.readdirSync(publicJsDir).filter(f => f.endsWith('.js'))

  files.forEach(file => {
    test(`loads ${file}`, () => {
      expect(() => {
        require(path.join(publicJsDir, file))
      }).not.toThrow()
    })
  })

  test('loads client.js', () => {
    expect(() => {
      require('../../public/client.js')
    }).not.toThrow()
  })

  test('loads tournament.js', () => {
    expect(() => {
      require('../../public/tournament.js')
    }).not.toThrow()
  })
})
