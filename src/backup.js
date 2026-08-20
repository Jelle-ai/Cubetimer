// One file that carries everything, and a way to fold it back in.
//
// Moving to a new phone is the case this is for, so it merges rather than
// replaces. Solve on the tablet in the morning and on the phone in the evening,
// carry either file to the other, and both days are there -- which a straight
// overwrite would quietly cost you half of.

const MARK = 'cubetimer';
const VERSION = 1;

/**
 * Settings worth carrying across. What is left out is left out on purpose: the
 * camera crop is drawn against one camera in one room, the cube's colours are
 * learned under one lamp, and permission to use a camera at all belongs to the
 * device that granted it. Handing those to a new phone would be handing it
 * three settings that are wrong.
 */
const PORTABLE = [
  'theme', 'led', 'colors', 'decimals', 'holdMs', 'font',
  'inspection', 'hideTime', 'sound', 'haptics', 'celebrate', 'highlight',
  'preview', 'countUp', 'wakeLock', 'practice', 'goalKind', 'goalMinutes', 'goalSolves'
];

/** @returns {object} everything worth carrying, ready to be written out. */
export function buildBackup(saveFile, settings) {
  const carried = {};
  for (const key of PORTABLE) {
    if (settings[key] !== undefined) carried[key] = settings[key];
  }

  return {
    [MARK]: VERSION,
    saved: new Date().toISOString(),
    sessions: saveFile.sessions.map((session) => ({
      name: session.name,
      puzzle: session.puzzle,
      target: session.target ?? null,
      solves: session.solves.map((solve) => ({ ...solve }))
    })),
    settings: carried
  };
}

/** A name a phone will not argue with, and that sorts by date in a folder. */
export function backupName(when = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return `cubetimer-${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}.json`;
}

const isSolve = (solve) => solve && typeof solve.ms === 'number' && Number.isFinite(solve.ms);

/**
 * Read a file back, and be plain about what is wrong with it rather than
 * throwing something a person cannot act on.
 *
 * @returns {{sessions: object[], settings: object, saved: string|null}}
 * @throws {Error} with a sentence worth showing
 */
export function readBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Dit is geen leesbaar cubetimer-bestand.');
  }

  if (!data || typeof data !== 'object') throw new Error('Dit is geen leesbaar cubetimer-bestand.');
  if (!(MARK in data)) throw new Error('Dit bestand komt niet uit Cubetimer.');
  if (Number(data[MARK]) > VERSION) {
    throw new Error('Dit bestand komt uit een nieuwere versie van de app. Werk deze eerst bij.');
  }

  const sessions = (Array.isArray(data.sessions) ? data.sessions : [])
    .filter((session) => session && Array.isArray(session.solves))
    .map((session, index) => ({
      name: String(session.name || `Sessie ${index + 1}`).slice(0, 40),
      puzzle: typeof session.puzzle === 'string' ? session.puzzle : '333',
      target: Number.isFinite(session.target) ? session.target : null,
      solves: session.solves.filter(isSolve)
    }));

  if (!sessions.length) throw new Error('Er staan geen tijden in dit bestand.');

  return {
    sessions,
    settings: data.settings && typeof data.settings === 'object' ? data.settings : {},
    saved: typeof data.saved === 'string' ? data.saved : null
  };
}

/**
 * What makes two records the same solve. The moment it was finished is the
 * honest answer and is unique to the millisecond; times typed or pasted in
 * carry no moment, so those fall back to what they do have.
 */
const fingerprint = (solve) => (Number.isFinite(solve.at)
  ? `at:${solve.at}`
  : `ms:${solve.ms}|${solve.penalty || 'none'}|${solve.scramble || ''}`);

const sameSession = (a, b) =>
  a.puzzle === b.puzzle && a.name.trim().toLowerCase() === b.name.trim().toLowerCase();

/**
 * Times without a moment attached still have somewhere they belong: right where
 * they were, among the ones that do. So each takes the moment of the last dated
 * solve before it, and a stable sort leaves them in that spot.
 */
function inOrder(solves) {
  let carried = 0;
  const keyed = solves.map((solve, index) => {
    if (Number.isFinite(solve.at)) carried = solve.at;
    return { solve, at: Number.isFinite(solve.at) ? solve.at : carried, index };
  });
  keyed.sort((a, b) => a.at - b.at || a.index - b.index);
  return keyed.map((entry) => entry.solve);
}

/**
 * Fold a file into what this device already has.
 *
 * @param {'merge'|'replace'} how
 * @returns {{sessions: object[], active: number, added: number, known: number, newSessions: number}}
 */
export function foldIn(saveFile, incoming, how = 'merge') {
  if (how === 'replace') {
    return {
      sessions: incoming.sessions.map((session) => ({ ...session, solves: inOrder(session.solves) })),
      active: 0,
      added: incoming.sessions.reduce((sum, session) => sum + session.solves.length, 0),
      known: 0,
      newSessions: incoming.sessions.length
    };
  }

  const sessions = saveFile.sessions.map((session) => ({ ...session, solves: session.solves.slice() }));
  let added = 0;
  let known = 0;
  let newSessions = 0;

  for (const arriving of incoming.sessions) {
    const mine = sessions.find((session) => sameSession(session, arriving));
    if (!mine) {
      sessions.push({ ...arriving, solves: inOrder(arriving.solves) });
      added += arriving.solves.length;
      newSessions++;
      continue;
    }

    const have = new Set(mine.solves.map(fingerprint));
    for (const solve of arriving.solves) {
      const mark = fingerprint(solve);
      if (have.has(mark)) { known++; continue; }
      have.add(mark);
      mine.solves.push({ ...solve });
      added++;
    }
    mine.solves = inOrder(mine.solves);
    if (mine.target === null && arriving.target !== null) mine.target = arriving.target;
  }

  return {
    sessions,
    active: Math.min(saveFile.active, sessions.length - 1),
    added,
    known,
    newSessions
  };
}

/** What a file would bring, without changing anything. */
export function summarise(incoming, saveFile) {
  const trial = foldIn(saveFile, incoming, 'merge');
  const times = incoming.sessions.reduce((sum, session) => sum + session.solves.length, 0);
  return {
    sessions: incoming.sessions.length,
    times,
    added: trial.added,
    known: trial.known,
    newSessions: trial.newSessions,
    saved: incoming.saved
  };
}
