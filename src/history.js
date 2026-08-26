// Looking back over what is already stored.
//
// Nothing here changes anything; it reads a list of solves and works out the
// things you only notice with the whole history in front of you -- when each
// record fell, which five were the fastest you ever did, how much of your life
// this has taken.

import { counting, effective } from './stats.js';

/**
 * Every moment the personal best moved, oldest first.
 *
 * Not the same as a list of your fastest solves: a record is only a record on
 * the day it beats the one before it, and the list is more interesting for the
 * gaps between them than for the times themselves.
 *
 * @returns {{ms: number, at: number|null, index: number, before: number|null}[]}
 */
export function records(solves) {
  const out = [];
  let standing = null;

  counting(solves).forEach((solve, index) => {
    const value = effective(solve);
    if (!Number.isFinite(value)) return;
    if (standing === null || value < standing) {
      out.push({ ms: value, at: Number.isFinite(solve.at) ? solve.at : null, index, before: standing });
      standing = value;
    }
  });
  return out;
}

/** How long the record has stood, in whole days, or null if there is none. */
export function recordAge(solves, now = Date.now()) {
  const all = records(solves);
  const latest = all[all.length - 1];
  if (!latest?.at) return null;
  return Math.max(0, Math.floor((now - latest.at) / 86400000));
}

/** The fastest n, quickest first. */
export function fastest(solves, n = 3) {
  return counting(solves)
    .map((solve) => ({ solve, ms: effective(solve) }))
    .filter((entry) => Number.isFinite(entry.ms))
    .sort((a, b) => a.ms - b.ms)
    .slice(0, n);
}

function windowAverage(window) {
  const times = window.map(effective);
  if (times.filter((t) => !Number.isFinite(t)).length > 1) return Infinity;
  const sorted = times.slice().sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);
  return trimmed.reduce((sum, t) => sum + t, 0) / trimmed.length;
}

/**
 * The best runs of n, best first, and never two that overlap.
 *
 * Overlapping windows would fill a top ten with ten near-copies of the same
 * good afternoon, differing by one solve each. Taking the best and then
 * refusing anything that shares a solve with it gives ten distinct runs.
 *
 * @returns {{value: number, start: number, end: number}[]}
 */
export function bestRuns(solves, n = 5, howMany = 10) {
  const scored = counting(solves);
  if (scored.length < n) return [];

  const runs = [];
  for (let start = 0; start + n <= scored.length; start++) {
    const value = windowAverage(scored.slice(start, start + n));
    if (Number.isFinite(value)) runs.push({ value, start, end: start + n });
  }
  runs.sort((a, b) => a.value - b.value);

  const taken = [];
  for (const run of runs) {
    if (taken.length >= howMany) break;
    if (taken.some((other) => run.start < other.end && other.start < run.end)) continue;
    taken.push(run);
  }
  return taken;
}

/**
 * What the numbers would say without the slowest few.
 *
 * Not a statistic to act on -- it is there because it is satisfying to see, and
 * because the size of the gap says something about whether your problem is your
 * pace or your accidents.
 */
export function without(solves, drop = 1) {
  const scored = counting(solves);
  const times = scored.map(effective).filter(Number.isFinite).sort((a, b) => a - b);
  if (times.length <= drop) return null;

  const kept = times.slice(0, times.length - drop);
  const mean = (list) => list.reduce((sum, t) => sum + t, 0) / list.length;
  return { now: mean(times), then: mean(kept), dropped: times.slice(times.length - drop) };
}

/** Everything, over every session: how much of your life is in here. */
export function totals(sessions) {
  let count = 0;
  let ms = 0;
  const days = new Set();
  let first = null;

  for (const session of sessions) {
    for (const solve of session.solves) {
      count++;
      // The time on the clock, penalties and all -- a DNF still took you the
      // time it took.
      ms += Number.isFinite(solve.ms) ? solve.ms : 0;
      if (Number.isFinite(solve.at)) {
        days.add(new Date(solve.at).toDateString());
        if (first === null || solve.at < first) first = solve.at;
      }
    }
  }
  return { solves: count, ms, days: days.size, since: first };
}

/** How long that adds up to, in words rather than a number of milliseconds. */
export function spellDuration(ms) {
  const minutes = Math.round(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 1) return `${minutes} ${minutes === 1 ? 'minuut' : 'minuten'}`;
  if (!rest) return `${hours} ${hours === 1 ? 'uur' : 'uur'}`;
  return `${hours} uur en ${rest} ${rest === 1 ? 'minuut' : 'minuten'}`;
}

const dayKey = (at) => {
  const date = new Date(at);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/**
 * One entry per day you solved, over every session.
 * @returns {Map<string, {count: number, best: number|null, ms: number}>}
 */
export function byDay(sessions) {
  const days = new Map();
  for (const session of sessions) {
    for (const solve of session.solves) {
      if (!Number.isFinite(solve.at)) continue;
      const key = dayKey(solve.at);
      const day = days.get(key) || { count: 0, best: null, ms: 0 };
      day.count++;
      day.ms += Number.isFinite(solve.ms) ? solve.ms : 0;
      const value = effective(solve);
      if (Number.isFinite(value) && (day.best === null || value < day.best)) day.best = value;
      days.set(key, day);
    }
  }
  return days;
}

/**
 * One line a day, written by nobody. A diary you never had to keep.
 *
 * @returns {{day: string, at: number, count: number, best: number|null, note: string}[]}
 */
export function diary(sessions, howMany = 30) {
  const days = byDay(sessions);
  const marks = new Map();

  // When each record fell, so a day can say that it was the day one did.
  for (const session of sessions) {
    for (const mark of records(session.solves)) {
      if (!mark.at) continue;
      const key = dayKey(mark.at);
      const had = marks.get(key);
      if (!had || mark.ms < had) marks.set(key, mark.ms);
    }
  }

  return [...days.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, howMany)
    .map(([day, seen]) => {
      const record = marks.get(day);
      const bits = [`${seen.count} ${seen.count === 1 ? 'solve' : 'solves'}`];
      if (seen.best !== null) bits.push(`beste ${(seen.best / 1000).toFixed(2)}`);
      if (record !== undefined) bits.push('record verbroken');
      return {
        day,
        at: new Date(`${day}T12:00:00`).getTime(),
        count: seen.count,
        best: seen.best,
        note: bits.join(' · ')
      };
    });
}

/**
 * A year of days, oldest first, with nothing for the days you did not solve.
 * Squares on a wall rather than a line on a graph.
 */
export function yearOfDays(sessions, until = new Date()) {
  const days = byDay(sessions);
  const out = [];
  const cursor = new Date(until);
  cursor.setHours(12, 0, 0, 0);
  cursor.setDate(cursor.getDate() - 363);

  let most = 0;
  for (const day of days.values()) most = Math.max(most, day.count);

  for (let i = 0; i < 364; i++) {
    const key = dayKey(cursor.getTime());
    const seen = days.get(key);
    out.push({
      day: key,
      weekday: (cursor.getDay() + 6) % 7, // Monday first
      count: seen?.count || 0,
      best: seen?.best ?? null,
      // Four steps, so a busy day and a very busy day still look different.
      level: seen ? Math.min(4, Math.ceil((seen.count / Math.max(most, 1)) * 4)) : 0
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/**
 * Solves from this same date in earlier years, newest of those first. Empty
 * almost always, which is the point: when it is not, it is worth seeing.
 */
export function onThisDay(sessions, now = Date.now()) {
  const today = new Date(now);
  const out = [];

  for (const session of sessions) {
    for (const solve of session.solves) {
      if (!Number.isFinite(solve.at)) continue;
      const then = new Date(solve.at);
      if (then.getFullYear() === today.getFullYear()) continue;
      if (then.getMonth() !== today.getMonth() || then.getDate() !== today.getDate()) continue;
      out.push({ solve, session: session.name, years: today.getFullYear() - then.getFullYear() });
    }
  }
  out.sort((a, b) => a.years - b.years || effective(a.solve) - effective(b.solve));
  return out;
}
