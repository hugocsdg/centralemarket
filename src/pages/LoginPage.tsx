import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { ArrowLeft, Eye, EyeOff, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { isAllowedEmail, useAuth } from '../lib/auth'
import { LogoMark } from '../components/Logo'

// Entrar en CentraleMarket:
// - Lo normal: email de la uni + contraseña.
// - Crear cuenta (la primera vez): te llega un código al email @student-cs.fr (así sabemos que eres
//   estudiante) y después eliges una contraseña.
// - ¿Olvidaste la contraseña?: entras con un código y eliges una nueva.
// - También se puede entrar siempre con un código, sin contraseña.

type Mode = 'password' | 'code-email' | 'code-verify'
type Purpose = 'login' | 'signup' | 'reset'

const TITLES: Record<Purpose, { title: string; text: string; button: string }> = {
  login: { title: 'Log in with a code', text: "We'll email you a 6-digit code.", button: 'Send me a code' },
  signup: {
    title: 'Create your account',
    text: 'For CentraleSupélec students only. We email you a code once to check it is really you.',
    button: 'Send me a code',
  },
  reset: {
    title: 'Forgot your password?',
    text: "We'll email you a code. Then you can choose a new password.",
    button: 'Send me a code',
  },
}

function LoginPage() {
  const { session } = useAuth()
  const [params] = useSearchParams()
  const next = params.get('next') || '/'

  const [mode, setMode] = useState<Mode>('password')
  const [purpose, setPurpose] = useState<Purpose>('login')
  // Adónde ir al entrar: tras crear la cuenta o recuperar la contraseña, a elegir contraseña.
  const [afterLogin, setAfterLogin] = useState(next)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Si ya tienes sesión, no tiene sentido estar aquí.
  if (session) return <Navigate to={afterLogin} replace />

  function cleanEmail() {
    const value = email.trim().toLowerCase()
    if (!isAllowedEmail(value)) {
      setError('Use your CentraleSupélec student email (@student-cs.fr).')
      return null
    }
    return value
  }

  function goTo(nextMode: Mode, nextPurpose: Purpose = purpose) {
    setMode(nextMode)
    setPurpose(nextPurpose)
    setError('')
    setCode('')
  }

  async function logInWithPassword(event: FormEvent) {
    event.preventDefault()
    setError('')
    const value = cleanEmail()
    if (!value) return
    setBusy(true)
    setAfterLogin(next)
    const { error } = await supabase.auth.signInWithPassword({ email: value, password })
    setBusy(false)
    if (error) setError(friendlyError(error.message))
  }

  async function sendCode(event: FormEvent) {
    event.preventDefault()
    setError('')
    const value = cleanEmail()
    if (!value) return
    setBusy(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: value,
      options: {
        // Solo "Create account" puede crear cuentas nuevas.
        shouldCreateUser: purpose === 'signup',
        data: purpose === 'signup' && name.trim() ? { display_name: name.trim() } : undefined,
      },
    })
    setBusy(false)
    if (error) {
      setError(friendlyError(error.message, purpose))
      return
    }
    setEmail(value)
    setMode('code-verify')
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    // Al crear la cuenta o recuperar la contraseña, después toca elegir contraseña.
    setAfterLogin(
      purpose === 'login'
        ? next
        : `/profile/password?${purpose === 'signup' ? 'welcome' : 'reset'}=1&next=${encodeURIComponent(next)}`,
    )
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' })
    setBusy(false)
    if (error) setError(friendlyError(error.message))
    // Si va bien, AuthProvider detecta la sesión y el <Navigate> de arriba te lleva a "afterLogin".
  }

  const emailField = (
    <Field label="Student email">
      <input
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="firstname.lastname@student-cs.fr"
        className={inputClass}
      />
    </Field>
  )

  return (
    <div className="mx-auto max-w-md rounded-3xl glass p-8 backdrop-blur-sm">
      <LogoMark className="mx-auto h-14 w-auto" />

      {mode === 'password' && (
        <>
          <form onSubmit={logInWithPassword} className="mt-6 space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Welcome back</h1>
              <p className="mt-1 text-sm text-white/60">Log in with your student email and password.</p>
            </div>

            {emailField}

            <Field label="Password">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  aria-label="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-white/60 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </Field>

            {error && <ErrorMessage text={error} />}

            <button disabled={busy} className={buttonClass}>
              {busy ? 'Logging in…' : 'Log in'}
            </button>

            <div className="flex flex-wrap items-center justify-between gap-x-4 text-sm">
              <button type="button" onClick={() => goTo('code-email', 'reset')} className={linkClass}>
                Forgot password?
              </button>
              <button type="button" onClick={() => goTo('code-email', 'login')} className={linkClass}>
                Log in with a code instead
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-white/60">New to CentraleMarket?</p>
            <button
              type="button"
              onClick={() => goTo('code-email', 'signup')}
              className="mt-3 min-h-12 w-full rounded-full border border-white/20 px-5 font-semibold text-white transition hover:border-white/40"
            >
              Create your account
            </button>
          </div>
        </>
      )}

      {mode === 'code-email' && (
        <form onSubmit={sendCode} className="mt-6 space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{TITLES[purpose].title}</h1>
            <p className="mt-1 text-sm text-white/60">{TITLES[purpose].text}</p>
          </div>

          {emailField}

          {purpose === 'signup' && (
            <Field label="Your name" hint="Other students will see it. You can change it later.">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={50}
                autoComplete="name"
                placeholder="e.g. Hugo M."
                className={inputClass}
              />
            </Field>
          )}

          {error && <ErrorMessage text={error} />}

          <button disabled={busy} className={buttonClass}>
            {busy ? 'Sending…' : TITLES[purpose].button}
          </button>
          <BackButton onClick={() => goTo('password')}>Back to log in</BackButton>
        </form>
      )}

      {mode === 'code-verify' && (
        <form onSubmit={verifyCode} className="mt-6 space-y-4">
          <div className="text-center">
            <Mail className="mx-auto h-8 w-8 text-rosa" />
            <h1 className="mt-2 text-2xl font-bold">Check your inbox</h1>
            <p className="mt-1 text-sm text-white/60">
              We sent a code to <span className="font-semibold text-white">{email}</span>. It may take a minute — check
              your spam folder too.
            </p>
          </div>

          <Field label="Code">
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              maxLength={10}
              placeholder="123456"
              className={`${inputClass} text-center text-2xl tracking-[0.4em]`}
            />
          </Field>

          {error && <ErrorMessage text={error} />}

          <button disabled={busy || code.length < 6} className={buttonClass}>
            {busy ? 'Checking…' : purpose === 'login' ? 'Log in' : 'Continue'}
          </button>
          <BackButton onClick={() => goTo('code-email')}>Use another email</BackButton>
        </form>
      )}
    </div>
  )
}

// Traduce los errores técnicos de Supabase a algo que entienda un estudiante.
function friendlyError(message: string, purpose?: Purpose) {
  const text = message.toLowerCase()
  if (text.includes('invalid login credentials')) {
    return 'Wrong email or password. No password yet? Log in with a code and create one in Profile.'
  }
  if (text.includes('signups not allowed') || text.includes('user not found')) {
    return purpose === 'signup'
      ? 'Could not create the account. Please try again.'
      : 'There is no account with this email yet. Create your account first.'
  }
  if (text.includes('database error') || text.includes('student emails')) {
    return 'Only CentraleSupélec student emails (@student-cs.fr) can join.'
  }
  if (text.includes('rate limit') || text.includes('security purposes')) {
    return 'Too many attempts. Please wait a minute and try again.'
  }
  if (text.includes('expired') || text.includes('invalid')) {
    return 'That code is wrong or has expired. Request a new one.'
  }
  if (text.includes('email not confirmed')) {
    return 'Please confirm your email first: log in with a code.'
  }
  return message
}

const inputClass =
  'w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/50 focus:border-rosa'
const buttonClass = 'min-h-12 w-full rounded-full btn-primary px-5 py-3 font-semibold text-white disabled:opacity-50'
const linkClass = 'min-h-11 font-medium text-white/70 underline-offset-4 hover:text-white hover:underline'

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-white/80">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-white/60">{hint}</span>}
    </label>
  )
}

function BackButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 w-full items-center justify-center gap-1 text-sm text-white/60 hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" /> {children}
    </button>
  )
}

function ErrorMessage({ text }: { text: string }) {
  return (
    <p role="alert" className="rounded-xl bg-rojo/20 px-4 py-2 text-sm text-rosa">
      {text}
    </p>
  )
}

export default LoginPage
