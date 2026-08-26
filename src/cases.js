// Last-layer cases to drill, and the machinery that refuses to serve a broken
// one.
//
// The setup for a case is the algorithm turned back to front: do that to a
// solved cube and you are looking at the case. Which means a wrong algorithm
// would produce a wrong case and you would practise nonsense without ever being
// told -- so nothing here is trusted. Every case is put on a real cube at load
// and thrown out unless it lands where a case of its kind is supposed to land.

/** Edges 0-3 and corners 0-3 are the top layer; the rest is the F2L. */
const TOP_EDGES = [0, 1, 2, 3];
const TOP_CORNERS = [0, 1, 2, 3];

export const GROUPS = {
  pll: { name: 'PLL', about: 'De laatste laag rondzetten, alles ligt al goed gedraaid. 21 gevallen.' },
  oll: { name: 'OLL', about: 'De laatste laag in één keer geel maken. Alle 57 gevallen.' },
  eo: { name: 'Kruis maken', about: 'De eerste stap van OLL in twee kijkbeurten: het gele kruis.' },
  ocll: { name: 'Hoeken draaien', about: 'De tweede stap van OLL in twee kijkbeurten, met het kruis al gemaakt.' }
};

/**
 * The fifty-seven OLL cases, by their usual numbers, with the shape each one
 * looks like on the top face.
 */
const OLL_SHAPES = [
  [1, 'Punt · dubbele bocht', "R U2 R2 F R F' U2 R' F R F'"],
  [2, 'Punt · rugzak', "F R U R' U' F' f R U R' U' f'"],
  [3, 'Punt · anti-schild', "f R U R' U' f' U' F R U R' U' F'"],
  [4, 'Punt · schild', "f R U R' U' f' U F R U R' U' F'"],
  [5, 'Vierkant · links', "r' U2 R U R' U r"],
  [6, 'Vierkant · rechts', "r U2 R' U' R U' r'"],
  [7, 'Lus · rechts', "r U R' U R U2 r'"],
  [8, 'Lus · links', "r' U' R U' R' U2 r"],
  [9, 'Vis · koplampen achter', "R U R' U' R' F R2 U R' U' F'"],
  [10, 'Vis · koplampen voor', "R U R' U R' F R F' R U2 R'"],
  [11, 'Kleine hobbel · rechts', "r U R' U R' F R F' R U2 r'"],
  [12, 'Kleine hobbel · links', "M' R' U' R U' R' U2 R U' R r'"],
  [13, 'Knie · voor', "F U R U' R2 F' R U R U' R'"],
  [14, 'Knie · achter', "R' F R U R' F' R F U' F'"],
  [15, 'Knie · links', "l' U' l L' U' L U l' U l"],
  [16, 'Knie · rechts', "r U r' R U R' U' r U' r'"],
  [17, 'Punt · met koplampen', "F R' F' R2 r' U R U' R' U' M'"],
  [18, 'Punt · kruisje', "r U R' U R U2 r2 U' R U' R' U2 r"],
  [19, 'Punt · muis', "r' R U R U R' U' M' R' F R F'"],
  [20, 'Punt · alles los', "r U R' U' M2 U R U' R' U' M'"],
  [21, 'Kruis · dubbele Sune', "R U2 R' U' R U R' U' R U' R'"],
  [22, 'Kruis · Pi', "R U2 R2 U' R2 U' R2 U2 R"],
  [23, 'Kruis · koplampen', "R2 D R' U2 R D' R' U2 R'"],
  [24, 'Kruis · T', "r U R' U' r' F R F'"],
  [25, 'Kruis · strik', "F' r U R' U' r' F R"],
  [26, 'Kruis · Antisune', "R U2 R' U' R U' R'"],
  [27, 'Kruis · Sune', "R U R' U R U2 R'"],
  [28, 'Streep · stealth', "r U R' U' r' R U R U' R'"],
  [29, 'Streep · aap', "R U R' U' R U' R' F' U' F R U R'"],
  [30, 'Streep · kraan', "F R' F R2 U' R' U' R U R' F2"],
  [31, 'Streep · P links', "R' U' F U R U' R' F' R"],
  [32, 'Streep · P rechts', "L U F' U' L' U L F L'"],
  [33, 'Streep · sleutel', "R U R' U' R' F R F'"],
  [34, 'Streep · gat', "R U R2 U' R' F R U R U' F'"],
  [35, 'Streep · vis', "R U2 R2 F R F' R U2 R'"],
  [36, 'Streep · worm', "L' U' L U' L' U L U L F' L' F"],
  [37, 'Streep · vissenkop', "F R' F' R U R U' R'"],
  [38, 'Streep · muur', "R U R' U R U' R' U' R' F R F'"],
  [39, 'Streep · balk links', "L F' L' U' L U F U' L'"],
  [40, 'Streep · balk rechts', "R' F R U R' U' F' U R"],
  [41, 'Streep · bewaker', "R U R' U R U2 R' F R U R' U' F'"],
  [42, 'Streep · adelaar', "R' U' R U' R' U2 R F R U R' U' F'"],
  [43, 'Streep · vlieger links', "F' U' L' U L F"],
  [44, 'Streep · vlieger rechts', "F U R U' R' F'"],
  [45, 'Kruis · T-vorm', "F R U R' U' F'"],
  [46, 'Kruis · C-vorm', "R' U' R' F R F' U R"],
  [47, 'Streep · bril links', "F' L' U' L U L' U' L U F"],
  [48, 'Streep · bril rechts', "F R U R' U' R U R' U' F'"],
  [49, 'Streep · plank rechts', "r U' r2 U r2 U r2 U' r"],
  [50, 'Streep · plank links', "r' U r2 U' r2 U' r2 U r'"],
  [51, 'Streep · brug', "F U R U' R' U R U' R' F'"],
  [52, 'Streep · bank', "R U R' U R U' B U' B' R'"],
  [53, 'Vierkant · lang links', "l' U2 L U L' U' L U L' U l"],
  [54, 'Vierkant · lang rechts', "r U2 R' U' R U R' U' R U' r'"],
  [55, 'Streep · hoge trap', "R' F R U R U' R2 F' R2 U' R' U R U R'"],
  [56, 'Punt · vrijstaand', "r U r' U R U' R' U R U' R' r U' r'"],
  [57, 'Kruis · H', "R U R' U' M' U R U' r'"]
];

const OLL = OLL_SHAPES.map(([number, name, alg]) => ({
  id: `OLL ${number}`, group: 'oll', kind: 'orient', name, alg
}));

/**
 * The cases, each with the algorithm it is drilled with. Rotation-free on
 * purpose: a setup that leaves the whole cube turned is a setup you cannot read
 * off the screen. Anything with a net rotation is rejected below anyway.
 */
export const CASES = [
  // --- PLL, corners only
  { id: 'Aa', group: 'pll', kind: 'corners', alg: "R' F R' B2 R F' R' B2 R2" },
  { id: 'Ab', group: 'pll', kind: 'corners', alg: "R B' R F2 R' B R F2 R2" },
  { id: 'E', group: 'pll', kind: 'corners', alg: "x' R U' R' D R U R' D' R U R' D R U' R' D' x" },

  // --- PLL, edges only
  { id: 'Ua', group: 'pll', kind: 'edges', alg: "R U' R U R U R U' R' U' R2" },
  { id: 'Ub', group: 'pll', kind: 'edges', alg: "R2 U R U R' U' R' U' R' U R'" },
  { id: 'H', group: 'pll', kind: 'edges', alg: "M2 U M2 U2 M2 U M2" },
  // The trailing U' matters: without it this shifts the corners too, which is
  // exactly what the check caught.
  { id: 'Z', group: 'pll', kind: 'edges', alg: "M' U M2 U M2 U M' U2 M2 U'" },

  // --- PLL, both
  { id: 'T', group: 'pll', kind: 'both', alg: "R U R' U' R' F R2 U' R' U' R U R' F'" },
  { id: 'Y', group: 'pll', kind: 'both', alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
  { id: 'F', group: 'pll', kind: 'both', alg: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R" },
  { id: 'Ja', group: 'pll', kind: 'both', alg: "R' U L' U2 R U' R' U2 R L" },
  { id: 'Jb', group: 'pll', kind: 'both', alg: "R U R' F' R U R' U' R' F R2 U' R' U'" },
  { id: 'Ra', group: 'pll', kind: 'both', alg: "R U' R' U' R U R D R' U' R D' R' U2 R'" },
  { id: 'Rb', group: 'pll', kind: 'both', alg: "R2 F R U R U' R' F' R U2 R' U2 R" },
  { id: 'Ga', group: 'pll', kind: 'both', alg: "R2 U R' U R' U' R U' R2 U' D R' U R D'" },
  { id: 'Gb', group: 'pll', kind: 'both', alg: "R' U' R U D' R2 U R' U R U' R U' R2 D" },
  { id: 'Gc', group: 'pll', kind: 'both', alg: "R2 U' R U' R U R' U R2 U D' R U' R' D" },
  { id: 'Gd', group: 'pll', kind: 'both', alg: "R U R' U' D R2 U' R U' R' U R' U R2 D'" },
  { id: 'V', group: 'pll', kind: 'both', alg: "R' U R' U' R D' R' D R' U D' R2 U' R2 D R2" },
  { id: 'Na', group: 'pll', kind: 'both', alg: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'" },
  { id: 'Nb', group: 'pll', kind: 'both', alg: "R' U R U' R' F' U' F R U R' F R' F' R U' R" },

  // --- two-look, first look: the cross
  { id: 'Punt', group: 'eo', kind: 'edges', name: 'Punt', alg: "F R U R' U' F' f R U R' U' f'" },
  { id: 'Streep', group: 'eo', kind: 'edges', name: 'Streep', alg: "F R U R' U' F'" },
  { id: 'Haakje', group: 'eo', kind: 'edges', name: 'Haakje', alg: "f R U R' U' f'" },

  // --- two-look, second look: the corners. These are OLL 21 to 27 under the
  // names people actually use for them while learning two-look.
  { id: 'Sune', group: 'ocll', kind: 'corners', name: 'Sune', alg: "R U R' U R U2 R'" },
  { id: 'Antisune', group: 'ocll', kind: 'corners', name: 'Antisune', alg: "R U2 R' U' R U' R'" },
  { id: 'Pi', group: 'ocll', kind: 'corners', name: 'Pi', alg: "R U2 R2 U' R2 U' R2 U2 R" },
  { id: 'Kop', group: 'ocll', kind: 'corners', name: 'Koplampen', alg: "R2 D R' U2 R D' R' U2 R'" },
  { id: 'Dubbele Sune', group: 'ocll', kind: 'corners', name: 'Dubbele Sune', alg: "R U R' U R U' R' U R U2 R'" },
  { id: 'Strik', group: 'ocll', kind: 'corners', name: 'Strik', alg: "F' r U R' U' r' F R" },
  { id: 'T-hoeken', group: 'ocll', kind: 'corners', name: 'T', alg: "r U R' U' r' F R F'" },

  // --- OLL, all fifty-seven.
  //
  // Nothing here is taken on trust: each one is put on a real cube at load and
  // thrown out unless it leaves the first two layers alone and turns something
  // in the last one. On top of that no two may come out as the same case --
  // which is what makes the set provably complete rather than merely long,
  // because there are exactly fifty-seven of them.
  ...OLL
];

/**
 * The four corners and four edges of the last layer, in a ring going clockwise
 * from the back left. Read off the puzzle's own net rather than assumed: the
 * top face is drawn as corner 2, edge 2, corner 1 across the back, edge 3 and
 * edge 1 down the sides, corner 3, edge 0, corner 0 across the front.
 */
const RING_CORNERS = [2, 1, 0, 3];
const RING_EDGES = [2, 1, 0, 3];

/**
 * What case this is, as a string, with the way it happens to be turned taken
 * out. A quarter turn of U moves every piece of the last layer two places round
 * the ring, so the same case turned differently gives a rotation of the same
 * list -- and the smallest rotation is a name that does not depend on how you
 * are holding it.
 *
 * For an OLL only which way up things are counts, because that is all an OLL
 * is. For everything else where each piece went counts as well.
 */
export function caseSignature(pattern, group) {
  const corners = pattern.patternData.CORNERS;
  const edges = pattern.patternData.EDGES;
  const cell = (state, at) => (group === 'oll'
    ? String(state.orientation?.[at] ?? 0)
    : `${state.pieces[at]}.${state.orientation?.[at] ?? 0}`);

  const ring = [];
  for (let step = 0; step < 4; step++) {
    ring.push(cell(corners, RING_CORNERS[step]), cell(edges, RING_EDGES[step]));
  }

  let smallest = null;
  for (let turn = 0; turn < 4; turn++) {
    const rolled = ring.slice(turn * 2).concat(ring.slice(0, turn * 2)).join('|');
    if (smallest === null || rolled < smallest) smallest = rolled;
  }
  return smallest;
}

/** Whether two patterns agree about a set of pieces in one orbit. */
function same(a, b, orbit, which) {
  const left = a.patternData[orbit];
  const right = b.patternData[orbit];
  return which.every((index) => left.pieces[index] === right.pieces[index]
    && (left.orientation?.[index] ?? 0) === (right.orientation?.[index] ?? 0));
}

const everyIndex = (pattern, orbit) => pattern.patternData[orbit].pieces.map((_, i) => i);

/**
 * Put a case on a real cube and say whether it landed where it should.
 *
 * Three things have to hold, and each of them catches a different kind of
 * mistake. The centres must not have moved, or the setup leaves the whole cube
 * turned and cannot be read off a screen. The first two layers must be
 * untouched, which is what a mistyped move breaks first. And the last layer has
 * to be wrong in the way its kind is wrong: a PLL only out of place, an OLL at
 * least partly the wrong way up.
 *
 * @returns {{ok: true, setup: string} | {ok: false, why: string}}
 */
export function checkCase(entry, kpuzzle, Alg) {
  let setup;
  let landed;
  try {
    setup = new Alg(entry.alg).invert().experimentalSimplify({ cancel: true }).toString();
    landed = kpuzzle.defaultPattern().applyAlg(new Alg(setup));
  } catch (error) {
    return { ok: false, why: `niet te lezen (${error.message})` };
  }

  const solved = kpuzzle.defaultPattern();
  const bottomEdges = everyIndex(solved, 'EDGES').filter((i) => !TOP_EDGES.includes(i));
  const bottomCorners = everyIndex(solved, 'CORNERS').filter((i) => !TOP_CORNERS.includes(i));

  if (!same(landed, solved, 'CENTERS', everyIndex(solved, 'CENTERS'))) {
    return { ok: false, why: 'draait de hele kubus' };
  }
  if (!same(landed, solved, 'EDGES', bottomEdges) || !same(landed, solved, 'CORNERS', bottomCorners)) {
    return { ok: false, why: 'breekt de eerste twee lagen' };
  }

  const top = landed.patternData;
  const twisted = TOP_CORNERS.some((i) => (top.CORNERS.orientation?.[i] ?? 0) !== 0)
    || TOP_EDGES.some((i) => (top.EDGES.orientation?.[i] ?? 0) !== 0);
  const shuffled = TOP_CORNERS.some((i) => top.CORNERS.pieces[i] !== i)
    || TOP_EDGES.some((i) => top.EDGES.pieces[i] !== i);

  if (entry.group === 'pll') {
    if (twisted) return { ok: false, why: 'laat stukken verkeerd om liggen' };
    if (!shuffled) return { ok: false, why: 'verandert niets' };
    const cornersMoved = TOP_CORNERS.some((i) => top.CORNERS.pieces[i] !== i);
    const edgesMoved = TOP_EDGES.some((i) => top.EDGES.pieces[i] !== i);
    if (entry.kind === 'corners' && edgesMoved) return { ok: false, why: 'verzet ook randen' };
    if (entry.kind === 'edges' && cornersMoved) return { ok: false, why: 'verzet ook hoeken' };
    if (entry.kind === 'both' && (!cornersMoved || !edgesMoved)) {
      return { ok: false, why: 'verzet er maar één soort' };
    }
  } else if (!twisted) {
    return { ok: false, why: 'draait niets om' };
  }

  return { ok: true, setup, pattern: landed };
}

/**
 * The cases that survive being tried. Anything that does not is left out --
 * drilling a case built from a wrong algorithm teaches you the wrong thing, and
 * you would never be told.
 *
 * @returns {{cases: object[], dropped: {id: string, why: string}[]}}
 */
export function usableCases(kpuzzle, Alg, list = CASES) {
  const cases = [];
  const dropped = [];
  const seen = new Map();   // signature -> the case that claimed it

  for (const entry of list) {
    const verdict = checkCase(entry, kpuzzle, Alg);
    if (!verdict.ok) {
      dropped.push({ id: entry.id, why: verdict.why });
      continue;
    }

    // Two cases that come out as the same thing means one of the two algorithms
    // is not the case its name says. Dropping the second is not the point --
    // the point is that with none dropped, fifty-seven distinct OLLs is every
    // OLL there is, so the set is provably complete rather than merely long.
    const mark = `${entry.group}/${caseSignature(verdict.pattern, entry.group)}`;
    const claimed = seen.get(mark);
    if (claimed) {
      dropped.push({ id: entry.id, why: `zelfde geval als ${claimed}` });
      continue;
    }
    seen.set(mark, entry.id);

    cases.push({ ...entry, name: entry.name || entry.id, setup: verdict.setup });
  }
  return { cases, dropped };
}

/** A quarter turn of U before the case, so it does not always face you the same way. */
export const AUF = ['', 'U', 'U2', "U'"];
