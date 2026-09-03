/*
  BURBUJA - Service Worker limpiador de la raíz.

  No cachea páginas, no intercepta navegación y no bloquea la entrada.
  Si Chrome conserva una registración antigua, cuando detecte esta actualización
  eliminará las cachés antiguas de Burbuja y se desregistrará.
*/

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(key => {
            const name = String(key).toLowerCase();
            return (
              name.startsWith("burbuja-root") ||
              name.startsWith("burbuja-shell")
            );
          })
          .map(key => caches.delete(key))
      );

      await self.registration.unregister();
    } catch (error) {
      console.warn("Burbuja SW cleanup:", error);
    }
  })());
});
