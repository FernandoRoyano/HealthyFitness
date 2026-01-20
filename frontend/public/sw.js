const CACHE_NAME = 'healthyfitness-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Error al cachear:', error);
      })
  );
  // Activar inmediatamente
  self.skipWaiting();
});

// Activación - limpiar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Tomar control inmediatamente
  self.clients.claim();
});

// Estrategia Network First con fallback a cache
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones a la API (siempre online)
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, guardarla en cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, buscar en cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Si no está en cache y es navegación, mostrar página offline
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});
