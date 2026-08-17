// Session persistence in localStorage.

const KEY = 'cubetimer.session.v1';

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s?.ms === 'number') : [];
  } catch {
    return []; // storage blocked or corrupted; start with an empty session
  }
}

/**
 * Writes the session to disk.
 * @returns {boolean} false when storage is unavailable (private mode, full disk,
 * blocked cookies) so the caller can tell the user instead of losing times quietly.
 */
export function save(solves) {
  try {
    localStorage.setItem(KEY, JSON.stringify(solves));
    return true;
  } catch {
    return false;
  }
}
