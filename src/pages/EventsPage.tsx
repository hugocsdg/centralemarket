import { Link, useSearchParams } from 'react-router'
import { PartyPopper, Plus } from 'lucide-react'
import { fetchEvents } from '../lib/listings'
import type { Listing } from '../lib/listings'
import { dateBadge, startOfDay } from '../lib/format'
import { useAuth } from '../lib/auth'
import { useQuery } from '../lib/useQuery'
import SpaceTabs from '../components/SpaceTabs'
import EventCard from '../components/EventCard'
import LoginPrompt from '../components/LoginPrompt'
import { useT } from '../i18n/lang'
import { currentLocale } from '../i18n/core'

// Cuántos días se enseñan en la tira de fechas.
const DAYS = 14

// "2026-10-25" de una fecha, en la hora local (para la URL ?day=…).
function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// Los eventos agrupados como en una app de entradas: esta noche, mañana, esta semana y más adelante.
function groupEvents(events: Listing[]) {
  const tomorrow = startOfDay(1)
  const dayAfter = startOfDay(2)
  const nextWeek = startOfDay(7)
  const groups: { title: string; events: Listing[] }[] = [
    { title: 'Tonight', events: [] },
    { title: 'Tomorrow', events: [] },
    { title: 'This week', events: [] },
    { title: 'Later', events: [] },
  ]
  for (const event of events) {
    const at = new Date(event.event_at!)
    const index = at < tomorrow ? 0 : at < dayAfter ? 1 : at < nextWeek ? 2 : 3
    groups[index].events.push(event)
  }
  return groups.filter((group) => group.events.length > 0)
}

function EventsPage() {
  const { session } = useAuth()
  const [params, setParams] = useSearchParams()
  const day = params.get('day') ?? ''
  const t = useT()
  const { data, loading, error } = useQuery(session ? 'events' : null, () => fetchEvents())

  const days = Array.from({ length: DAYS }, (_, index) => startOfDay(index))
  // Días con algún evento (para el puntito rojo de la tira).
  const busyDays = new Set(data?.map((event) => dayKey(new Date(event.event_at!))))
  const shown = day ? data?.filter((event) => dayKey(new Date(event.event_at!)) === day) : data
  const [featured, ...rest] = shown ?? []

  function pickDay(key: string) {
    setParams(key && key !== day ? { day: key } : {}, { replace: true })
  }

  return (
    <div className="space-y-6">
      <SpaceTabs />

      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">{t('Events')}</h1>
          <p className="mt-1 text-sm text-white/60">{t('Parties, concerts and gigs — tickets from fellow students.')}</p>
        </div>
        <Link
          to="/sell?category=tickets"
          className="btn-primary flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> <span className="sm:hidden">{t('Sell')}</span>
          <span className="hidden sm:inline">{t('Sell a ticket')}</span>
        </Link>
      </div>

      {/* Tira de fechas: toca un día para ver solo sus eventos */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label={t('Pick a day')}>
        <button
          onClick={() => pickDay('')}
          aria-pressed={!day}
          className={`flex h-16 min-w-16 shrink-0 flex-col items-center justify-center rounded-2xl px-3 text-sm font-semibold transition ${
            !day ? 'btn-primary text-white' : 'glass text-white/80 hover:bg-white/10'
          }`}
        >
          {t('All')}
        </button>
        {days.map((date, index) => {
          const key = dayKey(date)
          const badge = dateBadge(date.toISOString())
          const active = day === key
          return (
            <button
              key={key}
              onClick={() => pickDay(key)}
              aria-pressed={active}
              aria-label={date.toLocaleDateString(currentLocale(), { weekday: 'long', day: 'numeric', month: 'long' })}
              className={`relative flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl leading-none transition ${
                active ? 'btn-primary text-white' : 'glass text-white/80 hover:bg-white/10'
              }`}
            >
              <span className={`text-[11px] font-bold ${active ? 'text-white/85' : 'text-white/60'}`}>
                {index === 0 ? t('TODAY') : badge.weekday}
              </span>
              <span className="mt-1 font-display text-xl font-bold">{badge.day}</span>
              {busyDays.has(key) && !active && (
                <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-carmin" aria-hidden="true" />
              )}
            </button>
          )
        })}
      </div>

      {!session ? (
        <LoginPrompt title={t("See what's on around campus")} />
      ) : error ? (
        <p className="rounded-2xl border border-rojo/40 bg-rojo/10 p-6 text-center text-rosa">{t(error)}</p>
      ) : loading || !shown ? (
        <div className="space-y-4">
          <div className="glass aspect-[4/5] animate-pulse rounded-3xl sm:aspect-[16/9]" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="glass aspect-[3/4] animate-pulse rounded-3xl" />
            ))}
          </div>
        </div>
      ) : shown.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center">
          <PartyPopper className="mx-auto h-9 w-9 text-rosa" />
          <h2 className="mt-3 text-xl font-bold">{t(day ? 'Nothing on that day (yet)' : 'No upcoming events yet')}</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-white/60">
            {t("Organising a party or can't make it to a concert? Put your tickets here — students will find them.")}
          </p>
          <Link to="/sell?category=tickets" className="btn-primary mt-5 inline-block rounded-full px-5 py-2.5 text-sm font-semibold">
            {t('Sell a ticket')}
          </Link>
        </div>
      ) : day ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((event) => (
            <EventCard key={event.id} listing={event} />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          <section>
            <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-rosa uppercase">{t('Next up')}</p>
            <EventCard listing={featured} featured />
          </section>
          {groupEvents(rest).map((group) => (
            <section key={group.title}>
              <h2 className="mb-4 text-2xl font-bold">{t(group.title)}</h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {group.events.map((event) => (
                  <EventCard key={event.id} listing={event} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-white/60">
        {t('Tickets are resold by students. Only buy tickets the organiser allows to be resold, and meet in person to check them.')}
      </p>
    </div>
  )
}

export default EventsPage
