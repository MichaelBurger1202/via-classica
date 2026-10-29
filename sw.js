const CACHE = 'via-classica-v15.2-r2-candidate';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=15.2-r1',
  './storage-guard.js?v=15.0-p4',
  './app.js?v=15.2-r2',
  './planner.js?v=15.1-d1',
  './english.js?v=15.2-r2',
  './manifest.webmanifest?v=15.2-r2',
  './icon-192.png',
  './icon-512.png',
  './via-classica-schedule-current.json?v=15.0-p4',
  './calendar.js?v=15.0-p4',
  './design.js?v=15.0-p4',
  './diagnostics.js?v=15.2-draft',
  './english-diagnostic-bank-v1.json?v=15.1-d1',
  './via-classica-events-current.json?v=15.0-p4',
  './sw.js?v=15.2-r2'
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
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Only document navigations can safely fall back to the app shell.
        // Returning index.html for a missing JS/CSS/JSON request disguises
        // an offline error as a successful resource with the wrong content.
        if (request.mode === 'navigate') {
          const shell = await caches.match('./index.html');
          if (shell) return shell;
        }
        return new Response('Ресурс недоступен офлайн.', {status: 503, headers: {'Content-Type':'text/plain; charset=utf-8'}});
      })
  );
});
