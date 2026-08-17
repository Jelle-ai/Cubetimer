// Facelet simulation for the little preview next to the scramble.
//
// Only cubes are drawn: 3x3 directly, and 2x2 by simulating the same turns on a
// 3x3 and reading off the corner stickers — a 2x2 is a 3x3 without edges and
// centres. Other puzzles have no preview.

const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];

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

/** Facelet colours (as face letters) after applying a scramble to a solved cube. */
export function applyScramble(scramble) {
  let state = FACES.flatMap((face) => Array(9).fill(face));

  for (const move of scramble.trim().split(/\s+/).filter(Boolean)) {
    const face = move[0];
    if (!CYCLES[face] || move.includes('w')) continue; // wide turns are not simulated
    const times = move.endsWith('2') ? 2 : move.endsWith("'") ? 3 : 1;
    for (let i = 0; i < times; i++) state = turn(state, face);
  }
  return state;
}

// Where every face sits in the unfolded net, in cells.
const NET = { U: [3, 0], L: [0, 3], F: [3, 3], R: [6, 3], B: [9, 3], D: [3, 6] };

/** Which cells of a 3x3 face a 2x2 keeps: its four corners. */
const CORNERS = [0, 2, 6, 8];

export function hasPreview(puzzleId) {
  return puzzleId === '333' || puzzleId === '222';
}

/**
 * Small flat net of the scrambled cube.
 * @returns {string} svg markup, or '' when this puzzle has no preview
 */
export function previewSvg(scramble, puzzleId = '333') {
  if (!hasPreview(puzzleId) || !scramble) return '';

  const state = applyScramble(scramble);
  const size = puzzleId === '222' ? 2 : 3;
  const cells = size === 2 ? CORNERS : [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const cell = 10;
  const gap = 1.4;
  let rects = '';

  FACES.forEach((face, faceIndex) => {
    const [ox, oy] = NET[face];
    cells.forEach((cellIndex, position) => {
      const x = (ox / 3 * size + (position % size)) * cell + gap / 2;
      const y = (oy / 3 * size + Math.floor(position / size)) * cell + gap / 2;
      rects += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cell - gap}" height="${cell - gap}"`
        + ` rx="1.6" class="f-${state[faceIndex * 9 + cellIndex]}"/>`;
    });
  });

  const width = size * 4 * cell;
  const height = size * 3 * cell;
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="scramble">${rects}</svg>`;
}
