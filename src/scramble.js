// 3x3 scramble generation.

const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];
const SUFFIX = ['', "'", '2'];

// Opposite face pairs; used to avoid redundant sequences like R L R.
const OPPOSITE = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };

/**
 * Random-move scramble: 20 moves, no move on the same face twice in a row and
 * no A B A pattern when A and B are on opposite faces (those are reducible).
 */
export function randomScramble(length = 20) {
  const moves = [];
  let prev = null;
  let beforePrev = null;

  while (moves.length < length) {
    const face = FACES[(Math.random() * FACES.length) | 0];
    if (face === prev) continue;
    if (face === beforePrev && prev === OPPOSITE[face]) continue;
    moves.push(face + SUFFIX[(Math.random() * SUFFIX.length) | 0]);
    beforePrev = prev;
    prev = face;
  }
  return moves.join(' ');
}
