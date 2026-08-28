// An account, for when one device is not enough.
//
// The app has no server and is not getting one. What it can do is talk to a
// Firebase project that *you* own, over the plain REST endpoints -- no SDK, no
// script from a CDN, nothing that breaks the day the page is opened offline.
// About two hundred lines, and the app carries on working exactly as before
// when you are not signed in.
//
// What is stored there is one document per account, holding the same backup
// file the app already writes for "to another device". So syncing reuses the
// merge that already exists and is already tested: pull the other side, fold it
// in the way two devices are folded together, push the result back. Nothing is
// overwritten, because that machinery never overwrites.
//
// The API key is not a secret. It identifies the project, and Google says so;
// what keeps your times yours are the security rules on the project, which the
// README spells out. If those rules are wrong, no amount of hiding the key
// would have helped.

const AUTH = 'https://identitytoolkit.googleapis.com/v1/accounts';
const REFRESH = 'https://securetoken.googleapis.com/v1/token';
const STORE = 'https://firestore.googleapis.com/v1/projects';

/** Where the signed-in state lives, per profile. */
let keyFor = (base) => base;
let SESSION = 'cubetimer.cloud.v1';

export function useKeys(fn) {
  keyFor = fn;
  SESSION = keyFor('cubetimer.cloud.v1');
}

let config = { apiKey: '', projectId: '' };
let session = null;   // { idToken, refreshToken, uid, email, until }

export function setConfig(next) {
  config = {
    apiKey: String(next?.apiKey || '').trim(),
    projectId: String(next?.projectId || '').trim()
  };
}

export const configured = () => Boolean(config.apiKey && config.projectId);
export const who = () => (session ? { email: session.email, uid: session.uid } : null);

/* ---------- the signed-in state, kept between visits ---------- */

export function restore() {
  try {
    const raw = JSON.parse(localStorage.getItem(SESSION) || 'null');
    if (raw && raw.refreshToken && raw.uid) session = raw;
  } catch {
    session = null;
  }
  return who();
}

function remember() {
  try {
    if (session) localStorage.setItem(SESSION, JSON.stringify(session));
    else localStorage.removeItem(SESSION);
  } catch { /* private mode: you stay signed in until you reload */ }
}

/** What a Firebase error means in words, rather than in capitals. */
const SAYS = {
  EMAIL_EXISTS: 'There is already an account with that address.',
  EMAIL_NOT_FOUND: 'No account with that address.',
  INVALID_PASSWORD: 'That password does not match.',
  INVALID_LOGIN_CREDENTIALS: 'That address and password do not match.',
  WEAK_PASSWORD: 'That password is too short — six characters at least.',
  INVALID_EMAIL: 'That does not look like an email address.',
  TOO_MANY_ATTEMPTS_TRY_LATER: 'Too many attempts. Wait a while and try again.',
  USER_DISABLED: 'That account has been disabled.'
};

function explain(error) {
  const code = String(error || '').split(' ')[0];
  return SAYS[code] || `Firebase said: ${error}`;
}

async function ask(url, body) {
  let answer;
  try {
    answer = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch {
    throw new Error('No connection.');
  }
  const said = await answer.json().catch(() => ({}));
  if (!answer.ok) throw new Error(explain(said?.error?.message || answer.status));
  return said;
}

function keep(said, email) {
  session = {
    idToken: said.idToken,
    refreshToken: said.refreshToken,
    uid: said.localId || session?.uid,
    email: said.email || email || session?.email,
    until: Date.now() + (Number(said.expiresIn || 3600) - 60) * 1000
  };
  remember();
  return who();
}

export async function signUp(email, password) {
  const said = await ask(`${AUTH}:signUp?key=${config.apiKey}`, { email, password, returnSecureToken: true });
  return keep(said, email);
}

export async function signIn(email, password) {
  const said = await ask(`${AUTH}:signInWithPassword?key=${config.apiKey}`, { email, password, returnSecureToken: true });
  return keep(said, email);
}

export function signOut() {
  session = null;
  remember();
}

/** A token that has not expired, refreshing it if it has. */
async function token() {
  if (!session) throw new Error('Not signed in.');
  if (session.idToken && Date.now() < session.until) return session.idToken;

  let answer;
  try {
    answer = await fetch(`${REFRESH}?key=${config.apiKey}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(session.refreshToken)}`
    });
  } catch {
    throw new Error('No connection.');
  }
  const said = await answer.json().catch(() => ({}));
  if (!answer.ok) {
    // A refresh token that no longer works means the account signed out
    // somewhere else, or was deleted. Say so rather than retrying forever.
    signOut();
    throw new Error('Signed out — sign in again.');
  }
  session = {
    ...session,
    idToken: said.id_token,
    refreshToken: said.refresh_token || session.refreshToken,
    uid: said.user_id || session.uid,
    until: Date.now() + (Number(said.expires_in || 3600) - 60) * 1000
  };
  remember();
  return session.idToken;
}

const docUrl = () =>
  `${STORE}/${config.projectId}/databases/(default)/documents/cubetimer/${session.uid}`;

/**
 * What is up there, or null when nothing has been put there yet.
 * @returns {Promise<{backup: string, at: number} | null>}
 */
export async function pull() {
  const id = await token();
  let answer;
  try {
    answer = await fetch(docUrl(), { headers: { authorization: `Bearer ${id}` } });
  } catch {
    throw new Error('No connection.');
  }
  if (answer.status === 404) return null;
  const said = await answer.json().catch(() => ({}));
  if (!answer.ok) throw new Error(explain(said?.error?.message || answer.status));
  const fields = said.fields || {};
  const backup = fields.backup?.stringValue;
  if (!backup) return null;
  return { backup, at: Number(fields.at?.integerValue || 0) };
}

/** A document big enough to worry about. Firestore refuses at a megabyte. */
export const TOO_BIG = 900 * 1024;

export async function push(backup) {
  if (backup.length > TOO_BIG) {
    throw new Error('Your times are too big for one document. Use the file instead.');
  }
  const id = await token();
  let answer;
  try {
    answer = await fetch(docUrl(), {
      method: 'PATCH',
      headers: { authorization: `Bearer ${id}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        fields: {
          backup: { stringValue: backup },
          at: { integerValue: String(Date.now()) }
        }
      })
    });
  } catch {
    throw new Error('No connection.');
  }
  if (!answer.ok) {
    const said = await answer.json().catch(() => ({}));
    throw new Error(explain(said?.error?.message || answer.status));
  }
  return true;
}
