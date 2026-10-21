import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { introEn } from './intro'
import type { IntroCopy } from './intro'
import { KEY, LOADERS, fill, initialLang, setActiveLocale, translate } from './core'
import type { Lang, Locale } from './core'

// Idioma de la web: inglés, francés, español, italiano o portugués.
// - La primera vez se elige según el idioma del móvil/navegador; si lo cambias, se recuerda aquí.
// - Los textos se escriben en inglés en el código: t('Message seller'). Si el idioma no es el inglés,
//   t() busca la traducción en src/i18n/locales/<idioma>.ts (si falta alguna, se ve en inglés).
// - Cada idioma es un archivo aparte que SOLO se descarga si se usa (unos pocos KB): añadir idiomas
//   no hace la app más lenta. El inglés va siempre incluido.
// - Para palabras que cambian: t('{n} days ago', { n: 3 }) → "il y a 3 jours".
// - La lista de idiomas, translate() y currentLocale() están en core.ts.

// Empezar a descargar el idioma guardado cuanto antes (mientras carga la sesión).
const startLang = initialLang()
const startLoad = startLang === 'en' ? null : LOADERS[startLang]()

type LangValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: typeof translate
  intro: IntroCopy
}

const LangContext = createContext<LangValue>({ lang: 'en', setLang: () => {}, t: translate, intro: introEn })

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(startLang)
  const [locale, setLocale] = useState<{ lang: Lang; data: Locale } | null>(null)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // Sin almacenamiento: el cambio vale solo para esta visita.
    }
  }, [])

  // Descargar el archivo del idioma (solo la primera vez; luego el navegador lo tiene guardado).
  useEffect(() => {
    if (lang === 'en') return
    let alive = true
    const load = lang === startLang && startLoad ? startLoad : LOADERS[lang]()
    load.then((module) => alive && setLocale({ lang, data: module.default })).catch(() => {})
    return () => {
      alive = false
    }
  }, [lang])

  // Mientras llega el archivo, se ve en inglés.
  const active = lang !== 'en' && locale?.lang === lang ? locale.data : null
  setActiveLocale(active ? lang : 'en', active?.app ?? null)

  // Para lectores de pantalla y traductores automáticos.
  useEffect(() => {
    document.documentElement.lang = active ? lang : 'en'
  }, [active, lang])

  const t = useCallback(
    (text: string, vars?: Record<string, string | number>) => fill(active?.app[text] || text, vars),
    [active],
  )

  const value = useMemo(
    () => ({ lang, setLang, t, intro: active?.intro ?? introEn }),
    [active, lang, setLang, t],
  )
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLang() {
  return useContext(LangContext)
}

// Lo normal en los componentes: const t = useT(); … {t('Message seller')}
// eslint-disable-next-line react-refresh/only-export-components
export function useT() {
  return useContext(LangContext).t
}
