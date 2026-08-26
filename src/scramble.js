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
  },
  {
    id: 'minx',
    name: 'Megaminx',
    event: 'minx',
    // A megaminx scramble is not a free string of turns: it is seven lines of
    // alternating R and D by a fifth twice over, each closed by a U. The
    // stand-in keeps to that shape so it still reads as a megaminx scramble.
    length: 7,
    megaminx: true,
    faces: [],
    suffixes: [],
    opposite: {}
  }
];

export function puzzleById(id) {
  return PUZZLES.find((puzzle) => puzzle.id === id) || PUZZLES[0];
}

/**
 * A stream of numbers between 0 and 1 that is the same everywhere for the same
 * seed. Needed for the scramble of the day: everyone has to get the same one,
 * and there is no server to hand it out.
 *
 * mulberry32, which is small, fast and good enough for choosing moves.
 */
export function seeded(text) {
  let hash = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  let state = hash >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pickFrom = (list, random) => list[(random() * list.length) | 0];
const pick = (list) => pickFrom(list, Math.random);

/**
 * Stand-in scramble, used until the real scrambler has warmed up -- and, with a
 * seed, the scramble of the day.
 *
 * A seeded one is random-move rather than random-state, which is a real
 * difference: some positions come up more often than others. The official
 * scrambler works by solving a random position, and its answer cannot be made
 * to come out the same on two devices, so for a thing everyone has to share on
 * the same day this is the honest trade.
 */
export function randomMoveScramble(puzzleId = '333', random = Math.random) {
  const puzzle = puzzleById(puzzleId);
  if (puzzle.megaminx) return randomMinxScramble(puzzle.length, random);

  const moves = [];
  let previous = null;
  let beforePrevious = null;

  while (moves.length < puzzle.length) {
    const face = pickFrom(puzzle.faces, random);
    if (face === previous) continue;
    if (face === beforePrevious && previous === puzzle.opposite[face]) continue;
    moves.push(face + pickFrom(puzzle.suffixes, random));
    beforePrevious = previous;
    previous = face;
  }

  if (puzzle.tips) {
    for (const tip of puzzle.tips) {
      const turn = random();
      if (turn < 0.33) moves.push(tip);
      else if (turn < 0.66) moves.push(`${tip}'`);
    }
  }

  return moves.join(' ');
}

/** Seven lines of R and D by a fifth, each closed off with a U. */
function randomMinxScramble(lines, random = Math.random) {
  const rows = [];
  for (let line = 0; line < lines; line++) {
    const moves = [];
    for (let pair = 0; pair < 5; pair++) {
      moves.push(`R${random() < 0.5 ? '++' : '--'}`);
      moves.push(`D${random() < 0.5 ? '++' : '--'}`);
    }
    moves.push(random() < 0.5 ? 'U' : "U'");
    rows.push(moves.join(' '));
  }
  return rows.join('\n');
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
