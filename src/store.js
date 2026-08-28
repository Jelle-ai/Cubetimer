import { t } from './lang.js';
// Session persistence in localStorage. A save file holds several named
// sessions; version 1 stored a single flat list and is migrated on read.

import { keyFor } from './who.js';

/** Exported so a page can tell its own writes from another tab's. */
const BASE = 'cubetimer.sessions.v2';
export const KEY = keyFor(BASE);
const LEGACY_KEY = 'cubetimer.session.v1';

/** The bare key, for wiping a profile's storage when it is removed. */
export const SAVE_BASE = BASE;

import { cleanPlay, emptyPlay } from './play.js';

const isSolve = (solve) => typeof solve?.ms === 'number';

// Imported times used to carry a note saying where they came from; it added
// nothing, so it is dropped on read.
const IMPORT_NOTES = new Set([t('from the timer'), t('from the timer memory')]);

function tidy(solve) {
  if (IMPORT_NOTES.has(solve.note)) {
    const { note, ...rest } = solve;
    return rest;
  }
  return solve;
}

function emptyState(solves = []) {
  return {
    active: 0,
    sessions: [{ name: '3x3', puzzle: '333', solves, target: null }],
    play: emptyPlay()
  };
}

/**
 * A session's own goal time, in milliseconds, or null for none. It lives on the
 * session rather than in the settings because what counts as a good 4x4 solve
 * has nothing to do with what counts as a good 2x2 one.
 */
function cleanTarget(value) {
  const ms = Math.round(Number(value));
  return Number.isFinite(ms) && ms > 0 ? Math.min(Math.max(ms, 1000), 600000) : null;
}

function clean(state) {
  const sessions = (state.sessions || [])
    .filter((session) => session && Array.isArray(session.solves))
    .map((session, index) => ({
      name: String(session.name || `Sessie ${index + 1}`).slice(0, 40),
      puzzle: typeof session.puzzle === 'string' ? session.puzzle : '333',
      target: cleanTarget(session.target),
      solves: session.solves.filter(isSolve).map(tidy)
    }));

  if (!sessions.length) return { ...emptyState(), play: cleanPlay(state.play) };
  const active = Number.isInteger(state.active) ? Math.min(Math.max(state.active, 0), sessions.length - 1) : 0;
  // What the games remember lives beside the sessions rather than inside one:
  // a marathon streak is not a solve you did on a Tuesday.
  return { active, sessions, play: cleanPlay(state.play) };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return clean(JSON.parse(raw));

    // Version 1's flat list belongs to whoever was using the app before there
    // were profiles, which is the first one. A second profile starts empty.
    const legacy = KEY === BASE ? JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null') : null;
    return emptyState(Array.isArray(legacy) ? legacy.filter(isSolve).map(tidy) : []);
  } catch {
    return emptyState();
  }
}

/**
 * @returns {boolean} false when storage is unavailable (private mode, full disk,
 * blocked cookies) so the caller can tell the user instead of losing times quietly.
 */
export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
