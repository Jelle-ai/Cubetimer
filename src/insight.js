import { t } from './lang.js';
// The questions a list of times cannot answer by looking at it.
//
// Every timer shows an average and a graph, and a graph of times is mostly
// noise wearing a trend as a hat. The things worth knowing -- am I actually
// faster than a month ago, or did I just have a good evening; where in a
// sitting am I quickest; does looking longer pay -- all need the same trick:
// compare like with like, and check the answer against chance before saying it
// out loud.

import { counting, effective } from './stats.js';

const median = (list) => {
  if (!list.length) return NaN;
  const sorted = list.slice().sort((a, b) => a - b);
  const half = sorted.length >> 1;
  return sorted.length % 2 ? sorted[half] : (sorted[half - 1] + sorted[half]) / 2;
};

const mean = (list) => (list.length ? list.reduce((sum, value) => sum + value, 0) / list.length : NaN);

/** A reproducible shuffle, so the same history gives the same verdict twice. */
function mulberry(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const times = (solves) => counting(solves).map(effective).filter(Number.isFinite);

/* ---------- am I really getting better ---------- */

/**
 * Whether a difference between then and now is bigger than a good evening.
 *
 * The honest way to ask is to see how often chance alone makes a gap this big:
 * throw all the solves in one bag, deal them back into two piles of the same
 * sizes, and see how often the piles differ by as much as the real ones do. If
 * that happens easily, the improvement is not there yet, whatever the graph
 * looks like.
 *
 * @param {object[]} solves oldest first
 * @param {number} window how many at each end to compare
 * @returns {{then: number, now: number, gap: number, share: number, sure: boolean,
 *   spread: number, counted: number}|null}
 */
export function trend(solves, window = 50, rounds = 2000) {
  const all = times(solves);
  if (all.length < window * 2) return null;

  const early = all.slice(0, window);
  const late = all.slice(-window);
  const then = median(early);
  const now = median(late);
  const gap = then - now;

  const bag = early.concat(late);
  const roll = mulberry(bag.length * 7919 + Math.round(then + now));
  let asBig = 0;
  for (let round = 0; round < rounds; round++) {
    const shuffled = bag.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(roll() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const split = median(shuffled.slice(0, window)) - median(shuffled.slice(window));
    if (Math.abs(split) >= Math.abs(gap)) asBig++;
  }

  const share = asBig / rounds;
  return {
    then,
    now,
    gap,
    share,                       // how often chance does this well
    sure: share < 0.05,
    spread: median(late.map((value) => Math.abs(value - now))),
    counted: all.length
  };
}

/* ---------- the shape of a sitting ---------- */

/** A gap this long means you got up and came back; that is a new sitting. */
const APART_MS = 30 * 60 * 1000;

/** The solves split into sittings, in order, each one a run without a break. */
export function sittings(sessions) {
  const out = [];
  for (const session of sessions) {
    let current = null;
    let previous = null;
    for (const solve of counting(session.solves)) {
      if (!Number.isFinite(solve.at) || !Number.isFinite(effective(solve))) continue;
      if (!current || solve.at - previous > APART_MS) {
        current = [];
        out.push(current);
      }
      current.push(solve);
      previous = solve.at;
    }
  }
  return out.filter((run) => run.length >= 8);
}

/** Where in a sitting you are quick, measured against your own median that day. */
const STRETCHES = [
  { from: 0, to: 5, name: t('the first five') },
  { from: 5, to: 10, name: 'solve 6 tot 10' },
  { from: 10, to: 20, name: 'solve 11 tot 20' },
  { from: 20, to: 40, name: 'solve 21 tot 40' },
  { from: 40, to: Infinity, name: 'na veertig' }
];

/**
 * How you do at each point of a sitting, as a percentage of that sitting's own
 * middle -- so a slow day and a fast day count the same, and what is left is
 * the shape rather than the level.
 *
 * @returns {{name: string, share: number, solves: number}[]|null} share below
 *   1 means quicker than your middle
 */
export function sessionShape(sessions) {
  const runs = sittings(sessions);
  if (runs.length < 3) return null;

  const buckets = STRETCHES.map((stretch) => ({ ...stretch, ratios: [] }));
  for (const run of runs) {
    const middle = median(run.map(effective));
    if (!Number.isFinite(middle) || middle <= 0) continue;
    run.forEach((solve, index) => {
      const bucket = buckets.find((entry) => index >= entry.from && index < entry.to);
      if (bucket) bucket.ratios.push(effective(solve) / middle);
    });
  }

  const out = buckets
    .filter((bucket) => bucket.ratios.length >= 10)
    .map((bucket) => ({ name: bucket.name, share: median(bucket.ratios), solves: bucket.ratios.length }));
  return out.length >= 2 ? out : null;
}

/* ---------- does looking longer pay ---------- */

const LOOKS = [
  { under: 4000, name: 'onder 4s' },
  { under: 8000, name: '4 tot 8s' },
  { under: 12000, name: '8 tot 12s' },
  { under: Infinity, name: 'boven 12s' }
];

/**
 * Solve time against how long you inspected. Not advice -- your own numbers,
 * which is the only place this question has ever been answerable.
 *
 * @returns {{name: string, middle: number, solves: number, dnf: number}[]|null}
 */
export function inspectionPays(sessions) {
  const buckets = LOOKS.map((look) => ({ ...look, values: [], dnf: 0 }));
  let counted = 0;

  for (const session of sessions) {
    for (const solve of counting(session.solves)) {
      if (!Number.isFinite(solve.inspect)) continue;
      const bucket = buckets.find((entry) => solve.inspect < entry.under);
      if (!bucket) continue;
      counted++;
      if (solve.penalty === 'DNF') { bucket.dnf++; continue; }
      const value = effective(solve);
      if (Number.isFinite(value)) bucket.values.push(value);
    }
  }
  if (counted < 30) return null;

  const out = buckets
    .filter((bucket) => bucket.values.length >= 8)
    .map((bucket) => ({
      name: bucket.name,
      middle: median(bucket.values),
      solves: bucket.values.length,
      dnf: bucket.dnf
    }));
  return out.length >= 2 ? out : null;
}

/* ---------- comparing fairly ---------- */

/**
 * An average with the luck of the draw taken out.
 *
 * A session of easy scrambles gives a better average than a session of hard
 * ones, and no timer has ever said so. The cross length of each scramble is
 * known here, so time can be fitted against it: what is left is what you would
 * have averaged on scrambles of ordinary difficulty.
 *
 * @param {(scramble: string) => number|null} difficulty cross length of a scramble
 * @returns {{plain: number, fair: number, slope: number, counted: number,
 *   luck: number, easy: number}|null} slope is ms per extra cross move
 */
export function fairAverage(solves, difficulty, level = 6) {
  const pairs = [];
  for (const solve of counting(solves)) {
    const value = effective(solve);
    if (!Number.isFinite(value)) continue;
    const moves = solve.scramble ? difficulty(solve.scramble) : null;
    if (!Number.isFinite(moves)) continue;
    pairs.push([moves, value]);
  }
  if (pairs.length < 20) return null;

  const xs = pairs.map((pair) => pair[0]);
  const ys = pairs.map((pair) => pair[1]);
  const mx = mean(xs);
  const my = mean(ys);
  let top = 0;
  let bottom = 0;
  pairs.forEach(([x, y]) => {
    top += (x - mx) * (y - my);
    bottom += (x - mx) ** 2;
  });
  // No spread in difficulty means nothing to correct for.
  const slope = bottom > 0 ? top / bottom : 0;

  return {
    plain: my,
    fair: my + slope * (level - mx),
    slope,
    counted: pairs.length,
    easy: mx,                    // how hard your scrambles actually were
    luck: slope * (level - mx)   // what the draw was worth, in milliseconds
  };
}

/* ---------- the ones that hurt ---------- */

/**
 * Your worst solves, and what each of them cost.
 *
 * The cost is the honest bit: a disaster in the middle of five is worth far
 * more than the same disaster on its own, because it takes an average with it.
 *
 * @returns {{solve: object, ms: number, index: number, over: number, cost: number}[]}
 */
export function worstSolves(solves, howMany = 5) {
  const scored = counting(solves);
  const values = scored.map(effective);
  const middle = median(values.filter(Number.isFinite));
  if (!Number.isFinite(middle)) return [];

  return scored
    .map((solve, index) => ({ solve, index, ms: values[index] }))
    .filter((entry) => Number.isFinite(entry.ms) && entry.ms > middle)
    .map((entry) => ({
      ...entry,
      over: entry.ms - middle,
      // What it did to the five it sat in: one solve in five, minus the two the
      // average throws away, so it lands on three of them.
      cost: (entry.ms - middle) / 3
    }))
    .sort((a, b) => b.over - a.over)
    .slice(0, howMany);
}

/* ---------- where you lose it ---------- */

/**
 * How your solve divides up, and which stretch is out of step.
 *
 * A world-class solve is roughly an eighth cross, half F2L, a fifth OLL and a
 * fifth PLL. Yours will not be, and the stretch furthest from that is the one
 * where the next thirty seconds of practice are worth most. Only the shares are
 * compared, never the times: this says where your time goes, not how you
 * measure up.
 */
const IDEAL = [0.12, 0.5, 0.19, 0.19];
const STAGES = ['kruis', 'F2L', 'OLL', 'PLL'];

/**
 * @returns {{stages: {name: string, share: number, ideal: number, off: number}[],
 *   worst: object, counted: number}|null}
 */
export function weakStage(solves) {
  const runs = counting(solves).filter((solve) => Array.isArray(solve.splits) && solve.splits.length === 4);
  if (runs.length < 5) return null;

  const shares = STAGES.map((name, stage) => {
    const list = runs
      .map((solve) => {
        const whole = solve.splits.reduce((sum, part) => sum + part, 0);
        return whole > 0 ? solve.splits[stage] / whole : NaN;
      })
      .filter(Number.isFinite);
    const share = median(list);
    return { name, share, ideal: IDEAL[stage], off: share - IDEAL[stage] };
  });

  const worst = shares.reduce((most, stage) => (stage.off > most.off ? stage : most), shares[0]);
  return { stages: shares, worst, counted: runs.length };
}

/**
 * The case you are slowest at, out of the ones you have drilled.
 * @param {object} standing what caseStanding gives back
 */
export function weakCase(standing) {
  const known = (standing || []).filter((entry) => entry.count >= 3 && Number.isFinite(entry.mean));
  if (known.length < 3) return null;
  const sorted = known.slice().sort((a, b) => b.mean - a.mean);
  return { slowest: sorted[0], quickest: sorted[sorted.length - 1], counted: known.length };
}

/* ---------- the day it clicked ---------- */

/**
 * When a case stopped being one you had to think about.
 *
 * Learning an algorithm does not show up as a slope; it shows up as a step. So
 * this looks for the split where everything after is a good deal quicker than
 * everything before, with enough on both sides for that to mean something, and
 * takes the biggest one. No step, no claim.
 *
 * @param {{ms: number, penalty: string, at: number}[]} times oldest first
 * @returns {{at: number, before: number, after: number, index: number}|null}
 */
const CLICK_DROP = 0.75;   // after has to be this much of before, or less
const CLICK_SIDE = 4;      // and there have to be this many on each side

export function learnedWhen(times) {
  const values = times.map((one) => effective(one));
  if (values.filter(Number.isFinite).length < CLICK_SIDE * 2) return null;

  let best = null;
  for (let split = CLICK_SIDE; split <= values.length - CLICK_SIDE; split++) {
    const before = median(values.slice(0, split).filter(Number.isFinite));
    const after = median(values.slice(split).filter(Number.isFinite));
    if (!Number.isFinite(before) || !Number.isFinite(after)) continue;
    if (after > before * CLICK_DROP) continue;
    const drop = before - after;
    if (!best || drop > best.drop) {
      best = { drop, at: times[split]?.at || 0, before, after, index: split };
    }
  }
  if (!best) return null;
  const { drop, ...rest } = best;
  return rest;
}

/* ---------- you, against you ---------- */

const A_WHILE_MS = 21 * 86400000;

/**
 * Your best five in a row from a while back, against your best five lately.
 *
 * Not your average then and your average now -- those move for all sorts of
 * reasons. Your best run then against your best run now is the fairest version
 * of the question you actually want answered, which is whether the good days
 * are better than the good days used to be.
 *
 * @returns {{then: {value: number, times: object[], at: number},
 *   now: {value: number, times: object[], at: number}, gap: number}|null}
 */
export function thenAndNow(solves, now = Date.now(), window = 5) {
  const scored = counting(solves).filter((solve) => Number.isFinite(solve.at));
  if (scored.length < window * 4) return null;

  const bestRun = (list) => {
    let found = null;
    for (let start = 0; start + window <= list.length; start++) {
      const slice = list.slice(start, start + window);
      const times = slice.map(effective);
      if (times.filter((one) => !Number.isFinite(one)).length > 1) continue;
      const sorted = times.slice().sort((a, b) => a - b).slice(1, -1);
      const value = sorted.reduce((sum, one) => sum + one, 0) / sorted.length;
      if (!Number.isFinite(value)) continue;
      if (!found || value < found.value) found = { value, times: slice, at: slice[slice.length - 1].at };
    }
    return found;
  };

  const cut = now - A_WHILE_MS;
  const older = scored.filter((solve) => solve.at < cut);
  const lately = scored.filter((solve) => solve.at >= cut);
  if (older.length < window * 2 || lately.length < window * 2) return null;

  const then = bestRun(older);
  const current = bestRun(lately);
  if (!then || !current) return null;
  return { then, now: current, gap: then.value - current.value };
}

/* ---------- a goal with a date on it ---------- */

/**
 * Whether a time by a date is still on.
 *
 * Worked out from how fast you have actually been improving rather than from
 * hope: the last hundred solves against the hundred before them give a rate per
 * day, and the rate says whether the gap that is left closes in time. A rate of
 * nothing or the wrong way round means there is no date to give, and it says
 * that instead of inventing one.
 *
 * @returns {{now: number, target: number, byDay: number|null, rate: number,
 *   onTrack: boolean|null, needed: number}|null}
 */
export function aimAt(solves, target, deadline, now = Date.now()) {
  const scored = counting(solves).filter((solve) => Number.isFinite(solve.at));
  if (scored.length < 40 || !Number.isFinite(target)) return null;

  const half = Math.min(100, Math.floor(scored.length / 2));
  const older = scored.slice(-half * 2, -half);
  const lately = scored.slice(-half);
  const middle = (list) => median(list.map(effective).filter(Number.isFinite));

  const was = middle(older);
  const is = middle(lately);
  if (!Number.isFinite(was) || !Number.isFinite(is)) return null;

  const days = Math.max(1, (lately[lately.length - 1].at - older[0].at) / 86400000);
  const rate = (was - is) / days;          // milliseconds a day, faster is positive
  const left = is - target;
  const daysLeft = Number.isFinite(deadline) ? Math.max(0, (deadline - now) / 86400000) : null;

  return {
    now: is,
    target,
    rate,
    needed: left,
    daysLeft,
    // Reached already, or fast enough to close the gap in the time that is left.
    onTrack: left <= 0 ? true : rate <= 0 ? false : daysLeft === null ? null : rate * daysLeft >= left,
    byDay: rate > 0 ? now + (left / rate) * 86400000 : null
  };
}
