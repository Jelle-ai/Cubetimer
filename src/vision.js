// Finding a cube on the mat and saying what it can be proved not to be.
//
// Two things shape everything here. The first is that a camera never sees a
// whole cube: three faces at a corner, two at an edge, one straight on, and
// the hidden pieces may be cycled among themselves -- so tidiness proves
// nothing and mess proves a great deal. The second is that nobody should have
// to aim anything, so the cube is found rather than expected.

/* ---------- what a view can prove ----------

   Measured over the real cube (every one-move state, and thousands of
   scrambles, through every corner, edge and face view) rather than reasoned
   at: with this many faces in sight, one move away from solved never shows
   more than this many colours. More than that is therefore proof of at least
   two moves, whatever the hidden side is doing. */
const ONE_MOVE_AT_MOST = { 1: 2, 2: 4, 3: 5 };

/** Where a cube's three visible faces land inside the guide, as unit corners. */
const HEX = Array.from({ length: 6 }, (_, i) => {
  const angle = (-90 + i * 60) * Math.PI / 180;
  return [Math.cos(angle), Math.sin(angle)];
});

const MIDDLE = [0, 0];

// Each face is a rhombus, given as (top-left, top-right, bottom-right,
// bottom-left) so a 3x3 grid falls out of plain bilinear interpolation.
const FACE_CORNERS = [
  [HEX[5], HEX[0], HEX[1], MIDDLE],
  [MIDDLE, HEX[1], HEX[2], HEX[3]],
  [HEX[4], HEX[5], MIDDLE, HEX[3]]
];

const bilinear = ([tl, tr, br, bl], u, v) => {
  const topX = tl[0] + (tr[0] - tl[0]) * u;
  const topY = tl[1] + (tr[1] - tl[1]) * u;
  const bottomX = bl[0] + (br[0] - bl[0]) * u;
  const bottomY = bl[1] + (br[1] - bl[1]) * u;
  return [topX + (bottomX - topX) * v, topY + (bottomY - topY) * v];
};

/** The 27 places to look, in units of the guide's radius around its centre. */
export function samplePoints() {
  const points = [];
  FACE_CORNERS.forEach((corners, face) => {
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 3; column++) {
        const [x, y] = bilinear(corners, (column + 0.5) / 3, (row + 0.5) / 3);
        points.push({ face, row, column, x, y });
      }
    }
  });
  return points;
}

/* ---------- colour ---------- */

/**
 * Chromaticity: colour with the brightness divided out, so a sticker in shade
 * and the same sticker in the light land in the same place. Grey, white and
 * black all sit at the centre, which is exactly right here.
 */
function chroma([r, g, b]) {
  const total = r + g + b;
  return total < 24 ? null : [r / total, g / total];
}

const gap = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

const centreOf = (members) => [
  members.reduce((sum, m) => sum + m[0], 0) / members.length,
  members.reduce((sum, m) => sum + m[1], 0) / members.length
];

/** Widest distance between any two members -- what a cluster may not exceed. */
function spread(members) {
  let widest = 0;
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) widest = Math.max(widest, gap(members[i], members[j]));
  }
  return widest;
}

/**
 * Which readings are the same colour as which, and how many colours there are.
 * Nothing is named: the state of a cube depends on which stickers match each
 * other, not on what colour they are, and asking the easier question is what
 * carries it through a warm lamp, a cool window or a dim room.
 *
 * How many colours are in front of the lens is not assumed either. The readings
 * merge a pair at a time, cheapest first, and the count comes from where that
 * turns expensive: two halves of one face join for almost nothing, red and
 * orange cost a great deal. A fixed threshold was tried first and had to go --
 * under noise it split one face into two tidy, well-separated groups, and
 * nothing in the arithmetic knew better.
 *
 * Two kinds of certainty come back, because two different questions get asked
 * of this. Counting the colours only needs the number of groups to be right,
 * which is what the jump says. Reading the pattern on a face needs every single
 * sticker to be in the right group, which is a far higher bar -- and one that
 * red beside orange will always make hard. Holding the count to that bar is
 * what made a plainly scrambled cube come back as "not sure".
 *
 * @returns {{labels: number[], colours: number, clarity: number, separation: number}|null}
 */
/**
 * Join the closest two groups over and over, and keep what every count along
 * the way looked like. Cheapest pair first, so two halves of one face join for
 * almost nothing while red and orange cost a great deal.
 */
function merge(points) {
  let groups = points.map((_, index) => [index]);
  const steps = [];

  while (groups.length > 2) {
    let best = null;
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const width = spread([...groups[i], ...groups[j]].map((k) => points[k]));
        if (best === null || width < best.width) best = { i, j, width };
      }
    }
    groups = groups.filter((_, index) => index !== best.i && index !== best.j)
      .concat([[...groups[best.i], ...groups[best.j]]]);
    steps[groups.length] = { groups: groups.map((g) => g.slice()), cost: best.width };
  }
  return steps;
}

export function classify(samples, mostColours = 6) {
  const brightness = samples.map(([r, g, b]) => (r + g + b) / 3).sort((a, b) => a - b);
  if (samples.length < 6 || brightness[brightness.length >> 1] < 46) return null;

  const points = samples.map(chroma);
  if (points.some((p) => p === null)) return null;

  const steps = merge(points);

  let choice = null;
  for (let k = 1; k <= mostColours; k++) {
    if (!steps[k] || !steps[k - 1]) continue;
    const jump = steps[k - 1].cost / Math.max(steps[k].cost, 0.004);
    if (choice === null || jump > choice.jump) choice = { k, jump, groups: steps[k].groups };
  }
  if (!choice) return null;

  const centres = choice.groups.map((group) => centreOf(group.map((k) => points[k])));
  const labels = new Array(points.length);
  choice.groups.forEach((group, g) => { for (const k of group) labels[k] = g; });

  let worst = 1;
  points.forEach((point, index) => {
    const own = labels[index];
    const mine = gap(point, centres[own]);
    let nearest = Infinity;
    centres.forEach((centre, g) => { if (g !== own) nearest = Math.min(nearest, gap(point, centre)); });
    if (!Number.isFinite(nearest)) return;
    worst = Math.min(worst, (nearest - mine) / (nearest + mine));
  });

  return {
    labels,
    colours: choice.k,
    clarity: Math.max(0, Math.min(1, (choice.jump - 1.6) / 2.4)),
    separation: Math.max(0, Math.min(1, worst / 0.45))
  };
}

/* ---------- finding the cube ----------

   Looking for whatever is busiest was the first attempt and it had the failure
   the wrong way round: a solved cube is the calmest thing on the mat, so the
   one case that must never go wrong was the one it could not see at all.

   What is used instead costs nothing and is exact. While a solve is running the
   cube is in your hands, so the mat is empty -- frames taken during the solve
   are a picture of the mat with no cube on it. Take the median of a handful of
   them and passing hands wash out. Whatever is different afterwards is the
   cube. */

const GRID = 96;          // the frame is looked at this coarsely while searching

/** Average colour per cell of a coarse grid over the frame. */
export function coarse(image) {
  const cells = new Float32Array(GRID * GRID * 3);
  const stepX = image.width / GRID;
  const stepY = image.height / GRID;

  for (let cy = 0; cy < GRID; cy++) {
    for (let cx = 0; cx < GRID; cx++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      const x0 = Math.floor(cx * stepX);
      const y0 = Math.floor(cy * stepY);
      for (let y = y0; y < Math.min(image.height, y0 + stepY); y += 2) {
        for (let x = x0; x < Math.min(image.width, x0 + stepX); x += 2) {
          const at = (y * image.width + x) * 4;
          r += image.data[at];
          g += image.data[at + 1];
          b += image.data[at + 2];
          n++;
        }
      }
      const at = (cy * GRID + cx) * 3;
      cells[at] = n ? r / n : 0;
      cells[at + 1] = n ? g / n : 0;
      cells[at + 2] = n ? b / n : 0;
    }
  }
  return cells;
}

/** Per cell, the middle value of every frame taken while the mat was empty. */
export function reference(frames) {
  if (!frames.length) return null;
  const cells = new Float32Array(GRID * GRID * 3);
  const column = new Array(frames.length);

  for (let i = 0; i < cells.length; i++) {
    for (let f = 0; f < frames.length; f++) column[f] = frames[f][i];
    column.sort((a, b) => a - b);
    cells[i] = column[column.length >> 1];
  }
  return cells;
}

/** Grow the mask and then shrink it back, to fill in the gaps. */
function close(mask, times = 2) {
  let current = mask;
  for (const grow of [true, false]) {
    for (let round = 0; round < times; round++) {
      const next = new Uint8Array(current.length);
      for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
          let any = false;
          let all = true;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ny = Math.min(GRID - 1, Math.max(0, y + dy));
              const nx = Math.min(GRID - 1, Math.max(0, x + dx));
              if (current[ny * GRID + nx]) any = true; else all = false;
            }
          }
          next[y * GRID + x] = grow ? (any ? 1 : 0) : (all ? 1 : 0);
        }
      }
      current = next;
    }
  }
  return current;
}

/**
 * Two thresholds instead of one: cells well above `high` are the cube for
 * certain, and anything above `low` that touches them joins in.
 *
 * One threshold is what broke a scrambled cube on a blue mat. A single white
 * sticker sets the ceiling, the ceiling sets the threshold, and every blue
 * sticker -- which on a blue mat barely differs from the mat at all -- falls
 * under it. The silhouette then comes apart into pieces, and the biggest piece
 * is a corner of a cube rather than a cube: too small to read, or too odd a
 * shape to accept. A solved cube showing white, red and green has no such
 * sticker and sailed through, which is exactly the difference that was being
 * reported.
 */
function hysteresis(change, high, low) {
  const mask = new Uint8Array(change.length);
  const queue = [];
  for (let at = 0; at < change.length; at++) {
    if (change[at] > high) { mask[at] = 1; queue.push(at); }
  }

  while (queue.length) {
    const at = queue.pop();
    const y = Math.floor(at / GRID);
    const x = at % GRID;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
      const next = ny * GRID + nx;
      if (!mask[next] && change[next] > low) { mask[next] = 1; queue.push(next); }
    }
  }
  return mask;
}

/**
 * Anything enclosed by the shape is part of it. A sticker the same colour as
 * the mat leaves a hole no threshold can help with -- there is nothing there to
 * find -- but a cube has no windows, so a hole in the middle of one is a
 * sticker that went missing rather than a gap in the cube.
 */
function fillHoles(cells) {
  const mask = new Uint8Array(GRID * GRID);
  for (const at of cells) mask[at] = 1;

  // Flood the outside in from the border; what the flood never reaches and is
  // not already the shape is enclosed by it.
  const outside = new Uint8Array(mask.length);
  const queue = [];
  for (let i = 0; i < GRID; i++) {
    for (const at of [i, (GRID - 1) * GRID + i, i * GRID, i * GRID + GRID - 1]) {
      if (!mask[at] && !outside[at]) { outside[at] = 1; queue.push(at); }
    }
  }

  while (queue.length) {
    const at = queue.pop();
    const y = Math.floor(at / GRID);
    const x = at % GRID;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
      const next = ny * GRID + nx;
      if (!mask[next] && !outside[next]) { outside[next] = 1; queue.push(next); }
    }
  }

  const whole = [];
  for (let at = 0; at < mask.length; at++) {
    if (mask[at] || !outside[at]) whole.push(at);
  }
  return whole;
}

/** The biggest run of touching cells. */
function largestBlob(mask) {
  const seen = new Uint8Array(mask.length);
  let best = null;

  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue;
    const cells = [];
    const queue = [start];
    seen[start] = 1;

    while (queue.length) {
      const at = queue.pop();
      cells.push(at);
      const y = Math.floor(at / GRID);
      const x = at % GRID;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
        const next = ny * GRID + nx;
        if (mask[next] && !seen[next]) { seen[next] = 1; queue.push(next); }
      }
    }
    if (!best || cells.length > best.length) best = cells;
  }
  return best;
}

/** How far one cell's colour is from another's, brightness and hue together. */
function differs(cells, other, at) {
  const a = [cells[at * 3], cells[at * 3 + 1], cells[at * 3 + 2]];
  const b = [other[at * 3], other[at * 3 + 1], other[at * 3 + 2]];
  const brightness = Math.abs((a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2])) / 3;
  const ca = chroma(a);
  const cb = chroma(b);
  const hue = ca && cb ? gap(ca, cb) : 0;
  return brightness / 255 + hue * 2.2;
}

/**
 * Where the cube is, as a share of the frame.
 *
 * @param {ImageData} image
 * @param {Float32Array|null} empty the mat with nothing on it
 */
export function findCube(image, empty, shape = null) {
  const grid = coarse(image);
  const cells = grid;
  if (!empty) return null; // without a picture of the empty mat there is nothing to compare to

  const change = new Float32Array(GRID * GRID);
  let ceiling = 0;
  for (let at = 0; at < change.length; at++) {
    // Outside the mat nothing counts, however much it changed. A hand landing
    // on the desk beside the mat is a change like any other, and without this
    // it is a bigger and more convincing one than the cube.
    if (shape && !within(shape, ((at % GRID) + 0.5) / GRID, (Math.floor(at / GRID) + 0.5) / GRID)) continue;
    change[at] = differs(cells, empty, at);
    ceiling = Math.max(ceiling, change[at]);
  }
  if (ceiling < 0.12) return null; // nothing arrived on the mat

  const mask = hysteresis(change, Math.max(0.09, ceiling * 0.35), Math.max(0.05, ceiling * 0.12));

  const found = largestBlob(close(mask));
  if (!found || found.length < 60) return null; // too small to read nine stickers off
  const blob = fillHoles(found);

  const filled = new Uint8Array(change.length);
  for (const at of blob) filled[at] = 1;

  let left = GRID;
  let top = GRID;
  let right = 0;
  let bottom = 0;
  for (const at of blob) {
    const y = Math.floor(at / GRID);
    const x = at % GRID;
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }

  const width = right - left + 1;
  const height = bottom - top + 1;

  // A cube is roughly as wide as it is tall and fills most of its own box. A
  // hand reaching in, or a hand and a cube together, is neither -- which is how
  // one gets turned away rather than read as a very colourful cube.
  const squareness = Math.min(width, height) / Math.max(width, height);
  const fill = blob.length / (width * height);
  if (squareness < 0.62 || fill < 0.62) {
    return { rejected: true, squareness, fill, mask: filled, left, top, right, bottom,
      x: (left + right + 1) / 2 / GRID, y: (top + bottom + 1) / 2 / GRID,
      radius: Math.min(width, height) / 2 / GRID };
  }

  return {
    cells: blob,
    grid,
    mask: filled,
    left,
    top,
    right,
    bottom,
    squareness,
    fill,
    x: (left + right + 1) / 2 / GRID,
    y: (top + bottom + 1) / 2 / GRID,
    // The guide is measured from the centre out, so half the smaller side.
    radius: Math.min(width, height) / 2 / GRID
  };
}

/* ---------- fitting the faces over it ----------

   A regular hexagon was the first attempt and it is right for exactly one
   camera angle: dead isometric, 35.26 degrees above the mat. At any other
   height the silhouette is a longer or flatter hexagon, and rhombi cut from a
   regular one run across stickers instead of along the seams -- which read a
   solved cube as several colours and called it a DNF with every confidence.

   So the silhouette's own six corners are used. Under a parallel projection a
   cube's outline is the sum of three edge vectors, which puts its corners at
   P+a, P+a+b, P+b, P+b+c, P+c, P+c+a for the near corner P. Every other one of
   them is therefore a diagonal of one visible face, and P falls out of any
   three in a row: P = q0 + q2 - q1. Three of those, and they should agree. */

/** Convex hull of a set of points, counter-clockwise. */
function hull(points) {
  const sorted = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (sorted.length < 3) return sorted;

  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list) => {
    const out = [];
    for (const point of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], point) <= 0) out.pop();
      out.push(point);
    }
    out.pop();
    return out;
  };
  return [...half(sorted), ...half(sorted.reverse())];
}

const triangle = (a, b, c) =>
  Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;

/** Cut a convex outline down to n corners, dropping the least of it each time. */
function reduceTo(polygon, n) {
  let corners = polygon.slice();
  while (corners.length > n) {
    let worst = 0;
    let least = Infinity;
    for (let i = 0; i < corners.length; i++) {
      const loss = triangle(
        corners[(i - 1 + corners.length) % corners.length],
        corners[i],
        corners[(i + 1) % corners.length]
      );
      if (loss < least) { least = loss; worst = i; }
    }
    corners.splice(worst, 1);
  }
  return corners;
}

/**
 * The near corner and the three faces around it, straight off the silhouette.
 * @returns {{middle: number[], faces: number[][][], agreement: number}|null}
 */
export function fitFaces(found) {
  const edge = [];
  for (const at of found.cells) {
    const y = Math.floor(at / GRID);
    const x = at % GRID;
    if (x === 0 || y === 0 || x === GRID - 1 || y === GRID - 1
      || !found.mask[(y - 1) * GRID + x] || !found.mask[(y + 1) * GRID + x]
      || !found.mask[y * GRID + x - 1] || !found.mask[y * GRID + x + 1]) {
      edge.push([(x + 0.5) / GRID, (y + 0.5) / GRID]);
    }
  }
  if (edge.length < 12) return null;

  const outline = reduceTo(hull(edge), 6);
  if (outline.length < 6) return null;

  // Either every other corner is a face diagonal, or the ones in between are.
  // The right choice is the one whose three answers for the near corner agree.
  let best = null;
  for (const parity of [0, 1]) {
    const q = [0, 1, 2, 3, 4, 5].map((i) => outline[(i + parity) % 6]);
    const guesses = [0, 2, 4].map((i) => [
      q[i][0] + q[(i + 2) % 6][0] - q[(i + 1) % 6][0],
      q[i][1] + q[(i + 2) % 6][1] - q[(i + 1) % 6][1]
    ]);
    const middle = [
      guesses.reduce((sum, g) => sum + g[0], 0) / 3,
      guesses.reduce((sum, g) => sum + g[1], 0) / 3
    ];
    const scatter = Math.max(...guesses.map((g) => Math.hypot(g[0] - middle[0], g[1] - middle[1])));
    if (!best || scatter < best.scatter) {
      best = {
        scatter,
        middle,
        faces: [0, 2, 4].map((i) => [middle, q[i], q[(i + 1) % 6], q[(i + 2) % 6]])
      };
    }
  }

  // Scattered answers mean it is not a cube corner in view at all.
  return { ...best, agreement: Math.max(0, 1 - best.scatter / (found.radius * 0.5)) };
}

/* ---------- reading ---------- *//* ---------- reading ---------- */

/** Median of a small patch, which shrugs off a speck of glare or a seam. */
function patch(image, cx, cy, radius) {
  const reds = [];
  const greens = [];
  const blues = [];

  for (let y = Math.max(0, cy - radius); y <= Math.min(image.height - 1, cy + radius); y++) {
    for (let x = Math.max(0, cx - radius); x <= Math.min(image.width - 1, cx + radius); x++) {
      const at = (y * image.width + x) * 4;
      reds.push(image.data[at]);
      greens.push(image.data[at + 1]);
      blues.push(image.data[at + 2]);
    }
  }
  if (!reds.length) return null;
  const middle = (list) => list.sort((a, b) => a - b)[list.length >> 1];
  return [middle(reds), middle(greens), middle(blues)];
}

const inside = (found, x, y) => {
  const cx = Math.round(x * GRID);
  const cy = Math.round(y * GRID);
  if (cx < 0 || cy < 0 || cx >= GRID || cy >= GRID) return false;
  return found.mask[cy * GRID + cx] === 1;
};

/**
 * What one face looks like, as one of three things.
 *
 * Counted rather than placed: nine stickers, how many of each colour. A single
 * turn leaves every face of the cube either all one colour or six of its own
 * and three of one other -- checked against the real cube over every one-move
 * state, all 108 faces, without exception. So a face that is neither is proof
 * of at least two moves, from one face alone, with no need to see any other and
 * no need to know which way up it is.
 */
export function faceShape(face) {
  const tally = new Map();
  for (const colour of face) tally.set(colour, (tally.get(colour) || 0) + 1);
  const counts = [...tally.values()].sort((a, b) => b - a);

  if (counts.length === 1) return 'uniform';
  if (counts.length === 2 && counts[0] === 6 && counts[1] === 3) return 'strip';
  return 'messy';
}

/**
 * How sure the count has to be. Raising it further was measured and barely
 * helps: the readings that go wrong go wrong confidently, so the bar buys
 * almost nothing and costs most of what it does catch.
 */
export const CERTAIN = 0.6;

/**
 * How far in from the silhouette's edge a cell has to be. Two for reading the
 * patches, three for the older colour count -- which samples far fewer places
 * and so cannot afford a single one of them landing on the rim.
 */
const PATCH_MARGIN = 2;
const SAMPLE_MARGIN = 3;

/** A cube has six colours, and the patch reading wants all of them. */
export const ALL_SIX = 6;

/** Wide enough, in pixels, for nine stickers to be worth reading at all. */
const READ_AT = 56;

/** And wide enough for what comes out to be worth acting on. */
const JUDGE_AT = 180;


/**
 * Look at one frame and say only what it can stand behind.
 *
 * @returns {{verdict: 'none'|'+2'|'DNF', state: string, faces: number, colours: number,
 *   confidence: number, found: object|null}}
 */
/**
 * Look at one frame and say only what it can stand behind.
 *
 * What it does NOT do, after being built and measured and thrown away: read the
 * nine stickers of each face and judge their pattern. That is the natural way
 * to think about it -- one face off in a stripe is a +2, a face with colours
 * all over it is a DNF -- and it is exactly right about cubes. It is reading
 * them off a photograph that fails. Placing a three-by-three grid on a face
 * needs the cube's corner found to within a few pixels, and swept over 162
 * camera positions (height 24 to 42 degrees, three angles round, three
 * tilts) that grid slipped often enough to hand out 31 penalties on cubes that
 * were solved. One in five. No amount of certainty about the colours helps when
 * the grid is on the wrong stickers.
 *
 * So the faces are not divided up at all. The cube is sampled all over and the
 * colours are counted, which asks far less of the geometry -- a sample that
 * lands slightly off is still on the cube, and one colour more or less does not
 * follow from a grid being a few pixels out. And counting is enough for the
 * half of the question that matters most: five is the most a cube one move from
 * solved can show from three faces, measured over every one-move state through
 * every corner, so six is proof of at least two moves whatever the hidden side
 * is doing.
 *
 * The cost is the other half. A +2 cannot be told from a solved cube this way,
 * and is left alone.
 *
 * The same measurement settles the bigger question, which is whether the camera
 * could check that the cube on the mat is actually the scramble it was given.
 * It cannot. Reading a scramble means getting all 27 visible stickers right at
 * once. Placed on the cube corner that fitFaces finds, over 60 random scrambles
 * and nine camera positions, and scored with the most generous face assignment
 * available -- every rotation and both windings tried, the best kept -- 46% of
 * stickers came back right, and not once did all 27. The best single reading
 * managed 18. So scramble checking, and everything built on it (a competition
 * mode that verifies before it times, an inspection watch that can tell a turn
 * from a handling), is not something this pipeline can do, and none of it is
 * here. The failure is geometric, not chromatic: the colours are read fine, the
 * grid is simply not on the right stickers.
 *
 * @returns {{verdict: 'none'|'DNF', state: string, faces: number, colours: number,
 *   confidence: number, found: object|null}}
 */
/**
 * How many patches mean what. A solved cube shows one unbroken patch per
 * visible face, so three at a corner and fewer edge-on. One quarter turn lays a
 * stripe of another colour across two of them, which is four or five. Anything
 * beyond that is more than one move.
 *
 * Reading it this way round is deliberately deaf rather than wrong: a cube
 * showing only two faces can hide a turn and come back as three patches, and a
 * missed penalty is a far better mistake than one invented out of a bad angle.
 */
function fromPatches(count) {
  if (count <= 3) return { verdict: 'none', state: 'niets te zien' };
  if (count <= 5) return { verdict: '+2', state: 'een zet ernaast' };
  return { verdict: 'DNF', state: 'meer dan een zet' };
}

/**
 * @param {[number, number][]} [references] the colours of this cube's own
 * stickers, learned from it once. With them the reading is about where the
 * colours lie; without them it can only count how many there are.
 */
export function inspectFrame(image, empty, shape = null, references = null) {
  const found = findCube(image, empty, shape);
  if (!found) return { verdict: 'none', state: 'geen kubus', faces: 0, colours: 0, confidence: 0, found: null };
  if (found.rejected) {
    return { verdict: 'none', state: 'geen kubusvorm', faces: 0, colours: 0, confidence: 0, found };
  }

  if (found.left === 0 || found.top === 0 || found.right === GRID - 1 || found.bottom === GRID - 1) {
    return { verdict: 'none', state: 'niet volledig in beeld', faces: 0, colours: 0, confidence: 0, found };
  }

  // Pixels the camera really saw: a grab is never blown up past the source, so
  // this is a count and not an estimate.
  const side = Math.min(image.width, image.height);
  const across = found.radius * 2 * side;

  // Nine stickers need to come out about six pixels each to be worth reading.
  // This used to ask for ten, which on a camera taking in a whole mat is a cube
  // filling a fifth of the picture -- more than anyone's ever does.
  if (across < READ_AT) {
    return { verdict: 'none', state: 'te klein in beeld', faces: 0, colours: 0, confidence: 0, found };
  }

  const base = { found, faces: 0, colours: 0, confidence: 0 };

  // Well inside, not merely inside. A slanted silhouette edge on a coarse grid
  // keeps a sliver of mat in the cells along it, and mat sampled as if it were
  // a sticker is a whole extra colour -- which on a solved cube is the
  // difference between three and four.
  const inner = [];
  const clear = (x, y) => {
    for (let dy = -SAMPLE_MARGIN; dy <= SAMPLE_MARGIN; dy++) {
      for (let dx = -SAMPLE_MARGIN; dx <= SAMPLE_MARGIN; dx++) {
        const ny = y + dy;
        const nx = x + dx;
        if (ny < 0 || nx < 0 || ny >= GRID || nx >= GRID || !found.mask[ny * GRID + nx]) return false;
      }
    }
    return true;
  };
  for (let y = found.top; y <= found.bottom; y++) {
    for (let x = found.left; x <= found.right; x++) {
      if (clear(x, y)) inner.push([(x + 0.5) / GRID, (y + 0.5) / GRID]);
    }
  }
  if (inner.length < 24) return { verdict: 'none', state: 'te weinig zicht', ...base };

  const step = Math.max(1, Math.floor(inner.length / 48));
  const picked = inner.filter((_, i) => i % step === 0).slice(0, 48);
  const size = Math.max(2, Math.round(across / 9 * 0.2));
  const colours = picked
    .map(([x, y]) => patch(image, Math.round(x * image.width), Math.round(y * image.height), size))
    .filter(Boolean);
  if (colours.length < 20) return { verdict: 'none', state: 'niet leesbaar', ...base };

  // Drop the ones that landed on a seam rather than a sticker.
  const brightness = colours.map(([r, g, b]) => (r + g + b) / 3);
  const middleBright = brightness.slice().sort((a, b) => a - b)[brightness.length >> 1];
  const lit = colours.filter((_, i) => brightness[i] >= middleBright * 0.55);
  if (lit.length < 18) return { verdict: 'none', state: 'niet leesbaar', ...base };

  // With this cube's own colours in hand, the patches say it outright. All six
  // of them, though: taught only half, a face it has never seen snaps to
  // whichever taught colour is least unlike it, and a solved cube comes apart
  // into patches that were never there.
  if (references?.length >= ALL_SIX) {
    const spread = patches(found, references, { margin: PATCH_MARGIN });
    if (!spread) return { verdict: 'none', state: 'niet leesbaar', ...base };
    if (spread.read < 0.55) return { verdict: 'none', state: 'kleuren kloppen niet', ...base, colours: spread.colours };

    const called = fromPatches(spread.patches);
    return {
      ...called,
      found,
      faces: 3,
      colours: spread.colours,
      patches: spread.patches,
      // How much of the cube every cell could be placed on a known colour. A
      // cube read cleanly leaves almost nothing over.
      confidence: Math.max(0, Math.min(1, (spread.read - 0.55) / 0.35))
    };
  }

  const grouped = classify(lit);
  if (!grouped) return { verdict: 'none', state: 'niet leesbaar', ...base };

  const now = { found, faces: 3, colours: grouped.colours, confidence: grouped.clarity };

  // Only the count is being trusted, and the count only needs the number of
  // groups to be right -- which is what clarity measures. Whether any one
  // sticker is in the right group does not come into it.
  if (grouped.clarity < 0.6) return { verdict: 'none', state: 'niet zeker genoeg', ...now };
  if (grouped.colours <= ONE_MOVE_AT_MOST[3]) return { verdict: 'none', state: 'niets te bewijzen', ...now };

  // Big enough to read is not big enough to accuse. Swept over three mats,
  // five cube sizes and nine camera angles, a cube 200 pixels across is never
  // once wrong about a solved cube; at 140 it is wrong six times in
  // twenty-seven. The signal is the same either way -- the samples are simply
  // too few pixels each to hold their colour, and the grouping splits three
  // colours into six with every appearance of confidence. So it reads, and
  // says what it sees, and keeps its opinion to itself.
  if (across < JUDGE_AT) return { verdict: 'none', state: 'te klein om te oordelen', ...now };
  return { verdict: 'DNF', state: 'meer dan een zet', ...now };
}

/* ---------- how the colours lie, not just how many ----------

   Counting colours throws away the thing that actually distinguishes a solved
   cube: not that there are three, but that each one is a single unbroken patch
   filling its own face. One quarter turn puts a stripe of another colour across
   two faces, so a cube one move out has five patches even when it still only
   shows five colours -- and a scrambled one has twenty.

   Counting patches instead of colours also survives the failure that has cost
   the most: noise splitting one face into two well-separated groups. Split it
   how you like, the cells are still where they were, and two halves of one face
   that touch are one patch. */

/**
 * The colours of the faces in front of the lens right now, as chromaticity.
 *
 * Meant for a solved cube on the mat: what comes back is up to three of the six
 * colours of this particular cube, under this particular light. Turn it over
 * and ask again for the other three.
 *
 * @returns {{colours: [number, number][], spread: number}|null}
 */
export function learnColours(found, { faces = 3, margin = 2 } = {}) {
  if (!found?.grid) return null;

  const inside = interior(found, margin);
  const points = [];
  for (let at = 0; at < inside.length; at++) {
    if (!inside[at]) continue;
    const point = chroma([found.grid[at * 3], found.grid[at * 3 + 1], found.grid[at * 3 + 2]]);
    if (point) points.push(point);
  }
  if (points.length < 60) return null;

  // A few hundred is plenty and the merging is quadratic in what it is given.
  const step = Math.ceil(points.length / 160);
  const taken = points.filter((_, index) => index % step === 0);

  const steps = merge(taken);
  const chosen = steps[faces] || steps[2];
  if (!chosen) return null;

  return {
    colours: chosen.groups.map((group) => centreOf(group.map((k) => taken[k]))),
    // How tight the tightest group is: a solved cube's faces should be tight,
    // and anything loose means this was not a solved cube.
    spread: Math.max(...chosen.groups.map((group) => spread(group.map((k) => taken[k]))))
  };
}

/** Cells of the silhouette that are well clear of its edge. */
function interior(found, margin) {
  const inside = new Uint8Array(GRID * GRID);
  for (let y = found.top; y <= found.bottom; y++) {
    for (let x = found.left; x <= found.right; x++) {
      let clear = true;
      for (let dy = -margin; dy <= margin && clear; dy++) {
        for (let dx = -margin; dx <= margin && clear; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny < 0 || nx < 0 || ny >= GRID || nx >= GRID || !found.mask[ny * GRID + nx]) clear = false;
        }
      }
      if (clear) inside[y * GRID + x] = 1;
    }
  }
  return inside;
}

/**
 * Every cell of the cube given the label of the reference colour nearest to it,
 * and then the patches those labels make.
 *
 * @param {[number, number][]} references chromaticities of this cube's own
 * stickers, learned once from the cube itself.
 * @param {number} tolerance how far a cell may sit from every reference before
 * it is treated as a seam or a shadow and left out.
 */
export function patches(found, references, { margin = 2, tolerance = 0.055, part = 1 / 20 } = {}) {
  if (!found?.grid || !references?.length) return null;

  const inside = interior(found, margin);
  const label = new Int8Array(GRID * GRID).fill(-1);
  let counted = 0;
  let stray = 0;

  for (let at = 0; at < inside.length; at++) {
    if (!inside[at]) continue;
    const point = chroma([found.grid[at * 3], found.grid[at * 3 + 1], found.grid[at * 3 + 2]]);
    if (!point) { stray++; continue; }

    let best = -1;
    let closest = Infinity;
    references.forEach((reference, index) => {
      const distance = gap(point, reference);
      if (distance < closest) { closest = distance; best = index; }
    });
    if (closest > tolerance) { stray++; continue; }
    label[at] = best;
    counted++;
  }

  if (counted < 40) return null;

  // The black seams between stickers match no colour, so they are left out --
  // and they run right between the nine stickers of a face, which turns one
  // patch into nine. Nothing has changed colour there, so the gaps are closed
  // by handing each one the label most of its neighbours carry. A face becomes
  // one patch again; two different faces meeting do not, because the seam
  // between them has a different colour on either side.
  for (let round = 0; round < 3; round++) {
    const filled = [];
    for (let at = 0; at < label.length; at++) {
      if (label[at] >= 0 || !inside[at]) continue;
      const votes = new Map();
      const y = Math.floor(at / GRID);
      const x = at % GRID;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
        const near = label[ny * GRID + nx];
        if (near >= 0) votes.set(near, (votes.get(near) || 0) + 1);
      }
      if (!votes.size) continue;
      let winner = -1;
      let most = 0;
      for (const [value, count] of votes) if (count > most) { most = count; winner = value; }
      filled.push([at, winner]);
    }
    if (!filled.length) break;
    for (const [at, value] of filled) label[at] = value;
  }

  // Patches: runs of touching cells carrying the same label. Anything smaller
  // than a fraction of a sticker is a seam caught between two of them.
  const floor = Math.max(6, Math.round(counted * part));
  const seen = new Uint8Array(label.length);
  const sizes = [];

  for (let start = 0; start < label.length; start++) {
    if (label[start] < 0 || seen[start]) continue;
    const mine = label[start];
    const queue = [start];
    seen[start] = 1;
    let size = 0;

    while (queue.length) {
      const at = queue.pop();
      size++;
      const y = Math.floor(at / GRID);
      const x = at % GRID;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
        const next = ny * GRID + nx;
        if (!seen[next] && label[next] === mine) { seen[next] = 1; queue.push(next); }
      }
    }
    sizes.push(size);
  }

  const big = sizes.filter((size) => size >= floor).sort((a, b) => b - a);
  return {
    patches: big.length,
    colours: new Set([...label].filter((value) => value >= 0)).size,
    sizes: big,
    /** How much of the cube the labels actually covered. */
    read: counted / (counted + stray)
  };
}

/* ---------- the camera ---------- */

/** The outline of what it is looking at, as an SVG path in a 0..1 box. */
/* ---------- which cube is this ----------

   Two cubes are two sets of six colours, and a cube's colours are the one thing
   about it a camera can read without needing to know where anything is. So the
   palette learned off the mat can simply be compared with the palettes of the
   cubes you have named.

   Measured on two realistic sheets -- a stickerless GAN and a stickered MoYu --
   over four lights (neutral, warm lamp, cool daylight, dim) and three angles.
   With the margins below applied: right 22 times, quiet twice, wrong never.
   The two it declined were both the stickered cube under cool daylight, where
   the light had pulled its palette a third of the way towards the other one.

   Quiet rather than wrong is the whole design. Filing your times under the
   wrong cube is worse than not knowing which cube it was, because you cannot
   see that it happened.

   What the measurement does not cover is two cubes of the same make, which
   would be two identical palettes and no answer at all. Hence the margin below:
   a guess is only offered when the nearest palette is clearly nearer than the
   next, and otherwise nothing is said. */

/** Near enough to be the same cube at all, after a change of light. */
const OWN_PALETTE = 0.05;

/**
 * And clearly nearer than the runner-up, or the two cubes are just alike.
 *
 * The flat part matters as much as the ratio: two cubes of the same make give
 * two identical palettes, and a ratio alone lets that through -- nought is
 * comfortably less than nought times anything. With the flat margin, identical
 * palettes fall to "will not say", which is the honest answer.
 */
const CLEARLY = 1.35;
const APART = 0.004;

/** How far one palette is from another: each colour to its nearest opposite. */
export function paletteGap(one, other) {
  if (!one?.length || !other?.length) return Infinity;
  let sum = 0;
  for (const colour of one) {
    let closest = Infinity;
    for (const known of other) {
      closest = Math.min(closest, Math.hypot(colour[0] - known[0], colour[1] - known[1]));
    }
    sum += closest;
  }
  return sum / one.length;
}

/**
 * Which of the named cubes this is, or null when it will not say.
 *
 * @param {[number, number][]} seen the palette read off the mat
 * @param {Record<string, [number, number][]>} kits the palettes you taught it
 * @returns {{name: string, gap: number, next: number}|null}
 */
export function whichCube(seen, kits) {
  const known = Object.entries(kits || {}).filter(([, palette]) => palette?.length >= 3);
  if (!seen?.length || known.length < 2) return null;

  const ranked = known
    .map(([name, palette]) => ({ name, gap: paletteGap(seen, palette) }))
    .sort((a, b) => a.gap - b.gap);

  const [nearest, next] = ranked;
  if (nearest.gap > OWN_PALETTE) return null;
  if (next.gap < nearest.gap * CLEARLY + APART) return null;
  return { name: nearest.name, gap: nearest.gap, next: next.gap };
}

export function foundPath(found) {
  if (!found) return '';
  if (!found.outline) {
    const box = [[found.left, found.top], [found.right + 1, found.top],
      [found.right + 1, found.bottom + 1], [found.left, found.bottom + 1]];
    return box.map(([x, y], i) => `${i ? 'L' : 'M'}${(x / 96).toFixed(4)} ${(y / 96).toFixed(4)}`).join(' ') + ' Z';
  }
  // The three faces it settled on, each drawn round.
  return found.outline.map((quad) =>
    quad.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(4)} ${y.toFixed(4)}`).join(' ') + ' Z'
  ).join(' ');
}

/**
 * The front camera, asked for in the strongest terms first.
 *
 * "ideal" is a wish, and Safari on an iPad grants it about as often as it feels
 * like -- which is why this kept opening the back one. So the exact constraint
 * goes first and the wish is only the fallback, with a bare request behind that
 * for anything with a single camera.
 */
const WISHES = [
  { label: 'voorcamera', video: { facingMode: { exact: 'user' }, width: { ideal: 1280 }, height: { ideal: 1280 } } },
  { label: 'voorcamera', video: { facingMode: 'user', width: { ideal: 1280 } } },
  { label: 'voorcamera', video: { facingMode: { ideal: 'user' } } },
  { label: 'enige camera', video: true }
];

/** Which camera the stream turned out to be, as the browser labels it. */
function describeStream(stream, wish) {
  const track = stream.getVideoTracks()[0];
  const facing = track?.getSettings?.().facingMode;
  if (facing === 'user') return 'voorcamera';
  if (facing === 'environment') return 'achtercamera';
  const name = (track?.label || '').toLowerCase();
  if (name.includes('front')) return 'voorcamera';
  if (name.includes('back') || name.includes('rear')) return 'achtercamera';
  return wish;
}

/**
 * Ask for a camera and hand back a way to grab one square frame.
 * @returns {Promise<{stream: MediaStream, which: string, grab: (size: number) => ImageData}>}
 */
/**
 * The whole of the picture, or as much of it as is square.
 *
 * A crop is four corners written in the coordinates of that square, and not of
 * the raw frame. That is on purpose: the square is exactly what the preview
 * shows, so the shape dragged over the preview and the pixels actually read
 * out are the same thing, on a wide camera as much as on a tall one.
 *
 * Four corners rather than a box because a camera looking at a mat from a
 * chair sees a trapezium. A box around that trapezium takes in the desk at two
 * of its corners, and a hand or a phone landing on that desk is a change on
 * the mat as far as anything downstream can tell.
 */
export const FULL_FRAME = { corners: [[0, 0], [1, 0], [1, 1], [0, 1]] };

/** The square of the frame a crop is taken from: the corners, boxed and squared. */
export function cropBox(crop) {
  const corners = crop?.corners || FULL_FRAME.corners;
  const xs = corners.map(([x]) => x);
  const ys = corners.map(([, y]) => y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  // Square, because everything downstream measures shapes on a square grid and
  // would read a stretched one as a stretched cube.
  const size = Math.min(1, Math.max(0.1, Math.max(Math.max(...xs) - left, Math.max(...ys) - top)));
  return {
    size,
    x: Math.min(Math.max((left + Math.max(...xs)) / 2, size / 2), 1 - size / 2),
    y: Math.min(Math.max((top + Math.max(...ys)) / 2, size / 2), 1 - size / 2)
  };
}

/** Those same corners, in the coordinates of the square that was taken. */
export function cropShape(crop) {
  const corners = crop?.corners || FULL_FRAME.corners;
  const { x, y, size } = cropBox(crop);
  return corners.map(([cx, cy]) => [(cx - (x - size / 2)) / size, (cy - (y - size / 2)) / size]);
}

/** Whether a point falls within a polygon -- the usual ray cast. */
function within(shape, x, y) {
  let odd = false;
  for (let i = 0, j = shape.length - 1; i < shape.length; j = i++) {
    const [xi, yi] = shape[i];
    const [xj, yj] = shape[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) odd = !odd;
  }
  return odd;
}

export async function openCamera(video) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Deze browser geeft geen toegang tot de camera.');

  let stream = null;
  let which = '';
  let last = null;
  for (const wish of WISHES) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ ...wish, label: undefined, audio: false });
      which = describeStream(stream, wish.label);
      break;
    } catch (error) {
      last = error;
      // A refusal is a refusal; only a constraint this device cannot meet is
      // worth trying the next wish for.
      if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') throw error;
    }
  }
  if (!stream) throw last || new Error('Geen camera gevonden.');

  video.srcObject = stream;
  // A refused autoplay is not a reason to give up: the frames still arrive, and
  // whether the preview animates is a separate question from whether the cube
  // can be read.
  await video.play().catch(() => {});

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });

  return {
    stream,
    which,
    /**
     * The smallest square of the picture holding the crop's four corners, at
     * the size asked for or the size the camera actually has, whichever is
     * smaller. What falls inside those corners is decided later, by whoever
     * reads the picture.
     *
     * Never bigger than the source, because every rule about how wide a cube
     * has to be is a rule about pixels the camera saw. Blowing a small patch
     * up to fill this picture would let a cube measure a comfortable 250
     * across while standing on 40 real ones, and every one of those rules
     * would then be reading invented detail.
     *
     * @param {{corners: [number, number][]}} [crop] in the coordinates of the
     * biggest centred square of the frame. Left out, it takes that whole square.
     */
    /** What the camera is handing over, as "1280x720". Changes when a tablet
        is turned round, which moves everything the crop was drawn against. */
    shape() {
      return `${video.videoWidth || 0}x${video.videoHeight || 0}`;
    },
    grab(size, crop = FULL_FRAME) {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return null;

      const box = cropBox(crop);
      const shorter = Math.min(width, height);
      const fromLeft = (width - shorter) / 2;   // the sides a wide camera loses
      const fromTop = (height - shorter) / 2;

      const side = Math.max(24, box.size * shorter);
      const room = shorter - side;
      const left = fromLeft + Math.min(Math.max(box.x * shorter - side / 2, 0), room);
      const top = fromTop + Math.min(Math.max(box.y * shorter - side / 2, 0), room);

      const out = Math.max(64, Math.round(Math.min(size, side)));
      canvas.width = out;
      canvas.height = out;
      context.drawImage(video, left, top, side, side, 0, 0, out, out);
      return context.getImageData(0, 0, out, out);
    }
  };
}

/**
 * Get the permission question over with, at the first touch of the page rather
 * than in the middle of a solve. Nothing is kept: the stream is closed the
 * moment it arrives, and all that is wanted is the browser's answer.
 */
export async function askForCamera() {
  if (!navigator.mediaDevices?.getUserMedia) return 'geen camera in deze browser';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'user' } }, audio: false });
    stream.getTracks().forEach((track) => track.stop());
    return 'toegestaan';
  } catch (error) {
    return error?.name === 'NotAllowedError' ? 'geweigerd' : `lukt niet: ${error?.name || error}`;
  }
}
