// Scramble generation.
//
// Official scrambles are random-state: a random solved-cube position is picked
// and a solver works out the moves to reach it. That is what cubing.js does
// (the library behind the WCA scramblers), vendored under vendor/cubing.
// Its solvers need to warm up, so every puzzle also has a random-move
// generator to fall back on for the very first scramble or when the library
// cannot load at all.

import { randomScrambleForEvent } from '../vendor/cubing/scramble/index.js';

/**
 * Per puzzle: the WCA event id for the real scrambler, plus the shape of the
 * stand-in generator. A move may not repeat its own face twice in a row, and
 * A B A is skipped when A and B are opposite — both are reducible.
 */
export const PUZZLES = [
  {
    id: '333',
    name: '3x3',
    event: '333',
    length: 20,
    faces: ['U', 'R', 'F', 'D', 'L', 'B'],
    suffixes: ['', "'", '2'],
    opposite: { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' }
  },
  {
    id: '222',
    name: '2x2',
    event: '222',
    length: 11,
    faces: ['U', 'R', 'F'],
    suffixes: ['', "'", '2'],
    opposite: {}
  },
  {
    id: '444',
    name: '4x4',
    event: '444',
    length: 44,
    faces: ['U', 'R', 'F', 'D', 'L', 'B', 'Uw', 'Rw', 'Fw'],
    suffixes: ['', "'", '2'],
    opposite: { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' }
  },
  {
    id: 'pyra',
    name: 'Pyraminx',
    event: 'pyram',
    length: 10,
    faces: ['U', 'L', 'R', 'B'],
    suffixes: ['', "'"],
    opposite: {},
    tips: ['u', 'l', 'r', 'b']
  },
  {
    id: 'skewb',
    name: 'Skewb',
    event: 'skewb',
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

/** Stand-in scramble, used until the real scrambler has warmed up. */
export function randomMoveScramble(puzzleId = '333') {
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

  if (puzzle.tips) {
    for (const tip of puzzle.tips) {
      const turn = Math.random();
      if (turn < 0.33) moves.push(tip);
      else if (turn < 0.66) moves.push(`${tip}'`);
    }
  }

  return moves.join(' ');
}

/**
 * One official scramble.
 * @returns {Promise<{text: string, official: boolean}>}
 */
export async function officialScramble(puzzleId = '333') {
  try {
    const alg = await randomScrambleForEvent(puzzleById(puzzleId).event);
    const text = alg.toString().trim();
    if (text) return { text, official: true };
  } catch {
    // solver unavailable (old browser, blocked worker, offline first run)
  }
  return { text: randomMoveScramble(puzzleId), official: false };
}

// Scrambles are generated one ahead so the next one is ready the moment a
// solve ends, instead of making the user wait for the solver.
const queue = new Map();

function fill(puzzleId) {
  if (!queue.has(puzzleId)) queue.set(puzzleId, officialScramble(puzzleId));
  return queue.get(puzzleId);
}

/** The next scramble for this puzzle, refilling the queue behind it. */
export async function nextScramble(puzzleId = '333') {
  const pending = fill(puzzleId);
  queue.delete(puzzleId);
  fill(puzzleId); // start the following one right away
  return pending;
}

export function warmUp(puzzleId = '333') {
  fill(puzzleId);
}
