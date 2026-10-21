import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { ArrowLeft, Camera, LoaderCircle, Plus } from 'lucide-react'
import Avatar from '../components/Avatar'
import { removeAvatar, uploadAvatar } from '../lib/avatars'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Profile } from '../lib/auth'
import { fetchListings } from '../lib/listings'
import { useQuery } from '../lib/useQuery'
import ProductGrid from '../components/ProductGrid'

// My profile (/profile/me): tu foto, tu nombre y tus anuncios. Se llega desde el menú de Profile.
function MyProfilePage() {
  const { session, profile, refreshProfile } = useAuth()

  if (!profile) {
    return <p className="py-20 text-center text-white/60">Loading your profile…</p>
  }

  return <ProfileView profile={profile} email={session?.user.email ?? ''} onSaved={refreshProfile} />
}

type ProfileViewProps = {
  profile: Profile
  email: string
  onSaved: () => Promise<void>
}

function ProfileView({ profile, email, onSaved }: ProfileViewProps) {
  // El formulario empieza con los datos que ya hay en Supabase.
  const [name, setName] = useState(profile.display_name)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState('')
  const myListings = useQuery(`mine|${profile.id}`, () => fetchListings({ sellerId: profile.id, includeSold: true }))
  const [tab, setTab] = useState<'active' | 'sold'>('active')
  const active = myListings.data?.filter((listing) => listing.status !== 'sold')
  const sold = myListings.data?.filter((listing) => listing.status === 'sold')
  const { hash } = useLocation()

  // Desde el menú "My listings" (/profile/me#listings): bajar hasta tus anuncios.
  // (Un fotograma después: el marco de la app sube al principio de la página al cambiar de ruta.)
  useEffect(() => {
    if (hash !== '#listings') return
    const frame = requestAnimationFrame(() => document.getElementById('listings')?.scrollIntoView())
    return () => cancelAnimationFrame(frame)
  }, [hash])

  async function save(event: FormEvent) {
    event.preventDefault()
    setStatus('saving')
    setError('')
    const { error } = await supabase.from('profiles').update({ display_name: name.trim() }).eq('id', profile.id)
    if (error) {
      setStatus('error')
      setError('Could not save. Please try again.')
      return
    }
    await onSaved()
    setStatus('saved')
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/profile"
        className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-white/70 hover:text-white"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Profile
      </Link>
      <div className="flex items-center gap-4">
        <ProfilePhoto profile={profile} onSaved={onSaved} />
        <div>
          <h1 className="text-2xl font-bold">{profile.display_name}</h1>
          <p className="text-sm text-white/60">{email}</p>
          <p className="text-xs text-white/60">Member since {memberSince}</p>
        </div>
      </div>

      <form onSubmit={save} className="space-y-4 rounded-3xl glass p-6 backdrop-blur-sm">
        <h2 className="text-lg font-bold">Your name</h2>
        <p className="-mt-2 text-sm text-white/60">This is what other students see on your listings and in chats.</p>

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

        {status === 'error' && <p className="rounded-xl bg-rojo/20 px-4 py-2 text-sm text-rosa">{error}</p>}

        <button
          disabled={status === 'saving'}
          className="rounded-full btn-primary px-5 py-2.5 font-semibold disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save changes'}
        </button>
      </form>

      <section className="space-y-4">
        <div id="listings" className="flex scroll-mt-24 items-center justify-between">
          <h2 className="text-lg font-bold">My listings</h2>
          <Link to="/sell" className="flex items-center gap-1 rounded-full btn-primary px-4 py-2 text-sm font-semibold">
            <Plus className="h-4 w-4" /> Sell an item
          </Link>
        </div>
        <div className="flex gap-2">
          {(
            [
              ['active', `Active${active ? ` (${active.length})` : ''}`],
              ['sold', `Sold${sold ? ` (${sold.length})` : ''}`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`min-h-11 rounded-full px-4 py-1.5 text-sm font-medium ${
                tab === value ? 'btn-primary text-white' : 'glass text-white/80 hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-white/50">Open a listing to edit it, mark it as reserved or sold, or delete it.</p>
        <ProductGrid
          listings={tab === 'active' ? active : sold}
          loading={myListings.loading}
          error={myListings.error}
          empty={tab === 'active' ? "You don't have any active listings." : 'Nothing sold yet.'}
        />
      </section>
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/50 focus:border-rosa'

// Tu foto de perfil: tocarla abre la galería del móvil (o el selector de archivos en el ordenador).
function ProfilePhoto({ profile, onSaved }: { profile: Profile; onSaved: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run(task: () => Promise<unknown>) {
    setBusy(true)
    setError('')
    try {
      await task()
      await onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // para poder elegir la misma foto otra vez
    if (file) run(() => uploadAvatar(profile.id, file))
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <label className="group relative block cursor-pointer rounded-full focus-within:ring-2 focus-within:ring-rosa">
        <span className="sr-only">{profile.avatar_url ? 'Change profile photo' : 'Add a profile photo'}</span>
        <input type="file" accept="image/*" onChange={onPick} disabled={busy} className="sr-only" />
        <Avatar name={profile.display_name} url={profile.avatar_url} className="h-20 w-20 text-3xl" />
        <span
          aria-hidden="true"
          className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-noche bg-white text-noche transition group-hover:scale-110"
        >
          <Camera className="h-4 w-4" />
        </span>
        {busy && (
          <span className="keep-dark absolute inset-0 flex items-center justify-center rounded-full bg-noche/70">
            <LoaderCircle aria-label="Uploading" className="h-6 w-6 animate-spin" />
          </span>
        )}
      </label>
      {profile.avatar_url && !busy && (
        <button
          type="button"
          onClick={() => run(() => removeAvatar(profile.id))}
          className="min-h-11 px-2 text-xs font-medium text-white/60 transition hover:text-white"
        >
          Remove photo
        </button>
      )}
      {error && (
        <p role="alert" className="max-w-40 text-center text-xs text-rosa">
          {error}
        </p>
      )}
    </div>
  )
}

export default MyProfilePage
