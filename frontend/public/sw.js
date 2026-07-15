const CACHE_NAME = "turnogo-v2";
const STATIC_CACHE = "turnogo-static-v2";
const API_CACHE = "turnogo-api-v2";

// Rutas que queremos disponibles offline
const PRECACHE_URLS = [
  "/",
  "/jobs",
  "/auth/login",
  "/auth/register",
  "/dashboard",
  "/offline",
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-384x384.png",
  "/icons/icon-512x512.png",
];

// Instalar — cachear el shell de la app
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Cachear cada URL individual para que no falle todo si una falla
      for (const url of PRECACHE_URLS) {
        try {
          await cache.add(url);
        } catch (e) {
          console.warn("SW: falló precache de", url);
        }
      }
      // Cachear también el SVG original
      try {
        await cache.add("/icons/icon-512.svg");
      } catch (e) {}
    })()
  );
  self.skipWaiting();
});

// Activar — limpiar caches viejas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      );
    })()
  );
  self.clients.claim();
});

// Interceptar fetch
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo GET
  if (request.method !== "GET") return;

  // Ignorar analytics/externos
  if (url.hostname !== self.location.hostname && !url.hostname.includes("localhost")) return;

  // Estrategias según el tipo de recurso
  if (url.pathname.startsWith("/api/")) {
    // API: network first, cache fallback, no offline
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.startsWith("/_next/")) {
    // Assets de Next.js: cache first (no cambian entre builds)
    event.respondWith(cacheFirst(request));
    return;
  }

  // Pages y todo lo demás: network first, cache fallback, offline fallback
  event.respondWith(networkFirstWithOffline(request));
});

// Cache first — para assets estáticos
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    return caches.match("/offline");
  }
}

// Network first — para API
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: "Sin conexión" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Network first con offline fallback — para páginas
async function networkFirstWithOffline(request) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match("/offline");
  }
}
