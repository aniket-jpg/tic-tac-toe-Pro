const CACHE_NAME = "neon-tic-tac-toe-cache-v1";
const FILES_TO_CACHE = [
  '/',
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap',
  'icons/icon-512x512.png',
  'icons/icon-192x192.png'
];

// On install, cache the core application files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache and caching files");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// On fetch, serve from cache first, then network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // If the request is in the cache, return it
      if (response) {
        return response;
      }
      // Otherwise, fetch from the network
      return fetch(event.request);
    })
  );
});

// On activate, clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: clearing old cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});
