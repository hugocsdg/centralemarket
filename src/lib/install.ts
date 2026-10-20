// Instalar la web como app en el móvil.
// - Android (Chrome): el navegador avisa con el evento "beforeinstallprompt"; lo guardamos para
//   poder mostrar NUESTRO botón "Install" cuando queramos. Hay que escucharlo desde el principio
//   (por eso este archivo se importa en main.tsx), porque llega nada más cargar la página.
// - iPhone (Safari): Apple no permite instalar con un botón; solo se puede explicar los pasos.

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

let deferred: InstallPromptEvent | null = null
const listeners = new Set<() => void>()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault() // sin esto, Chrome enseña su propio aviso cuando le parece
    deferred = event as InstallPromptEvent
    listeners.forEach((listener) => listener())
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    listeners.forEach((listener) => listener())
  })
}

export function onInstallChange(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function canPromptInstall() {
  return deferred !== null
}

// Abre el diálogo de instalación de Android. Devuelve true si la persona aceptó.
export async function promptInstall() {
  if (!deferred) return false
  const event = deferred
  deferred = null
  await event.prompt()
  const { outcome } = await event.userChoice
  listeners.forEach((listener) => listener())
  return outcome === 'accepted'
}

// ¿Ya se está usando como app instalada?
export function isInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isIOS() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent)
}
