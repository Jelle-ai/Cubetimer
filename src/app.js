import { PUZZLES, nextScramble, puzzleById, randomMoveScramble, warmUp } from './scramble.js';
import { bluetoothAvailable, connectGanTimer, isSupported, TimerState } from './gan-timer.js';
import {
  averageOf, best, bestAverageAt, bestAverageOf, bestMeanAt, bestMeanOf, effective,
  formatSolve, formatTime, meanOf, sessionMean, setDecimals, worst
} from './stats.js';
import { load, save } from './store.js';
import { COLOR_SLOTS, LED_COLORS, colorOf, loadSettings, saveSettings } from './settings.js';
import { chord, confetti, flashMiss, tone, vibrate } from './feedback.js';
import { hasPreview, previewOf } from './preview.js';
import { CERTAIN, coarse, foundPath, inspectFrame, openCamera, reference } from './vision.js';
import {
  dayName, formatDuration, meetsGoal, practiceByDay, progress, streaks, today
} from './practice.js';

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
  targetNote: document.getElementById('target-note'),
  targetValue: document.getElementById('set-target-value'),
  export: document.getElementById('export'),
  exportFormat: document.getElementById('export-format'),
  pasteOpen: document.getElementById('paste-open'),
  pasteSheet: document.getElementById('paste-sheet'),
  pasteInput: document.getElementById('paste-input'),
  pasteNote: document.getElementById('paste-note'),
  pasteAdd: document.getElementById('paste-add'),
  pasteClose: document.getElementById('paste-close'),
  statsCompare: document.getElementById('stats-compare'),
  pickedSheet: document.getElementById('picked-sheet'),
  pickedTitle: document.getElementById('picked-title'),
  pickedNote: document.getElementById('picked-note'),
  pickedList: document.getElementById('picked-list'),
  pickedClose: document.getElementById('picked-close'),
  cameraPeek: document.getElementById('camera-peek'),
  peekVideo: document.getElementById('peek-video'),
  peekOutline: document.getElementById('peek-outline'),
  practice: document.getElementById('practice'),
  practiceFlame: document.getElementById('practice-flame'),
  practiceRun: document.getElementById('practice-run'),
  practiceToday: document.getElementById('practice-today'),
  practiceGoal: document.getElementById('practice-goal'),
  practiceFill: document.getElementById('practice-fill'),
  practiceSheet: document.getElementById('practice-sheet'),
  practiceClose: document.getElementById('practice-close'),
  practiceStreak: document.getElementById('practice-streak'),
  practiceLongest: document.getElementById('practice-longest'),
  practiceSumToday: document.getElementById('practice-sum-today'),
  practiceSumAll: document.getElementById('practice-sum-all'),
  practiceNote: document.getElementById('practice-note'),
  practiceDays: document.getElementById('practice-days'),
  goalNote: document.getElementById('goal-note'),
  goalValue: document.getElementById('set-goal-value'),
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
  shell: document.getElementById('shell'),
  panel: document.getElementById('panel'),
  solvesSheet: document.getElementById('solves-sheet'),
  solvesSlot: document.getElementById('solves-slot'),
  solvesOpen: document.getElementById('solves-open'),
  solvesClose: document.getElementById('solves-close'),
  solvesSheetTitle: document.getElementById('solves-sheet-title'),
  quickSheet: document.getElementById('quick-sheet'),
  quickTitle: document.getElementById('quick-title'),
  quickMeta: document.getElementById('quick-meta'),
  quickPlus2: document.getElementById('quick-plus2'),
  quickDnf: document.getElementById('quick-dnf'),
  quickDetail: document.getElementById('quick-detail'),
  quickRemove: document.getElementById('quick-remove'),
  quickClose: document.getElementById('quick-close'),
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

// The goal time used to be one number for every session. Sessions that predate
// it being their own inherit whatever was set globally, once.
if (settings.targetOn === true && Number.isFinite(settings.targetMs)) {
  let carried = false;
  for (const session of saveFile.sessions) {
    if (session.target === null) { session.target = settings.targetMs; carried = true; }
  }
  if (carried) save(saveFile);
  delete settings.targetOn;
  delete settings.targetMs;
  saveSettings(settings);
}
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
      ? 'Kort aanraken: 1× inspectie · 2× de laatste tijd wissen · vasthouden om te starten'
      : 'Kort aanraken: 2× de laatste tijd wissen · vasthouden om te starten';
  }
  const key = isTouch ? 'Tik' : 'Tik <kbd>spatie</kbd>';
  if (!settings.inspection) return 'Vasthouden en loslaten om te starten';
  return narrow.matches
    ? `${key} voor inspectie · vasthouden om te starten`
    : `${key} voor inspectie · vasthouden en loslaten om te starten`;
}

/**
 * A phone screen is the scramble, the ring and the averages. The puzzle chips
 * and the list of times each move into a sheet of their own, one tap away in
 * the top bar. The same elements are moved across rather than copied, so there
 * is never a second version to keep in step -- which is why the card of
 * averages has to be lifted back out of the panel after the panel has gone in.
 */
function applyLayout() {
  const phone = narrow.matches;
  el.scrambleOpen.hidden = !phone;
  el.solvesOpen.hidden = !phone;
  el.body.dataset.compact = String(phone);

  if (phone) {
    el.scrambleSlot.append(el.puzzles);
    el.solvesSlot.append(el.panel);
    // out of the sheet and onto the screen, in the order they read in
    el.stage.insertBefore(el.statsButton, el.hint);
    el.stage.insertBefore(el.practice, el.hint);
  } else {
    el.stage.prepend(el.puzzles);      // back ahead of the scramble
    el.shell.append(el.panel);         // back beside the stage
    el.panel.prepend(el.practice);
    el.panel.prepend(el.statsButton);  // back at the head of it
    if (el.scrambleSheet.open) el.scrambleSheet.close();
    if (el.solvesSheet.open) el.solvesSheet.close();
  }

  renderScramble(); // the cube is drawn on a wide screen only
  if (!el.body.dataset.phase || el.body.dataset.phase === 'idle') setHint(currentHint());
}

// Turning the phone sideways changes which layout fits.
narrow.addEventListener('change', applyLayout);

el.scrambleOpen.addEventListener('click', () => el.scrambleSheet.showModal());
el.scrambleClose.addEventListener('click', () => el.scrambleSheet.close());

el.solvesOpen.addEventListener('click', () => {
  el.solvesSheetTitle.textContent = `Tijden - ${currentSession().name}`;
  el.solvesSheet.showModal();
});

el.solvesClose.addEventListener('click', () => el.solvesSheet.close());

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

let previewToken = 0;

function renderScramble() {
  el.scramble.textContent = scramble;
  // A megaminx scramble is seven lines and some seventy tokens; set at the size
  // a 3x3 scramble wants, it wraps to twelve lines and pushes the ring off the
  // screen. Long ones are set smaller and given a wider column.
  el.scramble.dataset.long = String(scramble.length > 110);

  // No picture on a phone: there the screen is the scramble, the ring and the
  // times. Drawing one means loading the puzzle library, so it is done off to
  // the side, and a token drops any picture that a newer scramble has overtaken.
  const puzzle = currentSession().puzzle;
  const wanted = settings.preview && !narrow.matches && hasPreview(puzzle);
  const token = ++previewToken;

  if (!wanted) {
    el.preview.replaceChildren();
    el.preview.hidden = true;
    return;
  }

  previewOf(scramble, puzzle).then((svg) => {
    if (token !== previewToken) return;
    el.preview.replaceChildren(...(svg ? [svg] : []));
    el.preview.hidden = !svg;
  });
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

const MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

/** Which day a solve belongs to, as a number that sorts and compares cleanly. */
function dayOf(solve) {
  if (!Number.isFinite(solve.at)) return null;
  const date = new Date(solve.at);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function dayLabel(day) {
  if (day === null) return 'zonder datum';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const days = Math.round((today - day) / 86400000);
  if (days === 0) return 'vandaag';
  if (days === 1) return 'gisteren';

  const date = new Date(day);
  const stamp = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return date.getFullYear() === now.getFullYear() ? stamp : `${stamp} ${date.getFullYear()}`;
}

function renderSolves() {
  el.solves.innerHTML = '';
  el.empty.hidden = solves.length > 0;

  const times = solves.map(effective).filter(Number.isFinite);
  const fastest = settings.highlight && times.length > 1 ? Math.min(...times) : null;
  const slowest = settings.highlight && times.length > 1 ? Math.max(...times) : null;

  // Walked newest first, which is the order it is read in, so a day heading can
  // be dropped in the moment the date changes.
  let openDay;
  for (let index = solves.length - 1; index >= 0; index--) {
    const solve = solves[index];
    const day = dayOf(solve);
    if (day !== openDay) {
      openDay = day;
      const heading = document.createElement('li');
      heading.className = 'day-head';
      heading.textContent = dayLabel(day);
      el.solves.append(heading);
    }

    const item = document.createElement('li');
    item.className = 'solve-row';

    // The whole row is one button that opens the details of that solve.
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'solve';
    if (solve.penalty === 'DNF') row.classList.add('is-dnf');

    const value = effective(solve);
    if (fastest !== null && value === fastest) row.classList.add('is-best');
    else if (slowest !== null && value === slowest) row.classList.add('is-worst');
    if (currentTarget() !== null && Number.isFinite(value) && value <= currentTarget()) {
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
    attachRowGestures(item, row, solve, index);
    el.solves.append(item);
  }
}

/* ---------- practice ---------- */

/** The goal as the practice module wants it, in its own units. */
const currentGoal = () => ({
  kind: settings.goalKind,
  ms: settings.goalMinutes * 60000,
  solves: settings.goalSolves
});

const goalText = () => settings.goalKind === 'solves'
  ? `${settings.goalSolves} solves`
  : `${settings.goalMinutes} minuten`;

/** The strip under the averages: today so far, and how long the run is. */
function renderPractice() {
  el.practice.hidden = !settings.practice;
  if (!settings.practice) return;

  const days = practiceByDay(saveFile.sessions);
  const goal = currentGoal();
  const now = days.get(today());
  const { current } = streaks(days, goal);

  el.practice.dataset.done = String(meetsGoal(now, goal));
  el.practiceFlame.textContent = current > 0 ? '\u{1f525}' : '\u{1f56f}\ufe0f';
  el.practiceRun.textContent = String(current);
  el.practiceToday.textContent = now
    ? `${formatDuration(now.ms)} · ${now.count} ${now.count === 1 ? 'solve' : 'solves'}`
    : 'nog niets vandaag';
  el.practiceGoal.textContent = goalText();
  el.practiceFill.style.width = `${Math.round(progress(now, goal) * 100)}%`;
}

function openPractice() {
  const days = practiceByDay(saveFile.sessions);
  const goal = currentGoal();
  const { current, longest } = streaks(days, goal);
  const all = [...days.values()].reduce((sum, day) => sum + day.ms, 0);

  el.practiceStreak.textContent = String(current);
  el.practiceLongest.textContent = String(longest);
  el.practiceSumToday.textContent = formatDuration(days.get(today())?.ms || 0);
  el.practiceSumAll.textContent = formatDuration(all);
  el.practiceNote.textContent = `Een dag telt mee vanaf ${goalText()}. `
    + 'De tijd is je solves bij elkaar opgeteld, niet hoe lang de app openstond.';

  el.practiceDays.innerHTML = '';
  const ordered = [...days.keys()].sort((a, b) => b - a).slice(0, 60);

  for (const day of ordered) {
    const entry = days.get(day);
    const item = document.createElement('li');
    item.className = 'practice-day';
    item.dataset.done = String(meetsGoal(entry, goal));

    const name = document.createElement('span');
    name.className = 'practice-day-name';
    name.textContent = dayName(day);

    const time = document.createElement('span');
    time.className = 'practice-day-time';
    time.textContent = formatDuration(entry.ms);

    const count = document.createElement('span');
    count.className = 'practice-day-count';
    count.textContent = `${entry.count}\u00d7`;

    item.append(name, time, count);
    el.practiceDays.append(item);
  }

  if (!ordered.length) {
    const empty = document.createElement('li');
    empty.className = 'practice-empty';
    empty.textContent = 'Nog geen dag met solves erin.';
    el.practiceDays.append(empty);
  }

  el.practiceSheet.showModal();
  el.practiceSheet.focus();
}

el.practice.addEventListener('click', () => {
  el.practice.blur();
  openPractice();
});

el.practiceClose.addEventListener('click', () => el.practiceSheet.close());

/* ---------- insight line ---------- */

/** How many of the most recent solves stayed under the target, unbroken. */
function currentStreak() {
  let streak = 0;
  for (let index = solves.length - 1; index >= 0; index--) {
    const value = effective(solves[index]);
    if (!Number.isFinite(value) || value > currentTarget()) break;
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

  if (currentTarget() !== null) {
    const streak = currentStreak();
    if (streak >= 2) parts.push(`${streak} op rij onder ${formatTime(currentTarget())}`);
  }

  const goal = currentTarget() ?? bestAverageOf(solves, 5);
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

/** This session's goal time in milliseconds, or null when it has none. */
const currentTarget = () => currentSession().target;

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
  syncTargetUi();
  solves = currentSession().solves;
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

/**
 * Everything measurable about a set of solves, grouped the way it is read:
 * the session at a glance, the averages with their records beside them, and
 * what went wrong. Grouping is not decoration -- a flat list of fifteen rows
 * makes you hunt for the one you want, and pairs an average with its record
 * only by their being adjacent.
 */
function statGroups(list = solves) {
  const solves = list; // every measure below reads this, and this one only
  const dnfs = solves.filter((solve) => solve.penalty === 'DNF').length;
  const plusTwos = solves.filter((solve) => solve.penalty === '+2').length;

  const all = solves.map((_, index) => index);
  const where = (test) => all.filter((index) => test(solves[index]));
  const extreme = (value) => {
    const index = all.find((i) => effective(solves[i]) === value);
    return index === undefined ? [] : [index];
  };
  const last = (n) => (solves.length >= n ? all.slice(-n) : []);
  const window = (at) => (at ? all.slice(at.start, at.end) : []);

  const wrong = [
    ['+2', String(plusTwos), where((s) => s.penalty === '+2')],
    ['DNF', String(dnfs), where((s) => s.penalty === 'DNF')]
  ];

  const target = currentTarget();
  if (target !== null && list === solves) {
    const under = where((s) => {
      const value = effective(s);
      return Number.isFinite(value) && value <= target;
    });
    const share = solves.length ? Math.round((under.length / solves.length) * 100) : 0;
    wrong.push([`Onder ${formatTime(target)}`, `${under.length} (${share}%)`, under]);
  }

  return [
    {
      title: 'Sessie',
      tiles: [
        ['solves', String(solves.length), all],
        ['mean', formatTime(sessionMean(solves)), all],
        ['beste', formatTime(best(solves)), extreme(best(solves))],
        ['slechtste', formatTime(worst(solves)), extreme(worst(solves))]
      ]
    },
    {
      title: 'Gemiddelden',
      // label, where it stands now, the best it has ever been, and the solves
      // behind each of those two
      averages: [
        ['mo3', formatTime(meanOf(solves, 3)), formatTime(bestMeanOf(solves, 3)),
          last(3), window(bestMeanAt(solves, 3))],
        ['ao5', formatTime(averageOf(solves, 5)), formatTime(bestAverageOf(solves, 5)),
          last(5), window(bestAverageAt(solves, 5))],
        ['ao12', formatTime(averageOf(solves, 12)), formatTime(bestAverageOf(solves, 12)),
          last(12), window(bestAverageAt(solves, 12))],
        ['ao50', formatTime(averageOf(solves, 50)), formatTime(bestAverageOf(solves, 50)),
          last(50), window(bestAverageAt(solves, 50))],
        ['ao100', formatTime(averageOf(solves, 100)), formatTime(bestAverageOf(solves, 100)),
          last(100), window(bestAverageAt(solves, 100))]
      ]
    },
    { title: 'Straffen', tiles: wrong }
  ];
}
let compareWith = null; // index of a second session to set beside this one

/** Every session except the one being looked at, as options to compare with. */
function renderCompareOptions() {
  el.statsCompare.closest('.field').hidden = saveFile.sessions.length < 2;
  el.statsCompare.innerHTML = '';
  const none = document.createElement('option');
  none.value = '';
  none.textContent = 'niets — alleen deze sessie';
  el.statsCompare.append(none);

  saveFile.sessions.forEach((session, index) => {
    if (index === saveFile.active) return;
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `${session.name} (${session.solves.length})`;
    el.statsCompare.append(option);
  });

  // A session may have been renamed or removed since the last look.
  if (compareWith !== null && !saveFile.sessions[compareWith]) compareWith = null;
  if (compareWith === saveFile.active) compareWith = null;
  el.statsCompare.value = compareWith === null ? '' : String(compareWith);
}

/** A heading, and whatever the group holds under it. */
function statSection(title) {
  const section = document.createElement('section');
  section.className = 'stats-group';
  const heading = document.createElement('h3');
  heading.className = 'stats-group-title';
  heading.textContent = title;
  section.append(heading);
  return section;
}

function tileGrid(tiles) {
  const grid = document.createElement('div');
  grid.className = 'stats-tiles';

  for (const [label, value, pick] of tiles) {
    const usable = pick && pick.length;
    const tile = document.createElement(usable ? 'button' : 'div');
    if (usable) {
      tile.type = 'button';
      tile.addEventListener('click', () => showSolves(label, pick));
    }
    tile.className = 'stats-tile';

    const name = document.createElement('span');
    name.className = 'stats-tile-label';
    name.textContent = label;

    const figure = document.createElement('span');
    figure.className = 'stats-tile-value';
    figure.textContent = value;

    tile.append(name, figure);
    grid.append(tile);
  }
  return grid;
}

/**
 * A row is one element rather than three cells, so its rule runs unbroken from
 * the label to the last number. As three grid cells the rule broke: baseline
 * alignment gives each cell a different height, and so a border-top at a
 * different place.
 *
 * A row that stands for actual solves is a button: pressing it shows them.
 */
function statRow(label, values, kinds, picks) {
  const usable = (picks || []).some((pick) => pick && pick.length);
  const row = document.createElement(usable ? 'button' : 'div');
  if (usable) row.type = 'button';
  row.className = 'stats-row';

  const name = document.createElement('span');
  name.className = 'stats-row-label';
  name.textContent = label;
  row.append(name);

  values.forEach((value, index) => {
    const cell = document.createElement('span');
    cell.className = `stats-row-value ${kinds[index] || ''}`.trim();
    cell.textContent = value;
    row.append(cell);
  });

  // With one set of solves the whole row opens it; with two -- now and record --
  // whichever number was pressed decides which.
  if (usable) {
    row.addEventListener('click', (event) => {
      const cell = event.target.closest('.stats-row-value');
      const which = cell ? [...row.children].indexOf(cell) - 1 : 0;
      const pick = picks[which]?.length ? picks[which] : picks.find((p) => p?.length);
      if (pick) showSolves(`${label}${picks.length > 1 && which === 1 ? ' · record' : ''}`, pick);
    });
  }
  return row;
}

function statTable(heads, rows, kinds, extraClass = '') {
  const table = document.createElement('div');
  table.className = `stats-table ${extraClass}`.trim();

  const head = document.createElement('div');
  head.className = 'stats-row stats-row-head';
  for (const label of ['', ...heads]) {
    const cell = document.createElement('span');
    cell.textContent = label;
    head.append(cell);
  }
  table.append(head);

  for (const [label, ...rest] of rows) {
    const values = rest.slice(0, heads.length);
    const picks = rest.slice(heads.length);
    table.append(statRow(label, values, kinds, picks));
  }
  return table;
}

/** One row per average, with its record right beside it rather than below. */
const averageTable = (rows) => statTable(['nu', 'record'], rows, ['', 'stats-row-record']);

/** Side by side, every measure gets a column per session instead. */
const comparisonTable = (rows, names) =>
  statTable(names, rows, ['', 'stats-row-other'], 'stats-table-compare');

/** Every measure of a group, flattened, for setting two sessions side by side. */
function flatten(group) {
  if (group.tiles) return group.tiles.map(([label, value]) => [label, value]);
  return group.averages.flatMap(([label, now, record]) => [
    [label, now], [`beste ${label}`, record]
  ]);
}

/* ---------- the solves behind a number ---------- */

let pickedIndices = [];

/**
 * What a measure was made of. Pressing one of them opens that solve with its
 * scramble, the same sheet a time in the list opens.
 */
function showSolves(title, indices) {
  pickedIndices = indices;
  el.pickedTitle.textContent = title;
  el.pickedNote.textContent = indices.length === 1
    ? 'Tik de tijd aan voor de scramble.'
    : `${indices.length} solves · tik er een aan voor de scramble.`;

  el.pickedList.innerHTML = '';
  for (const index of indices) {
    const solve = solves[index];
    if (!solve) continue;

    const item = document.createElement('li');
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'solve';
    if (solve.penalty === 'DNF') row.classList.add('is-dnf');

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

    const chevron = document.createElement('span');
    chevron.className = 'solve-chevron';
    chevron.textContent = '\u203a';
    chevron.setAttribute('aria-hidden', 'true');
    row.append(chevron);

    row.addEventListener('click', () => openDetail(index));
    item.append(row);
    el.pickedList.append(item);
  }

  el.pickedSheet.showModal();
  el.pickedSheet.focus();
}

function renderStatsList() {
  const other = compareWith === null ? null : saveFile.sessions[compareWith];
  const mine = statGroups();
  const theirs = other ? statGroups(other.solves) : null;

  el.statsList.innerHTML = '';

  mine.forEach((group, index) => {
    const section = statSection(group.title);

    if (!theirs) {
      section.append(group.tiles ? tileGrid(group.tiles) : averageTable(group.averages));
    } else {
      const ours = flatten(group);
      const others = flatten(theirs[index]);
      section.append(comparisonTable(
        ours.map(([label, value], row) => [label, value, others[row] ? others[row][1] : '–']),
        [currentSession().name, other.name]
      ));
    }

    el.statsList.append(section);
  });
}
function openStats() {
  el.statsTitle.textContent = compareWith === null ? currentSession().name : 'Statistieken';
  renderCompareOptions();
  renderStatsList();
  el.statsSheet.showModal();
  el.statsSheet.focus();
}

el.pickedClose.addEventListener('click', () => el.pickedSheet.close());

el.statsCompare.addEventListener('change', () => {
  compareWith = el.statsCompare.value === '' ? null : Number(el.statsCompare.value);
  el.statsTitle.textContent = compareWith === null ? currentSession().name : 'Statistieken';
  renderStatsList();
});

el.statsButton.addEventListener('click', () => {
  el.statsButton.blur();
  openStats();
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

el.quickClose.addEventListener('click', () => el.quickSheet.close());

el.quickPlus2.addEventListener('click', () => {
  togglePenalty(quickIndex, '+2');
  el.quickSheet.close();
});

el.quickDnf.addEventListener('click', () => {
  togglePenalty(quickIndex, 'DNF');
  el.quickSheet.close();
});

el.quickDetail.addEventListener('click', () => {
  const index = quickIndex;
  el.quickSheet.close();
  openDetail(index);
});

el.quickRemove.addEventListener('click', () => {
  const index = quickIndex;
  el.quickSheet.close();
  removeSolveWithUndo(index);
});

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
  renderPractice();
}

function setHint(text) {
  el.hint.innerHTML = text;
}

/**
 * @param {string} message
 * @param {{label: string, run: () => void}} [action] an offer to take it back,
 * which is what makes a gesture that deletes something safe to have at all.
 */
function toast(message, action) {
  // A modal dialog paints above everything else on the page, so a toast raised
  // from inside one -- the times sheet on a phone, say -- would sit behind it,
  // and its undo button could not be reached at all. Anything in an open
  // dialog's subtree joins it in the top layer, so that is where it goes.
  const host = [...document.querySelectorAll('dialog[open]')].pop() || document.body;
  if (el.toast.parentElement !== host) host.append(el.toast);

  el.toast.textContent = message;

  if (action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'toast-action';
    button.textContent = action.label;
    button.addEventListener('click', () => {
      clearTimeout(toastTimer);
      el.toast.hidden = true;
      action.run();
    });
    el.toast.append(button);
  }

  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.toast.hidden = true; }, action ? 6000 : 3000);
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
  solves.push({ ms, penalty: pendingPenalty, scramble, at: Date.now() });
  pendingPenalty = 'none';
  persist();
  newScramble();
  render();

  judgeSolve(previousBest);

  // The check comes after the celebration, so a record still gets its party
  // even when the camera is about to turn it into a DNF.
  watchCube(solves[solves.length - 1]);
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

  if (currentTarget() === null) return;
  const value = effective(solves[solves.length - 1]);
  if (!Number.isFinite(value)) return;

  if (value <= currentTarget()) {
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
 * Delete, but offer to put it back. A swipe is easy to make by accident in a
 * way that tapping through a sheet is not, so the gesture only earns its place
 * alongside a way to undo it.
 */
function removeSolveWithUndo(index) {
  const [removed] = solves.splice(index, 1);
  if (!removed) return;
  persist();
  render();
  toast(`${formatSolve(removed)} gewist.`, {
    label: 'ongedaan maken',
    run: () => {
      solves.splice(Math.min(index, solves.length), 0, removed);
      persist();
      render();
      toast(`${formatSolve(removed)} staat er weer.`);
    }
  });
}

/* ---------- gestures on a row ---------- */

const SWIPE_TRIGGER = 72;   // how far a row must travel before it acts
const SWIPE_FAR = 165;      // and how far again before the right-hand swipe escalates
const SWIPE_CLAIM = 10;     // beyond this the swipe owns the touch, not the scroller
const HOLD_MS = 500;

const BIN_PATH = 'M4 6.5h16M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7'
  + 'M6.2 6.5l.8 12.2a1.6 1.6 0 0 0 1.6 1.5h6.8a1.6 1.6 0 0 0 1.6-1.5l.8-12.2M10 10.5v6M14 10.5v6';

/** The bin and the labels that sit behind a row while it is being dragged. */
function swipeMarks() {
  const bin = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  bin.setAttribute('viewBox', '0 0 24 24');
  bin.setAttribute('fill', 'none');
  bin.setAttribute('stroke', 'currentColor');
  bin.setAttribute('stroke-width', '1.7');
  bin.setAttribute('stroke-linecap', 'round');
  bin.setAttribute('stroke-linejoin', 'round');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', BIN_PATH);
  bin.append(path);

  // Dragging left uncovers the right-hand edge, and the other way round, the
  // way a mail app does it.
  const left = document.createElement('span');
  left.className = 'swipe-mark swipe-mark-bin';
  left.setAttribute('aria-hidden', 'true');
  left.append(bin);

  const right = document.createElement('span');
  right.className = 'swipe-mark swipe-mark-penalty';
  right.setAttribute('aria-hidden', 'true');

  return [left, right];
}

let quickIndex = null;      // the solve the quick-action sheet is about

/**
 * Two gestures per row, on top of the tap that opens the details:
 * swipe left to delete, swipe right for +2, press and hold for the rest.
 * Right-clicking does the same as holding, so a mouse is not left out.
 */
function attachRowGestures(item, row, solve, index) {
  const [bin, penalty] = swipeMarks();
  item.prepend(bin, penalty);

  let startX = 0;
  let startY = 0;
  let offset = 0;
  let axis = null;          // null until the first move says which way this is going
  let holdTimer = null;
  let acted = false;        // a gesture fired, so the click that follows is not a tap

  const cancelHold = () => { clearTimeout(holdTimer); holdTimer = null; };

  const settle = (to) => {
    row.style.transition = 'transform .2s ease';
    row.style.transform = to;
    setTimeout(() => { row.style.transition = ''; row.style.transform = ''; }, 200);
  };

  row.addEventListener('touchstart', (event) => {
    if (selecting || event.touches.length !== 1) return;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    offset = 0;
    axis = null;
    acted = false;
    holdTimer = setTimeout(() => {
      holdTimer = null;
      acted = true;
      axis = 'hold';
      openQuickActions(index);
    }, HOLD_MS);
  }, { passive: true });

  row.addEventListener('touchmove', (event) => {
    if (axis === 'hold' || selecting) return;
    const dx = event.touches[0].clientX - startX;
    const dy = event.touches[0].clientY - startY;

    if (axis === null) {
      if (Math.abs(dx) < SWIPE_CLAIM && Math.abs(dy) < SWIPE_CLAIM) return;
      axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (axis !== 'x') { cancelHold(); return; } // a scroll, leave it alone
      cancelHold();
    }
    if (axis !== 'x') return;

    event.preventDefault(); // the list scroller may not also have this touch
    offset = dx;
    const action = dx < 0 ? 'delete' : dx >= SWIPE_FAR ? 'dnf' : 'plus2';
    item.dataset.swipe = action;
    item.dataset.armed = String(Math.abs(dx) >= SWIPE_TRIGGER);
    penalty.textContent = action === 'dnf' ? 'DNF' : '+2';
    row.style.transform = `translateX(${dx}px)`;
  }, { passive: false });

  const finish = () => {
    cancelHold();
    if (axis !== 'x') { delete item.dataset.swipe; delete item.dataset.armed; return; }

    const far = Math.abs(offset) >= SWIPE_TRIGGER;
    const left = offset < 0;
    const dnf = !left && offset >= SWIPE_FAR;
    axis = null;
    acted = far;

    if (!far) {
      settle('');
      delete item.dataset.swipe;
      delete item.dataset.armed;
      return;
    }

    // Off the edge it went, and then the list redraws without it.
    settle(`translateX(${left ? '-110%' : '110%'})`);
    setTimeout(() => {
      if (left) removeSolveWithUndo(index);
      else togglePenalty(index, dnf ? 'DNF' : '+2');
    }, 160);
  };

  row.addEventListener('touchend', finish);
  row.addEventListener('touchcancel', finish);

  // A tap that was really the tail of a gesture must not also open the details.
  row.addEventListener('click', (event) => {
    if (!acted) return;
    acted = false;
    event.stopImmediatePropagation();
    event.preventDefault();
  }, true);

  row.addEventListener('contextmenu', (event) => {
    if (selecting) return;
    event.preventDefault();
    openQuickActions(index);
  });
}

function openQuickActions(index) {
  const solve = solves[index];
  if (!solve) return;
  quickIndex = index;
  vibrate(12);

  el.quickTitle.textContent = formatSolve(solve);
  el.quickMeta.textContent = solve.at
    ? new Date(solve.at).toLocaleString('nl-BE', { dateStyle: 'medium', timeStyle: 'short' })
    : `solve ${index + 1}`;
  el.quickPlus2.dataset.active = String(solve.penalty === '+2');
  el.quickDnf.dataset.active = String(solve.penalty === 'DNF');
  el.quickSheet.showModal();
  el.quickSheet.focus();
}

/**
 * A double tap does not delete straight away: it shows which time is about to
 * go and waits for one more tap. Repeat as often as you like. Penalties are not
 * on the mat at all -- +2 and DNF are set on the solve itself, or on a whole
 * selection at once.
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

  // Opened now so it is ready the moment the cube lands; a solve is long enough
  // that nobody waits for it.
  warmCamera();

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

/**
 * Closing a sheet hands focus back to the button that opened it, and the space
 * bar then belongs to that button rather than to the timer -- so after a look
 * at the settings, space would quietly do nothing. Letting go of focus on close
 * gives the key back to the solve it is meant for.
 */
for (const sheet of document.querySelectorAll('dialog')) {
  sheet.addEventListener('close', () => document.activeElement?.blur?.());
}

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
 * at all -- inspection starts on contact. A second touch inside the window turns
 * that first action into "wipe the last time" instead.
 */
function onHandsOn() {
  if (phase === 'running') return;
  if (performance.now() - connectedAt < CONNECT_GRACE_MS) return;

  if (pendingTap) { // second touch: the first action was not what was meant
    clearPendingTap();
    cancelInspection();
    armDelete();
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

/* ---------- checking the cube with the camera ----------

   Nothing is aimed and nothing is asked for. The camera opens when a solve
   starts, finds the cube on the mat once the time has stopped, says only what
   that view can prove, and puts itself away. */

const FRAME_SIZE = 480;      // the square the camera frame is cropped to
const LOOK_EVERY_MS = 200;
const SETTLE_MS = 800;       // let the cube stop rolling before looking at it
const GIVE_UP_MS = 4000;     // and do not stare at it forever
const AGREEMENTS = 2;        // readings in a row before anything is allowed to change

const EMPTY_EVERY_MS = 400;  // how often the mat is photographed during a solve
const EMPTY_FRAMES = 12;

let camera = null;
let cameraTimer = null;
let cameraDeadline = 0;
let cameraSubject = null;    // the solve being judged
let lastReading = null;
let agreed = 0;

// While a solve runs the cube is in your hands, so these are pictures of the
// mat with nothing on it. Their middle value is what the cube is compared to.
let emptyTimer = null;
let emptyFrames = [];
let emptyMat = null;

async function useCamera(video) {
  if (camera) {
    video.srcObject = camera.stream;
    await video.play().catch(() => {});
    return camera;
  }
  camera = await openCamera(video);
  return camera;
}

function releaseCamera() {
  clearInterval(cameraTimer);
  clearInterval(emptyTimer);
  cameraTimer = null;
  emptyTimer = null;
  emptyFrames = [];
  camera?.stream.getTracks().forEach((track) => track.stop());
  camera = null;
  cameraSubject = null;
  lastReading = null;
  agreed = 0;
  el.cameraPeek.hidden = true;
  el.peekVideo.srcObject = null;
}

/** Started when a solve starts, so the camera is warm by the time it is over. */
async function warmCamera() {
  if (!settings.camera || camera) return;
  try {
    await useCamera(el.peekVideo);
    emptyFrames = [];
    clearInterval(emptyTimer);
    emptyTimer = setInterval(() => {
      const frame = camera?.grab(FRAME_SIZE);
      if (!frame) return;
      emptyFrames.push(coarse(frame));
      if (emptyFrames.length > EMPTY_FRAMES) emptyFrames.shift();
    }, EMPTY_EVERY_MS);
  } catch (error) {
    // A solve is running; a camera that will not open is not worth interrupting
    // it for. It is said once, quietly, when the solve is over.
    cameraTrouble = error?.name === 'NotAllowedError'
      ? 'Geen toegang tot de camera. Sta het toe in je browser, of zet de controle uit.'
      : `Camera lukt niet: ${error?.message || error}`;
  }
}

let cameraTrouble = null;

function watchCube(solve) {
  if (!settings.camera) return;
  if (cameraTrouble) { toast(cameraTrouble); cameraTrouble = null; return; }
  if (!camera) return;

  clearInterval(emptyTimer);
  emptyTimer = null;
  emptyMat = reference(emptyFrames);
  emptyFrames = [];

  // Fewer than a handful of frames means the solve was over before the mat was
  // ever seen empty, and there is nothing to compare against.
  if (!emptyMat) { releaseCamera(); return; }

  cameraSubject = solve;
  lastReading = null;
  agreed = 0;
  el.cameraPeek.hidden = false;
  el.cameraPeek.dataset.state = 'looking';
  cameraDeadline = performance.now() + SETTLE_MS + GIVE_UP_MS;

  clearInterval(cameraTimer);
  setTimeout(() => {
    if (!cameraSubject) return;
    cameraTimer = setInterval(look, LOOK_EVERY_MS);
  }, SETTLE_MS);
}

function look() {
  if (!camera || !cameraSubject) return;

  if (performance.now() > cameraDeadline) { // never seen well enough to say
    releaseCamera();
    return;
  }

  const frame = camera.grab(FRAME_SIZE);
  if (!frame) return;

  const reading = inspectFrame(frame, emptyMat);
  el.peekOutline.setAttribute('d', foundPath(reading.found));

  const decided = reading.verdict !== 'none' || reading.state === 'lijkt opgelost';
  const sure = decided && reading.confidence >= CERTAIN;
  el.cameraPeek.dataset.state = sure
    ? (reading.verdict === 'DNF' ? 'scrambled' : reading.verdict === '+2' ? 'one-move' : 'solved')
    : reading.found ? 'found' : 'looking';

  if (!sure) { lastReading = null; agreed = 0; return; }
  agreed = reading.verdict === lastReading ? agreed + 1 : 1;
  lastReading = reading.verdict;
  if (agreed < AGREEMENTS) return;

  applyVerdict(reading.verdict);
}

function applyVerdict(verdict) {
  const solve = cameraSubject;
  const index = solves.indexOf(solve);
  releaseCamera();
  if (index < 0 || verdict === 'none') return; // solved, or near enough to leave alone

  const before = solve.penalty;
  solve.penalty = verdict;
  persist();
  render();
  cue('miss');
  toast(`Camera zag ${verdict === 'DNF' ? 'meer dan één zet' : 'één zet'} ernaast — ${verdict} gezet.`, {
    label: 'toch niet',
    run: () => {
      solve.penalty = before;
      persist();
      render();
      toast(`${formatSolve(solve)} weer zonder straf.`);
    }
  });
}

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
  el.body.dataset.font = settings.font;
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
  hold: bindGroup('set-hold', (v) => { settings.holdMs = Number(v); }),
  font: bindGroup('set-font', (v) => { settings.font = v; }),
  // the one box follows the kind, so it has to be redrawn with it
  goalKind: bindGroup('set-goalKind', (v) => { settings.goalKind = v; syncGoalValue(); })
};

const switches = [
  bindSwitch('set-preview', 'preview'),
  bindSwitch('set-countUp', 'countUp'),
  bindSwitch('set-wakeLock', 'wakeLock'),
  bindSwitch('set-inspection', 'inspection'),
  bindSwitch('set-hide', 'hideTime'),
  bindSwitch('set-sound', 'sound'),
  bindSwitch('set-haptics', 'haptics'),
  bindSwitch('set-celebrate', 'celebrate'),
  bindSwitch('set-highlight', 'highlight'),
  bindSwitch('set-camera', 'camera'),
  bindSwitch('set-practice', 'practice')
];

/**
 * One box for two goals: whichever kind is chosen is the one it edits, so
 * switching back and forth does not lose the other number.
 */
function syncGoalValue() {
  const solves = settings.goalKind === 'solves';
  el.goalValue.value = String(solves ? settings.goalSolves : settings.goalMinutes);
  el.goalValue.max = String(solves ? 500 : 600);
  el.goalNote.textContent = solves
    ? 'Zoveel solves op een dag houdt de vlam brandend'
    : 'Zoveel minuten solven op een dag houdt de vlam brandend';
}

el.goalValue.addEventListener('change', () => {
  const solves = settings.goalKind === 'solves';
  const number = Math.round(Number(el.goalValue.value));
  const clamped = Number.isFinite(number)
    ? Math.min(Math.max(number, 1), solves ? 500 : 600)
    : (solves ? settings.goalSolves : settings.goalMinutes);

  if (solves) settings.goalSolves = clamped;
  else settings.goalMinutes = clamped;

  storeSettings();
  syncGoalValue();
  renderPractice();
});

/** The goal box shows the session's own time; empty means it has none. */
function syncTargetUi() {
  const target = currentTarget();
  el.targetSwitch.setAttribute('aria-checked', String(target !== null));
  el.targetValue.value = ((target ?? 20000) / 1000).toFixed(2).replace(/\.?0+$/, '');
  el.targetValue.disabled = target === null;
  el.targetNote.textContent = `Alleen voor ${currentSession().name}; elke sessie heeft zijn eigen doel.`;
}

function syncSettingsUi() {
  syncTargetUi();
  markGroup(groups.theme, settings.theme);
  markGroup(groups.decimals, settings.decimals);
  markGroup(groups.hold, settings.holdMs);
  markGroup(groups.font, settings.font);
  markGroup(groups.goalKind, settings.goalKind);
  syncGoalValue();
  markGroup(el.exportFormat, exportFormat);
  markGroup(el.ledColors, settings.led);
  syncColorSlots();
  for (const { control, key } of switches) control.setAttribute('aria-checked', String(settings[key]));
}

el.targetSwitch.addEventListener('click', () => {
  const seconds = Number(el.targetValue.value);
  const ms = Number.isFinite(seconds) && seconds > 0
    ? Math.min(Math.max(Math.round(seconds * 1000), 1000), 600000)
    : 20000;
  currentSession().target = currentTarget() === null ? ms : null;
  persist();
  syncTargetUi();
  applySettings();
});

el.targetValue.addEventListener('change', () => {
  const seconds = Number(el.targetValue.value);
  if (!Number.isFinite(seconds) || seconds <= 0) { syncTargetUi(); return; }
  currentSession().target = Math.min(Math.max(Math.round(seconds * 1000), 1000), 600000);
  persist();
  syncTargetUi();
  applySettings();
});

/** Session as plain text, one solve per line, ready to paste anywhere. */
function sessionAsText() {
  const header = `${currentSession().name} — ${solves.length} tijden`;
  const lines = solves.map((solve, index) =>
    `${index + 1}. ${formatSolve(solve)}   ${solve.scramble || ''}`.trimEnd());
  return [header, ...lines].join('\n');
}

/** Quoted the way every spreadsheet expects: doubled quotes inside quotes. */
const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

function sessionAsCsv() {
  const rows = [['nummer', 'tijd', 'milliseconden', 'straf', 'datum', 'scramble', 'notitie']];
  solves.forEach((solve, index) => rows.push([
    index + 1,
    formatSolve(solve),
    solve.ms,
    solve.penalty && solve.penalty !== 'none' ? solve.penalty : '',
    Number.isFinite(solve.at) ? new Date(solve.at).toISOString() : '',
    solve.scramble || '',
    solve.note || ''
  ]));
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

/**
 * cstimer's own export shape: every solve is [[penalty, ms], scramble, comment,
 * unix seconds], where the penalty is 0, 2000 for a +2, or -1 for a DNF. The
 * session names live in a JSON string inside the properties, which is cstimer's
 * doing rather than ours.
 */
function sessionAsCstimer() {
  const name = currentSession().name;
  const rows = solves.map((solve) => [
    [solve.penalty === 'DNF' ? -1 : solve.penalty === '+2' ? 2000 : 0, solve.ms],
    solve.scramble || '',
    solve.note || '',
    Number.isFinite(solve.at) ? Math.round(solve.at / 1000) : 0
  ]);

  return JSON.stringify({
    session1: rows,
    properties: {
      sessionN: 1,
      sessionData: JSON.stringify({ 1: { name, opt: {}, rank: 1 } })
    }
  });
}

let exportFormat = 'text';

const EXPORTS = {
  text: { build: sessionAsText, label: 'als tekst' },
  csv: { build: sessionAsCsv, label: 'als csv' },
  cstimer: { build: sessionAsCstimer, label: 'voor cstimer' }
};

el.exportFormat.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  exportFormat = button.dataset.value;
  markGroup(el.exportFormat, exportFormat);
});

el.export.addEventListener('click', async () => {
  el.export.blur();
  if (!solves.length) {
    toast('Nog geen tijden om te kopiëren.');
    return;
  }
  const { build, label } = EXPORTS[exportFormat] || EXPORTS.text;
  try {
    await navigator.clipboard.writeText(build());
    toast(`${solves.length} tijden gekopieerd ${label}.`);
  } catch {
    toast('Kopiëren lukte niet in deze browser.');
  }
});

/* ---------- 11: times from somewhere else ---------- */

/**
 * One line, one time. Anything a timer app is likely to put around it -- a
 * leading number, a trailing scramble, brackets, a comma for a decimal point --
 * is allowed for, and a line with no time in it is skipped rather than guessed
 * at.
 *
 * @returns {{ms: number, penalty: string, scramble?: string}|null}
 */
function parseTimeLine(raw) {
  let line = raw.trim();
  if (!line) return null;

  line = line.replace(/^\s*\d{1,4}\s*[.)\]:-]\s+/, ''); // "12. " or "12) "

  let penalty = 'none';
  const dnf = line.match(/^DNF\s*\(([^)]+)\)/i);
  if (dnf) {
    penalty = 'DNF';
    line = dnf[1];
  } else if (/^DNS\b|^DNF\b/i.test(line)) {
    return null; // a DNF with no time behind it is not a time
  }

  const match = line.match(/(\d{1,2}:)?(\d{1,3})[.,](\d{1,3})/);
  if (!match) return null;

  const minutes = match[1] ? Number(match[1].slice(0, -1)) : 0;
  const seconds = Number(match[2]);
  const fraction = Number(match[3].padEnd(3, '0'));
  const ms = minutes * 60000 + seconds * 1000 + fraction;
  if (!Number.isFinite(ms) || ms <= 0) return null;

  const rest = line.slice(match.index + match[0].length);
  const plusTwo = /^\s*(\(\+2\)|\+2|\+)(?!\w)/;
  if (penalty === 'none' && plusTwo.test(rest)) penalty = '+2';

  // Whatever follows that is not the penalty marker is taken to be the scramble.
  const scramble = rest.replace(plusTwo, '').trim();
  return scramble ? { ms, penalty, scramble } : { ms, penalty };
}

const parseTimes = (text) => text.split(/\r?\n/).map(parseTimeLine).filter(Boolean);

function describePaste() {
  const found = parseTimes(el.pasteInput.value);
  const lines = el.pasteInput.value.split(/\r?\n/).filter((line) => line.trim()).length;
  el.pasteAdd.disabled = found.length === 0;

  if (!lines) { el.pasteNote.textContent = ''; return; }
  const skipped = lines - found.length;
  el.pasteNote.textContent = found.length
    ? `${found.length} ${found.length === 1 ? 'tijd' : 'tijden'} herkend${skipped ? `, ${skipped} ${skipped === 1 ? 'regel' : 'regels'} overgeslagen` : ''}.`
    : 'Geen tijden herkend in wat er staat.';
}

el.pasteOpen.addEventListener('click', () => {
  el.pasteOpen.blur();
  el.pasteInput.value = '';
  describePaste();
  el.pasteSheet.showModal();
});

el.pasteClose.addEventListener('click', () => el.pasteSheet.close());
el.pasteInput.addEventListener('input', describePaste);

el.pasteAdd.addEventListener('click', () => {
  const found = parseTimes(el.pasteInput.value);
  if (!found.length) return;

  // No timestamp is invented for them: they were not solved here, and the list
  // says so by grouping them under "zonder datum". They go in ahead of what is
  // already there, so that heading lands at the foot of the list rather than
  // above today's solves.
  solves.unshift(...found.map((time) => ({ ...time, puzzle: currentSession().puzzle })));
  persist();
  render();
  el.pasteSheet.close();
  toast(`${found.length} ${found.length === 1 ? 'tijd' : 'tijden'} toegevoegd.`);
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
