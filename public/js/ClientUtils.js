window.ClientUtils = {
  coordsToAlgebraic: (row, col) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const rank = 8 - row
    return files[col] + rank
  }
}
