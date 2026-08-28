// Who is using the app.
//
// One laptop, more than one person: a brother who solves on the same machine
// should not be in your averages, and you should not be in his. So everything
// the app stores -- sessions, times, cases, the course, the settings -- hangs
// off a profile, and switching profile switches all of it at once.
//
// How: the storage key gets the profile's id after it. The first profile keeps
// the bare key, so somebody who has been using the app for a year and never
// heard of profiles keeps every time exactly where it was.
//
// Switching reloads the page. That looks lazy and is the opposite: every piece
// of state in the app is read once at boot, and reading it all again is the
// only way to be sure nothing from the last profile is left in a variable
// somewhere. A wrong average is worse than a flicker.

const LIST = 'cubetimer.people.v1';

/** The one everybody starts as, whose key has no suffix. */
const FIRST = 'me';

const MAX = 8;

const clean = (name) => String(name || '').trim().slice(0, 24);

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(LIST) || 'null');
    if (!raw || !Array.isArray(raw.people)) throw new Error('none');
    const people = raw.people
      .filter((one) => one && typeof one.id === 'string' && clean(one.name))
      .slice(0, MAX)
      .map((one) => ({ id: one.id.slice(0, 24), name: clean(one.name), colour: colourOf(one.colour) }));
    if (!people.length) throw new Error('empty');
    const at = people.some((one) => one.id === raw.at) ? raw.at : people[0].id;
    return { people, at };
  } catch {
    return { people: [{ id: FIRST, name: 'Me', colour: 0 }], at: FIRST };
  }
}

const colourOf = (value) => (Number.isInteger(value) && value >= 0 && value < 6 ? value : 0);

let state = read();

function write() {
  try {
    localStorage.setItem(LIST, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export const people = () => state.people.slice();
export const current = () => state.people.find((one) => one.id === state.at) || state.people[0];

/** More than one person on this device, which is when the switcher appears. */
export const shared = () => state.people.length > 1;

/**
 * What to hang a storage key off. The first profile gets nothing after it, so
 * everything that was already saved stays exactly where it was.
 */
export function keyFor(base) {
  const who = current();
  return who.id === FIRST ? base : `${base}:${who.id}`;
}

/** A name turned into an id nothing else is using. */
function idFor(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'one';
  let id = base;
  let n = 2;
  while (state.people.some((one) => one.id === id) || id === FIRST) id = `${base}-${n++}`;
  return id;
}

export function addPerson(name) {
  const tidy = clean(name);
  if (!tidy || state.people.length >= MAX) return null;
  const made = { id: idFor(tidy), name: tidy, colour: state.people.length % 6 };
  state.people.push(made);
  write();
  return made;
}

export function renamePerson(id, name) {
  const one = state.people.find((who) => who.id === id);
  const tidy = clean(name);
  if (!one || !tidy) return false;
  one.name = tidy;
  return write();
}

export function recolourPerson(id, colour) {
  const one = state.people.find((who) => who.id === id);
  if (!one) return false;
  one.colour = colourOf(colour);
  return write();
}

/**
 * Remove a profile, and everything it stored.
 * The first one cannot go: it is where the app's own storage lives.
 */
export function dropPerson(id, keys = []) {
  if (id === FIRST) return false;
  state.people = state.people.filter((one) => one.id !== id);
  if (state.at === id) state.at = state.people[0].id;
  for (const base of keys) {
    try {
      localStorage.removeItem(`${base}:${id}`);
    } catch { /* nothing to do about it */ }
  }
  return write();
}

/** Switch, and start the app again from scratch. */
export function usePerson(id) {
  if (!state.people.some((one) => one.id === id) || id === state.at) return false;
  state.at = id;
  write();
  location.reload();
  return true;
}
