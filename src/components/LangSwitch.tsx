import { useLang } from '../i18n/lang'
import type { Lang } from '../i18n/lang'

// Selector de idioma "EN | FR": dos botones; el activo se marca y lo anuncia el lector de pantalla.
const LANGS: { id: Lang; label: string; name: string }[] = [
  { id: 'en', label: 'EN', name: 'English' },
  { id: 'fr', label: 'FR', name: 'Français' },
]

function LangSwitch({ label, className = '' }: { label: string; className?: string }) {
  const { lang, setLang } = useLang()
  return (
    <div
      role="group"
      aria-label={label}
      className={`flex items-center rounded-full border border-white/15 p-0.5 ${className}`}
    >
      {LANGS.map(({ id, label: short, name }) => (
        <button
          key={id}
          type="button"
          lang={id}
          aria-label={name}
          aria-pressed={lang === id}
          onClick={() => setLang(id)}
          className={`flex min-h-11 min-w-11 items-center justify-center rounded-full px-2 text-xs font-semibold tracking-wide transition ${
            lang === id ? 'bg-white text-noche' : 'text-white/70 hover:text-white'
          }`}
        >
          {short}
        </button>
      ))}
    </div>
  )
}

export default LangSwitch
