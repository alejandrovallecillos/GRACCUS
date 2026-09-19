// GRACCUS — Service Worker "siempre la última versión"
//
// Estrategia: red primero, caché solo como red de seguridad si no hay
// conexión. Así, cada vez que subas un cambio a GitHub, la próxima vez que
// abras la app (con conexión) verás la versión nueva automáticamente, sin
// tener que borrar cookies ni datos del navegador.
//
// Cada vez que subas esta misma versión del service worker sin cambios no
// pasa nada; pero si alguna vez quieres forzar que TODOS los móviles
// descarten su caché antigua de golpe, basta con cambiar el número de
// CACHE_NAME (por ejemplo de 'graccus-v1' a 'graccus-v2') y subir el archivo:
// el 'activate' de abajo borrará automáticamente cualquier caché con nombre
// distinto al actual.
const CACHE_NAME = 'graccus-v1';

// skipWaiting: en cuanto se instala esta versión nueva del service worker,
// no espera a que cierres todas las pestañas/pestaña de la PWA para tomar
// el control — se activa ya.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// activate: se queda solo con la caché actual (CACHE_NAME) y elimina
// cualquier caché de versiones anteriores del service worker.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// fetch: red primero. Si la petición tiene éxito, se sirve esa respuesta
// fresca y de paso se actualiza la copia en caché (para tener algo que
// ofrecer si luego te quedas sin conexión). Si la red falla (sin cobertura,
// modo avión, etc.), se recurre a la última copia guardada.
self.addEventListener('fetch', (event) => {
  // Solo interceptamos peticiones GET normales (evita líos con POST, etc.)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copia = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
