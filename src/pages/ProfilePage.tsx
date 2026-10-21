import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Bell,
  ChevronRight,
  CircleHelp,
  Heart,
  KeyRound,
  Languages,
  LogOut,
  Mail,
  Monitor,
  Moon,
  Palette,
  ScrollText,
  ShieldCheck,
  Lock,
  Star,
  Sun,
  Tag,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Avatar from '../components/Avatar'
import { useAuth } from '../lib/auth'
import { setTheme, useTheme } from '../lib/theme'
import type { ThemeChoice } from '../lib/theme'
import { useLang, useT } from '../i18n/lang'
import { LANGUAGES } from '../i18n/core'
import type { Lang } from '../i18n/core'

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
      { icon: KeyRound, label: 'Password', to: '/profile/password' },
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
  const t = useT()

  if (!profile) {
    return <p className="py-20 text-center text-white/60">{t('Loading your profile…')}</p>
  }

  async function logOut() {
    setLeaving(true)
    await signOut()
    navigate('/welcome', { replace: true })
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">{t('Profile')}</h1>

      {/* Tu tarjeta: lleva a My profile */}
      <Link to="/profile/me" className="flex items-center gap-4 rounded-3xl glass p-4 transition hover:bg-white/10">
        <Avatar name={profile.display_name} url={profile.avatar_url} className="h-16 w-16 text-2xl" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold">{profile.display_name}</p>
          <p className="text-sm text-white/60">{t('View my profile')}</p>
        </div>
        <ChevronRight aria-hidden="true" className="h-5 w-5 text-white/60" />
      </Link>

      {SECTIONS.map((section) => (
        <MenuGroup key={section.title} title={t(section.title)}>
          {section.items.map((item) =>
            item.to && !item.soon ? (
              <Link key={item.label} to={item.to} className={`${rowClass} hover:bg-white/5`}>
                <item.icon aria-hidden="true" className="h-5 w-5 shrink-0 text-white/75" />
                <span className="flex-1 font-medium">{t(item.label)}</span>
                <ChevronRight aria-hidden="true" className="h-5 w-5 text-white/60" />
              </Link>
            ) : (
              <div key={item.label} className={`${rowClass} text-white/60`} aria-disabled="true">
                <item.icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                <span className="flex-1 font-medium">{t(item.label)}</span>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/70">{t('Soon')}</span>
              </div>
            ),
          )}
          {section.title === 'Settings' && (
            <>
              <LanguageRow />
              <AppearanceRow />
            </>
          )}
        </MenuGroup>
      ))}

      <MenuGroup title={t('Account')}>
        <button type="button" onClick={logOut} disabled={leaving} className={`${rowClass} hover:bg-white/5`}>
          <LogOut aria-hidden="true" className="h-5 w-5 shrink-0 text-white/75" />
          <span className="flex-1 font-medium">{t(leaving ? 'Logging out…' : 'Log out')}</span>
        </button>
        <Link to="/profile/delete" className={`${rowClass} text-rosa hover:bg-rojo/10`}>
          <Trash2 aria-hidden="true" className="h-5 w-5 shrink-0" />
          <span className="flex-1 font-medium">{t('Delete account')}</span>
          <ChevronRight aria-hidden="true" className="h-5 w-5 opacity-70" />
        </Link>
      </MenuGroup>

      <p className="pb-4 text-center text-xs text-white/60">
        CentraleMarket · Beta
        <br />
        {t('An independent student initiative for the CentraleSupélec community.')}
      </p>
    </div>
  )
}

// Modo oscuro / claro / automático (como el móvil). Se guarda en este dispositivo.
const THEMES: { value: ThemeChoice; label: string; icon: LucideIcon }[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'Auto', icon: Monitor },
]

// Idioma de la app: lista nativa del móvil con los idiomas escritos en su propia lengua.
function LanguageRow() {
  const { lang, setLang, t } = useLang()
  return (
    <label className={`${rowClass} relative cursor-pointer hover:bg-white/5`}>
      <Languages aria-hidden="true" className="h-5 w-5 shrink-0 text-white/75" />
      <span className="flex-1 font-medium">{t('Language')}</span>
      <span className="text-sm text-white/60">{LANGUAGES.find((language) => language.id === lang)?.name}</span>
      <ChevronRight aria-hidden="true" className="h-5 w-5 text-white/60" />
      <select
        aria-label={t('Language')}
        value={lang}
        onChange={(event) => setLang(event.target.value as Lang)}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        {LANGUAGES.map((language) => (
          <option key={language.id} value={language.id} lang={language.id}>
            {language.name}
          </option>
        ))}
      </select>
    </label>
  )
}

function AppearanceRow() {
  const theme = useTheme()
  const t = useT()
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3">
      <Palette aria-hidden="true" className="h-5 w-5 shrink-0 text-white/75" />
      <span id="appearance-label" className="flex-1 font-medium">
        {t('Appearance')}
      </span>
      <div
        role="radiogroup"
        aria-labelledby="appearance-label"
        className="grid w-full grid-cols-3 gap-1 rounded-full bg-white/5 p-1 sm:w-auto"
      >
        {THEMES.map((option) => {
          const active = theme === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(option.value)}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold transition ${
                active ? 'bg-white text-noche shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              <option.icon aria-hidden="true" className="h-4 w-4" />
              {t(option.label)}
            </button>
          )
        })}
      </div>
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
