#!/usr/bin/env node

const readline = require('readline')
const UCI = require('./engine/UCI')

const uci = new UCI((msg) => {
  process.stdout.write(msg + '\n')
})

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
})

rl.on('line', (line) => {
  uci.processCommand(line)
})
