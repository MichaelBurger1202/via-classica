const CACHE = 'via-classica-v13.25';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=13.25',
  './app.js?v=13.25',
  './planner.js?v=13.25',
  './english.js?v=13.25',
  './manifest.webmanifest?v=13.25',
  './icon-192.png',
  './icon-512.png',
  './via-classica-schedule-current.json?v=13.25',
  './sw.js?v=13.25'
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
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
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
