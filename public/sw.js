// C30 AWD Swap Tracker service worker.
// Strategy:
//  - App shell works offline after first visit.
//  - Live data (Firestore) always goes to the network, never cached.
//  - VIDA library lives on the home server (vida origin, learned at runtime).
//    The page posts the current Firebase ID token via SET_VIDA_AUTH; every
//    request to the vida origin gets an Authorization header injected here,
//    and successful responses are cached cache-first for offline garage use.
//    EXCEPTION: index.json is mutable (content updates) -> network-first,
//    falling back to cache only when the server is unreachable.
const CACHE = "c30-tracker-v4";

let vidaOrigin = null;
let vidaToken = null;

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SET_VIDA_AUTH") {
    vidaOrigin = e.data.origin || null;
    vidaToken = e.data.token || null;
  }
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
);

function vidaFetch(request) {
  const authed = () => {
    const headers = new Headers(request.headers);
    if (vidaToken) headers.set("Authorization", "Bearer " + vidaToken);
    return fetch(request.url, { method: "GET", headers, credentials: "omit" });
  };
  // Mutable catalog: network-first so content updates show up immediately.
  if (request.url.endsWith("/vida/index.json")) {
    return authed().then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
      }
      return res;
    }).catch(() =>
      caches.match(request).then((hit) => hit || Promise.reject(new TypeError("offline")))
    );
  }
  // Immutable content (docs, images, diagrams, parts lists): cache-first.
  return caches.match(request).then((hit) => {
    if (hit) return hit;
    return authed().then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
      }
      return res;
    });
  });
}

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  // VIDA content origin: auth-injecting cache-first.
  if (vidaOrigin && url.href.startsWith(vidaOrigin)) {
    e.respondWith(vidaFetch(e.request));
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
