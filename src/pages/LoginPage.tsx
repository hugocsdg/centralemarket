import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { ArrowLeft, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { isAllowedEmail, useAuth } from '../lib/auth'
import { LogoMark } from '../components/Logo'

// Inicio de sesión sin contraseña:
// 1) escribes tu email de la uni  2) te llega un código  3) lo escribes y entras.
// Sirve igual para registrarse (la primera vez) que para entrar.
function LoginPage() {
  const { session } = useAuth()
  const [params] = useSearchParams()
  const next = params.get('next') || '/'

  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  // Si ya tienes sesión, no tiene sentido estar aquí.
  if (session) return <Navigate to={next} replace />

  async function sendCode(event: FormEvent) {
    event.preventDefault()
    setError('')
    const cleanEmail = email.trim().toLowerCase()
    if (!isAllowedEmail(cleanEmail)) {
      setError('Use your CentraleSupélec student email (@student-cs.fr).')
      return
    }
    setSending(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { shouldCreateUser: true, data: name.trim() ? { display_name: name.trim() } : undefined },
    })
    setSending(false)
    if (error) {
      setError(friendlyError(error.message))
      return
    }
    setEmail(cleanEmail)
    setStep('code')
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSending(true)
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' })
    setSending(false)
    if (error) setError(friendlyError(error.message))
    // Si va bien, AuthProvider detecta la sesión y el <Navigate> de arriba te lleva a "next".
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl glass p-8 backdrop-blur-sm">
      <LogoMark className="mx-auto h-14 w-auto" />

      {step === 'email' ? (
        <form onSubmit={sendCode} className="mt-6 space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Join CentraleMarket</h1>
            <p className="mt-1 text-sm text-white/60">For CentraleSupélec students only. No password needed.</p>
          </div>

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

          <Field label="Your name" hint="Only needed the first time. Other students will see it.">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={50}
              autoComplete="name"
              placeholder="e.g. Hugo M."
              className={inputClass}
            />
          </Field>

          {error && <ErrorMessage text={error} />}

          <button disabled={sending} className={buttonClass}>
            {sending ? 'Sending…' : 'Send me a login code'}
          </button>
        </form>
      ) : (
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

          <button disabled={sending || code.length < 6} className={buttonClass}>
            {sending ? 'Checking…' : 'Log in'}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep('email')
              setCode('')
              setError('')
            }}
            className="flex w-full items-center justify-center gap-1 text-sm text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Use another email
          </button>
        </form>
      )}
    </div>
  )
}

// Traduce los errores técnicos de Supabase a algo que entienda un estudiante.
function friendlyError(message: string) {
  const text = message.toLowerCase()
  if (text.includes('database error') || text.includes('student emails')) {
    return 'Only CentraleSupélec student emails (@student-cs.fr) can join.'
  }
  if (text.includes('rate limit') || text.includes('security purposes')) {
    return 'Too many attempts. Please wait a minute and try again.'
  }
  if (text.includes('expired') || text.includes('invalid')) {
    return 'That code is wrong or has expired. Request a new one.'
  }
  return message
}

const inputClass =
  'w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/50 focus:border-rosa'
const buttonClass =
  'w-full rounded-full btn-primary px-5 py-3 font-semibold text-white  disabled:opacity-50'

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-white/80">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-white/50">{hint}</span>}
    </label>
  )
}

function ErrorMessage({ text }: { text: string }) {
  return <p className="rounded-xl bg-rojo/20 px-4 py-2 text-sm text-rosa">{text}</p>
}

export default LoginPage
