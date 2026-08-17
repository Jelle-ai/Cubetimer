import { PUZZLES, nextScramble, puzzleById, randomMoveScramble, warmUp } from './scramble.js';
import { bluetoothAvailable, connectGanTimer, isSupported, TimerState } from './gan-timer.js';
import {
  averageOf, best, bestAverageOf, bestMeanOf, effective, formatSolve, formatTime,
  meanOf, sessionMean, setDecimals, worst
} from './stats.js';
import { load, save } from './store.js';
import { COLOR_SLOTS, LED_COLORS, colorOf, loadSettings, saveSettings } from './settings.js';
import { chord, confetti, flashMiss, tone, vibrate } from './feedback.js';
import { previewSvg } from './cube.js';

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
  puzzles: document.getElementById('puzzles'),
  preview: document.getElementById('preview'),
  progress: document.getElementById('progress'),
  insight: document.getElementById('insight'),
  colorSlots: document.getElementById('color-slots'),
  detailNote: document.getElementById('detail-note'),
  importTimes: document.getElementById('import-times'),
  importSheet: document.getElementById('import-sheet'),
  importTitle: document.getElementById('import-title'),
  importText: document.getElementById('import-text'),
  importList: document.getElementById('import-list'),
  importNote: document.getElementById('import-note'),
  importYes: document.getElementById('import-yes'),
  importNo: document.getElementById('import-no'),
  statsButton: document.getElementById('stats'),
  statsSheet: document.getElementById('stats-sheet'),
  statsTitle: document.getElementById('stats-title'),
  statsList: document.getElementById('stats-list'),
  selectMode: document.getElementById('select-mode'),
  selectionBar: document.getElementById('selection-bar'),
  selectionCount: document.getElementById('selection-count'),
  selectAll: document.getElementById('select-all'),
  selectionPlus2: document.getElementById('selection-plus2'),
  selectionDnf: document.getElementById('selection-dnf'),
  selectionDelete: document.getElementById('selection-delete'),
  selectDone: document.getElementById('select-done'),
  sessionSelect: document.getElementById('session-select'),
  sessionManage: document.getElementById('session-manage'),
  sessionSheet: document.getElementById('session-sheet'),
  sessionName: document.getElementById('session-name'),
  sessionSummary: document.getElementById('session-summary'),
  sessionNew: document.getElementById('session-new'),
  sessionDelete: document.getElementById('session-delete'),
  targetSwitch: document.getElementById('set-target'),
  targetValue: document.getElementById('set-target-value'),
  export: document.getElementById('export'),
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
  connectAny: document.getElementById('connect-any'),
  connectAnyNote: document.getElementById('connect-any-note'),
  setup: document.getElementById('setup'),
  scrambleSheet: document.getElementById('scramble-sheet'),
  scrambleSlot: document.getElementById('scramble-slot'),
  scrambleOpen: document.getElementById('scramble-open'),
  scrambleClose: document.getElementById('scramble-close'),
  stats: {
    single: document.getElementById('st-single'),
    singleBest: document.getElementById('st-single-best'),
    mo3: document.getElementById('st-mo3'),
    mo3Best: document.getElementById('st-mo3-best'),
    ao5: document.getElementById('st-ao5'),
    ao5Best: document.getElementById('st-ao5-best'),
    ao12: document.getElementById('st-ao12'),
    ao12Best: document.getElementById('st-ao12-best')
  }
};

let settings = loadSettings();
let saveFile = load();
let solves = saveFile.sessions[saveFile.active].solves;
let scramble = randomMoveScramble(saveFile.sessions[saveFile.active].puzzle);
let scrambleToken = 0; // guards against a slow scramble landing after a newer one
let phase = 'idle'; // idle | inspecting | holding | ready | running
let holdTimer = null;
let startedAt = 0;

let inspectionStartedAt = null;
let inspectionFrame = null;
let inspectionCalls = 0; // 8 and 12 second calls already given
let inspectionJustStarted = false;
let pendingPenalty = 'none'; // penalty earned during inspection, applied to the next solve

let ignoreNextKeyUp = false;
let ignoreNextPointerUp = false;

let device = null;
let connectedAt = 0;
let pendingTap = null; // window in which a second tap redirects the first one
let toastTimer = null;
let storageWarned = false;
let deleteArmed = false;   // a double tap asked to wipe the last time
let deleteTimer = null;
let armedByCurrentTouch = false; // the touch that raised the question cannot answer it
let penaltyStep = 0; // how far the double taps have walked the last solve along
let confirmTimer = null; // a confirming tap, held back to see if a second one follows
let runningFrame = null;   // only used when the time stays visible during a solve

// Solve objects themselves are held, not their positions: an index would point
// at the wrong time as soon as one is removed.
let selecting = false;
const selected = new Set();

const isTouch = window.matchMedia('(pointer: coarse)').matches;

// A phone has no room for the whole gesture list: three lines of small print
// under the ring crowd out everything else. There it says the one thing you
// need, and the full list lives in the settings panel.
const narrow = window.matchMedia('(max-width: 860px)');

function currentHint() {
  if (device) {
    if (narrow.matches) {
      return settings.inspection
        ? 'Aanraken voor inspectie · vasthouden om te starten'
        : 'Vasthouden om te starten';
    }
    return settings.inspection
      ? 'Kort aanraken: 1× inspectie · 2× +2, nog eens DNF, nog eens wissen · vasthouden om te starten'
      : 'Kort aanraken: 2× +2, nog eens DNF, nog eens wissen · vasthouden om te starten';
  }
  const key = isTouch ? 'Tik' : 'Tik <kbd>spatie</kbd>';
  if (!settings.inspection) return 'Vasthouden en loslaten om te starten';
  return narrow.matches
    ? `${key} voor inspectie · vasthouden om te starten`
    : `${key} voor inspectie · vasthouden en loslaten om te starten`;
}

/**
 * A phone screen shows the ring, the averages and the times, and nothing else.
 * The puzzle chips, the scramble and the cube are not dropped -- they move into
 * a sheet of their own, one tap away in the top bar. The very same elements are
 * moved across, so there is never a second copy to keep in step.
 */
function applyLayout() {
  const phone = narrow.matches;
  el.scrambleOpen.hidden = !phone;
  el.body.dataset.compact = String(phone);

  if (phone) el.scrambleSlot.append(el.puzzles, el.setup);
  else el.stage.prepend(el.puzzles, el.setup); // both, in order, ahead of the ring

  if (!phone && el.scrambleSheet.open) el.scrambleSheet.close();
  if (!el.body.dataset.phase || el.body.dataset.phase === 'idle') setHint(currentHint());
}

// Turning the phone sideways changes which layout fits.
narrow.addEventListener('change', applyLayout);

el.scrambleOpen.addEventListener('click', () => el.scrambleSheet.showModal());
el.scrambleClose.addEventListener('click', () => el.scrambleSheet.close());

/* ---------- feedback ---------- */

function cue(name) {
  if (settings.sound) {
    if (name === 'ready') tone(880, .06);
    else if (name === 'start') tone(660, .05);
    else if (name === 'stop') chord([784, 1046]);
    else if (name === 'warn8') tone(520, .12);
    else if (name === 'warn12') chord([520, 520], .16);
    else if (name === 'record') chord([784, 988, 1319, 1568], .09);
    else if (name === 'target') chord([880, 1174], .09);
    else if (name === 'miss') tone(196, .22, .05, 'triangle');
  }
  if (settings.haptics) {
    if (name === 'ready') vibrate(25);
    else if (name === 'start') vibrate(12);
    else if (name === 'stop') vibrate([15, 40, 15]);
    else if (name === 'record') vibrate([20, 60, 20, 60, 40]);
    else if (name === 'target') vibrate([12, 40, 12]);
    else if (name === 'miss') vibrate(40);
  }
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

  const markup = settings.preview ? previewSvg(scramble, currentSession().puzzle) : '';
  el.preview.innerHTML = markup;
  el.preview.hidden = !markup;
}

/** Every column shows the latest value with the session record under it. */
function renderStats() {
  const last = solves.length ? effective(solves[solves.length - 1]) : null;

  el.stats.single.textContent = formatTime(last);
  el.stats.singleBest.textContent = formatTime(best(solves));
  el.stats.mo3.textContent = formatTime(meanOf(solves, 3));
  el.stats.mo3Best.textContent = formatTime(bestMeanOf(solves, 3));
  el.stats.ao5.textContent = formatTime(averageOf(solves, 5));
  el.stats.ao5Best.textContent = formatTime(bestAverageOf(solves, 5));
  el.stats.ao12.textContent = formatTime(averageOf(solves, 12));
  el.stats.ao12Best.textContent = formatTime(bestAverageOf(solves, 12));
}

function renderSolves() {
  el.solves.innerHTML = '';
  el.empty.hidden = solves.length > 0;

  const times = solves.map(effective).filter(Number.isFinite);
  const fastest = settings.highlight && times.length > 1 ? Math.min(...times) : null;
  const slowest = settings.highlight && times.length > 1 ? Math.max(...times) : null;

  solves.forEach((solve, index) => {
    const item = document.createElement('li');

    // The whole row is one button that opens the details of that solve.
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'solve';
    if (solve.penalty === 'DNF') row.classList.add('is-dnf');

    const value = effective(solve);
    if (fastest !== null && value === fastest) row.classList.add('is-best');
    else if (slowest !== null && value === slowest) row.classList.add('is-worst');
    if (settings.targetOn && Number.isFinite(value) && value <= settings.targetMs) {
      row.classList.add('is-under');
    }
    row.addEventListener('click', () => (selecting ? toggleSelected(solve) : openDetail(index)));

    if (selecting) {
      const check = document.createElement('span');
      check.className = 'solve-check';
      check.textContent = selected.has(solve) ? '✓' : '';
      row.setAttribute('aria-pressed', String(selected.has(solve)));
      row.prepend(check);
    }

    const number = document.createElement('span');
    number.className = 'solve-index';
    number.textContent = index + 1;

    const label = document.createElement('span');
    label.className = 'solve-time';
    label.textContent = formatSolve(solve);

    row.append(number, label);

    if (solve.penalty && solve.penalty !== 'none') {
      const tag = document.createElement('span');
      tag.className = 'solve-tag';
      tag.textContent = solve.penalty;
      row.append(tag);
    }

    if (solve.note) {
      const note = document.createElement('span');
      note.className = 'solve-note';
      note.textContent = solve.note;
      row.append(note);
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

/* ---------- insight line ---------- */

/** How many of the most recent solves stayed under the target, unbroken. */
function currentStreak() {
  let streak = 0;
  for (let index = solves.length - 1; index >= 0; index--) {
    const value = effective(solves[index]);
    if (!Number.isFinite(value) || value > settings.targetMs) break;
    streak++;
  }
  return streak;
}

/**
 * Given the last four solves, the slowest fifth that still keeps the ao5 under
 * `goal`. Only the middle two of the four matter: the trimmed mean drops the
 * fastest and the slowest of the five whatever the new time turns out to be.
 */
function ao5Ceiling(goal) {
  if (solves.length < 4) return null;
  const window = solves.slice(-4).map(effective).sort((a, b) => a - b);
  const [, second, third, fourth] = window;
  if (![second, third, fourth].every(Number.isFinite)) return null;

  if ((second + third + fourth) / 3 <= goal) return Infinity; // any time works
  const ceiling = 3 * goal - second - third;
  return ceiling > 0 ? ceiling : null;
}

function renderInsight() {
  const parts = [];

  if (settings.targetOn) {
    const streak = currentStreak();
    if (streak >= 2) parts.push(`${streak} op rij onder ${formatTime(settings.targetMs)}`);
  }

  const goal = settings.targetOn ? settings.targetMs : bestAverageOf(solves, 5);
  if (goal) {
    const ceiling = ao5Ceiling(goal);
    if (ceiling === Infinity) parts.push(`ao5 onder ${formatTime(goal)} is zeker`);
    else if (ceiling) parts.push(`ao5 onder ${formatTime(goal)}: deze mag max ${formatTime(ceiling)}`);
  }

  el.insight.textContent = parts.join('  ·  ');
  el.insight.hidden = parts.length === 0;
}

/* ---------- puzzles ---------- */

function renderPuzzles() {
  el.puzzles.innerHTML = '';
  const current = currentSession().puzzle;
  for (const puzzle of PUZZLES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'puzzle';
    button.textContent = puzzle.name;
    button.dataset.active = String(puzzle.id === current);
    button.addEventListener('click', () => usePuzzle(puzzle.id));
    el.puzzles.append(button);
  }
}

/** Switching puzzle moves to that puzzle's session, creating one if needed. */
function usePuzzle(id) {
  if (currentSession().puzzle === id) return;
  warmUp(id);

  let index = saveFile.sessions.findIndex((session) => session.puzzle === id);
  if (index < 0) {
    saveFile.sessions.push({ name: puzzleById(id).name, puzzle: id, solves: [] });
    index = saveFile.sessions.length - 1;
  }
  useSession(index);
  newScramble();
}

/**
 * Ask for the next official scramble. One is always queued up, so this normally
 * resolves at once; while it does not, the previous scramble stays on screen.
 */
async function newScramble() {
  const puzzle = currentSession().puzzle;
  const token = ++scrambleToken;
  el.scramble.dataset.loading = 'true';

  const { text, official } = await nextScramble(puzzle);
  if (token !== scrambleToken) return; // a newer request already won

  scramble = text;
  delete el.scramble.dataset.loading;
  el.scramble.dataset.official = String(official);
  el.scramble.title = official
    ? 'Officiële random-state scramble · klik om te kopiëren'
    : 'Reservescramble: de officiële scrambler kon niet laden · klik om te kopiëren';
  renderScramble();
}

/* ---------- sessions ---------- */

function currentSession() {
  return saveFile.sessions[saveFile.active];
}

function renderSessions() {
  el.sessionSelect.innerHTML = '';
  saveFile.sessions.forEach((session, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    const puzzle = puzzleById(session.puzzle).name;
    const label = session.name === puzzle ? session.name : `${session.name} · ${puzzle}`;
    option.textContent = `${label} (${session.solves.length})`;
    option.selected = index === saveFile.active;
    el.sessionSelect.append(option);
  });
}

function useSession(index) {
  saveFile.active = index;
  solves = currentSession().solves;
  penaltyStep = 0;
  selecting = false;
  selected.clear();
  disarmDelete();
  persist();
  render();
}

el.sessionSelect.addEventListener('change', () => {
  useSession(Number(el.sessionSelect.value));
  newScramble();
});

el.sessionManage.addEventListener('click', () => {
  el.sessionManage.blur();
  el.sessionName.value = currentSession().name;
  el.sessionSummary.textContent = `${solves.length} tijden · ${saveFile.sessions.length} sessies in totaal`;
  el.sessionDelete.disabled = saveFile.sessions.length < 2;
  el.sessionSheet.showModal();
  el.sessionSheet.focus();
});

el.sessionName.addEventListener('input', () => {
  const name = el.sessionName.value.trim().slice(0, 40);
  currentSession().name = name || `Sessie ${saveFile.active + 1}`;
  persist();
  renderSessions();
});

el.sessionNew.addEventListener('click', () => {
  saveFile.sessions.push({
    name: `Sessie ${saveFile.sessions.length + 1}`,
    puzzle: currentSession().puzzle,
    solves: []
  });
  useSession(saveFile.sessions.length - 1);
  el.sessionSheet.close();
  toast('Nieuwe sessie gestart.');
});

el.sessionDelete.addEventListener('click', () => {
  if (saveFile.sessions.length < 2) return;
  if (!confirm(`"${currentSession().name}" verwijderen met alle tijden erin?`)) return;
  const name = currentSession().name;
  saveFile.sessions.splice(saveFile.active, 1);
  useSession(Math.max(0, saveFile.active - 1));
  el.sessionSheet.close();
  toast(`${name} verwijderd.`);
});

/* ---------- all statistics ---------- */

function statRows() {
  const dnfs = solves.filter((solve) => solve.penalty === 'DNF').length;
  const plusTwos = solves.filter((solve) => solve.penalty === '+2').length;
  const rows = [
    ['Solves', String(solves.length)],
    ['Beste', formatTime(best(solves))],
    ['Slechtste', formatTime(worst(solves))],
    ['Mean', formatTime(sessionMean(solves))],
    ['Mo3', formatTime(meanOf(solves, 3))],
    ['Beste mo3', formatTime(bestMeanOf(solves, 3))],
    ['Ao5', formatTime(averageOf(solves, 5))],
    ['Beste ao5', formatTime(bestAverageOf(solves, 5))],
    ['Ao12', formatTime(averageOf(solves, 12))],
    ['Beste ao12', formatTime(bestAverageOf(solves, 12))],
    ['Ao50', formatTime(averageOf(solves, 50))],
    ['Beste ao50', formatTime(bestAverageOf(solves, 50))],
    ['Ao100', formatTime(averageOf(solves, 100))],
    ['+2', String(plusTwos)],
    ['DNF', String(dnfs)]
  ];

  if (settings.targetOn) {
    const under = solves.filter((solve) => {
      const value = effective(solve);
      return Number.isFinite(value) && value <= settings.targetMs;
    }).length;
    const share = solves.length ? Math.round((under / solves.length) * 100) : 0;
    rows.push([`Onder ${formatTime(settings.targetMs)}`, `${under} van ${solves.length} (${share}%)`]);
  }
  return rows;
}

el.statsButton.addEventListener('click', () => {
  el.statsButton.blur();
  el.statsTitle.textContent = currentSession().name;
  el.statsList.innerHTML = '';
  for (const [label, value] of statRows()) {
    const term = document.createElement('dt');
    term.textContent = label;
    const definition = document.createElement('dd');
    definition.textContent = value;
    el.statsList.append(term, definition);
  }
  el.statsSheet.showModal();
  el.statsSheet.focus();
});

/* ---------- selecting several solves ---------- */

function renderSelection() {
  el.selectionBar.hidden = !selecting;
  el.body.toggleAttribute('data-selecting', selecting);
  el.selectMode.textContent = selecting ? 'stop selectie' : 'selecteer';
  el.selectionCount.textContent = `${selected.size} gekozen`;

  const none = selected.size === 0;
  for (const button of [el.selectionPlus2, el.selectionDnf, el.selectionDelete]) {
    button.disabled = none;
    button.style.opacity = none ? '.4' : '1';
  }
  el.selectAll.textContent = selected.size === solves.length && solves.length ? 'geen' : 'alles';
}

function toggleSelected(solve) {
  if (selected.has(solve)) selected.delete(solve);
  else selected.add(solve);
  renderSolves();
  renderSelection();
}

function setSelecting(on) {
  selecting = on;
  selected.clear();
  renderSolves();
  renderSelection();
}

el.selectMode.addEventListener('click', () => {
  el.selectMode.blur();
  setSelecting(!selecting);
});

el.selectDone.addEventListener('click', () => setSelecting(false));

el.selectAll.addEventListener('click', () => {
  if (selected.size === solves.length) selected.clear();
  else solves.forEach((solve) => selected.add(solve));
  renderSolves();
  renderSelection();
});

/** Apply a penalty to everything ticked; a second press lifts it again. */
function penaliseSelection(penalty) {
  if (!selected.size) return;
  const allSet = [...selected].every((solve) => solve.penalty === penalty);
  for (const solve of selected) solve.penalty = allSet ? 'none' : penalty;
  persist();
  renderSolves();
  render();
  renderSelection();
  toast(allSet ? `${selected.size} tijden weer gewoon.` : `${penalty} op ${selected.size} tijden.`);
}

el.selectionPlus2.addEventListener('click', () => penaliseSelection('+2'));
el.selectionDnf.addEventListener('click', () => penaliseSelection('DNF'));

el.selectionDelete.addEventListener('click', () => {
  const count = selected.size;
  if (!count) return;
  if (!confirm(count === 1 ? 'Deze tijd verwijderen?' : `${count} tijden verwijderen?`)) return;

  const doomed = new Set(selected);
  for (let index = solves.length - 1; index >= 0; index--) {
    if (doomed.has(solves[index])) solves.splice(index, 1);
  }
  selected.clear();
  penaltyStep = 0;
  persist();
  render();
  renderSelection();
  toast(count === 1 ? 'Tijd verwijderd.' : `${count} tijden verwijderd.`);
});

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
  el.detailNote.value = solve.note || '';
  el.detailPlus2.dataset.active = String(solve.penalty === '+2');
  el.detailDnf.dataset.active = String(solve.penalty === 'DNF');
}

function openDetail(index) {
  detailIndex = index;
  fillDetail();
  el.detail.showModal();
  el.detail.focus(); // otherwise the close button opens with a focus ring on it
}

el.detailNote.addEventListener('input', () => {
  const solve = solves[detailIndex];
  if (!solve) return;
  const note = el.detailNote.value.trim().slice(0, 80);
  if (note) solve.note = note;
  else delete solve.note;
  persist();
  renderSolves();
});

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
  renderSelection();
  renderSessions();
  renderPuzzles();
  renderInsight();
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
  if (save(saveFile) || storageWarned) return;
  storageWarned = true;
  toast('Deze browser bewaart niets (privémodus?). Je tijden blijven staan tot je de pagina herlaadt.');
}

function addSolve(ms) {
  const previousBest = best(solves);
  penaltyStep = 0;
  solves.push({ ms, penalty: pendingPenalty, scramble, at: Date.now() });
  pendingPenalty = 'none';
  persist();
  newScramble();
  render();

  judgeSolve(previousBest);
}

/**
 * A record throws a full party, staying under the target gets confetti, and
 * going over it gets a short red pulse instead.
 */
function judgeSolve(previousBest) {
  const record = best(solves);
  const isRecord = solves.length > 1 && previousBest !== null
    && record !== null && record < previousBest;

  if (isRecord) {
    cue('record');
    if (settings.celebrate) confetti('party');
    toast(`Persoonlijk record — ${formatTime(record)}`);
    return;
  }

  if (!settings.targetOn) return;
  const value = effective(solves[solves.length - 1]);
  if (!Number.isFinite(value)) return;

  if (value <= settings.targetMs) {
    cue('target');
    if (settings.celebrate) confetti('burst');
  } else {
    cue('miss');
    if (settings.celebrate) flashMiss();
  }
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
 * Every double tap takes the last solve one step further: +2, then DNF, then
 * the question to wipe it, then back to plain. The step resets as soon as a new
 * solve comes in, so a double tap always speaks about the time you just did.
 */
function advancePenalty() {
  if (!solves.length) {
    toast('Nog geen tijd om aan te passen.');
    return;
  }

  penaltyStep = (penaltyStep + 1) % 4;
  const solve = solves[solves.length - 1];

  if (penaltyStep === 3) { // ask before wiping
    armDelete();
    return;
  }

  disarmDelete();
  solve.penalty = penaltyStep === 1 ? '+2' : penaltyStep === 2 ? 'DNF' : 'none';
  persist();
  render();

  el.time.textContent = formatSolve(solve);
  cue(penaltyStep === 0 ? 'target' : 'miss');
  toast(penaltyStep === 1 ? `+2 · nu ${formatSolve(solve)}`
    : penaltyStep === 2 ? 'DNF'
    : `Weer gewoon ${formatSolve(solve)}`);
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
  armedByCurrentTouch = false;
  clearTimeout(deleteTimer);
  delete el.body.dataset.confirm;
  setHint(currentHint());
  showTime(0);
}

/** Confirmed: drop the most recent time. */
function removeLastSolve() {
  deleteArmed = false;
  armedByCurrentTouch = false;
  penaltyStep = 0;
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

const ARC = 2 * Math.PI * 47; // the progress circle has r=47

function setArc(fraction) {
  el.progress.style.strokeDasharray = String(ARC);
  el.progress.style.strokeDashoffset = String(ARC * (1 - Math.max(0, Math.min(1, fraction))));
}

function inspectionTick() {
  const elapsed = performance.now() - inspectionStartedAt;
  const remaining = INSPECTION_MS - elapsed;
  setArc(remaining / INSPECTION_MS);

  if (elapsed >= 8000 && inspectionCalls < 1) { inspectionCalls = 1; cue('warn8'); }
  if (elapsed >= 12000 && inspectionCalls < 2) { inspectionCalls = 2; cue('warn12'); }

  if (remaining > 0) el.time.textContent = String(Math.ceil(remaining / 1000));
  else if (elapsed < PLUS_TWO_MS) el.time.textContent = '+2';
  else el.time.textContent = 'DNF';

  el.body.dataset.inspection = remaining > 0 ? 'ok' : 'over';
  inspectionFrame = requestAnimationFrame(inspectionTick);
}

function startInspection() {
  if (!settings.inspection) return;
  inspectionStartedAt = performance.now();
  inspectionCalls = 0;
  pendingPenalty = 'none';
  setPhase('inspecting');
  cancelAnimationFrame(inspectionFrame);
  inspectionTick();
}

function stopInspection() {
  cancelAnimationFrame(inspectionFrame);
  inspectionFrame = null;
  setArc(0);
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

  cue('start');
  cancelAnimationFrame(runningFrame);
  if (settings.hideTime) {
    el.time.textContent = DOTS;
  } else {
    runningTick();
  }
}

function countUpTo(target) {
  const startedCounting = performance.now();
  const duration = 420;

  const step = () => {
    const progress = Math.min(1, (performance.now() - startedCounting) / duration);
    const eased = 1 - (1 - progress) ** 3;
    showTime(target * eased);
    if (progress < 1) runningFrame = requestAnimationFrame(step);
    else showTime(target);
  };
  step();
}

function stopRunning(ms) {
  cue('stop');
  cancelAnimationFrame(runningFrame);
  runningFrame = null;
  const elapsed = ms ?? performance.now() - startedAt;
  setPhase('idle');

  if (settings.countUp && elapsed > 500) countUpTo(elapsed);
  else showTime(elapsed);

  addSolve(Math.round(elapsed));
}

function beginHold() {
  if (phase !== 'idle' && phase !== 'inspecting') return;

  // Pressing down starts inspection right away; no waiting for the release.
  inspectionJustStarted = false;
  if (settings.inspection && inspectionStartedAt === null && !deleteArmed) {
    startInspection();
    inspectionJustStarted = true;
  }

  setPhase('holding');
  if (inspectionStartedAt === null) showTime(0);
  clearTimeout(holdTimer);
  holdTimer = setTimeout(() => {
    if (phase !== 'holding') return;
    setPhase('ready');
    cue('ready');
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
  } else if (deleteArmed && phase === 'holding') {
    removeLastSolve(); // the confirming tap
    setPhase('idle');
  } else if (phase === 'holding') {
    // A tap that started inspection keeps it; tapping again calls it off.
    if (inspectionJustStarted) setPhase('inspecting');
    else cancelInspection();
  }
}

/* ---------- manual input ---------- */

function manualTimingAllowed(target) {
  if (device) return false; // the GAN timer is the source of truth while connected
  if (document.querySelector('dialog[open]')) return false;
  return !target?.closest?.('button, a, input');
}

/** Single-key shortcuts, ignored while typing or with a sheet open. */
document.addEventListener('keydown', (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.target?.closest?.('input, textarea, select')) return;
  if (document.querySelector('dialog[open]')) return;
  if (phase !== 'idle') return;

  const key = event.key.toLowerCase();
  if (key === 'n') { newScramble(); toast('Nieuwe scramble.'); }
  else if (key === 'c') el.scramble.click();
  else if (key === 'd') { if (solves.length) armDelete(); }
  else if (key === 'i') el.settingsOpen.click();
  else if (key === 'f') {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (selecting) setSelecting(false);
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
  clearTimeout(confirmTimer);
  confirmTimer = null;
}

/**
 * HANDS_ON: hands land on the mat. Everything happens here so there is no wait
 * at all — inspection starts on contact. A second touch inside the window turns
 * that first action into "wipe the last time" instead.
 */
function onHandsOn() {
  if (phase === 'running') return;
  if (performance.now() - connectedAt < CONNECT_GRACE_MS) return;

  if (pendingTap) { // second touch: the first action was not what was meant
    clearPendingTap();
    cancelInspection();
    advancePenalty();
    armedByCurrentTouch = true; // lifting off again may not answer the question
    setPhase('holding');
    return;
  }
  pendingTap = setTimeout(() => { pendingTap = null; }, TAP_WINDOW_MS);

  // A pending delete waits for the hands to come off again: holding on into a
  // solve must never wipe a time.
  if (!deleteArmed && inspectionStartedAt === null) startInspection();

  setPhase('holding');
  if (inspectionStartedAt === null && !deleteArmed) showTime(0);
}

/** HANDS_OFF: hands lifted before the timer armed — this touch was a tap. */
function onHandsOff() {
  if (phase === 'running') return;

  if (armedByCurrentTouch) {
    armedByCurrentTouch = false; // this touch only raised the question
    setPhase('idle');
    return;
  }

  if (deleteArmed) {
    // Hold the answer for a moment: a second tap right after means "carry on
    // along the chain" rather than "yes, wipe it".
    setPhase('idle');
    clearTimeout(confirmTimer);
    confirmTimer = setTimeout(() => {
      confirmTimer = null;
      if (deleteArmed) removeLastSolve();
    }, TAP_WINDOW_MS);
    return;
  }

  setPhase(inspectionStartedAt === null ? 'idle' : 'inspecting');
  if (inspectionStartedAt === null) showTime(0);
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
  el.connect.textContent = 'Verbind timer';
  el.deviceStatus.hidden = true;
  setHint(currentHint());
  el.deviceNote.textContent = 'Nog geen timer verbonden.';
  el.deviceDetails.hidden = true;
  el.importTimes.hidden = true;
  showManualPick(true);
  toast('Timer losgekoppeld.');
}

/** Squeeze a name and a description out of whatever was thrown. */
function describeError(error) {
  if (error && typeof error === 'object') {
    const name = error.name || error.constructor?.name || '';
    const message = error.message || (String(error) === '[object Object]' ? '' : String(error));
    return { name, message };
  }
  return { name: '', message: error === undefined ? '' : String(error) };
}

/**
 * Say what actually went wrong instead of a blanket "mislukt". Whatever the
 * browser handed over is kept on the end, because that is what makes a report
 * useful — and the full object goes to the console as well.
 */
function explainBluetoothError(error) {
  console.error('Verbinden mislukt:', error);
  const { name, message } = describeError(error);
  const detail = message ? ` (${message})` : '';

  if (name === 'NotAllowedError') {
    return `Geen toestemming voor bluetooth. Sta het toe in je browser en probeer opnieuw${detail}`;
  }
  if (name === 'NetworkError') {
    return `Verbinden lukte niet. Staat de timer aan, en is hij niet al verbonden met een andere app of telefoon?${detail}`;
  }
  if (name === 'SecurityError') {
    return `De browser blokkeert deze verbinding. Werkt de pagina wel via https?${detail}`;
  }
  if (name === 'NotSupportedError') {
    return `Deze browser kan niet met de timer praten${detail}`;
  }
  // Our own throws carry a full sentence; a bare "Error" says nothing.
  if (name === 'Error' && message && message !== 'Error') return message;

  // Nothing usable came back. Name the usual causes rather than a bare "mislukt".
  const kind = name || (error === undefined ? 'geen foutobject' : typeof error);
  const raw = message ? `${kind}: ${message}` : kind;
  return `Verbinden mislukt. Zet de timer even uit en weer aan, en koppel hem los van andere apparaten of apps. [${raw}]`;
}

/**
 * Work out what to say. The browser is asked afterwards whether it has
 * bluetooth at all, because asking beforehand would eat into the click that has
 * to carry the request. The text also stays in the settings panel, since a
 * toast is gone before anyone can write it down.
 */
async function reportConnectionFailure(error) {
  const available = await bluetoothAvailable();
  const { name, message } = describeError(error);

  let text;
  if (available === false) {
    text = 'Dit apparaat heeft geen bluetooth, of de browser mag er niet bij. '
      + 'Op iPhone staat dat bij Instellingen → de browser → Bluetooth, op een Mac onder '
      + 'Systeeminstellingen → Privacy → Bluetooth, op Windows bij Instellingen → Privacy.';
  } else {
    text = explainBluetoothError(error);
  }

  toast(text);
  el.deviceNote.textContent = `Laatste poging mislukt — ${text} [${name || 'geen naam'}${message ? `: ${message}` : ''}]`;
  el.importTimes.hidden = true;
}

/** The unfiltered chooser is only worth offering while nothing is connected. */
function showManualPick(show) {
  el.connectAny.hidden = !show;
  el.connectAnyNote.hidden = !show;
}

/** Whatever the connection came from, wire it up the same way. */
function adoptDevice(connection) {
  device = connection;
  connectedAt = performance.now();
  clearPendingTap();
  el.connect.textContent = 'Loskoppelen';
  el.deviceStatus.textContent = device.name;
  el.deviceStatus.hidden = false;
  setHint(currentHint());
  showManualPick(false);
  showDeviceDetails();
  offerTimerTimes();
}

/**
 * @param {boolean} anyDevice list every bluetooth device instead of filtering,
 * for when the filtered list came up empty.
 */
async function connect(anyDevice) {
  el.connect.blur();

  if (device) {
    await device.disconnect();
    return;
  }
  if (!isSupported()) {
    toast('Deze browser kan niet met bluetooth praten. Op de computer of Android werkt Chrome of Edge, op iPhone een browser als Bluefy.');
    return;
  }

  el.connect.disabled = true;
  el.connect.textContent = 'Verbinden…';
  try {
    adoptDevice(await connectGanTimer({ onEvent: onDeviceEvent, onDisconnect: onDeviceDisconnect, anyDevice }));
    toast(`Verbonden met ${device.name}.`);
  } catch (error) {
    device = null;
    el.connect.textContent = 'Verbind timer';
    const closedByUser = error?.name === 'NotFoundError' && /cancel|chooser/i.test(error.message || '');
    // A chooser with nothing in it and a chooser someone closed look exactly
    // the same from here, so say what to check either way.
    if (closedByUser) toast('Geen timer gekozen. Stond er niets in de lijst? Zet de timer aan en koppel hem los van andere apps of telefoons.');
    else await reportConnectionFailure(error);
  } finally {
    el.connect.disabled = false;
  }
}

el.connect.addEventListener('click', () => connect(false));
el.connectAny.addEventListener('click', () => connect(true));

/* ---------- screen wake lock ---------- */

let wakeSentinel = null;

async function keepAwake() {
  if (!settings.wakeLock || !navigator.wakeLock || wakeSentinel) return;
  try {
    wakeSentinel = await navigator.wakeLock.request('screen');
    wakeSentinel.addEventListener('release', () => { wakeSentinel = null; });
  } catch {
    wakeSentinel = null; // denied or unsupported; nothing else to do
  }
}

function letSleep() {
  wakeSentinel?.release?.().catch(() => {});
  wakeSentinel = null;
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') keepAwake();
});

/* ---------- settings ---------- */

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme() {
  const dark = settings.theme === 'dark' || (settings.theme === 'auto' && darkQuery.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', dark ? 'dark' : 'light');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b1a22' : '#bfe3f5');
}

darkQuery.addEventListener('change', () => {
  if (settings.theme === 'auto') applyTheme();
});

function applySettings() {
  applyTheme();
  for (const { key } of COLOR_SLOTS) {
    document.documentElement.style.setProperty(`--${key}`, settings.colors[key]);
  }
  if (settings.wakeLock) keepAwake();
  else letSleep();
  setDecimals(settings.decimals);
  if (!settings.inspection) cancelInspection();
  renderScramble();
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

function buildColorSlots() {
  el.colorSlots.innerHTML = '';
  for (const { key, label } of COLOR_SLOTS) {
    const row = document.createElement('label');
    row.className = 'color-slot';

    const name = document.createElement('span');
    name.textContent = label;

    const input = document.createElement('input');
    input.type = 'color';
    input.value = settings.colors[key];
    input.addEventListener('input', () => {
      settings.colors[key] = input.value;
      storeSettings();
      applySettings();
      markGroup(el.ledColors, settings.led);
    });

    row.append(name, input);
    el.colorSlots.append(row);
  }
}

function syncColorSlots() {
  el.colorSlots.querySelectorAll('input').forEach((input, index) => {
    input.value = settings.colors[COLOR_SLOTS[index].key];
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
      settings.colors.led = color;
      storeSettings();
      applySettings();
      syncColorSlots();
      markGroup(el.ledColors, id);
    });
    el.ledColors.append(button);
  });
  markGroup(el.ledColors, settings.led);
}

/** Binds a switch element to a boolean setting. */
function bindSwitch(id, key) {
  const control = document.getElementById(id);
  control.addEventListener('click', () => {
    settings[key] = !settings[key];
    control.setAttribute('aria-checked', String(settings[key]));
    storeSettings();
    applySettings();
  });
  return { control, key };
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
  theme: bindGroup('set-theme', (v) => { settings.theme = v; }),
  decimals: bindGroup('set-decimals', (v) => { settings.decimals = Number(v); }),
  hold: bindGroup('set-hold', (v) => { settings.holdMs = Number(v); })
};

const switches = [
  bindSwitch('set-target', 'targetOn'),
  bindSwitch('set-preview', 'preview'),
  bindSwitch('set-countUp', 'countUp'),
  bindSwitch('set-wakeLock', 'wakeLock'),
  bindSwitch('set-inspection', 'inspection'),
  bindSwitch('set-hide', 'hideTime'),
  bindSwitch('set-sound', 'sound'),
  bindSwitch('set-haptics', 'haptics'),
  bindSwitch('set-celebrate', 'celebrate'),
  bindSwitch('set-highlight', 'highlight')
];

function syncSettingsUi() {
  el.targetValue.value = (settings.targetMs / 1000).toFixed(2).replace(/\.?0+$/, '');
  markGroup(groups.theme, settings.theme);
  markGroup(groups.decimals, settings.decimals);
  markGroup(groups.hold, settings.holdMs);
  markGroup(el.ledColors, settings.led);
  syncColorSlots();
  for (const { control, key } of switches) control.setAttribute('aria-checked', String(settings[key]));
}

el.targetValue.addEventListener('change', () => {
  const seconds = Number(el.targetValue.value);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    el.targetValue.value = (settings.targetMs / 1000).toFixed(2).replace(/\.?0+$/, '');
    return;
  }
  settings.targetMs = Math.min(Math.max(Math.round(seconds * 1000), 1000), 600000);
  storeSettings();
  applySettings();
});

/** Session as plain text, one solve per line, ready to paste anywhere. */
function sessionAsText() {
  const header = `${currentSession().name} — ${solves.length} tijden`;
  const lines = solves.map((solve, index) =>
    `${index + 1}. ${formatSolve(solve)}   ${solve.scramble || ''}`.trimEnd());
  return [header, ...lines].join('\n');
}

el.export.addEventListener('click', async () => {
  el.export.blur();
  if (!solves.length) {
    toast('Nog geen tijden om te kopiëren.');
    return;
  }
  try {
    await navigator.clipboard.writeText(sessionAsText());
    toast(`${solves.length} tijden gekopieerd.`);
  } catch {
    toast('Kopiëren lukte niet in deze browser.');
  }
});

/**
 * Lists what the connected timer actually exposes over bluetooth. The lighting
 * of the timer is configured through GAN's own app over a protocol that is not
 * public, so this is read-only information.
 */
/**
 * The timer remembers its last four times. Anything in there that is not in the
 * session — a solve done while this page was closed — is offered on connecting.
 */
const IGNORED_KEY = 'cubetimer.ignored.v1';
let offeredTimes = [];

function ignoredTimes() {
  try {
    const raw = JSON.parse(localStorage.getItem(IGNORED_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function ignoreTimes(times) {
  try {
    const merged = [...new Set([...ignoredTimes(), ...times])].slice(-40);
    localStorage.setItem(IGNORED_KEY, JSON.stringify(merged));
  } catch {
    // storage unavailable; the question may come back next time
  }
}

/** Is this exact time already somewhere in the session? */
function alreadyRecorded(ms) {
  return solves.some((solve) => solve.ms === ms);
}

/**
 * Times on the device that this session does not have yet, newest first.
 * The four slots can hold the same time more than once — the display time is
 * usually also the most recent previous one — so the batch is deduplicated too.
 */
async function unknownTimerTimes() {
  if (!device) return { times: [], slots: 0, skipped: 0 };
  try {
    const stored = await device.getRecordedTimes();
    const skip = new Set(ignoredTimes());
    const seen = new Set();

    const times = stored.filter((ms) => {
      if (ms <= 0 || skip.has(ms) || seen.has(ms) || alreadyRecorded(ms)) return false;
      seen.add(ms);
      return true;
    });

    const filled = stored.filter((ms) => ms > 0).length;
    return { times, slots: stored.length, skipped: filled - times.length };
  } catch {
    return { times: [], slots: 0, skipped: 0 }; // the timer refused the read
  }
}

async function offerTimerTimes({ announce = false } = {}) {
  const { times, slots, skipped } = await unknownTimerTimes();
  el.importTimes.hidden = !device;
  if (!times.length) {
    if (announce) toast('Geen nieuwe tijden op je timer.');
    return;
  }

  offeredTimes = times;
  el.importTitle.textContent = times.length === 1 ? 'Nieuwe tijd gevonden' : 'Nieuwe tijden gevonden';
  el.importText.textContent = times.length === 1
    ? `Op je timer staat een tijd die hier nog niet bij staat. Wil je hem erbij zetten in "${currentSession().name}"?`
    : `Op je timer staan ${times.length} tijden die hier nog niet bij staan. Wil je ze erbij zetten in "${currentSession().name}"?`;

  el.importNote.textContent = skipped > 0
    ? `Je timer geeft ${slots} plekken door; ${skipped === 1 ? 'één daarvan was' : `${skipped} daarvan waren`} dubbel of stond er al bij.`
    : `Alles wat je timer doorgeeft (${slots} plekken).`;

  el.importList.innerHTML = '';
  times.forEach((ms, index) => {
    const item = document.createElement('li');
    const value = document.createElement('strong');
    value.textContent = formatTime(ms);
    const label = document.createElement('span');
    label.textContent = index === 0 ? 'op het display' : `${index} terug`;
    item.append(value, label);
    el.importList.append(item);
  });

  el.importSheet.showModal();
  el.importSheet.focus();
}

el.importYes.addEventListener('click', () => {
  // Check again at this moment: the session may have grown, or the same time
  // may sit in the batch twice.
  const added = [];
  for (const ms of [...offeredTimes].reverse()) { // oldest first, so the newest ends last
    if (alreadyRecorded(ms)) continue;
    solves.push({ ms, penalty: 'none', scramble: '', at: Date.now() });
    added.push(ms);
  }

  ignoreTimes(offeredTimes);
  persist();
  render();

  if (!added.length) toast('Die tijden stonden er al.');
  else toast(added.length === 1 ? 'Tijd toegevoegd.' : `${added.length} tijden toegevoegd.`);

  offeredTimes = [];
  el.importSheet.close();
});

el.importNo.addEventListener('click', () => {
  ignoreTimes(offeredTimes); // do not ask about these again
  offeredTimes = [];
  el.importSheet.close();
});

el.importTimes.addEventListener('click', () => {
  el.importTimes.blur();
  offerTimerTimes({ announce: true });
});

async function showDeviceDetails() {
  if (!device) return;
  const battery = await device.getBattery();
  el.deviceNote.textContent = battery === null
    ? `${device.name} — verbonden.`
    : `${device.name} — verbonden, batterij ${battery}%.`;
  el.importTimes.hidden = false;
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
  el.settings.focus();
});

/* ---------- controls ---------- */

el.newScramble.addEventListener('click', () => {
  el.newScramble.blur();
  newScramble();
});

/** Click the scramble to put it on the clipboard. */
el.scramble.addEventListener('click', async () => {
  el.scramble.blur();
  try {
    await navigator.clipboard.writeText(scramble);
    toast('Scramble gekopieerd.');
  } catch {
    toast('Kopiëren lukte niet in deze browser.');
  }
});

el.clear.addEventListener('click', () => {
  el.clear.blur();
  if (!solves.length) return;
  if (!confirm('Alle tijden van deze sessie wissen?')) return;
  solves.length = 0;
  persist();
  render();
});

/* ---------- init ---------- */

if (!isSupported()) {
  el.connect.title = 'Web Bluetooth is niet beschikbaar in deze browser';
}

buildLedSwatches();
buildColorSlots();
syncSettingsUi();
applyLayout();

setPhase('idle');
renderScramble();
applySettings();
newScramble(); // replaces the stand-in with an official one as soon as it is ready // sets the ring colour, decimals, hint and renders the session
