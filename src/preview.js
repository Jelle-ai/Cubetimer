// The little picture of the scrambled puzzle beside the moves.
//
// Both the net and the turning come from PuzzleGeometry, the same part of
// cubing.js that generates the scrambles. That is the point of doing it this
// way: a hand-written facelet model can disagree with the scrambler, and the
// one this replaced did -- its F turn carried the two ends of a strip the
// wrong way round, which no amount of "four turns is a full circle" testing
// catches.

const PUZZLES = {
  333: '3x3x3',
  222: '2x2x2',
  444: '4x4x4',
  pyra: 'pyraminx',
  skewb: 'skewb',
  minx: 'megaminx'
};

export const hasPreview = (puzzleId) => puzzleId in PUZZLES;

// The library is a few hundred kilobytes and nothing needs it until a picture
// is actually drawn, so it is fetched on first use and kept.
let library = null;
const loadLibrary = () => (library ??= import('../vendor/cubing/puzzles/index.js'));

const nets = new Map();

/**
 * The solved net for a puzzle, parsed once: an SVG to clone, the colour each
 * sticker has when solved, and the puzzle to turn.
 */
function netFor(puzzleId) {
  if (!nets.has(puzzleId)) nets.set(puzzleId, buildNet(puzzleId).catch(() => null));
  return nets.get(puzzleId);
}

async function buildNet(puzzleId) {
  const { puzzles } = await loadLibrary();
  const loader = puzzles[PUZZLES[puzzleId]];
  const [pg, kpuzzle] = await Promise.all([loader.pg(), loader.kpuzzle()]);

  const document = new DOMParser().parseFromString(pg.generatesvg(), 'image/svg+xml');
  const svg = document.documentElement;
  if (svg.querySelector('parsererror')) throw new Error('net kon niet gelezen worden');

  // Its own stylesheet paints the seams black; the page does that instead, so
  // the net can follow the theme.
  svg.querySelector('style')?.remove();
  svg.removeAttribute('id');

  const solved = new Map();
  const points = [];
  for (const sticker of svg.querySelectorAll('polygon')) {
    solved.set(sticker.id, sticker.style.fill);
    points.push(sticker.getAttribute('points'));
  }

  // Every net is drawn into the same 800x500 box, so most of them sit small in
  // a lot of nothing. Crop to what is actually there.
  trim(svg, points);

  const turns = Object.fromEntries(
    kpuzzle.definition.orbits.map((orbit) => [orbit.orbitName, orbit.numOrientations])
  );

  return { svg, solved, turns, kpuzzle };
}

/** Pull the view in around the drawing, with a little air left around it. */
function trim(svg, polygons) {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;

  for (const points of polygons) {
    const numbers = (points || '').trim().split(/[\s,]+/).map(Number);
    for (let i = 0; i + 1 < numbers.length; i += 2) {
      const [x, y] = [numbers[i], numbers[i + 1]];
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }

  if (!Number.isFinite(left) || right <= left || bottom <= top) return;
  const air = Math.max(right - left, bottom - top) * 0.03;
  svg.setAttribute('viewBox',
    `${left - air} ${top - air} ${right - left + air * 2} ${bottom - top + air * 2}`);
}

/**
 * A sticker is named for where it sits: which orbit, which position in it, and
 * which of that position's facelets. What shows there is the matching facelet
 * of whichever piece is in that position, counted back by how far the piece is
 * twisted.
 */
function colourOf(net, pattern, id) {
  const parts = /^(.*)-l(\d+)-o(\d+)$/.exec(id);
  if (!parts) return null;

  const [, orbit, position, facelet] = parts;
  const at = Number(position);
  const orientations = net.turns[orbit];
  const state = pattern.patternData[orbit];
  const twisted = ((Number(facelet) - state.orientation[at]) % orientations + orientations) % orientations;

  return net.solved.get(`${orbit}-l${state.pieces[at]}-o${twisted}`) ?? null;
}

/**
 * @returns {Promise<SVGElement|null>} the net of this puzzle after the
 * scramble, or null when there is no picture to be had.
 */
export async function previewOf(scramble, puzzleId) {
  if (!hasPreview(puzzleId)) return null;
  const net = await netFor(puzzleId);
  if (!net) return null;

  let pattern;
  try {
    pattern = net.kpuzzle.defaultPattern().applyAlg(scramble);
  } catch {
    return null; // a stand-in scramble this puzzle does not know
  }

  const svg = net.svg.cloneNode(true);
  for (const sticker of svg.querySelectorAll('polygon')) {
    const colour = colourOf(net, pattern, sticker.id);
    if (colour) sticker.style.fill = colour;
  }
  return svg;
}
