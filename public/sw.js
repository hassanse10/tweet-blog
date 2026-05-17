const STATIC_CACHE  = 'static-v1';
const ARTICLE_CACHE = 'articles-v1';
const STATIC_ASSETS = ['/icon-192.png', '/'];

// ── Install: pre-cache shell assets ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: remove old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== ARTICLE_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: caching strategies ─────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // API routes — always network, never cache
  if (url.pathname.startsWith('/api/')) return;

  // Next.js static chunks — cache-first (immutable content-hashed files)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const fresh = await fetch(request);
        if (fresh.ok) cache.put(request, fresh.clone());
        return fresh;
      })
    );
    return;
  }

  // Article pages — network-first, fall back to cache for offline reading
  if (url.pathname.startsWith('/article/')) {
    event.respondWith(
      caches.open(ARTICLE_CACHE).then(async (cache) => {
        try {
          const fresh = await fetch(request);
          if (fresh.ok) {
            cache.put(request, fresh.clone());
            // Keep article cache under 60 entries
            cache.keys().then((keys) => {
              if (keys.length > 60) cache.delete(keys[0]);
            });
          }
          return fresh;
        } catch {
          const cached = await cache.match(request);
          return cached || new Response('You are offline. Please connect to read this article.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      })
    );
    return;
  }

  // All other pages — network-first with static cache fallback
  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then((cached) => cached || caches.match('/'))
    )
  );
});

// ── Push notifications (existing) ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || '1minAi', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.data || {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/';
  event.waitUntil(clients.openWindow(url));
});
