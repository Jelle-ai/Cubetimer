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
  f2l: { name: 'F2L', about: 'Het paar in de sleuf rechtsvoor. Alle 41 gevallen.' },
  oll: { name: 'OLL', about: 'De laatste laag in één keer geel maken. Alle 57 gevallen.' },
  pll: { name: 'PLL', about: 'De laatste laag rondzetten, alles ligt al goed gedraaid. 21 gevallen.' },
  eo: { name: 'Kruis maken', about: 'De eerste stap van OLL in twee kijkbeurten: het gele kruis.' },
  ocll: { name: 'Hoeken draaien', about: 'De tweede stap van OLL in twee kijkbeurten, met het kruis al gemaakt.' }
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
  [1, 'Paar boven', ["F' U F", "F' U2 F", "R U' R' F' U F"]],
  [2, 'Paar boven', ["R U R'", "R U' R' U' R U' R'", "F' U2 F U R U' R'"]],
  [3, 'Paar boven', ["R U' R'", "R U2 R'", "F' U' F R U' R'"]],
  [4, 'Paar boven', ["F' U' F", "R U2 R' U' F' U F", "F' U F U F' U F"]],
  [5, 'Paar boven', ["R U R' F' U' F", "F' U F U2 F' U' F", "F' U' F U' F' U F"]],
  [6, 'Paar boven', ["F' U' F R U R'", "R U R' U R U' R'", "R U' R' U2 R U R'"]],
  [7, 'Hoek boven, rand in de sleuf · rand omgekeerd', ["R U2 R' F' U' F", "R U' R' F' U2 F", "F' U2 F R U R'"]],
  [8, 'Hoek in de sleuf, rand boven · hoek gedraaid', ["F' U2 F R U2 R'", "F' U2 F U' R U' R'", "R U' R' U R U' R'"]],
  [9, 'Hoek in de sleuf, rand boven · hoek gedraaid', ["R U' R' F' U' F", "F' U' F U F' U' F", "F' U2 F U2 F' U' F"]],
  [10, 'Hoek in de sleuf, rand boven · hoek gedraaid', ["F' U F R U R'", "R U R' U' R U R'", "R U2 R' U2 R U R'"]],
  [11, 'Hoek in de sleuf, rand boven · hoek gedraaid', ["R U2 R' F' U2 F", "F' U F U' F' U F", "R U2 R' U F' U F"]],
  [12, 'Paar boven', ["F' U2 F U F' U' F", "F' U' F U2 R U' R' F' U' F", "R U' R' U2 R U' R' F' U' F"]],
  [13, 'Paar boven', ["R U2 R' U' R U R'", "F' U F R U' R' U' F' U' F", "F' U F R U R' U' F' U F"]],
  [14, 'Paar boven', ["R U2 R' U R U' R'", "R U2 R' U2 R U2 R'", "F' U F R U2 R' F' U' F"]],
  [15, 'Paar boven', ["F' U2 F U' F' U F", "F' U2 F U2 F' U2 F", "F' U' F R U R' F' U' F"]],
  [16, 'Paar boven', ["F' U2 F U' R U R'", "F' U2 F U' F' U' F R U R'", "F' U' F U F' U F R U R'"]],
  [17, 'Paar boven', ["R U' R' U R U R'", "F' U F U' R U2 R' F' U' F", "F' U F U2 R U' R' F' U2 F"]],
  [18, 'Paar boven', ["R U' R' U2 F' U' F", "F' U2 F U' R U R' F' U' F", "R U R' U2 R U R' F' U' F"]],
  [19, 'Paar boven', ["F' U2 F U2 F' U F", "F' U2 F U F' U2 F", "F' U2 F R U R' F' U2 F"]],
  [20, 'Paar boven', ["F' U F U' R U R'", "R U' R' U' R U R'", "R U R' U R U R'"]],
  [21, 'Paar boven', ["F' U' F U2 F' U F", "F' U' F U F' U2 F", "F' U' F R U R' F' U2 F"]],
  [22, 'Hoek boven, rand in de sleuf', ["F' U F U2 F' U F", "F' U F U F' U2 F", "R U2 R' U R U R'"]],
  [23, 'Hoek boven, rand in de sleuf · rand omgekeerd', ["F' U' F U R U' R'", "F' U' F U' R U R'", "F' U F U R U R'"]],
  [24, 'Paar boven', ["F' U F U2 R U R'", "R U2 R' U F' U' F R U R'", "F' U' F U2 F' U' F R U R'"]],
  [25, 'Paar boven', ["F' U F U' F' U' F", "R U R' U R U' R' F' U' F", "R U' R' U' R U2 R' F' U' F"]],
  [26, 'Paar boven', ["R U2 R' U F' U' F", "F' U F U' R U' R' F' U' F", "F' U2 F U' R U' R' F' U' F"]],
  [27, 'Paar boven', ["R U R' U2 R U' R'", "R U R' U' R U2 R'", "R U R' F' U' F R U2 R'"]],
  [28, 'Paar boven', ["F' U' F U' F' U' F", "F' U F U F' U' F", "R U' R' U F' U' F"]],
  [29, 'Paar boven', ["R U2 R' U2 R U' R'", "R U2 R' U' R U2 R'", "R U2 R' F' U' F R U2 R'"]],
  [30, 'Hoek boven, rand in de sleuf', ["F' U2 F U' F' U' F", "F' U' F U2 F' U' F", "R U' R' U2 R U' R'"]],
  [31, 'Hoek boven, rand in de sleuf · rand omgekeerd', ["R U' R' U' F' U' F", "R U R' U F' U' F", "R U R' U' F' U F"]],
  [32, 'Hoek in de sleuf, rand boven', ["F' U F U R U' R'", "F' U' F U R U R'", "F' U2 F U2 R U R'"]],
  [33, 'Hoek in de sleuf, rand boven', ["R U R' U' F' U' F", "R U2 R' U2 F' U' F", "R U' R' U' F' U F"]],
  [34, 'Paar boven', ["F' U' F R U2 R' F' U' F", "R U R' F' U F R U R'", "F' U' F U' R U' R' F' U2 F"]],
  [35, 'Paar boven', ["F' U' F R U' R' F' U' F", "R U R' F' U2 F R U R'", "R U' R' U' R U R' F' U' F"]],
  [36, 'Hoek boven, rand in de sleuf', ["F' U' F U' R U' R' F' U' F", "F' U F U' R U R' F' U' F", "F' U' F U R U R' F' U' F"]],
  [37, 'Allebei in de sleuf · hoek gedraaid en rand omgekeerd', ["F' U F U2 F' U' F R U R'", "F' U F R U' R' U2 R U R'", "R U' R' U F' U' F U' F' U' F"]],
  [38, 'Allebei in de sleuf · hoek gedraaid en rand omgekeerd', ["R U' R' U2 R U R' F' U' F", "R U' R' F' U F U2 F' U' F", "R U R' U' R U' R' U2 F' U' F"]],
  [39, 'Allebei in de sleuf · rand omgekeerd', ["R U2 R' U R U2 R' U F' U' F", "R U R' U2 R U2 R' U F' U' F", "R U' R' U F' U2 F U2 F' U F"]],
  [40, 'Allebei in de sleuf · hoek gedraaid', ["F' U2 F U' F' U F U' F' U' F", "F' U' F U2 F' U F U' F' U' F", "F' U F U' F' U2 F U' F' U F"]],
  [41, 'Allebei in de sleuf · hoek gedraaid', ["F' U' F U F' U2 F U F' U' F", "F' U2 F U2 F' U2 F U F' U' F", "F' U F U F' U' F U2 F' U F"]],
];

const F2L = F2L_SHAPES.map(([number, name, algs]) => ({
  id: `F2L ${number}`, group: 'f2l', kind: 'pair', name, algs
}));

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
  [21, 'Kruis · dubbele Sune', ["R U2 R' U' R U R' U' R U' R'", "F R U R' U' R U R' U' R U R' U' F'"]],
  [22, 'Kruis · Pi', "R U2 R2 U' R2 U' R2 U2 R"],
  [23, 'Kruis · koplampen', ["R2 D R' U2 R D' R' U2 R'", "R2 D' R U2 R' D R U2 R"]],
  [24, 'Kruis · T', ["r U R' U' r' F R F'", "x' R U R' D R U' R' D' x"]],
  [25, 'Kruis · strik', ["F' r U R' U' r' F R", "x' R U' R' D R U R' D' x"]],
  [26, 'Kruis · Antisune', "R U2 R' U' R U' R'"],
  [27, 'Kruis · Sune', ["R U R' U R U2 R'", "L U L' U L U2 L'"]],
  [28, 'Streep · stealth', "r U R' U' r' R U R U' R'"],
  [29, 'Streep · aap', "R U R' U' R U' R' F' U' F R U R'"],
  [30, 'Streep · kraan', "F R' F R2 U' R' U' R U R' F2"],
  [31, 'Streep · P links', "R' U' F U R U' R' F' R"],
  [32, 'Streep · P rechts', "L U F' U' L' U L F L'"],
  [33, 'Streep · sleutel', ["R U R' U' R' F R F'", "L' U' L U L F' L' F"]],
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
  [57, 'Kruis · H', ["R U R' U' M' U R U' r'", "M' U M' U M' U2 M U M U M U2"]]
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
  { id: 'Punt', group: 'eo', kind: 'edges', name: 'Punt', algs: ["F R U R' U' F' f R U R' U' f'"] },
  { id: 'Streep', group: 'eo', kind: 'edges', name: 'Streep', algs: ["F R U R' U' F'"] },
  { id: 'Haakje', group: 'eo', kind: 'edges', name: 'Haakje', algs: ["f R U R' U' f'"] },

  // --- two-look, second look: the corners. These are OLL 21 to 27 under the
  // names people actually use for them while learning two-look.
  { id: 'Sune', group: 'ocll', kind: 'corners', name: 'Sune', algs: ["R U R' U R U2 R'"] },
  { id: 'Antisune', group: 'ocll', kind: 'corners', name: 'Antisune', algs: ["R U2 R' U' R U' R'"] },
  { id: 'Pi', group: 'ocll', kind: 'corners', name: 'Pi', algs: ["R U2 R2 U' R2 U' R2 U2 R"] },
  { id: 'Kop', group: 'ocll', kind: 'corners', name: 'Koplampen', algs: ["R2 D R' U2 R D' R' U2 R'"] },
  { id: 'Dubbele Sune', group: 'ocll', kind: 'corners', name: 'Dubbele Sune', algs: ["R U R' U R U' R' U R U2 R'"] },
  { id: 'Strik', group: 'ocll', kind: 'corners', name: 'Strik', algs: ["F' r U R' U' r' F R"] },
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
    setup = new Alg(moves ?? entry.algs[0]).invert().experimentalSimplify({ cancel: true }).toString();
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

  // An F2L case is judged on a different promise: the cross and the other
  // three slots stay exactly where they are, the top layer may do what it
  // likes, and the pair itself must not already be home.
  if (entry.group === 'f2l') {
    if (!same(landed, solved, 'CORNERS', F2L_KEEP.corners)
      || !same(landed, solved, 'EDGES', F2L_KEEP.edges)) {
      return { ok: false, why: 'breekt het kruis of een andere sleuf' };
    }
    const corners = landed.patternData.CORNERS;
    const edges = landed.patternData.EDGES;
    const cornerHome = corners.pieces[F2L_PAIR.corner] === F2L_PAIR.corner
      && (corners.orientation?.[F2L_PAIR.corner] ?? 0) === 0;
    const edgeHome = edges.pieces[F2L_PAIR.edge] === F2L_PAIR.edge
      && (edges.orientation?.[F2L_PAIR.edge] ?? 0) === 0;
    if (cornerHome && edgeHome) return { ok: false, why: 'het paar staat al goed' };
    // Neither piece may have wandered out of the top layer or the slot.
    const cornerAt = corners.pieces.indexOf(F2L_PAIR.corner);
    const edgeAt = edges.pieces.indexOf(F2L_PAIR.edge);
    if (![0, 1, 2, 3, F2L_PAIR.corner].includes(cornerAt)) return { ok: false, why: 'de hoek belandt elders' };
    if (![0, 1, 2, 3, F2L_PAIR.edge].includes(edgeAt)) return { ok: false, why: 'de rand belandt elders' };
    return { ok: true, setup, pattern: landed };
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
    // OLL there is, and forty-one F2Ls is every F2L, so the sets are provably
    // complete rather than merely long.
    const mark = `${entry.group}/${caseSignature(verdict.pattern, entry.group, Alg)}`;
    const claimed = seen.get(mark);
    if (claimed) {
      dropped.push({ id: entry.id, why: `zelfde geval als ${claimed}` });
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
        dropped.push({ id: `${entry.id} · ${moves}`, why: 'lost een ander geval op' });
        continue;
      }
      // The same algorithm with a U at either end is not another way of doing
      // the case, it is the same way with the cube held differently -- and it
      // passes every other check, so it has to be caught by name.
      if (algs.some((known) => bareMoves(known.moves) === bareMoves(moves))) continue;
      algs.push({ moves, setup: tried.setup, turns: moves.split(/\s+/).filter(Boolean).length });
    }
    if (!algs.length) {
      dropped.push({ id: entry.id, why: 'geen bruikbaar algoritme' });
      continue;
    }

    cases.push({ ...entry, name: entry.name || entry.id, algs, setup: algs[0].setup });
  }
  return { cases, dropped };
}

/** A quarter turn of U before the case, so it does not always face you the same way. */
export const AUF = ['', 'U', 'U2', "U'"];
