const CACHE_NAME = '657-pwa-v1';
const CORE_URLS = ['/', '/gys/', '/on-parmak/', '/on-parmak/dersler/', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME && !k.startsWith('webllm/')).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/_657-servis/') || url.pathname.startsWith('/api/') || url.pathname.startsWith('/modeller/')) {
    return;
  }
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && (req.mode === 'navigate' || url.pathname.startsWith('/_astro/'))) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('/')))
  );
});
