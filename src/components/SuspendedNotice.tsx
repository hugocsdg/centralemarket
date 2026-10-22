import { Ban } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useT } from '../i18n/lang'

// Aviso arriba de todo si un administrador ha suspendido tu cuenta (supabase/11_admin.sql).
function SuspendedNotice() {
  const { profile } = useAuth()
  const t = useT()
  if (!profile?.banned_at) return null
  return (
    <div role="alert" className="mb-6 flex items-start gap-3 rounded-3xl border border-rojo/50 bg-rojo/15 p-4">
      <Ban aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-rosa" />
      <div className="text-sm">
        <p className="font-bold">{t('Your account is suspended')}</p>
        <p className="mt-0.5 text-white/75">
          {t('You can’t publish, message or rate for now.')}
          {profile.ban_reason && ` ${t('Reason:')} ${profile.ban_reason}`}
        </p>
        <p className="mt-1 text-white/60">{t('If you think this is a mistake, contact the CentraleMarket team.')}</p>
      </div>
    </div>
  )
}

export default SuspendedNotice
