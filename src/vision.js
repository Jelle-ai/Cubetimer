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
export function classify(samples, mostColours = 6) {
  const brightness = samples.map(([r, g, b]) => (r + g + b) / 3).sort((a, b) => a - b);
  if (samples.length < 6 || brightness[brightness.length >> 1] < 46) return null;

  const points = samples.map(chroma);
  if (points.some((p) => p === null)) return null;

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
export function findCube(image, empty) {
  const cells = coarse(image);
  if (!empty) return null; // without a picture of the empty mat there is nothing to compare to

  const change = new Float32Array(GRID * GRID);
  let ceiling = 0;
  for (let at = 0; at < change.length; at++) {
    change[at] = differs(cells, empty, at);
    ceiling = Math.max(ceiling, change[at]);
  }
  if (ceiling < 0.12) return null; // nothing arrived on the mat

  const mask = new Uint8Array(change.length);
  for (let at = 0; at < change.length; at++) mask[at] = change[at] > Math.max(0.09, ceiling * 0.35) ? 1 : 0;

  const blob = largestBlob(close(mask));
  if (!blob || blob.length < 60) return null; // too small to read nine stickers off

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
 * @returns {{verdict: 'none'|'DNF', state: string, faces: number, colours: number,
 *   confidence: number, found: object|null}}
 */
export function inspectFrame(image, empty) {
  const found = findCube(image, empty);
  if (!found) return { verdict: 'none', state: 'geen kubus', faces: 0, colours: 0, confidence: 0, found: null };
  if (found.rejected) {
    return { verdict: 'none', state: 'geen kubusvorm', faces: 0, colours: 0, confidence: 0, found };
  }

  if (found.left === 0 || found.top === 0 || found.right === GRID - 1 || found.bottom === GRID - 1) {
    return { verdict: 'none', state: 'niet volledig in beeld', faces: 0, colours: 0, confidence: 0, found };
  }

  const side = Math.min(image.width, image.height);
  const across = found.radius * 2 * side;
  if (across < 96) return { verdict: 'none', state: 'te klein in beeld', faces: 0, colours: 0, confidence: 0, found };

  const base = { found, faces: 0, colours: 0, confidence: 0 };

  // Well inside, not merely inside. A slanted silhouette edge on a coarse grid
  // keeps a sliver of mat in the cells along it, and mat sampled as if it were
  // a sticker is a whole extra colour -- which on a solved cube is the
  // difference between three and four.
  const inner = [];
  const clear = (x, y) => {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
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

  const grouped = classify(lit);
  if (!grouped) return { verdict: 'none', state: 'niet leesbaar', ...base };

  const now = { found, faces: 3, colours: grouped.colours, confidence: grouped.clarity };

  // Only the count is being trusted, and the count only needs the number of
  // groups to be right -- which is what clarity measures. Whether any one
  // sticker is in the right group does not come into it.
  if (grouped.clarity < 0.6) return { verdict: 'none', state: 'niet zeker genoeg', ...now };
  if (grouped.colours > ONE_MOVE_AT_MOST[3]) return { verdict: 'DNF', state: 'meer dan een zet', ...now };
  return { verdict: 'none', state: 'niets te bewijzen', ...now };
}

/* ---------- the camera ---------- */

/** The outline of what it is looking at, as an SVG path in a 0..1 box. */
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
 * Ask for the front camera and hand back a way to grab one square frame.
 *
 * The front one, because the phone stands facing you with the mat in front of
 * it -- that way the screen is readable while it films. "ideal" rather than
 * "exact" so a machine with only one camera still gets one.
 *
 * Which way round the picture comes is of no consequence to anything below:
 * a mirrored cube has the same colours in the same numbers, and the shape a
 * single turn leaves is a strip along an edge either way round.
 *
 * @returns {Promise<{stream: MediaStream, grab: (size: number) => ImageData}>}
 */
export async function openCamera(video) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Deze browser geeft geen toegang tot de camera.');

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 1280 } },
    audio: false
  });

  video.srcObject = stream;
  await video.play();

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });

  return {
    stream,
    grab(size) {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return null;

      const side = Math.min(width, height);
      canvas.width = size;
      canvas.height = size;
      context.drawImage(video, (width - side) / 2, (height - side) / 2, side, side, 0, 0, size, size);
      return context.getImageData(0, 0, size, size);
    }
  };
}
