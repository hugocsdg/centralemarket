import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useT } from '../i18n/lang'

// Crear o cambiar tu contraseña (/profile/password).
// - ?welcome=1: justo después de crear la cuenta.
// - ?reset=1: después de "Forgot password?".
// - Sin nada: desde Profile → Password.
// Guardamos también "has_password" en tus datos de usuario para saber si ya tienes una.

const MIN = 8

function PasswordPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/'
  const welcome = params.has('welcome')
  const reset = params.has('reset')
  const hasPassword = session?.user.user_metadata?.has_password === true
  const t = useT()

  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState('')

  const tooShort = password.length > 0 && password.length < MIN
  const mismatch = repeat.length > 0 && repeat !== password
  const ready = password.length >= MIN && password === repeat

  const title = welcome
    ? 'Create your password'
    : reset
      ? 'Choose a new password'
      : hasPassword
        ? 'Change your password'
        : 'Create a password'
  const intro = welcome
    ? 'Your account is ready. Next time, log in with your email and this password: no more codes.'
    : 'Next time, log in with your student email and this password.'

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!ready) return
    setStatus('saving')
    setError('')
    const { error } = await supabase.auth.updateUser({ password, data: { has_password: true } })
    if (error) {
      setStatus('error')
      setError(t(friendlyError(error.message)))
      return
    }
    setStatus('saved')
    if (welcome || reset) navigate(next, { replace: true })
  }

  return (
    <div className="mx-auto max-w-md">
      {!welcome && !reset && (
        <Link
          to="/profile"
          className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-white/70 hover:text-white"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> {t('Profile')}
        </Link>
      )}
      <div className="mt-2 rounded-3xl glass p-8">
        <h1 className="text-2xl font-bold">{t(title)}</h1>
        <p className="mt-2 text-sm text-white/70">{t(intro)}</p>

        {status === 'saved' && !welcome && !reset ? (
          <p
            role="status"
            className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-3 text-emerald-300"
          >
            <CheckCircle2 aria-hidden="true" className="h-5 w-5" /> {t('Password saved.')}
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-white/80">{t('New password')}</span>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShow((value) => !value)}
                  aria-label={t(show ? 'Hide password' : 'Show password')}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-white/60 hover:text-white"
                >
                  {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <span className={`mt-1 block text-xs ${tooShort ? 'text-rosa' : 'text-white/60'}`}>
                {t('At least {n} characters.', { n: MIN })}
              </span>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-white/80">{t('Repeat it')}</span>
              <input
                type={show ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={repeat}
                onChange={(event) => setRepeat(event.target.value)}
                className={inputClass}
              />
              {mismatch && <span className="mt-1 block text-xs text-rosa">{t("The two passwords don't match.")}</span>}
            </label>

            {status === 'error' && (
              <p role="alert" className="rounded-xl bg-rojo/20 px-4 py-2 text-sm text-rosa">
                {error}
              </p>
            )}

            <button
              disabled={!ready || status === 'saving'}
              className="min-h-12 w-full rounded-full btn-primary px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {t(status === 'saving' ? 'Saving…' : 'Save password')}
            </button>

            {(welcome || reset) && (
              <Link
                to={next}
                replace
                className="flex min-h-11 items-center justify-center text-sm text-white/60 hover:text-white"
              >
                {t('Skip for now')}
              </Link>
            )}
          </form>
        )}
      </div>
    </div>
  )
}

function friendlyError(message: string) {
  const text = message.toLowerCase()
  if (text.includes('same')) return 'That is already your password. Choose a different one.'
  if (text.includes('weak') || text.includes('at least'))
    return 'Choose a stronger password (at least 8 characters).'
  if (text.includes('reauthentication') || text.includes('recent')) {
    return 'For security, log out and log in again with a code, then change your password.'
  }
  return 'Could not save your password. Please try again.'
}

const inputClass =
  'w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/50 focus:border-rosa'

export default PasswordPage
