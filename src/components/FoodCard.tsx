import { Link } from 'react-router'
import { Clock, ImageOff, MapPin } from 'lucide-react'
import { formatPrice, formatReady } from '../lib/format'
import { DIETARY } from '../lib/listings'
import type { Listing } from '../lib/listings'
import Avatar from './Avatar'
import FavoriteButton from './FavoriteButton'
import { useT } from '../i18n/lang'
import ListingPhoto from './ListingPhoto'

// Tarjeta de un plato: foto apetecible, quién lo cocina, cuándo está listo y cuántas raciones quedan.
function FoodCard({ listing }: { listing: Listing }) {
  const t = useT()
  const cover = listing.images[0]
  const tags = DIETARY.filter((tag) => listing.dietary?.includes(tag.value))

  return (
    <div className="group relative transition duration-300 hover:-translate-y-1.5">
      <Link
        to={`/item/${listing.id}`}
        className="glass glow-border block overflow-hidden rounded-3xl p-1.5 transition duration-300 group-hover:shadow-[0_30px_60px_-25px_rgb(224_21_63/0.5)]"
      >
        <div className="keep-dark relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-white/5">
          {cover ? (
            <ListingPhoto path={cover.path} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <ImageOff className="absolute inset-0 m-auto h-8 w-8 text-white/20" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-noche/90 to-transparent" />
          {tags.length > 0 && (
            <div className="absolute top-2 left-2 flex gap-1">
              {tags.map((tag) => (
                <span
                  key={tag.value}
                  title={t(tag.label)}
                  aria-label={t(tag.label)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-noche/70 text-sm backdrop-blur-md"
                >
                  {tag.emoji}
                </span>
              ))}
            </div>
          )}
          <p className="absolute bottom-2.5 left-3 font-display text-xl font-bold drop-shadow-lg">
            {formatPrice(listing.price)}
            <span className="ml-1 font-sans text-xs font-medium text-white/70">{t('/ portion')}</span>
          </p>
          {listing.status === 'reserved' && (
            <span className="absolute right-3 bottom-3 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-noche">
              {t('Reserved')}
            </span>
          )}
        </div>

        <div className="space-y-1.5 px-2 pt-2.5 pb-2">
          <h3 className="truncate font-sans text-sm font-semibold text-white/90">{listing.title}</h3>
          <p className="flex items-center gap-1.5 text-xs text-white/60">
            <Avatar name={listing.seller?.display_name} url={listing.seller?.avatar_url} className="h-5 w-5 text-[11px]" />
            <span className="truncate">{t('by {name}', { name: listing.seller?.display_name ?? '' })}</span>
          </p>
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-white/60">
            {listing.ready_at && (
              <span className="flex items-center gap-1 text-white/80">
                <Clock className="h-3 w-3" /> {formatReady(listing.ready_at)}
              </span>
            )}
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{listing.location}</span>
            </span>
          </p>
          {listing.quantity !== null && (
            <p className={`text-xs font-semibold ${listing.quantity <= 3 ? 'text-rosa' : 'text-white/60'}`}>
              {t(listing.quantity === 1 ? '{n} portion left' : '{n} portions left', { n: listing.quantity })}
            </p>
          )}
        </div>
      </Link>
      <div className="absolute top-2 right-2">
        <FavoriteButton listingId={listing.id} title={listing.title} />
      </div>
    </div>
  )
}

export default FoodCard
