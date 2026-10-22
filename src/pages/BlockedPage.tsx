import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, UserX } from 'lucide-react'
import { useT } from '../i18n/lang'
import { fetchBlocked, unblockUser } from '../lib/blocks'
import type { BlockedPerson } from '../lib/blocks'
import Avatar from '../components/Avatar'

// Profile → Blocked students: a quién has bloqueado, con un botón para desbloquear.
function BlockedPage() {
  const t = useT()
  const [people, setPeople] = useState<BlockedPerson[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBlocked()
      .then(setPeople)
      .catch(() => setPeople([]))
  }, [])

  async function unblock(id: string) {
    setError('')
    try {
      await unblockUser(id)
      setPeople((current) => current?.filter((person) => person.blocked_id !== id) ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not unblock this person. Please try again.')
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        to="/profile"
        className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-white/70 hover:text-white"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> {t('Profile')}
      </Link>
      <div>
        <h1 className="text-3xl font-bold">{t('Blocked students')}</h1>
        <p className="mt-1 text-white/60">
          {t('You don’t see their listings and they can’t message you. They aren’t told you blocked them.')}
        </p>
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-rojo/20 px-4 py-2 text-sm text-rosa">
          {t(error)}
        </p>
      )}
      {people === null ? (
        <p className="text-sm text-white/60">{t('Loading…')}</p>
      ) : people.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center text-sm text-white/60">
          <UserX aria-hidden="true" className="mx-auto mb-2 h-7 w-7 text-rosa" />
          {t('You haven’t blocked anyone.')}
        </div>
      ) : (
        <ul className="divide-y divide-white/10 overflow-hidden rounded-3xl glass">
          {people.map((person) => (
            <li key={person.blocked_id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={person.person?.display_name} url={person.person?.avatar_url} className="h-10 w-10 text-base" />
              <span className="min-w-0 flex-1 truncate font-medium">{person.person?.display_name}</span>
              <button
                type="button"
                onClick={() => unblock(person.blocked_id)}
                className="min-h-11 rounded-full border border-white/20 px-4 text-sm font-semibold text-white/85 hover:border-white/40"
              >
                {t('Unblock')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default BlockedPage
