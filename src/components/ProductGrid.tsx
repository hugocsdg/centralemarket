import ProductCard from './ProductCard'
import type { Listing } from '../lib/listings'

type ProductGridProps = {
  listings?: Listing[]
  loading?: boolean
  error?: string
  empty?: string
}

// Cuadrícula de anuncios con sus estados: cargando, error y vacío.
function ProductGrid({ listings, loading, error, empty = 'Nothing here yet. Be the first to list something!' }: ProductGridProps) {
  if (error) {
    return <p className="rounded-2xl border border-rojo/40 bg-rojo/10 p-6 text-center text-rosa">{error}</p>
  }
  if (loading || !listings) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="glass aspect-[4/5.6] animate-pulse rounded-3xl" />
        ))}
      </div>
    )
  }
  if (listings.length === 0) {
    return <p className="rounded-2xl glass p-10 text-center text-white/60">{empty}</p>
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {listings.map((listing) => (
        <ProductCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}

export default ProductGrid
