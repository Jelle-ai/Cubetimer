// Session persistence in localStorage.

const KEY = 'cubetimer.session.v1';

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s?.ms === 'number') : [];
  } catch {
    return [];
  }
}

export function save(solves) {
  try {
    localStorage.setItem(KEY, JSON.stringify(solves));
  } catch {
    // Storage can be full or blocked (private mode); the session still works.
  }
}
