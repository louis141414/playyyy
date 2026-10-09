const CACHE_NAME = 'playyyy-shell-v20';
const GAME_CACHE_NAME = 'playyyy-games-v1';
const APP_SHELL_URL = new URL('./index.html', self.registration.scope).href;
const GAME_PAGE_URL = new URL('./game/index.html', self.registration.scope).href;
const GAME_PAGE_PATHS = new Set([
  new URL('./game/', self.registration.scope).pathname,
  new URL('./game', self.registration.scope).pathname,
  new URL('./game/index.html', self.registration.scope).pathname
]);
const OFFLINE_GAME_FILES = [
  './games/pacmanflash/index.html',
  './games/pacmanflash/pac-man.swf',
  './games/ruffle/player.css',
  './games/ruffle/player.js',
  './games/ruffle/ruffle.js',
  './games/ruffle/core.ruffle.c80159b526e567babaf5.js',
  './games/ruffle/core.ruffle.f000070ea72f8ae4fe3a.js',
  './games/ruffle/72a20ef1c0b8ceb37720.wasm',
  './games/ruffle/826bb0938097485a2c9d.wasm'
];
const OFFLINE_GAME_PATHS = new Set(
  OFFLINE_GAME_FILES.map(path => new URL(path, self.registration.scope).pathname)
);
const PRELOAD_GAME_PATHS = new Set([
  './games/minecraft 12.2/index.html',
  './games/minecraft 26.2/index.html'
].map(path => new URL(path, self.registration.scope).pathname));
const APP_SHELL_FILES = [
  './',
  './index.html',
  './game/index.html',
  './404.html',
  './assets/css/style.css',
  './assets/js/script.js',
  './assets/js/theme.js',
  './assets/js/utm.js',
  './verify/verify.js',
  './games.json',
  './manifest.json',
  './favicon.svg',
  './assets/images/app-icon-192.png',
  './assets/images/app-icon-512.png',
  './assets/images/social-image.png',
  './assets/images/thumbnails/placeholder.jpg',
  ...OFFLINE_GAME_FILES
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
  if (requestUrl.pathname.startsWith(gamesPath)) {
    if (PRELOAD_GAME_PATHS.has(requestUrl.pathname)) {
      event.respondWith(
        caches.open(GAME_CACHE_NAME)
          .then(cache => cache.match(request))
          .then(cachedResponse => cachedResponse || fetch(request))
      );
      return;
    }

    if (OFFLINE_GAME_PATHS.has(requestUrl.pathname)) {
      event.respondWith(
        caches.open(CACHE_NAME)
          .then(cache => cache.match(request))
          .then(cachedResponse => cachedResponse || fetch(request))
      );
      return;
    }

    if (requestUrl.pathname.toLowerCase().endsWith('.swf')) {
      event.respondWith(
        caches.open(CACHE_NAME).then(async cache => {
          const cachedResponse = await cache.match(request);
          if (cachedResponse) return cachedResponse;

          const response = await fetch(request);
          if (response.ok) {
            await cache.put(request, response.clone()).catch(error => {
              console.error('Could not cache a played Flash game for offline use:', error);
            });
          }
          return response;
        })
      );
    }
    return;
  }

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
        const cachedPage = await cache.match(request, { ignoreSearch: true });
        if (cachedPage) return cachedPage;
        if (GAME_PAGE_PATHS.has(requestUrl.pathname)) {
          const gamePage = await cache.match(GAME_PAGE_URL);
          if (gamePage) return gamePage;
        }
        return cache.match(APP_SHELL_URL);
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
