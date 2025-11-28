#!/usr/bin/env node

const fs = require('fs')
const { parse } = require('pgn-parser')
const Board = require('../src/Board')
const Polyglot = require('../src/Polyglot')

function pgnToBin (pgnPath, binPath) {
  const pgn = fs.readFileSync(pgnPath, 'utf-8')
  const games = parse(pgn)
  const polyglot = new Polyglot()
  const book = new Map()

  for (const game of games) {
    const board = new Board()
    board.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    for (const move of game.moves) {
      const key = polyglot.computeKey(board)
      const boardMove = board.applyAlgebraicMove(move.move)

      if (!boardMove) {
        console.error(`Invalid move: ${move.move} in game`)
        break
      }

      const polyglotMove = {
        from: boardMove.from,
        to: boardMove.to,
        promotion: boardMove.promotion
      }

      const moveInt = polyglot.moveToInt(polyglotMove)

      if (!book.has(key)) {
        book.set(key, [])
      }
      const entries = book.get(key)
      const existingEntry = entries.find(e => e.move === moveInt)
      if (existingEntry) {
        existingEntry.weight++
      } else {
        entries.push({ move: moveInt, weight: 1, learn: 0 })
      }
    }
  }

  const sortedKeys = Array.from(book.keys()).sort((a, b) => {
    if (a < b) return -1
    if (a > b) return 1
    return 0
  })

  const buffer = Buffer.alloc(sortedKeys.length * 16 * 10) // oversized buffer
  let offset = 0

  for (const key of sortedKeys) {
    const entries = book.get(key)
    for (const entry of entries) {
      buffer.writeBigUInt64BE(key, offset)
      offset += 8
      buffer.writeUInt16BE(entry.move, offset)
      offset += 2
      buffer.writeUInt16BE(entry.weight, offset)
      offset += 2
      buffer.writeUInt32BE(entry.learn, offset)
      offset += 4
    }
  }

  fs.writeFileSync(binPath, buffer.slice(0, offset))
}

const pgnPath = process.argv[2]
const binPath = process.argv[3]

if (!pgnPath || !binPath) {
  console.log('Usage: ./book_manager.js <pgn-file> <bin-file>')
  process.exit(1)
}

pgnToBin(pgnPath, binPath)
