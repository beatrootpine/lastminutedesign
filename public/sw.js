const CACHE_NAME = 'lmd-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  if (e.request.method !== 'GET') return;
  if (!url.startsWith('http')) return;
  if (url.includes('/api/')) return;

  e.respondWith(
    fetch(e.request).then((res) => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, clone)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
