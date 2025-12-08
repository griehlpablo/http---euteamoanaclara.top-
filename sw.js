const CACHE_NAME = 'amor-cache-v1';
const CORE = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/favicon.ico'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return r;
    }).catch(() => resp))
  );
});
