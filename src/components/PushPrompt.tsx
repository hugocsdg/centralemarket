import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { BellRing, X } from 'lucide-react'
import { useLang } from '../i18n/lang'
import { enablePush, getPushState } from '../lib/push'
import type { PushState } from '../lib/push'

const KEY = 'cm-push-prompt-dismissed'

// Tarjeta "Recibe avisos en tu móvil": solo si aún no están activados (y se puede), y si no la cerraste.
// En iPhone sin instalar lleva a los ajustes, donde se explica cómo instalar la app primero.
function PushPrompt() {
  const { lang, t } = useLang()
  const [state, setState] = useState<PushState | null>(null)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1'
    } catch {
      return false
    }
  })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getPushState().then(setState)
  }, [])

  if (dismissed || !state || state === 'on' || state === 'unsupported' || state === 'denied') return null

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      // Sin almacenamiento: se cierra solo esta vez.
    }
  }

  async function turnOn() {
    setBusy(true)
    try {
      setState(await enablePush(lang))
    } catch {
      setBusy(false)
    }
  }

  return (
    <section className="flex items-start gap-3 rounded-3xl glass p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-carmin to-burdeos">
        <BellRing aria-hidden="true" className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-bold">{t('Get notified on your phone')}</h2>
        <p className="text-sm text-white/60">{t('Know right away when someone answers you or a favourite gets cheaper.')}</p>
        {state === 'install-first' ? (
          <Link
            to="/profile/notifications"
            className="mt-3 inline-flex min-h-11 items-center rounded-full btn-primary px-4 text-sm font-semibold"
          >
            {t('Show me how')}
          </Link>
        ) : (
          <button
            type="button"
            onClick={turnOn}
            disabled={busy}
            className="mt-3 inline-flex min-h-11 items-center rounded-full btn-primary px-4 text-sm font-semibold disabled:opacity-60"
          >
            {busy ? t('One moment…') : t('Turn on notifications')}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t('Close')}
        className="-mt-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/60 hover:text-white"
      >
        <X aria-hidden="true" className="h-5 w-5" />
      </button>
    </section>
  )
}

export default PushPrompt
