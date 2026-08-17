// Time formatting and WCA-style averages.

/** Effective time of a solve: +2 adds two seconds, a DNF counts as infinite. */
export function effective(solve) {
  if (!solve) return null;
  if (solve.penalty === 'DNF') return Infinity;
  return solve.penalty === '+2' ? solve.ms + 2000 : solve.ms;
}

let decimals = 2;

/** Two decimals like most timers, or three like the display on the Halo. */
export function setDecimals(value) {
  decimals = value === 3 ? 3 : 2;
}

export function formatTime(ms) {
  if (ms == null) return '–';
  if (!Number.isFinite(ms)) return 'DNF';

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const fraction = Math.floor((ms % 1000) / (decimals === 3 ? 1 : 10));
  const tail = String(fraction).padStart(decimals, '0');

  return minutes > 0
    ? `${minutes}:${String(seconds).padStart(2, '0')}.${tail}`
    : `${seconds}.${tail}`;
}

/** Label for a single solve, including its penalty marker. */
export function formatSolve(solve) {
  if (solve.penalty === 'DNF') return `DNF(${formatTime(solve.ms)})`;
  if (solve.penalty === '+2') return `${formatTime(solve.ms + 2000)}+`;
  return formatTime(solve.ms);
}

/**
 * Average of the last n solves: drop the best and the worst, mean the rest.
 * Two or more DNFs inside the window make the average a DNF (Infinity).
 */
export function averageOf(solves, n) {
  if (solves.length < n) return null;
  const times = solves.slice(-n).map(effective);
  const dnfs = times.filter((t) => !Number.isFinite(t)).length;
  if (dnfs > 1) return Infinity;

  const sorted = times.slice().sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);
  return trimmed.reduce((sum, t) => sum + t, 0) / trimmed.length;
}

/** Mean over every solve that is not a DNF. */
export function sessionMean(solves) {
  const times = solves.map(effective).filter(Number.isFinite);
  if (!times.length) return null;
  return times.reduce((sum, t) => sum + t, 0) / times.length;
}

export function best(solves) {
  const times = solves.map(effective).filter(Number.isFinite);
  return times.length ? Math.min(...times) : null;
}
