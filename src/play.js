// Everything the games remember, kept apart from your sessions.
//
// A marathon streak and a five-minute sprint are not solves you did on a
// Tuesday afternoon; they belong to the game and nowhere else. Putting them in
// a session was the wrong call -- it moved your averages around for reasons
// that had nothing to do with how you are solving, and left the game with
// nothing of its own to show. Everything here lives beside the sessions, is
// only ever shown inside the game it belongs to, and travels in the same
// backup file so it survives a new phone.

import { averageOf, best, effective, formatTime } from './stats.js';

/** Runs and rounds worth keeping. Beyond this the oldest fall off the end. */
const KEEP_RUNS = 60;
const KEEP_TIMES = 40;

export function emptyPlay() {
  return { runs: [], daily: {}, cases: {}, duels: [] };
}

/** Whatever came out of storage, made safe to read. */
export function cleanPlay(play) {
  const safe = emptyPlay();
  if (!play || typeof play !== 'object') return safe;

  if (Array.isArray(play.runs)) {
    safe.runs = play.runs
      .filter((run) => run && typeof run.kind === 'string' && Number.isFinite(run.at))
      .slice(-KEEP_RUNS)
      .map((run) => ({
        kind: run.kind,
        at: run.at,
        number: Number(run.number) || 0,
        score: Number(run.score) || 0,
        times: Array.isArray(run.times) ? run.times.slice(0, KEEP_TIMES).filter(isTime) : []
      }));
  }

  if (play.daily && typeof play.daily === 'object') {
    for (const [day, entry] of Object.entries(play.daily)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && isTime(entry)) safe.daily[day] = entry;
    }
  }

  if (play.cases && typeof play.cases === 'object') {
    for (const [group, cases] of Object.entries(play.cases)) {
      if (!cases || typeof cases !== 'object') continue;
      safe.cases[group] = {};
      for (const [id, times] of Object.entries(cases)) {
        if (Array.isArray(times)) safe.cases[group][id] = times.filter(isTime).slice(-KEEP_TIMES);
      }
    }
  }

  if (Array.isArray(play.duels)) {
    safe.duels = play.duels
      .filter((duel) => duel && Number.isFinite(duel.at) && Array.isArray(duel.names))
      .slice(-KEEP_RUNS)
      .map((duel) => ({
        at: duel.at,
        names: duel.names.slice(0, 2).map((name) => String(name).slice(0, 20)),
        score: (Array.isArray(duel.score) ? duel.score : [0, 0]).map((n) => Number(n) || 0),
        best: (Array.isArray(duel.best) ? duel.best : [null, null]).map((n) => (isTime({ ms: n }) ? n : null))
      }));
  }
  return safe;
}

const isTime = (entry) => entry && Number.isFinite(entry.ms) && entry.ms >= 0;

/** The day a date belongs to, written the way the daily challenge keys on it. */
export function dayStamp(when = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}`;
}

/* ---------- the scramble of the day ---------- */

/**
 * One attempt, kept for good. The day is the key, so a second go simply cannot
 * be recorded -- which is the whole shape of the thing: one scramble, one try,
 * the same for everybody who opens the app today.
 */
export function recordDaily(play, day, solve) {
  if (play.daily[day]) return false;
  play.daily[day] = { ms: solve.ms, penalty: solve.penalty || 'none', at: solve.at || Date.now() };
  return true;
}

/** How the days have gone, newest first. */
export function dailyHistory(play, howMany = 14) {
  return Object.entries(play.daily)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, howMany)
    .map(([day, entry]) => ({ day, ...entry }));
}

/** Days in a row, counting back from today or yesterday. */
export function dailyStreak(play, today = dayStamp()) {
  const day = new Date(`${today}T12:00:00`);
  let streak = 0;

  // Yesterday still counts as alive: the day is not over until it is.
  if (!play.daily[today]) day.setDate(day.getDate() - 1);
  while (play.daily[dayStamp(day)]) {
    streak++;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

/* ---------- finished runs ---------- */

/** What a finished run is worth, in the units that run is measured in. */
export function scoreOf(kind, times, best) {
  if (kind === 'marathon') return best;
  if (kind === 'sprint' || kind === 'blind') return times.length;
  if (kind === 'round') {
    const average = averageOf(times, times.length);
    return Number.isFinite(average) ? Math.round(average) : 0;
  }
  return 0;
}

/** Lower is better for a round; higher is better for the rest. */
export const lowerWins = (kind) => kind === 'round';

export function recordRun(play, kind, number, times, score) {
  play.runs.push({
    kind,
    at: Date.now(),
    number,
    score,
    times: times.slice(-KEEP_TIMES).map((solve) => ({ ms: solve.ms, penalty: solve.penalty || 'none' }))
  });
  if (play.runs.length > KEEP_RUNS) play.runs.splice(0, play.runs.length - KEEP_RUNS);
}

/** Every run of one game, best first. */
export function runsOf(play, kind) {
  const mine = play.runs.filter((run) => run.kind === kind);
  const better = lowerWins(kind)
    ? (a, b) => (a.score || Infinity) - (b.score || Infinity)
    : (a, b) => b.score - a.score;
  return mine.slice().sort(better);
}

/** The best a game has ever gone, or null when it never has. */
export function bestOf(play, kind) {
  return runsOf(play, kind)[0] || null;
}

/** How a run's score reads to a person. */
export function spellScore(kind, score) {
  if (kind === 'marathon') return `${score} op rij`;
  if (kind === 'sprint' || kind === 'blind') return `${score} ${score === 1 ? 'solve' : 'solves'}`;
  if (kind === 'round') return formatTime(score);
  return String(score);
}

/* ---------- drilling ---------- */

export function recordCase(play, group, id, solve) {
  play.cases[group] ||= {};
  const times = (play.cases[group][id] ||= []);
  times.push({ ms: solve.ms, penalty: solve.penalty || 'none', at: solve.at || Date.now() });
  if (times.length > KEEP_TIMES) times.splice(0, times.length - KEEP_TIMES);
}

/** How you are doing per case, worst first, which is the point of it. */
export function caseStanding(play, group) {
  const cases = play.cases[group] || {};
  return Object.entries(cases)
    .map(([id, times]) => {
      const values = times.map(effective).filter(Number.isFinite);
      if (!values.length) return null;
      return {
        id,
        count: values.length,
        best: Math.min(...values),
        mean: values.reduce((sum, t) => sum + t, 0) / values.length
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.mean - a.mean);
}

/* ---------- duels ---------- */

export function recordDuel(play, names, score, bests) {
  play.duels.push({ at: Date.now(), names: names.slice(0, 2), score: score.slice(0, 2), best: bests.slice(0, 2) });
  if (play.duels.length > KEEP_RUNS) play.duels.splice(0, play.duels.length - KEEP_RUNS);
}

/** The running tally between two names, whichever way round they were entered. */
export function duelTally(play, names) {
  const [one, two] = names.map((name) => name.trim().toLowerCase());
  let wins = [0, 0];

  for (const duel of play.duels) {
    const had = duel.names.map((name) => name.trim().toLowerCase());
    const straight = had[0] === one && had[1] === two;
    const flipped = had[0] === two && had[1] === one;
    if (!straight && !flipped) continue;

    const [a, b] = straight ? duel.score : [duel.score[1], duel.score[0]];
    if (a > b) wins[0]++;
    else if (b > a) wins[1]++;
  }
  return wins;
}

/**
 * Two devices' worth of play, folded together.
 *
 * Same rule as the times: nothing is overwritten. A day already attempted keeps
 * the attempt that is here -- the point of one try a day is that it cannot be
 * had twice, and a file arriving later must not become a second go.
 */
export function mergePlay(mine, theirs) {
  const merged = cleanPlay(mine);
  const arriving = cleanPlay(theirs);

  for (const [day, entry] of Object.entries(arriving.daily)) {
    if (!merged.daily[day]) merged.daily[day] = entry;
  }

  const seen = new Set(merged.runs.map((run) => `${run.kind}:${run.at}`));
  for (const run of arriving.runs) {
    if (seen.has(`${run.kind}:${run.at}`)) continue;
    seen.add(`${run.kind}:${run.at}`);
    merged.runs.push(run);
  }
  merged.runs.sort((a, b) => a.at - b.at);
  if (merged.runs.length > KEEP_RUNS) merged.runs.splice(0, merged.runs.length - KEEP_RUNS);

  for (const [group, cases] of Object.entries(arriving.cases)) {
    merged.cases[group] ||= {};
    for (const [id, times] of Object.entries(cases)) {
      const have = new Set((merged.cases[group][id] || []).map((entry) => entry.at));
      const kept = (merged.cases[group][id] || []).concat(times.filter((entry) => !have.has(entry.at)));
      kept.sort((a, b) => (a.at || 0) - (b.at || 0));
      merged.cases[group][id] = kept.slice(-KEEP_TIMES);
    }
  }

  const duelled = new Set(merged.duels.map((duel) => duel.at));
  for (const duel of arriving.duels) {
    if (!duelled.has(duel.at)) merged.duels.push(duel);
  }
  merged.duels.sort((a, b) => a.at - b.at);
  if (merged.duels.length > KEEP_RUNS) merged.duels.splice(0, merged.duels.length - KEEP_RUNS);

  return merged;
}

/** The best single time in a list of game times. */
export const bestTime = (times) => best(times);
