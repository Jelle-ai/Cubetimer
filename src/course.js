// Learning to solve, in seven steps.
//
// Not a wall of algorithms, and not a course about F2L or full OLL either.
// Those are things you go and look up in the case book once you can already
// solve the cube; putting them here is what turns a beginner's course into a
// thing people close again. This stops at "I can solve a Rubik's cube", and
// hands you over to the rest of the app.
//
// Every step is built the same way, because a shape you recognise is one you
// can read quickly: what you are trying to do, what you are looking at, the
// moves numbered one by one, the mistake everybody makes, and how you know you
// are done. The words are English here; lang-nl.js has the Dutch beside them,
// and app.js puts everything through t() when it draws it.
//
// The moves in "does" can be played on the cube: `alg` is what turns, and
// `from` is the state to set up first so that the move has something to do.

/** The map is drawn in this box, and the road is stitched through the stops. */
export const MAP = { width: 120, height: 560 };

/**
 * One solve, taken apart.
 *
 * The scramble is not chosen and the stages are not written by hand: the four
 * stages were written first, and the scramble is their inverse. That means the
 * cross moves really do make the cross on this scramble, the F2L moves really
 * do fill the slots, and so on -- not because somebody checked, but because
 * there is no way for it to be otherwise. The test still checks it.
 */
export const DEMO = {
  cross: "D2 R F' D' L2 F2",
  f2l: "R U R' U' F' U F U2 R U R' U' R U R' U' L' U L",
  oll: "R U R' U R U2 R'",
  pll: "R U R' U' R' F R2 U' R' U' R U R' F'"
};

/** The whole solution, and the scramble that needs it. */
export const DEMO_SOLUTION = [DEMO.cross, DEMO.f2l, DEMO.oll, DEMO.pll].join(' ');

/** Turning an algorithm back to front, which is how the scramble is made. */
export function invert(moves) {
  return moves.trim().split(/\s+/).filter(Boolean).reverse()
    .map((move) => (move.endsWith("'") ? move.slice(0, -1) : move.endsWith('2') ? move : `${move}'`))
    .join(' ');
}

export const DEMO_SCRAMBLE = invert(DEMO_SOLUTION);

/** Which stage of the demo solve each step has reached. */
const UPTO = {
  language: '',
  cross: DEMO.cross,
  layers: [DEMO.cross, DEMO.f2l].join(' '),
  yellowcross: [DEMO.cross, DEMO.f2l].join(' '),
  yellowcorners: [DEMO.cross, DEMO.f2l, DEMO.oll].join(' '),
  corners: [DEMO.cross, DEMO.f2l, DEMO.oll].join(' '),
  edges: DEMO_SOLUTION
};

/** The state the map's cube should be in once you have done this many steps. */
export function cubeAfter(doneIds) {
  const last = STEPS.filter((step) => doneIds.includes(step.id)).pop();
  return `${DEMO_SCRAMBLE} ${last ? UPTO[last.id] : ''}`.trim();
}

export const STEPS = [
  {
    id: 'language',
    name: 'The language',
    subtitle: 'What a cube is, and how a move is written',
    at: [26, 34],
    minutes: 15,
    goal: 'Be able to read a move and do it without thinking twice.',
    see: [
      'A cube has six sides and three kinds of piece. Six **centres**, which are fixed to each other and never move: the white centre stays opposite the yellow one, whatever you do. Twelve **edges**, with two colours. Eight **corners**, with three.',
      'That gives you the most important sentence of the whole course: **the centres decide what colour a side is.** So you never look for "where does white go", you look for "where is the white centre".'
    ],
    does: [
      {
        say: 'A move is one letter, and the letter is the side you turn while your nose points at the cube: **R** right, **L** left, **U** up, **D** down, **F** front, **B** back.',
        alg: 'R', why: 'The right-hand side, a quarter turn clockwise as if you were looking straight at it.'
      },
      {
        say: 'An **apostrophe** means the other way round.',
        alg: "R'", why: 'The same side, anticlockwise. R then R’ puts everything back.'
      },
      {
        say: 'A **2** is a half turn, and it has no direction.',
        alg: 'R2', why: 'Half a turn. R2 and R2’ are the same thing, so nobody writes the second one.'
      },
      {
        say: 'Now the first thing your fingers should learn. Do this six times on a solved cube and it comes back exactly where it started. That is not a trick: every sequence returns eventually, and this one after six.',
        alg: "R U R' U' R U R' U' R U R' U' R U R' U' R U R' U' R U R' U'",
        why: 'The sexy move, six times over. Watch the top layer wander off and come home.'
      }
    ],
    wrong: 'Turning the whole cube in your hands while you practise notation. Keep it still: R is only R while the same side is on the right.',
    check: 'You can do R U R’ U’ six times without looking, and the cube is solved again.'
  },
  {
    id: 'cross',
    name: 'The cross',
    subtitle: 'Four edges, on the bottom',
    at: [94, 122],
    minutes: 60,
    goal: 'Four edges of one colour around the bottom centre, with their side colours matching the centres beside them.',
    see: [
      'Pick a colour to solve on. White is the habit; this app works on any of them and you set it in the settings. Hold that colour **underneath**, not on top — you want to be able to look under the cube, and otherwise you have to turn the whole thing over for the next step.',
      'A cross where the side colours do not match is not a cross. It is four pieces that happen to be at the bottom.',
      'This is the only step without algorithms, and the only one where you really have to think. It is also where most of your time is hiding.'
    ],
    does: [
      {
        say: 'Find an edge of your colour, bring it to the top layer, and turn the top until it sits directly above where it belongs. Then turn that side twice and it drops in.',
        alg: 'F2', from: "F2 U'", why: 'The edge was above its place with the right colour upwards. Two turns and it is home.'
      },
      {
        say: 'If the edge is above its place but the **wrong way round**, two turns would put it in upside down. Take it round the side instead.',
        alg: "U R U'", from: "U R' U'", why: 'It goes down the side rather than straight down, which flips it on the way.'
      },
      {
        say: 'An edge stuck in the middle layer comes up first.',
        alg: "R U R'", from: "R U' R'", why: 'Out of the slot, onto the top, and now it is the ordinary story again.'
      },
      {
        say: 'Here is the whole cross for the scramble on the map — six moves.',
        alg: DEMO.cross, from: DEMO_SCRAMBLE, why: 'Watch the four white edges arrive underneath, one by one.'
      }
    ],
    wrong: 'Building the cross on top because you can see it better, and then turning the cube over. Learn it underneath from day one — turning it over later costs people months.',
    check: 'Four edges underneath, every side colour matching, and you used no algorithm.',
    drill: { mode: 'cross' }
  },
  {
    id: 'layers',
    name: 'The first two layers',
    subtitle: 'A corner, then the edge beside it — four times',
    at: [26, 210],
    minutes: 120,
    goal: 'The bottom two layers finished, leaving only the top layer to sort out.',
    see: [
      'The first two layers are four **slots**: four corners of your cross colour, each with the edge that belongs next to it. You fill them one at a time. Keep the cross underneath and work in the slot at the front right, so it is always the same movement.',
      'You need exactly two things, and you already know one of them.'
    ],
    does: [
      {
        say: '**The corner.** Find the corner with your cross colour that belongs at the front right. Turn the top until it sits above that slot. Now do the sexy move and look. Not right? Do it again. After five goes at most, the corner drops in — the sexy move takes it out, twists it a little, and puts it back.',
        alg: "R U R' U'", from: "R U R' U'", why: 'Once. Repeat until the corner is in with the cross colour underneath.'
      },
      {
        say: '**The edge.** Find the edge that belongs beside that corner and bring it to the top. Turn the top until the edge points **away** from its slot, then push it in.',
        alg: "U R U' R'", from: "R U R' U'", why: 'Up and over, and it settles into the slot beside its corner.'
      },
      {
        say: 'The same thing mirrored, for when the edge is on the other side.',
        alg: "U' F' U F", from: "F' U' F U", why: 'Left hand instead of right. Everything on a cube has a mirror.'
      },
      {
        say: 'And here are all four slots on the map’s scramble, after the cross.',
        alg: DEMO.f2l, from: `${DEMO_SCRAMBLE} ${DEMO.cross}`, why: 'Four pairs, one after another. The bottom two layers close up.'
      }
    ],
    wrong: 'Trying to put the edge in while its corner is not in yet. Corner first, always — the edge has nothing to sit against otherwise.',
    check: 'Two layers finished, and the third is a mess. That is exactly right.'
  },
  {
    id: 'yellowcross',
    name: 'The yellow cross',
    subtitle: 'The top edges, the right way up — three cases',
    at: [94, 298],
    minutes: 45,
    goal: 'A cross of your top colour on the top face. The corners can be anything at all.',
    see: [
      'From here the top layer is done in two halves: first everything the right way **up**, then everything in the right **place**. And the first half splits in two again.',
      'Look only at the **edges** on top. There are exactly three possibilities: a **dot** (no edge right), a **line** (two opposite each other) or a **hook** (two next to each other).',
      'All three are solved with the same movement, only more often.'
    ],
    does: [
      {
        say: '**Line.** Lay it flat, left to right, in front of you.',
        alg: "F R U R' U' F'", from: "F U R U' R' F'", why: 'One go and the cross is there.'
      },
      {
        say: '**Hook.** Turn the top so the two good edges point up and left, then do the two-layer version.',
        alg: "f R U R' U' f'", from: "f U R U' R' f'", why: 'The same moves with two layers instead of one.'
      },
      {
        say: '**Dot.** Do the line one, look again, and you will have a hook or a line. Then do that one.',
        alg: "F R U R' U' F' f R U R' U' f'", from: "f U R U' R' f' F U R U' R' F'", why: 'Both of them, back to back.'
      }
    ],
    wrong: 'Doing it from the wrong angle. A line must be horizontal and a hook must sit up and to the left, or you get a different case out than the one you wanted.',
    check: 'A cross of your top colour on top. The corners are still all over the place, and that is fine.',
    drill: { group: 'eo' }
  },
  {
    id: 'yellowcorners',
    name: 'The yellow corners',
    subtitle: 'The whole top face, one colour — seven cases',
    at: [26, 386],
    minutes: 120,
    goal: 'The top face entirely one colour.',
    see: [
      'The edges are right now, so look only at the four **corners**. There are seven possibilities, and they have names people actually use: Sune, Antisune, Pi, Headlights, Double Sune, Bowtie and T-corners.',
      'Learn the **Sune** first. Four of the other six are a Sune with a small run-up, so it is by far the best value for the effort.'
    ],
    does: [
      {
        say: '**Sune.** One corner is already right. Hold it at the back left and go.',
        alg: "R U R' U R U2 R'", from: "R U2 R' U' R U' R'", why: 'Seven moves and the top is one colour.'
      },
      {
        say: '**Antisune.** The mirror, for when the one good corner is at the front left.',
        alg: "R U2 R' U' R U' R'", from: "R U R' U R U2 R'", why: 'The same idea the other way round.'
      },
      {
        say: 'And the map’s cube, which happens to land on a Sune.',
        alg: DEMO.oll, from: `${DEMO_SCRAMBLE} ${DEMO.cross} ${DEMO.f2l}`, why: 'From two layers to a whole yellow face.'
      }
    ],
    wrong: 'Counting the good corners wrong. Look at the top face only: a corner counts as good when its top sticker is the top colour, not when it is in the right place.',
    check: 'The top face is one colour all over. The sides still do not match — that is the next two steps.',
    drill: { group: 'ocll' }
  },
  {
    id: 'corners',
    name: 'Putting the corners in place',
    subtitle: 'Look for headlights — two cases',
    at: [94, 474],
    minutes: 60,
    goal: 'The four top corners in the right places, even if the edges are not.',
    see: [
      'Now everything on top is the right way up, and all that is left is moving pieces to where they belong. Corners first.',
      'Look at the **sides** of the top layer and hunt for **headlights**: two corners on the same side showing the same colour. That side is finished, corner-wise.',
      'Headlights on one side? Hold that side at the **back** and do the A-perm once. No headlights anywhere? Do the A-perm once from any angle, look again, and now there will be.'
    ],
    does: [
      {
        say: '**A-perm.** It cycles three corners and leaves the edges completely alone.',
        alg: "R' F R' B2 R F' R' B2 R2", from: "R2 B2 R F R' B2 R F' R", why: 'Three corners move round; the edges do not budge.'
      }
    ],
    wrong: 'Holding the headlights at the front. They go at the back — from the front you will send the wrong three corners round.',
    check: 'Every top corner is between the right two centres. The edges may still be wrong.',
    drill: { group: 'pll', only: ['Aa', 'Ab'] }
  },
  {
    id: 'edges',
    name: 'Putting the edges in place',
    subtitle: 'The last four pieces — four cases',
    at: [26, 546],
    minutes: 60,
    goal: 'A solved cube.',
    see: [
      'The corners are home, so only the four top edges are left. Four cases: **Ua** and **Ub** (three edges going round), **H** (two pairs swapping across) and **Z** (two pairs swapping next to each other).',
      'All four go with the **M slice** — the layer between L and R. Turn it with your left index finger, not your whole hand.'
    ],
    does: [
      { say: '**Ua.** Hold the edge that is already right at the back.', alg: "M2 U M U2 M' U M2", from: "M2 U' M U2 M' U' M2", why: 'Three edges go round one way.' },
      { say: '**Ub.** The same, the other way round.', alg: "M2 U' M U2 M' U' M2", from: "M2 U M U2 M' U M2", why: 'Three edges the other way.' },
      { say: '**H.** All four edges swap in pairs, across the cube.', alg: 'M2 U M2 U2 M2 U M2', from: 'M2 U M2 U2 M2 U M2', why: 'Beautifully symmetric, and it is its own inverse.' },
      { say: '**Z.** Two pairs swap side by side.', alg: "M' U M2 U M2 U M' U2 M2 U'", from: "U M2 U2 M U' M2 U' M2 U' M", why: 'The one that takes a moment to recognise.' },
      { say: 'And the last piece of the map’s solve.', alg: DEMO.pll, from: `${DEMO_SCRAMBLE} ${DEMO.cross} ${DEMO.f2l} ${DEMO.oll}`, why: 'Corners and edges at once, this time — a T-perm. The cube is solved.' }
    ],
    wrong: 'Forgetting the last turn. Sometimes everything is right and the whole top layer is a quarter turn out. One U and you are done — people forget this constantly.',
    check: 'The cube is solved. Congratulations, you are a cuber.',
    drill: { group: 'pll', only: ['Ua', 'Ub', 'H', 'Z'] }
  }
];

/**
 * The road, stitched through the stops so the two can never disagree. It takes
 * the stops rather than reading them, so the same function draws the upright
 * road and the one laid on its side.
 */
export function roadPath(steps = STEPS) {
  if (!steps.length) return '';
  const points = steps.map((step) => step.at);
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let at = 1; at < points.length; at++) {
    const [x, y] = points[at];
    const [px, py] = points[at - 1];
    const mid = (py + y) / 2;
    d += ` C ${px} ${mid}, ${x} ${mid}, ${x} ${y}`;
  }
  return d;
}

export const stepAt = (id) => STEPS.findIndex((step) => step.id === id);

/** How far along the road you are. */
export function howFar(done) {
  const had = STEPS.filter((step) => done.includes(step.id)).length;
  return { had, all: STEPS.length, part: STEPS.length ? had / STEPS.length : 0 };
}

/** The step you are on: the first one you have not ticked off. */
export const nextStep = (done) => STEPS.find((step) => !done.includes(step.id)) || null;

/**
 * Whether a step can be opened at all.
 *
 * You cannot skip ahead: step four is shut until step three is ticked. Which
 * would be cruel to somebody who can already solve, so every step also has a
 * way past it -- "I can do this" ticks it off without reading a word.
 */
export const isOpen = (step, done) => {
  const at = stepAt(step.id);
  return at === 0 || done.includes(step.id) || done.includes(STEPS[at - 1].id);
};

/** Roughly how long the rest takes, for the person deciding to start. */
export const hoursLeft = (done) =>
  Math.round(STEPS.filter((step) => !done.includes(step.id)).reduce((sum, step) => sum + step.minutes, 0) / 60);
