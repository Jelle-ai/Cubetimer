// Things worth noticing, and the moment you first did them.
//
// A number that goes up is not a moment. Your thousandth solve, your first
// sub-15, a hundred days in a row -- those happen once and then are gone unless
// something catches them. Every badge is a plain question asked of everything
// you have, so the whole cabinet can be worked out from scratch at any time and
// nothing has to be trusted to have been recorded correctly on the day.

import { counting, effective, formatTime } from './stats.js';
import { locale, t } from './lang.js';

/** Sub-somethings worth having, coarse enough that they stay rare. */
const WALLS = [60, 45, 30, 25, 20, 17, 15, 13, 12, 11, 10, 9, 8, 7, 6, 5];

const dayOf = (at) => new Date(at).toDateString();

/**
 * Everything you have, flattened into the few things a badge ever asks about.
 * Working it out once and handing it round beats every badge walking the same
 * thousands of solves again.
 */
export function survey(sessions, play) {
  const solves = [];
  for (const session of sessions) {
    for (const solve of counting(session.solves)) solves.push(solve);
  }
  solves.sort((a, b) => (a.at || 0) - (b.at || 0));

  const days = new Map();
  const puzzlesByDay = new Map();
  let fastest = Infinity;
  let firstUnder = new Map();
  let nightOwl = null;
  let earlyBird = null;

  for (const session of sessions) {
    for (const solve of counting(session.solves)) {
      if (!Number.isFinite(solve.at)) continue;
      const day = dayOf(solve.at);
      days.set(day, (days.get(day) || 0) + 1);
      const seen = puzzlesByDay.get(day) || new Set();
      seen.add(session.puzzle);
      puzzlesByDay.set(day, seen);

      const hour = new Date(solve.at).getHours();
      if (hour >= 0 && hour < 5 && (nightOwl === null || solve.at < nightOwl)) nightOwl = solve.at;
      if (hour >= 5 && hour < 7 && (earlyBird === null || solve.at < earlyBird)) earlyBird = solve.at;
    }
  }

  for (const solve of solves) {
    const value = effective(solve);
    if (!Number.isFinite(value)) continue;
    fastest = Math.min(fastest, value);
    for (const wall of WALLS) {
      if (value < wall * 1000 && !firstUnder.has(wall)) firstUnder.set(wall, solve);
    }
  }

  return {
    solves,
    total: solves.reduce((sum, session) => sum + 1, 0),
    days,
    puzzlesByDay,
    fastest,
    firstUnder,
    nightOwl,
    earlyBird,
    play: play || { runs: [], daily: {}, cases: {}, duels: [] }
  };
}

/** When the nth solve happened, or null if you have not got there. */
function nth(solves, count) {
  return solves.length >= count ? solves[count - 1] : null;
}

/** The longest run of days in a row, and the day it ended. */
export function longestRun(days) {
  const stamps = [...days.keys()].map((day) => new Date(day).setHours(12, 0, 0, 0)).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let previous = null;
  let endedAt = null;
  let bestEnd = null;

  for (const stamp of stamps) {
    run = previous !== null && stamp - previous <= 86400000 * 1.5 ? run + 1 : 1;
    previous = stamp;
    endedAt = stamp;
    if (run > best) { best = run; bestEnd = endedAt; }
  }
  return { days: best, at: bestEnd };
}

/**
 * The cabinet. Each entry answers the same question -- have I done this, and
 * when -- so the whole thing is derived rather than remembered.
 *
 * @returns {{id: string, name: string, about: string, at: number|null, detail: string}[]}
 */
export function badges(sessions, play) {
  const seen = survey(sessions, play);
  const out = [];
  const at = (solve) => (solve && Number.isFinite(solve.at) ? solve.at : null);

  for (const count of [1, 10, 100, 500, 1000, 5000]) {
    const solve = nth(seen.solves, count);
    out.push({
      id: `solves-${count}`,
      name: count === 1 ? t('The first one') : t('{n} solves', { n: count }),
      about: count === 1 ? t('Your very first time in the app.') : t('{n} solves altogether.', { n: count }),
      at: at(solve),
      detail: solve ? formatTime(effective(solve)) : t('{had} of {n}', { had: seen.solves.length, n: count })
    });
  }

  for (const wall of WALLS) {
    const solve = seen.firstUnder.get(wall);
    if (!solve && seen.fastest > (wall + 20) * 1000) continue; // far out of reach, not worth showing
    out.push({
      id: `sub-${wall}`,
      name: `Sub-${wall}`,
      about: t('Your first solve under {n} seconds.', { n: wall }),
      at: at(solve),
      detail: solve ? formatTime(effective(solve)) : t('not yet')
    });
  }

  const run = longestRun(seen.days);
  for (const days of [3, 7, 30, 100]) {
    out.push({
      id: `days-${days}`,
      name: t('{n} days in a row', { n: days }),
      about: t('That many days running with at least one solve.'),
      at: run.days >= days ? run.at : null,
      detail: t('{n} managed', { n: run.days })
    });
  }

  const allSix = [...seen.puzzlesByDay.entries()].find(([, puzzles]) => puzzles.size >= 6);
  out.push({
    id: 'six-puzzles',
    name: t('All six in one day'),
    about: t('Every puzzle at least once, inside the same day.'),
    at: allSix ? new Date(allSix[0]).getTime() : null,
    detail: allSix ? t('{n} puzzles', { n: allSix[1].size }) : t('most so far: {n}', { n: Math.max(0, ...[...seen.puzzlesByDay.values()].map((set) => set.size)) })
  });

  out.push({
    id: 'night',
    name: t('Night owl'),
    about: t('A solve between midnight and five in the morning.'),
    at: seen.nightOwl,
    detail: seen.nightOwl ? new Date(seen.nightOwl).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : t('not yet')
  });

  out.push({
    id: 'early',
    name: t('Early bird'),
    about: t('A solve before seven in the morning.'),
    at: seen.earlyBird,
    detail: seen.earlyBird ? new Date(seen.earlyBird).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : t('not yet')
  });

  const dailyDays = Object.keys(seen.play.daily || {}).length;
  for (const count of [1, 7, 30]) {
    out.push({
      id: `daily-${count}`,
      name: count === 1 ? t('Daily scramble done') : t('{n} daily scrambles', { n: count }),
      about: t('The scramble of the day, the same one for everybody.'),
      at: dailyDays >= count ? Date.now() : null,
      detail: t('{n} done', { n: dailyDays })
    });
  }

  const marathon = (seen.play.runs || []).filter((entry) => entry.kind === 'marathon');
  const bestStreak = marathon.reduce((most, entry) => Math.max(most, entry.score), 0);
  for (const streak of [5, 10, 25]) {
    out.push({
      id: `marathon-${streak}`,
      name: t('Marathon of {n}', { n: streak }),
      about: t('{n} in a row under your threshold.', { n: streak }),
      at: bestStreak >= streak ? (marathon.find((entry) => entry.score >= streak)?.at ?? null) : null,
      detail: t('{n} managed', { n: bestStreak })
    });
  }

  return out;
}

/** Which of them you have, and how many there are in all. */
export function tally(list) {
  return { got: list.filter((badge) => badge.at !== null).length, all: list.length };
}

/**
 * Anything won since the last time this was asked. What the app shows a party
 * for -- and it compares against what it saw before rather than against a
 * timestamp, so a badge cannot be missed by the app having been closed.
 */
export function newlyWon(list, before = []) {
  const had = new Set(before);
  return list.filter((badge) => badge.at !== null && !had.has(badge.id));
}

export const wonIds = (list) => list.filter((badge) => badge.at !== null).map((badge) => badge.id);
