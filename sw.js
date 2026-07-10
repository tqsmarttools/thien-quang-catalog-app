const CACHE_NAME = "tq-catalog-v25";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=20260710-bay-xay-v2",
  "./assets.js?v=20260710-bay-xay-v2",
  "./app.js?v=20260710-bay-xay-v2",
  "./data.js?v=20260710-bay-xay-v2",
  "./storage.js?v=20260710-bay-xay-v2",
  "./catalog-service.js?v=20260710-bay-xay-v2",
  "./api.js?v=20260710-bay-xay-v2",
  "./message-template.js?v=20260710-bay-xay-v2",
  "./analytics.js?v=20260710-bay-xay-v2",
  "./manifest.webmanifest?v=20260710-bay-xay-v2",
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
  "./public/assets/icon-dots.svg",
  "./public/assets/products/bay-x01.jpg",
  "./public/assets/products/bay-x02.jpg",
  "./public/assets/products/bay-x03-clean.png",
  "./public/assets/products/bay-x04.jpg",
  "./public/assets/products/bay-x05.jpg",
  "./public/assets/products/bay-x06.jpg",
  "./public/assets/products/bay-x07.jpg",
  "./public/assets/products/bay-x08.jpg",
  "./public/assets/products/bay-x09.jpg",
  "./public/assets/products/bay-x10.jpg"
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
