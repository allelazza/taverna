/* Taverna: service worker per usare l'app anche senza rete.
   - L'app (index.html, icone, manifest) e i caratteri vengono serviti dalla cache e aggiornati
     in sottofondo: alla prossima apertura vedi la versione nuova.
   - Le chiamate al foglio del gruppo (script.google.com) passano sempre dalla rete.
   Quando pubblichi una versione nuova dell'app puoi cambiare CACHE (es. 'taverna-v2')
   per forzare l'aggiornamento su tutti i telefoni. */
const CACHE = 'taverna-v3';
const BASE = ['./', './index.html', './manifest.webmanifest', './icona-192.png', './icona-512.png', './icona-maschera-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(chiavi => Promise.all(chiavi.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('script.google.com') || url.hostname.endsWith('googleusercontent.com')) return;
  const carattere = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!carattere && url.origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const inCache = await c.match(req, { ignoreSearch: url.origin === self.location.origin });
    const rete = fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone());
      return r;
    }).catch(() => inCache || Response.error());
    return inCache || rete;
  }));
});
