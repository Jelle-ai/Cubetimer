import { randomScramble, scrambleSvg } from './scramble.js';
import { connectGanTimer, isSupported, TimerState } from './gan-timer.js';
import { averageOf, best, formatSolve, formatTime, sessionMean } from './stats.js';
import { load, save } from './store.js';

const HOLD_MS = 400; // how long spacebar must be held before the timer arms

const el = {
  body: document.body,
  stage: document.getElementById('stage'),
  time: document.getElementById('time'),
  hint: document.getElementById('hint'),
  scramble: document.getElementById('scramble'),
  preview: document.getElementById('preview'),
  newScramble: document.getElementById('new-scramble'),
  togglePreview: document.getElementById('toggle-preview'),
  connect: document.getElementById('connect'),
  deviceStatus: document.getElementById('device-status'),
  solves: document.getElementById('solves'),
  empty: document.getElementById('empty'),
  clear: document.getElementById('clear'),
  toast: document.getElementById('toast'),
  stats: {
    count: document.getElementById('st-count'),
    best: document.getElementById('st-best'),
    ao5: document.getElementById('st-ao5'),
    ao12: document.getElementById('st-ao12'),
    mean: document.getElementById('st-mean')
  }
};

let solves = load();
let scramble = randomScramble();
let phase = 'idle'; // idle | holding | ready | running
let holdTimer = null;
let startedAt = 0;
let frame = null;
let ignoreNextKeyUp = false;
let ignoreNextPointerUp = false;
let device = null;
let toastTimer = null;

const isTouch = window.matchMedia('(pointer: coarse)').matches;
const MANUAL_HINT = isTouch
  ? 'Houd het scherm vast en laat los om te starten'
  : 'Houd <kbd>spatie</kbd> vast en laat los om te starten';

/* ---------- rendering ---------- */

function setPhase(next) {
  phase = next;
  el.body.dataset.phase = next;
}

function renderScramble() {
  el.scramble.textContent = scramble;
  el.preview.innerHTML = scrambleSvg(scramble);
}

function renderStats() {
  el.stats.count.textContent = String(solves.length);
  el.stats.best.textContent = formatTime(best(solves));
  el.stats.ao5.textContent = formatTime(averageOf(solves, 5));
  el.stats.ao12.textContent = formatTime(averageOf(solves, 12));
  el.stats.mean.textContent = formatTime(sessionMean(solves));
}

function renderSolves() {
  el.solves.innerHTML = '';
  el.empty.hidden = solves.length > 0;

  solves.forEach((solve, index) => {
    const item = document.createElement('li');
    item.className = 'solve';
    if (solve.penalty === 'DNF') item.classList.add('is-dnf');

    const number = document.createElement('span');
    number.className = 'solve-index';
    number.textContent = index + 1;

    const value = document.createElement('span');
    value.className = 'solve-time';
    value.textContent = formatSolve(solve);
    value.title = solve.scramble || '';

    const actions = document.createElement('span');
    actions.className = 'solve-actions';
    actions.append(
      action('+2', 'plus twee', () => togglePenalty(index, '+2')),
      action('DNF', 'niet opgelost', () => togglePenalty(index, 'DNF')),
      action('×', 'verwijderen', () => removeSolve(index))
    );

    item.append(number, value, actions);
    el.solves.prepend(item);
  });
}

function action(label, title, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'solve-action';
  button.textContent = label;
  button.title = title;
  button.addEventListener('click', () => {
    onClick();
    button.blur();
  });
  return button;
}

function render() {
  renderStats();
  renderSolves();
}

function toast(message) {
  el.toast.textContent = message;
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.toast.hidden = true; }, 4000);
}

/* ---------- session ---------- */

function addSolve(ms) {
  solves.push({ ms, penalty: 'none', scramble, at: Date.now() });
  save(solves);
  scramble = randomScramble();
  renderScramble();
  render();
}

function togglePenalty(index, penalty) {
  const solve = solves[index];
  solve.penalty = solve.penalty === penalty ? 'none' : penalty;
  save(solves);
  render();
}

function removeSolve(index) {
  solves.splice(index, 1);
  save(solves);
  render();
}

/* ---------- timing ---------- */

function tick() {
  el.time.textContent = formatTime(performance.now() - startedAt);
  frame = requestAnimationFrame(tick);
}

function startRunning() {
  setPhase('running');
  startedAt = performance.now();
  el.time.textContent = '0.00';
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(tick);
}

function stopRunning(ms) {
  cancelAnimationFrame(frame);
  frame = null;
  const elapsed = ms ?? performance.now() - startedAt;
  setPhase('idle');
  el.time.textContent = formatTime(elapsed);
  addSolve(Math.round(elapsed));
}

function beginHold() {
  if (phase !== 'idle') return;
  setPhase('holding');
  el.time.textContent = '0.00';
  clearTimeout(holdTimer);
  holdTimer = setTimeout(() => {
    if (phase === 'holding') setPhase('ready');
  }, HOLD_MS);
}

function endHold() {
  clearTimeout(holdTimer);
  if (phase === 'ready') startRunning();
  else if (phase === 'holding') setPhase('idle');
}

/* ---------- manual input ---------- */

function manualTimingAllowed(target) {
  if (device) return false; // the GAN timer is the source of truth while connected
  return !target?.closest?.('button, a, input');
}

document.addEventListener('keydown', (event) => {
  if (event.code !== 'Space' || event.repeat) return;
  if (!manualTimingAllowed(event.target)) return;
  event.preventDefault();

  if (phase === 'running') {
    stopRunning();
    ignoreNextKeyUp = true;
    return;
  }
  beginHold();
});

document.addEventListener('keyup', (event) => {
  if (event.code !== 'Space') return;
  if (ignoreNextKeyUp) {
    ignoreNextKeyUp = false;
    return;
  }
  if (!manualTimingAllowed(event.target)) return;
  event.preventDefault();
  endHold();
});

el.stage.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  if (!manualTimingAllowed(event.target)) return;

  if (phase === 'running') {
    stopRunning();
    ignoreNextPointerUp = true;
    return;
  }
  beginHold();
});

el.stage.addEventListener('pointerup', () => {
  if (ignoreNextPointerUp) {
    ignoreNextPointerUp = false;
    return;
  }
  if (!device) endHold();
});

el.stage.addEventListener('pointercancel', () => {
  clearTimeout(holdTimer);
  if (phase === 'holding' || phase === 'ready') setPhase('idle');
});

// A running timer must never be interrupted by a stray scroll or context menu.
el.stage.addEventListener('contextmenu', (event) => {
  if (phase !== 'idle') event.preventDefault();
});

/* ---------- GAN Smart Timer ---------- */

function setHint(text) {
  el.hint.innerHTML = text;
}

function onDeviceEvent({ state, time }) {
  switch (state) {
    case TimerState.HANDS_ON:
      if (phase === 'idle') setPhase('holding');
      break;
    case TimerState.GET_SET:
      setPhase('ready');
      break;
    case TimerState.HANDS_OFF:
      if (phase !== 'running') setPhase('idle');
      break;
    case TimerState.RUNNING:
      startRunning();
      break;
    case TimerState.STOPPED:
      // The device reports the authoritative time, down to the millisecond.
      stopRunning(time);
      break;
    case TimerState.IDLE:
      if (phase !== 'running') setPhase('idle');
      break;
    default:
      break;
  }
}

function onDeviceDisconnect() {
  device = null;
  el.connect.textContent = 'Verbind GAN timer';
  el.deviceStatus.hidden = true;
  setHint(MANUAL_HINT);
  toast('Timer losgekoppeld.');
}

el.connect.addEventListener('click', async () => {
  el.connect.blur();

  if (device) {
    await device.disconnect();
    return;
  }
  if (!isSupported()) {
    toast('Web Bluetooth werkt alleen in Chrome of Edge (desktop of Android).');
    return;
  }

  el.connect.disabled = true;
  el.connect.textContent = 'Verbinden…';
  try {
    device = await connectGanTimer({ onEvent: onDeviceEvent, onDisconnect: onDeviceDisconnect });
    el.connect.textContent = 'Loskoppelen';
    el.deviceStatus.textContent = device.name;
    el.deviceStatus.hidden = false;
    setHint('Handen op de timer om te starten');
    toast(`Verbonden met ${device.name}.`);
  } catch (error) {
    device = null;
    el.connect.textContent = 'Verbind GAN timer';
    if (error?.name !== 'NotFoundError') { // user closed the device picker
      toast(error?.message || 'Verbinden mislukt.');
    }
  } finally {
    el.connect.disabled = false;
  }
});

/* ---------- controls ---------- */

el.newScramble.addEventListener('click', () => {
  el.newScramble.blur();
  scramble = randomScramble();
  renderScramble();
});

el.togglePreview.addEventListener('click', () => {
  el.togglePreview.blur();
  const hidden = el.body.classList.toggle('no-preview');
  el.togglePreview.setAttribute('aria-expanded', String(!hidden));
  localStorage.setItem('cubetimer.preview', hidden ? 'off' : 'on');
});

el.clear.addEventListener('click', () => {
  el.clear.blur();
  if (!solves.length) return;
  if (!confirm('Alle tijden van deze sessie wissen?')) return;
  solves = [];
  save(solves);
  render();
});

/* ---------- init ---------- */

if (localStorage.getItem('cubetimer.preview') === 'off') {
  el.body.classList.add('no-preview');
  el.togglePreview.setAttribute('aria-expanded', 'false');
}
if (!isSupported()) {
  el.connect.title = 'Web Bluetooth is niet beschikbaar in deze browser';
}

setPhase('idle');
setHint(MANUAL_HINT);
renderScramble();
render();
