import type { IntroCopy } from './intro'

// Lo básico de los idiomas, sin React (lo usan también lib/format.ts y lib/listings.ts).
// El componente que lo pone en marcha está en lang.tsx.

export type Lang = 'en' | 'fr' | 'es' | 'it' | 'pt'

export const LANGUAGES: { id: Lang; short: string; name: string; locale: string }[] = [
  { id: 'en', short: 'EN', name: 'English', locale: 'en-GB' },
  { id: 'fr', short: 'FR', name: 'Français', locale: 'fr-FR' },
  { id: 'es', short: 'ES', name: 'Español', locale: 'es-ES' },
  { id: 'it', short: 'IT', name: 'Italiano', locale: 'it-IT' },
  { id: 'pt', short: 'PT', name: 'Português', locale: 'pt-BR' },
]

export type Locale = { app: Record<string, string>; intro: IntroCopy }

export const LOADERS: Record<Exclude<Lang, 'en'>, () => Promise<{ default: Locale }>> = {
  fr: () => import('./locales/fr'),
  es: () => import('./locales/es'),
  it: () => import('./locales/it'),
  pt: () => import('./locales/pt'),
}

export const KEY = 'cm-lang'
const isLang = (value: unknown): value is Lang => LANGUAGES.some((language) => language.id === value)

export function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY)
    if (isLang(saved)) return saved
  } catch {
    // Navegación privada sin almacenamiento: seguimos con el navegador.
  }
  const browser = navigator.language?.toLowerCase().slice(0, 2)
  return isLang(browser) ? browser : 'en'
}

// Lo que está activo ahora, también para código fuera de React (lib/format.ts).
let current: { lang: Lang; app: Record<string, string> | null } = { lang: 'en', app: null }

export function setActiveLocale(lang: Lang, app: Record<string, string> | null) {
  current = { lang, app }
}

export function activeLang() {
  return current.lang
}

export function fill(text: string, vars?: Record<string, string | number>) {
  return vars ? text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match)) : text
}

// Traducir fuera de un componente (los componentes usan useT() para actualizarse al cambiar de idioma).
export function translate(text: string, vars?: Record<string, string | number>) {
  return fill(current.app?.[text] || text, vars)
}

export function currentLocale() {
  return LANGUAGES.find((language) => language.id === current.lang)!.locale
}

