const CACHE_NAME = 'chequeo-app-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'
];

// Instalación de la PWA y almacenamiento de recursos estáticos
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => console.log("Error al precargar assets:", err));
    })
  );
});

// Activación y limpieza de cachés viejas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Manejo inteligente de peticiones de red
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Si la petición es hacia Google Apps Script (para leer o enviar datos)
  if (url.includes('script.google.com')) {
    // Intentamos ir a la red; si falla (offline), dejamos que la app use localStorage sin romper nada
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Para el resto de archivos (HTML, CSS, imágenes locales), buscamos en caché primero, si no hay vamos a la red
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request).catch(() => {
        // Si no hay red ni caché para una página, evitamos pantallas rotas
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
