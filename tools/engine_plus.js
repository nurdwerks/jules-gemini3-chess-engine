#!/usr/bin/env node
const { spawn } = require('child_process')

const engine = spawn('/app/src/engine.js', [], { shell: true })

engine.stdout.pipe(process.stdout)
process.stdin.pipe(engine.stdin)

// Inject options
const commands = [
  'setoption name PawnValue value 102',
  'setoption name KnightValue value 318',
  'setoption name BishopValue value 328',
  'setoption name RookValue value 498',
  'setoption name QueenValue value 902',
  'setoption name DoubledPawnPenalty value 12',
  'setoption name IsolatedPawnPenalty value 13',
  'setoption name BackwardPawnPenalty value 12',
  'setoption name MobilityBonus value 0',
  'setoption name ShieldBonus value 7'
]

commands.forEach(cmd => engine.stdin.write(cmd + '\n'))
