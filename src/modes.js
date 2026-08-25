// Ways of solving other than "keep going".
//
// A session with no end is the right default and a poor game. These give a run
// a shape: something to keep alive, a clock to beat, or a stretch you are not
// allowed to look at. None of them change what a solve is or where it is
// stored -- they only decide what the strip above the ring says, and when
// something is over.

import { averageOf, best, effective, formatTime } from './stats.js';

export const MODES = {
  normal: {
    name: 'Gewoon',
    about: 'Solve tot je stopt. Alles zichtbaar.'
  },
  marathon: {
    name: 'Marathon',
    about: 'Hoeveel achter elkaar onder je drempel? Eén erover en je begint opnieuw.',
    number: { label: 'Drempel', unit: 'seconden', fallback: 15 }
  },
  sprint: {
    name: 'Vijf minuten',
    about: 'Zoveel mogelijk solves binnen de tijd. De klok loopt door tussen je solves.',
    number: { label: 'Minuten', unit: 'minuten', fallback: 5 }
  },
  blind: {
    name: 'Verrassing',
    about: 'Je ziet niets tot je er zoveel gedaan hebt. Geen enkele solve verpest door de vorige.',
    number: { label: 'Aantal solves', unit: 'solves', fallback: 12 }
  },
  round: {
    name: 'Wedstrijdronde',
    about: 'Vijf solves, beste en slechtste eraf. Aan het eind een resultaat.',
    number: { label: 'Aantal solves', unit: 'solves', fallback: 5 }
  }
};

/** A run that has just begun. Modes hold no solves of their own -- they point
    at where in the session they started, so nothing can drift apart. */
export function begin(kind, number, at, from) {
  const shape = MODES[kind];
  if (!shape || kind === 'normal') return null;
  return {
    kind,
    number: Number.isFinite(number) ? number : shape.number.fallback,
    startedAt: at,
    from,          // index into the session's solves where this run begins
    streak: 0,     // marathon only: how many are alive right now
    bestStreak: 0,
    over: false
  };
}

/** The solves this run has collected so far. */
export const runSolves = (run, solves) => (run ? solves.slice(run.from) : []);

/**
 * Fold one finished solve into the run.
 * @returns {{ended: boolean, broke: boolean}} whether the run is over, and
 * whether this solve was the one that broke a marathon.
 */
export function absorb(run, solve, solves) {
  if (!run || run.over) return { ended: false, broke: false };

  if (run.kind === 'marathon') {
    const value = effective(solve);
    const under = Number.isFinite(value) && value <= run.number * 1000;
    if (under) {
      run.streak++;
      run.bestStreak = Math.max(run.bestStreak, run.streak);
      return { ended: false, broke: false };
    }
    const had = run.streak;
    run.streak = 0;
    return { ended: false, broke: had > 0 };
  }

  const done = runSolves(run, solves).length;
  if (run.kind === 'round' && done >= run.number) {
    run.over = true;
    return { ended: true, broke: false };
  }
  if (run.kind === 'blind' && done >= run.number) {
    run.over = true;
    return { ended: true, broke: false };
  }
  return { ended: false, broke: false };
}

/** Whether the clock has run out, for the modes that have one. */
export function expired(run, now) {
  if (!run || run.over || run.kind !== 'sprint') return false;
  return now - run.startedAt >= run.number * 60000;
}

/** Whether times and averages should be kept back for now. */
export const hushed = (run) => Boolean(run && run.kind === 'blind' && !run.over);

/** One line for the strip above the ring. */
export function describe(run, solves, now) {
  if (!run) return '';
  const done = runSolves(run, solves).length;

  if (run.kind === 'marathon') {
    const bar = run.streak ? ' ' + '•'.repeat(Math.min(run.streak, 12)) : '';
    return `Marathon onder ${run.number}s — ${run.streak} op rij${bar}`
      + (run.bestStreak > run.streak ? ` · beste ${run.bestStreak}` : '');
  }

  if (run.kind === 'sprint') {
    const left = Math.max(0, run.number * 60000 - (now - run.startedAt));
    const seconds = Math.ceil(left / 1000);
    const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    return run.over
      ? `Vijf minuten voorbij — ${done} ${done === 1 ? 'solve' : 'solves'}`
      : `Nog ${clock} — ${done} ${done === 1 ? 'solve' : 'solves'}`;
  }

  if (run.kind === 'blind') {
    const left = Math.max(0, run.number - done);
    return run.over
      ? `Verrassing voorbij — ${done} solves`
      : `Verrassing — nog ${left} te gaan, je ziet ze straks allemaal`;
  }

  if (run.kind === 'round') {
    return run.over
      ? 'Ronde afgelopen'
      : `Ronde — solve ${Math.min(done + 1, run.number)} van ${run.number}`;
  }
  return '';
}

/**
 * What a finished run comes to.
 * @returns {{lines: [string, string][], headline: string}}
 */
export function result(run, solves) {
  const mine = runSolves(run, solves);
  const shape = MODES[run.kind];
  const lines = [];

  if (run.kind === 'round') {
    const average = averageOf(mine, mine.length);
    lines.push(['Gemiddelde', formatTime(average)]);
    lines.push(['Beste', formatTime(best(mine))]);
    lines.push(['Solves', String(mine.length)]);
    return { headline: formatTime(average), lines };
  }

  if (run.kind === 'sprint') {
    lines.push(['Solves', String(mine.length)]);
    lines.push(['Beste', formatTime(best(mine))]);
    if (mine.length >= 5) lines.push(['Beste ao5', formatTime(averageOf(mine, 5))]);
    return { headline: `${mine.length} solves`, lines };
  }

  if (run.kind === 'blind') {
    lines.push(['Solves', String(mine.length)]);
    lines.push(['Beste', formatTime(best(mine))]);
    if (mine.length >= 5) lines.push(['ao5', formatTime(averageOf(mine, 5))]);
    if (mine.length >= 12) lines.push(['ao12', formatTime(averageOf(mine, 12))]);
    return { headline: `${mine.length} solves`, lines };
  }

  lines.push(['Langste reeks', String(run.bestStreak)]);
  lines.push(['Solves', String(mine.length)]);
  return { headline: `${run.bestStreak} op rij`, lines: lines.concat([['Modus', shape.name]]) };
}
