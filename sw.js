// Service Worker de AriJuan2026
// Cache offline para el shell del sitio + estrategia stale-while-revalidate.

const VERSION = 'v1';
const CACHE_NAME = `arijuan-${VERSION}`;

// Recursos que se descargan en la instalación (shell mínimo del sitio).
const PRECACHE = [
  '/',
  '/boda/',
  '/boda/cronograma/',
  '/boda/regalos/',
  '/boda/galeria/',
  '/boda/preguntas/',
  '/rsvp/',
  '/assets/css/styles.css',
  '/assets/js/data.js',
  '/assets/js/nav.js',
  '/assets/js/invitacion.js',
  '/assets/js/rsvp.js',
  '/assets/js/sw-register.js',
  '/assets/img/decoracion/floral-superior.webp',
  '/assets/img/decoracion/floral-inferior.webp',
  '/assets/img/decoracion/separador-floral.png',
  '/icons/logo.png',
  '/icons/apple-touch-icon.png',
  '/icons/android-chrome-192x192.png',
  '/icons/android-chrome-512x512.png',
  '/icons/favicon-32x32.png',
  '/favicon.ico',
  '/site.webmanifest',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE).catch(err => console.warn('[SW] precache parcial:', err)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // No interceptar requests cross-origin (backend Apps Script, Google Fonts, etc).
  if (url.origin !== self.location.origin) return;

  // Solo GET. POST nunca se cachea.
  if (req.method !== 'GET') return;

  // Estrategia: stale-while-revalidate.
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(req).then(cached => {
        const fetchPromise = fetch(req)
          .then(response => {
            if (response && response.ok) {
              cache.put(req, response.clone());
            }
            return response;
          })
          .catch(() => cached || caches.match('/boda/'));
        return cached || fetchPromise;
      })
    )
  );
});
