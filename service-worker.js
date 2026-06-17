const CACHE_NAME = 'gestao-central-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './favicon.png',
  './manifest.json',
  './css/style.css',
  './js/config.js',
  './js/firebase.js',
  './js/ui.js',
  './js/api.js',
  './js/charts.js',
  './js/aniversariantes.js',
  './js/exporter.js',
  './js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

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

self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET ou que vão para o Firebase/APIs externas
  if (event.request.method !== 'GET' || 
      event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('identitytoolkit.googleapis.com') ||
      event.request.url.includes('securetoken.googleapis.com')) {
    return;
  }

  // Stale-while-revalidate strategy for PWA
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (event.request.method === 'GET' && networkResponse.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);
        
        return cachedResponse || fetchPromise;
      })
  );
});
