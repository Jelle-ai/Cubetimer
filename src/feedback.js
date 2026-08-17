// Sound, vibration and the little celebration for a personal best.
// No assets: the tones are synthesised and the confetti is plain DOM.

let audio = null;

function context() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  audio ||= new Ctor();
  if (audio.state === 'suspended') audio.resume().catch(() => {});
  return audio;
}

/** Short sine blip. Called straight after user input, so autoplay rules are met. */
export function tone(frequency, duration = 0.09, volume = 0.06) {
  const ctx = context();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'sine';
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

/** Confetti in the accent colour, cleaned up after itself. */
export function celebrate(color) {
  const layer = document.createElement('div');
  layer.className = 'confetti';

  const colors = [color, '#ffd166', '#06d6a0', '#ef476f', '#118ab2'];
  for (let i = 0; i < 34; i++) {
    const piece = document.createElement('i');
    piece.style.setProperty('--x', `${Math.random() * 100}vw`);
    piece.style.setProperty('--delay', `${Math.random() * 0.35}s`);
    piece.style.setProperty('--spin', `${Math.random() * 720 - 360}deg`);
    piece.style.setProperty('--drift', `${Math.random() * 120 - 60}px`);
    piece.style.background = colors[i % colors.length];
    layer.append(piece);
  }

  document.body.append(layer);
  setTimeout(() => layer.remove(), 2600);
}
