import { Link } from 'react-router'
import { ImageOff, MapPin } from 'lucide-react'
import { formatPrice } from '../lib/format'
import { imageUrl } from '../lib/listings'
import type { Listing } from '../lib/listings'

type ProductCardProps = {
  listing: Listing
}

// Tarjeta de anuncio: foto grande, precio flotando sobre la foto y borde que brilla al pasar el ratón.
function ProductCard({ listing }: ProductCardProps) {
  const cover = listing.images[0]
  return (
    <Link
      to={`/item/${listing.id}`}
      className="glass glow-border group block overflow-hidden rounded-3xl p-1.5 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-25px_rgb(224_21_63/0.5)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-white/5">
        {cover ? (
          <img
            src={imageUrl(cover.path)}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <ImageOff className="absolute inset-0 m-auto h-8 w-8 text-white/20" />
        )}
        {/* Degradado para que el precio se lea sobre cualquier foto */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-noche/90 via-noche/30 to-transparent" />

        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {listing.price === 0 && (
            <span className="btn-primary rounded-full px-2.5 py-0.5 text-[11px] font-bold">FREE</span>
          )}
          {listing.moving_out && (
            <span className="rounded-full bg-noche/70 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-md">
              Moving out
            </span>
          )}
        </div>
        {listing.status !== 'available' && (
          <span className="absolute top-2 right-2 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-noche capitalize">
            {listing.status}
          </span>
        )}

        <p className="absolute bottom-2.5 left-3 font-display text-xl font-bold drop-shadow-lg">
          {formatPrice(listing.price, listing.price_unit)}
        </p>
      </div>

      <div className="px-2 pt-2.5 pb-2">
        <h3 className="truncate font-sans text-sm font-semibold text-white/90">{listing.title}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-white/45">
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
