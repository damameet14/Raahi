/**
 * Minimal service worker for the Raahi employee PWA.
 *
 * Caches the application shell for offline launch. API requests (/api) and
 * Google Maps requests always go to the network so ride data and maps stay
 * live. This is intentionally simple; richer caching can be layered later.
 */

const APPLICATION_SHELL_CACHE = 'raahi-employee-shell-v2';
const APPLICATION_SHELL_URLS = [
  '/app/',
  '/app/index.html',
  '/app/manifest.webmanifest',
  '/app/assets/raahi-logo.png?v=2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APPLICATION_SHELL_CACHE)
      .then((cache) => cache.addAll(APPLICATION_SHELL_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheKeys) =>
        Promise.all(
          cacheKeys
            .filter((cacheKey) => cacheKey !== APPLICATION_SHELL_CACHE)
            .map((cacheKey) => caches.delete(cacheKey)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Never cache API or cross-origin (maps) requests.
  const isApiRequest = requestUrl.pathname.startsWith('/api');
  const isCrossOrigin = requestUrl.origin !== self.location.origin;
  if (event.request.method !== 'GET' || isApiRequest || isCrossOrigin) {
    return;
  }

  // Navigation requests fall back to the cached shell when offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/app/index.html')),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => cachedResponse || fetch(event.request)),
  );
});
