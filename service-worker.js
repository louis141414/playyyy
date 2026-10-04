const CACHE_NAME = 'playyyy-shell-v9';
const APP_SHELL_URL = new URL('./index.html', self.registration.scope).href;
const APP_SHELL_FILES = [
  './',
  './index.html',
  './play.html',
  './assets/css/style.css',
  './assets/js/script.js',
  './assets/js/utm.js',
  './verify/verify.js',
  './games.json',
  './manifest.json',
  './assets/images/app-icon-192.png',
  './assets/images/app-icon-512.png',
  './assets/images/favicon.ico',
  './assets/images/ico.ico',
  './assets/images/thumbnails/placeholder.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith('playyyy-shell-') && cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const requestUrl = new URL(request.url);
  if (request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;

  const gamesPath = new URL('./games/', self.registration.scope).pathname;
  if (requestUrl.pathname.startsWith(gamesPath)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        if (!response.ok) return response;
        return caches.open(CACHE_NAME)
          .then(cache => cache.put(request, response.clone()))
          .then(() => response)
          .catch(error => {
            console.error('Could not cache a visited page:', error);
            return response;
          });
      }).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return await cache.match(request, { ignoreSearch: true }) || cache.match(APP_SHELL_URL);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (!cachedResponse) return fetch(request);

      return fetch(request).then(response => {
        if (!response.ok) return response;
        return caches.open(CACHE_NAME)
          .then(cache => cache.put(request, response.clone()))
          .then(() => response)
          .catch(error => {
            console.error('Could not refresh a cached app file:', error);
            return response;
          });
      }).catch(() => cachedResponse);
    })
  );
});
