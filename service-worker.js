const CACHE_NAME = "neon-tic-tac-toe-cache-v1";
const FILES_TO_CACHE = [
  '/',
  'index.html',
  'style.css',
  'script.js',
  'icon-512x512.png'
];

self.addEventListener("install", (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      return response || fetch(event.request);
    })
  );
});