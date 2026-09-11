// AgroShield AI - Service Worker for Offline Resilience in Rural Connectivity
const CACHE_NAME = 'agroshield-v14';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => {
        return new Response(JSON.stringify({ 
          status: 'offline', 
          message: 'Currently offline. Using local storage.' 
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Network-First strategy
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
