// Offline shell. Bump CACHE when the files below change.
const CACHE = 'cubetimer-v25';

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

// Network first so a deploy lands immediately, falling back to the cache offline.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')))
  );
});
