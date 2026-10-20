// Service worker mínimo: hace que la web se pueda instalar como app en el móvil.
// A propósito NO intercepta ni guarda nada en caché: así cada vez que publicamos algo, la app instalada
// lo ve al momento (sin versiones viejas atascadas en el móvil de nadie).
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
