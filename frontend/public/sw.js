const CACHE_NAME = "turnogo-v1";

// Archivos que se cachean al instalar (app shell)
const PRECACHE_URLS = [
  "/",
  "/jobs",
  "/auth/login",
  "/auth/register",
  "/manifest.json",
];

// Instalar — cachear el app shell
self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // Activar inmediatamente
  self.skipWaiting();
});

// Activar — limpiar caches viejos
self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Interceptar requests — cache first, luego red
self.addEventListener("fetch", (event: FetchEvent) => {
  // Solo GET
  if (event.request.method !== "GET") return;

  // No cachear API calls
  if (event.request.url.includes("/api/")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Si está en cache, devolverlo (rápido)
      if (cached) return cached;

      // Si no, buscar en la red
      return fetch(event.request)
        .then((response) => {
          // Cachear la respuesta si es válida
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Si no hay red, devolver página offline
          return caches.match("/");
        });
    })
  );
});
