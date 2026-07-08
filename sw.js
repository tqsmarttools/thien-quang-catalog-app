const CACHE_NAME = "tq-catalog-v23";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=20260708-ga4",
  "./assets.js?v=20260708-ga4",
  "./app.js?v=20260708-ga4",
  "./data.js?v=20260708-ga4",
  "./storage.js?v=20260708-ga4",
  "./catalog-service.js?v=20260708-ga4",
  "./api.js?v=20260708-ga4",
  "./message-template.js?v=20260708-ga4",
  "./analytics.js?v=20260708-ga4",
  "./manifest.webmanifest?v=20260708-ga4",
  "./public/assets/logo-thien-quang.png",
  "./public/assets/icon-app.svg",
  "./public/assets/icon-app-192.png",
  "./public/assets/icon-app-512.png",
  "./public/assets/icon-home.svg",
  "./public/assets/icon-list.svg",
  "./public/assets/icon-chat.svg",
  "./public/assets/icon-phone.svg",
  "./public/assets/icon-filter.svg",
  "./public/assets/icon-close.svg",
  "./public/assets/icon-message.svg",
  "./public/assets/icon-back.svg",
  "./public/assets/icon-plus.svg",
  "./public/assets/icon-check.svg",
  "./public/assets/icon-minus.svg",
  "./public/assets/icon-dots.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || event.request.method !== "GET") return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
