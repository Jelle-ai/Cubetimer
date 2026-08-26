// How hard a scramble was, worked out rather than guessed.
//
// Every timer stores your scramble; none of them look at it. The puzzle engine
// that makes the scrambles is already here, so the shortest cross for a
// scramble is a question that can simply be answered -- for all six colours at
// once, which is the number nobody has ever been able to put on their own
// colour neutrality.
//
// The whole cross state is four edges: where each of them is and which way up.
// Twelve positions and two orientations each gives 190 080 states, so instead of
// searching for each scramble, the distance from solved to every one of those is
// worked out once and looked up ever after.

/** How the four cross edges are found in the KPuzzle's EDGES orbit. */
const SLOTS = { U: [0, 1, 2, 3], D: [4, 5, 6, 7] };

/**
 * The rotation that brings a colour's face down, so one table serves all six.
 * A cross is a cross whichever side it is on; only the way you hold the cube
 * changes.
 */
export const FACES = [
  { id: 'D', name: 'geel', turn: '' },
  { id: 'U', name: 'wit', turn: 'z2' },
  { id: 'F', name: 'groen', turn: 'x' },
  { id: 'B', name: 'blauw', turn: "x'" },
  { id: 'R', name: 'rood', turn: "z'" },
  { id: 'L', name: 'oranje', turn: 'z' }
];

/** Every quarter and half turn of the six faces. */
const MOVES = ['U', 'D', 'R', 'L', 'F', 'B'].flatMap((face) => [face, `${face}'`, `${face}2`]);

/**
 * The state of the four cross edges, as one number.
 *
 * Read against a reference rather than against absolute piece numbers. Turning
 * the whole cube to put another colour down moves every piece, so a solved cube
 * held upside down does not look solved to anything that asks "where is edge
 * four" -- which is exactly how the first attempt got five out of six colours
 * wrong on a cube that was not scrambled at all. Asking instead "where is the
 * piece that belongs in this slot, and is it the same way up as it is there"
 * gives the same answer whichever way the cube is held.
 *
 * That also makes one table serve all six colours: the eighteen moves are the
 * same set after a rotation, so the distance is a property of the relative
 * arrangement and not of which face happens to be down.
 */
function crossKey(pattern, reference) {
  const edges = pattern.patternData.EDGES;
  const home = reference.patternData.EDGES;
  let key = 0;

  for (const slot of SLOTS.D) {
    const piece = home.pieces[slot];
    const at = edges.pieces.indexOf(piece);
    const twist = (((edges.orientation?.[at] ?? 0) - (home.orientation?.[slot] ?? 0)) % 2 + 2) % 2;
    key = key * 24 + at * 2 + twist;
  }
  return key;
}

const KEYS = 24 ** 4;

/**
 * Distance from solved to every cross state, worked out once by walking
 * outwards from the solved cube. Eight moves is enough for any cross.
 *
 * @returns {Int8Array} indexed by crossKey, -1 where unreachable
 */
export function buildTable(kpuzzle, Alg, depth = 8) {
  const table = new Int8Array(KEYS).fill(-1);
  const solved = kpuzzle.defaultPattern();
  const moves = MOVES.map((move) => new Alg(move));

  table[crossKey(solved, solved)] = 0;
  let edge = [solved];

  for (let step = 1; step <= depth && edge.length; step++) {
    const next = [];
    for (const pattern of edge) {
      for (const move of moves) {
        const after = pattern.applyAlg(move);
        const key = crossKey(after, solved);
        if (table[key] !== -1) continue;
        table[key] = step;
        next.push(after);
      }
    }
    edge = next;
  }
  return table;
}

/**
 * How many moves the cross takes for each colour, after this scramble.
 * @returns {{id: string, name: string, moves: number}[]} shortest first
 */
export function crossLengths(scramble, kpuzzle, Alg, table) {
  const solved = kpuzzle.defaultPattern();
  let scrambled;
  try {
    scrambled = solved.applyAlg(new Alg(scramble));
  } catch {
    return [];
  }

  const solved0 = solved;
  return FACES
    .map((face) => {
      // Both the cube and what counts as solved are turned the same way, so the
      // comparison is between like and like.
      const turn = face.turn ? new Alg(face.turn) : null;
      const held = turn ? scrambled.applyAlg(turn) : scrambled;
      const reference = turn ? solved0.applyAlg(turn) : solved0;
      const moves = table[crossKey(held, reference)];
      return { id: face.id, name: face.name, moves: moves === -1 ? Infinity : moves };
    })
    .filter((entry) => Number.isFinite(entry.moves))
    .sort((a, b) => a.moves - b.moves);
}

/**
 * What a scramble was worth, over a whole history.
 *
 * The number that matters is not the average cross length -- it is how much
 * shorter the best colour was than the one you actually use. That is the cost
 * of not being colour neutral, and it is a number nobody has ever been able to
 * put on their own.
 *
 * @param {string} yours the face you solve on, e.g. 'D'
 */
export function neutrality(scrambles, yours, kpuzzle, Alg, table) {
  let counted = 0;
  let mine = 0;
  let shortest = 0;
  let muchBetter = 0;

  for (const scramble of scrambles) {
    const lengths = crossLengths(scramble, kpuzzle, Alg, table);
    if (!lengths.length) continue;
    const own = lengths.find((entry) => entry.id === yours);
    if (!own) continue;

    counted++;
    mine += own.moves;
    shortest += lengths[0].moves;
    if (own.moves - lengths[0].moves >= 3) muchBetter++;
  }

  if (!counted) return null;
  return {
    counted,
    mine: mine / counted,
    shortest: shortest / counted,
    lost: (mine - shortest) / counted,
    muchBetter
  };
}
