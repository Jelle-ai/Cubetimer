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
/**
 * Every WCA event, and a few of them share a cube.
 *
 * `event` is what the official scrambler is asked for. `cube` is the puzzle you
 * hold, which is not the same thing: one-handed, blindfolded and fewest-moves
 * are all a 3x3, so they get the 3x3's picture, the 3x3's case book and the
 * 3x3's cross tips. `group` is only for the menu. `score` says how a result is
 * read -- an average of five for the speed events, a mean of three for blind
 * and fewest moves, which is what the WCA does.
 *
 * The `faces`/`suffixes`/`length` shape is the stand-in generator, used for the
 * very first scramble and when the real scrambler cannot load at all.
 */
const SIX = ['U', 'R', 'F', 'D', 'L', 'B'];
const OPPOSITE = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };
const WIDE = ['Uw', 'Rw', 'Fw', 'Dw', 'Lw', 'Bw'];
const WIDER = ['3Uw', '3Rw', '3Fw', '3Dw', '3Lw', '3Bw'];

const cube = (id, name, event, length, faces, extra = {}) => ({
  id, name, event, cube: extra.cube || id, group: extra.group || 'cubes',
  score: extra.score || 'ao5',
  length, faces, suffixes: ['', "'", '2'], opposite: OPPOSITE, ...extra
});

export const PUZZLES = [
  cube('222', '2x2', '222', 11, ['U', 'R', 'F'], { opposite: {} }),
  cube('333', '3x3', '333', 20, SIX),
  cube('444', '4x4', '444', 44, SIX.concat(['Uw', 'Rw', 'Fw'])),
  cube('555', '5x5', '555', 60, SIX.concat(WIDE)),
  cube('666', '6x6', '666', 80, SIX.concat(WIDE, ['3Uw', '3Rw', '3Fw'])),
  cube('777', '7x7', '777', 100, SIX.concat(WIDE, WIDER)),

  cube('333bf', '3x3 blindfolded', '333bf', 20, SIX, { cube: '333', group: 'blind', score: 'mo3' }),
  cube('444bf', '4x4 blindfolded', '444bf', 44, SIX.concat(['Uw', 'Rw', 'Fw']), { cube: '444', group: 'blind', score: 'mo3' }),
  cube('555bf', '5x5 blindfolded', '555bf', 60, SIX.concat(WIDE), { cube: '555', group: 'blind', score: 'mo3' }),
  cube('333mbf', 'Multi-blind', '333mbf', 20, SIX, { cube: '333', group: 'blind', score: 'mo3', many: true }),

  cube('333oh', 'One-handed', '333oh', 20, SIX, { cube: '333', group: 'threes' }),
  cube('333fm', 'Fewest moves', '333fm', 20, SIX, { cube: '333', group: 'threes', score: 'mo3', moves: true }),

  {
    id: 'minx',
    name: 'Megaminx',
    event: 'minx',
    cube: 'minx',
    group: 'other',
    score: 'ao5',
    // A megaminx scramble is not a free string of turns: it is seven lines of
    // alternating R and D by a fifth twice over, each closed by a U. The
    // stand-in keeps to that shape so it still reads as a megaminx scramble.
    length: 7,
    megaminx: true,
    faces: [],
    suffixes: [],
    opposite: {}
  },
  {
    id: 'pyra',
    name: 'Pyraminx',
    event: 'pyram',
    cube: 'pyra',
    group: 'other',
    score: 'ao5',
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
    cube: 'skewb',
    group: 'other',
    score: 'ao5',
    length: 11,
    faces: ['U', 'L', 'R', 'B'],
    suffixes: ['', "'"],
    opposite: {}
  },
  {
    id: 'sq1',
    name: 'Square-1',
    event: 'sq1',
    cube: 'sq1',
    group: 'other',
    score: 'ao5',
    // Pairs of numbers with a slash between them, and nothing else works.
    length: 12,
    squareOne: true,
    faces: [],
    suffixes: [],
    opposite: {}
  },
  {
    id: 'clock',
    name: 'Clock',
    event: 'clock',
    cube: 'clock',
    group: 'other',
    score: 'ao5',
    length: 14,
    clock: true,
    faces: [],
    suffixes: [],
    opposite: {}
  }
];

/** The four drawers of the menu, in the order they are shown. */
export const GROUPS = [
  { id: 'cubes', name: 'Cubes' },
  { id: 'blind', name: 'Blindfolded' },
  { id: 'threes', name: 'With the 3x3' },
  { id: 'other', name: 'Other puzzles' }
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
  if (puzzle.clock) return randomClockScramble(random);
  if (puzzle.squareOne) return randomSquareOneScramble(puzzle.length, random);

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

/**
 * A clock scramble is nine dials and a flip, written the way the WCA writes it.
 * Nothing about it looks like a turn, so the ordinary generator cannot make one.
 */
const CLOCK_DIALS = ['UR', 'DR', 'DL', 'UL', 'U', 'R', 'D', 'L', 'ALL'];

function randomClockScramble(random = Math.random) {
  const dial = (name) => {
    const turn = Math.floor(random() * 12) - 5;   // -5 .. 6
    return `${name}${Math.abs(turn)}${turn < 0 ? '-' : '+'}`;
  };
  const front = CLOCK_DIALS.map(dial).join(' ');
  const back = ['U', 'R', 'D', 'L', 'ALL'].map(dial).join(' ');
  const pins = ['UR', 'DR', 'DL', 'UL'].filter(() => random() < 0.5);
  return `${front} y2 ${back}${pins.length ? ` ${pins.join(' ')}` : ''}`;
}

/** Square-1 is pairs of numbers with slashes between them, and nothing else. */
function randomSquareOneScramble(pairs, random = Math.random) {
  const out = [];
  for (let at = 0; at < pairs; at++) {
    const top = Math.floor(random() * 12) - 5;
    const bottom = Math.floor(random() * 12) - 5;
    out.push(`(${top}, ${bottom})`);
  }
  return out.join(' / ');
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
