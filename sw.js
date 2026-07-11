const CACHE_NAME = "tq-catalog-v37";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=20260711-filter-grid",
  "./assets.js?v=20260712-bcr-material-images",
  "./app.js?v=20260712-bcr-material-images",
  "./data.js?v=20260712-bcr-material-images",
  "./storage.js?v=20260712-home-link",
  "./catalog-service.js?v=20260710-spec-details",
  "./api.js?v=20260712-bcr-material-images",
  "./message-template.js?v=20260710-spec-details",
  "./analytics.js?v=20260710-spec-details",
  "./manifest.webmanifest?v=20260710-spec-details",
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
  "./public/assets/products/bay-x10.jpg",
  "./public/assets/products/bay-xt01.jpg",
  "./public/assets/products/bay-xt02.jpg",
  "./public/assets/products/bay-xt03.jpg",
  "./public/assets/products/bay-xt04.jpg",
  "./public/assets/products/bay-xt05.jpg",
  "./public/assets/products/bay-xt06.jpg",
  "./public/assets/products/bay-xt07.jpg",
  "./public/assets/products/bay-xt08.jpg",
  "./public/assets/products/bay-t01.jpg",
  "./public/assets/products/bay-t02.jpg",
  "./public/assets/products/bay-t03.jpg",
  "./public/assets/products/bay-t04.jpg",
  "./public/assets/products/bay-c01.jpg",
  "./public/assets/products/bay-c02.jpg",
  "./public/assets/products/bcr-v15.jpg",
  "./public/assets/products/bcr-v20.jpg",
  "./public/assets/products/bcr-v25.jpg",
  "./public/assets/products/bcr-v30.jpg",
  "./public/assets/products/bcr-v40.jpg",
  "./public/assets/products/bcr-v50.jpg",
  "./public/assets/products/bcr-t20.jpg",
  "./public/assets/products/bcr-t25.jpg",
  "./public/assets/products/bcr-t30.jpg",
  "./public/assets/products/bcr-th.jpg",
  "./public/assets/products/bcr-steel-v15.jpg",
  "./public/assets/products/bcr-steel-v20.jpg",
  "./public/assets/products/bcr-steel-v25.jpg",
  "./public/assets/products/bcr-steel-v30.jpg",
  "./public/assets/products/bcr-steel-v40.jpg",
  "./public/assets/products/bcr-steel-v50.jpg",
  "./public/assets/products/bcr-steel-t20.jpg",
  "./public/assets/products/bcr-steel-t25.jpg",
  "./public/assets/products/bcr-steel-t30.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      self.skipWaiting(),
      caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    ])
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      ),
      self.clients.claim()
    ])
  );
});

function cacheResponse(request, response) {
  if (!response || response.status !== 200) return response;
  const clone = response.clone();
  caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
  return response;
}

function cacheFirst(request) {
  return caches.match(request).then((cached) => cached || fetch(request).then((response) => cacheResponse(request, response)));
}

function networkFirst(request) {
  return fetch(request)
    .then((response) => cacheResponse(request, response))
    .catch(() => caches.match(request));
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const isAppCode =
    event.request.mode === "navigate" ||
    ["document", "script", "style", "manifest"].includes(event.request.destination);

  event.respondWith(
    (isAppCode ? networkFirst(event.request) : cacheFirst(event.request)).then(
      (response) => response || caches.match("./index.html")
    )
  );
});
