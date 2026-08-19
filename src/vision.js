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

   A cube on a mat is not obliged to sit square to the camera, so the three
   rhombi are turned to wherever they actually fit: the angle is the one whose
   hexagon overlaps the silhouette best. Without this a cube a few degrees off
   put every sample on a seam, and a solved cube came back as six colours. */

const hexagonAt = (found, turn, radius) => HEX.map(([x, y]) => {
  const angle = turn * Math.PI / 180;
  return [
    found.x + (x * Math.cos(angle) - y * Math.sin(angle)) * radius,
    found.y + (x * Math.sin(angle) + y * Math.cos(angle)) * radius
  ];
});

/** Share of the mask the hexagon covers and of itself that is mask. */
function overlap(found, turn, radius) {
  const corners = hexagonAt(found, turn, radius);
  let both = 0;
  let onlyHexagon = 0;
  let onlyMask = 0;

  const inHexagon = (px, py) => {
    for (let i = 0; i < 6; i++) {
      const [ax, ay] = corners[i];
      const [bx, by] = corners[(i + 1) % 6];
      if ((bx - ax) * (py - ay) - (by - ay) * (px - ax) < 0) return false;
    }
    return true;
  };

  for (let y = found.top; y <= found.bottom; y++) {
    for (let x = found.left; x <= found.right; x++) {
      const mask = found.mask[y * GRID + x] === 1;
      const hexagon = inHexagon((x + 0.5) / GRID, (y + 0.5) / GRID);
      if (mask && hexagon) both++;
      else if (hexagon) onlyHexagon++;
      else if (mask) onlyMask++;
    }
  }
  return both / Math.max(1, both + onlyHexagon + onlyMask);
}

/**
 * The turn and size that fit best, and how well they fit at all.
 *
 * The size comes from the area rather than the bounding box: a hexagon of
 * circumradius R covers 3*sqrt(3)/2 * R squared, and taking half the shorter
 * side of the box instead made every hexagon a seventh too small, which put
 * every sample on a seam.
 */
export function fitFaces(found) {
  const fromArea = Math.sqrt(found.cells.length / (GRID * GRID) / 2.598);
  let best = { turn: 0, radius: fromArea, score: 0 };

  for (const scale of [0.88, 0.94, 1, 1.06, 1.12]) {
    for (let turn = 0; turn < 60; turn += 4) {
      const radius = fromArea * scale;
      const score = overlap(found, turn, radius);
      if (score > best.score) best = { turn, radius, score };
    }
  }
  for (let turn = best.turn - 3; turn <= best.turn + 3; turn++) {
    const score = overlap(found, turn, best.radius);
    if (score > best.score) best = { ...best, turn, score };
  }
  return best;
}

/* ---------- reading ---------- */

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

const uniform = (face) => face.every((colour) => colour === face[0]);

/** The strips a single turn can leave behind: one whole edge row or column. */
const STRIPS = [[0, 1, 2], [6, 7, 8], [0, 3, 6], [2, 5, 8]];

/** Solved but for one edge strip of a single foreign colour. */
function oneStripOff(face) {
  for (const strip of STRIPS) {
    const rest = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((i) => !strip.includes(i));
    const stripColour = face[strip[0]];
    const restColour = face[rest[0]];
    if (stripColour === restColour) continue;
    if (strip.every((i) => face[i] === stripColour) && rest.every((i) => face[i] === restColour)) return true;
  }
  return false;
}

/** One turn leaves one visible face whole and takes a strip out of the others. */
function looksOneMove(faces) {
  const whole = faces.filter(uniform).length;
  const stripped = faces.filter((face) => !uniform(face) && oneStripOff(face)).length;
  return whole === 1 && stripped === 2;
}

export const CERTAIN = 0.45;

/**
 * Look at one frame and say only what it can stand behind.
 *
 * @returns {{verdict: 'none'|'+2'|'DNF', state: string, faces: number, colours: number,
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
  if (across < 96) { // nine stickers across fewer than a hundred pixels is a guess
    return { verdict: 'none', state: 'te klein in beeld', faces: 0, colours: 0, confidence: 0, found };
  }

  const fit = fitFaces(found);
  found.turn = fit.turn;
  found.radius = fit.radius;
  found.fit = fit.score;

  const angle = fit.turn * Math.PI / 180;
  const place = (point) => ({
    x: found.x + (point.x * Math.cos(angle) - point.y * Math.sin(angle)) * fit.radius,
    y: found.y + (point.x * Math.sin(angle) + point.y * Math.cos(angle)) * fit.radius
  });

  // Half a sticker across, so a patch stays clear of the seams around it.
  const size = Math.max(2, Math.round(fit.radius * 2 * side / 3 / 3 * 0.22));
  const read = (at) => patch(image, Math.round(at.x * image.width), Math.round(at.y * image.height), size);

  const base = { found, faces: 0, colours: 0, confidence: 0 };

  // With a good hexagon the three faces are where they should be and the finer
  // question -- one move, or more -- can be asked. Otherwise only the coarse one.
  if (fit.score > 0.82) {
    const points = samplePoints().map((point) => ({ ...point, ...place(point) }));
    const colours = points.map(read);
    if (colours.some((c) => c === null)) return { verdict: 'none', state: 'niet leesbaar', ...base };

    // A sample much darker than the rest fell on a seam, which means the grid
    // is not sitting where it thinks it is.
    const brightness = colours.map(([r, g, b]) => (r + g + b) / 3);
    const middle = brightness.slice().sort((a, b) => a - b)[brightness.length >> 1];
    const onSeam = brightness.filter((value) => value < middle * 0.45).length;
    if (onSeam > 3) return { verdict: 'none', state: 'raster zit scheef', ...base };

    const grouped = classify(colours);
    if (!grouped) return { verdict: 'none', state: 'niet leesbaar', ...base };

    const faces = [0, 1, 2].map((face) => points
      .map((point, i) => ({ point, i }))
      .filter(({ point }) => point.face === face)
      .map(({ i }) => grouped.labels[i]));

    const now = { found, faces: 3, colours: grouped.colours, confidence: grouped.clarity };
    if (grouped.clarity < CERTAIN) return { verdict: 'none', state: 'niet zeker genoeg', ...now };

    // Too many colours for one move is proof on the count alone, and the count
    // is the part that does not need every sticker pinned down.
    if (grouped.colours > ONE_MOVE_AT_MOST[3]) return { verdict: 'DNF', state: 'meer dan een zet', ...now };

    // The rest is about the shape on each face, and that does need every
    // sticker right.
    if (grouped.separation < CERTAIN) return { verdict: 'none', state: 'niet zeker genoeg', ...now };
    if (faces.every(uniform)) return { verdict: 'none', state: 'lijkt opgelost', ...now };
    if (looksOneMove(faces)) return { verdict: '+2', state: 'een zet ernaast', ...now };
    return { verdict: 'DNF', state: 'meer dan een zet', ...now };
  }

  // Not a corner view -- two faces, or one, or an angle the rhombi do not suit.
  // Nothing here can tell one move from none, but counting colours still can
  // tell more than one move from anything, and that needs no geometry at all.
  const spots = [];
  for (let y = found.top; y <= found.bottom; y++) {
    for (let x = found.left; x <= found.right; x++) {
      if (found.mask[y * GRID + x] !== 1) continue;
      // well inside, so the silhouette edge is not sampled
      if (!found.mask[(y - 1) * GRID + x] || !found.mask[(y + 1) * GRID + x]
        || !found.mask[y * GRID + x - 1] || !found.mask[y * GRID + x + 1]) continue;
      spots.push({ x: (x + 0.5) / GRID, y: (y + 0.5) / GRID });
    }
  }

  const step = Math.max(1, Math.floor(spots.length / 40));
  const picked = spots.filter((_, i) => i % step === 0).slice(0, 40);
  const colours = picked.map(read).filter(Boolean);
  if (colours.length < 12) return { verdict: 'none', state: 'te weinig zicht', ...base };

  const brightness = colours.map(([r, g, b]) => (r + g + b) / 3);
  const middle = brightness.slice().sort((a, b) => a - b)[brightness.length >> 1];
  const lit = colours.filter((_, i) => brightness[i] >= middle * 0.5);
  const grouped = classify(lit);
  if (!grouped) return { verdict: 'none', state: 'niet leesbaar', ...base };

  const now = { found, faces: 0, colours: grouped.colours, confidence: grouped.clarity };
  if (grouped.clarity < CERTAIN) return { verdict: 'none', state: 'niet zeker genoeg', ...now };

  // Five is the most a cube one move from solved can show from any three faces,
  // measured over every one-move state through every corner. More than that is
  // proof, whatever the hidden side is doing.
  if (grouped.colours > ONE_MOVE_AT_MOST[3]) return { verdict: 'DNF', state: 'meer dan een zet', ...now };
  return { verdict: 'none', state: 'te weinig zicht', ...now };
}

/* ---------- the camera ---------- */

/** The outline of what it is looking at, as an SVG path in a 0..1 box. */
export function foundPath(found) {
  if (!found) return '';
  return HEX.map(([x, y], i) =>
    `${i ? 'L' : 'M'}${(found.x + x * found.radius).toFixed(4)} ${(found.y + y * found.radius).toFixed(4)}`
  ).join(' ') + ' Z';
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
