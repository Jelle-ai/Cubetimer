import { randomScramble } from './scramble.js';
import { connectGanTimer, isSupported, TimerState } from './gan-timer.js';
import { averageOf, best, formatSolve, formatTime, sessionMean, setDecimals } from './stats.js';
import { load, save } from './store.js';
import { LED_COLORS, colorOf, loadSettings, saveSettings } from './settings.js';

const TAP_WINDOW_MS = 600;    // window in which a second short touch counts as a double tap
const DELETE_CONFIRM_MS = 8000; // how long a pending delete waits for its confirming tap
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
  settings: document.getElementById('settings'),
  detail: document.getElementById('solve-detail'),
  detailTitle: document.getElementById('detail-title'),
  detailTime: document.getElementById('detail-time'),
  detailMeta: document.getElementById('detail-meta'),
  detailScramble: document.getElementById('detail-scramble'),
  detailPlus2: document.getElementById('detail-plus2'),
  detailDnf: document.getElementById('detail-dnf'),
  detailRemove: document.getElementById('detail-remove'),
  settingsOpen: document.getElementById('settings-open'),
  ledColors: document.getElementById('led-colors'),
  deviceNote: document.getElementById('device-note'),
  deviceDetails: document.getElementById('device-details'),
  stats: {
    count: document.getElementById('st-count'),
    best: document.getElementById('st-best'),
    ao5: document.getElementById('st-ao5'),
    ao12: document.getElementById('st-ao12'),
    mean: document.getElementById('st-mean')
  }
};

let settings = loadSettings();
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
let deleteArmed = false;   // a double tap asked to wipe the last time
let deleteTimer = null;
let runningFrame = null;   // only used when the time stays visible during a solve

const isTouch = window.matchMedia('(pointer: coarse)').matches;

function currentHint() {
  if (device) {
    return settings.inspection
      ? 'Kort aanraken: 1× inspectie · 2× tijd wissen · vasthouden om te starten'
      : 'Kort aanraken: 2× tijd wissen · vasthouden om te starten';
  }
  const key = isTouch ? 'Tik' : 'Tik <kbd>spatie</kbd>';
  return settings.inspection
    ? `${key} voor inspectie · vasthouden en loslaten om te starten`
    : 'Vasthouden en loslaten om te starten';
}

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

    // The whole row is one button that opens the details of that solve.
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'solve';
    if (solve.penalty === 'DNF') row.classList.add('is-dnf');
    row.addEventListener('click', () => openDetail(index));

    const number = document.createElement('span');
    number.className = 'solve-index';
    number.textContent = index + 1;

    const value = document.createElement('span');
    value.className = 'solve-time';
    value.textContent = formatSolve(solve);

    row.append(number, value);

    if (solve.penalty !== 'none') {
      const tag = document.createElement('span');
      tag.className = 'solve-tag';
      tag.textContent = solve.penalty;
      row.append(tag);
    }

    const chevron = document.createElement('span');
    chevron.className = 'solve-chevron';
    chevron.textContent = '\u203a';
    chevron.setAttribute('aria-hidden', 'true');
    row.append(chevron);

    item.append(row);
    el.solves.prepend(item);
  });
}

/* ---------- solve details ---------- */

let detailIndex = null;

function describeMoment(at) {
  if (!at) return '';
  const date = new Date(at);
  const today = new Date().toDateString() === date.toDateString();
  const time = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  return today
    ? `vandaag om ${time}`
    : `${date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })} om ${time}`;
}

function fillDetail() {
  const solve = solves[detailIndex];
  if (!solve) return;

  el.detailTitle.textContent = `Solve ${detailIndex + 1}`;
  el.detailTime.textContent = formatSolve(solve);
  el.detailMeta.textContent = describeMoment(solve.at);
  el.detailScramble.textContent = solve.scramble || 'Niet bewaard bij deze tijd.';
  el.detailPlus2.dataset.active = String(solve.penalty === '+2');
  el.detailDnf.dataset.active = String(solve.penalty === 'DNF');
}

function openDetail(index) {
  detailIndex = index;
  fillDetail();
  el.detail.showModal();
}

el.detailPlus2.addEventListener('click', () => {
  togglePenalty(detailIndex, '+2');
  fillDetail();
});

el.detailDnf.addEventListener('click', () => {
  togglePenalty(detailIndex, 'DNF');
  fillDetail();
});

el.detailRemove.addEventListener('click', () => {
  removeSolve(detailIndex);
  detailIndex = null;
  el.detail.close();
});

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

/**
 * A double tap does not delete straight away: it shows which time is about to
 * go and waits for one more tap. Repeat as often as you like.
 */
function armDelete() {
  if (!solves.length) {
    toast('Geen tijd om te wissen.');
    return;
  }
  const target = solves[solves.length - 1];
  deleteArmed = true;
  el.body.dataset.confirm = 'delete';
  el.time.textContent = formatSolve(target);
  setHint('Wissen? Tik <strong>1×</strong> om te bevestigen');

  clearTimeout(deleteTimer);
  deleteTimer = setTimeout(disarmDelete, DELETE_CONFIRM_MS);
}

function disarmDelete() {
  if (!deleteArmed) return;
  deleteArmed = false;
  clearTimeout(deleteTimer);
  delete el.body.dataset.confirm;
  setHint(currentHint());
  showTime(0);
}

/** Confirmed: drop the most recent time. */
function removeLastSolve() {
  deleteArmed = false;
  clearTimeout(deleteTimer);
  delete el.body.dataset.confirm;
  setHint(currentHint());

  const removed = solves.pop();
  if (!removed) return;
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
  if (!settings.inspection) return;
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

function runningTick() {
  showTime(performance.now() - startedAt);
  runningFrame = requestAnimationFrame(runningTick);
}

function startRunning() {
  disarmDelete();
  settleInspection();
  setPhase('running');
  startedAt = performance.now();

  cancelAnimationFrame(runningFrame);
  if (settings.hideTime) {
    el.time.textContent = DOTS;
  } else {
    runningTick();
  }
}

function stopRunning(ms) {
  cancelAnimationFrame(runningFrame);
  runningFrame = null;
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
  }, settings.holdMs);
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
  if (document.querySelector('dialog[open]')) return false;
  return !target?.closest?.('button, a, input');
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    disarmDelete();
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
    if (inspectionStartedAt === null && !deleteArmed) showTime(0);
  }
}

/** HANDS_OFF: hands lifted before the timer armed, so this touch was a tap. */
function onHandsOff() {
  if (phase !== 'running') {
    setPhase(inspectionStartedAt === null ? 'idle' : 'inspecting');
    if (inspectionStartedAt === null && !deleteArmed) showTime(0);
  }
  if (performance.now() - connectedAt < CONNECT_GRACE_MS) return;

  if (secondTouchStarted) { // second tap completed: ask before wiping
    secondTouchStarted = false;
    cancelInspection();
    armDelete();
    return;
  }

  pendingTap = setTimeout(() => {
    pendingTap = null;
    if (deleteArmed) removeLastSolve();          // the confirming tap
    else if (inspectionStartedAt !== null) cancelInspection();
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
      disarmDelete();
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
      // running inspection or a pending delete.
      if (phase !== 'running' && inspectionStartedAt === null && !deleteArmed) {
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
  disarmDelete();
  el.connect.textContent = 'Verbind GAN timer';
  el.deviceStatus.hidden = true;
  setHint(currentHint());
  el.deviceNote.textContent = 'Nog geen timer verbonden.';
  el.deviceDetails.hidden = true;
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
    setHint(currentHint());
    toast(`Verbonden met ${device.name}.`);
    showDeviceDetails();
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

/* ---------- settings ---------- */

function applySettings() {
  document.documentElement.style.setProperty('--led', colorOf(settings.led));
  setDecimals(settings.decimals);
  if (!settings.inspection) cancelInspection();
  setHint(currentHint());
  if (phase === 'idle' && !deleteArmed) showTime(0);
  render();
}

function storeSettings() {
  if (!saveSettings(settings) && !storageWarned) {
    storageWarned = true;
    toast('Deze browser bewaart niets (privémodus?). Instellingen gelden tot je herlaadt.');
  }
}

/** Highlights the chosen button in a group of options. */
function markGroup(group, value) {
  group.querySelectorAll('button').forEach((button) => {
    const active = button.dataset.value === String(value);
    button.dataset.active = String(active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function buildLedSwatches() {
  el.ledColors.innerHTML = '';
  LED_COLORS.forEach(({ id, label, color }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'swatch';
    button.dataset.value = id;
    button.title = label;
    button.setAttribute('aria-label', label);
    button.style.setProperty('--swatch', color);
    button.addEventListener('click', () => {
      settings.led = id;
      storeSettings();
      applySettings();
      markGroup(el.ledColors, id);
    });
    el.ledColors.append(button);
  });
  markGroup(el.ledColors, settings.led);
}

function bindGroup(id, apply) {
  const group = document.getElementById(id);
  group.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    apply(button.dataset.value);
    storeSettings();
    applySettings();
    markGroup(group, button.dataset.value);
  });
  return group;
}

const groups = {
  inspection: bindGroup('set-inspection', (v) => { settings.inspection = v === 'on'; }),
  hide: bindGroup('set-hide', (v) => { settings.hideTime = v === 'on'; }),
  decimals: bindGroup('set-decimals', (v) => { settings.decimals = Number(v); }),
  hold: bindGroup('set-hold', (v) => { settings.holdMs = Number(v); })
};

function syncSettingsUi() {
  markGroup(groups.inspection, settings.inspection ? 'on' : 'off');
  markGroup(groups.hide, settings.hideTime ? 'on' : 'off');
  markGroup(groups.decimals, settings.decimals);
  markGroup(groups.hold, settings.holdMs);
  markGroup(el.ledColors, settings.led);
}

/**
 * Lists what the connected timer actually exposes over bluetooth. The lighting
 * of the timer is configured through GAN's own app over a protocol that is not
 * public, so this is read-only information.
 */
async function showDeviceDetails() {
  if (!device) return;
  el.deviceNote.textContent = `${device.name} — verbonden.`;
  const description = await device.describe();
  el.deviceDetails.innerHTML = '';

  if (!description.length) {
    el.deviceDetails.textContent = 'Geen details op te vragen.';
  } else {
    for (const { service, characteristics } of description) {
      const block = document.createElement('div');
      block.className = 'device-service';
      block.innerHTML = `<code>${service.slice(4, 8)}</code>`;
      for (const chr of characteristics) {
        const row = document.createElement('div');
        row.className = 'device-chr';
        row.innerHTML = `<code>${chr.uuid.slice(4, 8)}</code><span>${chr.properties.join(', ')}</span>`;
        block.append(row);
      }
      el.deviceDetails.append(block);
    }
    const note = document.createElement('p');
    note.className = 'device-hint';
    note.textContent = 'De lampjes van de timer zijn hier niet mee te sturen: '
      + 'dat loopt via GAN\'s eigen app over een protocol dat niet openbaar is.';
    el.deviceDetails.append(note);
  }
  el.deviceDetails.hidden = false;
}

el.settingsOpen.addEventListener('click', () => {
  el.settingsOpen.blur();
  syncSettingsUi();
  el.settings.showModal();
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

buildLedSwatches();
syncSettingsUi();

setPhase('idle');
renderScramble();
applySettings(); // sets the ring colour, decimals, hint and renders the session
