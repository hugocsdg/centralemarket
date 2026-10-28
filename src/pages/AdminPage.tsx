import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import {
  ArrowLeft,
  BarChart3,
  Bug,
  Ban,
  CheckCircle2,
  Flag,
  ImageOff,
  Package,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { closeReports, fetchGrowth, fetchReports, fetchStats, searchAllListings, searchUsers, setBan, useIsAdmin } from '../lib/admin'
import type { AdminUser, Growth, GrowthDay, ReportRow, Stats } from '../lib/admin'
import { deleteListing, fetchListing } from '../lib/listings'
import type { Listing } from '../lib/listings'
import { formatPosted, formatPrice } from '../lib/format'
import Avatar from '../components/Avatar'
import { clearErrors, fetchErrors } from '../lib/errors'
import type { ClientError } from '../lib/errors'
import NotFoundPage from './NotFoundPage'
import ListingPhoto from '../components/ListingPhoto'

// Panel de administración (/admin): solo para los administradores (supabase/11_admin.sql).
// Está en inglés y sin traducir: es una herramienta interna para los fundadores.
// Resumen (números) · Denuncias · Usuarios (suspender) · Anuncios (borrar).

type Tab = 'overview' | 'growth' | 'reports' | 'users' | 'listings' | 'errors'

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'growth', label: 'Growth', icon: TrendingUp },
  { id: 'reports', label: 'Reports', icon: Flag },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'listings', label: 'Listings', icon: Package },
  { id: 'errors', label: 'Errors', icon: Bug },
]

const REASONS: Record<string, string> = {
  scam: 'Scam or fraud',
  prohibited: 'Prohibited item',
  offensive: 'Offensive',
  harassment: 'Harassment',
  not_student: 'Not a student',
  spam: 'Spam',
  other: 'Other',
}

function AdminPage() {
  const { session } = useAuth()
  const isAdmin = useIsAdmin(session?.user.id)
  const [tab, setTab] = useState<Tab>('overview')

  if (isAdmin === null) return <p className="py-20 text-center text-white/60">Loading…</p>
  if (!isAdmin) return <NotFoundPage />

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/profile"
        className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-white/70 hover:text-white"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Profile
      </Link>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-carmin to-burdeos">
          <ShieldCheck aria-hidden="true" className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-3xl font-bold">Admin</h1>
          <p className="text-sm text-white/60">Only you and your co-founder can see this page.</p>
        </div>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Admin sections">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition ${
              tab === id ? 'btn-primary text-white' : 'glass text-white/80 hover:bg-white/10'
            }`}
          >
            <Icon aria-hidden="true" className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview onOpenReports={() => setTab('reports')} />}
      {tab === 'growth' && <GrowthTab />}
      {tab === 'reports' && <Reports />}
      {tab === 'users' && <UsersTab currentUserId={session!.user.id} />}
      {tab === 'listings' && <ListingsTab />}
      {tab === 'errors' && <ErrorsTab />}
    </div>
  )
}

// ---------- Resumen ----------

function Overview({ onOpenReports }: { onOpenReports: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(() => setError('Could not load the numbers.'))
  }, [])

  if (error) return <ErrorBox text={error} />
  if (!stats) return <Loading />

  const tiles: { label: string; value: string | number; hint?: string; alert?: boolean; onClick?: () => void }[] = [
    { label: 'Students', value: stats.users, hint: `+${stats.users_week} this week` },
    { label: 'Listings on sale', value: stats.listings_available, hint: `${stats.listings} total · +${stats.listings_week} this week` },
    { label: 'Sold', value: stats.sold },
    { label: 'Conversations', value: stats.conversations, hint: `${stats.messages_week} messages this week` },
    { label: 'Reviews', value: stats.reviews, hint: stats.rating ? `Average ★ ${Number(stats.rating).toFixed(1)}` : 'No reviews yet' },
    { label: 'Open reports', value: stats.open_reports, alert: stats.open_reports > 0, onClick: onOpenReports },
    { label: 'Suspended accounts', value: stats.banned },
    { label: 'Phones with notifications', value: stats.push_devices },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((tile) => {
        const content = (
          <>
            <p className="text-sm text-white/60">{tile.label}</p>
            <p className={`mt-1 font-display text-3xl font-bold ${tile.alert ? 'text-rosa' : ''}`}>{tile.value}</p>
            {tile.hint && <p className="mt-1 text-xs text-white/60">{tile.hint}</p>}
          </>
        )
        return tile.onClick ? (
          <button
            key={tile.label}
            type="button"
            onClick={tile.onClick}
            className={`glass rounded-3xl p-4 text-left transition hover:bg-white/10 ${tile.alert ? 'ring-1 ring-rosa/50' : ''}`}
          >
            {content}
          </button>
        ) : (
          <div key={tile.label} className="glass rounded-3xl p-4">
            {content}
          </div>
        )
      })}
    </div>
  )
}

// ---------- Crecimiento ----------

type Metric = 'joined' | 'active' | 'listings' | 'messages'

const METRICS: { id: Metric; label: string; hint: string }[] = [
  { id: 'joined', label: 'New students', hint: 'accounts created' },
  { id: 'active', label: 'Active', hint: 'students who posted or wrote' },
  { id: 'listings', label: 'Listings', hint: 'new listings' },
  { id: 'messages', label: 'Messages', hint: 'messages sent' },
]

// "3 min ago", "5 h ago", "2 days ago" (el panel está en inglés).
function ago(iso: string | null) {
  if (!iso) return 'never'
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 2) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}

function GrowthTab() {
  const [growth, setGrowth] = useState<Growth | null>(null)
  const [error, setError] = useState('')
  const [range, setRange] = useState(30)
  const [metric, setMetric] = useState<Metric>('joined')
  const [now] = useState(() => Date.now())

  useEffect(() => {
    let alive = true
    fetchGrowth(range)
      .then((data) => alive && setGrowth(data))
      .catch(() => alive && setError('Could not load the numbers (did you run 15_crecimiento.sql?).'))
    return () => {
      alive = false
    }
  }, [range])

  if (error) return <ErrorBox text={error} />
  if (!growth) return <Loading />

  const { totals, funnel } = growth
  const trend = totals.joined_week - totals.joined_prev_week
  const activeShare = totals.users ? Math.round((totals.active_week / totals.users) * 100) : 0
  const tiles = [
    {
      label: 'Students',
      value: totals.users,
      hint: `+${totals.joined_week} this week${trend !== 0 ? ` (${trend > 0 ? '▲' : '▼'} ${Math.abs(trend)} vs last week)` : ''}`,
    },
    { label: 'Joined today', value: totals.joined_today, hint: 'new accounts since midnight' },
    { label: 'Active today', value: totals.active_today, hint: 'opened the app today' },
    { label: 'Active this week', value: totals.active_week, hint: `${activeShare}% of all students` },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="glass rounded-3xl p-4">
            <p className="text-sm text-white/60">{tile.label}</p>
            <p className="mt-1 font-display text-3xl font-bold">{tile.value}</p>
            <p className="mt-1 text-xs text-white/60">{tile.hint}</p>
          </div>
        ))}
      </div>

      <section className="glass space-y-4 rounded-3xl p-4 md:p-6" aria-label="Activity per day">
        <div className="flex flex-wrap items-center gap-2">
          {METRICS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMetric(id)}
              aria-pressed={metric === id}
              className={`min-h-11 rounded-full px-4 text-sm font-medium transition ${
                metric === id ? 'bg-white text-noche' : 'border border-white/15 text-white/80 hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
          <label className="ml-auto flex min-h-11 items-center gap-2 text-sm text-white/60">
            <span className="sr-only">Period</span>
            <select
              value={range}
              onChange={(event) => {
                setGrowth(null)
                setRange(Number(event.target.value))
              }}
              className="min-h-11 rounded-full border border-white/15 bg-transparent px-3 text-sm text-white"
            >
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </label>
        </div>
        <DailyChart days={growth.daily} metric={metric} />
      </section>

      <div className="grid gap-6 md:grid-cols-[2fr_3fr]">
        <section className="glass space-y-4 self-start rounded-3xl p-4 md:p-6" aria-label="Funnel">
          <div>
            <h2 className="font-display text-lg font-bold">From sign-up to sale</h2>
            <p className="text-xs text-white/60">How far students get after creating an account.</p>
          </div>
          <Funnel
            steps={[
              { label: 'Created an account', value: funnel.joined },
              { label: 'Posted or wrote a message', value: funnel.acted },
              { label: 'Posted a listing', value: funnel.listed },
              { label: 'Sold something', value: funnel.sold },
            ]}
          />
          {totals.never_back > 0 && (
            <p className="rounded-2xl bg-white/5 px-4 py-3 text-xs text-white/70">
              <strong className="text-white">{totals.never_back}</strong> joined more than 2 days ago and never came back after
              their first day.
            </p>
          )}
        </section>

        <section className="glass overflow-hidden rounded-3xl" aria-label="Latest students">
          <div className="px-4 pt-4 md:px-6 md:pt-6">
            <h2 className="font-display text-lg font-bold">Latest to join</h2>
            <p className="text-xs text-white/60">Newest first · “seen” = last time they opened the app.</p>
          </div>
          {growth.latest.length === 0 ? (
            <p className="p-6 text-sm text-white/60">Nobody yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/10 md:max-h-[560px] md:overflow-y-auto">
              {growth.latest.map((user) => {
                const online = user.last_seen && now - new Date(user.last_seen).getTime() < 15 * 60_000
                return (
                  <li key={user.id} className="flex items-center gap-3 px-4 py-3 md:px-6">
                    <span className="relative shrink-0">
                      <Avatar name={user.display_name} url={user.avatar_url} className="h-11 w-11 text-base" />
                      {online && (
                        <span
                          className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-noche bg-emerald-400"
                          title="Using the app now"
                        />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2">
                        <Link to={`/user/${user.id}`} className="truncate font-semibold hover:underline">
                          {user.display_name}
                        </Link>
                        <span className="shrink-0 text-xs text-white/60">joined {ago(user.created_at)}</span>
                      </p>
                      <p className="truncate text-xs text-white/60">{user.email}</p>
                      <p className="text-xs text-white/60">
                        {online ? (
                          <span className="font-semibold text-emerald-400">Online now</span>
                        ) : user.last_seen ? (
                          `Seen ${ago(user.last_seen)}`
                        ) : (
                          'Never seen'
                        )}
                        {' · '}
                        {user.listings} listings · {user.messages} messages{user.push && ' · notifications on'}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

// Barras por día. Al pasar el ratón o tocar una barra se ve el día y la cifra.
function DailyChart({ days, metric }: { days: GrowthDay[]; metric: Metric }) {
  const [picked, setPicked] = useState<number | null>(null)
  const values = days.map((day) => day[metric])
  const max = Math.max(1, ...values)
  const total = values.reduce((sum, value) => sum + value, 0)
  const info = METRICS.find((item) => item.id === metric)!
  const shown = picked !== null ? days[picked] : null
  const label = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div>
      <p className="text-sm text-white/60" aria-live="polite">
        {shown ? (
          <>
            <span className="font-display text-2xl font-bold text-white">{shown[metric]}</span> {info.hint} on {label(shown.day)}
          </>
        ) : (
          <>
            <span className="font-display text-2xl font-bold text-white">{total}</span> {info.hint} in {days.length} days
          </>
        )}
      </p>
      <div
        className="mt-4 flex h-44 items-end gap-[3px]"
        role="img"
        aria-label={`${info.label} per day: ${total} in ${days.length} days`}
        onMouseLeave={() => setPicked(null)}
      >
        {days.map((day, index) => {
          const value = day[metric]
          const isToday = index === days.length - 1
          return (
            <button
              key={day.day}
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              onMouseEnter={() => setPicked(index)}
              onClick={() => setPicked(picked === index ? null : index)}
              className="group flex h-full min-w-0 flex-1 items-end"
            >
              <span
                className={`block w-full rounded-t-[3px] transition-colors ${
                  picked === index ? 'bg-rosa' : isToday ? 'bg-carmin' : 'bg-white/25 group-hover:bg-white/45'
                }`}
                style={{ height: value ? `${Math.max(4, (value / max) * 100)}%` : '2px' }}
              />
            </button>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-white/60">
        <span>{label(days[0].day)}</span>
        <span>Today</span>
      </div>
    </div>
  )
}

function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const top = Math.max(1, steps[0].value)
  return (
    <ol className="space-y-3">
      {steps.map((step, index) => {
        const share = Math.round((step.value / top) * 100)
        return (
          <li key={step.label}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-white/80">{step.label}</span>
              <span>
                <strong className="font-display">{step.value}</strong>
                {index > 0 && <span className="ml-1.5 text-xs text-white/60">{share}%</span>}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-carmin to-rosa"
                style={{ width: `${step.value ? Math.max(3, share) : 0}%` }}
              />
            </div>
          </li>
        )
      })}
    </ol>
  )
}

// ---------- Denuncias ----------

function Reports() {
  const [view, setView] = useState<'open' | 'closed'>('open')
  const [reports, setReports] = useState<ReportRow[] | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<number | null>(null)

  const load = useCallback(() => {
    fetchReports(view)
      .then(setReports)
      .catch(() => setError('Could not load the reports.'))
  }, [view])

  useEffect(load, [load])

  async function act(report: ReportRow, action: 'dismiss' | 'delete' | 'ban') {
    if (action === 'delete' && !window.confirm(`Delete “${report.listing_title}” for good? Its photos and chats are deleted too.`)) return
    let reason: string | null = null
    if (action === 'ban') {
      reason = window.prompt(`Suspend ${report.against}? Write the reason (they will see it):`, REASONS[report.reason] ?? '')
      if (reason === null) return
    }
    setBusy(report.id)
    setError('')
    try {
      // Todas las denuncias abiertas sobre lo mismo se cierran a la vez.
      const same = (reports ?? []).filter(
        (other) =>
          other.status === 'open' &&
          (report.listing_id ? other.listing_id === report.listing_id : other.reported_user_id === report.reported_user_id),
      )
      const ids = same.length ? same.map((other) => other.id) : [report.id]
      if (action === 'delete' && report.listing_id) {
        const listing = await fetchListing(report.listing_id)
        if (listing) await deleteListing(listing)
      }
      if (action === 'ban' && report.against_id) await setBan(report.against_id, true, reason ?? undefined)
      await closeReports(ids, action === 'dismiss' ? 'dismissed' : 'resolved')
      load()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['open', 'closed'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setReports(null)
              setView(value)
            }}
            aria-pressed={view === value}
            className={`min-h-11 rounded-full px-4 text-sm font-medium transition ${
              view === value ? 'bg-white text-noche' : 'glass text-white/80 hover:bg-white/10'
            }`}
          >
            {value === 'open' ? 'To review' : 'Closed'}
          </button>
        ))}
      </div>
      {error && <ErrorBox text={error} />}
      {!reports ? (
        <Loading />
      ) : reports.length === 0 ? (
        <Empty icon={CheckCircle2} text={view === 'open' ? 'No reports to review. All good!' : 'No closed reports yet.'} />
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => (
            <li key={report.id} className="glass space-y-3 rounded-3xl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-rojo/20 px-3 py-1 text-xs font-semibold text-rosa">
                  {REASONS[report.reason] ?? report.reason}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                  {report.type === 'listing' ? 'Listing' : 'Student'}
                </span>
                {report.status !== 'open' && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">{report.status}</span>
                )}
                <span className="ml-auto text-xs text-white/60">{formatPosted(report.created_at)}</span>
              </div>
              <p className="text-sm">
                <span className="text-white/60">From</span> <strong>{report.reported_by}</strong>{' '}
                <span className="text-white/60">about</span>{' '}
                {report.listing_id ? (
                  <Link to={`/item/${report.listing_id}`} className="font-semibold text-rosa hover:underline">
                    {report.listing_title ?? 'a deleted listing'}
                  </Link>
                ) : (
                  <Link to={`/user/${report.reported_user_id}`} className="font-semibold text-rosa hover:underline">
                    {report.against}
                  </Link>
                )}
                {report.listing_id && report.against && (
                  <>
                    {' '}
                    <span className="text-white/60">by</span>{' '}
                    <Link to={`/user/${report.against_id}`} className="font-semibold hover:underline">
                      {report.against}
                    </Link>
                  </>
                )}
              </p>
              {report.details && <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/80">“{report.details}”</p>}
              {report.status === 'open' && (
                <div className="flex flex-wrap gap-2">
                  <ActionButton icon={RotateCcw} disabled={busy === report.id} onClick={() => act(report, 'dismiss')}>
                    No problem
                  </ActionButton>
                  {report.listing_id && report.listing_title && (
                    <ActionButton icon={Trash2} danger disabled={busy === report.id} onClick={() => act(report, 'delete')}>
                      Delete listing
                    </ActionButton>
                  )}
                  {report.against_id && (
                    <ActionButton icon={Ban} danger disabled={busy === report.id} onClick={() => act(report, 'ban')}>
                      Suspend {report.against}
                    </ActionButton>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-white/60">
        “No problem” closes the report (a listing hidden by 3 reports becomes visible again). Deleting or suspending
        also closes all open reports about the same listing or student.
      </p>
    </div>
  )
}

// ---------- Usuarios ----------

function UsersTab({ currentUserId }: { currentUserId: string }) {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback((text: string) => {
    searchUsers(text)
      .then(setUsers)
      .catch(() => setError('Could not load the students.'))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => load(search), 300)
    return () => clearTimeout(timer)
  }, [search, load])

  async function toggleBan(user: AdminUser) {
    let reason: string | null = null
    if (!user.banned_at) {
      reason = window.prompt(`Suspend ${user.display_name}? Write the reason (they will see it):`)
      if (reason === null) return
    } else if (!window.confirm(`Reactivate ${user.display_name}'s account?`)) return
    setBusy(user.id)
    try {
      await setBan(user.id, !user.banned_at, reason ?? undefined)
      load(search)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <SearchBox value={search} onChange={setSearch} placeholder="Search by name or email" />
      {error && <ErrorBox text={error} />}
      {!users ? (
        <Loading />
      ) : users.length === 0 ? (
        <Empty icon={Users} text="No students found." />
      ) : (
        <ul className="divide-y divide-white/10 overflow-hidden rounded-3xl glass">
          {users.map((user) => (
            <li key={user.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Avatar name={user.display_name} url={user.avatar_url} className="h-11 w-11 text-base" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  <Link to={`/user/${user.id}`} className="truncate hover:underline">
                    {user.display_name}
                  </Link>
                  {user.banned_at && (
                    <span className="rounded-full bg-rojo/20 px-2 py-0.5 text-[11px] font-bold text-rosa">Suspended</span>
                  )}
                </p>
                <p className="truncate text-xs text-white/60">{user.email}</p>
                <p className="text-xs text-white/60">
                  Joined {formatPosted(user.created_at).toLowerCase()} · {user.listings} listings
                  {user.rating !== null && ` · ★ ${Number(user.rating).toFixed(1)}`}
                  {user.reports > 0 && <span className="font-semibold text-rosa"> · {user.reports} open reports</span>}
                </p>
                {user.banned_at && user.ban_reason && <p className="text-xs text-white/60">Reason: {user.ban_reason}</p>}
              </div>
              {user.id !== currentUserId && (
                <ActionButton
                  icon={user.banned_at ? RotateCcw : Ban}
                  danger={!user.banned_at}
                  disabled={busy === user.id}
                  onClick={() => toggleBan(user)}
                >
                  {user.banned_at ? 'Reactivate' : 'Suspend'}
                </ActionButton>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------- Anuncios ----------

function ListingsTab() {
  const [search, setSearch] = useState('')
  const [listings, setListings] = useState<Listing[] | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<number | null>(null)

  const load = useCallback((text: string) => {
    searchAllListings(text)
      .then(setListings)
      .catch(() => setError('Could not load the listings.'))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => load(search), 300)
    return () => clearTimeout(timer)
  }, [search, load])

  async function remove(listing: Listing) {
    if (!window.confirm(`Delete “${listing.title}” for good? Its photos and chats are deleted too.`)) return
    setBusy(listing.id)
    try {
      await deleteListing(listing)
      setListings((current) => current?.filter((item) => item.id !== listing.id) ?? null)
    } catch {
      setError('Could not delete the listing.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <SearchBox value={search} onChange={setSearch} placeholder="Search listings by title" />
      {error && <ErrorBox text={error} />}
      {!listings ? (
        <Loading />
      ) : listings.length === 0 ? (
        <Empty icon={Package} text="No listings found." />
      ) : (
        <ul className="divide-y divide-white/10 overflow-hidden rounded-3xl glass">
          {listings.map((listing) => {
            const cover = [...listing.images].sort((a, b) => a.position - b.position)[0]
            return (
              <li key={listing.id} className="flex items-center gap-3 px-4 py-3">
                <Link to={`/item/${listing.id}`} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/5">
                  {cover ? (
                    <ListingPhoto path={cover.path} className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff aria-hidden="true" className="absolute inset-0 m-auto h-5 w-5 text-white/20" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/item/${listing.id}`} className="block truncate font-semibold hover:underline">
                    {listing.title}
                  </Link>
                  <p className="truncate text-xs text-white/60">
                    {formatPrice(listing.price, listing.price_unit)} · {listing.status} · by {listing.seller?.display_name} ·{' '}
                    {formatPosted(listing.created_at).toLowerCase()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(listing)}
                  disabled={busy === listing.id}
                  aria-label={`Delete ${listing.title}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-rojo/20 hover:text-rosa disabled:opacity-50"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ---------- Errores ----------

// Los errores iguales se agrupan: cuántas veces, cuándo fue el último, en qué pantallas y versiones.
function ErrorsTab() {
  const [errors, setErrors] = useState<ClientError[] | null>(null)
  const [failed, setFailed] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const load = useCallback(() => {
    fetchErrors()
      .then(setErrors)
      .catch(() => setFailed('Could not load the errors (did you run 12_errores.sql?).'))
  }, [])

  useEffect(load, [load])

  const groups = Object.values(
    (errors ?? []).reduce<Record<string, ClientError[]>>((all, error) => {
      ;(all[error.message] ??= []).push(error)
      return all
    }, {}),
  )

  async function clear(group: ClientError[]) {
    await clearErrors(group.map((error) => error.id)).catch(() => setFailed('Could not delete.'))
    load()
  }

  return (
    <div className="space-y-4">
      {failed && <ErrorBox text={failed} />}
      {!errors && !failed ? (
        <Loading />
      ) : groups.length === 0 ? (
        <Empty icon={CheckCircle2} text="No errors. Everything is running smoothly." />
      ) : (
        <ul className="space-y-3">
          {groups.map((group) => {
            const last = group[0]
            const pages = [...new Set(group.map((error) => error.page).filter(Boolean))].slice(0, 4)
            const versions = [...new Set(group.map((error) => error.app_version).filter(Boolean))].slice(0, 3)
            return (
              <li key={last.message} className="glass space-y-2 rounded-3xl p-4">
                <div className="flex items-start gap-3">
                  <Bug aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-rosa" />
                  <p className="min-w-0 flex-1 font-mono text-sm break-words">{last.message}</p>
                  <span className="shrink-0 rounded-full bg-rojo/20 px-2.5 py-0.5 text-xs font-bold text-rosa">×{group.length}</span>
                </div>
                <p className="text-xs text-white/60">
                  Last {formatPosted(last.created_at).toLowerCase()} · {pages.join(', ') || '—'} · version {versions.join(', ') || '—'}
                </p>
                <p className="truncate text-xs text-white/60">{last.user_agent}</p>
                <div className="flex flex-wrap gap-2">
                  {last.stack && (
                    <ActionButton icon={Search} onClick={() => setOpen(open === last.message ? null : last.message)}>
                      {open === last.message ? 'Hide details' : 'Details'}
                    </ActionButton>
                  )}
                  <ActionButton icon={CheckCircle2} onClick={() => clear(group)}>
                    Fixed — clear
                  </ActionButton>
                </div>
                {open === last.message && last.stack && (
                  <pre className="max-h-64 overflow-auto rounded-2xl bg-white/5 p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-white/75">
                    {last.stack}
                  </pre>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <p className="text-xs text-white/60">
        Errors from students’ phones and computers (no personal data). Copy the details to Claude to fix them. Errors older
        than 60 days are deleted automatically.
      </p>
    </div>
  )
}

// ---------- Piezas pequeñas ----------

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-3 focus-within:border-rosa/60">
      <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-white/50" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={placeholder}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-white/50"
      />
    </label>
  )
}

function ActionButton({
  icon: Icon,
  danger,
  disabled,
  onClick,
  children,
}: {
  icon: LucideIcon
  danger?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition disabled:opacity-50 ${
        danger ? 'border border-rojo/50 text-rosa hover:bg-rojo/20' : 'border border-white/20 text-white/85 hover:border-white/40'
      }`}
    >
      <Icon aria-hidden="true" className="h-4 w-4" /> {children}
    </button>
  )
}

function Loading() {
  return <p className="py-10 text-center text-sm text-white/60">Loading…</p>
}

function ErrorBox({ text }: { text: string }) {
  return (
    <p role="alert" className="rounded-2xl bg-rojo/20 px-4 py-3 text-sm text-rosa">
      {text}
    </p>
  )
}

function Empty({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="glass rounded-3xl p-10 text-center text-sm text-white/60">
      <Icon aria-hidden="true" className="mx-auto mb-2 h-7 w-7 text-rosa" />
      {text}
    </div>
  )
}

export default AdminPage
