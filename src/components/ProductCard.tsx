import { Link } from 'react-router'
import { ImageOff, MapPin } from 'lucide-react'
import { formatPrice } from '../lib/format'
import { imageUrl } from '../lib/listings'
import type { Listing } from '../lib/listings'

type ProductCardProps = {
  listing: Listing
}

function ProductCard({ listing }: ProductCardProps) {
  const cover = listing.images[0]
  return (
    <Link
      to={`/item/${listing.id}`}
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition hover:-translate-y-1 hover:border-white/25 hover:bg-white/10 hover:shadow-lg hover:shadow-rojo/20"
    >
      <div className="relative aspect-square bg-white/5">
        {cover ? (
          <img
            src={imageUrl(cover.path)}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <ImageOff className="absolute inset-0 m-auto h-8 w-8 text-white/20" />
        )}
        {listing.price === 0 && (
          <span className="absolute top-2 left-2 rounded-full bg-carmin px-2 py-0.5 text-xs font-semibold text-white shadow">
            Free
          </span>
        )}
        {listing.status !== 'available' && (
          <span className="absolute top-2 right-2 rounded-full bg-noche/80 px-2 py-0.5 text-xs font-semibold text-white capitalize">
            {listing.status}
          </span>
        )}
        {listing.moving_out && (
          <span className="absolute bottom-2 left-2 rounded-full bg-burdeos/90 px-2 py-0.5 text-xs font-medium text-white">
            Moving out
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-lg font-bold text-white">{formatPrice(listing.price, listing.price_unit)}</p>
        <h3 className="truncate text-sm font-medium text-white/80">{listing.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-white/50">
          {listing.condition && (
            <>
              <span>{listing.condition}</span>
              <span>·</span>
            </>
          )}
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{listing.location}</span>
        </p>
      </div>
    </Link>
  )
}

export default ProductCard
