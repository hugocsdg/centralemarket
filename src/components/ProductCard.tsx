import { Link } from 'react-router'
import { ImageOff, MapPin } from 'lucide-react'
import { formatPrice } from '../lib/format'
import type { Listing } from '../lib/listings'
import FavoriteButton from './FavoriteButton'
import { useT } from '../i18n/lang'
import ListingPhoto from './ListingPhoto'

type ProductCardProps = {
  listing: Listing
}

// Tarjeta de anuncio: foto grande, precio flotando sobre la foto y borde que brilla al pasar el ratón.
// El corazón va encima de la tarjeta (no dentro del enlace: un botón no puede ir dentro de un enlace).
function ProductCard({ listing }: ProductCardProps) {
  const t = useT()
  const cover = listing.images[0]
  // Ha bajado de precio (la base de datos guarda el precio de antes).
  const dropped = listing.previous_price != null && listing.previous_price > listing.price
  return (
    <div className="group relative transition duration-300 hover:-translate-y-1.5">
      <Link
        to={`/item/${listing.id}`}
        className="glass glow-border block overflow-hidden rounded-3xl p-1.5 transition duration-300 group-hover:shadow-[0_30px_60px_-25px_rgb(224_21_63/0.5)]"
      >
        <div className="keep-dark relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-white/5">
          {cover ? (
            <ListingPhoto
              path={cover.path}
              alt={listing.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <ImageOff className="absolute inset-0 m-auto h-8 w-8 text-white/20" />
          )}
          {/* Degradado para que el precio se lea sobre cualquier foto */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-noche/90 via-noche/30 to-transparent" />

          <div className="absolute top-2 right-12 left-2 flex flex-wrap gap-1">
            {listing.status !== 'available' && (
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-noche capitalize">
                {t(listing.status === 'sold' ? 'Sold' : 'Reserved')}
              </span>
            )}
            {listing.price === 0 && (
              <span className="btn-primary rounded-full px-2.5 py-0.5 text-[11px] font-bold">{t('FREE')}</span>
            )}
            {dropped && (
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-carmin">{t('Price drop')}</span>
            )}
            {listing.moving_out && (
              <span className="rounded-full bg-noche/70 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-md">
                {t('Moving out')}
              </span>
            )}
          </div>

          <p className="absolute bottom-2.5 left-3 flex items-baseline gap-1.5 font-display text-xl font-bold drop-shadow-lg">
            {formatPrice(listing.price, listing.price_unit)}
            {dropped && (
              <span className="font-sans text-xs font-medium text-white/70 line-through">{formatPrice(listing.previous_price!)}</span>
            )}
          </p>
        </div>

        <div className="px-2 pt-2.5 pb-2">
          <h3 className="truncate font-sans text-sm font-semibold text-white/90">{listing.title}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-white/60">
            {listing.condition && (
              <>
                <span>{t(listing.condition)}</span>
                <span>·</span>
              </>
            )}
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{listing.location}</span>
          </p>
        </div>
      </Link>
      <div className="absolute top-2 right-2">
        <FavoriteButton listingId={listing.id} title={listing.title} />
      </div>
    </div>
  )
}

export default ProductCard
