const CACHE_NAME = "hana-bank-tablet-v4";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 개별적으로 캐시하여 실패한 리소스가 전체를 망가뜨리지 않도록 함
      const urlsToCache = [
        "/",
        "/tablet",
        "/customer",
        "/manifest.json",
        "/manifest-tablet.json",
        "/icons/icon-192x192.png",
        "/icons/icon-512x512.png",
      ];

      return Promise.allSettled(
        urlsToCache.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`Failed to cache ${url}:`, err);
            return null;
          })
        )
      );
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  if (
    url.includes("/api/") ||
    url.includes("/api/ws") ||
    url.includes("/ws") ||
    url.includes("/stomp") ||
    url.includes("/sockjs")
  ) {
    return;
  }

  // Bypass service worker files
  if (url.includes("sw.js") || url.includes("manifest")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // For all other requests, use cache-first strategy
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request)
        .then((response) => {
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          if (event.request.destination === "document") {
            return caches.match("/tablet");
          }
          return new Response("Network error", { status: 503 });
        });
    })
  );
});
