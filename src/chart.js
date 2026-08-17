// Sparkline of the session: every solve as a point, with the rolling ao5 behind it.

import { effective } from './stats.js';

const WIDTH = 300;
const HEIGHT = 62;
const PADDING = 6;

function rollingAverage(times, size) {
  return times.map((_, index) => {
    if (index + 1 < size) return null;
    const window = times.slice(index + 1 - size, index + 1);
    if (window.some((t) => !Number.isFinite(t))) return null;
    const sorted = window.slice().sort((a, b) => a - b);
    const trimmed = sorted.slice(1, -1);
    return trimmed.reduce((sum, t) => sum + t, 0) / trimmed.length;
  });
}

/**
 * @param {Array} solves session, oldest first
 * @param {number} limit how many of the most recent solves to draw
 * @returns {string} svg markup, or '' when there is nothing worth drawing
 */
export function sessionChart(solves, limit = 30) {
  const recent = solves.slice(-limit);
  const times = recent.map(effective);
  const solved = times.filter(Number.isFinite);
  if (solved.length < 2) return '';

  const min = Math.min(...solved);
  const max = Math.max(...solved);
  const span = max - min || 1;
  const step = recent.length > 1 ? (WIDTH - PADDING * 2) / (recent.length - 1) : 0;

  const x = (index) => PADDING + index * step;
  const y = (time) => HEIGHT - PADDING - ((time - min) / span) * (HEIGHT - PADDING * 2);

  // A DNF breaks the line rather than dragging it off the chart.
  const segments = [];
  let current = [];
  times.forEach((time, index) => {
    if (Number.isFinite(time)) current.push(`${x(index).toFixed(1)},${y(time).toFixed(1)}`);
    else if (current.length) { segments.push(current); current = []; }
  });
  if (current.length) segments.push(current);

  const lines = segments
    .filter((points) => points.length > 1)
    .map((points) => `<polyline class="chart-line" points="${points.join(' ')}"/>`)
    .join('');

  const averages = rollingAverage(times, 5)
    .map((value, index) => (value == null ? null : `${x(index).toFixed(1)},${y(value).toFixed(1)}`))
    .filter(Boolean);
  const averageLine = averages.length > 1
    ? `<polyline class="chart-average" points="${averages.join(' ')}"/>`
    : '';

  // A circle would be squashed by the non-uniform scaling, so the latest solve
  // gets a vertical tick instead.
  const last = times[times.length - 1];
  const lastX = x(times.length - 1).toFixed(1);
  const marker = Number.isFinite(last)
    ? `<line class="chart-dot" x1="${lastX}" y1="${y(last).toFixed(1)}" x2="${lastX}" y2="${HEIGHT}"/>`
    : '';

  return `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="none" role="img"
    aria-label="verloop van je sessie">${averageLine}${lines}${marker}</svg>`;
}
