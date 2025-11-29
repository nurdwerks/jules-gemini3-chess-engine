/* eslint-env browser */

const Chess960 = {
  generateFen: function () {
    const pieces = new Array(8).fill(null)
    const lightSquares = [1, 3, 5, 7]
    const darkSquares = [0, 2, 4, 6]

    const bishop1Pos = darkSquares[Math.floor(Math.random() * 4)]
    const bishop2Pos = lightSquares[Math.floor(Math.random() * 4)]

    pieces[bishop1Pos] = 'b'
    pieces[bishop2Pos] = 'b'

    const emptyIndices = () => pieces.map((p, i) => p === null ? i : null).filter(i => i !== null)
    let empty = emptyIndices()
    const queenPos = empty[Math.floor(Math.random() * empty.length)]
    pieces[queenPos] = 'q'

    empty = emptyIndices()
    const knight1Pos = empty[Math.floor(Math.random() * empty.length)]
    pieces[knight1Pos] = 'n'

    empty = emptyIndices()
    const knight2Pos = empty[Math.floor(Math.random() * empty.length)]
    pieces[knight2Pos] = 'n'

    empty = emptyIndices()
    pieces[empty[0]] = 'r'
    pieces[empty[1]] = 'k'
    pieces[empty[2]] = 'r'

    const whitePieces = pieces.map(p => p.toUpperCase()).join('')
    const blackPieces = pieces.join('')
    const castling = '-'

    return `${blackPieces}/pppppppp/8/8/8/8/PPPPPPPP/${whitePieces} w ${castling} - 0 1`
  }
}

// Attach to window for global access (simplest integration)
window.Chess960 = Chess960
