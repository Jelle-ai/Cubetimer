// A three-dimensional cube you can watch, turn and drag.
//
// There is no twisty player in the vendored cubing.js -- only alg, puzzles,
// puzzle-geometry and scramble -- so the cube is built here. What is *not*
// built here is the state: the colours come out of the same puzzle engine that
// makes the scrambles, read through the net that diagram.js already derives.
// So the cube can be wrong about how it looks and never about what it shows.
//
// The trick that keeps it simple: the twenty-six little boxes never move. They
// sit at fixed places and only their sticker colours change. A turn is a
// temporary group of nine boxes rotating ninety degrees; when it lands, the
// group is dissolved and every sticker is repainted from the new state. Nothing
// to keep in step, and nothing that can drift after a hundred moves.

import { faceMap } from './diagram.js';

/** Which way each face looks, and how its three-by-three grid lies in space.
 *
 *  x is right, y is up, z is towards you. A face's grid is read the way the net
 *  draws it: row 0 at the top of that square, column 0 at its left. Turning
 *  that into a place in space is the one thing that could be got wrong, so it
 *  is not written down -- it is searched for below and then checked. */
const FACES = ['U', 'D', 'F', 'B', 'R', 'L'];

const NORMAL = {
  U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], R: [1, 0, 0], L: [-1, 0, 0]
};

/** The name diagram.js gives each block of the net. */
const FROM_NET = { U: 'up', D: 'down', F: 'front', B: 'back', R: 'right', L: 'left' };

/**
 * Two directions in space for a face: which way its grid's columns run, and
 * which way its rows run. Four candidates per face -- the four ways the square
 * can be turned -- and the right one is found by asking the cube itself.
 */
function candidates(face) {
  const normal = NORMAL[face];
  // Any axis that is not the normal will do to start from.
  const first = normal[0] === 0 ? [1, 0, 0] : [0, 1, 0];
  // Looking at a face from outside, columns run right and rows run *down*, and
  // that pair is left-handed: across x down comes out as minus the normal, not
  // plus it. Getting this the wrong way round produces four mirror images of
  // the cube, all of which fail to add up -- which is how it was caught.
  const second = cross(first, normal);
  const turns = [];
  let across = first;
  let down = second;
  for (let turn = 0; turn < 4; turn++) {
    turns.push({ across, down });
    [across, down] = [down, across.map((n) => -n)];
  }
  return turns;
}

const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];

/** Where a grid cell sits, given which way the grid lies. */
function placeOf(face, { across, down }, row, column) {
  const n = NORMAL[face];
  const c = column - 1;
  const r = row - 1;
  return [0, 1, 2].map((axis) => n[axis] + across[axis] * c + down[axis] * r);
}

const spotKey = (place) => place.join(',');

/**
 * Work out how each face's grid lies in space, by insisting that the cube adds
 * up: three stickers meeting at a corner have to belong to one corner piece,
 * and two meeting along an edge to one edge piece. Get a face turned the wrong
 * way and that stops being true at once, so there is nothing to assume.
 *
 * @returns {{[face: string]: {across: number[], down: number[]}} | null}
 */
function layOut(faces) {
  const piece = (sticker) => `${sticker.orbit}:${sticker.at}`;

  // The top face is the anchor: diagram.js already derives and checks it, and
  // every last-layer picture in the app is drawn from it.
  const found = {};
  for (const face of FACES) {
    const grid = faces[FROM_NET[face]];
    if (!grid || grid.length !== 9) return null;
    found[face] = null;
  }

  // Try every combination the cheap way: fix one face, then take each of the
  // others in turn and keep the single lie that agrees with what is already
  // placed. A face that agrees with two of them cannot agree with a third the
  // wrong way round, so one pass is enough.
  const placed = new Map();   // spot -> [{face, sticker}]
  const claim = (face, lie) => {
    const grid = faces[FROM_NET[face]];
    const marks = [];
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 3; column++) {
        marks.push({ spot: spotKey(placeOf(face, lie, row, column)), sticker: grid[row * 3 + column], face });
      }
    }
    return marks;
  };

  const agrees = (marks) => marks.every(({ spot, sticker }) => {
    const already = placed.get(spot);
    if (!already) return true;
    // Same little box: every sticker on it belongs to the same piece.
    return already.every((mark) => piece(mark.sticker) === piece(sticker));
  });

  // U first and unturned, so the whole cube is laid out the way the last-layer
  // pictures already are.
  const order = ['U', 'F', 'R', 'B', 'L', 'D'];
  for (const face of order) {
    const fits = candidates(face).filter((lie) => agrees(claim(face, lie)));
    // The first face has nothing to agree with yet, so all four fit; the rest
    // must land on exactly one, or the net is not the shape we think it is.
    if (face !== 'U' && fits.length !== 1) return null;
    const lie = fits[0];
    found[face] = lie;
    for (const mark of claim(face, lie)) {
      placed.set(mark.spot, (placed.get(mark.spot) || []).concat(mark));
    }
  }

  // The whole cube, counted: eight corners with three stickers, twelve edges
  // with two, six middles with one.
  const sizes = { 1: 0, 2: 0, 3: 0 };
  for (const marks of placed.values()) sizes[marks.length] = (sizes[marks.length] || 0) + 1;
  if (sizes[3] !== 8 || sizes[2] !== 12 || sizes[1] !== 6) return null;

  return found;
}

/* ---------- the model, built once ---------- */

let model = null;

/**
 * Every sticker of the cube, told where it is: which little box, which face of
 * it, and which sticker of the puzzle shows there.
 */
async function build() {
  const map = await faceMap();
  if (!map) throw new Error('het net van de kubus kon niet gelezen worden');

  const lie = layOut(map.faces);
  if (!lie) throw new Error('de kubus telt niet op -- het net ligt anders dan verwacht');

  const boxes = new Map();   // spot -> { place, stickers: {face: sticker} }
  for (const face of FACES) {
    const grid = map.faces[FROM_NET[face]];
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 3; column++) {
        const place = placeOf(face, lie[face], row, column);
        const spot = spotKey(place);
        const box = boxes.get(spot) || { place, stickers: {} };
        box.stickers[face] = grid[row * 3 + column];
        boxes.set(spot, box);
      }
    }
  }

  // A last check with real colours: a solved cube has to come out six faces of
  // six colours, one each.
  const clean = map.kpuzzle.defaultPattern();
  const seen = new Set();
  for (const face of FACES) {
    const colours = new Set();
    for (const box of boxes.values()) {
      if (box.stickers[face]) colours.add(map.colourOf(clean, box.stickers[face]));
    }
    if (colours.size !== 1) throw new Error(`de ${face}-kant komt niet als één kleur uit`);
    seen.add([...colours][0]);
  }
  if (seen.size !== 6) throw new Error('twee kanten hebben dezelfde kleur');

  return { boxes: [...boxes.values()], colourOf: map.colourOf, kpuzzle: map.kpuzzle };
}

export function cubeModel() {
  model ??= build().catch((error) => {
    console.warn('The cube:', error.message);
    return null;
  });
  return model;
}

/* ---------- which boxes a move takes with it ---------- */

/**
 * A move, taken apart: which axis it turns about, which slices of that axis go
 * along, and how far.
 *
 * The axis runs the way the face points, so a turn "clockwise looking at the
 * face" is a turn the negative way about that axis under the right-hand rule --
 * which is the one thing here that has to be said out loud, because a cube
 * turned the wrong way looks right at the end and wrong all the way there.
 */
const AXIS = { U: 1, D: 1, R: 0, L: 0, F: 2, B: 2 };

/** Which value along the axis is the face itself. */
const SIDE = { U: 1, D: -1, R: 1, L: -1, F: 1, B: -1 };

/** The slices a turn takes: the face, the face and the one behind it, or the middle. */
function slicesOf(family) {
  const face = family[0].toUpperCase();
  const wide = family.length > 1 && (family[1] === 'w' || family[0] === family[0].toLowerCase());
  const near = SIDE[face];
  if (family === 'M') return { face: 'L', slices: [0] };
  if (family === 'E') return { face: 'D', slices: [0] };
  if (family === 'S') return { face: 'F', slices: [0] };
  if (wide) return { face, slices: [near, 0] };
  return { face, slices: [near] };
}

const ROTATIONS = { x: 'R', y: 'U', z: 'F' };

/**
 * @returns {{axis: number, slices: number[], quarters: number, whole: boolean} | null}
 */
export function readMove(move) {
  const parts = /^([UDRLFBudrlfbMESxyz])(w?)(\d*)('?)$/.exec(String(move).trim());
  if (!parts) return null;
  const [, letter, w, amount, prime] = parts;
  const quarters = (Number(amount) || 1) * (prime ? -1 : 1);

  if (ROTATIONS[letter]) {
    const face = ROTATIONS[letter];
    return { axis: AXIS[face], side: SIDE[face], slices: [-1, 0, 1], quarters, whole: true };
  }

  const lower = letter === letter.toLowerCase() && !'mes'.includes(letter);
  const family = lower ? letter.toUpperCase() + 'w' : letter + w;
  const { face, slices } = slicesOf(family === 'M' || family === 'E' || family === 'S' ? letter : family);
  return { axis: AXIS[face], side: SIDE[face], slices, quarters, whole: false };
}

/* ---------- drawing it ---------- */

const SIZE = 1;   // one unit per little box; the scene scales it

/** The face of a little box, as a flat square turned into place. */
const FACE_TURN = {
  U: 'rotateX(90deg)',
  D: 'rotateX(-90deg)',
  F: '',
  B: 'rotateY(180deg)',
  R: 'rotateY(90deg)',
  L: 'rotateY(-90deg)'
};

/**
 * A cube on the page.
 *
 * @param {object} options
 * @param {number} options.size how many pixels across
 * @param {boolean} options.drag whether it can be turned with a finger
 * @returns {Promise<object|null>}
 */
export async function makeCube({ size = 200, drag = true, angle = [-24, -32] } = {}) {
  const built = await cubeModel();
  if (!built) return null;

  const { Alg } = await import('../vendor/cubing/alg/index.js');

  const scene = document.createElement('div');
  scene.className = 'cube3d';
  scene.style.setProperty('--cube-size', `${size}px`);

  const box = document.createElement('div');
  box.className = 'cube3d-box';
  scene.append(box);

  let [tiltX, tiltY] = angle;
  const aim = () => { box.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`; };
  aim();

  // Every little box, once, at its own place. They never move again.
  const cells = new Map();
  for (const spot of built.boxes) {
    const cubie = document.createElement('div');
    cubie.className = 'cube3d-cubie';
    const [x, y, z] = spot.place;
    cubie.style.transform = `translate3d(${x * SIZE}em, ${-y * SIZE}em, ${z * SIZE}em)`;
    const faces = {};
    for (const face of FACES) {
      if (!spot.stickers[face]) continue;
      const tile = document.createElement('div');
      tile.className = 'cube3d-face';
      tile.style.transform = `${FACE_TURN[face]} translateZ(${SIZE / 2}em)`;
      cubie.append(tile);
      faces[face] = tile;
    }
    box.append(cubie);
    cells.set(spotKey(spot.place), { el: cubie, place: spot.place, stickers: spot.stickers, faces });
  }

  let pattern = built.kpuzzle.defaultPattern();

  /** Repaint every sticker from whatever the cube is now. */
  function paint() {
    for (const cell of cells.values()) {
      for (const face of FACES) {
        const sticker = cell.stickers[face];
        if (!sticker) continue;
        cell.faces[face].style.background = built.colourOf(pattern, sticker) || '#222';
      }
    }
  }
  paint();

  /* --- turning ---

     A run of moves is one movement, not a row of separate ones.

     It used to be a CSS transition per move, each landing on transitionend and
     the next starting after it. That leaves exactly one frame of nothing
     between every two moves -- measured: eleven to thirty-three milliseconds,
     usually sixteen -- and fourteen of those in an algorithm is a stutter you
     can see. Worse, each move had its own ease-in-out, so the cube stopped dead
     and set off again at every quarter turn.

     So the whole run is driven off one clock instead. Move i owns the stretch
     from i*pace to (i+1)*pace; every frame works out which move that is, hands
     over from the last one in the same frame if it has changed, and sets the
     angle. No gap, because there is nothing to wait for.

     The easing is chosen so the speed never jumps at a handover. The first move
     starts at nothing and ends at full speed, the ones in between run at
     exactly that speed, and the last one comes down from it to nothing:

       first   f(p) = p²(2 - p)     f'(0) = 0, f'(1) = 1
       middle  f(p) = p             f'    = 1
       last    f(p) = p(1 + p - p²) f'(0) = 1, f'(1) = 0

     A single move on its own gets the symmetric one, f(p) = p²(3 - 2p), because
     there is nothing on either side of it to match. */

  const AXES = ['X', 'Y', 'Z'];

  const EASE = {
    only: (p) => p * p * (3 - 2 * p),
    first: (p) => p * p * (2 - p),
    middle: (p) => p,
    last: (p) => p * (1 + p - p * p)
  };

  const easeAt = (at, many) => (many === 1 ? EASE.only
    : at === 0 ? EASE.first
      : at === many - 1 ? EASE.last
        : EASE.middle);

  let busy = false;
  let running = null;

  /** Everything one move needs to be drawn at any angle. */
  function liftLayer(move) {
    const read = readMove(move);
    if (!read) return null;
    const group = document.createElement('div');
    group.className = 'cube3d-layer';
    const moving = [...cells.values()].filter((cell) => read.slices.includes(cell.place[read.axis]));
    for (const cell of moving) group.append(cell.el);
    box.append(group);

    // Clockwise seen from the face is the negative way about the axis that
    // points out of it, and the screen's y runs downwards, which flips the one
    // about the vertical.
    const flip = read.axis === 1 ? 1 : -1;
    return {
      group,
      moving,
      spin: `rotate${AXES[read.axis]}`,
      degrees: read.quarters * 90 * read.side * flip
    };
  }

  /** Put the layer down: state forward, boxes home, colours repainted. */
  function dropLayer(layer, move) {
    try {
      pattern = pattern.applyAlg(new Alg(move));
    } catch {
      // A move the puzzle does not know: the picture goes back as it was.
    }
    // Undoing the rotation and repainting happen in the same task, so the
    // browser never gets a frame showing the layer straight with the old
    // colours still on it.
    for (const cell of layer.moving) box.append(cell.el);
    layer.group.remove();
    paint();
  }

  /**
   * Play a run of moves off one clock.
   * @returns {{stop: () => void, done: Promise<boolean>}}
   */
  function runMoves(moves, pace, onMove) {
    let stopped = false;
    let layer = null;
    let at = -1;
    let began = 0;

    const done = new Promise((finish) => {
      const frame = (now) => {
        if (stopped) {
          if (layer) dropLayer(layer, moves[at]);
          finish(false);
          return;
        }
        if (!began) began = now;

        const gone = now - began;
        const wanted = Math.min(Math.floor(gone / pace), moves.length);

        // Hand over as many moves as the clock says have finished, in this same
        // frame. More than one only happens when the tab was away.
        while (at < wanted && at < moves.length) {
          if (layer) dropLayer(layer, moves[at]);
          at++;
          if (at >= moves.length) break;
          layer = liftLayer(moves[at]);
          if (!layer) { at = moves.length; break; }
          onMove?.(at, moves[at]);
        }

        if (at >= moves.length || !layer) {
          layer = null;
          finish(true);
          return;
        }

        const part = Math.min(1, (gone - at * pace) / pace);
        layer.group.style.transform = `${layer.spin}(${layer.degrees * easeAt(at, moves.length)(part)}deg)`;
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });

    return { stop: () => { stopped = true; }, done };
  }

  /* --- what the outside world does with it --- */

  const api = {
    el: scene,

    /** Put the cube straight into a state, with no animation. */
    async show(alg = '') {
      pattern = built.kpuzzle.defaultPattern();
      if (alg) {
        try {
          pattern = pattern.applyAlg(new Alg(String(alg)));
        } catch { /* leave it solved */ }
      }
      paint();
    },

    /**
     * Play an algorithm. Returns a handle so it can be stopped, and so the
     * course can hand the next move over one at a time.
     */
    play(alg, { pace = 420, from = null, onMove = null } = {}) {
      // Only one thing turning at a time: a second play while the first is
      // still going would interleave two sets of moves on one cube.
      running?.stop();
      const moves = String(alg).trim().split(/\s+/).filter(Boolean);
      busy = true;

      let handle = null;
      const run = (async () => {
        if (from !== null) await api.show(from);
        if (!moves.length) { busy = false; return true; }
        handle = runMoves(moves, pace, onMove);
        running = handle;
        // The cube stays where the algorithm leaves it. That is the whole point
        // of watching one: the end is the thing you came to see.
        const finished = await handle.done;
        busy = false;
        return finished;
      })();

      run.stop = () => handle?.stop();
      running = run;
      return run;
    },

    /** Stop whatever is playing, and leave the cube where it got to. */
    stop() { running?.stop(); },

    /** One move, now. For the slow mode: the cube waits for you. */
    step(move, ms = 320) {
      running?.stop();
      const handle = runMoves([move], ms, null);
      running = handle;
      return handle.done;
    },

    /**
     * Back to a state on purpose, without it looking like a glitch. A cube that
     * jumps has gone wrong; one that dims for a moment and comes back has been
     * put back, and you can tell which is which without being told. Only ever
     * called because somebody asked -- never at the end of an algorithm.
     */
    async rewind(alg) {
      scene.dataset.resetting = 'true';
      await wait(240);
      await api.show(alg);
      await wait(30);
      delete scene.dataset.resetting;
    },

    get busy() { return busy; },

    /** Turn the whole thing to look at it from somewhere else. */
    aimAt(x, y) {
      tiltX = x;
      tiltY = y;
      aim();
    },

    angle: () => [tiltX, tiltY]
  };

  /* --- dragging it round --- */

  if (drag) {
    let holding = null;
    scene.dataset.drag = 'true';

    scene.addEventListener('pointerdown', (event) => {
      holding = { x: event.clientX, y: event.clientY, tiltX, tiltY };
      scene.setPointerCapture(event.pointerId);
      box.style.transition = 'none';
    });

    scene.addEventListener('pointermove', (event) => {
      if (!holding) return;
      event.preventDefault();
      tiltY = holding.tiltY + (event.clientX - holding.x) * 0.6;
      // Straight up and straight down are as far as it goes: past that the cube
      // is upside down and you have lost which way is which.
      tiltX = Math.max(-88, Math.min(88, holding.tiltX - (event.clientY - holding.y) * 0.6));
      aim();
    });

    const letGo = (event) => {
      if (!holding) return;
      holding = null;
      try { scene.releasePointerCapture(event.pointerId); } catch { /* already gone */ }
      box.style.transition = 'transform .4s cubic-bezier(.2,.9,.3,1)';
    };
    scene.addEventListener('pointerup', letGo);
    scene.addEventListener('pointercancel', letGo);
  }

  return api;
}
