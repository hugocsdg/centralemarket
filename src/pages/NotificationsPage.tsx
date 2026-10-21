import { Fragment, useEffect } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Bell, CalendarClock, Heart, Hourglass, ImageOff, Lightbulb, RotateCcw, Search, Settings, Star, TrendingDown } from 'lucide-react'
import { fetchNotifications, markAllNotificationsRead } from '../lib/notifications'
import type { Notification } from '../lib/notifications'
import { imageUrl } from '../lib/listings'
import { formatPosted, formatPrice } from '../lib/format'
import { useQuery } from '../lib/useQuery'
import { useAuth } from '../lib/auth'
import { useT } from '../i18n/lang'
import PushPrompt from '../components/PushPrompt'

// Qué dice cada aviso y adónde lleva al tocarlo.
// Rellena una frase traducida con trozos con estilo: rich('{title} dropped', { title: <b>…</b> }).
function rich(text: string, parts: Record<string, ReactNode>) {
  return text.split(/(\{\w+\})/).map((piece, index) => {
    const name = piece.match(/^\{(\w+)\}$/)?.[1]
    return <Fragment key={index}>{name && name in parts ? parts[name] : piece}</Fragment>
  })
}

function describe(notification: Notification, userId: string, t: (text: string, vars?: Record<string, string | number>) => string) {
  const title = notification.listing?.title ?? t('A listing')
  switch (notification.kind) {
    case 'price_drop':
      return {
        icon: TrendingDown,
        text: (
          <>
            {rich(t('{title} dropped from {old} to {new}'), {
              title: <span className="font-semibold">{title}</span>,
              old: <span className="line-through">{formatPrice(Number(notification.old_price))}</span>,
              new: <span className="font-semibold text-rosa">{formatPrice(Number(notification.new_price))}</span>,
            })}
          </>
        ),
        to: `/item/${notification.listing_id}`,
      }
    case 'rate_seller':
      return {
        icon: Star,
        text: (
          <>{rich(t('You bought {title}. How did it go? Rate the seller.'), { title: <span className="font-semibold">{title}</span> })}</>
        ),
        to: `/item/${notification.listing_id}?rate=1`,
      }
    case 'back_available':
      return {
        icon: RotateCcw,
        text: <>{rich(t('{title} is available again.'), { title: <span className="font-semibold">{title}</span> })}</>,
        to: `/item/${notification.listing_id}`,
      }
    case 'saved_search':
      return {
        icon: Search,
        text: <>{rich(t('New match for your saved search: {title}'), { title: <span className="font-semibold">{title}</span> })}</>,
        to: `/item/${notification.listing_id}`,
      }
    case 'offer_reminder':
      return {
        icon: Hourglass,
        text: (
          <>
            {rich(t('An offer of {amount} for {title} is waiting for your answer.'), {
              amount: <span className="font-semibold text-rosa">{formatPrice(Number(notification.new_price))}</span>,
              title: <span className="font-semibold">{title}</span>,
            })}
          </>
        ),
        to: notification.conversation_id ? `/messages/${notification.conversation_id}` : `/item/${notification.listing_id}`,
      }
    case 'event_tomorrow':
      return {
        icon: CalendarClock,
        text: <>{rich(t('{title} is tomorrow. Don’t forget your ticket!'), { title: <span className="font-semibold">{title}</span> })}</>,
        to: `/item/${notification.listing_id}`,
      }
    case 'likes':
      return {
        icon: Heart,
        text: <>{t(notification.amount === 1 ? '1 person saved your listings today.' : '{n} people saved your listings today.', { n: notification.amount ?? 0 })}</>,
        to: `/item/${notification.listing_id}`,
      }
    case 'stale_listing':
      return {
        icon: Lightbulb,
        text: (
          <>
            {rich(t('Is {title} still available? Lower the price or mark it as sold.'), {
              title: <span className="font-semibold">{title}</span>,
            })}
          </>
        ),
        to: `/item/${notification.listing_id}`,
      }
    case 'new_review':
      return {
        icon: Star,
        text: (
          <>
            {rich(t('A buyer gave you {stars} for {title}'), {
              stars: <span className="font-semibold">{notification.rating} ★</span>,
              title: <span className="font-semibold">{title}</span>,
            })}
          </>
        ),
        to: `/user/${userId}`,
      }
  }
}

// La campana: todos los avisos (ver lib/notifications.ts). Arriba, la invitación a recibirlos en el móvil.
// Al abrirla, todo queda marcado como leído.
function NotificationsPage() {
  const { session } = useAuth()
  const userId = session!.user.id
  const notifications = useQuery('notifications', fetchNotifications)
  const t = useT()

  useEffect(() => {
    if (notifications.data?.some((n) => !n.read_at)) markAllNotificationsRead()
  }, [notifications.data])

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{t('Notifications')}</h1>
        <Link
          to="/profile/notifications"
          aria-label={t('Notification settings')}
          className="flex h-11 w-11 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
        >
          <Settings aria-hidden="true" className="h-5 w-5" />
        </Link>
      </div>

      <PushPrompt />

      {notifications.error && (
        <p className="rounded-2xl border border-rojo/40 bg-rojo/10 p-6 text-center text-rosa">{t(notifications.error)}</p>
      )}
      {notifications.loading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      )}

      {notifications.data?.length === 0 && (
        <div className="glass rounded-3xl p-10 text-center">
          <Bell className="mx-auto h-8 w-8 text-rosa" />
          <p className="mt-3 text-white/70">
            {t("Nothing yet. Save items with the ♥ and we'll tell you here when their price drops.")}
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {notifications.data?.map((notification) => {
          const { icon: Icon, text, to } = describe(notification, userId, t)
          const cover = [...(notification.listing?.images ?? [])].sort((a, b) => a.position - b.position)[0]
          const unread = !notification.read_at
          return (
            <li key={notification.id}>
              <Link to={to} className={`flex items-center gap-3 rounded-2xl p-3 transition hover:bg-white/10 ${unread ? 'glass' : 'bg-white/[0.03]'}`}>
                <div className="relative h-14 w-14 shrink-0">
                  <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-white/5">
                    {cover ? (
                      <img src={imageUrl(cover.path)} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <ImageOff className="absolute inset-0 m-auto h-5 w-5 text-white/20" />
                    )}
                  </div>
                  <span className="absolute -right-1.5 -bottom-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-noche bg-gradient-to-br from-carmin to-burdeos">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${unread ? 'text-white' : 'text-white/70'}`}>{text}</p>
                  <p className="mt-0.5 text-xs text-white/50">{formatPosted(notification.created_at)}</p>
                </div>
                {unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-carmin" aria-label={t('Unread')} />}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default NotificationsPage
