// The little picture of a last-layer case.
//
// An OLL or a PLL is always drawn the same way: the top face as a three by
// three, with a strip of the four sides around it. Nothing else about the cube
// matters, because nothing else about the cube is what the case is.
//
// Where the stickers are is not written down here. It is worked out from the
// puzzle's own net -- the same drawing the scramble preview is built from --
// because a facelet table typed out by hand can disagree with the puzzle that
// generates the scrambles, and the one that did exactly that is the reason
// preview.js says so at the top. Everything below is derived and then checked.

const NET_BOX = 800;

let mapping = null;

const loadLibrary = () => import('../vendor/cubing/puzzles/index.js');

/** The middle of a polygon, which is all that is needed to place it. */
function centreOf(points) {
  const numbers = (points || '').trim().split(/[\s,]+/).map(Number);
  let x = 0;
  let y = 0;
  let count = 0;
  for (let at = 0; at + 1 < numbers.length; at += 2) {
    if (!Number.isFinite(numbers[at]) || !Number.isFinite(numbers[at + 1])) continue;
    x += numbers[at];
    y += numbers[at + 1];
    count++;
  }
  return count ? { x: x / count, y: y / count } : null;
}

/** Which cubie a sticker belongs to, straight out of its name. */
function cubieOf(id) {
  const parts = /^(.*)-l(\d+)-o(\d+)$/.exec(id);
  return parts ? { orbit: parts[1], at: Number(parts[2]), facelet: Number(parts[3]) } : null;
}

const key = (cubie) => `${cubie.orbit}:${cubie.at}`;

/**
 * Every sticker in the net, once. A centre is drawn four times over -- once per
 * way round it can sit -- and the extra three sit exactly on top of the first,
 * so they are dropped by position.
 */
function stickersOf(svg) {
  const seen = new Set();
  const out = [];
  for (const polygon of svg.querySelectorAll('polygon')) {
    const middle = centreOf(polygon.getAttribute('points'));
    if (!middle) continue;
    const spot = `${Math.round(middle.x)},${Math.round(middle.y)}`;
    if (seen.has(spot)) continue;
    seen.add(spot);
    const cubie = cubieOf(polygon.id);
    if (!cubie) continue;
    out.push({ id: polygon.id, ...middle, ...cubie, fill: polygon.style.fill });
  }
  return out;
}

/** Distinct coordinates, rounded, in order -- the net's rows and columns. */
const lanes = (values) => [...new Set(values.map((value) => Math.round(value)))].sort((a, b) => a - b);

/**
 * Work out where the last layer is drawn, from the net alone.
 *
 * The net is a cross: the top face on its own above, the four sides in a band,
 * the bottom face on its own below. So the top face is the block of nine in the
 * first three rows, and the band directly under it holds each side's top row --
 * twelve stickers, three per face.
 *
 * Which band group belongs beside which edge of the top face is not guessed
 * either: a group and the edge of the top face it folds onto are made of the
 * same three cubies, and the three groups have three different sets. The order
 * within a group comes from the same fact, so a side drawn back to front in the
 * net comes out the right way round here without anyone deciding it should.
 */
function derive(stickers) {
  const columns = lanes(stickers.map((sticker) => sticker.x));
  const rows = lanes(stickers.map((sticker) => sticker.y));
  if (columns.length !== 12 || rows.length !== 9) return null;

  const at = (row, column) => stickers.find((sticker) =>
    Math.round(sticker.x) === columns[column] && Math.round(sticker.y) === rows[row]);

  // The top face sits in the three columns that have anything in the first row.
  const middleColumns = [3, 4, 5];
  const up = [];
  for (let row = 0; row < 3; row++) {
    for (const column of middleColumns) {
      const sticker = at(row, column);
      if (!sticker) return null;
      up.push(sticker);
    }
  }

  // The band under it: four groups of three, in net order.
  const band = [0, 3, 6, 9].map((start) => [0, 1, 2].map((step) => at(3, start + step)));
  if (band.some((group) => group.some((sticker) => !sticker))) return null;

  // The four edges of the top face, each as the three cubies it folds onto.
  const edges = {
    back: [up[0], up[1], up[2]],
    left: [up[0], up[3], up[6]],
    right: [up[2], up[5], up[8]],
    front: [up[6], up[7], up[8]]
  };

  const sides = {};
  for (const [side, cells] of Object.entries(edges)) {
    const wanted = new Set(cells.map(key));
    const group = band.find((three) => three.every((sticker) => wanted.has(key(sticker))));
    if (!group) return null;
    // Ordered to follow the top face's own order, so a side the net draws back
    // to front is turned round here rather than shown mirrored.
    sides[side] = cells.map((cell) => group.find((sticker) => key(sticker) === key(cell)));
    if (sides[side].some((sticker) => !sticker)) return null;
  }

  // Every face as its own three by three, in the net's own orientation, which
  // is what an F2L picture needs: the pair lives in the top layer or in the
  // slot at the front right, so the front and the right have to be shown too.
  const faces = {};
  const blocks = { up: [0, 3], left: [3, 0], front: [3, 3], right: [3, 6], back: [3, 9], down: [6, 3] };
  for (const [name, [row0, column0]] of Object.entries(blocks)) {
    const grid = [];
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 3; column++) {
        const sticker = at(row0 + row, column0 + column);
        if (!sticker) return null;
        grid.push(sticker);
      }
    }
    faces[name] = grid;
  }

  return { up, sides, faces };
}

/**
 * The colour showing at one sticker, for a given state.
 * Same reasoning as the scramble preview: what shows is the matching facelet of
 * whichever piece is in that position, counted back by how far it is twisted.
 */
function colourAt(net, pattern, sticker) {
  const orientations = net.turns[sticker.orbit];
  const state = pattern.patternData[sticker.orbit];
  const twisted = ((sticker.facelet - state.orientation[sticker.at]) % orientations + orientations) % orientations;
  return net.solved.get(`${sticker.orbit}-l${state.pieces[sticker.at]}-o${twisted}`) ?? null;
}

async function build() {
  const { puzzles } = await loadLibrary();
  const loader = puzzles['3x3x3'];
  const [pg, kpuzzle] = await Promise.all([loader.pg(), loader.kpuzzle()]);

  const document = new DOMParser().parseFromString(pg.generatesvg(), 'image/svg+xml');
  const svg = document.documentElement;
  if (svg.querySelector('parsererror')) throw new Error('net kon niet gelezen worden');

  const stickers = stickersOf(svg);
  const places = derive(stickers);
  if (!places) throw new Error('de vorm van het net is niet wat verwacht werd');

  const solved = new Map();
  for (const polygon of svg.querySelectorAll('polygon')) solved.set(polygon.id, polygon.style.fill);
  const turns = Object.fromEntries(
    kpuzzle.definition.orbits.map((orbit) => [orbit.orbitName, orbit.numOrientations])
  );

  const net = { solved, turns, kpuzzle };

  // The check. On a solved cube the top face has to be one colour and each side
  // strip has to be one other colour, or the mapping has landed somewhere else
  // and every picture drawn with it would be quietly wrong.
  const clean = kpuzzle.defaultPattern();
  const upColours = new Set(places.up.map((sticker) => colourAt(net, clean, sticker)));
  if (upColours.size !== 1) throw new Error('de bovenkant komt niet als één kleur uit');
  for (const [side, three] of Object.entries(places.sides)) {
    const colours = new Set(three.map((sticker) => colourAt(net, clean, sticker)));
    if (colours.size !== 1) throw new Error(`de ${side}-strook komt niet als één kleur uit`);
    if (colours.has([...upColours][0])) throw new Error(`de ${side}-strook heeft de kleur van boven`);
  }

  return { net, places, up: [...upColours][0] };
}

/**
 * The six faces of a solved cube as three-by-three grids of stickers, in the
 * net's own orientation, plus the way to read a colour off any state.
 *
 * The three-dimensional cube is built on this: it needs all fifty-four
 * facelets, and the whole point of deriving them from the puzzle's own net is
 * that a table typed out by hand can disagree with the puzzle that makes the
 * scrambles. Everything here is derived once and checked before it is handed
 * out.
 */
export async function faceMap() {
  const built = await lastLayerMap();
  if (!built) return null;
  return {
    faces: built.places.faces,
    kpuzzle: built.net.kpuzzle,
    colourOf: (pattern, sticker) => colourAt(built.net, pattern, sticker)
  };
}

/** Built once, and never again -- the answer cannot change. */
export function lastLayerMap() {
  mapping ??= build().catch((error) => {
    console.warn('Plaatjes van de laatste laag:', error.message);
    return null;
  });
  return mapping;
}

/**
 * What one case looks like from above.
 *
 * @param {string} setup the moves that produce the case from a solved cube
 * @returns {Promise<{up: string[], back: string[], left: string[], right: string[],
 *   front: string[], top: string}|null>} colours, or null when there is no
 *   picture to be had
 */
export async function lastLayerOf(setup) {
  const kit = await lastLayerMap();
  if (!kit) return null;

  let pattern;
  try {
    pattern = kit.net.kpuzzle.defaultPattern().applyAlg(setup);
  } catch {
    return null;
  }

  const read = (list) => list.map((sticker) => colourAt(kit.net, pattern, sticker));
  return {
    up: read(kit.places.up),
    back: read(kit.places.sides.back),
    left: read(kit.places.sides.left),
    right: read(kit.places.sides.right),
    front: read(kit.places.sides.front),
    top: kit.up
  };
}

/**
 * The pair that belongs in the front-right slot, as the puzzle numbers them --
 * the same two the case list checks against.
 */
const F2L_CORNER = 4;
const F2L_EDGE = 8;

/**
 * What an F2L case looks like: the top face with the front and the right beside
 * it, laid out the way the puzzle's own net lays them out. No rotating of
 * anything into a corner view -- the slot is simply where the front's right
 * column meets the right's left column, and the two are already next to each
 * other there.
 *
 * @returns {Promise<{up: string[], front: string[], right: string[],
 *   pair: string[]}|null>} pair is the three colours the pair is made of
 */
export async function f2lOf(setup) {
  const kit = await lastLayerMap();
  if (!kit?.places?.faces) return null;

  let pattern;
  try {
    pattern = kit.net.kpuzzle.defaultPattern().applyAlg(setup);
  } catch {
    return null;
  }

  // Which stickers are the pair is a question about pieces, not about colours:
  // the front face is full of green and the right full of red whatever the case
  // is, and picking them out by colour lights up the half of the cube that is
  // already solved. Asking which piece is standing in each place instead gives
  // exactly the five stickers the case is made of.
  const state = pattern.patternData;
  const isPair = (sticker) => (sticker.orbit === 'CORNERS'
    ? state.CORNERS.pieces[sticker.at] === F2L_CORNER
    : sticker.orbit === 'EDGES' && state.EDGES.pieces[sticker.at] === F2L_EDGE);

  const read = (list) => list.map((sticker) => ({
    colour: colourAt(kit.net, pattern, sticker),
    pair: isPair(sticker)
  }));

  return {
    up: read(kit.places.faces.up),
    front: read(kit.places.faces.front),
    right: read(kit.places.faces.right)
  };
}

/* ---------- drawing it ---------- */

const CELL = 10;
const GAP = 1;
const STRIP = 4;
const EDGE = CELL * 3 + GAP * 2;
const SIZE = EDGE + (STRIP + GAP) * 2;

function tile(svg, x, y, width, height, fill) {
  const rect = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', String(x));
  rect.setAttribute('y', String(y));
  rect.setAttribute('width', String(width));
  rect.setAttribute('height', String(height));
  rect.setAttribute('rx', '1.6');
  rect.setAttribute('fill', fill);
  // Every sticker gets a seam, or a white one on a pale page has no edges and
  // the whole diagram reads as a smudge.
  rect.setAttribute('stroke', 'rgba(0,0,0,.22)');
  rect.setAttribute('stroke-width', '0.5');
  svg.append(rect);
}

/**
 * An OLL is not about colour. It is about which stickers point up and which do
 * not, and the puzzle's own top colour here is white -- which on a pale page is
 * no colour at all. So an OLL is drawn the way every OLL diagram has always been
 * drawn: the ones that are up in yellow, the rest in slate. A PLL keeps the real
 * colours, because for a PLL which colour went where is the entire question.
 */
const UP = '#f2c50f';
const DOWN = '#5a6472';

/**
 * The diagram as an SVG, small enough to sit in a list and readable at that
 * size.
 *
 * @param {'oll'|'pll'} how
 */
export function drawLastLayer(shape, how = 'pll') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
  svg.setAttribute('class', 'll-diagram');
  svg.setAttribute('aria-hidden', 'true');

  const paint = (colour) => (how === 'oll' ? (colour === shape.top ? UP : DOWN) : colour);

  const start = STRIP + GAP;
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 3; column++) {
      tile(svg, start + column * (CELL + GAP), start + row * (CELL + GAP), CELL, CELL,
        paint(shape.up[row * 3 + column]));
    }
  }

  for (let i = 0; i < 3; i++) {
    const along = start + i * (CELL + GAP);
    tile(svg, along, 0, CELL, STRIP, paint(shape.back[i]));
    tile(svg, along, SIZE - STRIP, CELL, STRIP, paint(shape.front[i]));
    tile(svg, 0, along, STRIP, CELL, paint(shape.left[i]));
    tile(svg, SIZE - STRIP, along, STRIP, CELL, paint(shape.right[i]));
  }

  return svg;
}

/**
 * The F2L picture.
 *
 * Only the pair is worth colouring. Everything else on those three faces is
 * either already solved or belongs to the last layer, and painting all of it in
 * gives a picture you have to decode rather than recognise -- so the rest is
 * slate and the two pieces that are the case are the only thing you see.
 */
export function drawF2L(shape) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const step = CELL + GAP;
  const wide = step * 6 + GAP;
  svg.setAttribute('viewBox', `0 0 ${wide} ${wide}`);
  svg.setAttribute('class', 'll-diagram');
  svg.setAttribute('aria-hidden', 'true');

  const block = (grid, atColumn, atRow) => {
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 3; column++) {
        const cell = grid[row * 3 + column];
        tile(svg, GAP + (atColumn + column) * step, GAP + (atRow + row) * step,
          CELL, CELL, cell.pair ? cell.colour : DOWN);
      }
    }
  };

  block(shape.up, 0, 0);      // the top face
  block(shape.front, 0, 3);   // the front, under it, as the net has it
  block(shape.right, 3, 3);   // and the right beside the front, likewise

  return svg;
}
