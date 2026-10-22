import { useEffect, useState } from 'react'
import { UserX } from 'lucide-react'
import { useT } from '../i18n/lang'
import { blockUser, isBlocked, unblockUser } from '../lib/blocks'

// Enlace discreto "Bloquear a X" en el perfil de otro estudiante (al lado de "Denunciar").
function BlockButton({ userId, name }: { userId: string; name: string }) {
  const t = useT()
  const [blocked, setBlocked] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    isBlocked(userId).then(setBlocked)
  }, [userId])

  async function toggle() {
    if (!blocked && !window.confirm(t('Block {name}? You won’t see their listings and they won’t be able to message you.', { name })))
      return
    setBusy(true)
    setError('')
    try {
      if (blocked) await unblockUser(userId)
      else await blockUser(userId)
      setBlocked(!blocked)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not block this person. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (blocked === null) return null
  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className="inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-medium text-white/60 transition hover:text-rosa disabled:opacity-50"
      >
        <UserX aria-hidden="true" className="h-4 w-4" />
        {blocked ? t('Unblock {name}', { name }) : t('Block {name}', { name })}
      </button>
      {error && <span className="text-xs text-rosa">{t(error)}</span>}
    </>
  )
}

export default BlockButton
