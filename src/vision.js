// Reading a cube off a camera frame, to spot a DNF or a +2 without being asked.
//
// The honest limit first, because it shapes everything below: a camera sees
// three faces of a cube, and three faces cannot prove a cube is solved -- the
// three pieces you cannot see may be cycled among themselves. What three faces
// *can* prove is that a cube is NOT solved, and roughly how far off it is.
// So the reading is deliberately lopsided: brokenness counts as evidence,
// tidiness does not, and anything short of certain is left as a plain solve.

/** Where a cube's three visible faces land inside the guide, as unit corners. */
const HEX = Array.from({ length: 6 }, (_, i) => {
  const angle = (-90 + i * 60) * Math.PI / 180;
  return [Math.cos(angle), Math.sin(angle)];
});

const MIDDLE = [0, 0];

// Each face is a rhombus, given as (top-left, top-right, bottom-right,
// bottom-left) so a 3x3 grid falls out of plain bilinear interpolation.
const FACES = [
  { name: 'top', corners: [HEX[5], HEX[0], HEX[1], MIDDLE] },
  { name: 'right', corners: [MIDDLE, HEX[1], HEX[2], HEX[3]] },
  { name: 'left', corners: [HEX[4], HEX[5], MIDDLE, HEX[3]] }
];

/** The 27 places to look, in units of the guide's radius around its centre. */
export function samplePoints() {
  const points = [];
  for (const face of FACES) {
    const [tl, tr, br, bl] = face.corners;
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 3; column++) {
        const u = (column + 0.5) / 3;
        const v = (row + 0.5) / 3;
        const topX = tl[0] + (tr[0] - tl[0]) * u;
        const topY = tl[1] + (tr[1] - tl[1]) * u;
        const bottomX = bl[0] + (br[0] - bl[0]) * u;
        const bottomY = bl[1] + (br[1] - bl[1]) * u;
        points.push({
          face: face.name,
          row,
          column,
          x: topX + (bottomX - topX) * v,
          y: topY + (bottomY - topY) * v
        });
      }
    }
  }
  return points;
}

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

/**
 * Chromaticity: colour with the brightness divided out, so a sticker in shade
 * and the same sticker in the light land in the same place. Grey, white and
 * black all sit at the centre, which is exactly right here -- a white sticker
 * in shadow is still a white sticker.
 */
function chroma([r, g, b]) {
  const total = r + g + b;
  return total < 24 ? null : [r / total, g / total]; // too dark to mean anything
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
 * Which readings are the same colour as which. Nothing is named: the state of a
 * cube only depends on which stickers match each other, and asking that
 * question instead of "what colour is this" is what makes it survive a warm
 * lamp, a cool window or a dim room.
 *
 * How many colours are in front of the lens is not assumed either. The readings
 * are merged one pair at a time, cheapest first, and the count is taken from
 * where that gets expensive: joining two halves of one face costs almost
 * nothing, joining red to orange costs a great deal. Picking a fixed threshold
 * instead is what made a noisy but solved cube come back as a confident DNF --
 * one face read as two tidy, well-separated colours, and nothing in the
 * arithmetic knew any better.
 *
 * @returns {{labels: string[], confidence: number}|null}
 */
function classify(samples) {
  // Too dark to read. A dim frame keeps its chromaticity in a drawing but not
  // in a photograph, where what is left is mostly sensor noise.
  const brightness = samples.map(([r, g, b]) => (r + g + b) / 3).sort((a, b) => a - b);
  if (brightness[brightness.length >> 1] < 46) return null;

  const points = samples.map(chroma);
  if (points.some((p) => p === null)) return null;

  // Complete-linkage, all the way down, keeping every step.
  let groups = points.map((_, index) => [index]);
  const steps = []; // steps[k] = the state and cost of having reached k groups

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

  // A cube shows at most six colours, and three visible faces need three
  // different centres, so the answer is somewhere in between.
  let choice = null;
  for (let k = 3; k <= 6; k++) {
    if (!steps[k] || !steps[k - 1]) continue;
    // How much more the next merge would cost than the last one did: the bigger
    // that step, the more clearly this is where the colours actually part.
    const jump = steps[k - 1].cost / Math.max(steps[k].cost, 0.004);
    if (choice === null || jump > choice.jump) choice = { k, jump, groups: steps[k].groups };
  }
  if (!choice) return null;

  const centres = choice.groups.map((group) => centreOf(group.map((k) => points[k])));
  const labels = new Array(points.length);
  choice.groups.forEach((group, g) => { for (const k of group) labels[k] = `C${g}`; });

  // Two things have to hold before a reading counts. The split has to be clear
  // -- the next merge much dearer than the last -- and every sticker has to sit
  // nearer its own colour than any other by a decent margin.
  let worst = 1;
  points.forEach((point, index) => {
    const own = Number(labels[index].slice(1));
    const mine = gap(point, centres[own]);
    let nearest = Infinity;
    centres.forEach((centre, g) => { if (g !== own) nearest = Math.min(nearest, gap(point, centre)); });
    if (!Number.isFinite(nearest)) return;
    worst = Math.min(worst, (nearest - mine) / (nearest + mine));
  });

  const separation = Math.max(0, Math.min(1, worst / 0.45));
  const clarity = Math.max(0, Math.min(1, (choice.jump - 1.6) / 2.4));
  return { labels, confidence: Math.min(separation, clarity) };
}

const uniform = (face) => face.every((colour) => colour === face[0]);

/** The strips a single turn can leave behind: one whole edge row or column. */
const STRIPS = [
  [0, 1, 2], [6, 7, 8], [0, 3, 6], [2, 5, 8]
];

/**
 * Is this face solved but for one edge strip of a single foreign colour --
 * exactly what one turn of the neighbouring layer leaves behind?
 */
function oneStripOff(face) {
  for (const strip of STRIPS) {
    const rest = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((i) => !strip.includes(i));
    const stripColour = face[strip[0]];
    const restColour = face[rest[0]];
    if (stripColour === restColour) continue;
    if (strip.every((i) => face[i] === stripColour) && rest.every((i) => face[i] === restColour)) {
      return true;
    }
  }
  return false;
}

/**
 * What the three visible faces say.
 *
 * @returns {'solved'|'one-move'|'scrambled'} -- and note what is missing: there
 * is no 'unsure' here, because unsure is decided by the confidence beside it.
 */
export function readState(labels) {
  const faces = [labels.slice(0, 9), labels.slice(9, 18), labels.slice(18, 27)];

  if (faces.every(uniform)) return 'solved';

  // One turn always leaves exactly one visible face whole and takes a single
  // strip out of each of the other two. Anything else is further gone.
  const whole = faces.filter(uniform).length;
  const stripped = faces.filter((face) => !uniform(face) && oneStripOff(face)).length;
  if (whole === 1 && stripped === 2) return 'one-move';

  return 'scrambled';
}

/** How sure a reading has to be before it is allowed to change anything. */
export const CERTAIN = 0.45;

/**
 * Look at one frame.
 *
 * @returns {{verdict: 'none'|'+2'|'DNF', state: string, confidence: number}}
 * 'none' covers both a cube that looks solved and a frame that could not be
 * read: either way the solve is left exactly as it was.
 */
export function inspectFrame(image, guide) {
  const radius = Math.max(2, Math.round(guide.radius * 0.055));
  const samples = [];

  for (const point of samplePoints()) {
    const colour = patch(
      image,
      Math.round(guide.x + point.x * guide.radius),
      Math.round(guide.y + point.y * guide.radius),
      radius
    );
    if (!colour) return { verdict: 'none', state: 'unreadable', confidence: 0 };
    samples.push(colour);
  }

  const read = classify(samples);
  if (!read) return { verdict: 'none', state: 'unreadable', confidence: 0 };

  // Three visible faces must have three different centres. If they do not, the
  // cube is not squarely in the guide and nothing here can be trusted.
  const centres = [read.labels[4], read.labels[13], read.labels[22]];
  if (new Set(centres).size < 3) return { verdict: 'none', state: 'askew', confidence: 0 };

  const state = readState(read.labels);
  if (read.confidence < CERTAIN) return { verdict: 'none', state, confidence: read.confidence };

  return {
    verdict: state === 'scrambled' ? 'DNF' : state === 'one-move' ? '+2' : 'none',
    state,
    confidence: read.confidence
  };
}

/* ---------- the camera ---------- */

/**
 * The frame is cropped to a centred square before anything is measured, and
 * the guide drawn on screen uses the same square, so what the eye lines up
 * with and what the code looks at are the same thing.
 */
/**
 * Where the cube lands, as a share of the square frame. A phone propped beside
 * the mat does not move between solves, so this is asked for once and then
 * never again -- which is the whole point of the thing being automatic.
 */
export const DEFAULT_AIM = { x: 0.5, y: 0.5, radius: 0.3 };

export const guideFor = (size, aim = DEFAULT_AIM) => ({
  x: aim.x * size,
  y: aim.y * size,
  radius: aim.radius * size
});

/** The guide outline, as an SVG path in a 0..1 box. */
export function guidePath(aim = DEFAULT_AIM) {
  return HEX.map(([x, y], i) =>
    `${i ? 'L' : 'M'}${(aim.x + x * aim.radius).toFixed(4)} ${(aim.y + y * aim.radius).toFixed(4)}`
  ).join(' ') + ' Z';
}

/** The three seams from the centre out, so the guide reads as a cube corner. */
export function guideSeams(aim = DEFAULT_AIM) {
  return [0, 2, 4].map((i) =>
    `M${aim.x} ${aim.y}L${(aim.x + HEX[i][0] * aim.radius).toFixed(4)} ${(aim.y + HEX[i][1] * aim.radius).toFixed(4)}`
  ).join(' ');
}

/**
 * Ask for the back camera and hand back a way to grab one square frame.
 * @returns {Promise<{stream: MediaStream, grab: (size: number) => ImageData}>}
 */
export async function openCamera(video) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Deze browser geeft geen toegang tot de camera.');

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 1280 } },
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
