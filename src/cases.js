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
  pll: { name: 'PLL', about: 'De laatste laag rondzetten, alles ligt al goed gedraaid.' },
  oll: { name: 'OLL (2-look)', about: 'De laatste laag geel maken, in twee stappen.' }
};

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

  // --- OLL, first look: the cross
  { id: 'Punt', group: 'oll', kind: 'edges', alg: "F R U R' U' F' f R U R' U' f'" },
  { id: 'Streep', group: 'oll', kind: 'edges', alg: "F R U R' U' F'" },
  { id: 'Haakje', group: 'oll', kind: 'edges', alg: "f R U R' U' f'" },

  // --- OLL, second look: the corners
  { id: 'Sune', group: 'oll', kind: 'corners', alg: "R U R' U R U2 R'" },
  { id: 'Antisune', group: 'oll', kind: 'corners', alg: "R U2 R' U' R U' R'" },
  { id: 'Pi', group: 'oll', kind: 'corners', alg: "R U2 R2 U' R2 U' R2 U2 R" },
  { id: 'Kop', group: 'oll', kind: 'corners', alg: "R2 D R' U2 R D' R' U2 R'" },
  { id: 'Dubbele Sune', group: 'oll', kind: 'corners', alg: "R U R' U R U' R' U R U2 R'" },
  { id: 'Strik', group: 'oll', kind: 'corners', alg: "F' r U R' U' r' F R" },
  { id: 'T-hoeken', group: 'oll', kind: 'corners', alg: "r U R' U' r' F R F'" }
];

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

  return { ok: true, setup };
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

  for (const entry of list) {
    const verdict = checkCase(entry, kpuzzle, Alg);
    if (verdict.ok) cases.push({ ...entry, setup: verdict.setup });
    else dropped.push({ id: entry.id, why: verdict.why });
  }
  return { cases, dropped };
}

/** A quarter turn of U before the case, so it does not always face you the same way. */
export const AUF = ['', 'U', 'U2', "U'"];
