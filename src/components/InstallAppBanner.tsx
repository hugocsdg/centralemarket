import { useEffect, useState } from 'react'
import { Share, SquarePlus, X } from 'lucide-react'
import { canPromptInstall, isInstalled, isIOS, onInstallChange, promptInstall } from '../lib/install'

const KEY = 'cm-install-dismissed'

function wasDismissed() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

// Aviso "Get the app" para instalar CentraleMarket en el móvil.
// Solo se ve en móvil, si aún no está instalada y si no lo has cerrado antes.
function InstallAppBanner() {
  const [dismissed, setDismissed] = useState(wasDismissed)
  const [androidReady, setAndroidReady] = useState(canPromptInstall)
  const [showSteps, setShowSteps] = useState(false)
  const ios = isIOS()

  useEffect(() => onInstallChange(() => setAndroidReady(canPromptInstall())), [])

  if (dismissed || isInstalled() || (!ios && !androidReady)) return null

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      // Sin almacenamiento: se cierra solo por esta visita.
    }
  }

  return (
    <section aria-label="Install the app" className="mb-6 rounded-3xl glass p-4 md:hidden">
      <div className="flex items-center gap-3">
        <img src="/app-icon-192.png" alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <h2 className="font-bold">Get the app</h2>
          <p className="text-sm text-white/60">Add CentraleMarket to your home screen. Free, no store needed.</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="-mt-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-full text-white/60 hover:text-white"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      {ios ? (
        showSteps ? (
          <ol className="mt-4 space-y-2 text-sm text-white/80">
            <li className="flex items-start gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                1
              </span>
              <p className="leading-6">
                In Safari, tap <Share aria-hidden="true" className="inline h-4 w-4 align-[-3px] text-rosa" />{' '}
                <strong>Share</strong> at the bottom of the screen.
              </p>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                2
              </span>
              <p className="leading-6">
                Tap <SquarePlus aria-hidden="true" className="inline h-4 w-4 align-[-3px] text-rosa" />{' '}
                <strong>Add to Home Screen</strong>.
              </p>
            </li>
          </ol>
        ) : (
          <button
            type="button"
            onClick={() => setShowSteps(true)}
            className="mt-4 flex min-h-11 w-full items-center justify-center rounded-full btn-primary text-sm font-semibold"
          >
            Show me how
          </button>
        )
      ) : (
        <button
          type="button"
          onClick={async () => {
            if (await promptInstall()) dismiss()
          }}
          className="mt-4 flex min-h-11 w-full items-center justify-center rounded-full btn-primary text-sm font-semibold"
        >
          Install
        </button>
      )}
    </section>
  )
}

export default InstallAppBanner
