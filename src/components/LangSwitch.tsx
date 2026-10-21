import { ChevronDown, Globe } from 'lucide-react'
import { useLang } from '../i18n/lang'
import { LANGUAGES } from '../i18n/core'
import type { Lang } from '../i18n/core'

// Selector de idioma compacto: una pastilla "🌐 FR ⌄". Al tocarla se abre la lista nativa del
// móvil/navegador (cómoda con el dedo y accesible), con los 5 idiomas escritos en su propia lengua.
function LangSwitch({ label, className = '' }: { label: string; className?: string }) {
  const { lang, setLang } = useLang()
  const current = LANGUAGES.find((language) => language.id === lang)!
  return (
    <label
      className={`relative flex min-h-11 items-center gap-1.5 rounded-full border border-white/15 pr-2.5 pl-3 text-xs font-semibold tracking-wide text-white/85 transition focus-within:border-rosa hover:border-white/30 ${className}`}
    >
      <Globe aria-hidden="true" className="h-4 w-4 text-white/70" />
      <span aria-hidden="true">{current.short}</span>
      <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-white/60" />
      <select
        aria-label={label}
        value={lang}
        onChange={(event) => setLang(event.target.value as Lang)}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        {LANGUAGES.map((language) => (
          <option key={language.id} value={language.id} lang={language.id}>
            {language.name}
          </option>
        ))}
      </select>
    </label>
  )
}

export default LangSwitch
