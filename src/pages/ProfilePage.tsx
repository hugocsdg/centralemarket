import { useState } from 'react'
import type { FormEvent } from 'react'
import { LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Profile } from '../lib/auth'

// Tu perfil: ver tus datos, cambiar nombre y WhatsApp, y cerrar sesión.
// (Tus anuncios aparecerán aquí cuando exista "Vender").
function ProfilePage() {
  const { session, profile, refreshProfile, signOut } = useAuth()

  if (!profile) {
    return <p className="py-20 text-center text-white/60">Loading your profile…</p>
  }

  return (
    <ProfileView
      profile={profile}
      email={session?.user.email ?? ''}
      onSaved={refreshProfile}
      onSignOut={signOut}
    />
  )
}

type ProfileViewProps = {
  profile: Profile
  email: string
  onSaved: () => Promise<void>
  onSignOut: () => Promise<void>
}

function ProfileView({ profile, email, onSaved, onSignOut }: ProfileViewProps) {
  // El formulario empieza con los datos que ya hay en Supabase.
  const [name, setName] = useState(profile.display_name)
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState('')

  async function save(event: FormEvent) {
    event.preventDefault()
    setStatus('saving')
    setError('')
    const cleanPhone = whatsapp.trim()
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: name.trim(), whatsapp: cleanPhone || null })
      .eq('id', profile.id)
    if (error) {
      setStatus('error')
      setError(
        error.message.includes('whatsapp')
          ? 'Use digits only, with country code (e.g. +34 612 345 678).'
          : 'Could not save. Please try again.',
      )
      return
    }
    await onSaved()
    setStatus('saved')
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-carmin to-burdeos text-2xl font-bold">
          {profile.display_name[0]?.toUpperCase()}
        </span>
        <div>
          <h1 className="text-2xl font-bold">{profile.display_name}</h1>
          <p className="text-sm text-white/60">{email}</p>
          <p className="text-xs text-white/40">Member since {memberSince}</p>
        </div>
      </div>

      <form onSubmit={save} className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h2 className="text-lg font-bold">Profile settings</h2>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-white/80">Display name</span>
          <input
            required
            maxLength={50}
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setStatus('idle')
            }}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-white/80">WhatsApp number (optional)</span>
          <input
            type="tel"
            value={whatsapp}
            onChange={(event) => {
              setWhatsapp(event.target.value)
              setStatus('idle')
            }}
            placeholder="+34 612 345 678"
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-white/50">
            Buyers will use it to contact you about your listings. Only logged-in students can see it.
          </span>
        </label>

        {status === 'error' && <p className="rounded-xl bg-rojo/20 px-4 py-2 text-sm text-rosa">{error}</p>}

        <button
          disabled={status === 'saving'}
          className="rounded-full bg-gradient-to-r from-rojo to-carmin px-5 py-2.5 font-semibold disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save changes'}
        </button>
      </form>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h2 className="text-lg font-bold">My listings</h2>
        <p className="mt-1 text-sm text-white/60">Your listings will appear here once selling is live.</p>
      </section>

      <button
        onClick={onSignOut}
        className="flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/80 hover:border-white/40 hover:text-white"
      >
        <LogOut className="h-4 w-4" /> Log out
      </button>
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-rosa'

export default ProfilePage
