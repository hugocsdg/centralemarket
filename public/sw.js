// Service worker: hace que la web se pueda instalar como app y recibe las notificaciones push.
// A propósito NO intercepta ni guarda nada en caché: así cada vez que publicamos algo, la app instalada
// lo ve al momento (sin versiones viejas atascadas en el móvil de nadie).
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// Llega un aviso (lo envía supabase/functions/send-push): enseñarlo.
// Si ya hay uno con el mismo "tag" (p. ej. la misma conversación), lo sustituye en vez de acumularlos.
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'CentraleMarket', {
      body: data.body || '',
      tag: data.tag,
      renotify: Boolean(data.tag),
      icon: '/app-icon-192.png',
      badge: '/favicon.png',
      data: { url: data.url || '/' },
    }),
  )
})

// Al tocar el aviso: abrir la app en esa pantalla (o traer al frente la que ya estaba abierta).
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  // Solo páginas de nuestra propia app (nunca una web de fuera, aunque el aviso lo pidiera).
  const target = new URL(event.notification.data?.url || '/', self.location.origin)
  const url = target.origin === self.location.origin ? target.href : self.location.origin + '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => new URL(client.url).origin === self.location.origin)
      if (open) {
        return open.focus().then(() => open.navigate(url))
      }
      return self.clients.openWindow(url)
    }),
  )
})
