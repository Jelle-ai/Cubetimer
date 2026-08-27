import { t } from './lang.js';

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
  f2l: {
    name: 'F2L',
    get about() { return t('The pair in the front right slot. All 41 cases.'); }
  },
  oll: {
    name: 'OLL',
    get about() { return t('The last layer made yellow in one go. All 57 cases.'); }
  },
  pll: {
    name: 'PLL',
    get about() { return t('Putting the last layer round, everything already the right way up. 21 cases.'); }
  },
  eo: {
    get name() { return t('Making the cross'); },
    get about() { return t('The first step of OLL in two looks: the yellow cross.'); }
  },
  ocll: {
    get name() { return t('Turning the corners'); },
    get about() { return t('The second step of OLL in two looks, with the cross already made.'); }
  }
};

/**
 * The pair that belongs in the front-right slot, and everything that has to
 * stay where it is while it is drilled. Read off the puzzle rather than
 * assumed: R moves corners 0,1,4,7 and edges 1,5,8,10; F moves corners 0,3,4,5
 * and edges 0,4,8,9. The corner both turns share that is not in the top layer
 * is 4, and the edge is 8.
 */
const F2L_PAIR = { corner: 4, edge: 8 };
const F2L_KEEP = { corners: [5, 6, 7], edges: [4, 5, 6, 7, 9, 10, 11] };


/**
 * The forty-one F2L cases, worked out rather than typed in.
 *
 * Writing out forty-one algorithms from memory and hoping is exactly the kind
 * of thing the rest of this file refuses to do, so the set was generated. Three
 * things can be turned without disturbing the cross or the other three slots --
 * the top layer, and pulling the pair out and back with R U^k R' or F' U^k F
 * and their mirrors -- and everything reachable that way is an F2L case, and
 * nothing else is. Walking that outwards from a solved cube found forty-two
 * states: the solved one and forty-one cases, split 24 / 6 / 6 / 5 across pair
 * on top, corner down, edge down and both down, which is exactly the split the
 * arithmetic says there should be.
 *
 * The algorithms are the shortest routes back that the same search found, after
 * cancelling moves and dropping the top-layer turns at either end that only say
 * which way round you are holding it. So the first one is short, and the ones
 * under it are the next shortest that are genuinely different.
 */
const F2L_SHAPES = [
  [1, 'Pair on top', ["F' U F", "F' U2 F", "R U' R' F' U F"]],
  [2, 'Pair on top', ["R U R'", "R U' R' U' R U' R'", "F' U2 F U R U' R'"]],
  [3, 'Pair on top', ["R U' R'", "R U2 R'", "F' U' F R U' R'"]],
  [4, 'Pair on top', ["F' U' F", "R U2 R' U' F' U F", "F' U F U F' U F"]],
  [5, 'Pair on top', ["R U R' F' U' F", "F' U F U2 F' U' F", "F' U' F U' F' U F"]],
  [6, 'Pair on top', ["F' U' F R U R'", "R U R' U R U' R'", "R U' R' U2 R U R'"]],
  [7, 'Corner on top, edge in the slot · edge flipped', ["R U2 R' F' U' F", "R U' R' F' U2 F", "F' U2 F R U R'"]],
  [8, 'Corner in the slot, edge on top · corner twisted', ["F' U2 F R U2 R'", "F' U2 F U' R U' R'", "R U' R' U R U' R'"]],
  [9, 'Corner in the slot, edge on top · corner twisted', ["R U' R' F' U' F", "F' U' F U F' U' F", "F' U2 F U2 F' U' F"]],
  [10, 'Corner in the slot, edge on top · corner twisted', ["F' U F R U R'", "R U R' U' R U R'", "R U2 R' U2 R U R'"]],
  [11, 'Corner in the slot, edge on top · corner twisted', ["R U2 R' F' U2 F", "F' U F U' F' U F", "R U2 R' U F' U F"]],
  [12, 'Pair on top', ["F' U2 F U F' U' F", "F' U' F U2 R U' R' F' U' F", "R U' R' U2 R U' R' F' U' F"]],
  [13, 'Pair on top', ["R U2 R' U' R U R'", "F' U F R U' R' U' F' U' F", "F' U F R U R' U' F' U F"]],
  [14, 'Pair on top', ["R U2 R' U R U' R'", "R U2 R' U2 R U2 R'", "F' U F R U2 R' F' U' F"]],
  [15, 'Pair on top', ["F' U2 F U' F' U F", "F' U2 F U2 F' U2 F", "F' U' F R U R' F' U' F"]],
  [16, 'Pair on top', ["F' U2 F U' R U R'", "F' U2 F U' F' U' F R U R'", "F' U' F U F' U F R U R'"]],
  [17, 'Pair on top', ["R U' R' U R U R'", "F' U F U' R U2 R' F' U' F", "F' U F U2 R U' R' F' U2 F"]],
  [18, 'Pair on top', ["R U' R' U2 F' U' F", "F' U2 F U' R U R' F' U' F", "R U R' U2 R U R' F' U' F"]],
  [19, 'Pair on top', ["F' U2 F U2 F' U F", "F' U2 F U F' U2 F", "F' U2 F R U R' F' U2 F"]],
  [20, 'Pair on top', ["F' U F U' R U R'", "R U' R' U' R U R'", "R U R' U R U R'"]],
  [21, 'Pair on top', ["F' U' F U2 F' U F", "F' U' F U F' U2 F", "F' U' F R U R' F' U2 F"]],
  [22, 'Corner on top, edge in the slot', ["F' U F U2 F' U F", "F' U F U F' U2 F", "R U2 R' U R U R'"]],
  [23, 'Corner on top, edge in the slot · edge flipped', ["F' U' F U R U' R'", "F' U' F U' R U R'", "F' U F U R U R'"]],
  [24, 'Pair on top', ["F' U F U2 R U R'", "R U2 R' U F' U' F R U R'", "F' U' F U2 F' U' F R U R'"]],
  [25, 'Pair on top', ["F' U F U' F' U' F", "R U R' U R U' R' F' U' F", "R U' R' U' R U2 R' F' U' F"]],
  [26, 'Pair on top', ["R U2 R' U F' U' F", "F' U F U' R U' R' F' U' F", "F' U2 F U' R U' R' F' U' F"]],
  [27, 'Pair on top', ["R U R' U2 R U' R'", "R U R' U' R U2 R'", "R U R' F' U' F R U2 R'"]],
  [28, 'Pair on top', ["F' U' F U' F' U' F", "F' U F U F' U' F", "R U' R' U F' U' F"]],
  [29, 'Pair on top', ["R U2 R' U2 R U' R'", "R U2 R' U' R U2 R'", "R U2 R' F' U' F R U2 R'"]],
  [30, 'Corner on top, edge in the slot', ["F' U2 F U' F' U' F", "F' U' F U2 F' U' F", "R U' R' U2 R U' R'"]],
  [31, 'Corner on top, edge in the slot · edge flipped', ["R U' R' U' F' U' F", "R U R' U F' U' F", "R U R' U' F' U F"]],
  [32, 'Corner in the slot, edge on top', ["F' U F U R U' R'", "F' U' F U R U R'", "F' U2 F U2 R U R'"]],
  [33, 'Corner in the slot, edge on top', ["R U R' U' F' U' F", "R U2 R' U2 F' U' F", "R U' R' U' F' U F"]],
  [34, 'Pair on top', ["F' U' F R U2 R' F' U' F", "R U R' F' U F R U R'", "F' U' F U' R U' R' F' U2 F"]],
  [35, 'Pair on top', ["F' U' F R U' R' F' U' F", "R U R' F' U2 F R U R'", "R U' R' U' R U R' F' U' F"]],
  [36, 'Corner on top, edge in the slot', ["F' U' F U' R U' R' F' U' F", "F' U F U' R U R' F' U' F", "F' U' F U R U R' F' U' F"]],
  [37, 'Both in the slot · corner twisted and edge flipped', ["F' U F U2 F' U' F R U R'", "F' U F R U' R' U2 R U R'", "R U' R' U F' U' F U' F' U' F"]],
  [38, 'Both in the slot · corner twisted and edge flipped', ["R U' R' U2 R U R' F' U' F", "R U' R' F' U F U2 F' U' F", "R U R' U' R U' R' U2 F' U' F"]],
  [39, 'Both in the slot · edge flipped', ["R U2 R' U R U2 R' U F' U' F", "R U R' U2 R U2 R' U F' U' F", "R U' R' U F' U2 F U2 F' U F"]],
  [40, 'Both in the slot · corner twisted', ["F' U2 F U' F' U F U' F' U' F", "F' U' F U2 F' U F U' F' U' F", "F' U F U' F' U2 F U' F' U F"]],
  [41, 'Both in the slot · corner twisted', ["F' U' F U F' U2 F U F' U' F", "F' U2 F U2 F' U2 F U F' U' F", "F' U F U F' U' F U2 F' U F"]],
];

const F2L = F2L_SHAPES.map(([number, name, algs]) => ({
  id: `F2L ${number}`, group: 'f2l', kind: 'pair', name, algs
}));

/**
 * The fifty-seven OLL cases, by their usual numbers, with the shape each one
 * looks like on the top face.
 */
const OLL_SHAPES = [
  [1, 'Dot · double bend', "R U2 R2 F R F' U2 R' F R F'"],
  [2, 'Dot · rucksack', "F R U R' U' F' f R U R' U' f'"],
  [3, 'Dot · anti shield', "f R U R' U' f' U' F R U R' U' F'"],
  [4, 'Dot · shield', "f R U R' U' f' U F R U R' U' F'"],
  [5, 'Square · left', "r' U2 R U R' U r"],
  [6, 'Square · right', "r U2 R' U' R U' r'"],
  [7, 'Loop · right', "r U R' U R U2 r'"],
  [8, 'Loop · left', "r' U' R U' R' U2 r"],
  [9, 'Fish · headlights at the back', "R U R' U' R' F R2 U R' U' F'"],
  [10, 'Fish · headlights at the front', "R U R' U R' F R F' R U2 R'"],
  [11, 'Small bump · right', "r U R' U R' F R F' R U2 r'"],
  [12, 'Small bump · left', "M' R' U' R U' R' U2 R U' R r'"],
  [13, 'Knee · front', "F U R U' R2 F' R U R U' R'"],
  [14, 'Knee · back', "R' F R U R' F' R F U' F'"],
  [15, 'Knee · left', "l' U' l L' U' L U l' U l"],
  [16, 'Knee · right', "r U r' R U R' U' r U' r'"],
  [17, 'Dot · with headlights', "F R' F' R2 r' U R U' R' U' M'"],
  [18, 'Dot · little cross', "r U R' U R U2 r2 U' R U' R' U2 r"],
  [19, 'Dot · mouse', "r' R U R U R' U' M' R' F R F'"],
  [20, 'Dot · all loose', "r U R' U' M2 U R U' R' U' M'"],
  [21, 'Cross · double Sune', ["R U2 R' U' R U R' U' R U' R'", "F R U R' U' R U R' U' R U R' U' F'"]],
  [22, 'Cross · Pi', "R U2 R2 U' R2 U' R2 U2 R"],
  [23, 'Cross · headlights', ["R2 D R' U2 R D' R' U2 R'", "R2 D' R U2 R' D R U2 R"]],
  [24, 'Cross · T', ["r U R' U' r' F R F'", "x' R U R' D R U' R' D' x"]],
  [25, 'Cross · bowtie', ["F' r U R' U' r' F R", "x' R U' R' D R U R' D' x"]],
  [26, 'Cross · Antisune', "R U2 R' U' R U' R'"],
  [27, 'Cross · Sune', ["R U R' U R U2 R'", "L U L' U L U2 L'"]],
  [28, 'Line · stealth', "r U R' U' r' R U R U' R'"],
  [29, 'Line · monkey', "R U R' U' R U' R' F' U' F R U R'"],
  [30, 'Line · crane', "F R' F R2 U' R' U' R U R' F2"],
  [31, 'Line · P left', "R' U' F U R U' R' F' R"],
  [32, 'Line · P right', "L U F' U' L' U L F L'"],
  [33, 'Line · key', ["R U R' U' R' F R F'", "L' U' L U L F' L' F"]],
  [34, 'Line · hole', "R U R2 U' R' F R U R U' F'"],
  [35, 'Line · fish', "R U2 R2 F R F' R U2 R'"],
  [36, 'Line · worm', "L' U' L U' L' U L U L F' L' F"],
  [37, 'Line · fish head', "F R' F' R U R U' R'"],
  [38, 'Line · wall', "R U R' U R U' R' U' R' F R F'"],
  [39, 'Line · beam left', "L F' L' U' L U F U' L'"],
  [40, 'Line · beam right', "R' F R U R' U' F' U R"],
  [41, 'Line · guard', "R U R' U R U2 R' F R U R' U' F'"],
  [42, 'Line · eagle', "R' U' R U' R' U2 R F R U R' U' F'"],
  [43, 'Line · kite left', "F' U' L' U L F"],
  [44, 'Line · kite right', "F U R U' R' F'"],
  [45, 'Cross · T shape', "F R U R' U' F'"],
  [46, 'Cross · C shape', "R' U' R' F R F' U R"],
  [47, 'Line · glasses left', "F' L' U' L U L' U' L U F"],
  [48, 'Line · glasses right', "F R U R' U' R U R' U' F'"],
  [49, 'Line · plank right', "r U' r2 U r2 U r2 U' r"],
  [50, 'Line · plank left', "r' U r2 U' r2 U' r2 U r'"],
  [51, 'Line · bridge', "F U R U' R' U R U' R' F'"],
  [52, 'Line · bench', "R U R' U R U' B U' B' R'"],
  [53, 'Square · long left', "l' U2 L U L' U' L U L' U l"],
  [54, 'Square · long right', "r U2 R' U' R U R' U' R U' r'"],
  [55, 'Line · tall stairs', "R' F R U R U' R2 F' R2 U' R' U R U R'"],
  [56, 'Dot · free standing', "r U r' U R U' R' U R U' R' r U' r'"],
  [57, 'Cross · H', ["R U R' U' M' U R U' r'", "M' U M' U M' U2 M U M U M U2"]]
];

const OLL = OLL_SHAPES.map(([number, name, algs]) => ({
  id: `OLL ${number}`, group: 'oll', kind: 'orient', name,
  algs: Array.isArray(algs) ? algs : [algs]
}));

/**
 * The cases, each with the algorithm it is drilled with. Rotation-free on
 * purpose: a setup that leaves the whole cube turned is a setup you cannot read
 * off the screen. Anything with a net rotation is rejected below anyway.
 */
export const CASES = [
  // --- PLL, corners only
  { id: 'Aa', group: 'pll', kind: 'corners', algs: ["R' F R' B2 R F' R' B2 R2", "x R' U R' D2 R U' R' D2 R2 x'"] },
  { id: 'Ab', group: 'pll', kind: 'corners', algs: ["R B' R F2 R' B R F2 R2"] },
  { id: 'E', group: 'pll', kind: 'corners', algs: ["x' R U' R' D R U R' D' R U R' D R U' R' D' x", "x' L' U L D' L' U' L D L' U' L D' L' U L D x"] },

  // --- PLL, edges only
  { id: 'Ua', group: 'pll', kind: 'edges', algs: ["R U' R U R U R U' R' U' R2", "M2 U M U2 M' U M2"] },
  { id: 'Ub', group: 'pll', kind: 'edges', algs: ["R2 U R U R' U' R' U' R' U R'", "M2 U' M U2 M' U' M2"] },
  { id: 'H', group: 'pll', kind: 'edges', algs: ["M2 U M2 U2 M2 U M2", "M2 U' M2 U2 M2 U' M2"] },
  // The trailing U' matters: without it this shifts the corners too, which is
  // exactly what the check caught.
  { id: 'Z', group: 'pll', kind: 'edges', algs: ["M' U M2 U M2 U M' U2 M2 U'"] },

  // --- PLL, both
  { id: 'T', group: 'pll', kind: 'both', algs: ["R U R' U' R' F R2 U' R' U' R U R' F'"] },
  { id: 'Y', group: 'pll', kind: 'both', algs: ["F R U' R' U' R U R' F' R U R' U' R' F R F'", "F R' F R2 U' R' U' R U R' F' R U R' U' F'"] },
  { id: 'F', group: 'pll', kind: 'both', algs: ["R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R", "R' U R U' R2 F' U' F U R F R' F' R2"] },
  { id: 'Ja', group: 'pll', kind: 'both', algs: ["R' U L' U2 R U' R' U2 R L", "x R2 F R F' R U2 r' U r U2 x'"] },
  { id: 'Jb', group: 'pll', kind: 'both', algs: ["R U R' F' R U R' U' R' F R2 U' R' U'", "R U2 R' U' R U2 L' U R' U' L"] },
  { id: 'Ra', group: 'pll', kind: 'both', algs: ["R U' R' U' R U R D R' U' R D' R' U2 R'"] },
  { id: 'Rb', group: 'pll', kind: 'both', algs: ["R2 F R U R U' R' F' R U2 R' U2 R"] },
  { id: 'Ga', group: 'pll', kind: 'both', algs: ["R2 U R' U R' U' R U' R2 U' D R' U R D'"] },
  { id: 'Gb', group: 'pll', kind: 'both', algs: ["R' U' R U D' R2 U R' U R U' R U' R2 D"] },
  { id: 'Gc', group: 'pll', kind: 'both', algs: ["R2 U' R U' R U R' U R2 U D' R U' R' D"] },
  { id: 'Gd', group: 'pll', kind: 'both', algs: ["R U R' U' D R2 U' R U' R' U R' U R2 D'"] },
  { id: 'V', group: 'pll', kind: 'both', algs: ["R' U R' U' R D' R' D R' U D' R2 U' R2 D R2"] },
  { id: 'Na', group: 'pll', kind: 'both', algs: ["R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'"] },
  { id: 'Nb', group: 'pll', kind: 'both', algs: ["R' U R U' R' F' U' F R U R' F R' F' R U' R", "r' D' F r U' r' F' D r2 U r' U' r' F r F'"] },

  // --- two-look, first look: the cross
  { id: 'Dot', group: 'eo', kind: 'edges', name: 'Dot', algs: ["F R U R' U' F' f R U R' U' f'"] },
  { id: 'Line', group: 'eo', kind: 'edges', name: 'Line', algs: ["F R U R' U' F'"] },
  { id: 'Hook', group: 'eo', kind: 'edges', name: 'Hook', algs: ["f R U R' U' f'"] },

  // --- two-look, second look: the corners. These are OLL 21 to 27 under the
  // names people actually use for them while learning two-look.
  { id: 'Sune', group: 'ocll', kind: 'corners', name: 'Sune', algs: ["R U R' U R U2 R'"] },
  { id: 'Antisune', group: 'ocll', kind: 'corners', name: 'Antisune', algs: ["R U2 R' U' R U' R'"] },
  { id: 'Pi', group: 'ocll', kind: 'corners', name: 'Pi', algs: ["R U2 R2 U' R2 U' R2 U2 R"] },
  { id: 'Kop', group: 'ocll', kind: 'corners', name: 'Headlights', algs: ["R2 D R' U2 R D' R' U2 R'"] },
  { id: 'Double Sune', group: 'ocll', kind: 'corners', name: 'Double Sune', algs: ["R U R' U R U' R' U R U2 R'"] },
  { id: 'Bowtie', group: 'ocll', kind: 'corners', name: 'Bowtie', algs: ["F' r U R' U' r' F R"] },
  { id: 'T-hoeken', group: 'ocll', kind: 'corners', name: 'T', algs: ["r U R' U' r' F R F'"] },

  // --- OLL, all fifty-seven.
  //
  // Nothing here is taken on trust: each one is put on a real cube at load and
  // thrown out unless it leaves the first two layers alone and turns something
  // in the last one. On top of that no two may come out as the same case --
  // which is what makes the set provably complete rather than merely long,
  // because there are exactly fifty-seven of them.
  ...OLL,
  ...F2L
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
export function caseSignature(pattern, group, Alg = null) {
  const corners = pattern.patternData.CORNERS;
  const edges = pattern.patternData.EDGES;

  // An F2L case is only where the pair is: the top layer around it will be
  // solved later and says nothing about which case this is. Turning the top
  // layer is the same case seen from another angle, so the smallest of the four
  // readings is the name.
  if (group === 'f2l') {
    const read = (state) => {
      const c = state.patternData.CORNERS;
      const e = state.patternData.EDGES;
      const at = c.pieces.indexOf(F2L_PAIR.corner);
      const on = e.pieces.indexOf(F2L_PAIR.edge);
      return `${at}.${c.orientation?.[at] ?? 0}/${on}.${e.orientation?.[on] ?? 0}`;
    };
    if (!Alg) return read(pattern);
    let smallest = null;
    let turned = pattern;
    const quarter = new Alg('U');
    for (let turn = 0; turn < 4; turn++) {
      const said = read(turned);
      if (smallest === null || said < smallest) smallest = said;
      turned = turned.applyAlg(quarter);
    }
    return smallest;
  }
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

/**
 * The simplifier writes a half turn it has folded together as U2', which is the
 * same turn and reads like a mistake. Half turns have no direction.
 */
const tidyMoves = (moves) => moves.replace(/([A-Za-z])2'/g, '$12');

/** An algorithm without the top-layer turns at either end that only say which
    way round you happened to be holding it. */
function bareMoves(moves) {
  const turns = moves.split(/\s+/).filter(Boolean);
  while (turns.length && /^U/.test(turns[0])) turns.shift();
  while (turns.length && /^U/.test(turns[turns.length - 1])) turns.pop();
  return turns.join(' ');
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
export function checkCase(entry, kpuzzle, Alg, moves = null) {
  let setup;
  let landed;
  try {
    setup = tidyMoves(new Alg(moves ?? entry.algs[0]).invert().experimentalSimplify({ cancel: true }).toString());
    landed = kpuzzle.defaultPattern().applyAlg(new Alg(setup));
  } catch (error) {
    return { ok: false, why: `unreadable (${error.message})` };
  }

  const solved = kpuzzle.defaultPattern();
  const bottomEdges = everyIndex(solved, 'EDGES').filter((i) => !TOP_EDGES.includes(i));
  const bottomCorners = everyIndex(solved, 'CORNERS').filter((i) => !TOP_CORNERS.includes(i));

  if (!same(landed, solved, 'CENTERS', everyIndex(solved, 'CENTERS'))) {
    return { ok: false, why: 'it leaves the whole cube turned' };
  }

  // An F2L case is judged on a different promise: the cross and the other
  // three slots stay exactly where they are, the top layer may do what it
  // likes, and the pair itself must not already be home.
  if (entry.group === 'f2l') {
    if (!same(landed, solved, 'CORNERS', F2L_KEEP.corners)
      || !same(landed, solved, 'EDGES', F2L_KEEP.edges)) {
      return { ok: false, why: 'it breaks the cross or another slot' };
    }
    const corners = landed.patternData.CORNERS;
    const edges = landed.patternData.EDGES;
    const cornerHome = corners.pieces[F2L_PAIR.corner] === F2L_PAIR.corner
      && (corners.orientation?.[F2L_PAIR.corner] ?? 0) === 0;
    const edgeHome = edges.pieces[F2L_PAIR.edge] === F2L_PAIR.edge
      && (edges.orientation?.[F2L_PAIR.edge] ?? 0) === 0;
    if (cornerHome && edgeHome) return { ok: false, why: 'the pair is already home' };
    // Neither piece may have wandered out of the top layer or the slot.
    const cornerAt = corners.pieces.indexOf(F2L_PAIR.corner);
    const edgeAt = edges.pieces.indexOf(F2L_PAIR.edge);
    if (![0, 1, 2, 3, F2L_PAIR.corner].includes(cornerAt)) return { ok: false, why: 'the corner ends up somewhere else' };
    if (![0, 1, 2, 3, F2L_PAIR.edge].includes(edgeAt)) return { ok: false, why: 'the edge ends up somewhere else' };
    return { ok: true, setup, pattern: landed };
  }

  if (!same(landed, solved, 'EDGES', bottomEdges) || !same(landed, solved, 'CORNERS', bottomCorners)) {
    return { ok: false, why: 'it breaks the first two layers' };
  }

  const top = landed.patternData;
  const twisted = TOP_CORNERS.some((i) => (top.CORNERS.orientation?.[i] ?? 0) !== 0)
    || TOP_EDGES.some((i) => (top.EDGES.orientation?.[i] ?? 0) !== 0);
  const shuffled = TOP_CORNERS.some((i) => top.CORNERS.pieces[i] !== i)
    || TOP_EDGES.some((i) => top.EDGES.pieces[i] !== i);

  if (entry.group === 'pll') {
    if (twisted) return { ok: false, why: 'it leaves pieces the wrong way up' };
    if (!shuffled) return { ok: false, why: 'it changes nothing' };
    const cornersMoved = TOP_CORNERS.some((i) => top.CORNERS.pieces[i] !== i);
    const edgesMoved = TOP_EDGES.some((i) => top.EDGES.pieces[i] !== i);
    if (entry.kind === 'corners' && edgesMoved) return { ok: false, why: 'it moves edges as well' };
    if (entry.kind === 'edges' && cornersMoved) return { ok: false, why: 'it moves corners as well' };
    if (entry.kind === 'both' && (!cornersMoved || !edgesMoved)) {
      return { ok: false, why: 'it moves only one kind' };
    }
  } else if (!twisted) {
    return { ok: false, why: 'it turns nothing over' };
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
    // OLL there is, and forty-one F2Ls is every F2L, so the sets are provably
    // complete rather than merely long.
    const mark = `${entry.group}/${caseSignature(verdict.pattern, entry.group, Alg)}`;
    const claimed = seen.get(mark);
    if (claimed) {
      dropped.push({ id: entry.id, why: `the same case as ${claimed}` });
      continue;
    }
    seen.set(mark, entry.id);

    // Every alternative has to land on the same case as the one it is offered
    // beside. An algorithm that does not is not another way of doing this case,
    // it is a mistake, and drilling it would teach the wrong thing.
    const algs = [];
    for (const moves of entry.algs) {
      const tried = checkCase(entry, kpuzzle, Alg, moves);
      if (!tried.ok) {
        dropped.push({ id: `${entry.id} · ${moves}`, why: tried.why });
        continue;
      }
      if (`${entry.group}/${caseSignature(tried.pattern, entry.group, Alg)}` !== mark) {
        dropped.push({ id: `${entry.id} · ${moves}`, why: 'it solves a different case' });
        continue;
      }
      // The same algorithm with a U at either end is not another way of doing
      // the case, it is the same way with the cube held differently -- and it
      // passes every other check, so it has to be caught by name.
      if (algs.some((known) => bareMoves(known.moves) === bareMoves(moves))) continue;
      algs.push({ moves, setup: tried.setup, turns: moves.split(/\s+/).filter(Boolean).length });
    }
    if (!algs.length) {
      dropped.push({ id: entry.id, why: 'no usable algorithm' });
      continue;
    }

    cases.push({ ...entry, name: entry.name || entry.id, algs, setup: algs[0].setup });
  }
  return { cases, dropped };
}

/** A quarter turn of U before the case, so it does not always face you the same way. */
export const AUF = ['', 'U', 'U2', "U'"];

/* ---------- does this algorithm actually do this case? ----------

   The check above asks a different question: given an algorithm, is the state
   it comes from a case of this kind? That is the right question for the list
   that ships with the app, where the algorithm defines the case.

   For an algorithm you type in yourself the question is the other way round:
   here is the case, does what you typed solve it? So the case is set up the way
   the book presents it, your moves are done on it, and the result is looked at.
   Any of the four ways round counts -- an algorithm that wants the case held a
   quarter turn from where the book holds it is still that algorithm.

   And "solved" means what it means for that drill: a PLL has to leave the cube
   finished, an OLL only has to get the top face one colour, and an F2L only has
   to put its own pair home. Asking more than that would refuse algorithms that
   do exactly what the drill is for. */

const wholeCube = (end, solved) => same(end, solved, 'EDGES', everyIndex(solved, 'EDGES'))
  && same(end, solved, 'CORNERS', everyIndex(solved, 'CORNERS'));

const finished = {
  // A PLL is finished when the cube is finished -- but the last turn of the top
  // layer is not part of the algorithm, it is the thing you do afterwards
  // without thinking. So all four ways round count as solved.
  pll: (end, solved, Alg) => {
    let turned = end;
    const quarter = new Alg('U');
    for (let turn = 0; turn < 4; turn++) {
      if (wholeCube(turned, solved)) return true;
      turned = turned.applyAlg(quarter);
    }
    return false;
  },
  oll: (end) => TOP_CORNERS.every((i) => (end.patternData.CORNERS.orientation?.[i] ?? 0) === 0)
    && TOP_EDGES.every((i) => (end.patternData.EDGES.orientation?.[i] ?? 0) === 0),
  eo: (end) => TOP_EDGES.every((i) => (end.patternData.EDGES.orientation?.[i] ?? 0) === 0),
  f2l: (end, solved) => same(end, solved, 'CORNERS', [F2L_PAIR.corner])
    && same(end, solved, 'EDGES', [F2L_PAIR.edge])
};

finished.ocll = finished.oll;

/** What must not have moved while the algorithm did its work. */
const untouched = (end, solved, group) => (group === 'f2l'
  ? same(end, solved, 'CORNERS', F2L_KEEP.corners) && same(end, solved, 'EDGES', F2L_KEEP.edges)
  : same(end, solved, 'CORNERS', everyIndex(solved, 'CORNERS').filter((i) => !TOP_CORNERS.includes(i)))
    && same(end, solved, 'EDGES', everyIndex(solved, 'EDGES').filter((i) => !TOP_EDGES.includes(i))));

/**
 * Put the case up, do the moves, and say whether it came out.
 *
 * @returns {{ok: true, setup: string, turns: number} | {ok: false, why: string}}
 */
export function solvesCase(entry, moves, kpuzzle, Alg) {
  const done = finished[entry.group];
  if (!done) return { ok: false, why: 'unknown group' };

  let alg;
  let start;
  let setup;
  try {
    alg = new Alg(moves);
    setup = tidyMoves(new Alg(moves).invert().experimentalSimplify({ cancel: true }).toString());
    start = kpuzzle.defaultPattern().applyAlg(new Alg(entry.setup));
  } catch (error) {
    return { ok: false, why: `unreadable (${error.message})` };
  }

  const solved = kpuzzle.defaultPattern();
  let sawTheCube = false;

  for (const turn of AUF) {
    let end;
    try {
      end = start.applyAlg(new Alg(turn)).applyAlg(alg);
    } catch (error) {
      return { ok: false, why: `unreadable (${error.message})` };
    }
    if (!same(end, solved, 'CENTERS', everyIndex(solved, 'CENTERS'))) continue;
    sawTheCube = true;
    if (!untouched(end, solved, entry.group)) continue;
    if (done(end, solved, Alg)) {
      return { ok: true, setup, turns: moves.split(/\s+/).filter(Boolean).length };
    }
  }

  if (!sawTheCube) return { ok: false, why: 'it leaves the whole cube turned' };
  return { ok: false, why: 'it does not solve this case' };
}
