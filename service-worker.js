const CACHE_NAME = "neon-tic-tac-toe-cache-v4"; // Updated cache version
const FILES_TO_CACHE = [
  '/',
  'index.html',
  'sounds/bg-music.mp3',
  'sounds/click.mp3',
  'sounds/win.mp3', // Added the new win sound
  // Add paths to your icons if you have them, e.g.:
  // 'icons/icon-512x512.png',
  // 'icons/icon-192x192.png'
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache and caching files");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

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
