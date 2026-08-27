// Nine small things to go and do this week.
//
// Everything else in the app tells you what already happened. This is the one
// thing that says what to go and do, and it only works if the squares are just
// out of reach: a card of things you would have done anyway is wallpaper, and a
// card of things you cannot do is worse. So every square is measured off your
// own level at the start of the week.
//
// Nothing is recorded when a square is filled. Whether it is done is a question
// asked of the week's solves each time the card is drawn, the same way the
// badges work -- so a card cannot go wrong by having been written down wrong.

import { counting, effective, formatTime } from './stats.js';
import { locale, t } from './lang.js';

/** Monday, as the day the week is keyed on. */
export function weekOf(when = Date.now()) {
  const day = new Date(when);
  day.setHours(0, 0, 0, 0);
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return day.getTime();
}

export function weekName(start) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const say = (date) => new Date(date).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
  return `${say(start)} – ${say(end)}`;
}

/** Everything this week, and everything before it, kept apart. */
function split(sessions, start) {
  const week = [];
  const before = [];
  for (const session of sessions) {
    for (const solve of counting(session.solves)) {
      if (!Number.isFinite(solve.at)) continue;
      (solve.at >= start ? week : before).push(solve);
    }
  }
  week.sort((a, b) => a.at - b.at);
  before.sort((a, b) => a.at - b.at);
  return { week, before };
}

const median = (list) => {
  if (!list.length) return NaN;
  const sorted = list.slice().sort((a, b) => a - b);
  return sorted[sorted.length >> 1];
};

const daysIn = (solves) => new Set(solves.map((solve) => new Date(solve.at).toDateString())).size;

/** The best run of five in a list, or Infinity. */
function bestFive(solves) {
  let best = Infinity;
  for (let start = 0; start + 5 <= solves.length; start++) {
    const times = solves.slice(start, start + 5).map(effective);
    if (times.filter((one) => !Number.isFinite(one)).length > 1) continue;
    const middle = times.slice().sort((a, b) => a - b).slice(1, -1);
    const value = middle.reduce((sum, one) => sum + one, 0) / middle.length;
    if (Number.isFinite(value)) best = Math.min(best, value);
  }
  return best;
}

/**
 * The squares. Each one knows how to size itself to you and how to tell whether
 * it is done, and says no when there is not enough to size it against.
 */
const SQUARES = [
  {
    id: 'quick',
    make: ({ known }) => {
      if (!Number.isFinite(known.best)) return null;
      // A hair under your record: near enough to chase, far enough to mean it.
      const bar = Math.round(known.best * 0.99);
      return { text: t('A solve under {time}', { time: formatTime(bar) }), bar };
    },
    done: ({ week }, bar) => week.some((solve) => effective(solve) < bar)
  },
  {
    id: 'five',
    make: ({ known }) => {
      if (!Number.isFinite(known.five)) return null;
      const bar = Math.round(known.five * 0.98);
      return { text: t('An ao5 under {time}', { time: formatTime(bar) }), bar };
    },
    done: ({ week }, bar) => bestFive(week) < bar
  },
  {
    id: 'steady',
    make: ({ known }) => {
      if (!Number.isFinite(known.middle)) return null;
      const bar = Math.round(known.middle);
      return { text: t('Five in a row under {time}', { time: formatTime(bar) }), bar };
    },
    done: ({ week }, bar) => {
      let run = 0;
      for (const solve of week) {
        run = effective(solve) < bar ? run + 1 : 0;
        if (run >= 5) return true;
      }
      return false;
    }
  },
  {
    id: 'days',
    make: ({ known }) => ({ text: `${Math.min(5, Math.max(3, known.usualDays + 1))} dagen deze week`, bar: Math.min(5, Math.max(3, known.usualDays + 1)) }),
    done: ({ week }, bar) => daysIn(week) >= bar
  },
  {
    id: 'many',
    make: ({ known }) => {
      const bar = Math.max(30, Math.round((known.usualWeek || 30) * 1.1 / 10) * 10);
      return { text: `${bar} solves deze week`, bar };
    },
    done: ({ week }, bar) => week.length >= bar
  },
  {
    id: 'sitting',
    make: () => ({ text: t('A session of twenty in a row'), bar: 20 }),
    done: ({ week }, bar) => {
      let run = 1;
      for (let at = 1; at < week.length; at++) {
        run = week[at].at - week[at - 1].at < 30 * 60 * 1000 ? run + 1 : 1;
        if (run >= bar) return true;
      }
      return false;
    }
  },
  {
    id: 'cases',
    make: () => ({ text: 'Tien gevallen oefenen', bar: 10 }),
    done: ({ play: game, start }) => {
      let seen = 0;
      for (const cases of Object.values(game.cases || {})) {
        for (const times of Object.values(cases)) {
          if (times.some((one) => one.at >= start)) seen++;
        }
      }
      return seen >= 10;
    }
  },
  {
    id: 'fresh',
    make: () => ({ text: t('A case you had never drilled'), bar: 1 }),
    done: ({ play: game, start }) => Object.values(game.cases || {}).some((cases) =>
      Object.values(cases).some((times) => times.length && times.every((one) => one.at >= start)))
  },
  {
    id: 'spot',
    make: () => ({ text: 'Twintig gevallen herkennen', bar: 20 }),
    done: ({ play: game, start }) => {
      let seen = 0;
      for (const cases of Object.values(game.spot || {})) {
        for (const tries of Object.values(cases)) seen += tries.filter((one) => one.at >= start).length;
      }
      return seen >= 20;
    }
  },
  {
    id: 'daily',
    make: () => ({ text: 'Drie dagscrambles', bar: 3 }),
    done: ({ play: game, start }) => Object.entries(game.daily || {})
      .filter(([day]) => new Date(`${day}T12:00:00`).getTime() >= start).length >= 3
  },
  {
    id: 'game',
    make: () => ({ text: t('Play a game to the end'), bar: 1 }),
    done: ({ play: game, start }) => (game.runs || []).some((run) => run.at >= start)
  },
  {
    id: 'clean',
    make: () => ({ text: t('Twenty in a row without a DNF'), bar: 20 }),
    done: ({ week }, bar) => {
      let run = 0;
      for (const solve of week) {
        run = solve.penalty === 'DNF' ? 0 : run + 1;
        if (run >= bar) return true;
      }
      return false;
    }
  }
];

/** A shuffle that gives the same card all week and a different one the next. */
function order(seed, many) {
  let state = seed >>> 0;
  const roll = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const list = Array.from({ length: many }, (_, at) => at);
  for (let at = list.length - 1; at > 0; at--) {
    const other = Math.floor(roll() * (at + 1));
    [list[at], list[other]] = [list[other], list[at]];
  }
  return list;
}

/**
 * This week's card: nine squares, sized off what you were doing before the week
 * began, and each one either done or not according to what you have done since.
 *
 * @returns {{start: number, name: string, squares: {id, text, done}[], filled: number}|null}
 */
export function card(sessions, play, when = Date.now()) {
  const start = weekOf(when);
  const { week, before } = split(sessions, start);
  if (before.length < 25) return null;   // not enough history to size anything

  const times = before.map(effective).filter(Number.isFinite);
  const weeks = Math.max(1, (start - before[0].at) / (7 * 86400000));
  const known = {
    best: Math.min(...times),
    five: bestFive(before.slice(-200)),
    middle: median(times.slice(-100)),
    usualDays: Math.round(daysIn(before.slice(-200)) / Math.min(weeks, 8)) || 2,
    usualWeek: Math.round(before.length / weeks)
  };

  const at = { week, before, play: play || {}, start, known };
  const squares = [];
  for (const which of order(Math.round(start / 86400000), SQUARES.length)) {
    const square = SQUARES[which];
    const made = square.make(at);
    if (!made) continue;
    squares.push({ id: square.id, text: made.text, done: Boolean(square.done(at, made.bar)) });
    if (squares.length === 9) break;
  }
  if (squares.length < 9) return null;

  return { start, name: weekName(start), squares, filled: squares.filter((one) => one.done).length };
}

/** A line through the card: three in a row, a column, or a diagonal. */
export function lines(squares) {
  const rows = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  return rows.filter((row) => row.every((at) => squares[at]?.done)).length;
}
