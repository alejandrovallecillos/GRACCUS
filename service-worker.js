const CACHE = 'graccus-v32';
const ASSETS = ['./','./index.html','./manifest.json','./icon-180.png','./icon-192.png','./icon-512.png','./g-mark.png'];
self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE)
    .then(c => Promise.all(ASSETS.map(url => c.add(url).catch(() => {})))) // un archivo que falte no debe tirar abajo todo el service worker
    .then(() => self.skipWaiting())
));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url = new URL(event.request.url);
  const esPropio = url.origin === self.location.origin;
  // index.html y manifest.json: red primero (para coger versiones nuevas al
  // instante), con la caché como respaldo si no hay conexión. El resto de
  // archivos (iconos...) siguen sirviéndose de caché primero, más rápido y
  // no cambian entre versiones.
  const esArchivoQueCambia = esPropio && (url.pathname.endsWith('/') || url.pathname.endsWith('index.html') || url.pathname.endsWith('manifest.json'));
  if(esArchivoQueCambia){
    event.respondWith(
      fetch(event.request).then(response => {
        if(response && response.ok){
          const copy = response.clone();
          caches.open(CACHE).then(c => c.put(event.request, copy));
        }
        return response;
      }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response&&response.ok&&esPropio){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return response;}).catch(()=>caches.match('./index.html'))));
});
