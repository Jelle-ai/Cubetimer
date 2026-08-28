import {
  GROUPS as PUZZLE_GROUPS, PUZZLES, nextScramble, puzzleById, randomMoveScramble, seeded, warmUp
} from './scramble.js';
import { bluetoothAvailable, connectGanTimer, isSupported, TimerState } from './gan-timer.js';
import {
  averageOf, best, bestAverageAt, bestAverageOf, bestMeanAt, bestMeanOf, counting, counts,
  effective, formatSolve, formatTime, meanOf, sessionMean, setDecimals, setUnit, worst
} from './stats.js';
import { KEY as SAVE_KEY, SAVE_BASE, load, save } from './store.js';
import { backupName, buildBackup, foldIn, inOrder, readBackup, summarise } from './backup.js';
import {
  bestRuns, byDay, diary, fastest, onThisDay, recordAge, records, spellDuration, totals,
  without, yearOfDays
} from './history.js';
import { badges, newlyWon, tally, wonIds } from './badges.js';
import { card as bingoCard, lines as bingoLines } from './bingo.js';
import { cardFor, drawCard, readShared, shareLink } from './share.js';
import { MODES, absorb, begin, describe, expired, hushed, ownsSolves, result, runSolves } from './modes.js';
import {
  bestOf, caseStanding, cleanPlay, dailyHistory, dailyStreak, dayStamp, dropMyAlg, dropSet, markGraduated,
  duelTally, keepMyAlg, keepNote, keepSet, markStep, myAlgs, noteOf, recordSpin, recordSpot,
  setsOf, spinTally, spotStanding, stepDone,
  recordCase, recordDaily, recordDuel, recordRun, runsOf, scoreOf, spellScore
} from './play.js';
import { recallStanding, whenDue } from './recall.js';
import { COUNTS, RULES, countOf, countText, darePart, readDareLink, ruleOf, spin } from './slot.js';
import {
  DEMO_SCRAMBLE, MAP, STEPS, cubeAfter, hoursLeft, howFar, isOpen, nextStep, roadPath, stepAt
} from './course.js';
import { makeCube } from './cube3d.js';
import {
  COLOR_SLOTS, LED_COLORS, SETTINGS_BASE, SKINS, colorOf, loadSettings, saveSettings
} from './settings.js';
import {
  addPerson, current as currentPerson, dropPerson, keyFor, people, recolourPerson,
  renamePerson, shared as sharedDevice, usePerson
} from './who.js';
import * as cloud from './cloud.js';
import { chord, confetti, flashMiss, together, tone, vibrate } from './feedback.js';
import { hasPreview, previewOf } from './preview.js';
import { drawLastLayer, lastLayerOf } from './diagram.js';
import {
  dayName, formatDuration, meetsGoal, practiceByDay, progress, streaks, today
} from './practice.js';
import { bindStatic, currentLang, guessLang, locale, onLangChange, setLang, startLang, t } from './lang.js';
import {
  aimAt, fairAverage, inspectionPays, learnedWhen, sessionShape, thenAndNow, trend,
  weakCase, weakStage, worstSolves
} from './insight.js';

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
  eventExtra: document.getElementById('event-extra'),
  whoOpen: document.getElementById('who-open'),
  whoSheet: document.getElementById('who-sheet'),
  whoClose: document.getElementById('who-close'),
  whoList: document.getElementById('who-list'),
  whoName: document.getElementById('who-name'),
  whoAdd: document.getElementById('who-add'),
  whoCloud: document.getElementById('who-cloud'),
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
  shareOpen: document.getElementById('share-open'),
  recordsSheet: document.getElementById('records-sheet'),
  recordsTitle: document.getElementById('records-title'),
  recordsClose: document.getElementById('records-close'),
  recordsBody: document.getElementById('records-body'),
  shareSheet: document.getElementById('share-sheet'),
  shareClose: document.getElementById('share-close'),
  shareWhat: document.getElementById('share-what'),
  shareImage: document.getElementById('share-image'),
  shareName: document.getElementById('share-name'),
  shareSave: document.getElementById('share-save'),
  shareSend: document.getElementById('share-send'),
  shareLink: document.getElementById('share-link'),
  cubeName: document.getElementById('cube-name'),
  cubeAdd: document.getElementById('cube-add'),
  cubeList: document.getElementById('cube-list'),
  crossFace: document.getElementById('cross-face'),
  skins: document.getElementById('skins'),
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
  pasteSheet: document.getElementById('paste-sheet'),
  pasteInput: document.getElementById('paste-input'),
  pasteNote: document.getElementById('paste-note'),
  pasteAdd: document.getElementById('paste-add'),
  pasteClose: document.getElementById('paste-close'),
  pastePick: document.getElementById('paste-pick'),
  pasteFile: document.getElementById('paste-file'),
  exportSave: document.getElementById('export-save'),
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
  scrambleTaste: document.getElementById('scramble-taste'),
  setSheet: document.getElementById('set-sheet'),
  setTitle: document.getElementById('set-title'),
  setClose: document.getElementById('set-close'),
  setName: document.getElementById('set-name'),
  setGrid: document.getElementById('set-grid'),
  setCount: document.getElementById('set-count'),
  setAll: document.getElementById('set-all'),
  setNone: document.getElementById('set-none'),
  setUnknown: document.getElementById('set-unknown'),
  setSlow: document.getElementById('set-slow'),
  setDue: document.getElementById('set-due'),
  setSave: document.getElementById('set-save'),
  setDrop: document.getElementById('set-drop'),
  casesSheet: document.getElementById('cases-sheet'),
  casesTitle: document.getElementById('cases-title'),
  casesClose: document.getElementById('cases-close'),
  casesGroups: document.getElementById('cases-groups'),
  casesBody: document.getElementById('cases-body'),
  casesFilter: document.getElementById('cases-filter'),
  paperSheet: document.getElementById('paper-sheet'),
  paperTitle: document.getElementById('paper-title'),
  paperClose: document.getElementById('paper-close'),
  paperGroups: document.getElementById('paper-groups'),
  paperFilter: document.getElementById('paper-filter'),
  paperBody: document.getElementById('paper-body'),
  paperPrint: document.getElementById('paper-print'),
  paperSave: document.getElementById('paper-save'),
  paperCopy: document.getElementById('paper-copy'),
  slotSheet: document.getElementById('slot-sheet'),
  slotClose: document.getElementById('slot-close'),
  slotReels: document.getElementById('slot-reels'),
  slotTabs: document.getElementById('slot-tabs'),
  slotMachine: document.getElementById('slot-machine'),
  slotGo: document.getElementById('slot-go'),
  slotBody: document.getElementById('slot-body'),
  courseSheet: document.getElementById('course-sheet'),
  courseClose: document.getElementById('course-close'),
  courseRoad: document.getElementById('course-road'),
  courseCube: document.getElementById('course-cube'),
  courseTools: document.getElementById('course-tools'),
  certSheet: document.getElementById('cert-sheet'),
  certClose: document.getElementById('cert-close'),
  certPaper: document.getElementById('cert-paper'),
  certName: document.getElementById('cert-name'),
  certPrint: document.getElementById('cert-print'),
  awaySheet: document.getElementById('away-sheet'),
  awayClose: document.getElementById('away-close'),
  awayBody: document.getElementById('away-body'),
  courseBody: document.getElementById('course-body'),
  warmToggle: document.getElementById('warm-toggle'),
  aimTime: document.getElementById('aim-time'),
  aimBy: document.getElementById('aim-by'),
  aimNote: document.getElementById('aim-note'),
  spotSheet: document.getElementById('spot-sheet'),
  spotTitle: document.getElementById('spot-title'),
  spotClose: document.getElementById('spot-close'),
  spotGroups: document.getElementById('spot-groups'),
  spotBody: document.getElementById('spot-body'),
  recordsTabs: document.getElementById('records-tabs'),
  settingsTabs: document.getElementById('settings-tabs'),
  settingsGroups: document.getElementById('settings-groups'),
  bigExit: document.getElementById('big-exit'),
  rail: document.getElementById('rail'),
  railOpen: document.getElementById('rail-open'),
  railClose: document.getElementById('rail-close'),
  railShade: document.getElementById('rail-shade'),
  closingOpen: document.getElementById('closing-open'),
  closingSheet: document.getElementById('closing-sheet'),
  closingTitle: document.getElementById('closing-title'),
  closingBody: document.getElementById('closing-body'),
  closingCard: document.getElementById('closing-card'),
  closingDone: document.getElementById('closing-done'),
  closingClose: document.getElementById('closing-close'),
  tastePick: document.getElementById('taste-pick'),
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
  dareStrip: document.getElementById('dare-strip'),
  modeRecords: document.getElementById('mode-records'),
  dailyCard: document.getElementById('daily-card'),
  duelOne: document.getElementById('duel-one'),
  duelTwo: document.getElementById('duel-two'),
  duelStart: document.getElementById('duel-start'),
  duelNote: document.getElementById('duel-note'),
  roulette: document.getElementById('roulette'),
  split: document.getElementById('split'),
  drillSheet: document.getElementById('drill-sheet'),
  drillTitle: document.getElementById('drill-title'),
  drillClose: document.getElementById('drill-close'),
  drillBody: document.getElementById('drill-body'),
  splitsSwitch: document.getElementById('set-splits'),
  metroSheet: document.getElementById('metro-sheet'),
  metroClose: document.getElementById('metro-close'),
  metroSpeed: document.getElementById('metro-speed'),
  metroFigure: document.getElementById('metro-figure'),
  metroToggle: document.getElementById('metro-toggle'),
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
        ? t('Touch for inspection · hold to start')
        : t('Hold to start');
    }
    return settings.inspection
      ? t('Short touch: once for inspection · twice to delete the last time · hold to start')
      : t('Short touch: twice to delete the last time · hold to start');
  }
  const key = isTouch ? t('Tap') : t('Press <kbd>space</kbd>');
  if (!settings.inspection) return t('Hold and let go to start');
  return narrow.matches
    ? t('{key} for inspection · hold to start', { key })
    : t('{key} for inspection · hold and let go to start', { key });
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
  el.solvesSheetTitle.textContent = t('Times — {name}', { name: currentSession().name });
  el.solvesSheet.showModal();
});

el.solvesClose.addEventListener('click', () => el.solvesSheet.close());

/* ---------- feedback ---------- */

/**
 * What each moment sounds like.
 *
 * Chosen rather than assigned. The inspection calls are a judge's voice and so
 * they are flat, dry and identical -- eight is one, twelve is two, nothing
 * musical about either. Starting and stopping are woodblock knocks a fifth
 * apart, low going in and higher coming out, so you can hear which one happened
 * without looking. A record is the only thing here allowed a tune, and it
 * fades as it rises so it lands as a flourish and not as an alarm.
 */
const CUES = {
  ready: () => tone(760, 0.05, 0.04, 'triangle'),
  start: () => tone(392, 0.07, 0.075, 'triangle'),
  stop: () => tone(587.33, 0.1, 0.08, 'triangle'),
  warn8: () => tone(660, 0.1, 0.07, 'square'),
  warn12: () => chord([660, 660], 0.14, { duration: 0.1, volume: 0.07, type: 'square' }),
  record: () => chord([523.25, 659.25, 783.99, 1046.5], 0.085, { duration: 0.3, volume: 0.085, fade: 0.88 }),
  target: () => together([659.25, 987.77], 0.26, 0.05),
  miss: () => tone(174.61, 0.28, 0.05, 'triangle'),
  // A game or a challenge won: brighter than a record is deep, and shorter.
  win: () => chord([659.25, 880], 0.1, { duration: 0.24, volume: 0.075, fade: 0.9 }),
  // A reel of the wheel dropping into place: short, low, and a little blunt.
  clunk: () => tone(146.83, 0.06, 0.05, 'square')
};

const SHAKES = {
  ready: 25, start: 12, stop: [15, 40, 15],
  record: [20, 60, 20, 60, 40], target: [12, 40, 12], miss: 40,
  win: [18, 50, 18], clunk: 18
};

function cue(name) {
  if (settings.sound) CUES[name]?.();
  if (settings.haptics && SHAKES[name] !== undefined) vibrate(SHAKES[name]);
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
  renderTaste();
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

  // Blindfolded and fewest moves are scored on a mean of three, not an average
  // of five. The bar shows the same four numbers either way; which one counts
  // is marked rather than moved, so nothing jumps about between events.
  const lead = puzzleById(currentSession().puzzle).score === 'mo3' ? 'mo3' : 'ao5';
  for (const cell of el.statsButton.querySelectorAll('.stat')) {
    cell.dataset.lead = String(cell.querySelector('.stat-label')?.textContent === lead);
  }
}

/** Which day a solve belongs to, as a number that sorts and compares cleanly. */
function dayOf(solve) {
  if (!Number.isFinite(solve.at)) return null;
  const date = new Date(solve.at);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function dayLabel(day) {
  if (day === null) return t('no date');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const days = Math.round((today - day) / 86400000);
  if (days === 0) return t('today');
  if (days === 1) return t('yesterday');

  // The month's name comes from the device rather than from a list here, so a
  // second language costs nothing.
  const date = new Date(day);
  const stamp = date.toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
  return date.getFullYear() === now.getFullYear() ? stamp : `${stamp} ${date.getFullYear()}`;
}

/* ---------- a time you solved somewhere else ---------- */

let addPenalty = 'none';

function describeAdd() {
  const found = parseTimeLine(el.addTimeValue.value);
  el.addSave.disabled = !found;
  el.addNote.textContent = el.addTimeValue.value.trim() && !found
    ? t('I cannot read that as a time. Try 12.34 or 1:23.45.')
    : found
      ? t('Will be added as {time}.', { time: formatSolve({ ms: found.ms, penalty: addPenalty }) })
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
  toast(t('{time} added.', { time: formatSolve(solve) }), {
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
    el.empty.textContent = t('Surprise mode — {n} to go.', { n: Math.max(0, run.number - runSolves(run).length) });
    return;
  }

  const shown = solves.filter(matches);
  el.empty.hidden = shown.length > 0;
  el.empty.textContent = solves.length && !shown.length
    ? t('Nothing found with this filter.')
    : t('No times yet.');

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
      star.title = t('Kept');
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
  ? t('{n} solves', { n: settings.goalSolves })
  : t('{n} minutes', { n: settings.goalMinutes });

/** The strip under the averages: today so far, and how long the run is. */
function renderPractice() {
  el.practice.hidden = !settings.practice;
  if (!settings.practice) return;

  const days = practiceByDay(saveFile.sessions);
  const goal = currentGoal();
  const now = days.get(today());
  const { current } = streaks(days, goal);

  el.practice.dataset.done = String(meetsGoal(now, goal));
  // The ring fills with the day rather than a flame lighting up: it says how
  // far along you are, which a lit or unlit picture never could.
  el.practiceFlame.style.setProperty('--filled', String(progress(now, goal)));
  el.practiceRun.textContent = String(current);
  el.practiceToday.textContent = now
    ? `${formatDuration(now.ms)} · ` + t(now.count === 1 ? '{n} solve' : '{n} solves', { n: now.count })
    : t('nothing yet today');
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
  el.practiceNote.textContent = t('A day counts from {goal} on. ', { goal: goalText() })
    + t('The time is your solves added up, not how long the app was open.');

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
    empty.textContent = t('No day with solves in it yet.');
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
    if (streak >= 2) parts.push(t('{n} in a row under {time}', { n: streak, time: formatTime(currentTarget()) }));
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
    if (ceiling === Infinity) parts.push(t('{what} is safe, whatever this one becomes', { what }));
    else if (ceiling) parts.push(t('{what}: this one may be {time} at most', { what, time: formatTime(ceiling) }));
  }

  el.insight.textContent = parts.join('  ·  ');
  el.insight.hidden = parts.length === 0;
}

/* ---------- puzzles ---------- */

/**
 * Seventeen events do not fit in a row of chips, so they are a menu, in four
 * drawers: the cubes, the blindfolded ones, the two other things you do with a
 * 3x3, and the puzzles that are not cubes at all. A native select opens the
 * system picker on a phone and groups properly on a desktop, which is more than
 * a home-made menu would manage on either.
 */
function renderPuzzles() {
  const current = currentSession().puzzle;
  const pick = document.createElement('select');
  pick.className = 'puzzle-pick';
  pick.setAttribute('aria-label', t('Puzzle'));

  for (const group of PUZZLE_GROUPS) {
    const mine = PUZZLES.filter((puzzle) => puzzle.group === group.id);
    if (!mine.length) continue;
    const drawer = document.createElement('optgroup');
    drawer.label = t(group.name);
    for (const puzzle of mine) {
      const option = document.createElement('option');
      option.value = puzzle.id;
      option.textContent = t(puzzle.name);
      option.selected = puzzle.id === current;
      drawer.append(option);
    }
    pick.append(drawer);
  }

  pick.addEventListener('change', () => usePuzzle(pick.value));
  el.puzzles.replaceChildren(pick);
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
/* ---------- the events that end with a question ----------

   Two of the seventeen do not end with a time. Fewest moves is scored in moves,
   so you type your solution in and the app puts it on a real cube to see
   whether it solves this scramble -- the same machinery that checks the
   algorithms in the case book. Multi-blind is scored in points, so it asks how
   many you got right out of how many you went for.

   Everything else on this page ignores both of them entirely. */

/** Moves that count towards a fewest-moves result: turns, not rotations. */
const countsAsMove = (move) => !/^[xyz]/.test(move);

async function judgeSolution(text, forScramble) {
  const [{ puzzles }, { Alg }] = await Promise.all([
    import('../vendor/cubing/puzzles/index.js'),
    import('../vendor/cubing/alg/index.js')
  ]);
  const kpuzzle = await puzzles['3x3x3'].kpuzzle();
  let end;
  try {
    end = kpuzzle.defaultPattern().applyAlg(new Alg(forScramble)).applyAlg(new Alg(text));
  } catch (error) {
    return { ok: false, why: t('I cannot read that as a sequence of moves.') };
  }
  const solved = kpuzzle.defaultPattern();
  const done = Object.keys(solved.patternData).every((orbit) =>
    solved.patternData[orbit].pieces.every((piece, at) =>
      end.patternData[orbit].pieces[at] === piece
      && (end.patternData[orbit].orientation?.[at] ?? 0) === (solved.patternData[orbit].orientation?.[at] ?? 0)));
  if (!done) return { ok: false, why: t('That does not solve this scramble.') };
  return { ok: true, moves: text.trim().split(/\s+/).filter(Boolean).filter(countsAsMove).length };
}

function renderEventExtra() {
  if (!el.eventExtra) return;
  const puzzle = puzzleById(currentSession().puzzle);
  el.eventExtra.replaceChildren();
  el.eventExtra.hidden = !(puzzle.moves || puzzle.many);
  if (el.eventExtra.hidden) return;

  if (puzzle.moves) {
    const field = document.createElement('input');
    field.type = 'text';
    field.placeholder = t("Your solution, e.g. R' U' F …");
    field.autocomplete = 'off';
    field.spellcheck = false;

    const said = document.createElement('p');
    said.className = 'import-note';

    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'text-button';
    go.textContent = t('Count it');

    const judge = async () => {
      const text = field.value.trim();
      if (!text) return;
      go.disabled = true;
      const verdict = await judgeSolution(text, scramble);
      go.disabled = false;
      if (!verdict.ok) {
        said.textContent = verdict.why;
        said.dataset.bad = 'true';
        return;
      }
      delete said.dataset.bad;
      said.textContent = '';
      field.value = '';
      // A fewest-moves result is kept as its move count, so every average in
      // the app goes on working without knowing anything about it.
      addSolve(verdict.moves * 1000, []);
      const last = solves[solves.length - 1];
      if (last) { last.solution = text; persist(); }
      toast(t('{n} moves, and it solves the scramble.', { n: verdict.moves }));
    };

    go.addEventListener('click', judge);
    field.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') { event.preventDefault(); judge(); }
    });
    el.eventExtra.append(field, go, said);
    return;
  }

  // Multi-blind: how many you are going for, and afterwards how many you got.
  const many = document.createElement('label');
  many.append(document.createTextNode(t('Cubes')));
  const count = document.createElement('input');
  count.type = 'number';
  count.min = '2';
  count.max = '30';
  count.value = String(settings.mbldCubes || 3);
  count.addEventListener('change', () => {
    settings.mbldCubes = Math.max(2, Math.min(Number(count.value) || 3, 30));
    count.value = String(settings.mbldCubes);
    storeSettings();
    newScramble({ allowRematch: false });
  });
  many.append(count);
  el.eventExtra.append(many);

  const last = solves[solves.length - 1];
  if (!last) {
    el.eventExtra.append(line(t('Set how many you are going for, then start.'), 'import-note'));
    return;
  }

  const got = document.createElement('label');
  got.append(document.createTextNode(t('Solved')));
  const right = document.createElement('input');
  right.type = 'number';
  right.min = '0';
  right.max = '30';
  right.value = String(last.solved ?? '');
  right.addEventListener('change', () => {
    last.solved = Math.max(0, Math.min(Number(right.value) || 0, 30));
    last.tried = settings.mbldCubes || 3;
    persist();
    renderEventExtra();
  });
  got.append(right);
  el.eventExtra.append(got);

  if (Number.isInteger(last.solved)) {
    const tried = last.tried || settings.mbldCubes || 3;
    const points = last.solved - (tried - last.solved);
    el.eventExtra.append(line(
      t('{got} of {tried} — {points} points, in {time}',
        { got: last.solved, tried, points, time: formatTime(last.ms) }), 'import-note'));
  }
}

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

/* ---------- scrambles to your taste ----------

   A scramble is a draw, and every timer deals you the same deck. But the cross
   length of a scramble can be worked out here before you ever see it, so the
   deck can be stacked on purpose: a run of easy crosses when you want to feel
   fast, a run of awkward ones when you want to get better at the thing you are
   worst at. The scrambles are still official random-state ones -- they are
   sifted, never made -- so nothing about them is less real than usual.

   Sifting costs scrambles, so it gives up after a dozen and says so rather
   than making you wait. */

const TASTES = [
  { id: 'any', label: t('Everything'), about: t('Simply what the scrambler gives.') },
  { id: 'easy', label: t('Quick cross'), about: t('Only scrambles with a cross of 5 moves or fewer.') },
  { id: 'hard', label: t('Awkward cross'), about: t('Only scrambles with a cross of 7 moves or more.') }
];

const TASTE_TRIES = 12;

/** Whether the last scramble is the one you asked for, or the best of a dozen. */
let tasteMissed = false;

function fitsTaste(text, kit) {
  const lengths = kit.cross.crossLengths(text, kit.kpuzzle, kit.Alg, kit.table);
  const own = lengths.find((entry) => entry.id === settings.crossFace);
  if (!own) return null;
  if (settings.taste === 'easy') return own.moves <= 5;
  if (settings.taste === 'hard') return own.moves >= 7;
  return true;
}

/**
 * Deal until one fits. The token is checked every round: a scramble sifted for
 * a session you have already left must not land on the screen of the one you
 * are in now.
 */
async function toTaste(text, official, token) {
  let kit;
  try {
    kit = await loadCross();
  } catch {
    return { text, official, missed: true };
  }
  if (token !== scrambleToken) return { text, official, missed: false };

  let candidate = { text, official };
  for (let go = 0; go < TASTE_TRIES; go++) {
    const verdict = fitsTaste(candidate.text, kit);
    if (verdict === null) return { ...candidate, missed: true };
    if (verdict) return { ...candidate, missed: false };
    candidate = await nextScramble('333');
    if (token !== scrambleToken) return { ...candidate, missed: false };
  }
  return { ...candidate, missed: true };
}

/** The solve this scramble is a rematch of, or null for an ordinary one. */
let rematch = null;

/** Says which deck this came out of, and admits it when the sifting gave up. */
function renderTaste() {
  if (!el.scrambleTaste) return;
  const taste = TASTES.find((entry) => entry.id === settings.taste);
  const on = taste && taste.id !== 'any' && holdingA333();
  el.scrambleTaste.hidden = !on;
  if (!on) return;
  el.scrambleTaste.textContent = tasteMissed
    ? t('{taste} — none found in twelve tries, this is an ordinary one', { taste: taste.label.toLowerCase() })
    : taste.label.toLowerCase();
}

function renderRematch() {
  el.scrambleAgain.hidden = !rematch;
  if (!rematch) return;
  const when = new Date(rematch.at);
  const month = when.toLocaleDateString(locale(), { month: 'long' });
  el.scrambleAgain.textContent = t('you had this one in {month} too', { month });
}

/**
 * Put a particular scramble up: one you asked to do again, one from a game, one
 * off a solve you want another go at. The token is bumped so a scramble already
 * on its way back from the official scrambler cannot land on top of it.
 */
function setScramble(text) {
  scrambleToken++;
  rematch = null;
  scramble = text;
  delete el.scramble.dataset.loading;
  el.scramble.dataset.official = 'true';
  el.scramble.title = t('Click to copy');
  renderScramble();
  renderRematch();
}

async function newScramble({ allowRematch = true } = {}) {
  const puzzle = currentSession().puzzle;
  const token = ++scrambleToken;

  rematch = allowRematch && Math.random() < 1 / AGAIN_ONE_IN ? anOldScramble() : null;
  if (rematch) {
    scramble = rematch.scramble;
    delete el.scramble.dataset.loading;
    el.scramble.dataset.official = 'true';
    el.scramble.title = t('Click to copy');
    renderScramble();
    renderRematch();
    return;
  }

  el.scramble.dataset.loading = 'true';
  let { text, official } = await nextScramble(puzzle);
  if (token !== scrambleToken) return; // a newer request already won

  // Multi-blind is not one scramble but as many as you say you will attempt.
  if (puzzleById(puzzle).many) {
    const many = Math.max(2, Math.min(settings.mbldCubes || 3, 30));
    const rest = [];
    for (let at = 1; at < many; at++) {
      const one = await nextScramble(puzzle);
      if (token !== scrambleToken) return;
      rest.push(one.text);
      official = official && one.official;
    }
    text = [text, ...rest].map((line, at) => `${at + 1}. ${line}`).join('\n');
  }

  if (settings.taste !== 'any' && holdingA333()) {
    const fitted = await toTaste(text, official, token);
    if (token !== scrambleToken) return;
    text = fitted.text;
    official = fitted.official;
    tasteMissed = fitted.missed;
  } else {
    tasteMissed = false;
  }

  scramble = text;
  delete el.scramble.dataset.loading;
  el.scramble.dataset.official = String(official);
  el.scramble.title = official
    ? t('Official random-state scramble · click to copy')
    : t('Stand-in scramble: the official scrambler could not load · click to copy');
  renderScramble();
  renderRematch();
}

/* ---------- sessions ---------- */

/** This session's goal time in milliseconds, or null when it has none. */
const currentTarget = () => currentSession().target;

/** The puzzle you are actually holding, which is not the same as the event. */
const heldCube = () => puzzleById(currentSession().puzzle).cube;

/** Whether the thing in your hands is a 3x3, whatever the event is called. */
const holdingA333 = () => heldCube() === '333';

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
  saveFile.active = index;
  syncTargetUi();
  // Fewest moves is counted in moves; everything else in seconds. The unit
  // follows the session, the same way the number of decimals does.
  setUnit(puzzleById(currentSession().puzzle).moves ? 'moves' : 'time');
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
  el.sessionSummary.textContent = t('{times} times · {sessions} sessions in all', { times: solves.length, sessions: saveFile.sessions.length });
  el.sessionDelete.disabled = saveFile.sessions.length < 2;
  el.sessionSheet.showModal();
  el.sessionSheet.focus();
});

el.sessionName.addEventListener('input', () => {
  const name = el.sessionName.value.trim().slice(0, 40);
  currentSession().name = name || t('Session {n}', { n: saveFile.active + 1 });
  persist();
  renderSessions();
});

el.sessionNew.addEventListener('click', () => {
  saveFile.sessions.push({
    name: t('Session {n}', { n: saveFile.sessions.length + 1 }),
    puzzle: currentSession().puzzle,
    solves: []
  });
  useSession(saveFile.sessions.length - 1);
  el.sessionSheet.close();
  toast(t('New session started.'));
});

el.sessionDelete.addEventListener('click', () => {
  if (saveFile.sessions.length < 2) return;
  if (!confirm(t('Delete "{name}" with every time in it?', { name: currentSession().name }))) return;
  const name = currentSession().name;
  saveFile.sessions.splice(saveFile.active, 1);
  useSession(Math.max(0, saveFile.active - 1));
  el.sessionSheet.close();
  toast(t('{name} deleted.', { name }));
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
    [t('solves'), String(scored.length), outward(all)],
    ['mean', formatTime(sessionMean(scored)), outward(all)],
    [t('best'), formatTime(best(scored)), extreme(best(scored))],
    [t('worst'), formatTime(worst(scored)), extreme(worst(scored))]
  ];
  if (skipped) {
    session.push([t('does not count'), String(skipped),
      list.flatMap((solve, index) => (counts(solve) ? [] : [index]))]);
  }

  return [
    { title: t('Session'), tiles: session },
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
  none.textContent = t('nothing — only this session');
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
const averageTable = (rows) => statTable([t('now'), t('record')], rows, ['', 'stats-row-record']);

/** Side by side, every measure gets a column per session instead. */
const comparisonTable = (rows, names) =>
  statTable(names, rows, ['', 'stats-row-other'], 'stats-table-compare');

/** Every measure of a group, flattened, for setting two sessions side by side. */
function flatten(group) {
  if (group.tiles) return group.tiles.map(([label, value]) => [label, value]);
  return group.averages.flatMap(([label, now, record]) => [
    [label, now], [t('best {label}', { label }), record]
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
    ? t('Tap the time for its scramble.')
    : t('{n} solves · tap one for its scramble.', { n: indices.length });

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
  const when = new Date(then.at).toLocaleDateString(locale());
  if (!Number.isFinite(before) || !Number.isFinite(after)) {
    toast(t('You had this scramble on {when} too.', { when }));
    return;
  }
  const gap = formatTime(Math.abs(before - after));
  toast(after < before
    ? t('You did this scramble on {when} in {then} — {gap} faster now.', { when, then: formatTime(before), gap })
    : t('You did this scramble on {when} in {then} — {gap} slower now.', { when, then: formatTime(before), gap }));
}

/* ---------- games ----------

   Everything under this heading keeps its own times. None of it goes into a
   session, and none of it is visible anywhere but the game it belongs to. */

const play = () => saveFile.play;

/** Where a game solve lands: on the run, and in the strip above the ring. */
function finishGameSolve(solve) {
  // The cross round is the one mode that can mark its own homework: the table
  // knows how short the cross could have been on the scramble you just had.
  // Not waited for -- building the table takes a few seconds the first time,
  // and the clock should not sit there while it happens.
  if (run?.kind === 'cross') sayCrossLength(solve);

  const { ended, broke } = absorb(run, solve);
  if (broke) cue('miss');
  renderMode();
  showTime(effective(solve));
  if (!keepScramble) newScramble(); else keepScramble = false;

  if (!ended) return;
  clearInterval(runTicker);
  runTicker = null;
  keepRun();
  showResult();
}

/**
 * How short the cross could have been, said after the solve rather than before:
 * knowing the number in advance changes how you look at the scramble, and the
 * point of the round is to look at it the way you always do.
 */
async function sayCrossLength(solve) {
  const hold = run;
  if (!solve.scramble || !holdingA333()) {
    hold?.moves.push(NaN);
    return;
  }
  let kit;
  try {
    kit = await loadCross();
  } catch {
    hold?.moves.push(NaN);
    return;
  }
  if (run !== hold) return;   // the round ended while the table was being built

  const lengths = kit.cross.crossLengths(solve.scramble, kit.kpuzzle, kit.Alg, kit.table);
  const own = lengths.find((entry) => entry.id === settings.crossFace);
  hold.moves.push(own ? own.moves : NaN);
  renderMode();
  // The last solve's number arrives after the round has already put its result
  // up, so the result is drawn again once it is in rather than being short by
  // one for good.
  if (hold.over && el.roundSheet.open) showResult();
  if (!own) return;

  const shortest = lengths[0];
  toast(own.moves === shortest.moves
    ? t('The cross could have gone in {n} moves, and no shorter on any colour.', { n: own.moves })
    : t('The cross could have gone in {n} moves on {colour} — on {other} in {m}.', { n: own.moves, colour: own.name, other: shortest.name, m: shortest.moves }));
}

/** A finished run, remembered under its own game. */
function keepRun() {
  if (!run) return;
  const score = scoreOf(run.kind, run.solves, run.bestStreak);
  recordRun(play(), run.kind, run.number, run.solves, score);
  persist();
}

/* ---------- the scramble of the day ----------

   One scramble, one attempt, the same for everyone who opens the app today. No
   server: the date is the seed, and the same seed gives the same moves on every
   device. That makes it a random-move scramble rather than a random-state one,
   which is a real difference -- some positions turn up more often than others.
   The official scrambler works by solving a random position and its answer
   cannot be made to come out the same twice, so for a thing that has to be
   shared this is the honest trade. */

let dailyRun = false;

const dailyScramble = (day) => randomMoveScramble('333', seeded(`cubetimer:${day}`));

function startDaily() {
  const day = dayStamp();
  if (play().daily[day]) { toast(t('You have already done it today.')); return; }

  stopRun(true);
  drilling = null;
  duel = null;
  dailyRun = true;
  scramble = dailyScramble(day);
  scrambleToken++;
  keepScramble = true;
  delete el.scramble.dataset.loading;
  el.scramble.dataset.official = 'false';
  rematch = null;
  renderRematch();
  renderScramble();
  renderMode();
  el.modeSheet.close();
  toast(t('Scramble of the day — you get one try.'));
}

function finishDaily(solve) {
  dailyRun = false;
  keepScramble = false;
  const day = dayStamp();
  recordDaily(play(), day, solve);
  persist();
  showTime(effective(solve));
  newScramble();
  renderMode();

  const streak = dailyStreak(play());
  cue('win');
  if (settings.celebrate) confetti('burst');
  toast(t('{time} for today — {n} {word} in a row.', { time: formatSolve(solve), n: streak, word: t(streak === 1 ? 'day' : 'days') }));
}

function renderDaily() {
  const day = dayStamp();
  const done = play().daily[day];
  const streak = dailyStreak(play());
  const history = dailyHistory(play(), 10);

  const card = document.createElement('div');
  const head = document.createElement('div');
  head.className = 'daily-head';
  const title = document.createElement('b');
  title.textContent = t('Scramble of the day');
  const run = document.createElement('small');
  run.textContent = streak ? t('{n} {word} in a row', { n: streak, word: t(streak === 1 ? 'day' : 'days') }) : t('not started yet');
  head.append(title, run);

  const body = document.createElement('p');
  body.className = 'records-line';
  body.textContent = done
    ? t('Today: {time}. A new one tomorrow.', { time: formatSolve(done) })
    : t('One scramble, one try, the same for everybody. Compare with a friend.');

  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'daily-go';
  action.textContent = done ? t('Already done today') : t('Do the daily scramble');
  action.disabled = Boolean(done);
  action.addEventListener('click', startDaily);

  card.append(head, body, action);

  if (history.length) {
    const list = document.createElement('div');
    list.className = 'round-lines';
    for (const entry of history) {
      const row = document.createElement('div');
      const when = document.createElement('span');
      const date = new Date(`${entry.day}T12:00:00`);
      when.textContent = entry.day === day ? t('today') : date.toLocaleDateString(locale());
      const figure = document.createElement('b');
      figure.textContent = formatSolve(entry);
      row.append(when, figure);
      list.append(row);
    }
    card.append(list);
  }

  el.dailyCard.replaceChildren(card);
}

/* ---------- duel ----------

   Two people, one device, taking turns. Nothing of it touches either person's
   times: it is a game, and the only thing worth keeping is who won. */

let duel = null;

function startDuel() {
  const names = [el.duelOne.value.trim() || t('You'), el.duelTwo.value.trim() || t('The other one')];
  stopRun(true);
  drilling = null;
  dailyRun = false;
  duel = { names, turn: 0, score: [0, 0], best: [null, null], round: 1, of: 5 };
  keepScramble = false;
  newScramble();
  renderMode();
  el.modeSheet.close();
  toast(`${names[0]} begint. Best of ${duel.of}.`);
}

function finishDuelSolve(solve) {
  const who = duel.turn;
  const value = effective(solve);
  if (Number.isFinite(value) && (duel.best[who] === null || value < duel.best[who])) {
    duel.best[who] = value;
  }
  duel.pending = duel.pending || [];
  duel.pending[who] = value;

  showTime(value);
  newScramble();

  // Both have gone: whoever was quicker takes the round.
  if (who === 1) {
    const [a, b] = duel.pending;
    if (Number.isFinite(a) && Number.isFinite(b) && a !== b) duel.score[a < b ? 0 : 1]++;
    duel.pending = [];
    duel.round++;
    duel.turn = 0;
  } else {
    duel.turn = 1;
  }

  const needed = Math.floor(duel.of / 2) + 1;
  if (duel.score[0] >= needed || duel.score[1] >= needed || duel.round > duel.of) {
    endDuel();
    return;
  }
  renderMode();
}

function endDuel() {
  const { names, score, best } = duel;
  recordDuel(play(), names, score, best);
  persist();
  const tally = duelTally(play(), names);
  const winner = score[0] === score[1] ? null : names[score[0] > score[1] ? 0 : 1];
  duel = null;
  renderMode();

  el.roundTitle.textContent = 'Duel';
  const big = document.createElement('p');
  big.className = 'round-headline';
  big.textContent = `${score[0]} – ${score[1]}`;

  const list = document.createElement('div');
  list.className = 'round-lines';
  for (const [label, value] of [
    ['Winnaar', winner || 'gelijkspel'],
    [t('Best of {name}', { name: names[0] }), formatTime(best[0])],
    [t('Best of {name}', { name: names[1] }), formatTime(best[1])],
    ['Onderling', `${tally[0]} – ${tally[1]}`]
  ]) {
    const row = document.createElement('div');
    const name = document.createElement('span');
    name.textContent = label;
    const figure = document.createElement('b');
    figure.textContent = value;
    row.append(name, figure);
    list.append(row);
  }

  el.roundBody.replaceChildren(big, list);
  cue('win');
  if (settings.celebrate) confetti('party');
  openSheet(el.roundSheet);
}

el.duelStart.addEventListener('click', startDuel);

/* ---------- roulette ----------

   For when you do not know what to practise and just feel like turning. */

const DARES = [
  t('with one hand'), t('without turning your wrist'), t('with your eyes shut after the inspection'),
  t('as slowly as you can without stopping'), t('three times running, the same scramble'),
  t('with the cube on your knee'), t('without looking at the time'), t('as fast as you dare')
];

el.roulette.addEventListener('click', () => {
  el.roulette.blur();
  const puzzle = PUZZLES[Math.floor(Math.random() * PUZZLES.length)];
  const dare = DARES[Math.floor(Math.random() * DARES.length)];
  if (puzzle.id !== currentSession().puzzle) usePuzzle(puzzle.id);
  else newScramble();
  el.modeSheet.close();
  toast(`${puzzle.name}, ${dare}.`);
});

/* ---------- modes ----------

   A run is a shape laid over the ordinary session: the solves land where they
   always land, and the run only decides what the strip says and when something
   is over. So nothing can be lost by leaving a mode, and a mode cannot make a
   solve go missing. */

let run = null;
let runTicker = null;
let picked = 'normal';

function renderMode() {
  let text = describe(run, Date.now());
  let kind = run?.kind || '';

  if (duel) {
    text = t('{name} is up — {a}–{b}, round {round} of {of}', { name: duel.names[duel.turn], a: duel.score[0], b: duel.score[1], round: duel.round, of: duel.of });
    kind = 'duel';
  } else if (dailyRun) {
    text = t('Scramble of the day — one try');
    kind = 'daily';
  } else if (drilling) {
    text = `Trainen — ${drilling.id}`;
    kind = 'drill';
  } else if (grinding) {
    text = t('The same scramble until you are under {time} — try {n}', { time: formatTime(grinding.target), n: grinding.tries + 1 });
    kind = 'grind';
  } else if (warmingUp) {
    text = t('Warming up — these do not count');
    kind = 'warm';
  }

  el.modeStrip.textContent = text;
  el.modeStrip.hidden = !text;
  el.modeStrip.dataset.kind = kind;
  el.modeOpen.dataset.active = String(Boolean(run || duel || dailyRun || grinding || warmingUp));
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
      keepRun();
      render();
      showResult();
      return;
    }

    renderMode();
  }, 250);
}

function showResult() {
  if (!run) return;
  const { headline, lines } = result(run);
  el.roundTitle.textContent = MODES[run.kind].name;

  const record = bestOf(play(), run.kind);
  const mine = scoreOf(run.kind, run.solves, run.bestStreak);

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

  if (record) {
    const row = document.createElement('div');
    const name = document.createElement('span');
    name.textContent = t('Best ever');
    const figure = document.createElement('b');
    figure.textContent = spellScore(run.kind, record.score);
    row.append(name, figure);
    list.append(row);
  }

  const solvesLine = document.createElement('p');
  solvesLine.className = 'records-aside';
  solvesLine.textContent = runSolves(run).map(formatSolve).join('   ');

  el.roundBody.replaceChildren(big, list, solvesLine);
  cue('win');
  if (settings.celebrate) confetti('party');
  openSheet(el.roundSheet);
}

function stopRun(quietly = false) {
  const had = run;
  // A run given up halfway is still worth keeping: a marathon of nine is a
  // marathon of nine whether or not you carried on afterwards.
  if (had && !had.over && had.solves.length) keepRun();
  run = null;
  clearInterval(runTicker);
  runTicker = null;
  renderMode();
  render();
  if (had && !quietly) toast(`${MODES[had.kind].name} gestopt.`);
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

/** What this game has ever come to, inside the game and nowhere else. */
function renderModeRecords() {
  const kind = picked;
  const runs = kind === 'normal' ? [] : runsOf(play(), kind).slice(0, 5);
  if (!runs.length) { el.modeRecords.replaceChildren(); return; }

  const list = document.createElement('div');
  list.className = 'round-lines';
  runs.forEach((entry, place) => {
    const row = document.createElement('div');
    const when = document.createElement('span');
    when.textContent = `${place + 1}. ${new Date(entry.at).toLocaleDateString(locale())}`;
    const figure = document.createElement('b');
    figure.textContent = spellScore(kind, entry.score);
    row.append(when, figure);
    list.append(row);
  });

  const heading = document.createElement('h3');
  heading.className = 'transfer-head';
  heading.textContent = t('Your best runs');
  el.modeRecords.replaceChildren(heading, list);
}

function renderModeFields() {
  renderModeRecords();
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
  el.modeStart.textContent = picked === 'normal' ? t('Back to plain') : 'Beginnen';
  el.modeNote.textContent = run && picked !== 'normal'
    ? t('This starts a new run; the last one does not carry on.')
    : '';
}

el.repeatScramble.addEventListener('click', () => {
  el.repeatScramble.blur();
  // Bumping the token is not enough: finishing a solve asks for a new scramble
  // outright, with a newer token still. So it is a standing wish, cleared the
  // moment it is granted.
  keepScramble = true;
  el.repeatScramble.dataset.active = 'true';
  toast(t('The next one is the same scramble.'));
});

el.modeOpen.addEventListener('click', () => {
  el.modeOpen.blur();
  picked = run?.kind || 'normal';
  renderDaily();
  renderModeList();
  renderModeFields();
  nameTheDuel();
  el.modeSheet.showModal();
});

function renderDuelNote() {
  const names = [el.duelOne.value.trim(), el.duelTwo.value.trim()];
  if (!names[0] || !names[1]) {
    el.duelNote.textContent = t('Two names, taking turns on the same device. Best of five.');
    return;
  }
  const tally = duelTally(play(), names);
  el.duelNote.textContent = tally[0] || tally[1]
    ? t('Between you it stands {a}–{b}.', { a: tally[0], b: tally[1] })
    : t('Never played each other yet.');
}

/**
 * Two people on one device already have names -- their profiles. Filling them
 * in means the running tally between you two is kept under the names you both
 * answer to, rather than under "You" and "The other one".
 */
function nameTheDuel() {
  const here = people();
  if (here.length < 2) return;
  const me = currentPerson();
  const other = here.find((one) => one.id !== me.id);
  if (!el.duelOne.value.trim()) el.duelOne.value = me.name;
  if (!el.duelTwo.value.trim() && other) el.duelTwo.value = other.name;
  renderDuelNote();
}

el.duelOne.addEventListener('input', renderDuelNote);
el.duelTwo.addEventListener('input', renderDuelNote);

el.modeClose.addEventListener('click', () => el.modeSheet.close());
el.roundClose.addEventListener('click', () => el.roundSheet.close());

/** A time to be under, and a date to be under it by. */
function renderAim() {
  if (!el.aimTime) return;
  el.aimTime.value = settings.aimTime ? (settings.aimTime / 1000).toFixed(2).replace(/\.?0+$/, '') : '';
  el.aimBy.value = settings.aimBy || '';
}

el.aimTime?.addEventListener('change', () => {
  const seconds = Number(String(el.aimTime.value).replace(',', '.'));
  settings.aimTime = Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds * 1000) : 0;
  storeSettings();
  renderAim();
});

el.aimBy?.addEventListener('change', () => {
  settings.aimBy = el.aimBy.value || '';
  storeSettings();
});

el.warmToggle.addEventListener('click', () => {
  el.modeSheet.close();
  setWarmUp(!warmingUp);
});

el.modeStart.addEventListener('click', () => {
  el.modeSheet.close();
  if (picked === 'normal') {
    drilling = null;
    duel = null;
    dailyRun = false;
    keepScramble = false;
    stopRun();
    newScramble();
    return;
  }

  const number = Number(String(el.modeNumber.value).replace(',', '.'));
  // The cross round needs the table, and building it takes a few seconds. Start
  // it now rather than in the pause after the first solve.
  if (picked === 'cross') loadCross().catch(() => {});
  drilling = null;
  duel = null;
  dailyRun = false;
  run = begin(picked, number);
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

async function loadCases() {
  if (caseSet) return caseSet;
  const [{ puzzles }, { Alg }, { usableCases, solvesCase, GROUPS, AUF }] = await Promise.all([
    import('../vendor/cubing/puzzles/index.js'),
    import('../vendor/cubing/alg/index.js'),
    import('./cases.js')
  ]);
  const kpuzzle = await puzzles['3x3x3'].kpuzzle();
  const { cases, dropped } = usableCases(kpuzzle, Alg);
  if (dropped.length) console.warn(t('Cases refused:'), dropped);
  // The cube itself is kept, because an algorithm you type in later has to be
  // put on it before it is believed.
  caseSet = { cases, dropped, GROUPS, AUF, kpuzzle, Alg, solvesCase };
  for (const entry of cases) foldInMyAlgs(entry);
  return caseSet;
}

/* ---------- an algorithm of your own ----------

   Anyone may add one, and nothing added is trusted. It goes on a real cube
   first: it has to leave the centres alone, leave the first two layers alone,
   and land on this case and not some other one. Fail any of that and it is
   refused with the reason, rather than saved and quietly taught to you wrong.

   The check is the same one every algorithm that ships with the app has to
   pass, which is the point -- there is one standard, not a strict one for the
   app and a lenient one for you. */

/**
 * Try one set of moves against one case.
 * @returns {{ok: true, alg: object} | {ok: false, why: string}}
 */
function tryMyAlg(entry, moves) {
  const { kpuzzle, Alg, solvesCase } = caseSet;
  const tried = solvesCase(entry, moves, kpuzzle, Alg);
  if (!tried.ok) return { ok: false, why: tried.why };
  return { ok: true, alg: { moves, setup: tried.setup, turns: tried.turns, mine: true } };
}

/** Your own algorithms for a case, put back into its list after a reload. */
function foldInMyAlgs(entry) {
  entry.algs = entry.algs.filter((alg) => !alg.mine);
  for (const moves of myAlgs(play(), algKey(entry))) {
    const tried = tryMyAlg(entry, moves);
    if (tried.ok) entry.algs.push(tried.alg);
  }
}

/**
 * Which cases the drill serves.
 *
 * Spread is the honest default -- everything you have not met, then anything at
 * all -- because a drill that only ever gives you your worst case teaches you
 * that one case and lets the rest rot. Weak is for when you have asked for it:
 * the third you are slowest at, and nothing else.
 */
let drillFocus = 'spread';

/** How slow a case has to have been to count as one of your weak ones. */
const WEAK_THIRD = 1 / 3;

/**
 * Pick the next case out of whatever the focus points at: the whole group, your
 * weakest third, or a set you put together yourself. Within that, the ones you
 * have never done come first -- a set of seventeen unknown cases should hand
 * you all seventeen before it repeats one.
 */
function nextCase(cases, group) {
  const pool = focusCases(group);
  if (!pool.length) return null;

  // Refreshing is the one focus with an order to it: the case closest to
  // slipping goes first, because that is the whole reason it is on the list.
  if (drillFocus === 'recall') {
    const due = recallStanding(play().cases, group);
    const worst = due.find((row) => pool.some((entry) => entry.id === row.id));
    const found = worst && pool.find((entry) => entry.id === worst.id);
    if (found) return found;
  }

  const standing = new Map(caseStanding(play(), group).map((row) => [row.id, row]));
  const untried = pool.filter((entry) => !standing.has(entry.id));
  const from = untried.length ? untried : pool;
  return from[Math.floor(Math.random() * from.length)];
}

/** The cases of a group that have gone long enough to be worth seeing again. */
function dueCases(group) {
  const ids = new Set(recallStanding(play().cases, group).filter((row) => row.ratio >= 1).map((row) => row.id));
  return groupCases(group).filter((entry) => ids.has(entry.id));
}

/** How many cases in this group you have done enough of to rank at all. */
function rankedCases(group) {
  return caseStanding(play(), group).filter((row) => row.count >= 2).length;
}

/** Drill times belong to the drill, not to whatever session was open. */
function finishDrill(solve) {
  const entry = drilling;
  recordCase(play(), entry.group, entry.id, solve);
  persist();
  showTime(effective(solve));
  renderMode();

  const next = caseSet && nextCase(caseSet.cases, entry.group);
  if (next) startCase(next);
}

function startCase(entry) {
  stopRun(true);
  duel = null;
  dailyRun = false;
  drilling = entry;
  // The setup that belongs to the algorithm you starred, so the case arrives
  // the way that algorithm wants it.
  const mine = chosenAlg(entry);
  const turn = settings.caseAuf ? caseSet.AUF[Math.floor(Math.random() * caseSet.AUF.length)] : '';
  scramble = `${mine.setup}${turn ? ` ${turn}` : ''}`.trim();
  scrambleToken++;
  keepScramble = true; // finishing one solve must not fetch an ordinary scramble
  delete el.scramble.dataset.loading;
  el.scramble.dataset.official = 'true';
  rematch = null;
  renderRematch();
  renderScramble();
  renderDrill();
}

/** The cases of one group, in the order they are listed. */
const groupCases = (group) => caseSet.cases.filter((entry) => entry.group === group);

/** The case list a focus points at: everything, your worst, or a set you made. */
function focusCases(group, focus = drillFocus) {
  const mine = groupCases(group);
  if (focus === 'spread') return mine;
  if (focus === 'recall') {
    const due = dueCases(group);
    return due.length ? due : mine;
  }
  if (focus === 'weak') {
    const tried = caseStanding(play(), group).filter((row) => row.count >= 2);
    const worst = tried.slice(0, Math.max(3, Math.ceil(tried.length * WEAK_THIRD)));
    const pool = mine.filter((entry) => worst.some((row) => row.id === entry.id));
    return pool.length ? pool : mine;
  }
  const set = setsOf(play(), group).find((entry) => entry.id === focus);
  if (!set) return mine;
  const pool = mine.filter((entry) => set.cases.includes(entry.id));
  return pool.length ? pool : mine;
}

/** What the focus is called, for a heading. */
function focusName(group, focus = drillFocus) {
  if (focus === 'spread') return t('everything mixed together');
  if (focus === 'weak') return t('your weakest third');
  if (focus === 'recall') return t('refreshing');
  return setsOf(play(), group).find((entry) => entry.id === focus)?.name || t('everything mixed together');
}

/* ---------- the picture of a case ---------- */

/**
 * The diagram, filled in once it is ready. Drawing one needs the puzzle library,
 * so the tile is put up empty and the picture drops into it -- a list of
 * fifty-seven cases must not wait for fifty-seven of them before it appears.
 */
function caseThumb(entry) {
  const slot = document.createElement('span');
  slot.className = 'case-thumb';
  const drawn = lastLayerOf(entry.setup).then((shape) =>
    (shape ? drawLastLayer(shape, entry.group === 'pll' ? 'pll' : 'oll') : null));
  drawn.then((svg) => { if (svg) slot.append(svg); }).catch(() => {});
  return slot;
}

/* ---------- which algorithm is yours ----------

   A case has more than one way through it, and the one you use is the one the
   drill should set up: the setup is the algorithm turned back to front, so
   starring a different algorithm means the case comes up facing the way that
   algorithm expects rather than facing some other way you then have to work
   around. */

const algKey = (entry) => `${entry.group}/${entry.id}`;

/**
 * The algorithm you starred, or the first one if you have not starred any.
 *
 * The star is kept as the moves rather than as a place in the list, because the
 * list is no longer fixed: adding one of your own, or dropping it again, would
 * shift every number after it and silently move your star to a neighbour.
 * Older settings did keep a number, and those are still read.
 */
function chosenAlg(entry) {
  const picked = settings.pickedAlg?.[algKey(entry)];
  if (typeof picked === 'string') {
    const found = entry.algs.find((alg) => alg.moves === picked);
    if (found) return found;
  }
  if (Number.isInteger(picked) && entry.algs[picked]) return entry.algs[picked];
  return entry.algs[0];
}

function pickAlg(entry, alg) {
  settings.pickedAlg = { ...settings.pickedAlg, [algKey(entry)]: alg.moves };
  storeSettings();
}

/* ---------- putting a set together ---------- */

let building = null;   // { group, chosen: Set, id: string|null }

function renderSetCount() {
  const many = building.chosen.size;
  el.setCount.textContent = t('{n} chosen', { n: many });
  el.setSave.disabled = many === 0 || !el.setName.value.trim();
}

function renderSetGrid() {
  el.setGrid.replaceChildren(...groupCases(building.group).map((entry) => {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'case-tile';
    tile.dataset.on = String(building.chosen.has(entry.id));
    const label = document.createElement('b');
    label.textContent = entry.id;
    const name = document.createElement('small');
    name.textContent = entry.name;
    tile.append(caseThumb(entry), label, name);
    tile.addEventListener('click', () => {
      if (building.chosen.has(entry.id)) building.chosen.delete(entry.id);
      else building.chosen.add(entry.id);
      tile.dataset.on = String(building.chosen.has(entry.id));
      renderSetCount();
    });
    return tile;
  }));
  renderSetCount();
}

function openSetBuilder(group, set = null) {
  building = {
    group,
    id: set?.id || null,
    chosen: new Set(set ? set.cases : [])
  };
  el.setTitle.textContent = set ? t('Set — {name}', { name: set.name }) : t('New set — {group}', { group: caseSet.GROUPS[group].name });
  el.setName.value = set?.name || '';
  el.setDrop.hidden = !set;
  renderSetGrid();
  openSheet(el.setSheet);
}

el.setName.addEventListener('input', renderSetCount);
el.setClose.addEventListener('click', () => el.setSheet.close());

el.setAll.addEventListener('click', () => {
  building.chosen = new Set(groupCases(building.group).map((entry) => entry.id));
  renderSetGrid();
});
el.setNone.addEventListener('click', () => {
  building.chosen = new Set();
  renderSetGrid();
});
el.setUnknown.addEventListener('click', () => {
  // Cases you have never drilled: the ones a set is usually made for.
  const done = new Set(Object.keys(play().cases[building.group] || {}));
  building.chosen = new Set(groupCases(building.group).filter((entry) => !done.has(entry.id)).map((entry) => entry.id));
  renderSetGrid();
});
el.setDue.addEventListener('click', () => {
  building.chosen = new Set(dueCases(building.group).map((entry) => entry.id));
  renderSetGrid();
  if (!building.chosen.size) toast(t('Nothing due — everything is still fresh.'));
});
el.setSlow.addEventListener('click', () => {
  const slow = caseStanding(play(), building.group).filter((row) => row.count >= 2).slice(0, 10);
  building.chosen = new Set(slow.map((row) => row.id));
  renderSetGrid();
});

el.setSave.addEventListener('click', () => {
  const name = el.setName.value.trim();
  if (!name || !building.chosen.size) return;
  const set = keepSet(play(), { name, group: building.group, cases: [...building.chosen], id: building.id });
  persist();
  drillGroup = building.group;
  drillFocus = set.id;
  el.setSheet.close();
  renderDrill();
  toast(t('"{name}" saved — {n} cases.', { name: set.name, n: set.cases.length }));
});

el.setDrop.addEventListener('click', () => {
  if (!building.id) return;
  const name = el.setName.value.trim();
  dropSet(play(), building.id);
  persist();
  if (drillFocus === building.id) drillFocus = 'spread';
  el.setSheet.close();
  renderDrill();
  toast(t('"{name}" deleted.', { name }));
});

/* ---------- the case book ----------

   Every case of a group, with its picture, the ways through it, and what you
   have ever done on it. The star says which algorithm is yours, and that is not
   only a note to yourself: the setup is the algorithm turned back to front, so
   the drill serves the case facing the way your algorithm expects it. */

let casesGroup = 'pll';
const openCases = new Set();
let casesOnly = 'all';   // all | drilled | untried

/* ---------- an algorithm, written so you can read it ----------

   A wall of twenty letters is not something you can learn from. Hands do not
   learn moves, they learn groups of moves -- the sexy move, the sledgehammer,
   the pull-out-and-back -- and an algorithm written in those groups is one you
   can look at once and repeat. So the moves are cut at the joints: the known
   triggers are found first and whatever is left over falls into fours. */

const TRIGGERS = [
  "F R U R' U' F'", "f R U R' U' f'",
  "R U R' U'", "R' U' R U", "L U L' U'", "L' U' L U",
  "r U R' U'", "r' F R F'", "R' F R F'", "R F R' F'", "F R' F' R", "F' R' F R",
  "M2 U M2", "M2 U' M2", "M' U M", "M U M'",
  "R U2 R'", "R' U2 R", "L U2 L'", "L' U2 L", "F U2 F'", "F' U2 F",
  "R U R'", "R U' R'", "R' U R", "R' U' R",
  "L U L'", "L U' L'", "L' U L", "L' U' L",
  "F U F'", "F U' F'", "F' U F", "F' U' F",
  "D R D'", "D' R' D", "D R' D'", "D' R D"
].map((one) => one.split(' '));

/** The moves of an algorithm, cut into the groups your hands actually do. */
function chunkMoves(moves) {
  const turns = moves.split(/\s+/).filter(Boolean);
  const groups = [];
  let at = 0;
  while (at < turns.length) {
    const hit = TRIGGERS.find((trigger) => trigger.length <= turns.length - at
      && trigger.every((turn, step) => turn === turns[at + step]));
    if (hit) {
      groups.push(turns.slice(at, at + hit.length));
      at += hit.length;
      continue;
    }
    // Nothing known here: take a mouthful and look again.
    const loose = [];
    while (at < turns.length && loose.length < 4) {
      const soon = TRIGGERS.find((trigger) => trigger.length <= turns.length - at
        && trigger.every((turn, step) => turn === turns[at + step]));
      if (soon && loose.length) break;
      loose.push(turns[at++]);
    }
    groups.push(loose);
  }
  return groups;
}

/** The moves as elements: one span per group, so they can be spaced apart. */
function spellAlg(moves) {
  const holder = document.createElement('code');
  holder.className = 'alg-moves';
  for (const group of chunkMoves(moves)) {
    const part = document.createElement('span');
    part.className = 'alg-chunk';
    part.textContent = group.join(' ');
    holder.append(part);
  }
  return holder;
}

function algRow(entry, alg) {
  const row = document.createElement('div');
  row.className = 'alg-row';
  row.dataset.mine = String(chosenAlg(entry) === alg);
  row.dataset.own = String(Boolean(alg.mine));

  const star = document.createElement('button');
  star.type = 'button';
  star.className = 'alg-star';
  star.title = t('This is the one I use');
  star.setAttribute('aria-label', `Kies ${alg.moves}`);
  star.textContent = '★';
  star.addEventListener('click', () => {
    pickAlg(entry, alg);
    renderCaseBook();
    // A case already on the mat should turn round to face the new algorithm.
    if (drilling?.id === entry.id) startCase(entry);
  });

  const body = document.createElement('div');
  body.className = 'alg-body';
  body.append(spellAlg(alg.moves));

  const under = document.createElement('div');
  under.className = 'alg-under';
  const count = document.createElement('small');
  count.textContent = t('{n} moves', { n: alg.turns }) + (alg.mine ? t(' · your own') : '');
  under.append(count);

  const show = document.createElement('button');
  show.type = 'button';
  show.className = 'link';
  show.textContent = t('show me');
  show.addEventListener('click', () => showAlgOnCube(entry, alg));
  under.append(show);

  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'link';
  copy.textContent = t('copy');
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(alg.moves);
      toast(t('Copied.'));
    } catch {
      toast(t('Copying did not work in this browser.'));
    }
  });
  under.append(copy);

  if (alg.mine) {
    const drop = document.createElement('button');
    drop.type = 'button';
    drop.className = 'link danger';
    drop.textContent = t('remove');
    drop.addEventListener('click', () => {
      dropMyAlg(play(), algKey(entry), alg.moves);
      persist();
      foldInMyAlgs(entry);
      if (settings.pickedAlg?.[algKey(entry)] === alg.moves) {
        const rest = { ...settings.pickedAlg };
        delete rest[algKey(entry)];
        settings.pickedAlg = rest;
        storeSettings();
      }
      renderCaseBook();
      toast(t('Removed.'));
    });
    under.append(drop);
  }

  body.append(under);
  row.append(star, body);
  return row;
}

/* ---------- typing in one of your own ---------- */

function algAdder(entry, after) {
  const form = document.createElement('div');
  form.className = 'alg-add';

  const field = document.createElement('input');
  field.type = 'text';
  field.placeholder = t("Your own way, e.g. R U R' U' R' F R F'");
  field.autocomplete = 'off';
  field.spellcheck = false;
  field.maxLength = 120;

  const go = document.createElement('button');
  go.type = 'button';
  go.className = 'text-button';
  go.textContent = t('Check it');

  const said = document.createElement('p');
  said.className = 'import-note';

  const judge = () => {
    const moves = field.value.trim().replace(/\s+/g, ' ');
    if (!moves) return;
    if (entry.algs.some((alg) => alg.moves === moves)) {
      said.textContent = t('That one is already there.');
      return;
    }
    const tried = tryMyAlg(entry, moves);
    if (!tried.ok) {
      // The reason matters: "breekt de eerste twee lagen" is a typo, "lost een
      // ander geval op" is the right algorithm filed under the wrong case.
      said.textContent = tried.why === 'it leaves the whole cube turned'
        ? t('Refused — it leaves the cube turned. Put the counter-rotation after it (y, x2, …) and the picture will match too.')
        : t('Refused — {why}. Tried on a real cube, so it is not the app.', { why: t(tried.why) });
      said.dataset.bad = 'true';
      return;
    }
    keepMyAlg(play(), algKey(entry), moves);
    persist();
    foldInMyAlgs(entry);
    field.value = '';
    said.textContent = '';
    delete said.dataset.bad;
    renderCaseBook();
    toast(t('Checked on a real cube and added — {n} moves.', { n: tried.alg.turns }));
    after?.();
  };

  go.addEventListener('click', judge);
  field.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); judge(); }
  });

  const line = document.createElement('div');
  line.className = 'move-new';
  line.append(field, go);
  form.append(line, said);
  return form;
}

/* ---------- a line to yourself about a case ---------- */

function noteField(entry) {
  const wrap = document.createElement('label');
  wrap.className = 'field case-note';
  const name = document.createElement('span');
  name.textContent = t('Note');
  const field = document.createElement('input');
  field.type = 'text';
  field.maxLength = 140;
  field.autocomplete = 'off';
  field.placeholder = t('e.g. right hand, x rotation at the end');
  field.value = noteOf(play(), algKey(entry));
  // Saved when you look away rather than on every keystroke: a note is a
  // sentence, and writing to storage per letter is how you lose one.
  const keep = () => {
    const had = noteOf(play(), algKey(entry));
    const now = field.value.trim();
    if (had === now) return;
    keepNote(play(), algKey(entry), now);
    persist();
  };
  field.addEventListener('blur', keep);
  field.addEventListener('change', keep);
  wrap.append(name, field);
  return wrap;
}

/* ---------- the card at the top of an opened case ----------

   Name and picture first, big enough to recognise from across the table, and
   the algorithms under it. Which is the order you use it in: you look at a case
   to find out what it is, and only then at what to do about it. */

/**
 * One cube for the whole case book, built the first time you ask to be shown
 * something. It lives beside the picture rather than instead of it: the flat
 * diagram is what you recognise a case by, and the cube is what shows you what
 * the algorithm does to it.
 */
let bookCube = null;

async function showAlgOnCube(entry, alg) {
  bookCube ??= await makeCube({ size: 132, drag: true, angle: [-24, -32] });
  if (!bookCube) return;
  const slot = el.casesBody.querySelector('.case-row[data-open="true"] .case-cube');
  if (slot && !slot.contains(bookCube.el)) slot.replaceChildren(bookCube.el);
  slot?.removeAttribute('hidden');
  bookCube.play(alg.moves, { pace: 420, from: alg.setup });
}

function caseCard(entry, row) {
  const card = document.createElement('div');
  card.className = 'case-card';

  const face = document.createElement('div');
  face.className = 'case-face';
  face.append(caseThumb(entry));

  const about = document.createElement('div');
  about.className = 'case-about';
  const name = document.createElement('h3');
  name.textContent = entry.id;
  about.append(name);
  if (entry.name && entry.name !== entry.id) {
    const said = document.createElement('p');
    said.className = 'case-said';
    said.textContent = entry.name;
    about.append(said);
  }

  const facts = document.createElement('dl');
  facts.className = 'case-facts';
  // Each fact is wrapped, so a label can never end up in one column with the
  // wrong value beside it when the row wraps on a narrow screen.
  const fact = (label, value) => {
    const one = document.createElement('div');
    one.className = 'case-fact';
    const key = document.createElement('dt');
    key.textContent = label;
    const said = document.createElement('dd');
    said.textContent = value;
    one.append(key, said);
    facts.append(one);
  };
  fact(t('Your way'), t('{n} moves', { n: chosenAlg(entry).turns }));
  fact(t('Ways'), `${entry.algs.length}`);
  if (row) {
    fact('Gemiddeld', formatTime(row.mean));
    fact(t('Best'), formatTime(row.best));
    fact(t('Done'), `${row.count}×`);
  } else {
    fact(t('Done'), t('never yet'));
  }
  about.append(facts);

  const cube = document.createElement('div');
  cube.className = 'case-cube';
  cube.hidden = true;

  card.append(face, about, cube);
  return card;
}

let casesRecall = new Map();

function renderCaseBook() {
  if (!caseSet) return;
  const mine = groupCases(casesGroup);
  const standing = new Map(caseStanding(play(), casesGroup).map((row) => [row.id, row]));
  const times = play().cases[casesGroup] || {};
  casesRecall = new Map(recallStanding(play().cases, casesGroup).map((row) => [row.id, row]));

  el.casesGroups.replaceChildren(...Object.entries(caseSet.GROUPS).map(([group, shape]) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.active = String(group === casesGroup);
    const done = Object.keys(play().cases[group] || {}).length;
    const many = caseSet.cases.filter((entry) => entry.group === group).length;
    chip.textContent = `${shape.name} · ${done ? `${done}/${many}` : many}`;
    chip.addEventListener('click', () => { casesGroup = group; renderCaseBook(); });
    return chip;
  }));

  el.casesFilter.replaceChildren(...[
    ['all', t('all')], ['drilled', t('drilled')], ['untried', t('never yet')],
    ['due', t('refreshing')], ['own', t('my own alg')]
  ].map(([id, label]) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'link';
    chip.dataset.active = String(id === casesOnly);
    chip.textContent = label;
    chip.addEventListener('click', () => { casesOnly = id; renderCaseBook(); });
    return chip;
  }));

  // Slowest first among the ones you have measured, then everything you have
  // never touched -- which is the order you would want to work through them in.
  const keeps = (entry) => {
    if (casesOnly === 'drilled') return standing.has(entry.id);
    if (casesOnly === 'untried') return !standing.has(entry.id);
    if (casesOnly === 'due') return (casesRecall.get(entry.id)?.ratio ?? 0) >= 1;
    if (casesOnly === 'own') return entry.algs.some((alg) => alg.mine);
    return true;
  };

  const shown = mine.filter(keeps).sort((a, b) => {
    if (casesOnly === 'due') {
      return (casesRecall.get(b.id)?.ratio ?? 0) - (casesRecall.get(a.id)?.ratio ?? 0);
    }
    const one = standing.get(a.id);
    const two = standing.get(b.id);
    if (one && two) return two.mean - one.mean;
    if (one) return -1;
    if (two) return 1;
    return 0;
  });

  if (!shown.length) {
    el.casesBody.replaceChildren(line(casesOnly === 'due'
      ? t('Nothing to go over — everything you have drilled is still fresh.')
      : t('Nothing to show with this choice.'), 'import-note'));
    return;
  }

  const list = document.createElement('div');
  list.className = 'case-rows';
  for (const entry of shown) {
    const row = standing.get(entry.id);
    const due = casesRecall.get(entry.id);
    const item = document.createElement('div');
    item.className = 'case-row';
    item.dataset.open = String(openCases.has(entry.id));
    if (due && due.ratio >= 1) item.dataset.due = 'true';

    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'case-head';
    head.append(caseThumb(entry));
    const label = document.createElement('span');
    label.className = 'case-name';
    const name = document.createElement('b');
    name.textContent = entry.id;
    const about = document.createElement('small');
    about.textContent = entry.name && entry.name !== entry.id ? entry.name : '';
    label.append(name, about);
    const figure = document.createElement('span');
    figure.className = 'case-figure';
    figure.textContent = row
      ? `${formatTime(row.mean)} gem · ${formatTime(row.best)} best · ${row.count}×`
      : `${entry.algs.length} ${entry.algs.length === 1 ? 'alg' : 'algs'}`;
    head.append(label, figure);
    head.addEventListener('click', () => {
      if (openCases.has(entry.id)) openCases.delete(entry.id);
      else openCases.add(entry.id);
      renderCaseBook();
    });
    item.append(head);

    if (openCases.has(entry.id)) {
      const body = document.createElement('div');
      body.className = 'case-body';
      body.append(caseCard(entry, row));

      if (due) {
        const when = document.createElement('p');
        when.className = 'case-due';
        when.dataset.now = String(due.ratio >= 1);
        when.textContent = due.ratio >= 1
          ? t('Due for a repeat — {when}.', { when: whenDue(due) })
          : t('Fresh — up again {when}.', { when: whenDue(due) });
        body.append(when);
      }

      const algs = document.createElement('div');
      algs.className = 'alg-list';
      const heading = document.createElement('h4');
      heading.className = 'alg-heading';
      heading.textContent = t('Ways through it — the star is yours');
      algs.append(heading);
      for (const alg of entry.algs) algs.append(algRow(entry, alg));
      algs.append(algAdder(entry));
      body.append(algs);

      body.append(noteField(entry));

      const mineTimes = times[entry.id] || [];
      if (mineTimes.length) {
        const strip = document.createElement('div');
        strip.className = 'case-times';
        for (const time of mineTimes) {
          const one = document.createElement('span');
          one.textContent = formatSolve(time);
          one.title = time.at ? new Date(time.at).toLocaleString(locale()) : '';
          one.dataset.best = String(row && effective(time) === row.best);
          strip.append(one);
        }
        body.append(strip);
      }

      const actions = document.createElement('div');
      actions.className = 'detail-actions';
      const go = document.createElement('button');
      go.type = 'button';
      go.className = 'primary';
      go.textContent = t('Drill this case now');
      go.addEventListener('click', () => {
        el.casesSheet.close();
        startCase(entry);
        toast(t('{id} — turn the setup, then solve the case.', { id: entry.id }));
      });
      actions.append(go);

      if (mineTimes.length) {
        const forget = document.createElement('button');
        forget.type = 'button';
        forget.className = 'danger';
        forget.textContent = t('Clear the times');
        forget.addEventListener('click', () => {
          const had = mineTimes;
          delete play().cases[casesGroup][entry.id];
          persist();
          renderCaseBook();
          toast(t('Times for {id} cleared.', { id: entry.id }), {
            label: 'Ongedaan',
            run: () => {
              play().cases[casesGroup] ||= {};
              play().cases[casesGroup][entry.id] = had;
              persist();
              renderCaseBook();
            }
          });
        });
        actions.append(forget);
      }
      body.append(actions);
      item.append(body);
    }

    list.append(item);
  }
  el.casesBody.replaceChildren(list);
}

async function openCaseBook(group = null) {
  if (group) casesGroup = group;
  try {
    await loadCases();
  } catch {
    toast(t('The cases could not be loaded.'));
    return;
  }
  renderCaseBook();
  openSheet(el.casesSheet);
}

el.casesClose.addEventListener('click', () => el.casesSheet.close());


/* ---------- recognising a case ----------

   No cube, no turning: a picture and four names, and how long you take to say
   which one you are looking at. That is the half of a case that is usually slow
   -- knowing the algorithm and finding the case are two different skills, and
   only one of them is measured by drilling with a cube in your hands.

   The three wrong answers are drawn from the same group, so it is never a
   guess between a PLL and an OLL. */

let spotGroup = 'pll';
let spotting = null;    // { entry, choices, at }
let spotRound = { asked: 0, right: 0, times: [] };

function nextSpot() {
  const pool = groupCases(spotGroup);
  if (pool.length < 4) { spotting = null; return; }

  // What you are slowest and least sure about comes up more often, but not
  // always: a drill that only ever asks the hard ones stops measuring the rest.
  const standing = spotStanding(play(), spotGroup);
  const shaky = standing.slice(0, Math.max(4, Math.ceil(standing.length / 3)))
    .map((row) => pool.find((entry) => entry.id === row.id)).filter(Boolean);
  const from = shaky.length && Math.random() < 0.5 ? shaky : pool;
  const entry = from[Math.floor(Math.random() * from.length)];

  const others = pool.filter((one) => one.id !== entry.id);
  const wrong = [];
  while (wrong.length < 3 && others.length) {
    wrong.push(...others.splice(Math.floor(Math.random() * others.length), 1));
  }
  const choices = [entry, ...wrong].sort(() => Math.random() - 0.5);
  spotting = { entry, choices, at: performance.now() };
}

function renderSpot() {
  if (!caseSet) return;

  // Only groups with four cases in them: the question is one picture and four
  // names, and the three of the yellow cross cannot make four names.
  const askable = Object.keys(caseSet.GROUPS).filter((group) => groupCases(group).length >= 4);
  el.spotGroups.replaceChildren(...askable.map((group) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.active = String(group === spotGroup);
    chip.textContent = caseSet.GROUPS[group].name;
    chip.addEventListener('click', () => {
      spotGroup = group;
      spotRound = { asked: 0, right: 0, times: [] };
      nextSpot();
      renderSpot();
    });
    return chip;
  }));

  const parts = [];
  if (!spotting) {
    parts.push(line(t('Too few cases in this group to choose from.'), 'import-note'));
    el.spotBody.replaceChildren(...parts);
    return;
  }

  const card = document.createElement('div');
  card.className = 'spot-card';
  card.append(caseThumb(spotting.entry));
  parts.push(card);

  const answers = document.createElement('div');
  answers.className = 'spot-answers';
  for (const choice of spotting.choices) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'spot-answer';
    const name = document.createElement('b');
    name.textContent = choice.id;
    button.append(name);
    if (choice.name && choice.name !== choice.id) {
      const about = document.createElement('small');
      about.textContent = choice.name;
      button.append(about);
    }
    button.addEventListener('click', () => answerSpot(choice, button));
    answers.append(button);
  }
  parts.push(answers);

  const score = document.createElement('p');
  score.className = 'records-aside';
  if (spotRound.asked) {
    const middle = spotRound.times.slice().sort((a, b) => a - b)[spotRound.times.length >> 1];
    score.textContent = t('{right} of {asked} right · {time} each', { right: spotRound.right, asked: spotRound.asked, time: formatTime(middle) });
  } else {
    score.textContent = t('Which case are you looking at? Tap the name.');
  }
  parts.push(score);

  const standing = spotStanding(play(), spotGroup);
  if (standing.length >= 3) {
    const rows = standing.slice(0, 6).map((row) => [
      row.id,
      `${formatTime(row.mean)} · ` + t('{right}/{all} right', { right: row.right, all: row.count })
    ]);
    const block = document.createElement('section');
    block.className = 'records-block';
    const heading = document.createElement('h3');
    heading.textContent = t('What takes you longest');
    block.append(heading, figures(rows));
    parts.push(block);
  }

  el.spotBody.replaceChildren(...parts);
}

function answerSpot(choice, button) {
  if (!spotting || button.dataset.said) return;
  const took = performance.now() - spotting.at;
  const right = choice.id === spotting.entry.id;

  recordSpot(play(), spotGroup, spotting.entry.id, took, right);
  persist();
  spotRound.asked++;
  spotRound.times.push(took);
  if (right) spotRound.right++;

  // The answer stays on screen for a moment: getting it wrong and being shown
  // which one it was is the only part of this that teaches you anything.
  for (const other of el.spotBody.querySelectorAll('.spot-answer')) {
    other.dataset.said = 'true';
    if (other.querySelector('b').textContent === spotting.entry.id) other.dataset.right = 'true';
  }
  if (!right) button.dataset.wrong = 'true';
  cue(right ? 'target' : 'miss');

  setTimeout(() => {
    nextSpot();
    renderSpot();
  }, right ? 320 : 1100);
}

async function openSpot(group = null) {
  if (group) spotGroup = group;
  try {
    await loadCases();
  } catch {
    toast(t('The cases could not be loaded.'));
    return;
  }
  spotRound = { asked: 0, right: 0, times: [] };
  nextSpot();
  renderSpot();
  openSheet(el.spotSheet);
}

el.spotClose.addEventListener('click', () => el.spotSheet.close());

/* ---------- the drill itself ---------- */

function renderDrill() {
  const { cases, dropped, GROUPS } = caseSet;
  const parts = [];

  const picker = document.createElement('div');
  picker.className = 'chip-row';
  for (const [group, shape] of Object.entries(GROUPS)) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.active = String(group === drillGroup);
    chip.title = shape.about;
    chip.textContent = `${shape.name} · ${cases.filter((entry) => entry.group === group).length}`;
    chip.addEventListener('click', () => {
      drillGroup = group;
      // A set belongs to its group, so switching group cannot keep pointing at
      // one from the group you just left.
      if (!['spread', 'weak', 'recall'].includes(drillFocus)) drillFocus = 'spread';
      renderDrill();
    });
    picker.append(chip);
  }
  parts.push(picker);
  parts.push(line(GROUPS[drillGroup].about, 'import-note'));

  // What to serve. Only the spread is always here; your weakest third needs
  // enough measured for the word to mean anything, and the rest are yours.
  const ranked = rankedCases(drillGroup);
  const focus = document.createElement('div');
  focus.className = 'mode-list tight';

  const choice = (id, label, about, { off = false } = {}) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.active = String(id === drillFocus);
    button.disabled = off;
    const name = document.createElement('b');
    name.textContent = label;
    const note = document.createElement('small');
    note.textContent = about;
    button.append(name, note);
    button.addEventListener('click', () => { drillFocus = id; renderDrill(); });
    return button;
  };

  focus.append(choice('spread', t('Everything mixed together'),
    t('First what you have not had yet, then at random. {n} cases.', { n: groupCases(drillGroup).length })));
  const due = dueCases(drillGroup).length;
  focus.append(choice('recall', t('Refreshing'), due
    ? t(due === 1 ? '{n} case is long enough ago to wobble. That one first.' : '{n} cases are long enough ago to wobble. Those first, the shakiest at the front.', { n: due })
    : t('Nothing due — everything you have drilled is still fresh. Come back tomorrow.'),
  { off: due === 0 }));
  focus.append(choice('weak', t('Your weakest third'), ranked >= 6
    ? t('The {n} cases you are slowest on, and nothing else.', { n: Math.max(3, Math.ceil(ranked / 3)) })
    : t('Too little measured yet — do {n} more first, then it knows which they are.', { n: 6 - ranked }),
  { off: ranked < 6 }));

  for (const set of setsOf(play(), drillGroup)) {
    const button = choice(set.id, set.name, t('{n} cases, chosen by you.', { n: set.cases.length }));
    const edit = document.createElement('span');
    edit.className = 'set-edit';
    edit.textContent = 'wijzig';
    edit.addEventListener('click', (event) => {
      event.stopPropagation();
      openSetBuilder(drillGroup, set);
    });
    button.append(edit);
    focus.append(button);
  }

  const make = document.createElement('button');
  make.type = 'button';
  make.className = 'make-set';
  make.textContent = t('+  Put a set together yourself');
  make.addEventListener('click', () => openSetBuilder(drillGroup));
  focus.append(make);
  parts.push(focus);

  const actions = document.createElement('div');
  actions.className = 'detail-actions';

  const go = document.createElement('button');
  go.type = 'button';
  go.id = 'drill-go';
  go.className = 'primary';
  go.textContent = drilling ? t('Next case') : 'Beginnen';
  go.addEventListener('click', () => {
    const entry = nextCase(cases, drillGroup);
    if (!entry) return;
    startCase(entry);
    el.drillSheet.close();
    toast(t('{id} — turn the setup, then solve the case.', { id: entry.id }));
  });
  actions.append(go);

  const seeTimes = document.createElement('button');
  seeTimes.type = 'button';
  seeTimes.id = 'drill-times';
  seeTimes.textContent = t('Case book');
  seeTimes.addEventListener('click', () => {
    el.drillSheet.close();
    openCaseBook(drillGroup);
  });
  actions.append(seeTimes);

  if (drilling) {
    const stop = document.createElement('button');
    stop.type = 'button';
    stop.id = 'drill-stop';
    stop.textContent = t('Stop');
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

  const standing = caseStanding(play(), drillGroup);
  if (standing.length) {
    const list = document.createElement('div');
    list.className = 'round-lines';
    for (const row of standing.slice(0, 8)) {
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
    heading.textContent = t('Least known at the top — {done} of {all} drilled', { done: standing.length, all: groupCases(drillGroup).length });
    block.append(heading, list);
    parts.push(block);
  }

  const note = document.createElement('p');
  note.className = 'import-note';
  note.textContent = dropped.length
    ? t('Turn the setup on a solved cube and the case is in front of you. {n} case(s) were refused while loading and are not offered.', { n: dropped.length })
    : t('Turn the setup on a solved cube, then solve only that case. Your times stay with the case and do not go into your session.');
  parts.push(note);

  el.drillTitle.textContent = drilling
    ? `Trainen — ${drilling.id}`
    : `Trainen — ${focusName(drillGroup)}`;
  el.drillBody.replaceChildren(...parts);
}

/** Open the drill, optionally already pointed at the thing you are worst at. */
async function openDrill({ focus = null, group = null } = {}) {
  if (group) drillGroup = group;
  if (focus) drillFocus = focus;
  try {
    await loadCases();
  } catch (error) {
    toast(t('The cases could not be loaded.'));
    console.error('Drilling:', error);
    return;
  }
  renderDrill();
  openSheet(el.drillSheet);
}

el.drillClose.addEventListener('click', () => el.drillSheet.close());

/* ---------- splits ----------

   Four stretches of one solve, timed by tapping between them. Only possible
   when you are timing by hand: on the mat, taking a hand off to mark a stage is
   the same gesture as stopping. */

const PHASES = {
  333: ['cross', 'F2L', 'OLL', 'PLL'],
  other: ['part 1', 'part 2', 'part 3', 'part 4']
};

// A one-handed or blindfolded solve is still cross, F2L, OLL, PLL: the stages
// belong to the puzzle in your hands, not to the event on the entry form.
const phaseNames = (puzzle) => (PHASES[puzzleById(puzzle).cube] || PHASES.other).map((name) => t(name));

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

/** The metronome, opened from the side list. */
function openMetro() {
  renderMetro();
  openSheet(el.metroSheet);
}

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
  // The side list is hidden in this mode, so the page must not go on holding a
  // column open for it -- that is what pushed the whole display to the right.
  if (on) showRail(false);
  else fitRail();
  // No toast: it landed over the very thing the mode exists to show, and then
  // faded, leaving no way out on the screen at all. There is a button now.
  if (on) el.settings.close();
}

/* ---------- what the keys and gestures do ---------- */

const KEYS = [
  ['Timer', [
    ['Spatie vasthouden', t('Gets it ready; letting go starts the time')],
    ['Spatie', t('Stops a running time')],
    ['Spatie kort tikken', t('Starts the inspection, when it is on')],
    ['Escape', t('Cancels inspection, closes a selection, leaves the big display')],
    [t('Tapping the screen'), t('The same as space, on a phone')]
  ]],
  [t('On your mat'), [
    [t('Hands on and straight off again'), t('Once: inspection. Twice quickly: delete the last time')],
    ['Handen erop tot groen', t('An ordinary start; never counts as a touch')],
    [t('Reset button on the timer'), t('The app follows, but never interrupts a running solve')]
  ]],
  [t('In the list of times'), [
    ['Tikken', t('Details of that solve')],
    ['Vasthouden', t('Quick actions: +2, DNF, ★, does not count, move, delete')],
    [t('Swiping left'), t('Into the bin')],
    [t('Swiping right'), 'Kort: +2. Verder door: DNF'],
    [t('select'), t('Penalise, move or delete several at once')]
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

/** What the keys and gestures do, opened from the side list. */
function openKeys() {
  renderKeys();
  openSheet(el.keysSheet);
}

el.keysClose.addEventListener('click', () => el.keysSheet.close());

/* ---------- how hard was that scramble ----------

   Every timer stores your scramble; none of them look at it. The puzzle engine
   is already here, so "how short was the cross" is a question that can simply
   be answered -- for all six colours at once, which puts a number on your own
   colour neutrality that nobody has ever been able to give you.

   The table takes a few seconds to work out and is only worth having if you ask
   for it, so it is built the first time you look and kept for the session. */

let crossKit = null;
let crossBusy = null;

async function loadCross() {
  if (crossKit) return crossKit;
  if (crossBusy) return crossBusy;

  crossBusy = (async () => {
    const [{ puzzles }, { Alg }, cross] = await Promise.all([
      import('../vendor/cubing/puzzles/index.js'),
      import('../vendor/cubing/alg/index.js'),
      import('./cross.js')
    ]);
    const kpuzzle = await puzzles['3x3x3'].kpuzzle();
    const table = cross.buildTable(kpuzzle, Alg);
    crossKit = { kpuzzle, Alg, table, cross };
    return crossKit;
  })();
  return crossBusy;
}

/** The scrambles of this session, newest first, that are 3x3 and were kept. */
function scramblesHere(most = 200) {
  if (!holdingA333()) return [];
  return counting(solves).slice(-most).map((solve) => solve.scramble).filter(Boolean);
}

function crossBlock(kit) {
  const scrambles = scramblesHere();
  if (scrambles.length < 5) return null;

  const shape = kit.cross.neutrality(scrambles, settings.crossFace, kit.kpuzzle, kit.Alg, kit.table);
  if (!shape) return null;

  const face = kit.cross.FACES.find((entry) => entry.id === settings.crossFace);
  const list = document.createElement('div');
  list.className = 'round-lines';
  for (const [label, value] of [
    [t('Your colour'), `${face?.name || settings.crossFace} · ` + t('{n} moves', { n: shape.mine.toFixed(1) })],
    [t('Shortest colour'), t('{n} moves', { n: shape.shortest.toFixed(1) })],
    [t('You leave behind'), t('{n} moves per solve', { n: shape.lost.toFixed(1) })],
    [t('3 or more shorter'), t('{a} of {b}', { a: shape.muchBetter, b: shape.counted })]
  ]) {
    const row = document.createElement('div');
    const name = document.createElement('span');
    name.textContent = label;
    const figure = document.createElement('b');
    figure.textContent = value;
    row.append(name, figure);
    list.append(row);
  }

  const note = line(shape.lost < 0.4
    ? t('There is little to win here: on your colour you are as good as always already on the shortest.')
    : t('Over {n} scrambles another colour was on average {moves} moves shorter. That is what being colour neutral would save you.', { n: shape.counted, moves: shape.lost.toFixed(1) }),
  'records-aside');

  return recordBlock(t('Your scrambles'), [list, note]);
}

/** The deck you want dealt from. */
function renderTastePick() {
  if (!el.tastePick) return;
  el.tastePick.replaceChildren(...TASTES.map((taste) => {
    const option = document.createElement('option');
    option.value = taste.id;
    option.textContent = taste.label;
    option.title = taste.about;
    option.selected = taste.id === settings.taste;
    return option;
  }));
}

/** Which colour you solve on, so the comparison means something. */
function renderCrossFace() {
  if (!el.crossFace) return;
  el.crossFace.replaceChildren(...[
    { id: 'D', name: 'geel' }, { id: 'U', name: 'wit' }, { id: 'F', name: 'groen' },
    { id: 'B', name: 'blauw' }, { id: 'R', name: 'rood' }, { id: 'L', name: 'oranje' }
  ].map((face) => {
    const option = document.createElement('option');
    option.value = face.id;
    option.textContent = face.name;
    option.selected = face.id === settings.crossFace;
    return option;
  }));
}

/**
 * The cross you missed, said once the solve is over.
 *
 * Before would spoil it -- knowing the cross is four moves changes how you look
 * at the scramble. Afterwards it is the only moment the scramble is still fresh
 * enough for the answer to stick.
 */
async function sayCross(usedScramble) {
  if (!settings.crossTip || !holdingA333() || !usedScramble) return;
  let kit;
  try {
    kit = await loadCross();
  } catch {
    return;
  }
  const lengths = kit.cross.crossLengths(usedScramble, kit.kpuzzle, kit.Alg, kit.table);
  if (!lengths.length) return;

  const mine = lengths.find((entry) => entry.id === settings.crossFace);
  const best = lengths[0];
  if (!mine) return;

  toast(best.moves < mine.moves
    ? t('The cross could have gone in {n} on {colour}, but in {m} on {other}.', { n: mine.moves, colour: kit.cross.FACES.find((f) => f.id === settings.crossFace)?.name, m: best.moves, other: best.name })
    : t('The cross could have gone in {n} moves.', { n: mine.moves }));
}

/* ---------- sharing ----------

   A card, because a screenshot of a list of numbers is not something anyone
   wants to look at, and a link, because sometimes the numbers are the point.
   Neither needs a server. */

let sharing = null;

function renderShare() {
  if (!sharing) return;
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--led').trim() || '#4fc3f7';
  const dark = document.documentElement.dataset.theme === 'dark';
  const card = drawCard(cardFor(sharing.solves, {
    title: sharing.title,
    name: el.shareName.value.trim(),
    accent,
    dark
  }));
  el.shareImage.src = card.toDataURL('image/png');
  el.shareImage.dataset.ready = 'true';
}

function openShare(title, list) {
  if (!list.length) { toast(t('Nothing to share yet.')); return; }
  sharing = { title, solves: list.map((solve) => ({ ms: solve.ms, penalty: solve.penalty || 'none' })) };
  el.shareWhat.textContent = t(list.length === 1 ? '{n} time · {title}' : '{n} times · {title}', { n: list.length, title });
  el.shareName.value = settings.shareName || '';
  el.shareSend.hidden = !canShareFiles();
  renderShare();
  openSheet(el.shareSheet);
}

el.shareClose.addEventListener('click', () => el.shareSheet.close());
el.shareSheet.addEventListener('close', () => { sharing = null; });
el.shareName.addEventListener('input', () => {
  settings.shareName = el.shareName.value.trim().slice(0, 24);
  storeSettings();
  renderShare();
});

const shareFileName = () => `cubetimer-${(sharing?.title || 'times').replace(/[^\p{L}\p{N}]+/gu, '-')}.png`;

async function shareBlob() {
  const response = await fetch(el.shareImage.src);
  return response.blob();
}

el.shareSave.addEventListener('click', async () => {
  el.shareSave.blur();
  const blob = await shareBlob();
  const address = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = address;
  link.download = shareFileName();
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(address), 20000);
  toast(t('Card saved.'));
});

el.shareSend.addEventListener('click', async () => {
  el.shareSend.blur();
  try {
    const file = new File([await shareBlob()], shareFileName(), { type: 'image/png' });
    await navigator.share({ files: [file], text: `${sharing.title} — Cubetimer` });
  } catch (error) {
    if (error?.name !== 'AbortError') toast(t('Sending did not work; just save the card instead.'));
  }
});

el.shareLink.addEventListener('click', async () => {
  el.shareLink.blur();
  const address = shareLink(sharing.solves, { name: el.shareName.value.trim() });
  try {
    await navigator.clipboard.writeText(address);
    toast('Link gekopieerd.');
  } catch {
    toast(address);
  }
});

/**
 * Times somebody sent you. They are shown and never stored: this is somebody
 * else's afternoon, and it has no business in your averages.
 */
function showShared() {
  const sent = readShared();
  if (!sent) return;
  history.replaceState(null, '', location.pathname + location.search);

  const average = averageOf(sent.solves, sent.solves.length);
  el.pickedTitle.textContent = sent.name ? t('From {name}', { name: sent.name }) : t('Somebody sent you this');
  el.pickedList.replaceChildren(...sent.solves.map((solve, index) => {
    const item = document.createElement('li');
    const row = document.createElement('div');
    row.className = 'solve';
    const number = document.createElement('span');
    number.className = 'solve-index';
    number.textContent = String(index + 1);
    const label = document.createElement('span');
    label.className = 'solve-time';
    label.textContent = formatSolve(solve);
    row.append(number, label);
    item.append(row);
    return item;
  }));

  const note = document.createElement('p');
  note.className = 'import-note';
  note.textContent = Number.isFinite(average)
    ? t('Average {time}. These times are not yours and are not kept.', { time: formatTime(average) })
    : t('These times are not yours and are not kept.');
  el.pickedList.append(note);
  openSheet(el.pickedSheet);
}



/* ---------- warming up ----------

   Measured over every sitting in the app: the first few solves are slower than
   the rest, reliably. Until now they went into your average anyway and dragged
   it about. Switched on, they are marked as not counting -- the same mark the
   list already has -- so they are yours to look at and nobody's to average. */

let warmingUp = false;

function setWarmUp(on) {
  warmingUp = on;
  el.body.dataset.warm = String(on);
  renderMode();
  toast(on
    ? t('Warming up — these do not count. Turn it off when you start.')
    : t('Warm-up off. From now on everything counts again.'));
}

/* ---------- one scramble until it goes right ----------

   A solve that went badly is worth doing again, and again, until it goes the
   way it should have. The app keeps the scramble, so it can simply keep handing
   it back -- and it knows what your ordinary pace is, so it knows when to stop. */

let grinding = null;   // { scramble, target, tries }

function startGrind(solve) {
  const scored = counting(solves).map(effective).filter(Number.isFinite);
  if (scored.length < 5) { toast(t('Too few times yet to know what is good enough.')); return; }
  const middle = scored.slice().sort((a, b) => a - b)[scored.length >> 1];

  grinding = { scramble: solve.scramble, target: middle, tries: 0 };
  setScramble(solve.scramble);
  keepScramble = true;
  renderMode();
  toast(t('This scramble stays until you are under {time}.', { time: formatTime(middle) }));
}

function stopGrind(said) {
  grinding = null;
  keepScramble = false;
  renderMode();
  newScramble();
  if (said) toast(said);
}

function judgeGrind(solve) {
  grinding.tries++;
  const value = effective(solve);
  const beat = Number.isFinite(value) && value < grinding.target;

  if (beat) {
    cue('win');
    if (settings.celebrate) confetti('burst');
    stopGrind(t(grinding.tries === 1 ? '{time} — under {target} after {n} try.' : '{time} — under {target} after {n} tries.', { time: formatSolve(solve), target: formatTime(grinding.target), n: grinding.tries }));
    return;
  }

  keepScramble = true;
  setScramble(grinding.scramble);
  renderMode();
  toast(t('{time} — not under {target} yet. Try {n}.', { time: formatSolve(solve), target: formatTime(grinding.target), n: grinding.tries + 1 }), {
    label: 'Genoeg',
    run: () => stopGrind('')
  });
}

/* ---------- when to stop ----------

   The shape of a sitting says people get slower towards the end, and nobody
   notices it happening. Eight in a row slower than the eight you opened with is
   not a bad patch, it is being tired -- so it is said once, quietly, and not
   again for half an hour. */

const REST_GAP_MS = 30 * 60 * 1000;
let restSaid = 0;

function restIfFlagging() {
  if (Date.now() - restSaid < REST_GAP_MS) return;
  const run = thisSitting();
  if (run.length < 16) return;

  const values = run.map(effective).filter(Number.isFinite);
  if (values.length < 16) return;
  const middle = (list) => list.slice().sort((a, b) => a - b)[list.length >> 1];
  const opened = middle(values.slice(0, 8));
  const lately = middle(values.slice(-8));
  if (!(lately > opened * 1.06)) return;

  restSaid = Date.now();
  toast(t('Your last eight are {gap} slower than your first eight. Five minutes off?', { gap: formatTime(lately - opened) }));
}

/* ---------- the closing ritual ----------

   A sitting has a beginning -- you pick up the cube -- and no end at all. You
   drift off, the tab stays open, and the last thing the app ever says to you is
   a number. So there is a way to close it: what this sitting was, in one place,
   with one honest sentence about it and a card if you want to keep it.

   It saves nothing and deletes nothing. Rituals do not need state; they need a
   moment. */

/** The last unbroken run of solving, out of everything in this session. */
function thisSitting(gapMs = 30 * 60 * 1000) {
  const scored = counting(solves).filter((solve) => Number.isFinite(solve.at));
  if (!scored.length) return [];
  const run = [scored[scored.length - 1]];
  for (let at = scored.length - 2; at >= 0; at--) {
    if (run[0].at - scored[at].at > gapMs) break;
    run.unshift(scored[at]);
  }
  return run;
}

/**
 * The one sentence. Picked from what actually happened rather than from a list
 * of nice things to say -- a session that went badly gets told so kindly, which
 * is the only version of this worth having.
 */
function closingWord(run, mine) {
  const values = run.map(effective).filter(Number.isFinite);
  if (!values.length) return t('Nothing but DNFs. That counts as a session too.');

  const quickest = Math.min(...values);
  const half = Math.ceil(values.length / 2);
  const early = values.slice(0, half);
  const late = values.slice(half);
  const middle = (list) => list.slice().sort((a, b) => a - b)[list.length >> 1];
  const warmed = middle(early) - middle(late);

  if (mine.record) return t('Your record went. {time} is on the wall from now on.', { time: formatTime(quickest) });
  if (values.length >= 10 && warmed > 700) {
    return t('You got {gap} faster during this session. That is exactly what you sat down for.', { gap: formatTime(warmed) });
  }
  if (values.length >= 10 && warmed < -700) {
    return t('You slowed towards the end. That is getting tired, not getting worse — tomorrow you are back.');
  }
  if (values.length <= 5) return t('Short and done. Five solves is a session too.');
  return t('{n} solves, neatly at your own pace. That is how it is built.', { n: values.length });
}

let closingPicture = null;

function renderClosing() {
  const run = thisSitting();
  el.closingTitle.textContent = t('That is it for now — {name}', { name: currentSession().name });

  if (!run.length) {
    el.closingBody.replaceChildren(line(t('Nothing to close yet. Do a few solves first.')));
    el.closingCard.hidden = true;
    closingPicture = null;
    return;
  }

  const values = run.map(effective).filter(Number.isFinite);
  const quickest = values.length ? Math.min(...values) : null;
  const spent = run.reduce((sum, solve) => sum + (Number.isFinite(solve.ms) ? solve.ms : 0), 0);
  const five = averageOf(run.slice(-5), 5);
  // Was anything here the best you have ever done, in this session?
  const older = counting(solves).slice(0, counting(solves).length - run.length);
  const standing = best(older);
  const record = quickest !== null && (standing === null || quickest < standing);

  const rows = [
    [t('Solves'), String(run.length)],
    ['Snelste', quickest === null ? '—' : formatTime(quickest)],
    [t('Last ao5'), Number.isFinite(five) ? formatTime(five) : '—'],
    [t('Time on the cube'), formatDuration(spent)],
    [t('Started at'), new Date(run[0].at).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' })]
  ];
  if (record) rows.splice(2, 0, [t('Personal record'), t('set today')]);

  const word = closingWord(run, { record });
  el.closingBody.replaceChildren(figures(rows), line(word, 'records-aside'));

  closingPicture = {
    title: currentSession().name,
    headline: quickest === null ? '—' : formatTime(quickest),
    lines: [
      t('{n} solves', { n: run.length }) + ` · ${formatDuration(spent)}`,
      Number.isFinite(five) ? `ao5 ${formatTime(five)}` : '',
      word
    ].filter(Boolean),
    footer: [settings.shareName, new Date().toLocaleDateString(locale())].filter(Boolean).join(' \u00b7 '),
    accent: colorOf(settings, 'led'),
    dark: settings.theme === 'dark'
  };
  el.closingCard.hidden = false;
}

el.closingOpen?.addEventListener('click', () => {
  el.closingOpen.blur();
  el.statsSheet.close();
  renderClosing();
  openSheet(el.closingSheet);
});

el.closingClose?.addEventListener('click', () => el.closingSheet.close());
el.closingDone?.addEventListener('click', () => {
  el.closingSheet.close();
  cue('win');
  if (settings.celebrate) confetti('burst');
});

el.closingCard?.addEventListener('click', async () => {
  el.closingCard.blur();
  if (!closingPicture) return;
  const canvas = drawCard(closingPicture);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  const address = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = address;
  link.download = `cubetimer-session-${new Date().toISOString().slice(0, 10)}.png`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(address), 20000);
  toast(t('Card saved.'));
});

/* ---------- your cubes ----------

   Which one was on the mat. Two cubes feel different and it is easy to talk
   yourself into the new one being faster; this is the cheapest way to find out. */

function renderCubes() {
  el.cubeList.replaceChildren(...settings.cubes.map((name) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cube-chip';
    button.dataset.active = String(name === settings.cube);
    button.textContent = name;
    button.addEventListener('click', () => {
      settings.cube = settings.cube === name ? '' : name;
      storeSettings();
      renderCubes();
    });

    const drop = document.createElement('span');
    drop.className = 'cube-drop';
    drop.textContent = '×';
    drop.title = 'Vergeten';
    drop.addEventListener('click', (event) => {
      event.stopPropagation();
      settings.cubes = settings.cubes.filter((other) => other !== name);
      if (settings.cube === name) settings.cube = '';
      storeSettings();
      renderCubes();
    });
    button.append(drop);
    return button;
  }));
}

el.cubeAdd.addEventListener('click', () => {
  const name = el.cubeName.value.trim().slice(0, 24);
  if (!name || settings.cubes.includes(name)) { el.cubeName.value = ''; return; }
  settings.cubes = [...settings.cubes, name].slice(0, 12);
  settings.cube = name;
  el.cubeName.value = '';
  storeSettings();
  renderCubes();
});

/** How each cube has gone, over everything you have. */
function cubesBlock() {
  const perCube = new Map();
  for (const session of saveFile.sessions) {
    for (const solve of counting(session.solves)) {
      if (!solve.cube) continue;
      const value = effective(solve);
      if (!Number.isFinite(value)) continue;
      const seen = perCube.get(solve.cube) || [];
      seen.push(value);
      perCube.set(solve.cube, seen);
    }
  }
  if (perCube.size < 2) return null;

  const list = document.createElement('div');
  list.className = 'round-lines';
  for (const [name, times] of [...perCube.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const mean = times.reduce((sum, t) => sum + t, 0) / times.length;
    const row = document.createElement('div');
    const label = document.createElement('b');
    label.textContent = name;
    const figure = document.createElement('span');
    figure.textContent = `${formatTime(mean)} gem · ${formatTime(Math.min(...times))} best · ${times.length}×`;
    row.append(label, figure);
    list.append(row);
  }
  return recordBlock(t('Per cube'), list);
}

/* ---------- records and looking back ----------

   Everything here is already in the save file; none of it is worth a number on
   the main screen but all of it is worth a look now and then. Kept in one sheet
   so it can be read like a page rather than hunted for in tiles. */

/* First, second, third, written as a number rather than as a medal from
   somebody else's emoji font -- which lands at a different size and in a
   different style on every device it is read on. */
const MEDALS = ['1', '2', '3'];

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

/** The day you learned to solve one, and the first time you put on the clock. */
function firstEverBlock() {
  const when = play().graduated;
  if (!when) return null;
  const first = firstSolveEver();

  const rows = [
    [new Date(when).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' }), t('learned to solve')]
  ];
  if (first) rows.push([formatSolve(first), t('first solve')]);

  const strip = document.createElement('div');
  strip.className = 'counter-strip';
  for (const [value, label] of rows) {
    const cell = document.createElement('div');
    const big = document.createElement('b');
    big.textContent = value;
    const small = document.createElement('small');
    small.textContent = label;
    cell.append(big, small);
    strip.append(cell);
  }

  const actions = document.createElement('div');
  actions.className = 'detail-actions';
  const go = document.createElement('button');
  go.type = 'button';
  go.textContent = t('Certificate');
  go.addEventListener('click', () => { el.recordsSheet.close(); openCertificate(); });
  actions.append(go);

  return recordBlock(t('Where it started'), [strip, actions]);
}

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
  return recordBlock(t('Your fastest three'), list);
}

function recordHistoryBlock() {
  const all = records(solves);
  if (all.length < 2) return null;

  const age = recordAge(solves);
  const list = document.createElement('ol');
  list.className = 'record-run';

  // Newest first, and only the last handful: someone who got faster steadily
  // for a year has sixty of these, and the sixtieth is not what they came for.
  const SHOWN = 10;
  const shown = all.slice().reverse().slice(0, SHOWN);
  shown.forEach((mark, index) => {
    const item = document.createElement('li');
    if (index === 0) item.dataset.standing = 'true';
    const time = document.createElement('b');
    time.textContent = formatTime(mark.ms);
    const when = document.createElement('small');
    const gained = mark.before === null ? t('first time') : `${formatTime(mark.before - mark.ms)} eraf`;
    when.textContent = `${mark.at ? new Date(mark.at).toLocaleDateString(locale()) : ''} · ${gained}`;
    item.append(time, when);
    list.append(item);
  });

  const head = age === null ? null
    : line(age === 0 ? t('Your record is from today.') : t(age === 1 ? 'Your record has stood {n} day.' : 'Your record has stood {n} days.', { n: age }), 'records-lead');
  const rest = all.length > SHOWN
    ? line(t('And {n} times before that.', { n: all.length - SHOWN }), 'records-aside')
    : null;
  return recordBlock(t('How your record came down'), [head, list, rest]);
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
      showSolves(t('Best ao5 #{n}', { n: place + 1 }), back.slice(run.start, run.end));
    });
    item.append(button);
    list.append(item);
  });
  return recordBlock(t('Your best five in a row'), list);
}

function whatIfBlock() {
  const drop = solves.length >= 20 ? 3 : 1;
  const shape = without(solves, drop);
  if (!shape || shape.now - shape.then < 50) return null;

  const many = drop === 1 ? t('your slowest solve') : t('your {n} slowest solves', { n: drop });
  return recordBlock(t('What if'), [
    line(t('Without {what} your average would be {then} instead of {now}.', { what: many, then: formatTime(shape.then), now: formatTime(shape.now) })),
    line(t('That is {gap} — more about outliers than about pace, when it is large.', { gap: formatTime(shape.now - shape.then) }), 'records-aside')
  ]);
}

function counterBlock() {
  const sum = totals(saveFile.sessions);
  if (!sum.solves) return null;

  const bits = [t('{n} solves', { n: sum.solves }), spellDuration(sum.ms), t(sum.days === 1 ? '{n} day' : '{n} days', { n: sum.days })];
  const strip = document.createElement('div');
  strip.className = 'counter-strip';
  for (const [value, label] of [[String(sum.solves), t('solves ever')],
    [spellDuration(sum.ms), t('turning')], [String(sum.days), t(sum.days === 1 ? 'day' : 'days')]]) {
    const cell = document.createElement('div');
    const big = document.createElement('b');
    big.textContent = value;
    const small = document.createElement('small');
    small.textContent = label;
    cell.append(big, small);
    strip.append(cell);
  }

  const since = sum.since
    ? line(t('Since {date}, over all your sessions together.', { date: new Date(sum.since).toLocaleDateString(locale()) }), 'records-aside')
    : null;
  return recordBlock(t('The counter'), [strip, since]);
}

function longAgoBlock() {
  const then = onThisDay(saveFile.sessions);
  if (!then.length) return null;

  const shown = then.slice(0, 3);
  return recordBlock(t('On this day'), shown.map((entry) => line(
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
    [String(mine.length), t(mine.length === 1 ? 'solve' : 'solves')],
    [formatTime(best(mine)), t('best')],
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
      ? t('More than your usual day ({n}).', { n: Math.round(usual) })
      : t('Your usual day is {n}.', { n: Math.round(usual) }),
    'records-aside');
  return recordBlock(t('Today'), [strip, versus]);
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

  return recordBlock(t('Average per stage ({n} solves)', { n: rows.length }), list);
}

/** The cabinet: what you have, and what is next. */
function badgesBlock() {
  const list = badges(saveFile.sessions, play());
  const score = tally(list);
  const got = list.filter((badge) => badge.at !== null).sort((a, b) => b.at - a.at);
  const next = list.filter((badge) => badge.at === null).slice(0, 4);

  const wall = document.createElement('div');
  wall.className = 'badge-wall';
  for (const badge of [...got, ...next]) {
    const item = document.createElement('div');
    item.className = 'badge';
    item.dataset.won = String(badge.at !== null);
    item.title = badge.about;
    const name = document.createElement('b');
    name.textContent = badge.name;
    const detail = document.createElement('small');
    detail.textContent = badge.at !== null
      ? new Date(badge.at).toLocaleDateString(locale())
      : badge.detail;
    item.append(name, detail);
    wall.append(item);
  }

  return recordBlock(t('Cabinet — {got} of {all}', { got: score.got, all: score.all }), wall);
}

/** A year of days as squares. Not a graph: a wall you can look at. */
function calendarBlock() {
  const days = yearOfDays(saveFile.sessions);
  if (!days.some((day) => day.count)) return null;

  const grid = document.createElement('div');
  grid.className = 'year-grid';
  for (const day of days) {
    const cell = document.createElement('i');
    cell.dataset.level = String(day.level);
    cell.style.gridRow = String(day.weekday + 1);
    cell.title = day.count
      ? `${day.day}: ` + t(day.count === 1 ? '{n} solve' : '{n} solves', { n: day.count })
        + (day.best ? t(', best {time}', { time: formatTime(day.best) }) : '')
      : day.day;
    grid.append(cell);
  }

  const wrap = document.createElement('div');
  wrap.className = 'year-wrap';
  wrap.append(grid);
  return recordBlock(t('A year of days'), wrap);
}

/** One line a day, written by nobody. */
function diaryBlock() {
  const lines = diary(saveFile.sessions, 14);
  if (lines.length < 2) return null;

  const list = document.createElement('div');
  list.className = 'round-lines';
  for (const entry of lines) {
    const row = document.createElement('div');
    const when = document.createElement('b');
    when.textContent = new Date(entry.at).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
    const note = document.createElement('span');
    note.textContent = entry.note;
    row.append(when, note);
    list.append(row);
  }
  return recordBlock('Dagboek', list);
}

/* ---------- the questions a list of times cannot answer ----------

   Everything above is a fact about what happened. These are the four things
   people actually argue about -- am I better, when am I quick, does looking
   longer help, was that average lucky -- and none of them can be read off a
   graph. They need the numbers compared against chance, against your own
   middle, or against the difficulty of the scramble you happened to draw. */

/** A small table of label and figure, the way every block here shows one. */
function figures(rows) {
  const list = document.createElement('div');
  list.className = 'round-lines';
  for (const [label, value] of rows) {
    const row = document.createElement('div');
    const name = document.createElement('span');
    name.textContent = label;
    const figure = document.createElement('b');
    figure.textContent = value;
    row.append(name, figure);
    list.append(row);
  }
  return list;
}

/** A bar, filled to a share of the row, so a table reads as a shape. */
function bars(rows) {
  const list = document.createElement('div');
  list.className = 'bar-lines';
  const most = Math.max(...rows.map((row) => row.share), 0.0001);
  for (const row of rows) {
    const item = document.createElement('div');
    item.className = 'bar-line';
    const name = document.createElement('span');
    name.textContent = row.name;
    const track = document.createElement('i');
    track.style.setProperty('--fill', `${Math.max(4, Math.round((row.share / most) * 100))}%`);
    if (row.mark) track.dataset.mark = row.mark;
    const figure = document.createElement('b');
    figure.textContent = row.value;
    item.append(name, track, figure);
    list.append(item);
  }
  return list;
}

/**
 * Am I really getting better, or did I have a good evening?
 *
 * The permutation test is the whole point: it does not ask whether the numbers
 * went down, it asks how often chance alone moves them this far. An app that
 * congratulates you on noise teaches you to trust it less.
 */
function trendBlock() {
  const scored = counting(solves);
  const shape = trend(scored);
  if (!shape) {
    // Said rather than hidden: the point of the block is that a hundred solves
    // is what an honest answer costs, and that is worth knowing in advance.
    return scored.length >= 20
      ? recordBlock(t('Have you really got better?'), line(
        t('{n} solves to go. Under a hundred, any difference between then and now is just as likely chance, and the app would rather not say.', { n: 100 - scored.length }),
        'records-aside'))
      : null;
  }

  const better = shape.gap > 0;
  const table = figures([
    [t('First 50'), formatTime(shape.then)],
    [t('Last 50'), formatTime(shape.now)],
    ['Verschil', `${better ? '−' : '+'}${formatTime(Math.abs(shape.gap))}`],
    [t('Chance manages this'), t('{n}% of the time', { n: Math.round(shape.share * 100) })]
  ]);

  const verdict = shape.sure
    ? (better
      ? t('Yes. This difference is too big to be chance — chance manages it only {n} times in a hundred.', { n: Math.round(shape.share * 100) })
      : t('You have got slower, and by more than chance explains. It happens: too little sleep, a different cube, or too many new things at once.'))
    : t('Too early to say. Chance alone manages this difference in {n} cases out of a hundred, so this is just as likely a good evening as progress.', { n: Math.round(shape.share * 100) });

  return recordBlock(t('Have you really got better?'), [table, line(verdict, 'records-aside')]);
}

/** When in a sitting you are quick. Everybody has a shape; nobody knows theirs. */
function shapeBlock() {
  const shape = sessionShape(saveFile.sessions);
  if (!shape) return null;

  const quickest = shape.reduce((best, entry) => (entry.share < best.share ? entry : best), shape[0]);
  const slowest = shape.reduce((worst, entry) => (entry.share > worst.share ? entry : worst), shape[0]);

  const list = bars(shape.map((entry) => ({
    name: entry.name,
    share: entry.share,
    mark: entry === quickest ? 'good' : entry === slowest ? 'bad' : '',
    value: `${entry.share < 1 ? '−' : '+'}${Math.abs((entry.share - 1) * 100).toFixed(0)}%`
  })));

  const spread = (slowest.share - quickest.share) * 100;
  const note = spread < 4
    ? t('You are as quick at the start as at the end. That is rare, and it saves you warming up.')
    : t('You are quickest at {quick}, and {n}% slower at {slow}.', {
      quick: quickest.name, n: spread.toFixed(0), slow: slowest.name
    }) + ' ' + (quickest.name === t('the first five')
      ? t('So you are better off stopping earlier than you think.')
      : t('So do not count the first few solves of a session when you judge yourself.'));

  return recordBlock(t('The shape of your session'), [list, line(note, 'records-aside')]);
}

/** Does looking longer pay? Your own numbers, not somebody's advice. */
function inspectionBlock() {
  const looks = inspectionPays(saveFile.sessions);
  if (!looks) return null;

  const quickest = looks.reduce((best, entry) => (entry.middle < best.middle ? entry : best), looks[0]);
  const list = bars(looks.map((entry) => ({
    name: entry.name,
    share: entry.middle,
    mark: entry === quickest ? 'good' : '',
    value: `${formatTime(entry.middle)} · ${entry.solves}×${entry.dnf ? ` · ${entry.dnf} DNF` : ''}`
  })));

  return recordBlock('Loont langer kijken?', [list, line(
    t('For you, {what} inspection is fastest. That is not advice from a book — it is in your own times.', { what: quickest.name }),
    'records-aside')]);
}

/**
 * An average with the luck of the draw taken out.
 *
 * Nobody has ever been able to say whether a good session was a good session or
 * a soft set of scrambles. The cross length of every scramble you solved is
 * known here, so the question is answerable rather than arguable.
 */
function fairBlock(kit) {
  if (!kit || !holdingA333()) return null;
  const face = settings.crossFace;
  const difficulty = (scramble) => {
    const lengths = kit.cross.crossLengths(scramble, kit.kpuzzle, kit.Alg, kit.table);
    return lengths.find((entry) => entry.id === face)?.moves ?? NaN;
  };

  const fair = fairAverage(counting(solves), difficulty);
  if (!fair) return null;

  const luckyMs = Math.abs(fair.luck);
  const luckySeconds = luckyMs / 1000;
  // A slope of nearly nothing means the cross length is not visible in your
  // times at all, and then a correction built on it would be made up.
  const linked = Math.abs(fair.slope) >= 60;
  const table = figures([
    [t('Your average'), formatTime(fair.plain)],
    ['Gecorrigeerd', linked ? formatTime(fair.fair) : '—'],
    [t('Your scrambles were'), t('{n} moves of cross', { n: fair.easy.toFixed(1) })],
    [t('Every move of cross costs you'), linked
      ? `${fair.slope > 0 ? '' : '−'}${formatTime(Math.abs(fair.slope))}`
      : t('nothing measurable')]
  ]);

  const note = !linked
    ? t('Over {n} solves there is no link in your times between the length of the cross and how long you took. So there is nothing to correct — your average is what it is.', { n: fair.counted })
    : luckyMs < 150
      ? t('Over {n} solves you got an average set of scrambles. Your average is what it is.', { n: fair.counted })
      : fair.luck > 0
        ? t('Your scrambles were easier than usual on average. On scrambles of ordinary weight this would have been {n}s slower.', { n: luckySeconds.toFixed(2) })
        : t('Your scrambles were heavier than usual. On scrambles of ordinary weight this would have been {n}s faster — your average does not flatter you.', { n: luckySeconds.toFixed(2) });

  return recordBlock('Eerlijk vergelijken', [table, line(note, 'records-aside')]);
}

/** Where your time goes, and the stretch that is furthest out of step. */
function weakBlock() {
  const stage = weakStage(solves);
  const cases = weakCase(caseStanding(play(), 'pll').concat(caseStanding(play(), 'oll')));
  if (!stage && !cases) return null;

  const parts = [];
  if (stage) {
    parts.push(bars(stage.stages.map((entry) => ({
      name: entry.name,
      share: entry.share,
      mark: entry === stage.worst ? 'bad' : '',
      value: `${(entry.share * 100).toFixed(0)}% · richtwaarde ${(entry.ideal * 100).toFixed(0)}%`
    }))));
    parts.push(line(stage.worst.off < 0.03
      ? t('Your solve is evenly spread over {n} measured solves. No part stands out.', { n: stage.counted })
      : t('{what} takes {n}% more of your solve than usual. That is where your next second is, and nowhere else.', { what: stage.worst.name, n: (stage.worst.off * 100).toFixed(0) }),
    'records-aside'));
  }
  if (cases) {
    parts.push(line(
      t('Of the cases you have drilled, {slow} is your slowest ({slowTime}) and {fast} your fastest ({fastTime}).', { slow: cases.slowest.id, slowTime: formatTime(cases.slowest.mean), fast: cases.quickest.id, fastTime: formatTime(cases.quickest.mean) }),
      'records-aside'));

    // Knowing which case is your worst is only half of it; the other half is a
    // way to go and do something about it without hunting for the button.
    const drill = document.createElement('div');
    drill.className = 'detail-actions';
    for (const group of ['pll', 'oll']) {
      if (rankedCases(group) < 6) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = t('Drill your weakest {group}', { group: group.toUpperCase() });
      button.addEventListener('click', () => {
        el.recordsSheet.close();
        openDrill({ focus: 'weak', group });
      });
      drill.append(button);
    }
    if (drill.children.length) parts.push(drill);
  }

  return recordBlock(t('Where you lose it'), parts);
}

/**
 * The solves that hurt, and what each one cost.
 *
 * Shown with the scramble, because the useful half of a disaster is being able
 * to set it up again and find out what went wrong.
 */
function worstBlock() {
  const worst = worstSolves(solves, 5);
  if (worst.length < 3) return null;

  const list = document.createElement('div');
  list.className = 'round-lines';
  for (const entry of worst) {
    const row = document.createElement('div');
    row.className = 'worst-row';
    const time = document.createElement('b');
    time.textContent = formatSolve(entry.solve);
    const cost = document.createElement('span');
    cost.textContent = t('+{time} on your ao5', { time: formatTime(entry.cost) });
    row.append(time, cost);
    if (entry.solve.scramble) {
      const again = document.createElement('button');
      again.type = 'button';
      again.className = 'ghost tiny';
      again.textContent = t('Until it lands');
      again.title = t('This scramble keeps coming back until you are under your usual pace on it');
      again.addEventListener('click', () => {
        el.recordsSheet.close();
        startGrind(entry.solve);
      });
      row.append(again);
    }
    list.append(row);
  }

  const total = worst.reduce((sum, entry) => sum + entry.cost, 0);
  return recordBlock(t('The five that hurt'), [list, line(
    t('Together these five cost you {time} in averages. Their scrambles are here, so you can set them up again.', { time: formatTime(total) }),
    'records-aside')]);
}

/**
 * The look-back sheet, in five parts.
 *
 * Nineteen blocks in one scroll is a scroll nobody finishes, and the good bits
 * are at the bottom. They are grouped the way you would ask for them -- how is
 * it going now, am I getting better, where am I losing it, what have I ever
 * done, what does the whole history look like -- with a strip of tabs to step
 * between them.
 *
 * A group that has nothing in it is not offered at all: with twelve solves to
 * your name there is no progress to show yet, and a tab leading to an empty
 * page is worse than no tab.
 */
const RECORD_TABS = [
  { id: 'now', get name() { return t('Now'); }, blocks: (kit) => [bingoBlock(), todayBlock(), podiumBlock(), firstEverBlock(), counterBlock()] },
  {
    id: 'better',
    get name() { return t('Progress'); },
    blocks: (kit) => [trendBlock(), aimBlock(), thenNowBlock(), shapeBlock(),
      inspectionBlock(), kit ? fairBlock(kit) : null]
  },
  {
    id: 'weak',
    get name() { return t('Weak spots'); },
    blocks: (kit) => [weakBlock(), splitsBlock(), worstBlock(), kit ? crossBlock(kit) : null]
  },
  {
    id: 'records',
    get name() { return t('Records'); },
    blocks: (kit) => [recordHistoryBlock(), runsBlock(), whatIfBlock(), cubesBlock()]
  },
  {
    id: 'back',
    get name() { return t('Looking back'); },
    blocks: (kit) => [badgesBlock(), calendarBlock(), clickedBlock(), diaryBlock(),
      longAgoBlock(), yearBlock()]
  }
];

let recordTab = settings.recordTab || 'now';


/**
 * You, against you. Your best five in a row from three weeks ago or more,
 * against your best five lately -- not the averages, which move for all sorts
 * of reasons, but the good days against the good days.
 */
function thenNowBlock() {
  const shape = thenAndNow(solves);
  if (!shape) return null;

  const list = document.createElement('div');
  list.className = 'round-lines';
  for (const [when, side] of [[t('Then'), shape.then], [t('Now'), shape.now]]) {
    const row = document.createElement('div');
    const label = document.createElement('b');
    label.textContent = `${when} · ${describeMoment(side.at)}`;
    const figure = document.createElement('span');
    figure.textContent = `${formatTime(side.value)} — ${side.times.map(formatSolve).join(' ')}`;
    row.append(label, figure);
    list.append(row);
  }

  const note = shape.gap > 200
    ? t('Your best five are {gap} faster than your best five back then. That is you against you, and you are winning.', { gap: formatTime(shape.gap) })
    : shape.gap < -200
      ? t('Your best five back then were {gap} faster. Something was there that day that is not there now.', { gap: formatTime(-shape.gap) })
      : t('Your best days are as good as they were. That is not nothing — holding a peak is harder than reaching one.');

  return recordBlock(t('You against you'), [list, line(note, 'records-aside')]);
}

/**
 * The day a case stopped being one you had to think about. Learning shows up as
 * a step rather than a slope, so a step is what is looked for.
 */
function clickedBlock() {
  // Straight out of what has been drilled -- no need for the case library to be
  // loaded, since the times are keyed by name and the name is all this shows.
  const found = [];
  for (const cases of Object.values(play().cases || {})) {
    for (const [id, times] of Object.entries(cases)) {
      const moment = learnedWhen(times);
      if (moment?.at) found.push({ id, ...moment });
    }
  }
  if (!found.length) return null;
  found.sort((a, b) => b.at - a.at);

  const list = document.createElement('div');
  list.className = 'round-lines';
  for (const one of found.slice(0, 8)) {
    const row = document.createElement('div');
    const label = document.createElement('b');
    label.textContent = one.id;
    const figure = document.createElement('span');
    figure.textContent = `${new Date(one.at).toLocaleDateString(locale())} · ${formatTime(one.before)} → ${formatTime(one.after)}`;
    row.append(label, figure);
    list.append(row);
  }
  return recordBlock(t('When it clicked'), [list, line(
    t('Learning an algorithm is not a slope but a step: one day you no longer have to think. These are the days that happened on.'),
    'records-aside')]);
}

/** A time by a date, and whether you are on track for it. */
function aimBlock() {
  if (!settings.aimTime) return null;
  const deadline = settings.aimBy ? new Date(`${settings.aimBy}T23:59:59`).getTime() : NaN;
  const shape = aimAt(counting(solves), settings.aimTime, deadline);
  if (!shape) return recordBlock(t('Your aim'), line(t('Too few times yet to say whether you are on schedule.'), 'records-aside'));

  const rows = [
    ['Doel', formatTime(shape.target) + (settings.aimBy ? t(' before {date}', { date: new Date(deadline).toLocaleDateString(locale()) }) : '')],
    [t('Now'), formatTime(shape.now)],
    [t('Still to go'), shape.needed <= 0 ? 'gehaald' : formatTime(shape.needed)],
    [t('You gain per week'), shape.rate > 0 ? formatTime(shape.rate * 7) : t('nothing at the moment')]
  ];

  const note = shape.needed <= 0
    ? t('Reached. Set a new aim under it and this keeps meaning something.')
    : shape.rate <= 0
      ? t('At this rate you will not get there — your times are not coming down at the moment. That need not mean anything bad, but the app cannot put a date on it.')
      : shape.onTrack === null
        ? t('At this rate you get there around {date}. Put a date beside it and it will say whether that is in time.', { date: new Date(shape.byDay).toLocaleDateString(locale()) })
        : shape.onTrack
          ? t('You are on schedule: at this rate you are there around {date}.', { date: new Date(shape.byDay).toLocaleDateString(locale()) })
          : t('At this rate you get there around {date} — after your date. That is no disaster, it is only honest.', { date: new Date(shape.byDay).toLocaleDateString(locale()) });

  return recordBlock(t('Your aim'), [figures(rows), line(note, 'records-aside')]);
}


/**
 * Nine small things to go and do this week, sized off your own level.
 *
 * Nothing is written down when a square fills: whether it is done is asked of
 * the week's solves each time the card is drawn, the same way the cabinet works.
 * A card cannot go wrong by having been recorded wrong.
 */
function bingoBlock() {
  const week = bingoCard(saveFile.sessions, play());
  if (!week) return null;

  const grid = document.createElement('div');
  grid.className = 'bingo';
  for (const square of week.squares) {
    const cell = document.createElement('div');
    cell.className = 'bingo-cell';
    cell.dataset.done = String(square.done);
    cell.textContent = square.text;
    grid.append(cell);
  }

  const rows = bingoLines(week.squares);
  const note = week.filled === 9
    ? t('Full. The next card is here on Monday.')
    : rows
      ? t(rows === 1 ? '{filled} of the nine, and {rows} line full.' : '{filled} of the nine, and {rows} lines full.', { filled: week.filled, rows })
      : t('{n} of the nine. A new card every Monday.', { n: week.filled });

  return recordBlock(t('This week — {name}', { name: week.name }), [grid, line(note, 'records-aside')]);
}

/**
 * A year in one card. Everything in it is already in the save file; the only
 * work is choosing which four numbers are worth the space.
 */
function yearBlock() {
  const all = totals(saveFile.sessions);
  if (all.solves < 50) return null;

  const shape = trend(counting(solves), Math.min(50, Math.floor(counting(solves).length / 2)));
  const days = byDay(saveFile.sessions);
  let bestDay = null;
  for (const [day, seen] of days) {
    if (seen.best !== null && (!bestDay || seen.best < bestDay.best)) bestDay = { day, ...seen };
  }

  const rows = [
    [t('Solves'), String(all.solves)],
    [t('Turning'), spellDuration(all.ms)],
    [t('Days'), String(all.days)],
    ['Sneller geworden', shape && shape.gap > 0 ? formatTime(shape.gap) : '—']
  ];

  const save = document.createElement('button');
  save.type = 'button';
  save.textContent = t('Save as a card');
  save.addEventListener('click', async () => {
    const canvas = drawCard({
      title: 'mijn cubetimer',
      headline: String(all.solves),
      lines: [
        t(all.days === 1 ? 'solves in {n} day' : 'solves in {n} days', { n: all.days }),
        t('{time} of turning', { time: spellDuration(all.ms) }),
        bestDay ? t('best day {date} — {time}', { date: new Date(`${bestDay.day}T12:00:00`).toLocaleDateString(locale()), time: formatTime(bestDay.best) }) : '',
        shape && shape.gap > 0 ? t('{gap} faster than when you started', { gap: formatTime(shape.gap) }) : ''
      ].filter(Boolean),
      footer: [settings.shareName, new Date().toLocaleDateString(locale())].filter(Boolean).join(' \u00b7 '),
      accent: colorOf(settings, 'led'),
      dark: settings.theme === 'dark'
    });
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    const address = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = address;
    link.download = `cubetimer-everything-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(address), 20000);
    toast(t('Card saved.'));
  });

  const actions = document.createElement('div');
  actions.className = 'detail-actions';
  actions.append(save);

  return recordBlock(t('Everything together'), [figures(rows), actions]);
}

function renderRecords(kit = crossKit) {
  el.recordsTitle.textContent = `Records — ${currentSession().name}`;

  const built = RECORD_TABS
    .map((tab) => ({ ...tab, made: tab.blocks(kit).filter(Boolean) }))
    .filter((tab) => tab.made.length);

  if (!built.length) {
    el.recordsTabs.replaceChildren();
    el.recordsBody.replaceChildren(
      line(t('Too few times to look back on. Do a few and come back.')));
    return;
  }

  if (!built.some((tab) => tab.id === recordTab)) recordTab = built[0].id;

  el.recordsTabs.replaceChildren(...built.map((tab) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.active = String(tab.id === recordTab);
    chip.textContent = tab.name;
    chip.addEventListener('click', () => {
      recordTab = tab.id;
      settings.recordTab = tab.id;
      storeSettings();
      renderRecords(kit);
      el.recordsBody.scrollTo({ top: 0 });
    });
    return chip;
  }));

  const showing = built.find((tab) => tab.id === recordTab);
  el.recordsBody.replaceChildren(...showing.made);
}

el.shareOpen.addEventListener('click', () => {
  el.shareOpen.blur();
  const scored = counting(solves);
  const five = scored.slice(-5);
  el.statsSheet.close();
  openShare(five.length === 5 ? 'ao5' : t('last {n}', { n: five.length }), five);
});

el.recordsOpen.addEventListener('click', async () => {
  el.recordsOpen.blur();
  el.statsSheet.close();
  renderRecords();
  if (!openSheet(el.recordsSheet)) {
    toast(t('This window will not open in this browser.'));
    return;
  }

  // The scramble table takes a few seconds to work out, so the sheet opens
  // first and that block arrives when it is ready.
  if (scramblesHere().length >= 5) {
    try {
      const kit = await loadCross();
      if (el.recordsSheet.open) renderRecords(kit);
    } catch (error) {
      console.error('Scrambles:', error);
    }
  }
});

el.recordsClose.addEventListener('click', () => el.recordsSheet.close());

/* ---------- selecting several solves ---------- */

function renderSelection() {
  el.selectionBar.hidden = !selecting;
  el.body.toggleAttribute('data-selecting', selecting);
  el.selectMode.textContent = selecting ? t('stop selecting') : t('select');
  el.selectionCount.textContent = t('{n} chosen', { n: selected.size });

  const none = selected.size === 0;
  for (const button of [el.selectionPlus2, el.selectionDnf, el.selectionMove, el.selectionDelete]) {
    button.disabled = none;
    button.style.opacity = none ? '.4' : '1';
  }
  el.selectAll.textContent = selected.size === solves.length && solves.length ? t('none') : t('all');
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
  toast(allSet ? t('{n} times back to plain.', { n: selected.size }) : t('{penalty} on {n} times.', { penalty, n: selected.size }));
}

el.selectionPlus2.addEventListener('click', () => penaliseSelection('+2'));
el.selectionDnf.addEventListener('click', () => penaliseSelection('DNF'));

el.selectionDelete.addEventListener('click', () => {
  const count = selected.size;
  if (!count) return;
  if (!confirm(count === 1 ? t('Delete this time?') : t('Delete {n} times?', { n: count }))) return;

  const doomed = new Set(selected);
  for (let index = solves.length - 1; index >= 0; index--) {
    if (doomed.has(solves[index])) solves.splice(index, 1);
  }
  selected.clear();
  persist();
  render();
  renderSelection();
  toast(count === 1 ? t('Time deleted.') : t('{n} times deleted.', { n: count }));
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
  return count === 1 ? t('This time') : t('These {n} times', { n: count });
}

function openMove(list, title) {
  if (!list.length) return;
  moving = { solves: list.slice(), from: saveFile.active };

  el.moveTitle.textContent = title;
  el.moveWhat.textContent = t('{what} from {name}. ', { what: describeMoving(list.length), name: currentSession().name })
    + (list.length === 1 ? t('Choose where it should go.') : 'Kies waar ze heen moeten.');

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
    about.textContent = t(session.solves.length === 1 ? '{n} time' : '{n} times', { n: session.solves.length });
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
    only.textContent = t('This is your only session. Make one below.');
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
    toast(t('This window will not open in this browser.'));
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

  toast(t('{what} moved to {name}.', { what: describeMoving(taken.length), name: target.name }), {
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
  const time = date.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  return today
    ? t('today at {time}', { time })
    : t('{date} at {time}', { date: date.toLocaleDateString(locale(), { day: 'numeric', month: 'long' }), time });
}

function fillDetail() {
  const solve = solves[detailIndex];
  if (!solve) return;

  el.detailTitle.textContent = `Solve ${detailIndex + 1}`;
  el.detailTime.textContent = formatSolve(solve);
  el.detailMeta.textContent = describeMoment(solve.at);
  el.detailScramble.textContent = solve.scramble || t('Not kept with this time.');

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
  if (solve) toast(solve.skip ? t('Does not count towards your averages.') : t('Counts again.'));
});

el.quickStar.addEventListener('click', () => {
  const solve = markSolve(quickIndex, 'star');
  el.quickSheet.close();
  if (solve) toast(solve.star ? t('Kept.') : t('No longer kept.'));
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
  if (solve) toast(solve.skip ? t('Does not count towards your averages.') : t('Counts again.'));
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
  renderEventExtra();
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
  toast(t('Somebody solved in another window; this list has been brought up to date.'));
}

/** Save, and say so once if this browser refuses to store anything. */
function persist() {
  if (save(saveFile) || storageWarned) return;
  storageWarned = true;
  toast(t('This browser keeps nothing (private mode?). Your times stay until you reload the page.'));
}

/**
 * Where a finished solve goes.
 *
 * A game, a drill or the daily challenge keeps its own; only ordinary solving
 * touches your session. It used to all land in whatever session was open, which
 * moved your averages about for reasons that had nothing to do with how you are
 * solving.
 */
function addSolve(ms, marks = []) {
  const solve = { ms, penalty: pendingPenalty, scramble, at: Date.now() };
  if (warmingUp) solve.skip = true;
  if (marks.length) solve.splits = marks;
  if (settings.cube) solve.cube = settings.cube;
  if (Number.isFinite(lastInspection)) solve.inspect = lastInspection;
  pendingPenalty = 'none';
  lastInspection = null;

  if (drilling) { finishDrill(solve); return; }
  if (dailyRun) { finishDaily(solve); return; }
  if (duel) { finishDuelSolve(solve); return; }
  if (ownsSolves(run)) { finishGameSolve(solve); return; }

  const previousBest = best(counting(solves));
  // What "onder je gemiddelde" means for the wheel: your last dozen, before
  // this one landed. Too few to say anything and the challenge waits.
  solves.push(solve);
  persist();
  countTowardsDare();
  if (keepScramble) keepScramble = false;
  else newScramble();
  render();

  const rematchWas = rematch;
  rematch = null;
  renderRematch();
  delete el.repeatScramble.dataset.active;

  if (grinding) { judgeGrind(solve); return; }
  restIfFlagging();

  judgeSolve(previousBest);

  if (rematchWas) sayHowThatWent(rematchWas, solves[solves.length - 1]);
  else sayCross(solve.scramble);
  celebrateBadges();
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
  toast(t('{time} deleted.', { time: formatSolve(removed) }), {
    label: 'ongedaan maken',
    run: () => {
      solves.splice(Math.min(index, solves.length), 0, removed);
      persist();
      render();
      toast(t('{time} is back.', { time: formatSolve(removed) }));
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
    ? new Date(solve.at).toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' })
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
    toast(t('No time to delete.'));
    return;
  }
  const target = solves[solves.length - 1];
  deleteArmed = true;
  el.body.dataset.confirm = 'delete';
  el.time.textContent = formatSolve(target);
  setHint(t('Delete? Tap <strong>once</strong> to confirm'));

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
  toast(t('{time} deleted.', { time: formatSolve(removed) }));
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
    lastInspection = null;
    return;
  }
  const elapsed = performance.now() - startedInspection;
  // Kept on the solve, because "does looking longer pay" is a question only
  // your own numbers can answer, and only if somebody wrote them down.
  lastInspection = Math.round(elapsed);
  pendingPenalty = elapsed < INSPECTION_MS ? 'none' : elapsed < PLUS_TWO_MS ? '+2' : 'DNF';
}

/** How long inspection ran for the solve now finishing. */
let lastInspection = null;

/* ---------- timing ---------- */

/**
 * The ring warms while you are ahead of your usual pace and cools when you fall
 * behind. No numbers -- the point is to feel it out of the corner of your eye
 * without reading anything, which works even with the time hidden.
 */
let pacer = null;

function startPacing() {
  const recent = counting(solves).slice(-12).map(effective).filter(Number.isFinite);
  pacer = recent.length >= 3
    ? recent.slice().sort((a, b) => a - b)[recent.length >> 1]
    : null;
  el.body.dataset.pace = '';
}

function pace(elapsed) {
  if (!pacer) return;
  // Ahead until the clock passes your usual; behind once it is a fifth over.
  const share = elapsed / pacer;
  const mark = share < 0.85 ? 'ahead' : share < 1.02 ? 'level' : 'behind';
  if (el.body.dataset.pace !== mark) el.body.dataset.pace = mark;
}

function runningTick() {
  const elapsed = performance.now() - startedAt;
  pace(elapsed);
  showTime(elapsed);
  runningFrame = requestAnimationFrame(runningTick);
}

/** The pace ring is worth having even with the time hidden -- more so, then. */
function hiddenTick() {
  pace(performance.now() - startedAt);
  runningFrame = requestAnimationFrame(hiddenTick);
}

function startRunning() {
  disarmDelete();
  settleInspection();
  setPhase('running');
  startedAt = performance.now();
  splitTimes = [];
  renderSplit();

  cue('start');
  startPacing();
  cancelAnimationFrame(runningFrame);
  if (settings.hideTime) {
    el.time.textContent = DOTS;
    if (settings.pace) hiddenTick();
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
  el.body.dataset.pace = '';
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
    //
    // And with inspection switched off there is neither to do -- which is what
    // this was missing. cancelInspection returns at once when no inspection is
    // running, so a tap too short to arm the timer left the phase on 'holding'
    // for good, and beginHold only starts from 'idle' or 'inspecting': the
    // timer was dead until the page was reloaded. Easy to do with a thumb.
    if (inspectionJustStarted) setPhase('inspecting');
    else if (inspectionStartedAt !== null) cancelInspection();
    else setPhase('idle');
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
  if (key === 'n') { newScramble(); toast(t('New scramble.')); }
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
  el.connect.textContent = t('Connect timer');
  el.deviceStatus.hidden = true;
  setHint(currentHint());
  el.deviceNote.textContent = t('No timer connected yet.');
  el.deviceDetails.hidden = true;
  el.importTimes.hidden = true;
  showManualPick(true);
  // Out of range, or a flat battery, in the middle of a solve. The clock on
  // screen is the app's own from here, and it keeps counting until someone
  // stops it -- so say that rather than let a good solve turn into a mystery.
  toast(midSolve
    ? t('The timer dropped out during your solve — the time is now running on the app’s own clock. Press space or tap to stop.')
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
    return t('No permission for bluetooth. Allow it in your browser and try again{detail}', { detail });
  }
  if (name === 'NetworkError') {
    return t('Connecting did not work. Is the timer on, and is it not already connected to another app or phone?{detail}', { detail });
  }
  if (name === 'SecurityError') {
    return t('The browser is blocking this connection. Is the page served over https?{detail}', { detail });
  }
  if (name === 'NotSupportedError') {
    return t('This browser cannot talk to the timer{detail}', { detail });
  }
  // Our own throws carry a full sentence; a bare "Error" says nothing.
  if (name === 'Error' && message && message !== 'Error') return message;

  // Nothing usable came back. Name the usual causes rather than a bare "mislukt".
  const kind = name || (error === undefined ? t('no error object') : typeof error);
  const raw = message ? `${kind}: ${message}` : kind;
  return t('Connecting failed. Turn the timer off and on again, and disconnect it from other devices or apps. [{raw}]', { raw });
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
    text = t('This device has no bluetooth, or the browser is not allowed near it. ')
      + t('On an iPhone that is under Settings → the browser → Bluetooth, on a Mac under ')
      + t('System Settings → Privacy → Bluetooth, on Windows under Settings → Privacy.');
  } else {
    text = explainBluetoothError(error);
  }

  toast(text);
  el.deviceNote.textContent = t('Last attempt failed — {text} [{name}{extra}]', { text, name: name || t('no name'), extra: message ? `: ${message}` : '' });
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
  el.connect.textContent = t('Disconnect');
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
    toast(t('This browser cannot talk to bluetooth. On a computer or Android, Chrome or Edge works; on an iPhone, a browser like Bluefy.'));
    return;
  }

  el.connect.disabled = true;
  el.connect.textContent = t('Connecting…');
  try {
    adoptDevice(await connectGanTimer({ onEvent: onDeviceEvent, onDisconnect: onDeviceDisconnect, anyDevice }));
    toast(t('Connected to {name}.', { name: device.name }));
  } catch (error) {
    device = null;
    el.connect.textContent = t('Connect timer');
    const closedByUser = error?.name === 'NotFoundError' && /cancel|chooser/i.test(error.message || '');
    // A chooser with nothing in it and a chooser someone closed look exactly
    // the same from here, so say what to check either way.
    if (closedByUser) toast(t('No timer chosen. Was the list empty? Turn the timer on and disconnect it from other apps or phones.'));
    else await reportConnectionFailure(error);
  } finally {
    el.connect.disabled = false;
  }
}

el.connect.addEventListener('click', () => connect(false));
el.connectAny.addEventListener('click', () => connect(true));

/* ---------- two odds and ends ---------- */

/**
 * A badge is only a moment once. What was already won is remembered by name, so
 * closing the app cannot make one go by unnoticed, and re-earning cannot make
 * the same party happen twice.
 */
function celebrateBadges({ quietly = false } = {}) {
  const list = badges(saveFile.sessions, play());
  const fresh = newlyWon(list, settings.wonBadges || []);
  settings.wonBadges = wonIds(list);

  // The first time the cabinet is worked out, everything already earned is
  // "new". Somebody who has been solving for a year does not want eighteen
  // parties at once for things they did in March.
  const firstLook = !settings.badgesSeeded;
  settings.badgesSeeded = true;
  storeSettings();
  if (!fresh.length || quietly || firstLook) return;

  const [first] = fresh;
  cue('record');
  if (settings.celebrate) confetti('party');
  toast(fresh.length === 1
    ? `${first.name} — ${first.about}`
    : t('{name} and {n} more.', { name: first.name, n: fresh.length - 1 }));
}

/** Opening a sheet from inside another one has been known to throw on Safari. */
function openSheet(sheet) {
  try {
    sheet.showModal();
  } catch {
    sheet.show();
  }
  return sheet.open;
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
  if (document.visibilityState === 'visible') {
    keepAwake();
    adoptElsewhere(); // it may have been the other window you were away in
  }
});

/* ---------- settings ---------- */

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

/**
 * A skin sets the paper, the ink and the glow at once. It is applied over the
 * theme rather than instead of it, so light and dark still work: anything the
 * skin does not name keeps whatever the theme said.
 */
function applySkin() {
  const skin = SKINS.find((entry) => entry.id === settings.skin) || SKINS[0];
  const style = document.documentElement.style;

  for (const other of SKINS) {
    for (const name of Object.keys(other.vars || {})) style.removeProperty(name);
  }
  for (const [name, value] of Object.entries(skin.vars || {})) {
    if (name === '--led') continue; // the colour picker owns this one
    style.setProperty(name, value);
  }

  el.body.dataset.skin = skin.id;
  if (skin.font) el.body.dataset.font = skin.font;
}

function renderSkins() {
  if (!el.skins) return;
  el.skins.replaceChildren(...SKINS.map((skin) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'skin';
    button.dataset.value = skin.id;
    button.dataset.active = String(skin.id === settings.skin);
    button.textContent = skin.label;
    if (skin.vars?.['--led']) button.style.setProperty('--chip', skin.vars['--led']);
    button.addEventListener('click', () => {
      settings.skin = skin.id;
      // A skin proposes its glow rather than fighting the colour picker for it:
      // it is set once, here, and the picker can change it afterwards.
      const glow = skin.vars?.['--led'];
      if (glow) {
        settings.colors = { ...settings.colors, led: glow };
        settings.led = LED_COLORS.find((entry) => entry.color === glow)?.id ?? settings.led;
      }
      storeSettings();
      renderSkins();
      buildLedSwatches();
      buildColorSlots();
      applySettings();
    });
    return button;
  }));
}

function applyTheme() {
  // A dark skin is a dark theme with a different palette on top, not a light
  // page with dark bits scattered over it -- which is what leaving the theme
  // alone gave: a black ring floating on white paper.
  const skin = SKINS.find((entry) => entry.id === settings.skin);
  const dark = skin?.dark
    || settings.theme === 'dark'
    || (settings.theme === 'auto' && darkQuery.matches);
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
  applySkin();
  for (const { key } of COLOR_SLOTS) {
    document.documentElement.style.setProperty(`--${key}`, settings.colors[key]);
  }
  if (settings.wakeLock) keepAwake();
  else letSleep();
  setDecimals(settings.decimals);
  // The unit belongs to the event, not to the settings, but applySettings is
  // the one thing that runs both at startup and after every change -- and
  // getting this wrong once means fewest-moves results printed as seconds.
  setUnit(puzzleById(currentSession().puzzle).moves ? 'moves' : 'time');
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
    toast(t('This browser keeps nothing (private mode?). Settings last until you reload.'));
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
  goalKind: bindGroup('set-goalKind', (v) => { settings.goalKind = v; syncGoalValue(); }),
  // The language is the one setting that has to redraw everything, because
  // every other word on the screen was written by something that has already
  // run. That is what onLangChange below is for.
  lang: bindGroup('set-lang', (v) => { settings.lang = v; setLang(v); })
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
  bindSwitch('set-splits', 'splits'),
  bindSwitch('set-pace', 'pace'),
  bindSwitch('set-crosstip', 'crossTip'),
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
    ? t('That many solves in a day keeps the flame alight')
    : t('That many minutes of solving in a day keeps the flame alight');
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
  el.targetNote.textContent = t('Only for {name}; every session has its own target.', { name: currentSession().name });
}

function syncSettingsUi() {
  syncTargetUi();
  markGroup(groups.theme, settings.theme);
  markGroup(groups.decimals, settings.decimals);
  markGroup(groups.hold, settings.holdMs);
  markGroup(groups.font, settings.font);
  markGroup(groups.goalKind, settings.goalKind);
  markGroup(groups.lang, currentLang());
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
  const header = t('{name} — {n} times', { name: currentSession().name, n: solves.length });
  const lines = solves.map((solve, index) =>
    `${index + 1}. ${formatSolve(solve)}   ${solve.scramble || ''}`.trimEnd());
  return [header, ...lines].join('\n');
}

/** Quoted the way every spreadsheet expects: doubled quotes inside quotes. */
const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

function sessionAsCsv() {
  const rows = [['number', 'time', 'milliseconds', 'penalty', 'date', 'scramble', 'note']];
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
  text: { build: sessionAsText, label: t('as text'), extension: 'txt', type: 'text/plain' },
  csv: { build: sessionAsCsv, label: t('as csv'), extension: 'csv', type: 'text/csv' },
  cstimer: { build: sessionAsCstimer, label: t('for cstimer'), extension: 'json', type: 'application/json' }
};

/** A file name out of the session's own name, safe on every filesystem. */
const fileNameFor = (extension) => {
  const stem = currentSession().name.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase();
  return `${stem || 'session'}-${backupName().slice(10, 20)}.${extension}`;
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
    toast(t('No times to save yet.'));
    return;
  }
  const { build, extension, type } = EXPORTS[exportFormat] || EXPORTS.text;
  const name = fileNameFor(extension);
  offerFile(name, build(), type);
  toast(t('{n} times saved as {name}.', { n: solves.length, name }));
});

el.export.addEventListener('click', async () => {
  el.export.blur();
  if (!solves.length) {
    toast(t('No times to copy yet.'));
    return;
  }
  const { build, label } = EXPORTS[exportFormat] || EXPORTS.text;
  try {
    await navigator.clipboard.writeText(build());
    toast(t('{n} times copied {label}.', { n: solves.length, label }));
  } catch {
    toast(t('Copying did not work in this browser.'));
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
    toast(t('That file could not be read.'));
    return null;
  }
}

let arriving = null; // a file read and understood, waiting to be folded in

function showTransfer() {
  const sessions = saveFile.sessions.length;
  const times = saveFile.sessions.reduce((sum, session) => sum + session.solves.length, 0);
  el.transferHere.textContent = times
    ? t('{a} {sessionWord}, {b} {timeWord}.', { a: sessions, sessionWord: t(sessions === 1 ? 'session' : 'sessions'), b: times, timeWord: t(times === 1 ? 'time' : 'times') })
    : t('No times on this device yet.');
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

/** The one place that opens it, now that the settings no longer carry a copy. */
function openTransfer() {
  el.transferShare.hidden = !canShareFiles();
  el.transferThere.textContent = t('Pick the file you saved on your other device.');
  showTransfer();
  openSheet(el.transferSheet);
}

el.transferClose.addEventListener('click', () => el.transferSheet.close());
el.transferSheet.addEventListener('close', () => { arriving = null; });

el.transferSave.addEventListener('click', () => {
  el.transferSave.blur();
  offerFile(backupName(), JSON.stringify(buildBackup(saveFile, settings)));
  toast(t('File saved. Put it on your other device and open it there.'));
});

el.transferShare.addEventListener('click', async () => {
  el.transferShare.blur();
  const file = new File([JSON.stringify(buildBackup(saveFile, settings))], backupName(),
    { type: 'application/json' });
  try {
    await navigator.share({ files: [file], title: 'Cubetimer' });
  } catch (error) {
    // Closing the share sheet is not a failure and is not worth a word.
    if (error?.name !== 'AbortError') toast(t('Sending did not work; just save the file instead.'));
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

    const when = look.saved ? t(' from {date}', { date: new Date(look.saved).toLocaleDateString(locale()) }) : '';
    const times = (count) => t(count === 1 ? '{n} time' : '{n} times', { n: count });
    el.transferThere.textContent = look.added
      ? `${picked.name}${when}: ` + t('{n} {word}, ', { n: look.sessions, word: t(look.sessions === 1 ? 'session' : 'sessions') })
        + `${times(look.times)}` + t(' — {n} of them new to this device', { n: look.added })
        + (look.known ? t(', {n} are already here', { n: look.known }) : '')
        + (look.newSessions ? t(', {n} new {word}', { n: look.newSessions, word: t(look.newSessions === 1 ? 'session' : 'sessions') }) : '')
        + '.'
      : `${picked.name}${when}: ` + t('everything in it is already here.');
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
  // told otherwise.
  if (arriving.settings && Object.keys(arriving.settings).length) {
    settings = { ...settings, ...arriving.settings };
    storeSettings();
    applySettings();
  }

  persist();
  syncTargetUi();
  render();
  el.transferSheet.close();
  const count = t(folded.added === 1 ? '{n} time' : '{n} times', { n: folded.added });
  toast(how === 'replace'
    ? t('Everything replaced: {n}.', { n: count })
    : `${count} erbij${folded.known ? `, ${folded.known} stonden er al` : ''}.`);
}

el.transferMerge.addEventListener('click', () => fold('merge'));

el.transferReplace.addEventListener('click', () => {
  const times = saveFile.sessions.reduce((sum, session) => sum + session.solves.length, 0);
  if (!times || confirm(t('Throw away everything on this device and replace it with the file? {n} times disappear.', { n: times }))) {
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
    ? t(found.length === 1 ? '{n} time recognised' : '{n} times recognised', { n: found.length })
      + (skipped ? t(skipped === 1 ? ', {n} line skipped' : ', {n} lines skipped', { n: skipped }) : '') + '.'
    : t('No times recognised in what is there.');
}

function openPaste() {
  el.pasteInput.value = '';
  describePaste();
  openSheet(el.pasteSheet);
}

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
    el.pasteNote.textContent = t('This is a whole file with sessions in it. Use "to another device" — that keeps your sessions, scrambles and notes intact.');
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
  toast(t(found.length === 1 ? '{n} time added.' : '{n} times added.', { n: found.length }));
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
    if (announce) toast(t('No new times on your timer.'));
    return;
  }

  offeredTimes = times;
  el.importTitle.textContent = times.length === 1 ? t('New time found') : t('New times found');
  el.importText.textContent = times.length === 1
    ? t('Your timer has a time that is not here yet. Add it to "{name}"?', { name: currentSession().name })
    : t('Your timer has {n} times that are not here yet. Add them to "{name}"?', { n: times.length, name: currentSession().name });

  el.importNote.textContent = skipped > 0
    ? t(skipped === 1
      ? 'Your timer reports {slots} slots; one of them was a duplicate or already here.'
      : 'Your timer reports {slots} slots; {n} of them were duplicates or already here.', { slots, n: skipped })
    : t('Everything your timer reports ({n} slots).', { n: slots });

  el.importList.innerHTML = '';
  times.forEach((ms, index) => {
    const item = document.createElement('li');
    const value = document.createElement('strong');
    value.textContent = formatTime(ms);
    const label = document.createElement('span');
    label.textContent = index === 0 ? t('on the display') : `${index} terug`;
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

  if (!added.length) toast(t('Those times were already there.'));
  else toast(added.length === 1 ? t('Time added.') : t('{n} times added.', { n: added.length }));

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
    el.deviceDetails.textContent = t('No details to ask for.');
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
    note.textContent = t('The timer’s lights cannot be driven from here: ')
      + t('that goes through GAN\u2019s own app, over a protocol that is not public.');
    el.deviceDetails.append(note);
  }
  el.deviceDetails.hidden = false;
}

el.settingsOpen.addEventListener('click', () => {
  el.settingsOpen.blur();
  syncSettingsUi();
  renderSettingsTabs();
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
    toast(t('Scramble copied.'));
  } catch {
    toast(t('Copying did not work in this browser.'));
  }
});

el.clear.addEventListener('click', () => {
  el.clear.blur();
  if (!solves.length) return;
  if (!confirm(t('Clear every time in this session?'))) return;
  solves.length = 0;
  persist();
  render();
});



/* ---------- the settings, in groups ----------

   Thirty-four settings in one list is a list nobody reads: you scroll past the
   thing you came for twice and give up. They are the same settings in the same
   sheet, sorted into eight named groups with a row of tabs over them, so what
   is on screen is only ever the handful that belong together.

   Nothing is hidden away: "alles" puts the whole list back, and it is
   remembered, so anyone who prefers the long list gets it every time. */

let settingsTab = settings.settingsTab || 'timer';

function renderSettingsTabs() {
  if (!el.settingsTabs) return;
  const groups = [...el.settingsGroups.querySelectorAll('.settings-group')];

  el.settingsTabs.replaceChildren(...[...groups.map((group) => ({
    id: group.dataset.group, name: t(group.dataset.name)
  })), { id: 'all', name: t('Everything') }].map((tab) => {
    const chip = document.createElement('button');
    // Inside a dialog form a button submits by default, and submitting closes
    // the dialog -- so every one of these has to say it is only a button.
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.active = String(tab.id === settingsTab);
    chip.textContent = tab.name;
    chip.addEventListener('click', () => {
      settingsTab = tab.id;
      settings.settingsTab = tab.id;
      storeSettings();
      renderSettingsTabs();
      // Back to the top: the new group starts where your eyes already are.
      el.settings.querySelector('.sheet-inner')?.scrollTo({ top: 0 });
    });
    return chip;
  }));

  for (const group of groups) {
    group.hidden = settingsTab !== 'all' && group.dataset.group !== settingsTab;
  }
  el.settingsGroups.dataset.all = String(settingsTab === 'all');
}

/* ---------- your algorithms on one page ----------

   Everything in the case book is yours -- the star you put on an algorithm, the
   one you typed in, the line you wrote to yourself about it -- and none of it
   was any use away from a screen. This is that, on paper.

   One case per line, down the page: the name above, the picture on the left and
   your algorithm beside it. That is the shape you actually read an alg sheet
   in, and it is the shape it prints in. */

let paperOnly = settings.sheetOnly || 'all';
let paperPicking = false;

/** Which groups go on the sheet. Yours to choose, and remembered. */
function paperGroups() {
  const want = new Set(settings.sheetGroups || []);
  const groups = Object.keys(caseSet.GROUPS).filter((group) => want.has(group));
  return groups.length ? groups : ['pll'];
}

function togglePaperGroup(group) {
  const want = new Set(settings.sheetGroups || []);
  if (want.has(group)) want.delete(group);
  else want.add(group);
  settings.sheetGroups = [...want];
  storeSettings();
  renderPaper();
}

/** The cases you ticked yourself, per group. */
const pickedIn = (group) => new Set(settings.sheetCases?.[group] || []);

function togglePaperCase(group, id) {
  const mine = pickedIn(group);
  if (mine.has(id)) mine.delete(id);
  else mine.add(id);
  settings.sheetCases = { ...settings.sheetCases, [group]: [...mine] };
  storeSettings();
  renderPaper();
}

/** The cases that make the sheet, under the choice you made. */
function paperCases() {
  const out = [];
  for (const group of paperGroups()) {
    const ranked = new Map(caseStanding(play(), group).map((row) => [row.id, row]));
    const ticked = pickedIn(group);
    for (const entry of groupCases(group)) {
      if (paperOnly === 'picked' && !ticked.has(entry.id)) continue;
      if (paperOnly === 'mine' && !(entry.algs.some((alg) => alg.mine) || settings.pickedAlg?.[algKey(entry)])) continue;
      if (paperOnly === 'drilled' && !ranked.has(entry.id)) continue;
      out.push({ entry, row: ranked.get(entry.id) || null });
    }
  }
  return out;
}

/** One line of the sheet: the name above, the picture, then the algorithm. */
function paperRow(entry) {
  const row = document.createElement('article');
  row.className = 'paper-row';

  const name = document.createElement('b');
  name.className = 'paper-name';
  name.textContent = entry.name && entry.name !== entry.id
    ? `${entry.id} · ${t(entry.name)}`
    : entry.id;
  row.append(name);

  const body = document.createElement('div');
  body.className = 'paper-body';

  const face = document.createElement('div');
  face.className = 'paper-face';
  face.append(caseThumb(entry));

  const side = document.createElement('div');
  side.className = 'paper-side';
  const moves = spellAlg(chosenAlg(entry).moves);
  moves.classList.add('paper-alg');
  side.append(moves);

  const note = noteOf(play(), algKey(entry));
  if (note && settings.sheetNotes) {
    const said = document.createElement('p');
    said.className = 'paper-note';
    said.textContent = note;
    side.append(said);
  }

  body.append(face, side);
  row.append(body);
  return row;
}

/** The picking grid: every case of a group, tick the ones you want. */
function paperPicker() {
  const wrap = document.createElement('div');
  wrap.className = 'paper-picking';

  for (const group of paperGroups()) {
    const ticked = pickedIn(group);
    const head = document.createElement('div');
    head.className = 'paper-pick-head';
    const name = document.createElement('b');
    name.textContent = `${caseSet.GROUPS[group].name} — ${t('{n} chosen', { n: ticked.size })}`;
    head.append(name);

    const all = document.createElement('button');
    all.type = 'button';
    all.className = 'link';
    all.textContent = t('all');
    all.addEventListener('click', () => {
      settings.sheetCases = { ...settings.sheetCases, [group]: groupCases(group).map((one) => one.id) };
      storeSettings();
      renderPaper();
    });

    const none = document.createElement('button');
    none.type = 'button';
    none.className = 'link';
    none.textContent = t('none');
    none.addEventListener('click', () => {
      settings.sheetCases = { ...settings.sheetCases, [group]: [] };
      storeSettings();
      renderPaper();
    });

    head.append(all, none);
    wrap.append(head);

    const grid = document.createElement('div');
    grid.className = 'case-grid';
    for (const entry of groupCases(group)) {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'case-tile';
      tile.dataset.on = String(ticked.has(entry.id));
      const label = document.createElement('b');
      label.textContent = entry.id;
      tile.append(caseThumb(entry), label);
      tile.addEventListener('click', () => togglePaperCase(group, entry.id));
      grid.append(tile);
    }
    wrap.append(grid);
  }
  return wrap;
}

function renderPaper() {
  if (!caseSet) return;
  const chosen = new Set(paperGroups());

  el.paperGroups.replaceChildren(...Object.entries(caseSet.GROUPS).map(([group, shape]) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.active = String(chosen.has(group));
    chip.textContent = shape.name;
    chip.addEventListener('click', () => togglePaperGroup(group));
    return chip;
  }));

  const filters = [
    ['all', 'every case'], ['picked', 'the ones I ticked'],
    ['mine', 'only what I chose myself'], ['drilled', 'only what I have drilled']
  ].map(([id, label]) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'link';
    chip.dataset.active = String(id === paperOnly);
    chip.textContent = t(label);
    chip.addEventListener('click', () => {
      paperOnly = id;
      settings.sheetOnly = id;
      storeSettings();
      renderPaper();
    });
    return chip;
  });

  const pick = document.createElement('button');
  pick.type = 'button';
  pick.className = 'link';
  pick.dataset.active = String(paperPicking);
  pick.textContent = paperPicking ? t('done ticking') : t('tick cases');
  pick.addEventListener('click', () => {
    paperPicking = !paperPicking;
    // Ticking cases and then not looking at them would be odd, so choosing to
    // tick also switches the sheet to showing what you ticked.
    if (paperPicking) {
      paperOnly = 'picked';
      settings.sheetOnly = 'picked';
      storeSettings();
    }
    renderPaper();
  });
  filters.push(pick);
  el.paperFilter.replaceChildren(...filters);

  if (paperPicking) {
    el.paperTitle.textContent = t('Alg sheet — ticking');
    el.paperBody.replaceChildren(paperPicker());
    return;
  }

  const rows = paperCases();
  el.paperTitle.textContent = `${t('Alg sheet')} — ${rows.length}`;

  if (!rows.length) {
    el.paperBody.replaceChildren(line(
      paperOnly === 'picked'
        ? t('Nothing ticked yet. Press “tick cases” and choose the ones you want.')
        : t('Nothing chosen. Turn a group on, or pick a wider selection.'), 'import-note'));
    return;
  }

  const sheet = document.createElement('div');
  sheet.className = 'paper-sheet';
  for (const { entry } of rows) sheet.append(paperRow(entry));
  el.paperBody.replaceChildren(sheet);
}

/** The same thing as text, for anywhere that is not a printer. */
function paperAsText() {
  const lines = [];
  for (const group of paperGroups()) {
    const rows = paperCases().filter(({ entry }) => entry.group === group);
    if (!rows.length) continue;
    lines.push(`# ${caseSet.GROUPS[group].name}`);
    for (const { entry } of rows) {
      const note = noteOf(play(), algKey(entry));
      lines.push(`${entry.id.padEnd(6)} ${chosenAlg(entry).moves}${note ? `   (${note})` : ''}`);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

/* --- the sheet as a file ----------

   Printing needs a printer and copying loses the pictures, so the third way out
   is a picture of the sheet itself. It is drawn rather than screenshotted: the
   diagrams are the same SVGs the app already makes, turned into images through
   a data URL, so nothing is fetched and it works offline like everything else.
   Twice the pixels, because a sheet you zoom into should not go soft. */

const SHEET = {
  scale: 2,
  width: 720,
  pad: 32,
  row: 78,
  face: 58,
  head: 92
};

/** One SVG, as something a canvas will draw. */
function asImage(svg) {
  const copy = svg.cloneNode(true);
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const text = new XMLSerializer().serializeToString(copy);
  return new Promise((done, fail) => {
    const image = new Image();
    image.onload = () => done(image);
    image.onerror = fail;
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
  });
}

async function drawSheet() {
  const rows = paperCases();
  const ink = getComputedStyle(el.body).getPropertyValue('--ink').trim() || '#12303f';
  const soft = getComputedStyle(el.body).getPropertyValue('--muted').trim() || '#6b8496';
  const led = settings.colors?.led || '#4fc3f7';

  const height = SHEET.head + rows.length * SHEET.row + SHEET.pad;
  const canvas = document.createElement('canvas');
  canvas.width = SHEET.width * SHEET.scale;
  canvas.height = height * SHEET.scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(SHEET.scale, SHEET.scale);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, SHEET.width, height);

  const font = (size, weight = '400') =>
    `${weight} ${size}px ui-rounded, "SF Pro Rounded", system-ui, -apple-system, sans-serif`;

  ctx.fillStyle = ink;
  ctx.font = font(26, '700');
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(t('Alg sheet'), SHEET.pad, 46);

  ctx.fillStyle = soft;
  ctx.font = font(13);
  ctx.fillText(paperGroups().map((group) => caseSet.GROUPS[group].name).join(' · '), SHEET.pad, 68);
  const stamp = new Date().toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
  ctx.textAlign = 'right';
  ctx.fillText(`${settings.shareName ? `${settings.shareName} · ` : ''}${stamp}`, SHEET.width - SHEET.pad, 68);
  ctx.textAlign = 'left';

  ctx.strokeStyle = led;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(SHEET.pad, 80);
  ctx.lineTo(SHEET.width - SHEET.pad, 80);
  ctx.stroke();

  // The pictures are made the same way the app makes them, then drawn in. Doing
  // them all at once keeps a hundred cases from taking a hundred round trips.
  const shapes = await Promise.all(rows.map(({ entry }) =>
    lastLayerOf(entry.setup)
      .then((shape) => (shape ? asImage(drawLastLayer(shape, entry.group === 'pll' ? 'pll' : 'oll')) : null))
      .catch(() => null)));

  rows.forEach(({ entry }, at) => {
    const top = SHEET.head + at * SHEET.row;

    if (at % 2 === 1) {
      ctx.fillStyle = '#f4f8fb';
      ctx.fillRect(SHEET.pad - 8, top - 8, SHEET.width - SHEET.pad * 2 + 16, SHEET.row - 6);
    }

    ctx.fillStyle = ink;
    ctx.font = font(15, '700');
    ctx.fillText(entry.id, SHEET.pad, top + 12);

    const said = entry.name && entry.name !== entry.id ? t(entry.name) : '';
    if (said) {
      ctx.fillStyle = soft;
      ctx.font = font(11);
      ctx.fillText(said, SHEET.pad + ctx.measureText(entry.id).width + 44, top + 12);
    }

    const image = shapes[at];
    if (image) ctx.drawImage(image, SHEET.pad, top + 18, SHEET.face, SHEET.face);

    ctx.fillStyle = ink;
    ctx.font = font(15, '600');
    ctx.fillText(chosenAlg(entry).moves, SHEET.pad + SHEET.face + 18, top + 48);

    const note = noteOf(play(), algKey(entry));
    if (note && settings.sheetNotes) {
      ctx.fillStyle = soft;
      ctx.font = font(11);
      ctx.fillText(note, SHEET.pad + SHEET.face + 18, top + 66);
    }
  });

  return canvas;
}

async function offerSheet() {
  el.paperSave.disabled = true;
  try {
    const canvas = await drawSheet();
    const blob = await new Promise((done) => canvas.toBlob(done, 'image/png'));
    if (!blob) throw new Error('no image');
    const address = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = address;
    link.download = `cubetimer-algs-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(address), 20000);
    toast(t('Sheet saved.'));
  } catch {
    toast(t('The sheet could not be drawn here.'));
  } finally {
    el.paperSave.disabled = false;
  }
}

async function openPaper() {
  try {
    await loadCases();
  } catch {
    toast(t('The cases could not be loaded.'));
    return;
  }
  renderPaper();
  openSheet(el.paperSheet);
}

el.paperClose.addEventListener('click', () => el.paperSheet.close());
el.paperSave.addEventListener('click', offerSheet);

el.paperPrint.addEventListener('click', () => {
  // Printing a dialog prints the page behind it, so the page is told for one
  // moment that the sheet is the only thing on it.
  el.body.dataset.printing = 'paper';
  const done = () => {
    delete el.body.dataset.printing;
    removeEventListener('afterprint', done);
  };
  addEventListener('afterprint', done);
  setTimeout(() => {
    window.print();
    // Safari on a phone never fires afterprint, so the flag comes off anyway.
    setTimeout(done, 2000);
  }, 60);
});

el.paperCopy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(paperAsText());
    toast(t('The sheet is on your clipboard.'));
  } catch {
    toast(t('Copying did not work in this browser.'));
  }
});

/* ---------- the wheel ----------

   One reel and a lever. The reel is the rule -- the daft half, the half that is
   actually the challenge -- and how long you keep it up is a row of buttons
   rather than a second spin, because that was never a surprise worth having.

   A challenge you take on gets a session of its own, named after the rule. Your
   ordinary averages stay clean, the counting has somewhere to happen that is
   not "whatever was open", and afterwards the whole thing is still there to
   look back at instead of being gone. */

let dare = null;        // { rule, count, done, at, session, back } while one is running
let spinning = false;
let shown = null;       // the rule on the reel, before you take it on
let wheelTab = 'wheel'; // wheel | algs

/** The challenge you are in the middle of, back from storage. */
function loadDare() {
  const kept = settings.dare;
  if (!kept) return null;
  const rule = ruleOf(kept.rule);
  if (!rule) return null;
  return {
    rule,
    count: countOf(kept.count).id,
    done: Number(kept.done) || 0,
    at: kept.at || Date.now(),
    session: typeof kept.session === 'string' ? kept.session : null,
    back: Number.isInteger(kept.back) ? kept.back : null
  };
}

function keepDare() {
  settings.dare = dare
    ? { rule: dare.rule.id, count: dare.count, done: dare.done, at: dare.at, session: dare.session, back: dare.back }
    : null;
  storeSettings();
}

/** One more solve towards the challenge, if one is running in its own session. */
function countTowardsDare() {
  if (!dare) return;
  // Only solves done in the challenge's own session count. Wander off to
  // another session and the counter waits for you.
  if (dare.session && currentSession().name !== dare.session) return;
  dare.done++;
  keepDare();
  if (countText(dare).done) daresDone();
  renderDareStrip();
  if (el.slotSheet.open) renderWheel();
}

function daresDone() {
  cue('win');
  setTimeout(() => {
    toast(t('Task done. The rule is between you and you.'), { label: t('Tick it off'), run: () => openSlot() });
  }, 1400);
}

/** The line on the main screen that says a challenge is running. */
function renderDareStrip() {
  if (!el.dareStrip) return;
  if (!dare) {
    el.dareStrip.hidden = true;
    return;
  }
  const { have, need } = countText(dare);
  el.dareStrip.hidden = false;
  el.dareStrip.textContent = need
    ? `${t(dare.rule.label)} — ${t('{have} of {need}', { have, need })}`
    : `${t(dare.rule.label)} — ${t('{n} solves', { n: have })}`;
}

/* --- taking one on, and putting it down --- */

/** The session a challenge runs in: its own, named after the rule. */
function startDare(rule, countId) {
  // The short name, not the whole rule: the session picker puts the puzzle
  // after it, and a forty-character rule leaves no room for either.
  const name = `${t('Dare')}: ${t(rule.short)}`.slice(0, 32);
  const back = saveFile.active;

  saveFile.sessions.push({ name, puzzle: currentSession().puzzle, solves: [] });
  persist();
  useSession(saveFile.sessions.length - 1);

  dare = { rule, count: countId, done: 0, at: Date.now(), session: name, back };
  shown = null;
  keepDare();
  renderDareStrip();
  toast(t('Taken on. Your times go in their own session while it runs.'));
}

/** Put it down, won or not, and go back to where you were solving. */
function endDare(won) {
  if (!dare) return;
  recordSpin(play(), [dare.rule.id, dare.count, won ? 'won' : 'gave'], { won, gave: !won });
  persist();

  const back = dare.back;
  dare = null;
  keepDare();
  if (Number.isInteger(back) && saveFile.sessions[back]) useSession(back);
  renderDareStrip();
  renderWheel();
}

/* --- the reel --- */

const FACE_HEIGHT = 84;

function buildReel() {
  const port = document.createElement('div');
  port.className = 'slot-port';
  const strip = document.createElement('div');
  strip.className = 'slot-strip';
  // Three times round, so there is something to spin past before it lands.
  for (let round = 0; round < 3; round++) {
    for (const rule of RULES) {
      const face = document.createElement('div');
      face.className = 'slot-face';
      const label = document.createElement('b');
      label.textContent = t(rule.short);
      face.append(label);
      strip.append(face);
    }
  }
  port.append(strip);
  el.slotReels.replaceChildren(port);
}

function spinReel(rule) {
  return new Promise((done) => {
    const strip = el.slotReels.querySelector('.slot-strip');
    if (!strip) { done(); return; }
    const landing = Math.max(0, RULES.findIndex((one) => one.id === rule.id));
    const stop = (RULES.length * 2 + landing) * FACE_HEIGHT;

    strip.style.transition = 'none';
    strip.style.transform = 'translate3d(0, 0, 0)';
    // Reading the layout back forces the browser to accept the jump to nought
    // before the transition to the landing place is set.
    void strip.offsetHeight;
    strip.style.transition = 'transform 2.1s cubic-bezier(.12,.86,.2,1.02)';
    strip.style.transform = `translate3d(0, ${-stop}px, 0)`;

    setTimeout(() => {
      cue('clunk');
      el.slotReels.dataset.landed = 'true';
      setTimeout(() => delete el.slotReels.dataset.landed, 460);
      done();
    }, 2140);
  });
}

async function pullTheArm() {
  if (spinning || dare) return;
  spinning = true;
  el.slotGo.disabled = true;
  shown = spin();
  el.slotBody.replaceChildren(line(t('Spinning…'), 'import-note'));
  cue('start');
  await spinReel(shown);
  spinning = false;
  el.slotGo.disabled = false;
  cue('target');
  renderWheel();
}

/* --- what the sheet shows --- */

let wantCount = '10';

function renderWheel() {
  const parts = [];
  const tally = spinTally(play());

  if (dare) {
    const card = document.createElement('section');
    card.className = 'dare-card';
    card.dataset.on = 'true';

    const head = document.createElement('h3');
    head.textContent = t(dare.rule.label);
    const small = document.createElement('p');
    small.className = 'dare-stake';
    small.textContent = t(dare.rule.small);
    card.append(head, small);

    const { have, need, done } = countText(dare);
    if (need) {
      const track = document.createElement('div');
      track.className = 'dare-track';
      const fill = document.createElement('span');
      fill.style.width = `${Math.round((have / need) * 100)}%`;
      track.append(fill);
      card.append(track);
    }
    const count = document.createElement('p');
    count.className = 'dare-count';
    count.textContent = need
      ? t('{have} of {need} solves in this session', { have, need })
      : t('{n} solves so far. It runs until you stop it.', { n: have });
    card.append(count);

    const actions = document.createElement('div');
    actions.className = 'detail-actions';

    const won = document.createElement('button');
    won.type = 'button';
    won.className = 'primary';
    won.textContent = done ? t('Managed it') : t('Managed it anyway');
    won.addEventListener('click', () => {
      endDare(true);
      confetti();
      toast(t('Noted. Spin again if you dare.'));
    });

    const gave = document.createElement('button');
    gave.type = 'button';
    gave.className = 'danger';
    gave.textContent = t('Gave up');
    gave.addEventListener('click', () => {
      endDare(false);
      toast(t('Fair enough. The wheel forgets nothing.'));
    });

    actions.append(won, gave);
    card.append(actions);
    parts.push(card);
  } else if (shown) {
    const card = document.createElement('section');
    card.className = 'dare-card';

    const head = document.createElement('h3');
    head.textContent = t(shown.label);
    const small = document.createElement('p');
    small.className = 'dare-stake';
    small.textContent = t(shown.small);
    card.append(head, small);

    const howLong = document.createElement('div');
    howLong.className = 'segmented';
    for (const count of COUNTS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = t(count.label);
      button.dataset.active = String(count.id === wantCount);
      button.addEventListener('click', () => { wantCount = count.id; renderWheel(); });
      howLong.append(button);
    }
    card.append(howLong);

    const actions = document.createElement('div');
    actions.className = 'detail-actions';
    const take = document.createElement('button');
    take.type = 'button';
    take.className = 'primary';
    take.textContent = t('I will do it');
    take.addEventListener('click', () => {
      startDare(shown, wantCount);
      renderWheel();
    });
    const again = document.createElement('button');
    again.type = 'button';
    again.textContent = t('Spin again');
    again.addEventListener('click', pullTheArm);

    const send = document.createElement('button');
    send.type = 'button';
    send.textContent = t('Dare someone');
    send.addEventListener('click', async () => {
      const link = `${location.origin}${location.pathname}#${darePart(shown.id, wantCount)}`;
      try {
        await navigator.clipboard.writeText(link);
        toast(t('Link copied. They get the rule, not your times.'));
      } catch {
        toast(t('Copying did not work in this browser.'));
      }
    });

    actions.append(take, again, send);
    card.append(actions);
    parts.push(card);
  } else {
    parts.push(line(t('Pull the lever. Twenty-two rules, and not one of them is a rule you would set yourself.'), 'import-note'));
  }

  if (tally.played) {
    const block = document.createElement('section');
    block.className = 'records-block';
    const heading = document.createElement('h3');
    heading.textContent = t('How the wheel treats you');
    const said = document.createElement('div');
    said.className = 'round-lines';
    const row = document.createElement('div');
    const name = document.createElement('b');
    name.textContent = t('{n} managed', { n: tally.won });
    const figure = document.createElement('span');
    figure.textContent = t('{gave} given up · {all} in all', { gave: tally.gave, all: tally.played });
    row.append(name, figure);
    said.append(row);
    block.append(heading, said);
    parts.push(block);
  }

  el.slotBody.replaceChildren(...parts);
}

/* ---------- the second wheel: whose algorithm is this? ----------

   It picks a case and shows four algorithms, one of which is the one you
   starred for it. Knowing an algorithm and knowing which case it belongs to are
   two different things, and only the first one gets practised by drilling. */

let algWheel = null;    // { entry, choices, at }
let algGroup = 'pll';
let algRound = { asked: 0, right: 0 };

function nextAlgRound() {
  const pool = groupCases(algGroup).filter((entry) => entry.algs.length);
  if (pool.length < 4) { algWheel = null; return; }
  const entry = pool[Math.floor(Math.random() * pool.length)];

  const others = pool.filter((one) => one.id !== entry.id);
  const wrong = [];
  while (wrong.length < 3 && others.length) {
    const [taken] = others.splice(Math.floor(Math.random() * others.length), 1);
    wrong.push(taken);
  }
  const choices = [entry, ...wrong]
    .map((one) => ({ id: one.id, moves: chosenAlg(one).moves }))
    .sort(() => Math.random() - 0.5);

  algWheel = { entry, choices, at: performance.now() };
}

function answerAlg(choice, button) {
  if (!algWheel || button.dataset.said) return;
  const right = choice.id === algWheel.entry.id;
  algRound.asked++;
  if (right) algRound.right++;

  for (const other of el.slotBody.querySelectorAll('.alg-choice')) {
    other.dataset.said = 'true';
    if (other.dataset.case === algWheel.entry.id) other.dataset.right = 'true';
  }
  if (!right) button.dataset.wrong = 'true';
  cue(right ? 'target' : 'miss');

  setTimeout(() => { nextAlgRound(); renderWheel(); }, right ? 420 : 1200);
}

function renderAlgWheel() {
  const parts = [];

  const picker = document.createElement('div');
  picker.className = 'chip-row';
  for (const [group, shape] of Object.entries(caseSet.GROUPS)) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.active = String(group === algGroup);
    chip.textContent = shape.name;
    chip.addEventListener('click', () => {
      algGroup = group;
      algRound = { asked: 0, right: 0 };
      nextAlgRound();
      renderWheel();
    });
    picker.append(chip);
  }
  parts.push(picker);

  if (!algWheel) {
    parts.push(line(t('Too few cases in this group to choose from.'), 'import-note'));
    el.slotBody.replaceChildren(...parts);
    return;
  }

  const card = document.createElement('div');
  card.className = 'alg-quiz';
  const face = document.createElement('div');
  face.className = 'case-face';
  face.append(caseThumb(algWheel.entry));
  const ask = document.createElement('div');
  ask.className = 'alg-quiz-ask';
  const name = document.createElement('b');
  name.textContent = algWheel.entry.id;
  const said = document.createElement('small');
  said.textContent = t('Which of these is your way through it?');
  ask.append(name, said);
  card.append(face, ask);
  parts.push(card);

  const list = document.createElement('div');
  list.className = 'alg-choices';
  for (const choice of algWheel.choices) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'alg-choice';
    button.dataset.case = choice.id;
    button.append(spellAlg(choice.moves));
    button.addEventListener('click', () => answerAlg(choice, button));
    list.append(button);
  }
  parts.push(list);

  if (algRound.asked) {
    parts.push(line(t('{right} of {asked} right', { right: algRound.right, asked: algRound.asked }), 'import-note'));
  }

  const actions = document.createElement('div');
  actions.className = 'detail-actions';
  const go = document.createElement('button');
  go.type = 'button';
  go.textContent = t('Drill this case now');
  go.addEventListener('click', () => {
    const entry = algWheel.entry;
    el.slotSheet.close();
    startCase(entry);
    toast(t('{id} — turn the setup, then solve the case.', { id: entry.id }));
  });
  actions.append(go);
  parts.push(actions);

  el.slotBody.replaceChildren(...parts);
}

/* --- the sheet --- */

function renderSlot() {
  el.slotTabs.replaceChildren(...[
    ['wheel', t('The wheel')], ['algs', t('Whose alg?')]
  ].map(([id, label]) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.active = String(id === wheelTab);
    chip.textContent = label;
    chip.addEventListener('click', async () => {
      wheelTab = id;
      if (id === 'algs') {
        try {
          await loadCases();
        } catch {
          toast(t('The cases could not be loaded.'));
          wheelTab = 'wheel';
        }
        if (!algWheel && caseSet) nextAlgRound();
      }
      renderSlot();
    });
    return chip;
  }));

  el.slotMachine.hidden = wheelTab !== 'wheel';
  if (wheelTab === 'algs' && caseSet) renderAlgWheel();
  else renderWheel();
}

function openSlot() {
  if (!el.slotReels.children.length) buildReel();
  el.slotGo.disabled = Boolean(dare);
  renderSlot();
  openSheet(el.slotSheet);
}

el.slotClose.addEventListener('click', () => el.slotSheet.close());
el.slotGo.addEventListener('click', pullTheArm);
el.dareStrip.addEventListener('click', () => openSlot());

/** A challenge somebody sent you. Shown, never taken on for you. */
function showDareLink() {
  const sent = readDareLink();
  if (!sent || dare) return;
  shown = sent.rule;
  wantCount = sent.count;
  toast(t('Somebody dares you: {rule}', { rule: t(sent.rule.label) }), {
    label: t('Look'),
    run: () => openSlot()
  });
}

/* ---------- the course ----------

   Seven steps, a road beside them, and a cube on the road that shows where you
   are. F2L and full OLL are deliberately not here: those are things you look up
   in the case book once you can already solve, and putting them in a beginner's
   course is what turns it into a thing people close again.

   A step is shut until the one before it is ticked. Which would be unkind to
   somebody who can already solve, so every step also has a way straight past
   it -- "I can do this" ticks it off without reading a word. */

let openStep = null;
let courseCube = null;      // the cube on the map, once it has been built
let slowly = null;          // { moves, at, label } while you are stepping through

/** Turn the little bit of emphasis the lessons use into real elements. */
function saidAs(text, tag = 'p') {
  const said = document.createElement(tag);
  for (const part of t(text).split(/(\*\*[^*]+\*\*)/)) {
    if (!part) continue;
    if (part.startsWith('**')) {
      const strong = document.createElement('strong');
      strong.textContent = part.slice(2, -2);
      said.append(strong);
    } else {
      said.append(document.createTextNode(part));
    }
  }
  return said;
}

/* --- the cube on the map --- */

async function courseCubeReady() {
  if (courseCube !== null) return courseCube;
  courseCube = await makeCube({ size: 118, drag: true, angle: [-26, -34] });
  return courseCube;
}

/** Put the cube in the state your progress has reached. */
function showProgress() {
  const done = play().course || [];
  courseCube?.show(cubeAfter(done));
}

/**
 * Play one demonstration. The state is set first and then the moves run, so
 * pressing it twice does the same thing twice rather than carrying on from
 * wherever the last one stopped.
 */
function demonstrate(entry) {
  if (!courseCube) return;
  slowly = null;
  courseCube.play(entry.alg, { pace: coursePace(), from: entry.from ?? '' });
  renderCourseTools();
}

/** How fast the cube turns, kept between visits. */
const PACES = [900, 560, 340];
function coursePace() {
  return PACES[Math.min(settings.coursePace ?? 1, PACES.length - 1)];
}

/** The slow mode: the cube waits, and you hand it one move at a time. */
async function stepThrough(entry) {
  if (!courseCube) return;
  await courseCube.show(entry.from ?? '');
  slowly = { moves: entry.alg.trim().split(/\s+/).filter(Boolean), at: 0 };
  renderCourseTools();
}

function nextSlowMove() {
  if (!slowly || slowly.at >= slowly.moves.length) return;
  const move = slowly.moves[slowly.at++];
  courseCube?.step(move, 300);
  renderCourseTools();
}

/** The strip under the cube: what it is doing, and how fast. */
function renderCourseTools() {
  if (!el.courseTools) return;
  el.courseTools.replaceChildren();

  if (slowly) {
    const left = slowly.moves.length - slowly.at;
    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'text-button';
    go.textContent = left ? t('Next move: {move}', { move: slowly.moves[slowly.at] }) : t('Done');
    go.disabled = !left;
    go.addEventListener('click', nextSlowMove);

    const stop = document.createElement('button');
    stop.type = 'button';
    stop.className = 'link';
    stop.textContent = t('back to the map');
    stop.addEventListener('click', () => {
      slowly = null;
      showProgress();
      renderCourseTools();
    });
    el.courseTools.append(go, stop);
    return;
  }

  const speed = document.createElement('div');
  speed.className = 'segmented tiny';
  [t('slow'), t('normal'), t('quick')].forEach((label, at) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.dataset.active = String((settings.coursePace ?? 1) === at);
    button.addEventListener('click', () => {
      settings.coursePace = at;
      storeSettings();
      renderCourseTools();
    });
    speed.append(button);
  });

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'link';
  back.textContent = t('show my progress');
  back.addEventListener('click', showProgress);

  el.courseTools.append(speed, back);
}

/* --- the road --- */

/**
 * The road. Upright beside the words when there is a column to spare, and laid
 * on its side above them when there is not -- the same stops, the same path,
 * with x and y swapped, because a 120-wide road on a 360-wide phone is a
 * squiggle nobody can read.
 */
const FLAT_ROAD = matchMedia('(max-width: 720px)');

function renderRoad() {
  const done = play().course || [];
  const flat = FLAT_ROAD.matches;
  const road = el.courseRoad;
  road.replaceChildren();
  road.setAttribute('viewBox', flat
    ? `0 0 ${MAP.height + 20} ${MAP.width}`
    : `0 0 ${MAP.width} ${MAP.height + 20}`);
  road.dataset.flat = String(flat);

  const ns = 'http://www.w3.org/2000/svg';
  const make = (name, attrs) => {
    const node = document.createElementNS(ns, name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  };

  const turn = ([x, y]) => (flat ? [y, x] : [x, y]);
  const d = roadPath(STEPS.map((step) => ({ at: turn(step.at) })));
  road.append(make('path', { d, class: 'road-back' }));

  const at = STEPS.reduce((last, step, index) => (done.includes(step.id) ? index : last), -1);
  const ahead = make('path', { d, class: 'road-done' });
  road.append(ahead);

  STEPS.forEach((step, index) => {
    const [x, y] = turn(step.at);
    const had = done.includes(step.id);
    const open = isOpen(step, done);
    const here = open && !had;
    const stop = make('g', { class: 'road-stop', transform: `translate(${x} ${y})` });
    stop.dataset.done = String(had);
    stop.dataset.here = String(here);
    stop.dataset.shut = String(!open);
    stop.append(make('circle', { r: 15, class: 'road-halo' }));
    stop.append(make('circle', { r: 11, class: 'road-dot' }));
    const number = make('text', { y: 4.6, 'text-anchor': 'middle', class: 'road-number' });
    number.textContent = had ? '✓' : open ? String(index + 1) : '·';
    stop.append(number);
    if (open) {
      stop.addEventListener('click', () => {
        openStep = step.id;
        renderCourse();
        el.courseBody.querySelector(`[data-step="${step.id}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      });
    }
    road.append(stop);
  });

  // The finished part is drawn in rather than jumping, so ticking a step off
  // visibly moves the road forward.
  requestAnimationFrame(() => {
    const total = ahead.getTotalLength ? ahead.getTotalLength() : 1000;
    const part = at < 0 ? 0 : (at + 1) / STEPS.length;
    ahead.style.strokeDasharray = `${total}`;
    ahead.style.strokeDashoffset = `${total * (1 - part)}`;
  });
}

FLAT_ROAD.addEventListener('change', () => {
  if (el.courseSheet.open) renderRoad();
});

/* --- one step --- */

function stepCard(step, index) {
  const done = play().course || [];
  const had = done.includes(step.id);
  const open = isOpen(step, done);

  const card = document.createElement('article');
  card.className = 'step-card';
  card.dataset.step = step.id;
  card.dataset.open = String(openStep === step.id && open);
  card.dataset.done = String(had);
  card.dataset.shut = String(!open);

  const head = document.createElement('button');
  head.type = 'button';
  head.className = 'step-head';
  const number = document.createElement('span');
  number.className = 'step-number';
  number.textContent = had ? '✓' : open ? String(index + 1) : '🔒';
  if (!open) number.textContent = '·';
  const label = document.createElement('span');
  label.className = 'step-label';
  const name = document.createElement('b');
  name.textContent = t(step.name);
  const about = document.createElement('small');
  about.textContent = open
    ? t(step.subtitle)
    : t('Finish {name} first', { name: t(STEPS[index - 1].name) });
  label.append(name, about);
  const long = document.createElement('span');
  long.className = 'step-long';
  long.textContent = step.minutes >= 60
    ? t('{n} h', { n: Math.round(step.minutes / 60) })
    : t('{n} min', { n: step.minutes });
  head.append(number, label, long);
  head.disabled = !open;
  head.addEventListener('click', () => {
    openStep = openStep === step.id ? null : step.id;
    renderCourse();
  });
  card.append(head);

  if (!open || openStep !== step.id) return card;

  const body = document.createElement('div');
  body.className = 'step-body';

  const goal = document.createElement('p');
  goal.className = 'step-goal';
  goal.textContent = t(step.goal);
  body.append(goal);

  for (const text of step.see) body.append(saidAs(text));

  if (step.does?.length) {
    const list = document.createElement('ol');
    list.className = 'step-does';
    for (const entry of step.does) {
      const item = document.createElement('li');
      item.append(saidAs(entry.say, 'div'));

      if (entry.alg) {
        const row = document.createElement('div');
        row.className = 'step-alg';
        row.append(spellAlg(entry.alg));

        const play = document.createElement('button');
        play.type = 'button';
        play.className = 'text-button';
        play.textContent = t('Show me');
        play.addEventListener('click', () => demonstrate(entry));

        const slow = document.createElement('button');
        slow.type = 'button';
        slow.className = 'link';
        slow.textContent = t('one move at a time');
        slow.addEventListener('click', () => stepThrough(entry));

        row.append(play, slow);
        item.append(row);

        const why = document.createElement('small');
        why.className = 'step-why-line';
        why.textContent = t(entry.why);
        item.append(why);
      }
      list.append(item);
    }
    body.append(list);
  }

  if (step.wrong) {
    const wrong = document.createElement('p');
    wrong.className = 'step-wrong';
    wrong.textContent = `${t('The mistake everybody makes:')} ${t(step.wrong)}`;
    body.append(wrong);
  }

  const check = document.createElement('p');
  check.className = 'step-check';
  check.textContent = t('You are done here when: {what}', { what: t(step.check) });
  body.append(check);

  const actions = document.createElement('div');
  actions.className = 'detail-actions';

  if (step.drill?.group) {
    const go = document.createElement('button');
    go.type = 'button';
    go.textContent = t('Drill {group}', { group: caseSet?.GROUPS?.[step.drill.group]?.name || step.drill.group });
    go.addEventListener('click', () => {
      el.courseSheet.close();
      openDrill({ group: step.drill.group, focus: 'spread' });
    });
    actions.append(go);
  }
  if (step.drill?.mode === 'cross') {
    const go = document.createElement('button');
    go.type = 'button';
    go.textContent = t('Practise the cross only');
    go.addEventListener('click', () => {
      el.courseSheet.close();
      picked = 'cross';
      el.modeOpen.click();
    });
    actions.append(go);
  }

  const tick = document.createElement('button');
  tick.type = 'button';
  tick.className = had ? '' : 'primary';
  tick.textContent = had ? t('Not yet after all') : t('I can do this');
  tick.addEventListener('click', () => {
    markStep(play(), step.id, !had);
    // Finishing the last step is the day you learned to solve a cube. It gets
    // stamped once, and nothing ever moves it again.
    const finished = !had && !nextStep(play().course || []);
    if (finished) markGraduated(play());
    persist();
    if (!had) {
      confetti();
      cue('win');
      const after = nextStep(play().course || []);
      openStep = after ? after.id : null;
      // The cube plays the stage you just finished, and stays there.
      showProgress();
    }
    renderCourse();
    if (finished) {
      toast(t('You can solve a Rubik’s cube.'), { label: t('Certificate'), run: () => openCertificate() });
    }
  });
  actions.append(tick);
  body.append(actions);

  card.append(body);
  return card;
}

function renderCourse() {
  const done = play().course || [];
  const far = howFar(done);

  const parts = [];
  const top = document.createElement('div');
  top.className = 'course-top';
  const said = document.createElement('p');
  said.className = 'course-said';
  const after = nextStep(done);
  said.textContent = after
    ? t('{had} of {all} steps. Up now: {name}. About {hours} hours of practice to go.',
      { had: far.had, all: far.all, name: t(after.name), hours: hoursLeft(done) })
    : t('Every step ticked off. From here it is only mileage.');
  const track = document.createElement('div');
  track.className = 'course-track';
  const fill = document.createElement('span');
  fill.style.width = `${Math.round(far.part * 100)}%`;
  track.append(fill);
  top.append(said, track);
  parts.push(top);

  STEPS.forEach((step, index) => parts.push(stepCard(step, index)));
  el.courseBody.replaceChildren(...parts);
  renderRoad();
  renderCourseTools();
}

async function openCourse() {
  loadCases().catch(() => {});
  if (openStep === null) openStep = nextStep(play().course || [])?.id || STEPS[0].id;
  renderCourse();
  openSheet(el.courseSheet);

  // The cube is built the first time the course is opened, not on page load:
  // twenty-six little boxes are not worth making for somebody who never comes
  // in here.
  const cube = await courseCubeReady();
  if (cube && !el.courseCube.contains(cube.el)) {
    el.courseCube.replaceChildren(cube.el);
    showProgress();
  }
  renderCourseTools();
}

el.courseClose.addEventListener('click', () => el.courseSheet.close());
el.courseSheet.addEventListener('close', () => {
  slowly = null;
  courseCube?.stop();
});

/* ---------- who is solving ----------

   One laptop, more than one person. Everything the app stores hangs off a
   profile, and switching profile reloads the page: every piece of state in here
   is read once at boot, and reading it all again is the only way to be certain
   nothing from the last profile is left in a variable somewhere. A wrong
   average is worse than a flicker.

   The first profile keeps the bare storage key, so somebody who has been using
   this for a year and never heard of profiles keeps every time where it was. */

/** Six colours for the little cube beside a name. */
const WHO_COLOURS = ['#4fc3f7', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#22d3ee'];

/** A profile's face: a cube in their own colour, drawn rather than a photo. */
function whoMark(person, size = 22) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.classList.add('who-mark');
  const colour = WHO_COLOURS[person.colour % WHO_COLOURS.length];
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 3; column++) {
      const tile = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      tile.setAttribute('x', String(2.5 + column * 6.6));
      tile.setAttribute('y', String(2.5 + row * 6.6));
      tile.setAttribute('width', '5.6');
      tile.setAttribute('height', '5.6');
      tile.setAttribute('rx', '1.4');
      // The middle square is the profile's colour and the rest is quiet, so
      // eight profiles are still eight different faces at a glance.
      tile.setAttribute('fill', row === 1 && column === 1 ? colour : 'currentColor');
      tile.setAttribute('opacity', row === 1 && column === 1 ? '1' : '.22');
      svg.append(tile);
    }
  }
  return svg;
}

function renderWhoChip() {
  const on = sharedDevice();
  el.whoOpen.hidden = !on;
  if (!on) return;
  const me = currentPerson();
  el.whoOpen.replaceChildren(whoMark(me), document.createTextNode(me.name));
}

function renderWhoList() {
  const me = currentPerson();
  el.whoList.replaceChildren(...people().map((person) => {
    const row = document.createElement('div');
    row.className = 'who-row';
    row.dataset.me = String(person.id === me.id);

    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'who-go';
    go.append(whoMark(person, 26));
    const name = document.createElement('b');
    name.textContent = person.name;
    go.append(name);
    if (person.id === me.id) {
      const said = document.createElement('small');
      said.textContent = t('you');
      go.append(said);
    }
    go.addEventListener('click', () => {
      if (person.id === me.id) return;
      usePerson(person.id);
    });
    row.append(go);

    const paint = document.createElement('button');
    paint.type = 'button';
    paint.className = 'link';
    paint.textContent = t('colour');
    paint.addEventListener('click', () => {
      recolourPerson(person.id, (person.colour + 1) % WHO_COLOURS.length);
      renderWhoList();
      renderWhoChip();
    });
    row.append(paint);

    const rename = document.createElement('button');
    rename.type = 'button';
    rename.className = 'link';
    rename.textContent = t('rename');
    rename.addEventListener('click', () => {
      const wanted = prompt(t('A new name'), person.name);
      if (wanted && renamePerson(person.id, wanted)) {
        renderWhoList();
        renderWhoChip();
      }
    });
    row.append(rename);

    if (person.id !== me.id && people().length > 1) {
      const drop = document.createElement('button');
      drop.type = 'button';
      drop.className = 'link danger';
      drop.textContent = t('remove');
      drop.addEventListener('click', () => {
        if (!confirm(t('Remove {name} and everything they have solved?', { name: person.name }))) return;
        dropPerson(person.id, [SAVE_BASE, SETTINGS_BASE, 'cubetimer.cloud.v1']);
        renderWhoList();
        renderWhoChip();
        toast(t('{name} removed.', { name: person.name }));
      });
      row.append(drop);
    }

    return row;
  }));
}

el.whoAdd.addEventListener('click', () => {
  const made = addPerson(el.whoName.value);
  if (!made) return;
  el.whoName.value = '';
  renderWhoList();
  renderWhoChip();
  toast(t('{name} added. Tap the name to switch.', { name: made.name }));
});
el.whoName.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') { event.preventDefault(); el.whoAdd.click(); }
});

function openWho() {
  renderWhoList();
  renderCloud();
  openSheet(el.whoSheet);
}

el.whoOpen.addEventListener('click', openWho);
el.whoClose.addEventListener('click', () => el.whoSheet.close());

/* ---------- an account, for when one device is not enough ----------

   Optional in the strongest sense: the app has never needed one and still does
   not. Signing in adds one thing -- the same backup file the app already writes
   for "to another device", kept in a Firebase project you own -- and syncing is
   the same fold that file already goes through. Nothing is overwritten, because
   that machinery never overwrites. */

let syncing = false;

function cloudSettings() {
  return { apiKey: settings.cloudKey || '', projectId: settings.cloudProject || '' };
}

/** Pull what is up there, fold it in, and push the result back. */
async function syncNow({ quiet = false } = {}) {
  if (syncing || !cloud.who()) return false;
  syncing = true;
  renderCloud();
  try {
    const there = await cloud.pull();
    if (there?.backup) {
      const incoming = readBackup(there.backup);
      const folded = foldIn(saveFile, incoming, 'merge');
      saveFile = {
        active: Math.min(folded.active ?? saveFile.active, folded.sessions.length - 1),
        sessions: folded.sessions,
        play: folded.play
      };
      solves = currentSession().solves;
      persist();
      render();
      if (!quiet && folded.added) toast(t('{n} times came down.', { n: folded.added }));
    }
    await cloud.push(JSON.stringify(buildBackup(saveFile, settings)));
    settings.cloudAt = Date.now();
    storeSettings();
    if (!quiet) toast(t('In step.'));
    return true;
  } catch (error) {
    if (!quiet) toast(error.message);
    return false;
  } finally {
    syncing = false;
    renderCloud();
  }
}

function renderCloud() {
  if (!el.whoCloud) return;
  el.whoCloud.replaceChildren();

  const head = document.createElement('h3');
  head.className = 'transfer-head';
  head.textContent = t('An account');
  el.whoCloud.append(head);

  if (!cloud.configured()) {
    el.whoCloud.append(line(
      t('Not set up. An account keeps your times on a Firebase project of your own, so they are on every device you sign in on. The README says how, in six steps.'),
      'import-note'));

    const fields = document.createElement('div');
    fields.className = 'move-new';
    const key = document.createElement('input');
    key.type = 'text';
    key.placeholder = t('Firebase API key');
    key.value = settings.cloudKey || '';
    const project = document.createElement('input');
    project.type = 'text';
    project.placeholder = t('Project id');
    project.value = settings.cloudProject || '';
    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'text-button';
    save.textContent = t('Save');
    save.addEventListener('click', () => {
      settings.cloudKey = key.value.trim().slice(0, 80);
      settings.cloudProject = project.value.trim().slice(0, 80);
      storeSettings();
      cloud.setConfig(cloudSettings());
      renderCloud();
    });
    fields.append(key, project, save);
    el.whoCloud.append(fields);
    return;
  }

  const me = cloud.who();
  if (!me) {
    const fields = document.createElement('div');
    fields.className = 'move-new';
    const email = document.createElement('input');
    email.type = 'email';
    email.placeholder = t('Email');
    email.autocomplete = 'username';
    const word = document.createElement('input');
    word.type = 'password';
    word.placeholder = t('Password');
    word.autocomplete = 'current-password';
    fields.append(email, word);

    const said = document.createElement('p');
    said.className = 'import-note';

    const actions = document.createElement('div');
    actions.className = 'detail-actions';

    const go = async (how) => {
      said.textContent = '';
      try {
        await how(email.value.trim(), word.value);
        renderCloud();
        await syncNow();
      } catch (error) {
        said.textContent = error.message;
      }
    };

    const inButton = document.createElement('button');
    inButton.type = 'button';
    inButton.className = 'primary';
    inButton.textContent = t('Sign in');
    inButton.addEventListener('click', () => go(cloud.signIn));

    const upButton = document.createElement('button');
    upButton.type = 'button';
    upButton.textContent = t('Make an account');
    upButton.addEventListener('click', () => go(cloud.signUp));

    const forget = document.createElement('button');
    forget.type = 'button';
    forget.className = 'link';
    forget.textContent = t('another project');
    forget.addEventListener('click', () => {
      settings.cloudKey = '';
      settings.cloudProject = '';
      storeSettings();
      cloud.setConfig(cloudSettings());
      renderCloud();
    });

    actions.append(inButton, upButton, forget);
    el.whoCloud.append(fields, said, actions);
    return;
  }

  const said = document.createElement('p');
  said.className = 'import-note';
  said.textContent = settings.cloudAt
    ? t('Signed in as {email}. Last in step {when}.', {
      email: me.email,
      when: new Date(settings.cloudAt).toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' })
    })
    : t('Signed in as {email}.', { email: me.email });

  const actions = document.createElement('div');
  actions.className = 'detail-actions';

  const now = document.createElement('button');
  now.type = 'button';
  now.className = 'primary';
  now.textContent = syncing ? t('Syncing…') : t('Sync now');
  now.disabled = syncing;
  now.addEventListener('click', () => syncNow());

  const out = document.createElement('button');
  out.type = 'button';
  out.textContent = t('Sign out');
  out.addEventListener('click', () => {
    cloud.signOut();
    renderCloud();
    toast(t('Signed out. Your times stay on this device.'));
  });

  actions.append(now, out);
  el.whoCloud.append(said, actions);
}

// Going away is the moment to put things in step: closing the tab, switching
// app, locking the phone. Doing it after every solve would be chatty and would
// still miss the last one.
addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && cloud.who()) syncNow({ quiet: true });
});

/* ---------- your first solve, and the piece of paper ----------

   Learning to solve a cube happens once. Nothing in the app noticed, because
   everything in it is about getting faster -- so the day the last step of the
   course is ticked is stamped, and the first solve you put on the clock after
   that is kept by name. Over a year that is the nicest number in here. */

/** The earliest solve at or after the day you finished the course. */
function firstSolveEver() {
  const when = play().graduated;
  if (!when) return null;
  let first = null;
  for (const session of saveFile.sessions) {
    for (const solve of session.solves) {
      if (!Number.isFinite(solve.at) || solve.at < when) continue;
      if (!first || solve.at < first.at) first = solve;
    }
  }
  return first;
}

function renderCertificate() {
  const when = play().graduated;
  const first = firstSolveEver();
  el.certPaper.replaceChildren();

  const head = document.createElement('p');
  head.className = 'cert-head';
  head.textContent = t('Can solve a Rubik’s cube');

  const who = document.createElement('p');
  who.className = 'cert-who';
  who.textContent = settings.shareName || t('(your name)');

  const said = document.createElement('p');
  said.className = 'cert-said';
  said.textContent = when
    ? t('Finished the course on {date}.', { date: new Date(when).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }) })
    : t('Finish the course and this fills itself in.');

  el.certPaper.append(head, who, said);

  if (first) {
    const time = document.createElement('p');
    time.className = 'cert-time';
    time.textContent = t('First solve: {time}', { time: formatSolve(first) });
    el.certPaper.append(time);
  }

  const mark = document.createElement('p');
  mark.className = 'cert-mark';
  mark.textContent = 'cubetimer';
  el.certPaper.append(mark);
}

function openCertificate() {
  el.certName.value = settings.shareName || '';
  renderCertificate();
  openSheet(el.certSheet);
}

el.certClose.addEventListener('click', () => el.certSheet.close());
el.certName.addEventListener('input', () => {
  settings.shareName = el.certName.value.trim().slice(0, 40);
  storeSettings();
  renderCertificate();
});
el.certPrint.addEventListener('click', () => {
  el.body.dataset.printing = 'cert';
  const done = () => {
    delete el.body.dataset.printing;
    removeEventListener('afterprint', done);
  };
  addEventListener('afterprint', done);
  setTimeout(() => {
    window.print();
    setTimeout(done, 2000);
  }, 60);
});

/* ---------- without a cube ----------

   Three of the things in here need nothing but a screen, and they are the ones
   worth having on a train. They are scattered across the side list among the
   things that do need a cube, so this is one door with the three of them
   behind it. */

const AWAY = [
  {
    name: 'Recognition',
    about: 'A picture and four names. How long it takes you to say what you are looking at.',
    go: () => openSpot()
  },
  {
    name: 'Whose alg?',
    about: 'An algorithm and four cases. Knowing one is not knowing where it belongs.',
    go: () => { wheelTab = 'algs'; openSlot(); }
  },
  {
    name: 'Read the course',
    about: 'Seven steps you can read anywhere. The cube on the map does the turning.',
    go: () => openCourse()
  }
];

function openAway() {
  el.awayBody.replaceChildren(...AWAY.map((one) => {
    const button = document.createElement('button');
    button.type = 'button';
    const name = document.createElement('b');
    name.textContent = t(one.name);
    const about = document.createElement('small');
    about.textContent = t(one.about);
    button.append(name, about);
    button.addEventListener('click', () => {
      el.awaySheet.close();
      one.go();
    });
    return button;
  }));
  openSheet(el.awaySheet);
}

el.awayClose.addEventListener('click', () => el.awaySheet.close());

/* ---------- everything the app can do, in one list ----------

   Most of this was behind "openen" inside the settings, which is where a
   feature goes to never be found. The rail is the same list on every screen:
   always open beside the timer when there is room for it, and a drawer when
   there is not.

   Nothing new happens here -- each row presses the button that already exists,
   so there is one handler per feature and not two that can drift apart. */

const WIDE = matchMedia('(min-width: 1180px)');

/** What each row of the rail actually does. */
const RAIL = {
  'drill-open': () => openDrill(),
  'cases-times': () => openCaseBook(),
  'spot-open': () => openSpot(),
  'mode-open': () => el.modeOpen.click(),
  'metro-open': () => openMetro(),
  stats: () => el.statsButton.click(),
  records: () => { el.statsButton.click(); el.recordsOpen.click(); },
  'solves-open': () => el.solvesOpen.click(),
  closing: () => { el.statsButton.click(); el.closingOpen.click(); },
  share: () => { el.statsButton.click(); el.shareOpen.click(); },
  'big-open': () => setBig(true),
  'keys-open': () => openKeys(),
  'paper-open': () => openPaper(),
  'slot-open': () => openSlot(),
  'course-open': () => openCourse(),
  'away-open': () => openAway(),
  'who-open': () => openWho(),
  'transfer-open': () => openTransfer(),
  'paste-open': () => openPaste(),
  'settings-open': () => el.settingsOpen.click()
};

function showRail(open) {
  el.rail.dataset.open = String(open);
  el.railShade.hidden = !open || WIDE.matches;
  el.railOpen.setAttribute('aria-expanded', String(open));
  // "beside" is what makes the page leave a column free for the rail, so it
  // has to be off in the big display, where the rail is not there at all.
  const beside = WIDE.matches && el.body.dataset.big !== 'true';
  el.body.dataset.rail = beside ? 'beside' : open ? 'over' : 'away';
}

/** Wide enough and it simply stands there; narrow and it is a drawer. */
function fitRail() {
  showRail(WIDE.matches && el.body.dataset.big !== 'true');
}

el.railOpen.addEventListener('click', () => {
  el.railOpen.blur();
  showRail(el.rail.dataset.open !== 'true');
});
el.bigExit.addEventListener('click', () => setBig(false));
el.railClose.addEventListener('click', () => showRail(false));
el.railShade.addEventListener('click', () => showRail(false));
WIDE.addEventListener('change', fitRail);

/**
 * Which groups you leave folded away, kept between visits. The browser handles
 * the folding itself; all this does is put them back the way you had them.
 */
for (const group of el.rail.querySelectorAll('.rail-group')) {
  const shut = new Set(settings.railShut || []);
  group.open = !shut.has(group.dataset.group);
  group.addEventListener('toggle', () => {
    const closed = [...el.rail.querySelectorAll('.rail-group')]
      .filter((one) => !one.open)
      .map((one) => one.dataset.group);
    settings.railShut = closed;
    storeSettings();
  });
}

for (const button of el.rail.querySelectorAll('[data-go]')) {
  button.addEventListener('click', () => {
    const go = RAIL[button.dataset.go];
    if (!go) return;
    // On a narrow screen the drawer is over the page, so it gets out of the way
    // before whatever it opened appears underneath it.
    if (!WIDE.matches) showRail(false);
    // Anything already open would sit under the new sheet; only one at a time.
    for (const sheet of document.querySelectorAll('dialog[open]')) sheet.close();
    go();
  });
}

fitRail();

/* ---------- switching language ----------

   Everything the app has already drawn was drawn in the language that was on at
   the time, so a switch has to draw it again. The static page looks after
   itself -- lang.js remembers how it was written -- and this is the list of
   things the app puts there afterwards. */

onLangChange(() => {
  applySettings();
  renderPuzzles();
  renderSessions();
  renderScramble();
  renderMode();
  renderInsight();
  renderPractice();
  renderCubes();
  renderAim();
  renderTastePick();
  renderCrossFace();
  renderSkins();
  renderSettingsTabs();
  renderDareStrip();
  syncGoalValue();
  syncTargetUi();
  setHint(currentHint());
  if (el.casesSheet.open) renderCaseBook();
  if (el.drillSheet.open) renderDrill();
  if (el.slotSheet.open) renderSlot();
  if (el.courseSheet.open) renderCourse();
  if (el.paperSheet.open) renderPaper();
  if (el.spotSheet.open) renderSpot();
});

/* ---------- init ---------- */

if (!isSupported()) {
  el.connect.title = t('Web Bluetooth is not available in this browser');
}

// The language, before anything is drawn. Without a choice of your own the
// browser's own setting decides, and English is what it falls back to.
startLang(settings.lang || guessLang());
bindStatic();

buildLedSwatches();
buildColorSlots();
syncSettingsUi();
applyLayout();

setPhase('idle');
renderScramble();
applySettings(); // sets the ring colour, decimals, hint and renders the session
renderCubes();
renderAim();
dare = loadDare();
renderDareStrip();
showDareLink();

// Who is solving, and -- only if you set one up -- an account to keep it in
// step with your other device.
cloud.useKeys(keyFor);
cloud.setConfig({ apiKey: settings.cloudKey || '', projectId: settings.cloudProject || '' });
if (cloud.configured()) {
  cloud.restore();
  if (cloud.who()) syncNow({ quiet: true });
}
renderWhoChip();
renderCrossFace();
renderTastePick();
renderSkins();

// Working the table out takes a few seconds, so it is started quietly the
// moment the page is idle rather than the moment you first want an answer.
if (settings.crossTip) {
  const warm = () => loadCross().catch(() => {});
  if (window.requestIdleCallback) requestIdleCallback(warm, { timeout: 4000 });
  else setTimeout(warm, 1500);
}

// The cabinet is filled in once without a fuss, so a history that already
// earned things does not throw eighteen parties on first open.
celebrateBadges({ quietly: true });
el.tastePick?.addEventListener('change', () => {
  settings.taste = el.tastePick.value;
  storeSettings();
  renderTaste();
  // Sifting needs the table, and building it takes a few seconds -- better
  // started now than in the pause after your next solve.
  if (settings.taste !== 'any') {
    loadCross().catch(() => {});
    toast(t('From the next scramble on.'));
  }
});

el.crossFace.addEventListener('change', () => {
  settings.crossFace = el.crossFace.value;
  storeSettings();
});
newScramble(); // replaces the stand-in with an official one as soon as it is ready

// A link somebody sent lands here. Shown, never kept: it is their afternoon.
showShared();
