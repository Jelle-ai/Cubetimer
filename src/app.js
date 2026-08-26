import { PUZZLES, nextScramble, puzzleById, randomMoveScramble, warmUp } from './scramble.js';
import { bluetoothAvailable, connectGanTimer, isSupported, TimerState } from './gan-timer.js';
import {
  averageOf, best, bestAverageAt, bestAverageOf, bestMeanAt, bestMeanOf, counting, counts,
  effective, formatSolve, formatTime, meanOf, sessionMean, setDecimals, worst
} from './stats.js';
import { KEY as SAVE_KEY, load, save } from './store.js';
import { backupName, buildBackup, foldIn, inOrder, readBackup, summarise } from './backup.js';
import {
  bestRuns, byDay, fastest, onThisDay, recordAge, records, spellDuration, totals, without
} from './history.js';
import { MODES, absorb, begin, describe, expired, hushed, result, runSolves } from './modes.js';
import { COLOR_SLOTS, LED_COLORS, colorOf, loadSettings, saveSettings } from './settings.js';
import { chord, confetti, flashMiss, tone, vibrate } from './feedback.js';
import { hasPreview, previewOf } from './preview.js';
import {
  ALL_SIX, CERTAIN, FULL_FRAME, askForCamera, coarse, cropBox, cropShape, findCube, foundPath,
  inspectFrame, learnColours, openCamera, reference
} from './vision.js';
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
  recordsOpen: document.getElementById('records-open'),
  recordsSheet: document.getElementById('records-sheet'),
  recordsTitle: document.getElementById('records-title'),
  recordsClose: document.getElementById('records-close'),
  recordsBody: document.getElementById('records-body'),
  statsTitle: document.getElementById('stats-title'),
  statsList: document.getElementById('stats-list'),
  selectMode: document.getElementById('select-mode'),
  addTime: document.getElementById('add-time'),
  addSheet: document.getElementById('add-sheet'),
  addClose: document.getElementById('add-close'),
  addTimeValue: document.getElementById('add-time-value'),
  addPenalty: document.getElementById('add-penalty'),
  addScramble: document.getElementById('add-scramble'),
  addNote: document.getElementById('add-note'),
  addSave: document.getElementById('add-save'),
  filterOpen: document.getElementById('filter-open'),
  filterBar: document.getElementById('filter-bar'),
  filterText: document.getElementById('filter-text'),
  filterChips: document.getElementById('filter-chips'),
  filterClear: document.getElementById('filter-clear'),
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
  pastePick: document.getElementById('paste-pick'),
  pasteFile: document.getElementById('paste-file'),
  exportSave: document.getElementById('export-save'),
  transferOpen: document.getElementById('transfer-open'),
  transferSheet: document.getElementById('transfer-sheet'),
  transferClose: document.getElementById('transfer-close'),
  transferHere: document.getElementById('transfer-here'),
  transferSave: document.getElementById('transfer-save'),
  transferShare: document.getElementById('transfer-share'),
  transferThere: document.getElementById('transfer-there'),
  transferPick: document.getElementById('transfer-pick'),
  transferFile: document.getElementById('transfer-file'),
  transferChoice: document.getElementById('transfer-choice'),
  transferMerge: document.getElementById('transfer-merge'),
  transferReplace: document.getElementById('transfer-replace'),
  statsCompare: document.getElementById('stats-compare'),
  pickedSheet: document.getElementById('picked-sheet'),
  pickedTitle: document.getElementById('picked-title'),
  pickedNote: document.getElementById('picked-note'),
  pickedList: document.getElementById('picked-list'),
  pickedClose: document.getElementById('picked-close'),
  cameraLook: document.getElementById('camera-look'),
  cameraAllow: document.getElementById('camera-allow'),
  cameraState: document.getElementById('camera-state'),
  lookSheet: document.getElementById('look-sheet'),
  lookVideo: document.getElementById('look-video'),
  lookOutline: document.getElementById('look-outline'),
  lookStatus: document.getElementById('look-status'),
  lookDetail: document.getElementById('look-detail'),
  lookRelearn: document.getElementById('look-relearn'),
  lookClose: document.getElementById('look-close'),
  lookFrame: document.querySelector('.look-frame'),
  lookGuide: document.getElementById('look-guide'),
  cropShape: document.getElementById('crop-shape'),
  cropOutline: document.getElementById('crop-outline'),
  cropShade: document.getElementById('crop-shade'),
  cropHandles: [...document.querySelectorAll('.crop-handle')],
  cropReset: document.getElementById('crop-reset'),
  learnColours: document.getElementById('learn-colours'),
  colourSwatches: document.getElementById('colour-swatches'),
  colourCount: document.getElementById('colour-count'),
  cameraBlurb: document.getElementById('camera-blurb'),
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
  scrambleAgain: document.getElementById('scramble-again'),
  repeatScramble: document.getElementById('repeat-scramble'),
  modeOpen: document.getElementById('mode-open'),
  modeSheet: document.getElementById('mode-sheet'),
  modeClose: document.getElementById('mode-close'),
  modeList: document.getElementById('mode-list'),
  modeNumberField: document.getElementById('mode-number-field'),
  modeNumberLabel: document.getElementById('mode-number-label'),
  modeNumber: document.getElementById('mode-number'),
  modeNote: document.getElementById('mode-note'),
  modeStart: document.getElementById('mode-start'),
  modeStrip: document.getElementById('mode-strip'),
  split: document.getElementById('split'),
  drillOpen: document.getElementById('drill-open'),
  drillSheet: document.getElementById('drill-sheet'),
  drillTitle: document.getElementById('drill-title'),
  drillClose: document.getElementById('drill-close'),
  drillBody: document.getElementById('drill-body'),
  splitsSwitch: document.getElementById('set-splits'),
  metroOpen: document.getElementById('metro-open'),
  metroSheet: document.getElementById('metro-sheet'),
  metroClose: document.getElementById('metro-close'),
  metroSpeed: document.getElementById('metro-speed'),
  metroFigure: document.getElementById('metro-figure'),
  metroToggle: document.getElementById('metro-toggle'),
  bigOpen: document.getElementById('big-open'),
  keysOpen: document.getElementById('keys-open'),
  keysSheet: document.getElementById('keys-sheet'),
  keysClose: document.getElementById('keys-close'),
  keysBody: document.getElementById('keys-body'),
  roundSheet: document.getElementById('round-sheet'),
  roundTitle: document.getElementById('round-title'),
  roundClose: document.getElementById('round-close'),
  roundBody: document.getElementById('round-body'),
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
  quickMove: document.getElementById('quick-move'),
  detailMove: document.getElementById('detail-move'),
  detailSkip: document.getElementById('detail-skip'),
  detailSplits: document.getElementById('detail-splits'),
  detailStar: document.getElementById('detail-star'),
  quickSkip: document.getElementById('quick-skip'),
  quickStar: document.getElementById('quick-star'),
  selectionMove: document.getElementById('selection-move'),
  moveSheet: document.getElementById('move-sheet'),
  moveTitle: document.getElementById('move-title'),
  moveClose: document.getElementById('move-close'),
  moveWhat: document.getElementById('move-what'),
  moveList: document.getElementById('move-list'),
  moveName: document.getElementById('move-name'),
  movePuzzle: document.getElementById('move-puzzle'),
  moveCreate: document.getElementById('move-create'),
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
let keepScramble = false; // asked to do this one again
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
  renderSplit();
}

function showTime(ms) {
  if (hushed(run) && phase !== 'running') { el.time.textContent = HUSH; return; }
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
const HUSH = '– – –';

function renderStats() {
  // In verrassingsmodus every number waits until the run is over, including
  // the one that just landed. That is the whole point of it.
  if (hushed(run)) {
    for (const cell of Object.values(el.stats)) cell.textContent = HUSH;
    return;
  }

  const last = solves.length ? effective(solves[solves.length - 1]) : null;

  el.stats.single.textContent = formatTime(last);
  const scored = counting(solves);
  el.stats.singleBest.textContent = formatTime(best(scored));
  el.stats.mo3.textContent = formatTime(meanOf(scored, 3));
  el.stats.mo3Best.textContent = formatTime(bestMeanOf(scored, 3));
  el.stats.ao5.textContent = formatTime(averageOf(scored, 5));
  el.stats.ao5Best.textContent = formatTime(bestAverageOf(scored, 5));
  el.stats.ao12.textContent = formatTime(averageOf(scored, 12));
  el.stats.ao12Best.textContent = formatTime(bestAverageOf(scored, 12));
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

/* ---------- a time you solved somewhere else ---------- */

let addPenalty = 'none';

function describeAdd() {
  const found = parseTimeLine(el.addTimeValue.value);
  el.addSave.disabled = !found;
  el.addNote.textContent = el.addTimeValue.value.trim() && !found
    ? 'Dat lees ik niet als een tijd. Probeer 12.34 of 1:23.45.'
    : found
      ? `Wordt toegevoegd als ${formatSolve({ ms: found.ms, penalty: addPenalty })}.`
      : '';
}

el.addTime.addEventListener('click', () => {
  el.addTime.blur();
  el.addTimeValue.value = '';
  el.addScramble.value = '';
  addPenalty = 'none';
  markGroup(el.addPenalty, addPenalty);
  describeAdd();
  el.addSheet.showModal();
});

el.addClose.addEventListener('click', () => el.addSheet.close());
el.addTimeValue.addEventListener('input', describeAdd);

el.addPenalty.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  addPenalty = button.dataset.value;
  markGroup(el.addPenalty, addPenalty);
  describeAdd();
});

el.addSave.addEventListener('click', () => {
  const found = parseTimeLine(el.addTimeValue.value);
  if (!found) return;

  const scramble = el.addScramble.value.trim() || found.scramble || '';
  const solve = { ms: found.ms, penalty: addPenalty, at: Date.now() };
  if (scramble) solve.scramble = scramble;
  solves.push(solve);

  persist();
  render();
  el.addSheet.close();
  toast(`${formatSolve(solve)} toegevoegd.`, {
    label: 'Ongedaan maken',
    run: () => {
      const at = solves.indexOf(solve);
      if (at < 0) return;
      solves.splice(at, 1);
      persist();
      render();
    }
  });
});

/* ---------- searching the list ----------

   A filter narrows what is shown and nothing else. The averages are still of
   the session, not of what happens to be on screen -- an average of a search
   result is not a thing anybody wants. */

let filterText = '';
let filterOnly = null; // 'star' | '+2' | 'DNF' | 'skip'

const filtering = () => filterText !== '' || filterOnly !== null;

function matches(solve) {
  if (filterOnly === 'star' && !solve.star) return false;
  if (filterOnly === 'skip' && !solve.skip) return false;
  if ((filterOnly === '+2' || filterOnly === 'DNF') && solve.penalty !== filterOnly) return false;
  if (!filterText) return true;

  const needle = filterText.toLowerCase();
  return `${solve.scramble || ''} ${solve.note || ''} ${formatSolve(solve)}`.toLowerCase().includes(needle);
}

function renderFilter() {
  el.filterBar.hidden = !filterShown;
  el.filterOpen.dataset.active = String(filtering());
  for (const chip of el.filterChips.children) {
    chip.dataset.active = String(chip.dataset.only === filterOnly);
  }
}

let filterShown = false;

el.filterOpen.addEventListener('click', () => {
  el.filterOpen.blur();
  filterShown = !filterShown;
  if (!filterShown) { filterText = ''; filterOnly = null; el.filterText.value = ''; }
  renderFilter();
  renderSolves();
  if (filterShown) el.filterText.focus();
});

el.filterText.addEventListener('input', () => {
  filterText = el.filterText.value.trim();
  renderFilter();
  renderSolves();
});

el.filterChips.addEventListener('click', (event) => {
  const chip = event.target.closest('button');
  if (!chip) return;
  filterOnly = filterOnly === chip.dataset.only ? null : chip.dataset.only;
  renderFilter();
  renderSolves();
});

el.filterClear.addEventListener('click', () => {
  filterText = '';
  filterOnly = null;
  el.filterText.value = '';
  renderFilter();
  renderSolves();
});

function renderSolves() {
  el.solves.innerHTML = '';
  if (hushed(run)) {
    el.empty.hidden = false;
    el.empty.textContent = `Verrassingsmodus — nog ${Math.max(0, run.number - runSolves(run, solves).length)} te gaan.`;
    return;
  }

  const shown = solves.filter(matches);
  el.empty.hidden = shown.length > 0;
  el.empty.textContent = solves.length && !shown.length
    ? 'Niets gevonden met deze filter.'
    : 'Nog geen tijden.';

  const times = solves.map(effective).filter(Number.isFinite);
  const fastest = settings.highlight && times.length > 1 ? Math.min(...times) : null;
  const slowest = settings.highlight && times.length > 1 ? Math.max(...times) : null;

  // Walked newest first, which is the order it is read in, so a day heading can
  // be dropped in the moment the date changes.
  let openDay;
  for (let index = solves.length - 1; index >= 0; index--) {
    const solve = solves[index];
    if (!matches(solve)) continue;
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

    if (solve.star) {
      const star = document.createElement('span');
      star.className = 'solve-star';
      star.textContent = '★';
      star.title = 'Bewaard';
      row.append(star);
    }

    if (solve.skip) {
      row.classList.add('is-skipped');
      const mark = document.createElement('span');
      mark.className = 'solve-tag is-quiet';
      mark.textContent = 'telt niet';
      row.append(mark);
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

  // Chasing the record is more interesting than chasing a round number, so when
  // there is no target of your own it is the record that gets chased -- and
  // then it says so, because "onder 12.16" means nothing until you know that
  // 12.16 is the thing to beat.
  const target = currentTarget();
  const record = bestAverageOf(counting(solves), 5);
  const goal = target ?? record;
  const chasingRecord = target === null && record !== null;

  if (goal) {
    const ceiling = ao5Ceiling(goal);
    const what = chasingRecord ? 'PB ao5' : `ao5 onder ${formatTime(goal)}`;
    if (ceiling === Infinity) parts.push(`${what} is binnen, wat deze ook wordt`);
    else if (ceiling) parts.push(`${what}: deze mag max ${formatTime(ceiling)}`);
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
/* ---------- a scramble you have met before ----------

   Every so often the scramble is not a new one but one of your own, from long
   enough ago that you will not remember it. It arrives without ceremony -- a
   grey line under the moves saying when you last had it, and not what you did,
   because knowing the number beforehand changes the solve. Afterwards you are
   told how it went against then. */

const AGAIN_ONE_IN = 12;
const AGAIN_AFTER_DAYS = 21;

/** A solve from this puzzle, old enough to have been forgotten. */
function anOldScramble() {
  const cutoff = Date.now() - AGAIN_AFTER_DAYS * 86400000;
  const puzzle = currentSession().puzzle;
  const pool = [];

  for (const session of saveFile.sessions) {
    if (session.puzzle !== puzzle) continue;
    for (const solve of session.solves) {
      if (!solve.scramble || !Number.isFinite(solve.at) || solve.at > cutoff) continue;
      if (solve.penalty === 'DNF' || !counts(solve)) continue;
      pool.push(solve);
    }
  }
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** The solve this scramble is a rematch of, or null for an ordinary one. */
let rematch = null;

function renderRematch() {
  el.scrambleAgain.hidden = !rematch;
  if (!rematch) return;
  const when = new Date(rematch.at);
  const month = MONTHS[when.getMonth()];
  el.scrambleAgain.textContent = `deze had je in ${month} ook`;
}

async function newScramble({ allowRematch = true } = {}) {
  const puzzle = currentSession().puzzle;
  const token = ++scrambleToken;

  rematch = allowRematch && Math.random() < 1 / AGAIN_ONE_IN ? anOldScramble() : null;
  if (rematch) {
    scramble = rematch.scramble;
    delete el.scramble.dataset.loading;
    el.scramble.dataset.official = 'true';
    el.scramble.title = 'Klik om te kopiëren';
    renderScramble();
    renderRematch();
    return;
  }

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
  renderRematch();
}

/* ---------- sessions ---------- */

/** This session's goal time in milliseconds, or null when it has none. */
const currentTarget = () => currentSession().target;

function currentSession() {
  return saveFile.sessions[saveFile.active];
}

/** A session named after its puzzle should not say so twice. */
function labelSession(session) {
  const puzzle = puzzleById(session.puzzle).name;
  return session.name === puzzle ? session.name : `${session.name} · ${puzzle}`;
}

function renderSessions() {
  el.sessionSelect.innerHTML = '';
  saveFile.sessions.forEach((session, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `${labelSession(session)} (${session.solves.length})`;
    option.selected = index === saveFile.active;
    el.sessionSelect.append(option);
  });
}

function useSession(index) {
  // Picking a session by hand is how you stop drilling; startCase sets it again
  // straight afterwards.
  drilling = null;
  keepScramble = false;
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
  // No shadowing here. The name used to be reused for the filtered copy, which
  // hid the module's own list behind it -- and the one line that wanted to ask
  // "is this the session on screen?" ended up comparing the argument with
  // itself, always true.
  const thisSession = list === solves;

  // Measured over the solves that count, but every set of solves handed back is
  // in the coordinates of the list on screen, so `back` carries the indices
  // across and a warm-up in the middle does not shift what a tapped average
  // opens.
  const scored = counting(list);
  const back = list.flatMap((solve, index) => (counts(solve) ? [index] : []));

  const dnfs = scored.filter((solve) => solve.penalty === 'DNF').length;
  const plusTwos = scored.filter((solve) => solve.penalty === '+2').length;

  const all = scored.map((_, index) => index);
  const outward = (indices) => indices.map((i) => back[i]);
  const where = (test) => outward(all.filter((index) => test(scored[index])));
  const extreme = (value) => {
    const index = all.find((i) => effective(scored[i]) === value);
    return index === undefined ? [] : [back[index]];
  };
  const last = (n) => (scored.length >= n ? outward(all.slice(-n)) : []);
  const span = (at) => (at ? outward(all.slice(at.start, at.end)) : []);

  const wrong = [
    ['+2', String(plusTwos), where((s) => s.penalty === '+2')],
    ['DNF', String(dnfs), where((s) => s.penalty === 'DNF')]
  ];

  // The target belongs to the session on screen, so it is only offered for that
  // one; a compared session was being measured against a target never its own.
  const target = thisSession ? currentTarget() : null;
  if (target !== null) {
    const under = where((s) => {
      const value = effective(s);
      return Number.isFinite(value) && value <= target;
    });
    const share = scored.length ? Math.round((under.length / scored.length) * 100) : 0;
    wrong.push([`Onder ${formatTime(target)}`, `${under.length} (${share}%)`, under]);
  }

  const skipped = list.length - scored.length;
  const session = [
    ['solves', String(scored.length), outward(all)],
    ['mean', formatTime(sessionMean(scored)), outward(all)],
    ['beste', formatTime(best(scored)), extreme(best(scored))],
    ['slechtste', formatTime(worst(scored)), extreme(worst(scored))]
  ];
  if (skipped) {
    session.push(['telt niet mee', String(skipped),
      list.flatMap((solve, index) => (counts(solve) ? [] : [index]))]);
  }

  return [
    { title: 'Sessie', tiles: session },
    {
      title: 'Gemiddelden',
      // label, where it stands now, the best it has ever been, and the solves
      // behind each of those two
      averages: [
        ['mo3', formatTime(meanOf(scored, 3)), formatTime(bestMeanOf(scored, 3)),
          last(3), span(bestMeanAt(scored, 3))],
        ['ao5', formatTime(averageOf(scored, 5)), formatTime(bestAverageOf(scored, 5)),
          last(5), span(bestAverageAt(scored, 5))],
        ['ao12', formatTime(averageOf(scored, 12)), formatTime(bestAverageOf(scored, 12)),
          last(12), span(bestAverageAt(scored, 12))],
        ['ao50', formatTime(averageOf(scored, 50)), formatTime(bestAverageOf(scored, 50)),
          last(50), span(bestAverageAt(scored, 50))],
        ['ao100', formatTime(averageOf(scored, 100)), formatTime(bestAverageOf(scored, 100)),
          last(100), span(bestAverageAt(scored, 100))]
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

/** Only now, when the number can no longer change how you solved it. */
function sayHowThatWent(then, now) {
  const before = effective(then);
  const after = effective(now);
  const when = new Date(then.at).toLocaleDateString('nl-BE');
  if (!Number.isFinite(before) || !Number.isFinite(after)) {
    toast(`Deze scramble had je op ${when} ook.`);
    return;
  }
  const gap = formatTime(Math.abs(before - after));
  toast(after < before
    ? `Deze scramble deed je op ${when} in ${formatTime(before)} — ${gap} sneller nu.`
    : `Deze scramble deed je op ${when} in ${formatTime(before)} — ${gap} trager nu.`);
}

/* ---------- modes ----------

   A run is a shape laid over the ordinary session: the solves land where they
   always land, and the run only decides what the strip says and when something
   is over. So nothing can be lost by leaving a mode, and a mode cannot make a
   solve go missing. */

let run = null;
let runTicker = null;
let picked = 'normal';

function renderMode() {
  const text = describe(run, solves, Date.now());
  el.modeStrip.textContent = text;
  el.modeStrip.hidden = !text;
  el.modeStrip.dataset.kind = run?.kind || '';
  el.modeOpen.dataset.active = String(Boolean(run));
  el.body.dataset.hushed = String(hushed(run));
}

/** The sprint has a clock of its own, so the strip has to move on its own too. */
function watchRunClock() {
  clearInterval(runTicker);
  runTicker = null;
  if (!run || run.kind !== 'sprint' || run.over) return;

  runTicker = setInterval(() => {
    if (expired(run, Date.now())) {
      run.over = true;
      clearInterval(runTicker);
      runTicker = null;
      renderMode();
      render();
      showResult();
      return;
    }

    renderMode();
  }, 250);
}

function showResult() {
  if (!run) return;
  const { headline, lines } = result(run, solves);
  el.roundTitle.textContent = MODES[run.kind].name;

  const big = document.createElement('p');
  big.className = 'round-headline';
  big.textContent = headline;

  const list = document.createElement('div');
  list.className = 'round-lines';
  for (const [label, value] of lines) {
    const row = document.createElement('div');
    const name = document.createElement('span');
    name.textContent = label;
    const figure = document.createElement('b');
    figure.textContent = value;
    row.append(name, figure);
    list.append(row);
  }

  const solvesLine = document.createElement('p');
  solvesLine.className = 'records-aside';
  solvesLine.textContent = runSolves(run, solves).map(formatSolve).join('   ');

  el.roundBody.replaceChildren(big, list, solvesLine);
  cue('record');
  if (settings.celebrate) confetti('party');
  openSheet(el.roundSheet);
}

function stopRun(quietly = false) {
  const had = run;
  run = null;
  clearInterval(runTicker);
  runTicker = null;
  renderMode();
  render();
  if (had && !quietly) toast(`${MODES[had.kind].name} gestopt.`);
}

/** Called once for every solve that lands, before anything is drawn. */
function runAbsorb(solve) {
  if (!run || run.over) return;
  const { ended, broke } = absorb(run, solve, solves);
  if (broke) cue('miss');
  renderMode();
  if (!ended) return;

  clearInterval(runTicker);
  runTicker = null;
  // The run being over is the moment verrassingsmodus stops hiding things, and
  // the screen was last drawn while it still was -- so it is drawn again before
  // the result goes up over it.
  render();
  const last = solves[solves.length - 1];
  if (last) showTime(effective(last));
  showResult();
}

function renderModeList() {
  el.modeList.replaceChildren(...Object.entries(MODES).map(([kind, shape]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.active = String(kind === picked);
    const name = document.createElement('b');
    name.textContent = shape.name;
    const about = document.createElement('small');
    about.textContent = shape.about;
    button.append(name, about);
    button.addEventListener('click', () => {
      picked = kind;
      renderModeList();
      renderModeFields();
    });
    return button;
  }));
}

function renderModeFields() {
  const shape = MODES[picked];
  const number = shape.number || null;
  el.modeNumberField.hidden = !number;
  if (number) {
    el.modeNumberLabel.textContent = `${number.label} (${number.unit})`;
    if (!el.modeNumber.value || el.modeNumber.dataset.for !== picked) {
      el.modeNumber.value = String(number.fallback);
      el.modeNumber.dataset.for = picked;
    }
  }
  el.modeStart.textContent = picked === 'normal' ? 'Terug naar gewoon' : 'Beginnen';
  el.modeNote.textContent = run && picked !== 'normal'
    ? 'Dit begint een nieuwe reeks; de vorige telt niet verder.'
    : '';
}

el.repeatScramble.addEventListener('click', () => {
  el.repeatScramble.blur();
  // Bumping the token is not enough: finishing a solve asks for a new scramble
  // outright, with a newer token still. So it is a standing wish, cleared the
  // moment it is granted.
  keepScramble = true;
  el.repeatScramble.dataset.active = 'true';
  toast('De volgende is dezelfde scramble.');
});

el.modeOpen.addEventListener('click', () => {
  el.modeOpen.blur();
  picked = run?.kind || 'normal';
  renderModeList();
  renderModeFields();
  el.modeSheet.showModal();
});

el.modeClose.addEventListener('click', () => el.modeSheet.close());
el.roundClose.addEventListener('click', () => el.roundSheet.close());

el.modeStart.addEventListener('click', () => {
  el.modeSheet.close();
  if (picked === 'normal') { stopRun(); return; }

  const number = Number(String(el.modeNumber.value).replace(',', '.'));
  run = begin(picked, number, Date.now(), solves.length);
  renderMode();
  render();
  watchRunClock();
  toast(`${MODES[picked].name} begonnen.`);
});

/* ---------- drilling one case at a time ----------

   The setup for a case is its algorithm turned back to front: do that to a
   solved cube and the case is looking at you. Which is also why nothing in the
   list is trusted -- src/cases.js puts every one on a real cube before it is
   offered, so an algorithm typed wrong here is dropped rather than drilled.

   The times land in a session of their own, as ordinary solves with the name of
   the case on them, so every list, average, export and record already works. */

let caseSet = null;   // the verified cases, loaded once
let drillGroup = 'pll';
let drilling = null;  // the case being drilled right now

const DRILL_SESSION = { pll: 'PLL trainen', oll: 'OLL trainen' };

async function loadCases() {
  if (caseSet) return caseSet;
  const [{ puzzles }, { Alg }, { usableCases, GROUPS, AUF }] = await Promise.all([
    import('../vendor/cubing/puzzles/index.js'),
    import('../vendor/cubing/alg/index.js'),
    import('./cases.js')
  ]);
  const kpuzzle = await puzzles['3x3x3'].kpuzzle();
  const { cases, dropped } = usableCases(kpuzzle, Alg);
  if (dropped.length) console.warn('Gevallen afgekeurd:', dropped);
  caseSet = { cases, dropped, GROUPS, AUF };
  return caseSet;
}

/** The session these times belong in, made the first time it is needed. */
function drillSession(group) {
  const name = DRILL_SESSION[group];
  let index = saveFile.sessions.findIndex((session) => session.name === name && session.puzzle === '333');
  if (index < 0) {
    saveFile.sessions.push({ name, puzzle: '333', target: null, solves: [] });
    index = saveFile.sessions.length - 1;
  }
  return index;
}

/** How you are doing per case, worst first -- which is the whole point. */
function caseStanding(group) {
  const name = DRILL_SESSION[group];
  const session = saveFile.sessions.find((s) => s.name === name && s.puzzle === '333');
  const perCase = new Map();

  for (const solve of counting(session?.solves || [])) {
    if (!solve.case) continue;
    const value = effective(solve);
    if (!Number.isFinite(value)) continue;
    const seen = perCase.get(solve.case) || { times: [], best: Infinity };
    seen.times.push(value);
    seen.best = Math.min(seen.best, value);
    perCase.set(solve.case, seen);
  }

  return [...perCase.entries()]
    .map(([id, seen]) => ({
      id,
      count: seen.times.length,
      best: seen.best,
      mean: seen.times.reduce((sum, t) => sum + t, 0) / seen.times.length
    }))
    .sort((a, b) => b.mean - a.mean);
}

/** Pick the next case: the ones you have done least, then the slowest. */
function nextCase(cases, group) {
  const mine = cases.filter((entry) => entry.group === group);
  const standing = new Map(caseStanding(group).map((row) => [row.id, row]));
  const untried = mine.filter((entry) => !standing.has(entry.id));
  const pool = untried.length ? untried : mine;
  return pool[Math.floor(Math.random() * pool.length)];
}

function startCase(entry) {
  // The session first: switching sessions is how you leave the drill, so it
  // clears `drilling`, and setting it before would undo itself.
  useSession(drillSession(entry.group));
  drilling = entry;
  const turn = caseSet.AUF[Math.floor(Math.random() * caseSet.AUF.length)];
  scramble = `${entry.setup}${turn ? ` ${turn}` : ''}`.trim();
  scrambleToken++;
  keepScramble = true; // finishing one solve must not fetch an ordinary scramble
  delete el.scramble.dataset.loading;
  el.scramble.dataset.official = 'true';
  rematch = null;
  renderRematch();
  renderScramble();
  renderDrill();
}

function renderDrill() {
  const { cases, dropped, GROUPS } = caseSet;
  const parts = [];

  const picker = document.createElement('div');
  picker.className = 'mode-list';
  for (const [group, shape] of Object.entries(GROUPS)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.active = String(group === drillGroup);
    const name = document.createElement('b');
    const many = cases.filter((entry) => entry.group === group).length;
    name.textContent = `${shape.name} · ${many} gevallen`;
    const about = document.createElement('small');
    about.textContent = shape.about;
    button.append(name, about);
    button.addEventListener('click', () => { drillGroup = group; renderDrill(); });
    picker.append(button);
  }
  parts.push(picker);

  const actions = document.createElement('div');
  actions.className = 'detail-actions';

  const go = document.createElement('button');
  go.type = 'button';
  go.id = 'drill-go';
  go.textContent = drilling ? 'Volgend geval' : 'Beginnen';
  go.addEventListener('click', () => {
    const entry = nextCase(cases, drillGroup);
    if (!entry) return;
    startCase(entry);
    el.drillSheet.close();
    toast(`${entry.id} — draai de opzet en solve dan het geval.`);
  });
  actions.append(go);

  if (drilling) {
    const stop = document.createElement('button');
    stop.type = 'button';
    stop.id = 'drill-stop';
    stop.textContent = 'Stoppen';
    stop.addEventListener('click', () => {
      drilling = null;
      keepScramble = false;
      newScramble();
      el.drillSheet.close();
      toast('Trainen gestopt.');
    });
    actions.append(stop);
  }
  parts.push(actions);

  const standing = caseStanding(drillGroup);
  if (standing.length) {
    const list = document.createElement('div');
    list.className = 'round-lines';
    for (const row of standing.slice(0, 12)) {
      const line = document.createElement('div');
      const name = document.createElement('b');
      name.textContent = row.id;
      const figure = document.createElement('span');
      figure.textContent = `${formatTime(row.mean)} gem · ${formatTime(row.best)} best · ${row.count}×`;
      line.append(name, figure);
      list.append(line);
    }
    const block = document.createElement('section');
    block.className = 'records-block';
    const heading = document.createElement('h3');
    heading.textContent = 'Slechtst gekend bovenaan';
    block.append(heading, list);
    parts.push(block);
  }

  const note = document.createElement('p');
  note.className = 'import-note';
  note.textContent = dropped.length
    ? `Draai de opzet op een opgeloste kubus; dan staat het geval voor je. ${dropped.length} geval(len) werden bij het inladen afgekeurd en niet aangeboden.`
    : 'Draai de opzet op een opgeloste kubus, en solve dan alleen dat geval. Je tijden komen in een eigen sessie.';
  parts.push(note);

  el.drillTitle.textContent = drilling ? `Trainen — ${drilling.id}` : 'Trainen';
  el.drillBody.replaceChildren(...parts);
}

el.drillOpen.addEventListener('click', async () => {
  el.drillOpen.blur();
  el.settings.close();
  try {
    await loadCases();
  } catch (error) {
    toast('De gevallen konden niet geladen worden.');
    console.error('Trainen:', error);
    return;
  }
  renderDrill();
  openSheet(el.drillSheet);
});

el.drillClose.addEventListener('click', () => el.drillSheet.close());

/* ---------- splits ----------

   Four stretches of one solve, timed by tapping between them. Only possible
   when you are timing by hand: on the mat, taking a hand off to mark a stage is
   the same gesture as stopping. */

const PHASES = {
  333: ['cross', 'F2L', 'OLL', 'PLL'],
  other: ['deel 1', 'deel 2', 'deel 3', 'deel 4']
};

const phaseNames = (puzzle) => PHASES[puzzle] || PHASES.other;

let splitTimes = [];

function renderSplit() {
  const on = settings.splits && phase === 'running' && !device;
  el.split.hidden = !on;
  if (!on) return;
  const names = phaseNames(currentSession().puzzle);
  el.split.textContent = splitTimes.length < names.length - 1
    ? `${names[splitTimes.length]} klaar`
    : names[names.length - 1];
  el.split.disabled = splitTimes.length >= names.length - 1;
}

function takeSplit() {
  if (!settings.splits || phase !== 'running' || device) return;
  const names = phaseNames(currentSession().puzzle);
  if (splitTimes.length >= names.length - 1) return;
  splitTimes.push(performance.now() - startedAt);
  tone(880, 0.04, 0.05);
  renderSplit();
}

el.split.addEventListener('pointerdown', (event) => {
  event.stopPropagation();
  event.preventDefault();
  takeSplit();
});

/** How long each stretch took, from the marks and the total. */
function phaseSpans(solve, puzzle) {
  if (!Array.isArray(solve.splits) || !solve.splits.length) return [];
  const names = phaseNames(puzzle);
  const marks = [...solve.splits, solve.ms];
  let previous = 0;
  return marks.map((mark, index) => {
    const span = mark - previous;
    previous = mark;
    return { name: names[index] || `deel ${index + 1}`, ms: span };
  });
}

/* ---------- metronome ----------

   A tick at a fixed tempo, to hear whether your turning is even. It carries on
   through a solve on purpose -- that is the only time it is any use. */

let metroTimer = null;

function metroRunning() { return metroTimer !== null; }

function renderMetro() {
  const speed = Number(el.metroSpeed.value);
  el.metroFigure.textContent = String(speed);
  el.metroToggle.textContent = metroRunning() ? 'Uitzetten' : 'Aanzetten';
  el.metroToggle.dataset.active = String(metroRunning());
}

function stopMetro() {
  clearInterval(metroTimer);
  metroTimer = null;
  renderMetro();
}

function startMetro() {
  stopMetro();
  const every = 60000 / Number(el.metroSpeed.value);
  // The first tick right away, so pressing the button is the downbeat.
  tone(1180, 0.035, 0.05, 'square');
  metroTimer = setInterval(() => tone(1180, 0.035, 0.05, 'square'), every);
  renderMetro();
}

el.metroOpen.addEventListener('click', () => {
  el.metroOpen.blur();
  renderMetro();
  el.metroSheet.showModal();
});

el.metroClose.addEventListener('click', () => el.metroSheet.close());
el.metroToggle.addEventListener('click', () => (metroRunning() ? stopMetro() : startMetro()));
el.metroSpeed.addEventListener('input', () => {
  renderMetro();
  if (metroRunning()) startMetro(); // retimed at once, so you hear what you drag
});

// A metronome nobody can hear the page for is worse than none.
window.addEventListener('pagehide', stopMetro);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') stopMetro();
});

/* ---------- the big display ----------

   Everything off the screen except the scramble and the time, at a size that
   reads from the other side of a room. */

function setBig(on) {
  el.body.dataset.big = String(on);
  if (on) {
    el.settings.close();
    toast('Grote weergave — druk op escape om terug te gaan.');
  }
}

el.bigOpen.addEventListener('click', () => {
  el.bigOpen.blur();
  setBig(true);
});

/* ---------- what the keys and gestures do ---------- */

const KEYS = [
  ['Timer', [
    ['Spatie vasthouden', 'Klaarzetten; loslaten start de tijd'],
    ['Spatie', 'Stopt een lopende tijd'],
    ['Spatie kort tikken', 'Start de inspectie, als die aanstaat'],
    ['Escape', 'Inspectie afbreken, selectie sluiten, grote weergave uit'],
    ['Tikken op het scherm', 'Hetzelfde als spatie, op een telefoon']
  ]],
  ['Op je matje', [
    ['Handen erop en er meteen af', 'Eén keer: inspectie. Twee keer snel: laatste tijd wissen'],
    ['Handen erop tot groen', 'Gewone start; telt nooit als een tik'],
    ['Resetknop op de timer', 'De app volgt, maar onderbreekt nooit een lopende solve']
  ]],
  ['In de lijst met tijden', [
    ['Tikken', 'Details van die solve'],
    ['Vasthouden', 'Snelacties: +2, DNF, ★, telt niet, verplaatsen, wissen'],
    ['Naar links vegen', 'Naar de vuilbak'],
    ['Naar rechts vegen', 'Kort: +2. Verder door: DNF'],
    ['selecteer', 'Meerdere tegelijk straffen, verplaatsen of wissen']
  ]]
];

function renderKeys() {
  el.keysBody.replaceChildren(...KEYS.map(([title, rows]) => {
    const block = document.createElement('section');
    block.className = 'records-block';
    const heading = document.createElement('h3');
    heading.textContent = title;
    const list = document.createElement('div');
    list.className = 'round-lines';
    for (const [key, what] of rows) {
      const row = document.createElement('div');
      const name = document.createElement('b');
      name.textContent = key;
      const detail = document.createElement('span');
      detail.textContent = what;
      row.append(name, detail);
      list.append(row);
    }
    block.append(heading, list);
    return block;
  }));
}

el.keysOpen.addEventListener('click', () => {
  el.keysOpen.blur();
  renderKeys();
  el.keysSheet.showModal();
});

el.keysClose.addEventListener('click', () => el.keysSheet.close());

/* ---------- records and looking back ----------

   Everything here is already in the save file; none of it is worth a number on
   the main screen but all of it is worth a look now and then. Kept in one sheet
   so it can be read like a page rather than hunted for in tiles. */

const MEDALS = ['🥇', '🥈', '🥉'];

/** A titled block, so every section below reads the same way. */
function recordBlock(title, body) {
  const section = document.createElement('section');
  section.className = 'records-block';
  const heading = document.createElement('h3');
  heading.textContent = title;
  section.append(heading, ...[body].flat().filter(Boolean));
  return section;
}

const line = (text, className = 'records-line') => {
  const p = document.createElement('p');
  p.className = className;
  p.textContent = text;
  return p;
};

function podiumBlock() {
  const top = fastest(solves, 3);
  if (!top.length) return null;

  const list = document.createElement('ol');
  list.className = 'podium';
  top.forEach((entry, place) => {
    const item = document.createElement('li');
    item.dataset.place = String(place + 1);
    const medal = document.createElement('span');
    medal.className = 'podium-medal';
    medal.textContent = MEDALS[place];
    const time = document.createElement('b');
    time.textContent = formatSolve(entry.solve);
    const when = document.createElement('small');
    when.textContent = entry.solve.at ? describeMoment(entry.solve.at) : '';
    item.append(medal, time, when);
    list.append(item);
  });
  return recordBlock('Je snelste drie', list);
}

function recordHistoryBlock() {
  const all = records(solves);
  if (all.length < 2) return null;

  const age = recordAge(solves);
  const list = document.createElement('ol');
  list.className = 'record-run';

  // Newest first: the one that still stands is the one you care about.
  all.slice().reverse().forEach((mark, index) => {
    const item = document.createElement('li');
    if (index === 0) item.dataset.standing = 'true';
    const time = document.createElement('b');
    time.textContent = formatTime(mark.ms);
    const when = document.createElement('small');
    const gained = mark.before === null ? 'eerste tijd' : `${formatTime(mark.before - mark.ms)} eraf`;
    when.textContent = `${mark.at ? new Date(mark.at).toLocaleDateString('nl-BE') : ''} · ${gained}`;
    item.append(time, when);
    list.append(item);
  });

  const head = age === null ? null
    : line(age === 0 ? 'Je record is van vandaag.' : `Je record staat ${age} ${age === 1 ? 'dag' : 'dagen'}.`, 'records-lead');
  return recordBlock('Hoe je record gezakt is', [head, list]);
}

function runsBlock() {
  const runs = bestRuns(solves, 5, 5);
  if (runs.length < 2) return null;

  const back = solves.flatMap((solve, index) => (counts(solve) ? [index] : []));
  const list = document.createElement('ol');
  list.className = 'record-run';

  runs.forEach((run, place) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    const time = document.createElement('b');
    time.textContent = formatTime(run.value);
    const where = document.createElement('small');
    where.textContent = `${place + 1}e · solve ${back[run.start] + 1} t/m ${back[run.end - 1] + 1}`;
    button.append(time, where);
    button.addEventListener('click', () => {
      el.recordsSheet.close();
      showSolves(`Beste ao5 #${place + 1}`, back.slice(run.start, run.end));
    });
    item.append(button);
    list.append(item);
  });
  return recordBlock('Je beste vijf op rij', list);
}

function whatIfBlock() {
  const drop = solves.length >= 20 ? 3 : 1;
  const shape = without(solves, drop);
  if (!shape || shape.now - shape.then < 50) return null;

  const many = drop === 1 ? 'je traagste solve' : `je ${drop} traagste solves`;
  return recordBlock('Wat als', [
    line(`Zonder ${many} was je gemiddelde ${formatTime(shape.then)} in plaats van ${formatTime(shape.now)}.`),
    line(`Dat scheelt ${formatTime(shape.now - shape.then)} — meer aan uitschieters dan aan tempo, als dat groot is.`, 'records-aside')
  ]);
}

function counterBlock() {
  const sum = totals(saveFile.sessions);
  if (!sum.solves) return null;

  const bits = [`${sum.solves} solves`, spellDuration(sum.ms), `${sum.days} ${sum.days === 1 ? 'dag' : 'dagen'}`];
  const strip = document.createElement('div');
  strip.className = 'counter-strip';
  for (const [value, label] of [[String(sum.solves), 'solves ooit'],
    [spellDuration(sum.ms), 'aan het draaien'], [String(sum.days), sum.days === 1 ? 'dag' : 'dagen']]) {
    const cell = document.createElement('div');
    const big = document.createElement('b');
    big.textContent = value;
    const small = document.createElement('small');
    small.textContent = label;
    cell.append(big, small);
    strip.append(cell);
  }

  const since = sum.since
    ? line(`Sinds ${new Date(sum.since).toLocaleDateString('nl-BE')}, over al je sessies samen.`, 'records-aside')
    : null;
  return recordBlock('De teller', [strip, since]);
}

function longAgoBlock() {
  const then = onThisDay(saveFile.sessions);
  if (!then.length) return null;

  const shown = then.slice(0, 3);
  return recordBlock('Op deze dag', shown.map((entry) => line(
    `${entry.years} jaar geleden, in ${entry.session}: ${formatSolve(entry.solve)}.`)));
}

/** What you have done in this session today, and how that compares. */
function todayBlock() {
  const today = dayOf({ at: Date.now() });
  const mine = counting(solves).filter((solve) => dayOf(solve) === today);
  if (mine.length < 3) return null;

  const days = new Map();
  for (const solve of counting(solves)) {
    const day = dayOf(solve);
    if (day === null) continue;
    days.set(day, (days.get(day) || 0) + 1);
  }
  const others = [...days.entries()].filter(([day]) => day !== today).map(([, count]) => count);
  const usual = others.length ? others.reduce((sum, n) => sum + n, 0) / others.length : null;

  const strip = document.createElement('div');
  strip.className = 'counter-strip';
  for (const [value, label] of [
    [String(mine.length), mine.length === 1 ? 'solve' : 'solves'],
    [formatTime(best(mine)), 'beste'],
    [formatTime(averageOf(mine, 5)), 'ao5']
  ]) {
    const cell = document.createElement('div');
    const big = document.createElement('b');
    big.textContent = value;
    const small = document.createElement('small');
    small.textContent = label;
    cell.append(big, small);
    strip.append(cell);
  }

  const versus = usual === null ? null : line(
    mine.length >= usual
      ? `Meer dan je gewone dag (${Math.round(usual)}).`
      : `Je gewone dag is er ${Math.round(usual)}.`,
    'records-aside');
  return recordBlock('Vandaag', [strip, versus]);
}

/** What each stretch usually costs you, over every solve that has marks. */
function splitsBlock() {
  const puzzle = currentSession().puzzle;
  const rows = counting(solves).map((solve) => phaseSpans(solve, puzzle)).filter((spans) => spans.length);
  if (rows.length < 3) return null;

  const names = phaseNames(puzzle);
  const list = document.createElement('div');
  list.className = 'round-lines';

  names.forEach((name, index) => {
    const times = rows.map((spans) => spans[index]?.ms).filter(Number.isFinite);
    if (!times.length) return;
    const mean = times.reduce((sum, t) => sum + t, 0) / times.length;
    const row = document.createElement('div');
    const label = document.createElement('span');
    label.textContent = name;
    const figure = document.createElement('b');
    figure.textContent = formatTime(mean);
    row.append(label, figure);
    list.append(row);
  });

  return recordBlock(`Gemiddeld per deel (${rows.length} solves)`, list);
}

function renderRecords() {
  el.recordsTitle.textContent = `Records — ${currentSession().name}`;
  const blocks = [
    todayBlock(), podiumBlock(), splitsBlock(), recordHistoryBlock(), runsBlock(),
    whatIfBlock(), longAgoBlock(), counterBlock()
  ].filter(Boolean);

  el.recordsBody.replaceChildren(...(blocks.length ? blocks
    : [line('Nog te weinig tijden om iets terug te kijken. Solve er een paar en kom terug.')]));
}

el.recordsOpen.addEventListener('click', () => {
  el.recordsOpen.blur();
  el.statsSheet.close();
  renderRecords();
  if (!openSheet(el.recordsSheet)) toast('Dit venster gaat niet open in deze browser.');
});

el.recordsClose.addEventListener('click', () => el.recordsSheet.close());

/* ---------- selecting several solves ---------- */

function renderSelection() {
  el.selectionBar.hidden = !selecting;
  el.body.toggleAttribute('data-selecting', selecting);
  el.selectMode.textContent = selecting ? 'stop selectie' : 'selecteer';
  el.selectionCount.textContent = `${selected.size} gekozen`;

  const none = selected.size === 0;
  for (const button of [el.selectionPlus2, el.selectionDnf, el.selectionMove, el.selectionDelete]) {
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

/* ---------- moving times to another session ----------

   Almost always because they were put in the wrong one: five 2x2 solves that
   landed in the 3x3 session because the picker was never touched. So moving
   across puzzles is the point rather than a mistake to guard against, and the
   list says which puzzle each session is for so you can see what you are doing.

   Times land among the ones already there rather than at the end, by the moment
   they were solved -- the same ordering a file from another device gets. */

/** The solves waiting to be moved, and where they came from. */
let moving = null;

function describeMoving(count) {
  return count === 1 ? 'Deze tijd' : `Deze ${count} tijden`;
}

function openMove(list, title) {
  if (!list.length) return;
  moving = { solves: list.slice(), from: saveFile.active };

  el.moveTitle.textContent = title;
  el.moveWhat.textContent = `${describeMoving(list.length)} uit ${currentSession().name}. `
    + (list.length === 1 ? 'Kies waar hij heen moet.' : 'Kies waar ze heen moeten.');

  el.moveList.replaceChildren(...saveFile.sessions.flatMap((session, index) => {
    if (index === moving.from) return [];
    const button = document.createElement('button');
    button.type = 'button';

    const name = document.createElement('b');
    name.textContent = labelSession(session);
    const grow = document.createElement('span');
    grow.className = 'grow';

    // The label already carries the puzzle when it is worth carrying, so the
    // line beside it only has the count to add.
    const about = document.createElement('small');
    about.textContent = `${session.solves.length} ${session.solves.length === 1 ? 'tijd' : 'tijden'}`;
    // A different puzzle is usually the whole reason for moving, so it is
    // pointed out rather than warned about.
    if (session.puzzle !== currentSession().puzzle) name.className = 'other';

    button.append(name, grow, about);
    button.addEventListener('click', () => moveTo(index));
    return [button];
  }));

  if (el.moveList.children.length === 0) {
    const only = document.createElement('p');
    only.className = 'import-note';
    only.textContent = 'Dit is je enige sessie. Maak er hieronder een aan.';
    el.moveList.append(only);
  }

  el.movePuzzle.replaceChildren(...PUZZLES.map((puzzle) => {
    const option = document.createElement('option');
    option.value = puzzle.id;
    option.textContent = puzzle.name;
    option.selected = puzzle.id === currentSession().puzzle;
    return option;
  }));
  el.moveName.value = '';

  // Opened from inside another sheet, which Safari has been known to refuse.
  if (!openSheet(el.moveSheet)) {
    moving = null;
    toast('Dit venster gaat niet open in deze browser.');
  }
}

/** Put them back exactly where they were, both sides. */
function undoMove(from, to, before) {
  const source = saveFile.sessions[from];
  const target = saveFile.sessions[to];
  if (!source || !target) return;
  source.solves = before.source;
  target.solves = before.target;
  solves = currentSession().solves;
  persist();
  render();
}

function moveTo(index) {
  if (!moving) return;
  const { solves: taken, from } = moving;
  const source = saveFile.sessions[from];
  const target = saveFile.sessions[index];
  if (!source || !target) return;

  const before = { source: source.solves.slice(), target: target.solves.slice() };
  const going = new Set(taken);

  source.solves = source.solves.filter((solve) => !going.has(solve));
  target.solves = inOrder([...target.solves, ...taken]);

  moving = null;
  el.moveSheet.close();
  setSelecting(false);
  solves = currentSession().solves;
  persist();
  render();

  toast(`${describeMoving(taken.length)} verplaatst naar ${target.name}.`, {
    label: 'Ongedaan maken',
    run: () => undoMove(from, index, before)
  });
}

el.moveCreate.addEventListener('click', () => {
  if (!moving) return;
  const wanted = el.moveName.value.trim().slice(0, 40);
  const puzzle = el.movePuzzle.value;
  saveFile.sessions.push({
    name: wanted || puzzleById(puzzle).name,
    puzzle,
    target: null,
    solves: []
  });
  moveTo(saveFile.sessions.length - 1);
});

el.moveClose.addEventListener('click', () => el.moveSheet.close());
el.moveSheet.addEventListener('close', () => { moving = null; });

el.selectionMove.addEventListener('click', () => {
  if (!selected.size) return;
  // In the list order, not the order they happened to be ticked in.
  openMove(solves.filter((solve) => selected.has(solve)), 'Verplaatsen');
});

el.quickMove.addEventListener('click', () => {
  const solve = solves[quickIndex];
  el.quickSheet.close();
  if (solve) openMove([solve], 'Verplaatsen');
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

  const spans = phaseSpans(solve, currentSession().puzzle);
  el.detailSplits.hidden = !spans.length;
  el.detailSplits.replaceChildren(...spans.map(({ name, ms }) => {
    const row = document.createElement('div');
    const label = document.createElement('span');
    label.textContent = name;
    const figure = document.createElement('b');
    figure.textContent = formatTime(ms);
    row.append(label, figure);
    return row;
  }));
  el.detailNote.value = solve.note || '';
  el.detailPlus2.dataset.active = String(solve.penalty === '+2');
  el.detailDnf.dataset.active = String(solve.penalty === 'DNF');
  el.detailSkip.dataset.active = String(solve.skip === true);
  el.detailStar.dataset.active = String(solve.star === true);
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

el.quickSkip.addEventListener('click', () => {
  const solve = markSolve(quickIndex, 'skip');
  el.quickSheet.close();
  if (solve) toast(solve.skip ? 'Telt niet mee in je gemiddelden.' : 'Telt weer mee.');
});

el.quickStar.addEventListener('click', () => {
  const solve = markSolve(quickIndex, 'star');
  el.quickSheet.close();
  if (solve) toast(solve.star ? 'Bewaard.' : 'Niet meer bewaard.');
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

/**
 * Flip a mark on a solve. Neither changes the time; one keeps it out of the
 * averages and the other makes it findable again later.
 */
function markSolve(index, mark) {
  const solve = solves[index];
  if (!solve) return null;
  if (solve[mark]) delete solve[mark];
  else solve[mark] = true;
  persist();
  render();
  return solve;
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

el.detailSkip.addEventListener('click', () => {
  const solve = markSolve(detailIndex, 'skip');
  if (solve) fillDetail();
  if (solve) toast(solve.skip ? 'Telt niet mee in je gemiddelden.' : 'Telt weer mee.');
});

el.detailStar.addEventListener('click', () => {
  const solve = markSolve(detailIndex, 'star');
  if (solve) fillDetail();
});

el.detailMove.addEventListener('click', () => {
  const solve = solves[detailIndex];
  el.detail.close();
  if (solve) openMove([solve], 'Verplaatsen');
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

/* ---------- the same save file in two windows ----------

   The app open twice over -- a tab and the installed one, say -- is two copies
   of the same times. The second window read the file when it opened and has
   held that copy ever since, so the first thing it saves wipes whatever was
   solved in the other one. Nothing warns you; the times are simply gone.

   The browser does say when another window writes. So this one takes the newer
   file over rather than writing across it. */

let writtenElsewhere = false;

window.addEventListener('storage', (event) => {
  if (event.key !== SAVE_KEY || event.newValue === null) return;
  writtenElsewhere = true;
  adoptElsewhere();
});

/** Only between solves: nobody wants the list rearranged mid-solve. */
function adoptElsewhere() {
  if (!writtenElsewhere || phase !== 'idle' || deleteArmed) return;
  writtenElsewhere = false;

  saveFile = load();
  solves = currentSession().solves;
  selecting = false;
  selected.clear();
  syncTargetUi();
  render();
  toast('Er is in een ander venster gesolved; deze lijst is nu bijgewerkt.');
}

/** Save, and say so once if this browser refuses to store anything. */
function persist() {
  if (save(saveFile) || storageWarned) return;
  storageWarned = true;
  toast('Deze browser bewaart niets (privémodus?). Je tijden blijven staan tot je de pagina herlaadt.');
}

function addSolve(ms, marks = []) {
  const previousBest = best(counting(solves));
  const solve = { ms, penalty: pendingPenalty, scramble, at: Date.now() };
  if (marks.length) solve.splits = marks;
  if (drilling) solve.case = drilling.id;
  solves.push(solve);
  pendingPenalty = 'none';
  persist();
  if (keepScramble) keepScramble = false;
  else newScramble();
  render();

  const rematchWas = rematch;
  rematch = null;
  renderRematch();
  delete el.repeatScramble.dataset.active;

  runAbsorb(solves[solves.length - 1]);
  judgeSolve(previousBest);

  if (rematchWas) sayHowThatWent(rematchWas, solves[solves.length - 1]);

  // Straight on to the next case, so drilling is one press per repetition.
  if (drilling && caseSet) {
    const entry = nextCase(caseSet.cases, drilling.group);
    if (entry) startCase(entry);
  }

  // The check comes after the celebration, so a record still gets its party
  // even when the camera is about to turn it into a DNF.
  watchCube(solves[solves.length - 1]);
}

/**
 * A record throws a full party, staying under the target gets confetti, and
 * going over it gets a short red pulse instead.
 */
function judgeSolve(previousBest) {
  const record = best(counting(solves));
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
  splitTimes = [];
  renderSplit();

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

  // Marks past the finish are a slip of the finger, not a stage.
  const marks = splitTimes.filter((mark) => mark < elapsed).map(Math.round);
  splitTimes = [];
  renderSplit();
  addSolve(Math.round(elapsed), marks);
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
    if (el.body.dataset.big === 'true') setBig(false);
    if (selecting) setSelecting(false);
    disarmDelete();
    cancelInspection();
    return;
  }
  if (event.code === 'Enter' && phase === 'running') {
    event.preventDefault();
    takeSplit();
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

  const midSolve = phase === 'running';
  el.connect.textContent = 'Verbind timer';
  el.deviceStatus.hidden = true;
  setHint(currentHint());
  el.deviceNote.textContent = 'Nog geen timer verbonden.';
  el.deviceDetails.hidden = true;
  el.importTimes.hidden = true;
  showManualPick(true);
  // Out of range, or a flat battery, in the middle of a solve. The clock on
  // screen is the app's own from here, and it keeps counting until someone
  // stops it -- so say that rather than let a good solve turn into a mystery.
  toast(midSolve
    ? 'Timer losgekoppeld tijdens je solve — de tijd loopt nu op de klok van de app. Druk op spatie of tik om te stoppen.'
    : 'Timer losgekoppeld.');
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

   The camera opens when a solve starts, finds the cube on the mat once the
   time has stopped, says only what that view can prove, and puts itself away.
   The one thing it is told is which square of the picture to bother with --
   see the uitsnede further down. */

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
// What the camera was handing over when the mat was learned. Turning a tablet
// round changes it, and with it every coordinate the picture of the mat and
// the four corners were written in.
let matShape = null;

async function useCamera(video) {
  if (camera) {
    video.srcObject = camera.stream;
    await video.play().catch(() => {});
    return camera;
  }
  camera = await openCamera(video);
  // A camera can be taken away again -- another app claims it, permission is
  // withdrawn, a webcam is unplugged. The stream does not throw when that
  // happens, it simply stops moving, and without this the reading would go on
  // studying the last frame it ever got.
  camera.stream.getVideoTracks().forEach((track) => track.addEventListener('ended', cameraLost));
  el.cameraState.textContent = `Camera werkt — ${camera.which}.`;
  return camera;
}

function cameraLost() {
  const open = el.lookSheet.open;
  clearInterval(lookTimer);
  lookTimer = null;
  lookLearning = false;
  releaseCamera();
  el.cameraState.textContent = 'De camera werd afgebroken. Een andere app heeft hem misschien overgenomen.';
  if (open) {
    el.lookStatus.textContent = 'Camera afgebroken';
    el.lookDetail.textContent = 'Een andere app heeft hem overgenomen, of de toestemming is ingetrokken.';
  } else {
    cameraTrouble = 'De camera werd afgebroken, dus deze solve is niet bekeken.';
  }
}

/** Plain words for a camera that will not open, in the settings and in a toast. */
function cameraFailed(error) {
  console.error('Camera:', error);
  const words = error?.name === 'NotAllowedError'
    ? 'Geen toegang tot de camera. Sta het toe in je browser.'
    : error?.name === 'NotFoundError'
      ? 'Geen camera gevonden op dit toestel.'
      : `Camera lukt niet — ${error?.name || ''} ${error?.message || error}`.trim();
  el.cameraState.textContent = words;
  return words;
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
  // Both windows let go of it, not just the corner one: a video element still
  // holding a stopped stream is a camera this page has not finished with.
  el.peekVideo.srcObject = null;
  el.lookVideo.srcObject = null;
}

/** Photographs of the empty mat, taken while the cube is in your hands. */
function collectEmpty() {
  emptyFrames = [];
  clearInterval(emptyTimer);
  emptyTimer = setInterval(() => {
    const frame = camera?.grab(FRAME_SIZE, settings.crop);
    if (!frame) return;
    emptyFrames.push(coarse(frame));
    if (emptyFrames.length > EMPTY_FRAMES) emptyFrames.shift();
  }, EMPTY_EVERY_MS);
}

/** Started when a solve starts, so the camera is warm by the time it is over. */
async function warmCamera() {
  if (!settings.camera) return;

  // Starting a solve calls off whatever the last one was still being judged
  // for -- that cube is off the mat now, and the picture of it is worthless.
  cameraSubject = null;
  clearInterval(cameraTimer);
  cameraTimer = null;
  el.cameraPeek.hidden = true;

  // An open camera used to mean there was nothing to do, which quietly skipped
  // the next solve: the frames of the empty mat were never collected, so there
  // was nothing to compare the cube against and the check was dropped without
  // a word.
  if (camera) { collectEmpty(); return; }

  try {
    await useCamera(el.peekVideo);
    collectEmpty();
  } catch (error) {
    // A solve is running; a camera that will not open is not worth interrupting
    // it for. It is said once, quietly, when the solve is over.
    cameraTrouble = cameraFailed(error);
  }
}

let cameraTrouble = null;
let silenceExplained = false; // said once, not after every solve

function watchCube(solve) {
  if (!settings.camera) return;
  if (cameraTrouble) { toast(cameraTrouble); cameraTrouble = null; return; }
  if (!camera) return;

  clearInterval(emptyTimer);
  emptyTimer = null;
  emptyMat = reference(emptyFrames);
  emptyFrames = [];

  // Not one photograph of the empty mat: either the solve was over within the
  // blink it takes to take one, or the camera opened but never handed a frame
  // over -- a page that was not allowed to start playing video, most likely.
  // It used to give up here without a word, which is what "soms rekent hij
  // niets aan" looked like from the outside.
  if (!emptyMat) {
    const blink = performance.now() - startedAt < EMPTY_EVERY_MS * 2;
    releaseCamera();
    if (!blink && !silenceExplained) {
      silenceExplained = true;
      toast('De camera ging open maar gaf geen beeld, dus deze solve is niet bekeken. Kijk eens bij instellingen → wat de camera ziet.');
    }
    return;
  }

  matShape = camera.shape();
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

  // The picture turned under it mid-solve; the mat it learned is of somewhere
  // else now. Better to say nothing than to say something about that.
  if (camera.shape() !== matShape) { releaseCamera(); return; }

  const frame = camera.grab(FRAME_SIZE, settings.crop);
  if (!frame) return;

  const reading = inspectFrame(frame, emptyMat, cropShape(settings.crop), settings.cubeColours);
  el.peekOutline.setAttribute('d', foundPath(reading.found));

  const sure = reading.verdict !== 'none' && reading.confidence >= CERTAIN;
  el.cameraPeek.dataset.state = sure
    ? (reading.verdict === '+2' ? 'one-move' : 'scrambled')
    : reading.found ? 'found' : 'looking';

  if (!sure) { lastReading = null; agreed = 0; return; }
  agreed = reading.verdict === lastReading ? agreed + 1 : 1;
  lastReading = reading.verdict;
  if (agreed < AGREEMENTS) return;

  offerVerdict(reading.verdict);
}

/**
 * Applied when it can prove it, offered when it can only guess.
 *
 * Guessing is what it does with no colours to go on: which stickers match which
 * has to come out of the picture alone, and swept over 972 setups that is wrong
 * about a solved cube roughly as often as it is right about a scrambled one --
 * nine false alarms against forty-three catches, and raising the bar only
 * trades one for the other. So without a taught cube it asks, and nothing
 * changes unless the button is pressed.
 *
 * Taught this cube's six colours, it is not guessing any more. Every cell goes
 * to the nearest known colour and the patches those make are counted: three, one
 * per visible face, is a solved cube. Over 108 setups across four different
 * lights that is wrong once, and catches every single one-move and scrambled
 * cube -- including the +2, which counting colours could never see at all. That
 * is worth acting on, with an undo for the once.
 */
function offerVerdict(verdict) {
  const solve = cameraSubject;
  const index = solves.indexOf(solve);
  const taught = settings.cubeColours.length >= ALL_SIX;
  releaseCamera();
  if (index < 0 || verdict === 'none') return;

  const apply = () => {
    if (solves.indexOf(solve) < 0) return false;
    solve.penalty = verdict;
    persist();
    render();
    cue('miss');
    return true;
  };

  if (!taught) {
    toast('Camera denkt: meer dan één zet ernaast.', {
      label: 'DNF zetten',
      run: () => { if (apply()) toast(`DNF gezet op ${formatSolve(solve)}.`); }
    });
    return;
  }

  const was = solve.penalty || 'none';
  if (!apply()) return;
  toast(verdict === '+2'
    ? `Eén zet ernaast — +2 op ${formatSolve(solve)}.`
    : `Meer dan één zet ernaast — DNF op ${formatSolve(solve)}.`, {
    label: 'Toch niet',
    run: () => {
      if (solves.indexOf(solve) < 0) return;
      solve.penalty = was;
      persist();
      render();
      toast(`Straf weer weg bij ${formatSolve(solve)}.`);
    }
  });
}

/* ---------- watching it work ----------

   The same two steps a solve goes through, only visible: learn the empty mat,
   then read whatever is put on it. Worth having because everything that can go
   wrong is a thing about the room -- where the phone stands, how the light
   falls, how big the cube comes out -- and none of that is answerable from a
   description. */

const LEARN_MS = 2600;

let lookTimer = null;
let lookLearning = false;
// Nudging the crop twice in a row starts two learns, and the older one landing
// after the newer had begun used to wipe what the newer had collected.
let learning = 0;

/** Plain words for what the reading came back with. */
const LOOK_WORDS = {
  'geen kubus': ['Niets nieuws op het matje', 'Leg er een kubus op.'],
  'geen kubusvorm': ['Dat heeft geen kubusvorm', 'Te langwerpig of te rafelig — een hand erbij?'],
  'niet volledig in beeld': ['Valt buiten beeld', 'Zet de telefoon verder weg of schuif de kubus naar het midden.'],
  'te klein in beeld': ['Te klein in beeld', 'Zet de camera dichterbij, of trek de vier hoeken strakker om je matje.'],
  'niet leesbaar': ['Niet te lezen', 'Te donker, of te weinig van de kubus in zicht.'],
  'niet zeker genoeg': ['Niet zeker genoeg', 'Hier zou hij zwijgen en je solve met rust laten.'],
  'te weinig zicht': ['Te weinig zicht', 'Genoeg om te zien dat er iets ligt, te weinig om iets te bewijzen.'],
  'te klein om te oordelen': ['Te klein om iets te durven zeggen', 'Hij leest hem wel, maar zo klein in beeld splitst hij drie kleuren net zo makkelijk in zes. Trek de hoeken strakker om je matje.'],
  'niets te zien': ['Niets aan te merken', 'Eén vlek per zichtbaar vlak — zo ziet een opgeloste kubus eruit.'],
  'een zet ernaast': ['Eén zet ernaast', 'Een streep van een andere kleur over twee vlakken. Dit wordt een +2.'],
  'kleuren kloppen niet': ['Kleuren kloppen niet', 'Veel hiervan lijkt op geen van de geleerde kleuren. Ander licht? Leer de kleuren opnieuw.'],
  'niets te bewijzen': ['Niets aan te merken', 'Te weinig kleuren voor een straf — hier laat hij je solve met rust. Let op: drie vlakken kunnen opgelost niet bewijzen, alleen niet tegenspreken.'],
  'meer dan een zet': ['Meer dan één zet ernaast', 'Dit zou een DNF voorstellen.']
};

function lookOnce() {
  if (!camera) return;
  const frame = camera.grab(FRAME_SIZE, settings.crop);
  if (!frame) return;

  // Turned the tablet round: what was learned was of the picture as it stood,
  // and the corners were drawn on it. Both have to be looked at again.
  if (!lookLearning && matShape && camera.shape() !== matShape) {
    learnMat();
    el.lookDetail.textContent = 'Het beeld is gedraaid — kijk of de vier hoeken nog op je matje staan.';
    return;
  }

  if (lookLearning) {
    emptyFrames.push(coarse(frame));
    if (emptyFrames.length > EMPTY_FRAMES) emptyFrames.shift();
    return;
  }

  const reading = inspectFrame(frame, emptyMat, cropShape(settings.crop), settings.cubeColours);
  el.lookOutline.setAttribute('d', foundPath(reading.found));

  let [headline, detail] = LOOK_WORDS[reading.state] || [reading.state, ''];
  // Advice to crop harder is no use to someone who has already cropped as hard
  // as their camera can stand -- past a point the picture stops gaining detail
  // and only loses room.
  if (reading.state === 'te klein in beeld' && frame.width < FRAME_SIZE) {
    detail = `Je camera geeft hier maar ${frame.width} pixels; strakker bijsnijden levert niets meer op. Zet de camera dichterbij.`;
  }
  el.lookStatus.textContent = headline;
  el.lookStatus.dataset.sure = String(reading.verdict !== 'none');
  el.lookDetail.textContent = reading.patches !== undefined
    ? `${detail} · ${reading.patches} vlek${reading.patches === 1 ? '' : 'ken'}, ${reading.colours} kleuren, zekerheid ${Math.round(reading.confidence * 100)}%`
    : reading.colours
      ? `${detail} · ${reading.colours} kleuren, zekerheid ${Math.round(reading.confidence * 100)}%`
      : detail;
}

function learnMat() {
  const round = ++learning;
  lookLearning = true;
  emptyFrames = [];
  emptyMat = null;
  el.lookOutline.setAttribute('d', '');
  el.lookStatus.textContent = 'Het lege matje leren…';
  el.lookStatus.dataset.sure = 'false';
  el.lookDetail.textContent = `Haal de kubus even weg. Dit is wat er tijdens je solve ook gebeurt. · ${camera?.which || 'camera'}`;

  setTimeout(() => {
    if (!lookTimer || round !== learning) return;
    emptyMat = reference(emptyFrames);
    emptyFrames = [];
    lookLearning = false;
    matShape = camera?.shape() ?? null;
    if (!emptyMat) {
      el.lookStatus.textContent = 'Geen beeld van het matje';
      el.lookDetail.textContent = '';
    }
  }, LEARN_MS);
}

/* ---------- the shape that gets read ----------

   A camera set up so a whole desk fits spends most of its pixels on the desk.
   Marking out the mat is the difference between nine stickers coming out six
   pixels across and coming out two, and it is the reason the reading kept
   coming back "te klein in beeld".

   Four corners rather than a box, because a camera on a chair sees the mat as
   a trapezium. A box drawn around that trapezium takes in the desk at two of
   its corners, and a hand or a phone landing there reads as something arriving
   on the mat. The corners are stored in the camera's own coordinates, so they
   survive the preview being mirrored. */

/** No smaller than this across, or there is nothing left to look at. */
const MIN_CROP = 0.12;

const CORNER_NAMES = ['linksboven', 'rechtsboven', 'rechtsonder', 'linksonder'];

/** Puts the handles, the outline and the corner window where the crop says. */
function showCrop() {
  const corners = settings.crop.corners;

  el.cropHandles.forEach((handle, i) => {
    handle.style.left = `${corners[i][0] * 100}%`;
    handle.style.top = `${corners[i][1] * 100}%`;
  });

  const path = corners.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ') + ' Z';
  el.cropOutline.setAttribute('d', path);
  // The frame's own outline first, then the mat's, filled even-odd: what is
  // left dark is everything the camera is being told to ignore.
  el.cropShade.setAttribute('d', `M0 0 H1 V1 H0 Z ${path}`);

  // What the reading draws is drawn in the coordinates of the square that was
  // grabbed, so the layer it is drawn on is put over exactly that square.
  const box = cropBox(settings.crop);
  const guide = el.lookGuide.style;
  guide.left = `${(box.x - box.size / 2) * 100}%`;
  guide.top = `${(box.y - box.size / 2) * 100}%`;
  guide.width = `${box.size * 100}%`;
  guide.height = `${box.size * 100}%`;

  // The little window in the corner shows that same square, blown up to fill
  // it, rather than the room around it.
  el.peekVideo.style.transform =
    `scale(${1 / box.size}) translate(${(0.5 - box.x) * 100}%, ${(0.5 - box.y) * 100}%)`;
}

/** How wide and tall the four corners reach. */
function cropSpan(corners) {
  const xs = corners.map(([x]) => x);
  const ys = corners.map(([, y]) => y);
  return Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
}

/** Takes the corners if they leave anything worth looking at, and shows them. */
function setCrop(corners) {
  const held = corners.map(([x, y]) => [
    Math.min(Math.max(x, 0), 1),
    Math.min(Math.max(y, 0), 1)
  ]);
  if (cropSpan(held) < MIN_CROP) return;
  settings.crop = { corners: held };
  showCrop();
}

/**
 * Where a finger is, in the camera's coordinates. The preview is mirrored, so
 * left on the screen is right in the picture; that flip happens here and
 * nowhere else.
 */
function atPointer(event) {
  const rect = el.lookFrame.getBoundingClientRect();
  const within = (value, size) => Math.min(Math.max(value / size, 0), 1);
  return [
    1 - within(event.clientX - rect.left, rect.width),
    within(event.clientY - rect.top, rect.height)
  ];
}

let cropDrag = null;

/**
 * @param {number|null} corner which one is being pulled, or null to slide the
 * whole shape about without changing it.
 */
function startCropDrag(event, corner) {
  event.preventDefault();
  const at = atPointer(event);
  // Every drag keeps hold of the spot you grabbed rather than snapping to it,
  // so nothing jumps out from under your finger on the first pixel of movement.
  cropDrag = {
    corner,
    from: settings.crop.corners.map((c) => c.slice()),
    grabbed: at
  };
  el.cropShape.dataset.dragging = 'true';
}

function dragCrop(event) {
  if (!cropDrag) return;
  event.preventDefault();
  const [x, y] = atPointer(event);
  const dx = x - cropDrag.grabbed[0];
  const dy = y - cropDrag.grabbed[1];

  if (cropDrag.corner === null) {
    setCrop(cropDrag.from.map(([cx, cy]) => [cx + dx, cy + dy]));
    return;
  }
  const moved = cropDrag.from.map((c) => c.slice());
  const [cx, cy] = cropDrag.from[cropDrag.corner];
  moved[cropDrag.corner] = [cx + dx, cy + dy];
  setCrop(moved);
}

/** A different shape means the mat was learned through the wrong window. */
function cropSettled() {
  storeSettings();
  if (lookTimer) learnMat();
}

function endCropDrag() {
  if (!cropDrag) return;
  cropDrag = null;
  delete el.cropShape.dataset.dragging;
  cropSettled();
}

el.cropHandles.forEach((handle, i) => {
  handle.title = `Hoek ${CORNER_NAMES[i]}`;
  handle.setAttribute('aria-label', `Hoek ${CORNER_NAMES[i]}`);
  handle.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
    startCropDrag(event, i);
  });
});

el.cropShape.addEventListener('pointerdown', (event) => startCropDrag(event, null));
window.addEventListener('pointermove', dragCrop, { passive: false });
window.addEventListener('pointerup', endCropDrag);
window.addEventListener('pointercancel', endCropDrag);

el.cropReset.addEventListener('click', () => {
  el.cropReset.blur();
  setCrop(FULL_FRAME.corners.map((corner) => corner.slice()));
  cropSettled();
});

showCrop(); // whatever came out of storage, already cleaned up on the way in

/** Opening a sheet from inside another one has been known to throw on Safari. */
function openSheet(sheet) {
  try {
    sheet.showModal();
  } catch {
    sheet.show();
  }
  return sheet.open;
}

el.cameraLook.addEventListener('click', async () => {
  el.cameraLook.blur();
  el.lookStatus.textContent = 'Camera starten…';
  el.lookStatus.dataset.sure = 'false';
  el.lookDetail.textContent = '';
  el.lookOutline.setAttribute('d', '');

  if (!openSheet(el.lookSheet)) {
    toast('Dit venster gaat niet open in deze browser.');
    return;
  }

  try {
    await useCamera(el.lookVideo);
    el.lookStatus.textContent = `Camera aan — ${camera.which}`;
  } catch (error) {
    el.lookStatus.textContent = 'Camera lukt niet';
    el.lookDetail.textContent = cameraFailed(error);
    return;
  }

  if (!el.lookSheet.open) { releaseCamera(); return; }
  lookTimer = setInterval(lookOnce, LOOK_EVERY_MS);
  learnMat();
});

/* ---------- teaching it this cube's colours ----------

   The reading was unsupervised: work out from the picture alone which stickers
   match which. That is the part that kept going wrong, because under noise it
   would split one face into two tidy groups and nothing in the arithmetic knew
   better. Shown the six colours of the cube once, it no longer has to guess:
   every cell goes to the nearest of six known colours, the patches those make
   are counted, and a solved cube is three patches -- one per visible face.

   Two goes are needed, because a cube on a mat only ever shows three of its six
   faces. Put it down, teach, turn it over, teach again. */

/** Near enough to be the same sticker colour, so a second go does not add
    six more of what it already has. */
const SAME_COLOUR = 0.03;

function showColours() {
  const learned = settings.cubeColours;
  el.colourSwatches.replaceChildren(...learned.map(([x, y]) => {
    const swatch = document.createElement('i');
    // Chromaticity back to something to look at: the proportions are what was
    // kept, so pick the brightest colour with those proportions.
    const parts = [x, y, Math.max(0, 1 - x - y)];
    const scale = 255 / Math.max(...parts);
    swatch.style.background = `rgb(${parts.map((p) => Math.round(p * scale)).join(' ')})`;
    return swatch;
  }));
  el.colourCount.textContent = learned.length
    ? `${learned.length} van ${ALL_SIX} kleuren${learned.length >= ALL_SIX ? ' — compleet' : ''}`
    : 'nog geen kleuren';
  el.learnColours.dataset.done = String(learned.length >= ALL_SIX);
  el.learnColours.textContent = learned.length
    ? (learned.length >= ALL_SIX ? 'Opnieuw leren' : 'Draai hem om en leer de rest')
    : 'Kleuren van deze kubus leren';

  el.cameraBlurb.textContent = learned.length >= ALL_SIX
    ? 'Zodra de tijd stopt zoekt de camera de kubus op het matje, telt de vlekken en zet zelf een +2 of een DNF — met een knop om het terug te draaien. Hij kent de kleuren van je kubus.'
    : 'Zodra de tijd stopt zoekt de camera de kubus op het matje. Leer hem eerst de kleuren van je kubus bij "wat de camera ziet" — dan ziet hij een +2 en een DNF zelf. Zonder dat kan hij alleen gokken, en dan vraagt hij het.';
}

el.learnColours.addEventListener('click', () => {
  el.learnColours.blur();
  if (!camera || !emptyMat) {
    el.lookStatus.textContent = 'Eerst het matje leren';
    el.lookDetail.textContent = 'Haal de kubus even weg, wacht tot hij het matje kent, en leg hem er dan op.';
    return;
  }

  // Six already means this is a fresh start under a different light.
  if (settings.cubeColours.length >= ALL_SIX) settings.cubeColours = [];

  const frame = camera.grab(FRAME_SIZE, settings.crop);
  const found = frame && findCube(frame, emptyMat, cropShape(settings.crop));
  if (!found || found.rejected) {
    el.lookStatus.textContent = 'Geen kubus gezien';
    el.lookDetail.textContent = 'Leg je opgeloste kubus midden op het matje, binnen de vier hoeken.';
    return;
  }

  const learned = learnColours(found);
  if (!learned) {
    el.lookStatus.textContent = 'Kleuren niet af te lezen';
    el.lookDetail.textContent = 'Te donker, of de kubus komt te klein uit.';
    return;
  }

  const before = settings.cubeColours.length;
  const kept = settings.cubeColours.slice();
  for (const colour of learned.colours) {
    if (!kept.some((known) => Math.hypot(known[0] - colour[0], known[1] - colour[1]) < SAME_COLOUR)) {
      kept.push(colour);
    }
  }
  settings.cubeColours = kept.slice(0, ALL_SIX);
  storeSettings();
  showColours();

  const added = settings.cubeColours.length - before;
  el.lookStatus.textContent = added ? `${added} kleur${added === 1 ? '' : 'en'} erbij` : 'Deze kende hij al';
  el.lookDetail.textContent = settings.cubeColours.length >= ALL_SIX
    ? 'Alle zes binnen. Vanaf nu leest hij de vlakken in plaats van kleuren te tellen — een +2 ziet hij nu ook.'
    : 'Draai de kubus zodat er drie andere vlakken boven liggen, leg hem terug en druk nog eens.';
});

showColours();

el.lookRelearn.addEventListener('click', () => { if (lookTimer) learnMat(); });
el.lookClose.addEventListener('click', () => el.lookSheet.close());

el.lookSheet.addEventListener('close', () => {
  clearInterval(lookTimer);
  lookTimer = null;
  lookLearning = false;
  // A solve is not running while the settings are open, so this camera is ours
  // to put away.
  releaseCamera();
  el.lookVideo.srcObject = null;
});

/**
 * The permission question, asked at the first touch of the page instead of in
 * the middle of a solve. It cannot be asked on load: a browser will only put
 * that question up in answer to something the user did, so the first thing the
 * user does is what it waits for.
 */
let permissionAsked = false;

async function askEarly() {
  if (permissionAsked || !settings.camera) return;
  permissionAsked = true;
  el.cameraState.textContent = 'Toestemming vragen…';
  const answer = await askForCamera();
  el.cameraState.textContent = answer === 'toegestaan'
    ? 'Camera toegestaan.'
    : `Camera ${answer}.`;
  if (answer !== 'toegestaan') toast(`Camera ${answer}. Zet de controle uit als je hem niet wilt.`);
}

for (const moment of ['pointerdown', 'keydown']) {
  addEventListener(moment, askEarly, { once: true, passive: true });
}

el.cameraAllow.addEventListener('click', () => {
  el.cameraAllow.blur();
  permissionAsked = false;
  askEarly();
});

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
  if (document.visibilityState === 'visible') {
    keepAwake();
    adoptElsewhere(); // it may have been the other window you were away in
    return;
  }
  // Away from the page, the camera goes off. Nobody wants a lens still live
  // behind another app, and the frames it would keep grabbing are of a page
  // the browser has stopped painting anyway.
  if (el.lookSheet.open) el.lookSheet.close();
  else releaseCamera();
});

// Safari on iOS can put a page away without ever calling it hidden.
window.addEventListener('pagehide', () => releaseCamera());

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
  renderSplit();
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
  bindSwitch('set-splits', 'splits'),
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
  text: { build: sessionAsText, label: 'als tekst', extension: 'txt', type: 'text/plain' },
  csv: { build: sessionAsCsv, label: 'als csv', extension: 'csv', type: 'text/csv' },
  cstimer: { build: sessionAsCstimer, label: 'voor cstimer', extension: 'json', type: 'application/json' }
};

/** A file name out of the session's own name, safe on every filesystem. */
const fileNameFor = (extension) => {
  const stem = currentSession().name.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase();
  return `${stem || 'sessie'}-${backupName().slice(10, 20)}.${extension}`;
};

el.exportFormat.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  exportFormat = button.dataset.value;
  markGroup(el.exportFormat, exportFormat);
});

el.exportSave.addEventListener('click', () => {
  el.exportSave.blur();
  if (!solves.length) {
    toast('Nog geen tijden om te bewaren.');
    return;
  }
  const { build, extension, type } = EXPORTS[exportFormat] || EXPORTS.text;
  const name = fileNameFor(extension);
  offerFile(name, build(), type);
  toast(`${solves.length} tijden bewaard als ${name}.`);
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

/* ---------- carrying it all to another device ----------

   A new phone, or a tablet in the morning and a phone in the evening. One file
   holds every session, and folding it in merges rather than overwrites, so it
   can go back and forth without either side losing an afternoon. */

/** Hand a file to whatever the device does with files. */
function offerFile(name, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const address = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = address;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoked late: Safari has been known to still be reading it.
  setTimeout(() => URL.revokeObjectURL(address), 20000);
}

/** Read a file the user picked, or say plainly that it could not be read. */
async function textOf(input) {
  const file = input.files?.[0];
  input.value = ''; // so picking the same file twice still counts as a change
  if (!file) return null;
  try {
    return { name: file.name, text: await file.text() };
  } catch {
    toast('Dat bestand kon niet gelezen worden.');
    return null;
  }
}

let arriving = null; // a file read and understood, waiting to be folded in

function showTransfer() {
  const sessions = saveFile.sessions.length;
  const times = saveFile.sessions.reduce((sum, session) => sum + session.solves.length, 0);
  el.transferHere.textContent = times
    ? `${sessions} ${sessions === 1 ? 'sessie' : 'sessies'}, ${times} ${times === 1 ? 'tijd' : 'tijden'}.`
    : 'Nog geen tijden op dit toestel.';
  el.transferSave.disabled = !times;
  el.transferShare.disabled = !times;
  el.transferChoice.hidden = true;
  arriving = null;
}

/** Sharing a file straight from the app is what makes AirDrop one tap. */
const canShareFiles = () => {
  if (!navigator.canShare || !navigator.share) return false;
  try {
    return navigator.canShare({ files: [new File(['{}'], 'x.json', { type: 'application/json' })] });
  } catch {
    return false;
  }
};

el.transferOpen.addEventListener('click', () => {
  el.transferOpen.blur();
  el.transferShare.hidden = !canShareFiles();
  el.transferThere.textContent = 'Kies het bestand dat je op je andere toestel bewaard hebt.';
  showTransfer();
  el.transferSheet.showModal();
});

el.transferClose.addEventListener('click', () => el.transferSheet.close());
el.transferSheet.addEventListener('close', () => { arriving = null; });

el.transferSave.addEventListener('click', () => {
  el.transferSave.blur();
  offerFile(backupName(), JSON.stringify(buildBackup(saveFile, settings)));
  toast('Bestand bewaard. Zet het op je andere toestel en open het daar.');
});

el.transferShare.addEventListener('click', async () => {
  el.transferShare.blur();
  const file = new File([JSON.stringify(buildBackup(saveFile, settings))], backupName(),
    { type: 'application/json' });
  try {
    await navigator.share({ files: [file], title: 'Cubetimer' });
  } catch (error) {
    // Closing the share sheet is not a failure and is not worth a word.
    if (error?.name !== 'AbortError') toast('Versturen lukte niet; bewaar het bestand dan gewoon.');
  }
});

el.transferPick.addEventListener('click', () => {
  el.transferPick.blur();
  el.transferFile.click();
});

el.transferFile.addEventListener('change', async () => {
  const picked = await textOf(el.transferFile);
  if (!picked) return;

  try {
    const incoming = readBackup(picked.text);
    const look = summarise(incoming, saveFile);
    arriving = incoming;

    const when = look.saved ? ` van ${new Date(look.saved).toLocaleDateString('nl-BE')}` : '';
    const times = (count) => `${count} ${count === 1 ? 'tijd' : 'tijden'}`;
    el.transferThere.textContent = look.added
      ? `${picked.name}${when}: ${look.sessions} ${look.sessions === 1 ? 'sessie' : 'sessies'}, `
        + `${times(look.times)} — daarvan ${look.added} nieuw voor dit toestel`
        + (look.known ? `, ${look.known} staan er al` : '')
        + (look.newSessions ? `, ${look.newSessions} nieuwe ${look.newSessions === 1 ? 'sessie' : 'sessies'}` : '')
        + '.'
      : `${picked.name}${when}: alles wat erin staat heb je hier al.`;
    el.transferChoice.hidden = false;
    el.transferMerge.disabled = !look.added;
  } catch (error) {
    arriving = null;
    el.transferChoice.hidden = true;
    el.transferThere.textContent = error.message;
  }
});

function fold(how) {
  if (!arriving) return;
  const folded = foldIn(saveFile, arriving, how);
  saveFile = { active: folded.active, sessions: folded.sessions };
  solves = currentSession().solves;
  selecting = false;
  selected.clear();

  // Only what the file carried, and only over what this device has not been
  // told otherwise -- the camera's own settings are never in there to begin
  // with, so they cannot be trodden on.
  if (arriving.settings && Object.keys(arriving.settings).length) {
    settings = { ...settings, ...arriving.settings };
    storeSettings();
    applySettings();
  }

  persist();
  syncTargetUi();
  render();
  el.transferSheet.close();
  const count = `${folded.added} ${folded.added === 1 ? 'tijd' : 'tijden'}`;
  toast(how === 'replace'
    ? `Alles vervangen: ${count}.`
    : `${count} erbij${folded.known ? `, ${folded.known} stonden er al` : ''}.`);
}

el.transferMerge.addEventListener('click', () => fold('merge'));

el.transferReplace.addEventListener('click', () => {
  const times = saveFile.sessions.reduce((sum, session) => sum + session.solves.length, 0);
  if (!times || confirm(`Alles op dit toestel weggooien en vervangen door het bestand? ${times} tijden verdwijnen.`)) {
    fold('replace');
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

el.pastePick.addEventListener('click', () => {
  el.pastePick.blur();
  el.pasteFile.click();
});

el.pasteFile.addEventListener('change', async () => {
  const picked = await textOf(el.pasteFile);
  if (!picked) return;

  // A whole-app backup picked here is not what this sheet is for, and reading
  // it as a list of times would find nothing. Say where it belongs instead.
  if (/"cubetimer"\s*:/.test(picked.text) || /"session1"\s*:/.test(picked.text)) {
    el.pasteNote.textContent = 'Dit is een heel bestand met sessies erin. Gebruik "naar een ander toestel" — daar blijven je sessies, scrambles en notities heel.';
    return;
  }

  el.pasteInput.value = picked.text.slice(0, 200000);
  describePaste();
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
