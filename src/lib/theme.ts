import { useSyncExternalStore } from 'react'

// Modo oscuro / claro de la app.
// - "dark": como siempre (lo normal). "light": fondo claro. "system": sigue al ajuste del móvil/ordenador.
// - Se guarda en este dispositivo (localStorage) y se aplica poniendo data-theme="light" en <html>.
//   El CSS (index.css) cambia entonces dos colores, "white" y "noche", y toda la web se da la vuelta.
// - index.html hace lo mismo antes de que cargue la app, para que no haya un parpadeo oscuro.
// - La intro (/welcome) siempre va en oscuro: sus vídeos son del campus de noche.

export type ThemeChoice = 'dark' | 'light' | 'system'

const KEY = 'cm-theme'
const COLORS = { dark: '#09090B', light: '#F5F4F2' }
const systemLight = window.matchMedia('(prefers-color-scheme: light)')
const listeners = new Set<() => void>()
let forcedDark = false

function read(): ThemeChoice {
  try {
    const value = localStorage.getItem(KEY)
    if (value === 'light' || value === 'system') return value
  } catch {
    // Sin acceso al almacenamiento (modo privado): oscuro.
  }
  return 'dark'
}

let choice = read()

function apply() {
  const light = !forcedDark && (choice === 'light' || (choice === 'system' && systemLight.matches))
  const root = document.documentElement
  if (light) root.dataset.theme = 'light'
  else delete root.dataset.theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? COLORS.light : COLORS.dark)
}

systemLight.addEventListener('change', () => {
  if (choice === 'system') apply()
})

export function setTheme(next: ThemeChoice) {
  choice = next
  try {
    localStorage.setItem(KEY, next)
  } catch {
    // Si no se puede guardar, vale solo para esta visita.
  }
  apply()
  listeners.forEach((listener) => listener())
}

// La intro lo usa al entrar (true) y al salir (false).
export function forceDarkTheme(on: boolean) {
  forcedDark = on
  apply()
}

export function useTheme(): ThemeChoice {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => choice,
  )
}
