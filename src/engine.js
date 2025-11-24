#!/usr/bin/env node

const readline = require('readline');
const UCI = require('./UCI');

const uci = new UCI(console.log);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  uci.processCommand(line);
});
