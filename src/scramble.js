// Scramble generation per puzzle.

/**
 * Every puzzle: which move groups exist, how many moves, and which suffixes.
 * A move may not repeat its own axis twice in a row, and A B A is skipped when
 * A and B are on opposite faces — both are reducible sequences.
 */
export const PUZZLES = [
  {
    id: '333',
    name: '3x3',
    length: 20,
    faces: ['U', 'R', 'F', 'D', 'L', 'B'],
    suffixes: ['', "'", '2'],
    opposite: { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' }
  },
  {
    id: '222',
    name: '2x2',
    length: 11,
    faces: ['U', 'R', 'F'],
    suffixes: ['', "'", '2'],
    opposite: {}
  },
  {
    id: '444',
    name: '4x4',
    length: 44,
    faces: ['U', 'R', 'F', 'D', 'L', 'B', 'Uw', 'Rw', 'Fw'],
    suffixes: ['', "'", '2'],
    opposite: { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' }
  },
  {
    id: 'pyra',
    name: 'Pyraminx',
    length: 10,
    faces: ['U', 'L', 'R', 'B'],
    suffixes: ['', "'"],
    opposite: {},
    tips: ['u', 'l', 'r', 'b']
  },
  {
    id: 'skewb',
    name: 'Skewb',
    length: 11,
    faces: ['U', 'L', 'R', 'B'],
    suffixes: ['', "'"],
    opposite: {}
  }
];

export function puzzleById(id) {
  return PUZZLES.find((puzzle) => puzzle.id === id) || PUZZLES[0];
}

const pick = (list) => list[(Math.random() * list.length) | 0];

/** Random-move scramble for the given puzzle. */
export function randomScramble(puzzleId = '333') {
  const puzzle = puzzleById(puzzleId);
  const moves = [];
  let previous = null;
  let beforePrevious = null;

  while (moves.length < puzzle.length) {
    const face = pick(puzzle.faces);
    if (face === previous) continue;
    if (face === beforePrevious && previous === puzzle.opposite[face]) continue;
    moves.push(face + pick(puzzle.suffixes));
    beforePrevious = previous;
    previous = face;
  }

  // Pyraminx finishes with its tips, each turned at most once.
  if (puzzle.tips) {
    for (const tip of puzzle.tips) {
      const turn = Math.random();
      if (turn < 0.33) moves.push(tip);
      else if (turn < 0.66) moves.push(`${tip}'`);
    }
  }

  return moves.join(' ');
}
