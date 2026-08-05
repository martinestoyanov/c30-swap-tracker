// C30 AWD Swap Tracker service worker.
// Strategy: app shell works offline after first visit; live data (Firestore)
// always goes to the network and is never cached here. VIDA library files on
// Firebase Storage use immutable token URLs, so they are cached cache-first
// for offline reading on Android/iOS.
const CACHE = "c30-tracker-v2";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  // VIDA docs/images/diagrams on Firebase Storage: cache-first.
  if (url.origin === "https://firebasestorage.googleapis.com") {
    e.respondWith(
      caches.match(e.request).then(
        (hit) =>
          hit ||
          fetch(e.request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(e.request, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  if (url.origin !== self.location.origin) return; // Firebase/API calls: network only

  // Navigations: network-first, fall back to cached shell when offline.
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./", copy));
          return res;
        })
        .catch(() => caches.match("./").then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  // Static assets (hashed JS/CSS/icons): cache-first, then network + cache.
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
    )
  );
});
