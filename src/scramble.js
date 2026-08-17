// 3x3 scramble generation + facelet simulation for the preview.

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

// Facelet indices follow the U R F D L B layout: U = 0..8, R = 9..17, etc.
// Each entry lists the 4-cycles of a single clockwise quarter turn.
const CYCLES = {
  U: [[0, 2, 8, 6], [1, 5, 7, 3], [18, 36, 45, 9], [19, 37, 46, 10], [20, 38, 47, 11]],
  R: [[9, 11, 17, 15], [10, 14, 16, 12], [2, 51, 29, 20], [5, 48, 32, 23], [8, 45, 35, 26]],
  F: [[18, 20, 26, 24], [19, 23, 25, 21], [6, 9, 29, 38], [7, 12, 28, 41], [8, 15, 27, 44]],
  D: [[27, 29, 35, 33], [28, 32, 34, 30], [24, 15, 51, 42], [25, 16, 52, 43], [26, 17, 53, 44]],
  L: [[36, 38, 44, 42], [37, 41, 43, 39], [0, 18, 27, 53], [3, 21, 30, 50], [6, 24, 33, 47]],
  B: [[45, 47, 53, 51], [46, 50, 52, 48], [0, 42, 35, 11], [1, 39, 34, 14], [2, 36, 33, 17]]
};

function turn(state, face) {
  const next = state.slice();
  for (const [a, b, c, d] of CYCLES[face]) {
    next[b] = state[a];
    next[c] = state[b];
    next[d] = state[c];
    next[a] = state[d];
  }
  return next;
}

/** Facelet colors (as face letters) after applying a scramble to a solved cube. */
export function applyScramble(scramble) {
  let state = [];
  for (const face of FACES) {
    for (let i = 0; i < 9; i++) state.push(face);
  }
  for (const move of scramble.trim().split(/\s+/).filter(Boolean)) {
    const face = move[0];
    if (!CYCLES[face]) continue;
    const times = move.endsWith('2') ? 2 : move.endsWith("'") ? 3 : 1;
    for (let i = 0; i < times; i++) state = turn(state, face);
  }
  return state;
}

// Position of every face in the unfolded net, in 3x3 cells.
const NET = { U: [3, 0], L: [0, 3], F: [3, 3], R: [6, 3], B: [9, 3], D: [3, 6] };

/** Flat 2D net of the scrambled cube as an SVG string. */
export function scrambleSvg(scramble) {
  const state = applyScramble(scramble);
  const cell = 10;
  const gap = 1.2;
  let rects = '';

  FACES.forEach((face, f) => {
    const [ox, oy] = NET[face];
    for (let i = 0; i < 9; i++) {
      const x = (ox + (i % 3)) * cell + gap / 2;
      const y = (oy + Math.floor(i / 3)) * cell + gap / 2;
      const size = cell - gap;
      rects += `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="1.4" `
        + `class="f-${state[f * 9 + i]}"/>`;
    }
  });

  return `<svg viewBox="0 0 120 90" role="img" aria-label="scramble preview">${rects}</svg>`;
}
