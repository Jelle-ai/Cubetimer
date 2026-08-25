// Time formatting and WCA-style averages.

/**
 * Whether a solve counts towards the numbers.
 *
 * A warm-up is still a solve you did, and deleting it to keep your averages
 * honest loses the record of having done it. Marked instead, it stays in the
 * list and stays out of the arithmetic.
 */
export const counts = (solve) => solve?.skip !== true;

/** Only the solves the numbers are allowed to see. */
export const counting = (solves) => solves.filter(counts);

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

/** Trimmed average of exactly one window of solves. */
function windowAverage(window) {
  const times = window.map(effective);
  const dnfs = times.filter((t) => !Number.isFinite(t)).length;
  if (dnfs > 1) return Infinity;

  const sorted = times.slice().sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);
  return trimmed.reduce((sum, t) => sum + t, 0) / trimmed.length;
}

/**
 * Average of the last n solves: drop the best and the worst, mean the rest.
 * Two or more DNFs inside the window make the average a DNF (Infinity).
 */
export function averageOf(solves, n) {
  if (solves.length < n) return null;
  return windowAverage(solves.slice(-n));
}

/**
 * The best window of n anywhere in the session, by whichever measure.
 * @returns {{value: number, start: number}|null}
 */
function bestWindow(solves, n, measure) {
  if (solves.length < n) return null;
  let record = null;
  for (let start = 0; start + n <= solves.length; start++) {
    const value = measure(solves.slice(start, start + n));
    if (Number.isFinite(value) && (record === null || value < record.value)) record = { value, start };
  }
  return record;
}

/** The best average of n anywhere in the session. */
export function bestAverageOf(solves, n) {
  return bestWindow(solves, n, windowAverage)?.value ?? null;
}

/** Where that best average sits, as indices into the session. */
export function bestAverageAt(solves, n) {
  const record = bestWindow(solves, n, windowAverage);
  return record ? { start: record.start, end: record.start + n } : null;
}

function windowMean(window) {
  const times = window.map(effective);
  if (times.some((t) => !Number.isFinite(t))) return Infinity;
  return times.reduce((sum, t) => sum + t, 0) / times.length;
}

/** Mean of the last n, without trimming — a DNF makes it a DNF. */
export function meanOf(solves, n) {
  if (solves.length < n) return null;
  return windowMean(solves.slice(-n));
}

/** The best mean of n anywhere in the session. */
export function bestMeanOf(solves, n) {
  return bestWindow(solves, n, windowMean)?.value ?? null;
}

export function bestMeanAt(solves, n) {
  const record = bestWindow(solves, n, windowMean);
  return record ? { start: record.start, end: record.start + n } : null;
}

export function worst(solves) {
  const times = solves.map(effective).filter(Number.isFinite);
  return times.length ? Math.max(...times) : null;
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
