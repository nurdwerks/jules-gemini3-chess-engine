const Syzygy = require('../../src/engine/Syzygy')
const fs = require('fs')
const path = require('path')

describe('Endgame Tablebases (Syzygy)', () => {
  const mockFile = path.join(__dirname, 'mock.rtbw')

  beforeAll(() => {
    // Create a mock TB file with header
    const fd = fs.openSync(mockFile, 'w')
    const buffer = Buffer.alloc(16)
    buffer.writeUInt32LE(0x71525554, 0) // Magic
    fs.writeSync(fd, buffer, 0, 16, 0)
    fs.closeSync(fd)
  })

  afterAll(() => {
    if (fs.existsSync(mockFile)) fs.unlinkSync(mockFile)
  })

  test('Syzygy Header Parser reads magic', async () => {
    const syzygy = new Syzygy()
    const success = await syzygy.loadTable(mockFile)
    expect(success).toBe(true)
    expect(syzygy.tables[mockFile].magic).toBe(0x71525554)
  })

  test('Syzygy loadTable returns false on non-existent file', async () => {
    const syzygy = new Syzygy()
    const success = await syzygy.loadTable('non-existent-file.rtbw')
    expect(success).toBe(false)
  })

  test('Syzygy Index Calculation (Binomial)', () => {
    // 4 choose 2 = 6
    expect(Syzygy.binomial(4, 2)).toBe(6)
    // 10 choose 3 = 120
    expect(Syzygy.binomial(10, 3)).toBe(120)
  })
})
