/* global importScripts */
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_NAME = "diet-app-v9-fix-dieta-and-helena-sync";
const HELENA_ENTRY = "/planohelena/index.html";
const CORE_ASSETS = [
  "/",
  "/index.html",
  HELENA_ENTRY,
  "/manifest.json",
  "/manifest-helena.json",
  "/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .catch(() => undefined),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.hostname.includes("supabase.co") || url.hostname.includes("openfoodfacts.org")) return;
  if (url.pathname.includes("/rest/v1/") || url.pathname.includes("/auth/v1/")) return;
  // Requisições externas não devem ser armazenadas pelo service worker.
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    const entry = url.pathname.startsWith("/planohelena") ? HELENA_ENTRY : "/index.html";
    event.respondWith(
      fetch(entry, { cache: "no-store" })
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(entry, copy)).catch(() => undefined);
          return response;
        })
        .catch(() => caches.match(entry).then((cached) => cached || caches.match("/index.html"))),
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => undefined);
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
