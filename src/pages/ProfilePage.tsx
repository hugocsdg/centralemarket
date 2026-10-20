import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Bell,
  ChevronRight,
  CircleHelp,
  Heart,
  Languages,
  LogOut,
  Mail,
  ScrollText,
  ShieldCheck,
  Lock,
  Star,
  Tag,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Avatar from '../components/Avatar'
import { useAuth } from '../lib/auth'

// Profile: un menú ordenado por secciones (como Vinted).
// Arriba tu tarjeta (lleva a My profile); luego tus cosas, ajustes, ayuda, legal y, al final, la cuenta.

type Item = {
  icon: LucideIcon
  label: string
  to?: string
  soon?: boolean // aún no disponible: se ve, pero no se puede abrir
}

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: 'My stuff',
    items: [
      { icon: Heart, label: 'Favourite items', to: '/favorites' },
      { icon: Tag, label: 'My listings', to: '/profile/me#listings' },
      { icon: Star, label: 'My reviews', to: '/user/me' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { icon: Bell, label: 'Notifications', to: '/notifications' },
      { icon: Languages, label: 'Language', soon: true },
    ],
  },
  {
    title: 'Help',
    items: [
      { icon: CircleHelp, label: 'How CentraleMarket works', to: '/info/how-it-works' },
      { icon: ShieldCheck, label: 'Safety tips', to: '/info/safety' },
      { icon: Mail, label: 'Contact us', soon: true },
    ],
  },
  {
    title: 'Legal',
    items: [
      { icon: ScrollText, label: 'Community rules', to: '/info/rules' },
      { icon: Lock, label: 'Privacy policy', to: '/info/privacy' },
    ],
  },
]

const rowClass = 'flex min-h-14 w-full items-center gap-4 px-5 py-3 text-left transition'

function ProfilePage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [leaving, setLeaving] = useState(false)

  if (!profile) {
    return <p className="py-20 text-center text-white/60">Loading your profile…</p>
  }

  async function logOut() {
    setLeaving(true)
    await signOut()
    navigate('/welcome', { replace: true })
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>

      {/* Tu tarjeta: lleva a My profile */}
      <Link to="/profile/me" className="flex items-center gap-4 rounded-3xl glass p-4 transition hover:bg-white/10">
        <Avatar name={profile.display_name} url={profile.avatar_url} className="h-16 w-16 text-2xl" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold">{profile.display_name}</p>
          <p className="text-sm text-white/60">View my profile</p>
        </div>
        <ChevronRight aria-hidden="true" className="h-5 w-5 text-white/60" />
      </Link>

      {SECTIONS.map((section) => (
        <MenuGroup key={section.title} title={section.title}>
          {section.items.map((item) =>
            item.to && !item.soon ? (
              <Link key={item.label} to={item.to} className={`${rowClass} hover:bg-white/5`}>
                <item.icon aria-hidden="true" className="h-5 w-5 shrink-0 text-white/75" />
                <span className="flex-1 font-medium">{item.label}</span>
                <ChevronRight aria-hidden="true" className="h-5 w-5 text-white/60" />
              </Link>
            ) : (
              <div key={item.label} className={`${rowClass} text-white/60`} aria-disabled="true">
                <item.icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                <span className="flex-1 font-medium">{item.label}</span>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/70">Soon</span>
              </div>
            ),
          )}
        </MenuGroup>
      ))}

      <MenuGroup title="Account">
        <button type="button" onClick={logOut} disabled={leaving} className={`${rowClass} hover:bg-white/5`}>
          <LogOut aria-hidden="true" className="h-5 w-5 shrink-0 text-white/75" />
          <span className="flex-1 font-medium">{leaving ? 'Logging out…' : 'Log out'}</span>
        </button>
        <Link to="/profile/delete" className={`${rowClass} text-rosa hover:bg-rojo/10`}>
          <Trash2 aria-hidden="true" className="h-5 w-5 shrink-0" />
          <span className="flex-1 font-medium">Delete account</span>
          <ChevronRight aria-hidden="true" className="h-5 w-5 opacity-70" />
        </Link>
      </MenuGroup>

      <p className="pb-4 text-center text-xs text-white/60">
        CentraleMarket · Beta
        <br />
        An independent student initiative for the CentraleSupélec community.
      </p>
    </div>
  )
}

// Un grupo del menú: título pequeño encima y las filas dentro de una tarjeta, separadas por líneas finas.
function MenuGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-sm font-semibold text-white/60">{title}</h2>
      <div className="divide-y divide-white/10 overflow-hidden rounded-3xl glass">{children}</div>
    </section>
  )
}

export default ProfilePage
