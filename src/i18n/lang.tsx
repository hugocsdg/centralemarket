import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

// Idioma de la web (inglés o francés).
// - La primera vez se elige según el idioma del navegador (francés → FR, el resto → EN).
// - Si la persona lo cambia con el selector, se recuerda en este dispositivo.
// Los textos de cada página están en src/i18n/<página>.ts, con una versión por idioma.

export type Lang = 'en' | 'fr'

const KEY = 'cm-lang'

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'en' || saved === 'fr') return saved
  } catch {
    // Navegación privada sin almacenamiento: seguimos con el navegador.
  }
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

const LangContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void }>({ lang: 'en', setLang: () => {} })

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // Sin almacenamiento: el cambio vale solo para esta visita.
    }
  }, [])

  // Para lectores de pantalla y traductores automáticos.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang])
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLang() {
  return useContext(LangContext)
}
