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

/** Short blip. Called straight after user input, so autoplay rules are met. */
export function tone(frequency, duration = 0.09, volume = 0.06, type = 'sine') {
  const ctx = context();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;

  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

export function chord(frequencies, gap = 0.12) {
  frequencies.forEach((frequency, index) => {
    setTimeout(() => tone(frequency), index * gap * 1000);
  });
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
