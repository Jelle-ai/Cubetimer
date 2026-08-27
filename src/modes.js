// Ways of solving other than "keep going".
//
// A session with no end is the right default and a poor game. These give a run
// a shape: something to keep alive, a clock to beat, or a stretch you are not
// allowed to look at.
//
// A run keeps its own solves. They do not go into a session and never did
// belong in one -- what happens in a game is only worth seeing inside that
// game, and putting it in your list moved your averages around for reasons
// that had nothing to do with how you are solving.

import { averageOf, best, effective, formatTime } from './stats.js';
import { t } from './lang.js';

/**
 * The modes, with their names read out at the moment they are shown rather than
 * at the moment this file is loaded. That matters: the language is settled
 * after the modules are imported, so a name fixed at import time would be stuck
 * in whatever language the app started in and never change again.
 */
export const MODES = {
  normal: {
    get name() { return t('Plain'); },
    get about() { return t('Solve until you stop. Everything in sight.'); }
  },
  marathon: {
    get name() { return t('Marathon'); },
    get about() { return t('How many in a row under your threshold? One over and you start again.'); },
    number: { get label() { return t('Threshold'); }, get unit() { return t('seconds'); }, fallback: 15 }
  },
  sprint: {
    get name() { return t('Five minutes'); },
    get about() { return t('As many solves as you can inside the time. The clock runs on between them.'); },
    number: { get label() { return t('Minutes'); }, get unit() { return t('minutes'); }, fallback: 5 }
  },
  blind: {
    get name() { return t('Surprise'); },
    get about() { return t('You see nothing until you have done that many. No solve spoiled by the one before it.'); },
    number: { get label() { return t('How many solves'); }, get unit() { return t('solves'); }, fallback: 12 }
  },
  round: {
    get name() { return t('Competition round'); },
    get about() { return t('Five solves, best and worst dropped. A result at the end.'); },
    number: { get label() { return t('How many solves'); }, get unit() { return t('solves'); }, fallback: 5 }
  },
  cross: {
    get name() { return t('The cross only'); },
    get about() { return t('Lay the cross and stop. Afterwards you see in how many moves it could have gone — the one exercise the app can mark for you.'); },
    number: { get label() { return t('How many solves'); }, get unit() { return t('solves'); }, fallback: 12 }
  }
};

/**
 * A run that has just begun.
 *
 * It keeps its own solves. They used to be appended to whatever session was
 * open, which moved your averages about for reasons that had nothing to do with
 * how you are solving -- a five-minute sprint is not twelve solves you did on a
 * Tuesday. What happens in a game stays in the game.
 */
export function begin(kind, number) {
  const shape = MODES[kind];
  if (!shape || kind === 'normal') return null;
  return {
    kind,
    number: Number.isFinite(number) ? number : shape.number.fallback,
    startedAt: Date.now(),
    solves: [],
    streak: 0,     // marathon only: how many are alive right now
    bestStreak: 0,
    moves: [],     // cross only: how short each cross could have been
    over: false
  };
}

/** The solves this run has collected so far. */
export const runSolves = (run) => (run ? run.solves : []);

/** Whether this game keeps its solves rather than the session. */
export const ownsSolves = (run) => Boolean(run && !run.over);

/**
 * Fold one finished solve into the run.
 * @returns {{ended: boolean, broke: boolean}} whether the run is over, and
 * whether this solve was the one that broke a marathon.
 */
export function absorb(run, solve) {
  if (!run || run.over) return { ended: false, broke: false };
  run.solves.push(solve);

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

  const done = run.solves.length;
  if (run.kind === 'round' && done >= run.number) {
    run.over = true;
    return { ended: true, broke: false };
  }
  if (run.kind === 'blind' && done >= run.number) {
    run.over = true;
    return { ended: true, broke: false };
  }
  if (run.kind === 'cross' && done >= run.number) {
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
export function describe(run, now) {
  if (!run) return '';
  const done = run.solves.length;

  if (run.kind === 'marathon') {
    const bar = run.streak ? ' ' + '•'.repeat(Math.min(run.streak, 12)) : '';
    return t('Marathon under {n}s — {streak} in a row{bar}', { n: run.number, streak: run.streak, bar })
      + (run.bestStreak > run.streak ? t(' · best {n}', { n: run.bestStreak }) : '');
  }

  if (run.kind === 'sprint') {
    const left = Math.max(0, run.number * 60000 - (now - run.startedAt));
    const seconds = Math.ceil(left / 1000);
    const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    return run.over
      ? t('Time is up — {n} {word}', { n: done, word: t(done === 1 ? 'solve' : 'solves') })
      : t('{clock} left — {n} {word}', { clock, n: done, word: t(done === 1 ? 'solve' : 'solves') });
  }

  if (run.kind === 'blind') {
    const left = Math.max(0, run.number - done);
    return run.over
      ? t('Surprise over — {n} solves', { n: done })
      : t('Surprise — {n} to go, you see them all afterwards', { n: left });
  }

  if (run.kind === 'cross') {
    const left = Math.max(0, run.number - done);
    const known = run.moves.filter(Number.isFinite);
    const spent = known.length
      ? t(' · the cross could have gone in {n} moves', { n: (known.reduce((sum, n) => sum + n, 0) / known.length).toFixed(1) })
      : '';
    return run.over
      ? t('Cross round over — {n} solves', { n: done }) + spent
      : t('The cross only — {n} to go', { n: left }) + spent;
  }

  if (run.kind === 'round') {
    return run.over
      ? t('Round finished')
      : t('Round — solve {at} of {all}', { at: Math.min(done + 1, run.number), all: run.number });
  }
  return '';
}

/**
 * What a finished run comes to.
 * @returns {{lines: [string, string][], headline: string}}
 */
export function result(run) {
  if (run?.kind === 'cross') {
    const times = runSolves(run).map(effective).filter(Number.isFinite);
    const known = (run.moves || []).filter(Number.isFinite);
    const middle = times.slice().sort((a, b) => a - b)[times.length >> 1];
    return {
      title: t('The cross only'),
      headline: Number.isFinite(middle) ? formatTime(middle) : '—',
      lines: [
        [t('Solves'), String(times.length)],
        [t('Fastest'), times.length ? formatTime(Math.min(...times)) : '—'],
        [t('Cross could have gone in'), known.length ? t('{n} moves', { n: (known.reduce((sum, n) => sum + n, 0) / known.length).toFixed(1) }) : '—'],
        [t('Longest cross'), known.length ? t('{n} moves', { n: Math.max(...known) }) : '—']
      ],
      score: Number.isFinite(middle) ? middle : 0
    };
  }

  const mine = run.solves;
  const shape = MODES[run.kind];
  const lines = [];

  if (run.kind === 'round') {
    const average = averageOf(mine, mine.length);
    lines.push([t('Average'), formatTime(average)]);
    lines.push([t('Best'), formatTime(best(mine))]);
    lines.push([t('Solves'), String(mine.length)]);
    return { headline: formatTime(average), lines };
  }

  if (run.kind === 'sprint') {
    lines.push([t('Solves'), String(mine.length)]);
    lines.push([t('Best'), formatTime(best(mine))]);
    if (mine.length >= 5) lines.push([t('Best ao5'), formatTime(averageOf(mine, 5))]);
    return { headline: t('{n} solves', { n: mine.length }), lines };
  }

  if (run.kind === 'blind') {
    lines.push([t('Solves'), String(mine.length)]);
    lines.push([t('Best'), formatTime(best(mine))]);
    if (mine.length >= 5) lines.push(['ao5', formatTime(averageOf(mine, 5))]);
    if (mine.length >= 12) lines.push(['ao12', formatTime(averageOf(mine, 12))]);
    return { headline: t('{n} solves', { n: mine.length }), lines };
  }

  lines.push([t('Longest streak'), String(run.bestStreak)]);
  lines.push([t('Solves'), String(mine.length)]);
  return { headline: t('{n} in a row', { n: run.bestStreak }), lines: lines.concat([[t('Mode'), shape.name]]) };
}
