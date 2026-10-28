// Se ejecuta antes de pintar nada (index.html lo carga en <head>). Está aparte, y no dentro del HTML,
// para que la regla de seguridad CSP (vercel.json) pueda prohibir todo el código "en línea".

// Modo claro (Profile → Appearance): se aplica antes de pintar nada, así no hay parpadeo oscuro.
// Misma lógica que src/lib/theme.ts. La intro (/welcome) siempre va en oscuro.
;(function () {
  try {
    var t = localStorage.getItem('cm-theme')
    var light = t === 'light' || (t === 'system' && matchMedia('(prefers-color-scheme: light)').matches)
    if (light && location.pathname !== '/welcome') {
      document.documentElement.dataset.theme = 'light'
      document.querySelector('meta[name="theme-color"]').setAttribute('content', '#F5F4F2')
    }
  } catch {
    // Sin acceso al almacenamiento (navegación privada): seguimos sin más.
  }
})()

// En la intro (sin sesión), pedir la imagen de la portada cuanto antes: es lo primero que se ve
;(function () {
  var path = location.pathname
  if (path !== '/welcome' && path !== '/') return
  try {
    for (var i = 0; i < localStorage.length; i++) {
      if (/^sb-.*-auth-token$/.test(localStorage.key(i) || '') && path === '/') return
    }
  } catch {
    // Sin acceso al almacenamiento (navegación privada): seguimos sin más.
  }
  var link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.fetchPriority = 'high'
  link.setAttribute('imagesrcset', matchMedia('(max-width: 720px)').matches
    ? '/intro/campus-night-mobile.webp'
    : '/intro/campus-night-1280.webp 1280w, /intro/campus-night-1920.webp 1920w')
  link.setAttribute('imagesizes', '100vw')
  document.head.appendChild(link)
})()
