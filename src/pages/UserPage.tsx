import { Link, useParams } from 'react-router'
import { MessageSquareQuote, Pencil } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fetchListings } from '../lib/listings'
import { fetchRatingDetail, fetchReviews, fetchSellerRating } from '../lib/reviews'
import { formatPosted } from '../lib/format'
import { useAuth } from '../lib/auth'
import { useQuery } from '../lib/useQuery'
import Avatar from '../components/Avatar'
import ProductGrid from '../components/ProductGrid'
import LoginPrompt from '../components/LoginPrompt'
import { RatingBreakdown, RatingSummary, Stars } from '../components/Rating'
import ReportButton from '../components/ReportButton'
import NotFoundPage from './NotFoundPage'
import { useT } from '../i18n/lang'
import { currentLocale } from '../i18n/core'
import { useState } from 'react'
import BlockButton from '../components/BlockButton'

async function fetchPublicProfile(id: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, created_at')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as { id: string; display_name: string; avatar_url: string | null; created_at: string } | null
}

// Perfil público de un estudiante: su nota, lo que opinan sus compradores y lo que vende.
function UserPage() {
  const { id: param = '' } = useParams()
  const { session } = useAuth()
  // "/user/me" = mi propio perfil público (desde Profile → My reviews).
  const id = param === 'me' ? (session?.user.id ?? '') : param
  const signedIn = Boolean(session)
  const t = useT()
  const profile = useQuery(signedIn ? `user|${id}` : null, () => fetchPublicProfile(id))
  const rating = useQuery(signedIn ? `rating|${id}` : null, () => fetchSellerRating(id))
  // Si aún no se ha ejecutado el SQL de valoraciones, simplemente no hay valoraciones.
  const reviews = useQuery(signedIn ? `reviews|${id}` : null, () => fetchReviews(id).catch(() => []))
  const detail = useQuery(signedIn ? `rating-detail|${id}` : null, () => fetchRatingDetail(id))
  // Pestañas de las valoraciones: todas, como vendedor o como comprador.
  const [tab, setTab] = useState<'all' | 'seller' | 'buyer'>('all')
  const listings = useQuery(signedIn ? `user-listings|${id}` : null, () => fetchListings({ sellerId: id }))

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-md pt-6">
        <LoginPrompt title={t('Log in to see this profile')} />
      </div>
    )
  }
  if (profile.loading) return <p className="py-20 text-center text-white/60">{t('Loading…')}</p>
  if (profile.error) return <p className="py-20 text-center text-rosa">{t(profile.error)}</p>
  if (!profile.data) return <NotFoundPage />

  const person = profile.data
  const isMe = person.id === session?.user.id
  const memberSince = new Date(person.created_at).toLocaleDateString(currentLocale(), { month: 'long', year: 'numeric' })

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="glass flex flex-col items-center gap-4 rounded-[2rem] p-6 text-center sm:flex-row sm:text-left">
        <Avatar name={person.display_name} url={person.avatar_url} className="h-24 w-24 text-4xl" />
        <div className="flex-1 space-y-1">
          <h1 className="text-3xl font-bold">{person.display_name}</h1>
          <p className="text-sm text-white/60">{t('CentraleSupélec student · member since {date}', { date: memberSince })}</p>
          <div className="flex justify-center sm:justify-start">
            {rating.data !== undefined && <RatingSummary rating={rating.data} />}
          </div>
        </div>
        {isMe && (
          <Link
            to="/profile/me"
            className="flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-semibold hover:border-white/40"
          >
            <Pencil className="h-4 w-4" /> {t('Edit profile')}
          </Link>
        )}
      </div>

      <section>
        <h2 className="mb-4 text-2xl font-bold">{t('Reviews')}</h2>
        {detail.data && (
          <div className="mb-4">
            <RatingBreakdown detail={detail.data} />
          </div>
        )}
        {reviews.data && reviews.data.length > 0 && (
          <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label={t('Reviews')}>
            {(
              [
                ['all', t('All'), reviews.data.length],
                ['seller', t('As seller'), reviews.data.filter((review) => review.role !== 'buyer').length],
                ['buyer', t('As buyer'), reviews.data.filter((review) => review.role === 'buyer').length],
              ] as const
            ).map(([value, label, count]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                aria-pressed={tab === value}
                className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-medium whitespace-nowrap transition ${
                  tab === value ? 'btn-primary text-white' : 'glass text-white/80 hover:bg-white/10'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        )}
        {reviews.data && reviews.data.length > 0 ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {reviews.data
              .filter((review) => tab === 'all' || (tab === 'buyer' ? review.role === 'buyer' : review.role !== 'buyer'))
              .map((review) => (
              <li key={review.id} className="glass space-y-2 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={review.reviewer?.display_name} url={review.reviewer?.avatar_url} className="h-9 w-9 text-sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{review.reviewer?.display_name}</p>
                    <p className="truncate text-xs text-white/60">
                      {t(review.role === 'buyer' ? 'Sold them {title}' : 'Bought {title}', {
                        title: review.listing?.title ?? t('an item'),
                      })}{' '}
                      · {formatPosted(review.created_at).toLowerCase()}
                    </p>
                  </div>
                  <Stars value={review.rating} className="h-3.5 w-3.5" />
                </div>
                {review.comment && <p className="text-sm text-white/80">“{review.comment}”</p>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="glass rounded-2xl p-6 text-center text-sm text-white/60">
            <MessageSquareQuote className="mx-auto mb-2 h-6 w-6 text-rosa" />
            {t(reviews.loading ? 'Loading reviews…' : 'No reviews yet. Reviews appear after a completed sale.')}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">{isMe ? t('Your listings') : t('On sale by {name}', { name: person.display_name })}</h2>
        <ProductGrid
          listings={listings.data}
          loading={listings.loading}
          error={listings.error}
          empty={t('Nothing on sale right now.')}
        />
      </section>

      {!isMe && (
        <div className="-ml-2 flex flex-wrap items-center gap-x-4">
          <ReportButton target={{ userId: person.id }} label={t('Report {name}', { name: person.display_name })} />
          <BlockButton userId={person.id} name={person.display_name} />
        </div>
      )}
    </div>
  )
}

export default UserPage
