import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowLeft,
  BellOff,
  BellRing,
  CalendarClock,
  Clock,
  Heart,
  Hourglass,
  Lightbulb,
  MessageCircle,
  MoonStar,
  RotateCcw,
  Search,
  Share,
  SquarePlus,
  Star,
  TrendingDown,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLang, useT } from '../i18n/lang'
import { DEFAULT_PREFS, disablePush, enablePush, fetchPrefs, getPushState, savePref } from '../lib/push'
import type { PrefKey, Prefs, PushState } from '../lib/push'
import { deleteSavedSearch, fetchSavedSearches } from '../lib/savedSearches'
import type { SavedSearch } from '../lib/savedSearches'
import { getCategory } from '../data/categories'
import { formatPrice } from '../lib/format'

// Profile → Notifications: activar los avisos en este móvil, elegir cuáles y ver las búsquedas guardadas.

const TYPES: { key: PrefKey; icon: LucideIcon; label: string; hint: string }[] = [
  { key: 'messages', icon: MessageCircle, label: 'Messages and offers', hint: 'Someone writes to you or answers your offer' },
  { key: 'price_drops', icon: TrendingDown, label: 'Price drops', hint: 'Something in your favourites gets cheaper' },
  { key: 'back_available', icon: RotateCcw, label: 'Available again', hint: 'A reserved favourite is back on sale' },
  { key: 'saved_searches', icon: Search, label: 'Saved searches', hint: 'New listings that match your searches' },
  { key: 'offer_reminders', icon: Hourglass, label: 'Offer reminders', hint: 'An offer has been waiting 24 hours' },
  { key: 'reviews', icon: Star, label: 'Reviews', hint: 'Rate what you bought, or see your new reviews' },
  { key: 'event_reminders', icon: CalendarClock, label: 'Event reminders', hint: 'The day before an event you have a ticket for' },
  { key: 'likes', icon: Heart, label: 'Likes', hint: 'Once a day, how many people saved your listings' },
  { key: 'listing_tips', icon: Lightbulb, label: 'Listing tips', hint: 'A listing has had no news for 2 weeks' },
]

function NotificationSettingsPage() {
  const t = useT()
  const { lang } = useLang()
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [searches, setSearches] = useState<SavedSearch[] | null>(null)

  useEffect(() => {
    getPushState().then(setState)
    fetchPrefs()
      .then(setPrefs)
      .catch(() => setPrefs(DEFAULT_PREFS))
    fetchSavedSearches()
      .then(setSearches)
      .catch(() => setSearches([]))
  }, [])

  async function toggleDevice() {
    setBusy(true)
    setError('')
    try {
      setState(state === 'on' ? await disablePush() : await enablePush(lang))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not turn on notifications. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function change(key: PrefKey, value: boolean) {
    if (!prefs) return
    const before = prefs
    setPrefs({ ...prefs, [key]: value })
    try {
      await savePref(key, value)
    } catch {
      setPrefs(before)
      setError('Could not save. Please try again.')
    }
  }

  async function removeSearch(id: number) {
    const before = searches
    setSearches((current) => current?.filter((search) => search.id !== id) ?? null)
    try {
      await deleteSavedSearch(id)
    } catch {
      setSearches(before)
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
        <h1 className="text-3xl font-bold">{t('Notifications')}</h1>
        <p className="mt-1 text-white/60">{t('Choose what we tell you about, and where.')}</p>
      </div>

      {/* Este dispositivo */}
      <section className="rounded-3xl glass p-5">
        <div className="flex items-start gap-4">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              state === 'on' ? 'bg-gradient-to-br from-carmin to-burdeos' : 'bg-white/10'
            }`}
          >
            {state === 'on' ? <BellRing aria-hidden="true" className="h-6 w-6" /> : <BellOff aria-hidden="true" className="h-6 w-6 text-white/70" />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold">{t('Push notifications on this device')}</h2>
            <p className="mt-0.5 text-sm text-white/60">
              {state === 'on'
                ? t('On. You’ll get notifications even when the app is closed.')
                : state === 'denied'
                  ? t('Blocked in your phone settings. Allow notifications for CentraleMarket there, then come back.')
                  : state === 'install-first'
                    ? t('On iPhone, notifications only work in the installed app.')
                    : state === 'unsupported'
                      ? t('This browser can’t receive notifications. Try Chrome, Safari or the installed app.')
                      : t('Off. Turn them on to know when someone answers you.')}
            </p>
          </div>
        </div>

        {state === 'install-first' && (
          <ol className="mt-4 space-y-2 rounded-2xl bg-white/5 p-4 text-sm text-white/80">
            <li>
              1. {t('In Safari, tap')} <Share aria-hidden="true" className="inline h-4 w-4 align-[-3px] text-rosa" />{' '}
              <strong>{t('Share')}</strong> {t('at the bottom of the screen.')}
            </li>
            <li>
              2. {t('Tap')} <SquarePlus aria-hidden="true" className="inline h-4 w-4 align-[-3px] text-rosa" />{' '}
              <strong>{t('Add to Home Screen')}</strong>.
            </li>
            <li>3. {t('Open CentraleMarket from your home screen and come back here.')}</li>
          </ol>
        )}

        {(state === 'on' || state === 'off') && (
          <button
            type="button"
            onClick={toggleDevice}
            disabled={busy}
            className={`mt-4 min-h-12 w-full rounded-full px-5 font-semibold transition disabled:opacity-60 ${
              state === 'on' ? 'border border-white/20 text-white/85 hover:border-white/40' : 'btn-primary'
            }`}
          >
            {busy ? t('One moment…') : state === 'on' ? t('Turn off on this device') : t('Turn on notifications')}
          </button>
        )}
        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-rojo/20 px-4 py-2 text-sm text-rosa">
            {t(error)}
          </p>
        )}
      </section>

      {/* Qué avisos */}
      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold text-white/60">{t('Notify me about')}</h2>
        <div className="divide-y divide-white/10 overflow-hidden rounded-3xl glass">
          {TYPES.map((type) => (
            <Switch
              key={type.key}
              icon={type.icon}
              label={t(type.label)}
              hint={t(type.hint)}
              checked={prefs?.[type.key] ?? true}
              disabled={!prefs}
              onChange={(value) => change(type.key, value)}
            />
          ))}
        </div>
        <p className="mt-2 px-1 text-xs text-white/60">{t('Everything also appears in the bell, inside the app.')}</p>
      </section>

      <section>
        <div className="overflow-hidden rounded-3xl glass">
          <Switch
            icon={MoonStar}
            label={t('Quiet hours')}
            hint={t('No notifications from 23:00 to 8:00, except messages.')}
            checked={prefs?.quiet_hours ?? true}
            disabled={!prefs}
            onChange={(value) => change('quiet_hours', value)}
          />
        </div>
      </section>

      {/* Búsquedas guardadas */}
      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold text-white/60">{t('Saved searches')}</h2>
        <div className="divide-y divide-white/10 overflow-hidden rounded-3xl glass">
          {searches && searches.length === 0 && (
            <p className="flex items-start gap-3 px-5 py-4 text-sm text-white/60">
              <Search aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              {t('Search something in Market and tap “Save search” to get a notification when a match is listed.')}
            </p>
          )}
          {searches === null && <p className="px-5 py-4 text-sm text-white/60">{t('Loading…')}</p>}
          {searches?.map((search) => (
            <div key={search.id} className="flex min-h-14 items-center gap-3 py-2 pr-2 pl-5">
              <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-white/60" />
              <Link to={searchLink(search)} className="min-w-0 flex-1 py-1 hover:underline">
                <span className="block truncate font-medium">{search.query || t(getCategory(search.category ?? '')?.name ?? 'All items')}</span>
                <span className="block truncate text-xs text-white/60">{describe(search, t)}</span>
              </Link>
              <button
                type="button"
                onClick={() => removeSearch(search.id)}
                aria-label={t('Delete saved search')}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-rosa"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <Link
        to="/notifications"
        className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-5 text-sm font-semibold text-white/85 hover:border-white/40"
      >
        <Clock aria-hidden="true" className="h-4 w-4" /> {t('See your notifications')}
      </Link>
    </div>
  )
}

function searchLink(search: SavedSearch) {
  const params = new URLSearchParams()
  if (search.query) params.set('q', search.query)
  if (search.category) params.set('category', search.category)
  if (search.max_price !== null) params.set('max', String(Number(search.max_price)))
  if (!search.query && !search.category) params.set('all', '1')
  return `/explore?${params}`
}

function describe(search: SavedSearch, t: (text: string, vars?: Record<string, string | number>) => string) {
  const parts: string[] = []
  if (search.query && search.category) parts.push(t(getCategory(search.category)?.name ?? search.category))
  if (search.max_price !== null) parts.push(t('Up to {price}', { price: formatPrice(Number(search.max_price)) }))
  return parts.join(' · ') || t('Any price')
}

function Switch({
  icon: Icon,
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  icon: LucideIcon
  label: string
  hint: string
  checked: boolean
  disabled?: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className={`flex min-h-16 cursor-pointer items-center gap-4 px-5 py-3 ${disabled ? 'opacity-60' : ''}`}>
      <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-white/75" />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        <span className="block text-xs text-white/60">{hint}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      {/* Interruptor tipo iPhone */}
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full bg-white/15 transition peer-checked:bg-carmin peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-rosa after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-[#fff] after:shadow-sm after:transition-transform peer-checked:after:translate-x-5"
      />
    </label>
  )
}

export default NotificationSettingsPage
