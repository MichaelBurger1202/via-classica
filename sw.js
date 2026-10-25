const CACHE = 'via-classica-v14.6';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=14.6',
  './app.js?v=14.6',
  './planner.js?v=14.6',
  './planner-inline.js?v=14.6',
  './english.js?v=14.6',
  './manifest.webmanifest?v=14.6',
  './icon-192.png',
  './icon-512.png',
  './via-classica-schedule-current.json?v=14.6',
  './sw.js?v=14.6'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('via-classica-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first keeps GitHub Pages/PWA updates from serving stale JS or HTML.
  event.respondWith(
    fetch(request, {cache: 'no-store'})
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match('./index.html')))
  );
});
