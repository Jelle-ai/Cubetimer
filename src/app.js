import { randomScramble } from './scramble.js';
import { connectGanTimer, isSupported, TimerState } from './gan-timer.js';
import { averageOf, best, formatSolve, formatTime, sessionMean } from './stats.js';
import { load, save } from './store.js';

const HOLD_MS = 400;          // hold this long before the timer arms
const TAP_WINDOW_MS = 600;    // window in which a second short touch counts as a double tap
const INSPECTION_MS = 15000;  // WCA inspection
const PLUS_TWO_MS = 17000;    // starting after this means DNF
const CONNECT_GRACE_MS = 1500; // ignore device state echoed right after connecting
const DOTS = '•••';

const el = {
  body: document.body,
  stage: document.getElementById('stage'),
  time: document.getElementById('time'),
  hint: document.getElementById('hint'),
  scramble: document.getElementById('scramble'),
  newScramble: document.getElementById('new-scramble'),
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
let phase = 'idle'; // idle | inspecting | holding | ready | running
let holdTimer = null;
let startedAt = 0;

let inspectionStartedAt = null;
let inspectionFrame = null;
let pendingPenalty = 'none'; // penalty earned during inspection, applied to the next solve

let ignoreNextKeyUp = false;
let ignoreNextPointerUp = false;

let device = null;
let connectedAt = 0;
let pendingTap = null;          // single tap waiting to see whether a second one follows
let secondTouchStarted = false; // hands went back on while a tap was pending
let toastTimer = null;
let storageWarned = false;

const isTouch = window.matchMedia('(pointer: coarse)').matches;
const MANUAL_HINT = isTouch
  ? 'Tik voor inspectie · vasthouden en loslaten om te starten'
  : 'Tik <kbd>spatie</kbd> voor inspectie · vasthouden en loslaten om te starten';
const DEVICE_HINT = 'Kort aanraken: 1× inspectie · 2× tijd wissen · vasthouden om te starten';

/* ---------- rendering ---------- */

function setPhase(next) {
  phase = next;
  el.body.dataset.phase = next;
}

function showTime(ms) {
  el.time.textContent = formatTime(ms);
}

function renderScramble() {
  el.scramble.textContent = scramble;
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

function setHint(text) {
  el.hint.innerHTML = text;
}

function toast(message) {
  el.toast.textContent = message;
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.toast.hidden = true; }, 3000);
}

/* ---------- session ---------- */

/** Save, and say so once if this browser refuses to store anything. */
function persist() {
  if (save(solves) || storageWarned) return;
  storageWarned = true;
  toast('Deze browser bewaart niets (privémodus?). Je tijden blijven staan tot je de pagina herlaadt.');
}

function addSolve(ms) {
  solves.push({ ms, penalty: pendingPenalty, scramble, at: Date.now() });
  pendingPenalty = 'none';
  persist();
  scramble = randomScramble();
  renderScramble();
  render();
}

function togglePenalty(index, penalty) {
  const solve = solves[index];
  solve.penalty = solve.penalty === penalty ? 'none' : penalty;
  persist();
  render();
}

function removeSolve(index) {
  solves.splice(index, 1);
  persist();
  render();
}

/** Drop the most recent time — the double press on the timer. */
function removeLastSolve() {
  if (!solves.length) {
    toast('Geen tijd om te wissen.');
    return;
  }
  const removed = solves.pop();
  persist();
  render();
  showTime(0);
  toast(`${formatSolve(removed)} gewist.`);
}

/* ---------- inspection ---------- */

function inspectionTick() {
  const elapsed = performance.now() - inspectionStartedAt;
  const remaining = INSPECTION_MS - elapsed;

  if (remaining > 0) el.time.textContent = String(Math.ceil(remaining / 1000));
  else if (elapsed < PLUS_TWO_MS) el.time.textContent = '+2';
  else el.time.textContent = 'DNF';

  el.body.dataset.inspection = remaining > 0 ? 'ok' : 'over';
  inspectionFrame = requestAnimationFrame(inspectionTick);
}

function startInspection() {
  inspectionStartedAt = performance.now();
  pendingPenalty = 'none';
  setPhase('inspecting');
  cancelAnimationFrame(inspectionFrame);
  inspectionTick();
}

function stopInspection() {
  cancelAnimationFrame(inspectionFrame);
  inspectionFrame = null;
  delete el.body.dataset.inspection;
  const startedInspection = inspectionStartedAt;
  inspectionStartedAt = null;
  return startedInspection;
}

function cancelInspection() {
  if (inspectionStartedAt === null) return;
  stopInspection();
  pendingPenalty = 'none';
  setPhase('idle');
  showTime(0);
}

/** Penalty for a solve that starts now, based on how long inspection ran. */
function settleInspection() {
  const startedInspection = stopInspection();
  if (startedInspection === null) {
    pendingPenalty = 'none';
    return;
  }
  const elapsed = performance.now() - startedInspection;
  pendingPenalty = elapsed < INSPECTION_MS ? 'none' : elapsed < PLUS_TWO_MS ? '+2' : 'DNF';
}

/* ---------- timing ---------- */

function startRunning() {
  settleInspection();
  setPhase('running');
  startedAt = performance.now();
  el.time.textContent = DOTS; // the time stays hidden while solving
}

function stopRunning(ms) {
  const elapsed = ms ?? performance.now() - startedAt;
  setPhase('idle');
  showTime(elapsed);
  addSolve(Math.round(elapsed));
}

function beginHold() {
  if (phase !== 'idle' && phase !== 'inspecting') return;
  setPhase('holding');
  if (inspectionStartedAt === null) showTime(0);
  clearTimeout(holdTimer);
  holdTimer = setTimeout(() => {
    if (phase === 'holding') setPhase('ready');
  }, HOLD_MS);
}

/**
 * Release after a hold. A full hold starts the solve; a short tap toggles
 * inspection instead.
 */
function endHold() {
  clearTimeout(holdTimer);
  if (phase === 'ready') {
    startRunning();
  } else if (phase === 'holding') {
    if (inspectionStartedAt !== null) cancelInspection();
    else startInspection();
  }
}

/* ---------- manual input ---------- */

function manualTimingAllowed(target) {
  if (device) return false; // the GAN timer is the source of truth while connected
  return !target?.closest?.('button, a, input');
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    cancelInspection();
    return;
  }
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
  if (phase === 'holding' || phase === 'ready') {
    setPhase(inspectionStartedAt === null ? 'idle' : 'inspecting');
  }
});

// A running timer must never be interrupted by a stray context menu.
el.stage.addEventListener('contextmenu', (event) => {
  if (phase !== 'idle') event.preventDefault();
});

/* ---------- GAN Smart Timer ---------- */

/**
 * A short touch on the mat — both hands on and off again before the timer arms
 * — is the gesture that drives the app: once starts inspection, twice in a row
 * drops the last time. Touching and holding until the timer goes green is a
 * normal solve start and never counts as a tap.
 */
function clearPendingTap() {
  clearTimeout(pendingTap);
  pendingTap = null;
  secondTouchStarted = false;
}

/** HANDS_ON: hands placed on the mat. */
function onHandsOn() {
  // A touch that begins while a tap is pending is the start of a double tap,
  // unless it turns into a solve — GET_SET and RUNNING clear it again.
  if (pendingTap) {
    clearTimeout(pendingTap);
    pendingTap = null;
    secondTouchStarted = true;
  }
  if (phase === 'idle' || phase === 'inspecting') {
    setPhase('holding');
    if (inspectionStartedAt === null) showTime(0);
  }
}

/** HANDS_OFF: hands lifted before the timer armed, so this touch was a tap. */
function onHandsOff() {
  if (phase !== 'running') {
    setPhase(inspectionStartedAt === null ? 'idle' : 'inspecting');
    if (inspectionStartedAt === null) showTime(0);
  }
  if (performance.now() - connectedAt < CONNECT_GRACE_MS) return;

  if (secondTouchStarted) { // second tap completed: wipe the last time
    secondTouchStarted = false;
    cancelInspection();
    removeLastSolve();
    return;
  }

  pendingTap = setTimeout(() => {
    pendingTap = null;
    if (inspectionStartedAt !== null) cancelInspection();
    else startInspection();
  }, TAP_WINDOW_MS);
}

function onDeviceEvent({ state, time }) {
  switch (state) {
    case TimerState.HANDS_ON:
      onHandsOn();
      break;
    case TimerState.GET_SET:
      clearPendingTap(); // this touch is a solve, not a tap
      setPhase('ready');
      break;
    case TimerState.HANDS_OFF:
      onHandsOff();
      break;
    case TimerState.RUNNING:
      clearPendingTap();
      startRunning();
      break;
    case TimerState.STOPPED:
      // The device reports the authoritative time, down to the millisecond.
      stopRunning(time);
      break;
    case TimerState.IDLE:
      // Reset button on the timer: the app follows, but never interrupts a
      // running inspection.
      if (phase !== 'running' && inspectionStartedAt === null) {
        setPhase('idle');
        showTime(0);
      }
      break;
    default:
      break;
  }
}

function onDeviceDisconnect() {
  device = null;
  clearPendingTap();
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
    connectedAt = performance.now();
    clearPendingTap();
    el.connect.textContent = 'Loskoppelen';
    el.deviceStatus.textContent = device.name;
    el.deviceStatus.hidden = false;
    setHint(DEVICE_HINT);
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

el.clear.addEventListener('click', () => {
  el.clear.blur();
  if (!solves.length) return;
  if (!confirm('Alle tijden van deze sessie wissen?')) return;
  solves = [];
  persist();
  render();
});

/* ---------- init ---------- */

if (!isSupported()) {
  el.connect.title = 'Web Bluetooth is niet beschikbaar in deze browser';
}

setPhase('idle');
setHint(MANUAL_HINT);
renderScramble();
render();
