import { Link } from 'react-router'
import { Clock, ImageOff, MapPin, Ticket } from 'lucide-react'
import { dateBadge, formatPrice } from '../lib/format'
import { imageUrl } from '../lib/listings'
import type { Listing } from '../lib/listings'
import FavoriteButton from './FavoriteButton'

// Cartel de un evento: la foto ocupa todo, con la fecha "de calendario" arriba y los datos abajo.
// "featured" = el grande de arriba del todo en la pantalla de eventos.
function EventCard({ listing, featured = false }: { listing: Listing; featured?: boolean }) {
  const cover = listing.images[0]
  const badge = listing.event_at ? dateBadge(listing.event_at) : null
  const time = listing.event_at
    ? new Date(listing.event_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : null
  const fewLeft = listing.quantity !== null && listing.quantity <= 5

  return (
    <div className="group relative transition duration-300 hover:-translate-y-1.5">
      <Link
        to={`/item/${listing.id}`}
        className={`glow-border relative block overflow-hidden rounded-3xl bg-grafito shadow-2xl shadow-black/40 ${
          featured ? 'aspect-[4/5] sm:aspect-[16/9]' : 'aspect-[3/4.6] sm:aspect-[3/4]'
        }`}
      >
        {cover ? (
          <img
            src={imageUrl(cover.path)}
            alt=""
            loading={featured ? undefined : 'lazy'}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <ImageOff className="absolute inset-0 m-auto h-8 w-8 text-white/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-noche via-noche/40 to-transparent" />

        {badge && (
          <div
            className={`glass absolute top-3 left-3 flex flex-col items-center rounded-2xl bg-noche/60 py-1.5 leading-none ${
              featured ? 'w-14' : 'w-12'
            }`}
          >
            <span className="text-[11px] font-bold tracking-wider text-white">{badge.weekday}</span>
            <span className={`mt-1 font-display font-bold ${featured ? 'text-2xl' : 'text-xl'}`}>{badge.day}</span>
            <span className="mt-0.5 text-[11px] font-semibold text-white/70">{badge.month}</span>
          </div>
        )}

        <div className={`absolute inset-x-0 bottom-0 p-4 ${featured ? 'sm:p-7' : ''}`}>
          {listing.status === 'reserved' && (
            <span className="mb-2 inline-block rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-noche">Reserved</span>
          )}
          <h3 className={`font-bold leading-tight ${featured ? 'text-2xl sm:text-4xl' : 'line-clamp-2 text-base'}`}>
            {listing.title}
          </h3>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/80">
            {time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {time}
              </span>
            )}
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{listing.location}</span>
            </span>
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="btn-primary flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold whitespace-nowrap">
              <Ticket className="h-4 w-4" aria-hidden="true" /> {formatPrice(listing.price)}
            </span>
            {listing.quantity !== null && (
              <span className={`text-right text-xs font-semibold ${fewLeft ? 'text-rosa' : 'text-white/60'}`}>
                {listing.quantity} left
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="absolute top-2 right-2">
        <FavoriteButton listingId={listing.id} title={listing.title} />
      </div>
    </div>
  )
}

export default EventCard
