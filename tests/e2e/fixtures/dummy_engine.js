self.onmessage = function (e) {
  const cmd = e.data
  if (cmd === 'uci') {
    self.postMessage('id name DummyEngine')
    self.postMessage('id author Me')
    self.postMessage('uciok')
  } else if (cmd === 'isready') {
    self.postMessage('readyok')
  } else if (cmd.startsWith('position')) {
    // do nothing
  } else if (cmd.startsWith('go')) {
    self.postMessage('info depth 1 score cp 10 nodes 100 nps 1000 pv e2e4')
    setTimeout(() => {
      self.postMessage('bestmove e2e4')
    }, 100)
  } else if (cmd === 'stop') {
    // do nothing
  }
}
