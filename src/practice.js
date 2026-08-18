// How much cubing actually happened, per day.
//
// Time here is time spent solving -- the recorded times added up -- and never
// how long the app sat open. A session left running in a tab is not practice.

/** The local midnight a moment belongs to, as a number that sorts and compares. */
export function dayOf(at) {
  if (!Number.isFinite(at)) return null;
  const date = new Date(at);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export const today = () => dayOf(Date.now());

/** One day earlier. Built from the parts so that a clock change cannot skip a day. */
export function dayBefore(day) {
  const date = new Date(day);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1).getTime();
}

/**
 * Every day that has any solving in it, across all sessions -- practice is
 * practice, whichever puzzle it was on.
 *
 * A solve with no timestamp (one pasted in from elsewhere) belongs to no day
 * and is left out rather than credited to today.
 *
 * @returns {Map<number, {ms: number, count: number}>}
 */
export function practiceByDay(sessions) {
  const days = new Map();
  for (const session of sessions) {
    for (const solve of session.solves) {
      const day = dayOf(solve.at);
      if (day === null) continue;
      const entry = days.get(day) || { ms: 0, count: 0 };
      // The raw time, not the penalised one: a +2 does not make the solve
      // longer, and a DNF still took as long as it took.
      entry.ms += Number.isFinite(solve.ms) ? solve.ms : 0;
      entry.count += 1;
      days.set(day, entry);
    }
  }
  return days;
}

const EMPTY = { ms: 0, count: 0 };

/** Whether a day's practice clears the bar. @param {{kind: string, ms: number, solves: number}} goal */
export function meetsGoal(entry, goal) {
  const day = entry || EMPTY;
  return goal.kind === 'solves' ? day.count >= goal.solves : day.ms >= goal.ms;
}

/**
 * The run of days up to now, and the best run there has ever been.
 *
 * Today counts only once it is earned, but a day that is still going does not
 * break the run: with nothing solved yet today the streak is whatever yesterday
 * ended on, so the flame stays lit until the day is actually missed.
 */
export function streaks(days, goal) {
  const start = today();

  let current = 0;
  let cursor = meetsGoal(days.get(start), goal) ? start : dayBefore(start);
  while (meetsGoal(days.get(cursor), goal)) {
    current++;
    cursor = dayBefore(cursor);
  }

  let longest = 0;
  let run = 0;
  for (const day of [...days.keys()].sort((a, b) => a - b)) {
    if (!meetsGoal(days.get(day), goal)) { run = 0; continue; }
    // A gap of more than a day ends the run, however many days that gap was.
    run = days.has(dayBefore(day)) && meetsGoal(days.get(dayBefore(day)), goal) ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  return { current, longest: Math.max(longest, current) };
}

/** How far into today's goal, from 0 to 1. */
export function progress(entry, goal) {
  const day = entry || EMPTY;
  const target = goal.kind === 'solves' ? goal.solves : goal.ms;
  if (!target) return 0;
  return Math.min(1, (goal.kind === 'solves' ? day.count : day.ms) / target);
}

/** Time spent, said the way a person would say it. */
export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return '0m';
  const seconds = Math.round(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours) return minutes ? `${hours}u ${minutes}m` : `${hours}u`;
  if (minutes) return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
  return `${seconds}s`;
}

const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const WEEKDAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

export function dayName(day) {
  const now = today();
  if (day === now) return 'vandaag';
  if (day === dayBefore(now)) return 'gisteren';

  const date = new Date(day);
  const stamp = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  // Within the past week the weekday says more than the date does.
  if (now - day < 7 * 86400000) return `${WEEKDAYS[date.getDay()]} ${stamp}`;
  return date.getFullYear() === new Date(now).getFullYear() ? stamp : `${stamp} ${date.getFullYear()}`;
}
