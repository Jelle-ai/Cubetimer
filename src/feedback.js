// Sound, vibration and the celebrations. No assets: tones are synthesised and
// the confetti is plain DOM.

let audio = null;

function context() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  audio ||= new Ctor();
  if (audio.state === 'suspended') audio.resume().catch(() => {});
  return audio;
}

/**
 * One note.
 *
 * The first version of this was a bare oscillator switched on and off, which is
 * a click, a tone and another click -- and that is what made the app sound
 * cheap. What costs nothing and changes everything is the envelope: a few
 * milliseconds of attack so the note starts rather than appears, and an
 * exponential tail so it stops rather than is cut off.
 *
 * @param {number} [at] when to play, on the audio clock. Scheduling ahead is
 *   sample-accurate; setTimeout is not, and a two-note figure timed with it
 *   arrives as two separate noises rather than as one shape.
 */
export function tone(frequency, duration = 0.09, volume = 0.06, type = 'sine', at = null) {
  const ctx = context();
  if (!ctx) return;

  const start = at ?? ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);

  // Exponential ramps cannot touch zero, so they start and end just above it.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

/**
 * Notes one after another, laid on the audio clock rather than on timers, so
 * the figure keeps its rhythm even while the page is busy drawing a result.
 *
 * @param {number[]} frequencies
 * @param {{gap: number, duration: number, volume: number, type: string, fade: number}} [shape]
 *   fade below 1 makes each note quieter than the last, which is what stops a
 *   four-note flourish from sounding like an alarm.
 */
export function chord(frequencies, gap = 0.12, shape = {}) {
  const ctx = context();
  if (!ctx) return;
  const { duration = 0.22, volume = 0.07, type = 'sine', fade = 1 } = shape;

  frequencies.forEach((frequency, index) => {
    tone(frequency, duration, volume * fade ** index, type, ctx.currentTime + index * gap);
  });
}

/**
 * Two notes at once rather than in a row: a small interval sounds like one
 * sound with a colour to it, where the same two in sequence sound like two
 * beeps.
 */
export function together(frequencies, duration = 0.2, volume = 0.055, type = 'sine') {
  const ctx = context();
  if (!ctx) return;
  for (const frequency of frequencies) tone(frequency, duration, volume, type, ctx.currentTime);
}

export function vibrate(pattern) {
  navigator.vibrate?.(pattern);
}

const PALETTE = ['#4fc3f7', '#ffd166', '#06d6a0', '#ef476f', '#a78bfa', '#fb923c'];

function piece(colors, index, mode) {
  const element = document.createElement('i');
  element.style.background = colors[index % colors.length];
  element.style.setProperty('--spin', `${Math.random() * 900 - 450}deg`);
  element.style.setProperty('--delay', `${Math.random() * (mode === 'party' ? 0.5 : 0.25)}s`);
  element.style.setProperty('--size', `${6 + Math.random() * 6}px`);
  if (Math.random() < 0.35) element.style.borderRadius = '50%';
  return element;
}

/** Rain from above: the everyday celebration. */
function rain(layer, colors, count) {
  for (let i = 0; i < count; i++) {
    const element = piece(colors, i, 'rain');
    element.className = 'fall';
    element.style.setProperty('--x', `${Math.random() * 100}vw`);
    element.style.setProperty('--drift', `${Math.random() * 140 - 70}px`);
    layer.append(element);
  }
}

/** Cannons from both bottom corners: reserved for a personal best. */
function cannons(layer, colors, count) {
  for (let i = 0; i < count; i++) {
    const element = piece(colors, i, 'party');
    element.className = 'launch';
    const fromLeft = i % 2 === 0;
    element.style.setProperty('--x', fromLeft ? '2vw' : '98vw');
    element.style.setProperty('--rise', `${45 + Math.random() * 45}vh`);
    element.style.setProperty('--travel', `${(fromLeft ? 1 : -1) * (25 + Math.random() * 65)}vw`);
    layer.append(element);
  }
}

/**
 * @param {'burst'|'party'} [kind] a burst marks a good solve, the party is for a record
 */
export function confetti(kind = 'burst') {
  const layer = document.createElement('div');
  layer.className = 'confetti';

  if (kind === 'party') {
    rain(layer, PALETTE, 70);
    cannons(layer, PALETTE, 50);
  } else {
    rain(layer, PALETTE, 26);
  }

  document.body.append(layer);
  setTimeout(() => layer.remove(), kind === 'party' ? 4200 : 2600);
}

/** The opposite of confetti: a short red pulse of the ring. */
export function flashMiss() {
  document.body.dataset.miss = '1';
  setTimeout(() => { delete document.body.dataset.miss; }, 600);
}
