import { Link } from 'react-router'
import { Heart } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { fetchFavoriteListings, useFavorites } from '../lib/favorites'
import { useQuery } from '../lib/useQuery'
import ProductGrid from '../components/ProductGrid'

// Tus anuncios guardados con el corazón. Si quitas uno aquí, desaparece al momento.
function FavoritesPage() {
  const { session } = useAuth()
  const { ids, ready } = useFavorites()
  const saved = useQuery(session ? `favorites|${session.user.id}` : null, fetchFavoriteListings)
  // Los que acabas de quitar ya no se enseñan (sin esperar a recargar).
  const listings = ready ? saved.data?.filter((listing) => ids.has(listing.id)) : saved.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Favorites</h1>
        <p className="mt-1 text-white/60">
          {listings && listings.length > 0
            ? `${listings.length} saved ${listings.length === 1 ? 'item' : 'items'}. Only you can see them.`
            : 'Items you save appear here. Only you can see them.'}
        </p>
      </div>

      {listings && listings.length === 0 && !saved.error ? (
        <div className="rounded-3xl glass p-10 text-center">
          <Heart aria-hidden="true" className="mx-auto h-8 w-8 text-rosa" />
          <h2 className="mt-3 text-lg font-bold">Nothing saved yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-white/60">
            Tap the heart on any listing to keep it here while you decide.
          </p>
          <Link
            to="/explore"
            className="mt-5 inline-flex min-h-11 items-center rounded-full btn-primary px-5 text-sm font-semibold"
          >
            Explore the marketplace
          </Link>
        </div>
      ) : (
        <ProductGrid
          listings={listings}
          loading={saved.loading}
          error={saved.error ? 'Could not load your favorites. Please try again.' : undefined}
        />
      )}
    </div>
  )
}

export default FavoritesPage
