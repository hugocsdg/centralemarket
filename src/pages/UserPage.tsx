import { Link, useParams } from 'react-router'
import { MessageSquareQuote, Pencil } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fetchListings } from '../lib/listings'
import { fetchReviews, fetchSellerRating } from '../lib/reviews'
import { formatPosted } from '../lib/format'
import { useAuth } from '../lib/auth'
import { useQuery } from '../lib/useQuery'
import Avatar from '../components/Avatar'
import ProductGrid from '../components/ProductGrid'
import LoginPrompt from '../components/LoginPrompt'
import { RatingSummary, Stars } from '../components/Rating'
import NotFoundPage from './NotFoundPage'

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
  const { id = '' } = useParams()
  const { session } = useAuth()
  const signedIn = Boolean(session)
  const profile = useQuery(signedIn ? `user|${id}` : null, () => fetchPublicProfile(id))
  const rating = useQuery(signedIn ? `rating|${id}` : null, () => fetchSellerRating(id))
  // Si aún no se ha ejecutado el SQL de valoraciones, simplemente no hay valoraciones.
  const reviews = useQuery(signedIn ? `reviews|${id}` : null, () => fetchReviews(id).catch(() => []))
  const listings = useQuery(signedIn ? `user-listings|${id}` : null, () => fetchListings({ sellerId: id }))

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-md pt-6">
        <LoginPrompt title="Log in to see this profile" />
      </div>
    )
  }
  if (profile.loading) return <p className="py-20 text-center text-white/60">Loading…</p>
  if (profile.error) return <p className="py-20 text-center text-rosa">{profile.error}</p>
  if (!profile.data) return <NotFoundPage />

  const person = profile.data
  const isMe = person.id === session?.user.id
  const memberSince = new Date(person.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="glass flex flex-col items-center gap-4 rounded-[2rem] p-6 text-center sm:flex-row sm:text-left">
        <Avatar name={person.display_name} url={person.avatar_url} className="h-24 w-24 text-4xl" />
        <div className="flex-1 space-y-1">
          <h1 className="text-3xl font-bold">{person.display_name}</h1>
          <p className="text-sm text-white/60">CentraleSupélec student · member since {memberSince}</p>
          <div className="flex justify-center sm:justify-start">
            {rating.data !== undefined && <RatingSummary rating={rating.data} />}
          </div>
        </div>
        {isMe && (
          <Link
            to="/profile"
            className="flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-semibold hover:border-white/40"
          >
            <Pencil className="h-4 w-4" /> Edit profile
          </Link>
        )}
      </div>

      <section>
        <h2 className="mb-4 text-2xl font-bold">Reviews</h2>
        {reviews.data && reviews.data.length > 0 ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {reviews.data.map((review) => (
              <li key={review.id} className="glass space-y-2 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={review.reviewer?.display_name} url={review.reviewer?.avatar_url} className="h-9 w-9 text-sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{review.reviewer?.display_name}</p>
                    <p className="truncate text-xs text-white/60">
                      Bought {review.listing?.title ?? 'an item'} · {formatPosted(review.created_at).toLowerCase()}
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
            {reviews.loading ? 'Loading reviews…' : 'No reviews yet. Reviews appear after a completed sale.'}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">{isMe ? 'Your listings' : `On sale by ${person.display_name}`}</h2>
        <ProductGrid
          listings={listings.data}
          loading={listings.loading}
          error={listings.error}
          empty="Nothing on sale right now."
        />
      </section>
    </div>
  )
}

export default UserPage
