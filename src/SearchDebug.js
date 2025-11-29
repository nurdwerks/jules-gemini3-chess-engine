const fs = require('fs')
const SearchUtils = require('./SearchUtils')

class SearchDebug {
  static writeDebugTree (search) {
    if (search.debugMode) {
      try {
        fs.writeFileSync(search.debugFile, JSON.stringify(search.debugTree, null, 2))
      } catch (e) {
        console.error('Failed to write debug tree:', e)
      }
    }
  }

  static verifyPV (search, depth) {
    if (search.debugMode) {
      const pv = SearchUtils.getPVLine(search.board, search.tt, depth, null)
      SearchUtils.checkPV(search.board, pv)
    }
  }

  static initDebug (search) {
    if (search.debugMode) {
      search.debugTree.nodes = []
      // search.debugTree.iteration is set in loop
    }
  }

  static startMoveDebug (search, move, depth, alpha, beta) {
    let debugNode = null
    const prevDebugNode = search.currentDebugNode
    if (search.debugMode && depth > 0) {
      debugNode = { move: SearchUtils.moveToString(search.board, move), score: null, children: [], alpha, beta, depth }
      search.currentDebugNode.children.push(debugNode)
      search.currentDebugNode = debugNode
    }
    return { debugNode, prevDebugNode }
  }

  static endMoveDebug (search, debugNode, prevDebugNode, score) {
    if (search.debugMode && debugNode) {
      debugNode.score = score
      search.currentDebugNode = prevDebugNode
    }
  }

  static startRootMoveDebug (search, move, alpha, beta, depth) {
    let debugNode = null
    const prevDebugNode = search.currentDebugNode
    if (search.debugMode) {
      debugNode = { move: SearchUtils.moveToString(search.board, move), score: null, children: [], alpha, beta, depth }
      search.debugTree.nodes.push(debugNode)
      search.currentDebugNode = debugNode
    }
    return { debugNode, prevDebugNode }
  }
}

module.exports = SearchDebug
