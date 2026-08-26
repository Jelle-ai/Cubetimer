// When a case is about to slip away from you.
//
// A drill that serves cases at random spends most of its time on the ones you
// already know, because most of them are. What you actually want is the case
// you learned three weeks ago and have not touched since -- the one that is
// still in there, but only just.
//
// There is no separate review schedule to keep: the times you already recorded
// while drilling are the whole input. Every attempt at a case is read as a
// review of it, a quick one counts as a pass and a slow one as a fail, and the
// gap until the next review grows after a pass and collapses after a fail.
// That is the ordinary spacing rule, fed by the practice you were doing anyway.

const DAY = 24 * 60 * 60 * 1000;

/** The first gap after one clean go, and the ceiling a gap may grow to. */
const FIRST_GAP = 1 * DAY;
const SECOND_GAP = 3 * DAY;
const MAX_GAP = 120 * DAY;

/** After a miss you see it again within the day rather than in a week. */
const MISS_GAP = 0.4 * DAY;

/** How much longer than your own par a go may take and still count as knowing it. */
const SLACK = 1.35;

/**
 * What counts as a pass, worked out from your own times rather than a number
 * somebody else picked. The median of everything you have done in this group is
 * your par; a go within a third of that is a pass.
 *
 * A group with almost nothing in it has no meaningful par, so everything counts
 * as a pass and the spacing simply grows -- which is the right way to be wrong
 * when you have no evidence.
 */
export function parOf(group) {
  const all = [];
  for (const times of Object.values(group || {})) {
    if (!Array.isArray(times)) continue;
    for (const time of times || []) {
      if (time && Number.isFinite(time.ms) && time.penalty !== 'DNF') all.push(time.ms);
    }
  }
  if (all.length < 5) return Infinity;
  all.sort((a, b) => a - b);
  return all[Math.floor(all.length / 2)] * SLACK;
}

/**
 * Replay one case's history and say when it is next due.
 *
 * @param {{ms:number, penalty?:string, at?:number}[]} times oldest first
 * @param {number} par what counts as knowing it
 */
export function scheduleOf(times, par) {
  let gap = 0;
  let streak = 0;
  let last = 0;

  for (const time of times) {
    if (!time || !Number.isFinite(time.ms)) continue;
    last = time.at || last;
    const passed = time.penalty !== 'DNF' && time.ms <= par;
    if (!passed) {
      streak = 0;
      gap = MISS_GAP;
      continue;
    }
    streak++;
    // 1 day, 3 days, and then a little over double each time -- and the longer
    // your run the bigger the step, because a case you have passed six times
    // running is not the same as one you have passed twice.
    gap = streak === 1 ? FIRST_GAP
      : streak === 2 ? SECOND_GAP
        : Math.min(gap * (2 + Math.min(streak, 8) * 0.1), MAX_GAP);
  }
  return { gap, streak, last, due: last ? last + gap : 0 };
}

/**
 * Every case you have drilled in a group, the one closest to slipping first.
 *
 * "ratio" is how far past due it is: 1 means due right now, 3 means you have
 * left it three times as long as it could take. Below 1 it is still fresh.
 */
export function recallStanding(cases, group, now = Date.now()) {
  const mine = cases?.[group] || {};
  const par = parOf(mine);
  return Object.entries(mine)
    .map(([id, times]) => {
      const sorted = (times || []).slice().sort((a, b) => (a.at || 0) - (b.at || 0));
      if (!sorted.length) return null;
      const plan = scheduleOf(sorted, par);
      if (!plan.last || !plan.gap) return null;
      return { id, ...plan, ratio: (now - plan.last) / plan.gap, count: sorted.length };
    })
    .filter(Boolean)
    .sort((a, b) => b.ratio - a.ratio);
}

/** The ones actually past due, worst first. */
export const dueNow = (cases, group, now = Date.now()) =>
  recallStanding(cases, group, now).filter((row) => row.ratio >= 1);

/** How long until something is due again, in plain words. */
export function whenDue(row, now = Date.now()) {
  if (row.ratio >= 1) {
    const over = Math.floor((now - row.due) / DAY);
    if (over >= 1) return `${over} ${over === 1 ? 'dag' : 'dagen'} over tijd`;
    return 'nu aan de beurt';
  }
  const left = Math.max(1, Math.round((row.due - now) / DAY));
  return `over ${left} ${left === 1 ? 'dag' : 'dagen'}`;
}
