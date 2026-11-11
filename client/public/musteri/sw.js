const SCOPE = "/musteri/";
const CACHE_PREFIX = "hizligel-musteri-shell-";
const CACHE_NAME = CACHE_PREFIX + "v3";
const SHELL = [
  SCOPE,
  SCOPE + "index.html",
  SCOPE + "offline.html",
  SCOPE + "manifest.webmanifest",
  "/pwa/icons/musteri-180.png",
  "/pwa/icons/musteri-192.png",
  "/pwa/icons/musteri-512.png",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL).catch(() => undefined)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(SCOPE + "index.html", copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(SCOPE + "index.html")
            .then(cached => cached || caches.match(SCOPE + "offline.html")),
        ),
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok && (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/pwa/") || url.pathname.startsWith(SCOPE))) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      });
    }),
  );
});
