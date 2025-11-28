const fs = require('fs')
const https = require('https')
const Bitboard = require('./Bitboard')
const Piece = require('./Piece')

const HALF_KP_INPUT_DIMS = 22528
const TRANSFORMER_OUTPUT_DIMS = 256

const L1_SIZE = TRANSFORMER_OUTPUT_DIMS * 2
const L2_SIZE = 32
const L3_SIZE = 32

const PIECE_TO_ID = { pawn: 0, knight: 1, bishop: 2, rook: 3, queen: 4 }

class Accumulator {
  constructor () {
    this.white = new Int16Array(TRANSFORMER_OUTPUT_DIMS)
    this.black = new Int16Array(TRANSFORMER_OUTPUT_DIMS)
  }

  clone () {
    const newAcc = new Accumulator()
    newAcc.white.set(this.white)
    newAcc.black.set(this.black)
    return newAcc
  }
}

function NNUE () {
  const self = {
    network: null
  }

  self.loadNetwork = async (url) => {
    if (fs.existsSync(url)) {
      try {
        const buffer = fs.readFileSync(url)
        self.parseNetwork(buffer)
        return Promise.resolve()
      } catch (e) {
        return Promise.reject(e)
      }
    }

    return new Promise((resolve, reject) => {
      const request = https.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          self.loadNetwork(res.headers.location).then(resolve).catch(reject)
          request.abort()
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download network file. Status code: ${res.statusCode}`))
          return
        }
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => {
          try {
            const buffer = Buffer.concat(chunks)
            self.parseNetwork(buffer)
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      })
      request.on('error', (err) => reject(err))
    })
  }

  self.parseNetwork = (buffer) => {
    let offset = 0
    const network = {}
    network.version = buffer.readUInt32LE(offset); offset += 4
    network.hash = buffer.readUInt32LE(offset); offset += 4
    const descriptionSize = buffer.readUInt32LE(offset); offset += 4
    network.description = buffer.toString('utf8', offset, offset + descriptionSize); offset += descriptionSize

    let res
    res = self.parseFeatureTransformer(buffer, offset)
    network.featureTransformer = res.layer
    offset = res.newOffset

    network.layers = []
    const layerSizes = [[L1_SIZE, L2_SIZE], [L2_SIZE, L3_SIZE], [L3_SIZE, 1]]
    for (const [inSize, outSize] of layerSizes) {
      res = self.parseDenseLayer(buffer, offset, inSize, outSize)
      network.layers.push(res.layer)
      offset = res.newOffset
    }
    self.network = network
  }

  self.parseFeatureTransformer = (buffer, offset) => {
    const hash = buffer.readUInt32LE(offset); offset += 4
    const { result: biases, newOffset: bOff } = self.readLeb128(buffer, offset, TRANSFORMER_OUTPUT_DIMS, 'int16')
    offset = bOff
    const { result: weights, newOffset: wOff } = self.readLeb128(buffer, offset, TRANSFORMER_OUTPUT_DIMS * HALF_KP_INPUT_DIMS, 'int16')
    offset = wOff
    return { layer: { hash, biases, weights }, newOffset: offset }
  }

  self.parseDenseLayer = (buffer, offset, inputSize, outputSize) => {
    const hash = buffer.readUInt32LE(offset); offset += 4
    const { result: biases, newOffset: bOff } = self.readLeb128(buffer, offset, outputSize, 'int32')
    offset = bOff
    const { result: weights, newOffset: wOff } = self.readLeb128(buffer, offset, inputSize * outputSize, 'int16')
    offset = wOff
    return { layer: { hash, biases, weights, inputSize, outputSize }, newOffset: offset }
  }

  self.readLeb128 = (buffer, offset, count, type) => {
    const ArrayType = type === 'int16' ? Int16Array : Int32Array
    const result = new ArrayType(count)
    const bitLength = type === 'int16' ? 16 : 32
    for (let i = 0; i < count; i++) {
      const { value, newOffset } = self.readLeb128Value(buffer, offset, bitLength)
      result[i] = value
      offset = newOffset
    }
    return { result, newOffset: offset }
  }

  self.readLeb128Value = (buffer, offset, bitLength) => {
    let val = 0; let shift = 0; let byte
    do {
      if (offset >= buffer.length) throw new RangeError('Reading beyond buffer in LEB128')
      byte = buffer.readUInt8(offset++)
      val |= (byte & 0x7f) << shift
      shift += 7
    } while (byte >= 128)
    if ((shift < bitLength) && (byte & 0x40)) val |= (~0 << shift)
    return { value: val, newOffset: offset }
  }

  self.getHalfKPIndex = (kingSq, pieceSq, piece, perspectiveColor) => {
    if (!piece) return -1
    const colorId = (piece.color === perspectiveColor) ? 0 : 1
    const pIdx = PIECE_TO_ID[piece.type] * 2 + colorId
    return pieceSq + (pIdx + kingSq * 10) * 64
  }

  self.getHalfKPIndices = (board, perspectiveColor) => {
    const indices = []
    const kingBb = board.bitboards.king & board.bitboards[perspectiveColor]
    if (!kingBb) return []
    let kingSq = Bitboard.lsb(kingBb)
    if (perspectiveColor === 'black') kingSq ^= 56
    for (const type of ['pawn', 'knight', 'bishop', 'rook', 'queen']) {
      for (const color of ['white', 'black']) {
        let pieceBb = board.bitboards[type] & board.bitboards[color]
        while (pieceBb) {
          let pieceSq = Bitboard.lsb(pieceBb)
          if (perspectiveColor === 'black') pieceSq ^= 56
          indices.push(self.getHalfKPIndex(kingSq, pieceSq, { type, color }, perspectiveColor))
          pieceBb &= pieceBb - 1n
        }
      }
    }
    return indices
  }

  self.getChangedIndices = (board, move, captured) => {
    const changes = {
      white: { added: [], removed: [] },
      black: { added: [], removed: [] }
    }
    const movingPiece = move.piece

    if (movingPiece.type === 'king') {
      changes.white.refresh = true
      changes.black.refresh = true
      return changes
    }

    for (const color of ['white', 'black']) {
      self._processColorChanges(changes, board, color, move, captured, movingPiece)
    }
    return changes
  }

  self._processColorChanges = (changes, board, color, move, captured, movingPiece) => {
    const kingBb = board.bitboards.king & board.bitboards[color]
    if (!kingBb) return
    let kingSq = Bitboard.lsb(kingBb)
    if (color === 'black') kingSq ^= 56

    const add = (sq, piece) => {
      const pSq = (color === 'black') ? sq ^ 56 : sq
      changes[color].added.push(self.getHalfKPIndex(kingSq, pSq, piece, color))
    }
    const remove = (sq, piece) => {
      const pSq = (color === 'black') ? sq ^ 56 : sq
      changes[color].removed.push(self.getHalfKPIndex(kingSq, pSq, piece, color))
    }

    const fromSq64 = Bitboard.to64(move.from)
    const toSq64 = Bitboard.to64(move.to)

    remove(fromSq64, movingPiece)
    const arrivalPiece = move.promotion
      ? new Piece(movingPiece.color, { q: 'queen', r: 'rook', b: 'bishop', n: 'knight' }[move.promotion])
      : movingPiece
    add(toSq64, arrivalPiece)

    if (captured) {
      remove(toSq64, captured)
    } else if (move.flags === 'e' || move.flags === 'ep') {
      const capturedPawnSq = Bitboard.to64(movingPiece.color === 'white' ? move.to + 16 : move.to - 16)
      const capturedPawn = new Piece(movingPiece.color === 'white' ? 'black' : 'white', 'pawn')
      remove(capturedPawnSq, capturedPawn)
    }
  }

  self.updateAccumulator = (acc, changes) => {
    for (const color of ['white', 'black']) {
      for (const index of changes[color].removed) {
        if (index === -1) continue
        const offset = index * TRANSFORMER_OUTPUT_DIMS
        for (let i = 0; i < TRANSFORMER_OUTPUT_DIMS; i++) {
          acc[color][i] -= self.network.featureTransformer.weights[offset + i]
        }
      }
      for (const index of changes[color].added) {
        if (index === -1) continue
        const offset = index * TRANSFORMER_OUTPUT_DIMS
        for (let i = 0; i < TRANSFORMER_OUTPUT_DIMS; i++) {
          acc[color][i] += self.network.featureTransformer.weights[offset + i]
        }
      }
    }
  }

  self.undoUpdateAccumulator = (acc, changes) => {
    for (const color of ['white', 'black']) {
      for (const index of changes[color].added) {
        if (index === -1) continue
        const offset = index * TRANSFORMER_OUTPUT_DIMS
        for (let i = 0; i < TRANSFORMER_OUTPUT_DIMS; i++) {
          acc[color][i] -= self.network.featureTransformer.weights[offset + i]
        }
      }
      for (const index of changes[color].removed) {
        if (index === -1) continue
        const offset = index * TRANSFORMER_OUTPUT_DIMS
        for (let i = 0; i < TRANSFORMER_OUTPUT_DIMS; i++) {
          acc[color][i] += self.network.featureTransformer.weights[offset + i]
        }
      }
    }
  }

  self.refreshAccumulator = (acc, board) => {
    if (!self.network) return
    acc.white.set(self.network.featureTransformer.biases)
    acc.black.set(self.network.featureTransformer.biases)
    const whiteIndices = self.getHalfKPIndices(board, 'white')
    for (const index of whiteIndices) {
      if (index === -1) continue
      const offset = index * TRANSFORMER_OUTPUT_DIMS
      for (let i = 0; i < TRANSFORMER_OUTPUT_DIMS; i++) {
        acc.white[i] += self.network.featureTransformer.weights[offset + i]
      }
    }
    const blackIndices = self.getHalfKPIndices(board, 'black')
    for (const index of blackIndices) {
      if (index === -1) continue
      const offset = index * TRANSFORMER_OUTPUT_DIMS
      for (let i = 0; i < TRANSFORMER_OUTPUT_DIMS; i++) {
        acc.black[i] += self.network.featureTransformer.weights[offset + i]
      }
    }
  }

  self.clippedRelu = (input) => {
    const output = new Int16Array(input.length)
    for (let i = 0; i < input.length; i++) {
      output[i] = Math.max(0, Math.min(input[i], 127))
    }
    return output
  }

  self.propagate = (input, layer) => {
    const output = new Int32Array(layer.outputSize).fill(0)
    for (let i = 0; i < layer.outputSize; i++) {
      output[i] = layer.biases[i]
      for (let j = 0; j < layer.inputSize; j++) {
        output[i] += input[j] * layer.weights[j * layer.outputSize + i]
      }
    }
    return output
  }

  self.evaluate = (board, accumulator) => {
    if (!self.network) throw new Error('NNUE network not loaded.')
    if (!accumulator) {
      accumulator = new Accumulator()
      self.refreshAccumulator(accumulator, board)
    }
    const stm = board.activeColor === 'w' ? 'white' : 'black'
    const perspective = stm === 'white' ? [accumulator.white, accumulator.black] : [accumulator.black, accumulator.white]
    let layerInput = new Int16Array(L1_SIZE)
    layerInput.set(self.clippedRelu(perspective[0]), 0)
    layerInput.set(self.clippedRelu(perspective[1]), TRANSFORMER_OUTPUT_DIMS)
    for (let i = 0; i < self.network.layers.length - 1; i++) {
      const output = self.propagate(layerInput, self.network.layers[i])
      layerInput = self.clippedRelu(output)
    }
    const finalOutput = self.propagate(layerInput, self.network.layers[self.network.layers.length - 1])
    return finalOutput[0] / 400
  }

  self.getParams = () => {
    if (!self.network) return {}
    // Tune the output layer (last layer)
    const layer = self.network.layers[self.network.layers.length - 1]
    const params = {}
    for (let i = 0; i < layer.inputSize; i++) {
      params[`OutputLayer_Weight_${i}`] = layer.weights[i]
    }
    for (let i = 0; i < layer.outputSize; i++) {
      params[`OutputLayer_Bias_${i}`] = layer.biases[i]
    }
    return params
  }

  self.updateParam = (key, value) => {
    if (!self.network) return
    const layer = self.network.layers[self.network.layers.length - 1]
    if (key.startsWith('OutputLayer_Weight_')) {
      const idx = parseInt(key.split('_')[2], 10)
      if (!isNaN(idx) && idx < layer.weights.length) {
        layer.weights[idx] = value
      }
    } else if (key.startsWith('OutputLayer_Bias_')) {
      const idx = parseInt(key.split('_')[2], 10)
      if (!isNaN(idx) && idx < layer.biases.length) {
        layer.biases[idx] = value
      }
    }
  }

  return self
}

module.exports = { NNUE, Accumulator }
