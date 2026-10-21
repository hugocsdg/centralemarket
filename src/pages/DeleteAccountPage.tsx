import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { deleteAccount } from '../lib/account'
import { useT } from '../i18n/lang'

const CONFIRM_WORD = 'DELETE'

// Borrar la cuenta para siempre. Hay que escribir DELETE para confirmar (así nadie lo hace sin querer).
function DeleteAccountPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [typed, setTyped] = useState('')
  const [status, setStatus] = useState<'idle' | 'deleting' | 'error'>('idle')
  const [error, setError] = useState('')
  const ready = typed.trim().toUpperCase() === CONFIRM_WORD
  const t = useT()

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!ready || !session) return
    setStatus('deleting')
    setError('')
    try {
      await deleteAccount(session.user.id)
      navigate('/welcome', { replace: true })
    } catch (err) {
      setStatus('error')
      setError(t(err instanceof Error ? err.message : 'Something went wrong. Please try again.'))
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link
        to="/profile"
        className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-white/70 hover:text-white"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> {t('Profile')}
      </Link>
      <h1 className="mt-2 text-3xl font-bold">{t('Delete your account')}</h1>
      <p className="mt-3 text-white/75">{t("This can't be undone. Everything linked to your account is deleted for good:")}</p>
      <ul className="mt-4 space-y-2 rounded-3xl glass p-6 text-white/80">
        {[
          'Your profile and profile photo',
          'All your listings and their photos',
          'Your chats and messages (also for the people you talked to)',
          'Your favourite items',
        ].map((item) => (
          <li key={item} className="flex gap-3">
            <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-carmin" />
            {t(item)}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-white/60">
        {t('You can create a new account later with the same @student-cs.fr email, but it will start empty.')}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-white/80">
            {t('Type')} <strong className="text-white">{CONFIRM_WORD}</strong> {t('to confirm')}
          </span>
          <input
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 outline-none placeholder:text-white/50 focus:border-rosa/60"
            placeholder={CONFIRM_WORD}
          />
        </label>
        {status === 'error' && (
          <p role="alert" className="rounded-xl bg-rojo/20 px-4 py-2 text-sm text-rosa">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            disabled={!ready || status === 'deleting'}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-rojo px-5 font-semibold text-white transition hover:bg-carmin disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 aria-hidden="true" className="h-5 w-5" />
            {t(status === 'deleting' ? 'Deleting your account…' : 'Delete my account')}
          </button>
          <Link
            to="/profile"
            className="flex min-h-12 items-center justify-center rounded-full border border-white/20 px-5 font-semibold text-white/85 hover:border-white/40"
          >
            {t('Cancel')}
          </Link>
        </div>
      </form>
    </div>
  )
}

export default DeleteAccountPage
