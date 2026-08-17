// Session persistence in localStorage. A save file holds several named
// sessions; version 1 stored a single flat list and is migrated on read.

const KEY = 'cubetimer.sessions.v2';
const LEGACY_KEY = 'cubetimer.session.v1';

const isSolve = (solve) => typeof solve?.ms === 'number';

function emptyState(solves = []) {
  return { active: 0, sessions: [{ name: 'Sessie 1', solves }] };
}

function clean(state) {
  const sessions = (state.sessions || [])
    .filter((session) => session && Array.isArray(session.solves))
    .map((session, index) => ({
      name: String(session.name || `Sessie ${index + 1}`).slice(0, 40),
      solves: session.solves.filter(isSolve)
    }));

  if (!sessions.length) return emptyState();
  const active = Number.isInteger(state.active) ? Math.min(Math.max(state.active, 0), sessions.length - 1) : 0;
  return { active, sessions };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return clean(JSON.parse(raw));

    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
    return emptyState(Array.isArray(legacy) ? legacy.filter(isSolve) : []);
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
