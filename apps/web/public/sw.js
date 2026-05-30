/**
 * Attendify Service Worker
 *
 * Strategy:
 *   - Static assets (JS/CSS/fonts/images): Cache-First (serve from cache, update in background)
 *   - API calls (/api/*): Network-First with localStorage cache fallback for GET requests
 *   - Navigation requests: Network-First with offline fallback to /offline page
 *
 * This SW is registered by sw-register.js loaded in the root layout.
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `attendify-static-${CACHE_VERSION}`;
const API_CACHE = `attendify-api-${CACHE_VERSION}`;

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/attendance',
  '/classes',
  '/students',
  '/offline',
];

// ─── Install: Pre-cache static shell ─────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ─── Activate: Clean old caches ───────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch: Route strategy ────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and browser-extension requests
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // API requests → Network-First with cache fallback
  if (url.pathname.startsWith('/api/') || url.hostname !== self.location.hostname) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
    return;
  }

  // Static assets (JS/CSS/images/fonts) → Cache-First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigation/HTML → Network-First with offline fallback
  event.respondWith(networkFirstWithOfflineFallback(request));
});

// ─── Strategies ───────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request, { signal: AbortSignal.timeout(8000) });
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ success: false, error: 'Offline — cached data unavailable' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    return await fetch(request, { signal: AbortSignal.timeout(8000) });
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Return cached offline page if available
    const offlinePage = await caches.match('/offline');
    if (offlinePage) return offlinePage;
    return new Response('<h1>You are offline</h1>', {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/fonts/') ||
    /\.(js|css|png|jpg|jpeg|svg|ico|woff2?|ttf)$/.test(pathname)
  );
}
