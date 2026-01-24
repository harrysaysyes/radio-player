const CACHE_NAME = 'radio-player-v3.5';
const urlsToCache = [
  './',
  './radio-player.html',
  './styles.css',
  './simplex-noise.js',
  './wave-grid.js',
  './app.js',
  './manifest.json',
  './assets/logos/classicfm.svg',
  './assets/logos/reprezent.jpg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  // Don't cache audio streams
  if (event.request.url.includes('.mp3') ||
      event.request.url.includes('radio.canstream') ||
      event.request.url.includes('musicradio.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
