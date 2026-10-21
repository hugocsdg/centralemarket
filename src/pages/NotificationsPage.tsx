import { Fragment, useEffect } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Bell, ImageOff, Star, TrendingDown } from 'lucide-react'
import { fetchNotifications, markAllNotificationsRead } from '../lib/notifications'
import type { Notification } from '../lib/notifications'
import { imageUrl } from '../lib/listings'
import { formatPosted, formatPrice } from '../lib/format'
import { useQuery } from '../lib/useQuery'
import { useAuth } from '../lib/auth'
import { useT } from '../i18n/lang'

// Qué dice cada aviso y adónde lleva al tocarlo.
// Rellena una frase traducida con trozos con estilo: rich('{title} dropped', { title: <b>…</b> }).
function rich(text: string, parts: Record<string, ReactNode>) {
  return text.split(/(\{\w+\})/).map((piece, index) => {
    const name = piece.match(/^\{(\w+)\}$/)?.[1]
    return <Fragment key={index}>{name && name in parts ? parts[name] : piece}</Fragment>
  })
}

function describe(notification: Notification, userId: string, t: (text: string) => string) {
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

// La campana: bajadas de precio de tus favoritos, compras que puedes valorar y valoraciones nuevas.
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
      <h1 className="text-3xl font-bold">{t('Notifications')}</h1>

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
