// ============================================
// Monarca Semijoias — Service Worker (PWA Cache)
// ============================================
// NOTA: O OneSignal usa seu próprio SW em /OneSignalSDKWorker.js

// Cache-first para assets estáticos, network-first para API


const CACHE_NAME = "monarca-v2";
const STATIC_ASSETS = ["/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== "GET") return;

    // Network-first for API/server actions
    if (url.pathname.startsWith("/api") || request.headers.get("next-action")) {
        event.respondWith(
            fetch(request).catch(() => caches.match(request))
        );
        return;
    }

    // Cache-first for static assets
    if (
        url.pathname.startsWith("/_next/static") ||
        url.pathname.startsWith("/icons")
    ) {
        event.respondWith(
            caches.match(request).then(
                (cached) =>
                    cached ||
                    fetch(request).then((response) => {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                        return response;
                    })
            )
        );
        return;
    }
});


