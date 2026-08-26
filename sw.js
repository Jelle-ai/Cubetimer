// Offline shell. Bump CACHE when the files below change.
const CACHE = 'cubetimer-v43';

// The scrambler is vendored, so it has to be cached too or offline use falls
// back to random-move scrambles.
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './src/app.js',
  './src/scramble.js',
  './src/gan-timer.js',
  './src/stats.js',
  './src/store.js',
  './src/backup.js',
  './src/history.js',
  './src/modes.js',
  './src/cases.js',
  './src/play.js',
  './src/badges.js',
  './src/share.js',
  './src/cross.js',
  './src/settings.js',
  './src/feedback.js',
  './src/preview.js',
  './src/vision.js',
  './src/practice.js',
  './vendor/cubing/alg/index.js',
  './vendor/cubing/chunks/big-puzzle-orientation-ZVZQJEF5.js',
  './vendor/cubing/chunks/chunk-7GUL3OBQ.js',
  './vendor/cubing/chunks/chunk-E3YLQC45.js',
  './vendor/cubing/chunks/chunk-FLK6AZKB.js',
  './vendor/cubing/chunks/chunk-FUHYAW74.js',
  './vendor/cubing/chunks/chunk-M7YKTETT.js',
  './vendor/cubing/chunks/chunk-NAPITA3L.js',
  './vendor/cubing/chunks/chunk-O6HEZXGY.js',
  './vendor/cubing/chunks/chunk-RINY3U6G.js',
  './vendor/cubing/chunks/chunk-ROB5TROI.js',
  './vendor/cubing/chunks/chunk-V27EM5TJ.js',
  './vendor/cubing/chunks/chunk-ZU7PSGX4.js',
  './vendor/cubing/chunks/inside-Q56GLXG4.js',
  './vendor/cubing/chunks/puzzles-dynamic-3x3x3-FYXD7SIU.js',
  './vendor/cubing/chunks/puzzles-dynamic-4x4x4-REUXFQJ4.js',
  './vendor/cubing/chunks/puzzles-dynamic-megaminx-2LVHIDL4.js',
  './vendor/cubing/chunks/puzzles-dynamic-side-events-IMYJ533P.js',
  './vendor/cubing/chunks/puzzles-dynamic-unofficial-P3TW433I.js',
  './vendor/cubing/chunks/search-dynamic-sgs-side-events-GB4WAJ7I.js',
  './vendor/cubing/chunks/search-dynamic-sgs-unofficial-2CECFBP3.js',
  './vendor/cubing/chunks/search-dynamic-solve-3x3x3-B2L4IN34.js',
  './vendor/cubing/chunks/search-dynamic-solve-4x4x4-E576AITS.js',
  './vendor/cubing/chunks/search-dynamic-solve-fto-UZMNOI6U.js',
  './vendor/cubing/chunks/search-dynamic-solve-master_tetraminx-GIS7T5B7.js',
  './vendor/cubing/chunks/search-worker-entry.js',
  './vendor/cubing/chunks/twips-YHXBF55O.js',
  './vendor/cubing/chunks/twips_wasm_bg-RWVQBVBA-5YCKA6O5.js',
  './vendor/cubing/puzzle-geometry/index.js',
  './vendor/cubing/puzzles/index.js',
  './vendor/cubing/scramble/index.js',
  './vendor/random-uint-below/index.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

/**
 * How long the network gets before the cache answers instead. Being offline is
 * the easy case -- a request fails at once. The hard case is one bar of signal
 * or a hotel wifi that accepts the connection and then says nothing.
 */
const PATIENCE_MS = 2000;

/** Everything the install step already put in the cache, by full address. */
const CACHED = new Set(SHELL.map((path) => new URL(path, self.registration.scope).href));

/** The network, but not for longer than we are willing to wait. */
function fromNetwork(request) {
  return new Promise((resolve, reject) => {
    const giveUp = setTimeout(() => reject(new Error('traag netwerk')), PATIENCE_MS);
    fetch(request).then(
      (response) => { clearTimeout(giveUp); resolve(response); },
      (error) => { clearTimeout(giveUp); reject(error); }
    );
  });
}

/** Only a real answer is worth keeping: a 404 from a half-finished deploy,
    cached, outlives the deploy that caused it. */
function keep(request, response) {
  if (!response.ok) return response;
  const copy = response.clone();
  caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
  return response;
}

/**
 * The shell is answered from the cache and refreshed behind your back.
 *
 * Waiting on the network for these was costing far more than it looked. The
 * files import each other, so the waits do not overlap: index.html waits, then
 * the script it names waits, then the scripts that one imports wait. Measured
 * against a server that accepts the connection and then says nothing, a two
 * second patience turned into a sixteen second load. Freshness does not have to
 * come from here anyway -- the browser checks the worker itself on every visit,
 * and a new worker fetches the whole shell again on install.
 */
function fromCacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) {
      fetch(request).then((response) => keep(request, response)).catch(() => {});
      return cached;
    }
    return fetch(request).then((response) => keep(request, response));
  });
}

/** Everything else, and the page itself: the network, or the cache if it stalls. */
function fromNetworkFirst(request) {
  return fromNetwork(request)
    .then((response) => keep(request, response))
    .catch(() => caches.match(request).then((cached) => {
      if (cached) return cached;
      // The page can stand in for a page that was never cached. It cannot
      // stand in for a script: handing HTML to a module import turns a missing
      // file into a syntax error, which reads as the app being broken rather
      // than the file being absent.
      if (request.mode === 'navigate') return caches.match('./index.html');
      return new Response('', { status: 504, statusText: 'Niet beschikbaar zonder netwerk' });
    }));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // The page itself stays network first, so a deploy lands on the very next
  // visit rather than the one after it.
  const shell = CACHED.has(request.url) && request.mode !== 'navigate';
  event.respondWith(shell ? fromCacheFirst(request) : fromNetworkFirst(request));
});
