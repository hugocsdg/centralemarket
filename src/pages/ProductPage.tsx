import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  HandCoins,
  ImageOff,
  MapPin,
  MessageCircle,
  Share2,
  Tag,
  TrendingDown,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { DIETARY, fetchListing, fetchListings, imageUrl } from '../lib/listings'
import type { Listing } from '../lib/listings'
import OwnerPanel from '../components/OwnerPanel'
import ReportButton from '../components/ReportButton'
import FavoriteButton from '../components/FavoriteButton'
import { formatEventDate, formatPosted, formatPrice, formatReady } from '../lib/format'
import { fetchMyReview, fetchSellerRating } from '../lib/reviews'
import { RateSellerForm, RatingSummary, Stars } from '../components/Rating'
import { getCategory } from '../data/categories'
import { useAuth } from '../lib/auth'
import { useQuery } from '../lib/useQuery'
import { startConversation } from '../lib/chat'
import ProductGrid from '../components/ProductGrid'
import LoginPrompt from '../components/LoginPrompt'
import Avatar from '../components/Avatar'
import NotFoundPage from './NotFoundPage'
import { useT } from '../i18n/lang'

function ProductPage() {
  // El número de la URL (/item/3) llega aquí como texto: "3".
  const { id } = useParams()
  const [params] = useSearchParams()
  const { session } = useAuth()
  const t = useT()
  const { data: listing, loading, error, reload } = useQuery(session ? `item|${id}` : null, () =>
    fetchListing(Number(id)),
  )

  // Quien llega por un enlace compartido sin sesión ve la invitación a entrar.
  if (!session) {
    return (
      <div className="mx-auto max-w-md pt-6">
        <LoginPrompt title={t('Log in to see this listing')} />
      </div>
    )
  }
  if (loading) return <p className="py-20 text-center text-white/60">{t('Loading…')}</p>
  if (error) return <p className="py-20 text-center text-rosa">{t(error)}</p>
  if (!listing) return <NotFoundPage />

  return (
    <ListingView
      listing={listing}
      userId={session.user.id}
      isOwner={listing.seller_id === session.user.id}
      justPublished={params.has('published')}
      onChanged={reload}
    />
  )
}

type ListingViewProps = {
  listing: Listing
  userId: string
  isOwner: boolean
  justPublished: boolean
  onChanged: () => void
}

function ListingView({ listing, userId, isOwner, justPublished, onChanged }: ListingViewProps) {
  const navigate = useNavigate()
  const t = useT()
  const [opening, setOpening] = useState(false)
  const [contactError, setContactError] = useState('')
  const [selected, setSelected] = useState(0)
  const [shareMessage, setShareMessage] = useState('')
  const [params] = useSearchParams()
  const category = getCategory(listing.category)
  const isTicket = listing.category === 'tickets'
  const isFood = listing.category === 'food'
  const rating = useQuery(`rating|${listing.seller_id}`, () => fetchSellerRating(listing.seller_id))
  // ¿Lo compré yo? Entonces puedo valorar al vendedor (una vez).
  const boughtByMe = listing.status === 'sold' && listing.sold_to === userId
  const myReview = useQuery(boughtByMe ? `my-review|${listing.id}` : null, () => fetchMyReview(listing.id, userId))
  const tags = DIETARY.filter((tag) => listing.dietary?.includes(tag.value))
  // En la comida no se regatea: son raciones de pocos euros.
  const canOffer = !isOwner && !isFood && listing.status !== 'sold' && listing.price > 0
  const dropped = listing.previous_price !== null && listing.previous_price !== undefined && listing.previous_price > listing.price
  const similar = useQuery(`similar|${listing.id}`, () => fetchListings({ category: listing.category, limit: 5 }))
  const similarListings = similar.data?.filter((item) => item.id !== listing.id).slice(0, 4)

  const image = listing.images[selected] ?? listing.images[0]

  // Abre el chat con el vendedor (o el que ya teníais sobre este anuncio).
  // Con "offer", el chat se abre con el panel de oferta ya desplegado.
  async function contactSeller(offer = false) {
    setOpening(true)
    setContactError('')
    try {
      const conversationId = await startConversation(listing.id, userId)
      navigate(`/messages/${conversationId}${offer ? '?offer=1' : ''}`)
    } catch {
      setOpening(false)
      setContactError(t('Could not open the chat. Please try again.'))
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/item/${listing.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        setShareMessage(t('Link copied!'))
      }
    } catch {
      // El usuario cerró el menú de compartir: no hacemos nada.
    }
  }

  return (
    <div className="space-y-10">
      {justPublished && (
        <p className="flex items-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-r from-burdeos/70 to-rojo/40 px-4 py-3 font-medium">
          <CheckCircle2 className="h-5 w-5 text-rosa" />{' '}
          {t('Your item is now live on CentraleMarket! Share it in your WhatsApp groups.')}
        </p>
      )}

      <Link
        to={isTicket ? '/events' : isFood ? '/food' : '/explore'}
        className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-white/60 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> {t(isTicket ? 'Back to events' : isFood ? 'Back to food' : 'Back to market')}
      </Link>

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        {/* Galería */}
        <div className="space-y-3">
          <div className="keep-dark relative aspect-square overflow-hidden rounded-3xl glass shadow-2xl shadow-black/40">
            {image ? (
              <img src={imageUrl(image.path)} alt={listing.title} className="h-full w-full object-cover" />
            ) : (
              <ImageOff className="absolute inset-0 m-auto h-10 w-10 text-white/20" />
            )}
          </div>
          {listing.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {listing.images.map((img, index) => (
                <button
                  key={img.path}
                  onClick={() => setSelected(index)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${
                    index === selected ? 'border-rosa' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={imageUrl(img.path)} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información */}
        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap gap-2">
              {listing.status !== 'available' && (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-burdeos capitalize">
                  {t(listing.status === 'sold' ? 'Sold' : 'Reserved')}
                </span>
              )}
              {dropped && (
                <span className="flex items-center gap-1 rounded-full bg-carmin/20 px-3 py-1 text-xs font-semibold text-rosa ring-1 ring-rosa/40">
                  <TrendingDown className="h-3.5 w-3.5" /> {t('Price drop')}
                </span>
              )}
              {listing.moving_out && (
                <span className="rounded-full bg-burdeos px-3 py-1 text-xs font-medium ring-1 ring-white/20">{t('Moving out')}</span>
              )}
              {listing.condition && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">{t(listing.condition)}</span>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-bold">{listing.title}</h1>
            <p className="mt-1 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-rosa">
                {formatPrice(listing.price, listing.price_unit)}
                {(isFood || isTicket) && listing.price > 0 && (
                  <span className="ml-1 text-sm font-medium text-white/60">{t(isFood ? '/ portion' : '/ ticket')}</span>
                )}
              </span>
              {dropped && <span className="text-lg text-white/50 line-through">{formatPrice(listing.previous_price!)}</span>}
            </p>
          </div>

          {/* Evento o plato: lo más importante, en grande */}
          {((isTicket && listing.event_at) || (isFood && (listing.ready_at || listing.quantity))) && (
            <div className="grid gap-2 sm:grid-cols-2">
              {isTicket && listing.event_at && (
                <InfoTile icon={CalendarDays} label={t('When')} value={formatEventDate(listing.event_at)} />
              )}
              {isFood && listing.ready_at && <InfoTile icon={Clock} label={t('Pickup')} value={formatReady(listing.ready_at)} />}
              {listing.quantity ? (
                <InfoTile
                  icon={Users}
                  label={t('Left')}
                  value={t(
                    isFood
                      ? listing.quantity === 1
                        ? '{n} portion'
                        : '{n} portions'
                      : listing.quantity === 1
                        ? '{n} ticket'
                        : '{n} tickets',
                    { n: listing.quantity },
                  )}
                />
              ) : null}
            </div>
          )}

          {isFood && (tags.length > 0 || listing.allergens) && (
            <div className="space-y-2">
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag.value} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                      {tag.emoji} {t(tag.label)}
                    </span>
                  ))}
                </div>
              )}
              {listing.allergens && (
                <p className="flex items-start gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-white/80">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rosa" />
                  <span>
                    <span className="font-semibold">{t('Allergens:')}</span> {listing.allergens}
                  </span>
                </p>
              )}
            </div>
          )}

          <ul className="space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-white/60" />
              {listing.category === 'services' || isTicket ? listing.location : t('Pickup in {place}', { place: listing.location })}
            </li>
            {category && (
              <li className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-white/60" />
                <Link to={`/explore?category=${category.slug}`} className="hover:text-rosa hover:underline">
                  {t(category.name)}
                </Link>
              </li>
            )}
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-white/60" /> {t('Listed {when}', { when: formatPosted(listing.created_at).toLowerCase() })}
            </li>
          </ul>

          {listing.description && (
            <p className="leading-relaxed whitespace-pre-line text-white/80">{listing.description}</p>
          )}

          <Link
            to={`/user/${listing.seller_id}`}
            className="flex items-center gap-3 rounded-2xl glass p-4 transition hover:bg-white/10"
          >
            <Avatar name={listing.seller?.display_name} url={listing.seller?.avatar_url} className="h-10 w-10 text-base" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{isOwner ? t('You') : listing.seller?.display_name}</p>
              {rating.data !== undefined ? (
                <RatingSummary rating={rating.data} />
              ) : (
                <p className="text-xs text-white/50">{t('CentraleSupélec student')}</p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-white/40" />
          </Link>

          {/* Lo compraste: valora al vendedor */}
          {boughtByMe && myReview.data === null && (
            <RateSellerForm
              listingId={listing.id}
              sellerName={listing.seller?.display_name ?? t('the seller')}
              onDone={() => {
                myReview.reload()
                rating.reload()
              }}
            />
          )}
          {boughtByMe && myReview.data && (
            <p className="flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/80">
              {t('You rated this purchase')} <Stars value={myReview.data.rating} />
            </p>
          )}
          {params.has('rate') && !boughtByMe && (
            <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/70">
              {t('Only the buyer picked by the seller can rate this sale.')}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            {isOwner ? null : (
              <button
                onClick={() => contactSeller()}
                disabled={opening}
                className="flex flex-1 items-center justify-center gap-2 rounded-full btn-primary px-5 py-3 font-semibold  disabled:opacity-60"
              >
                <MessageCircle className="h-5 w-5" />{' '}
                {t(opening ? 'Opening chat…' : isTicket ? 'Get this ticket' : isFood ? 'Order this dish' : 'Message seller')}
              </button>
            )}
            {canOffer && (
              <button
                onClick={() => contactSeller(true)}
                disabled={opening}
                className="flex items-center justify-center gap-2 rounded-full border border-rosa/50 bg-rojo/10 px-5 py-3 font-semibold transition hover:bg-rojo/20 disabled:opacity-60"
              >
                <HandCoins className="h-5 w-5" /> {t('Make an offer')}
              </button>
            )}
            {!isOwner && <FavoriteButton listingId={listing.id} title={listing.title} variant="page" />}
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 font-semibold hover:border-white/40"
            >
              <Share2 className="h-5 w-5" /> {shareMessage || t('Share')}
            </button>
          </div>
          {contactError && <p className="text-sm text-rosa">{contactError}</p>}
          {!isOwner && (
            <div className="-ml-2">
              <ReportButton target={{ listingId: listing.id }} label={t('Report this listing')} />
            </div>
          )}

          {isOwner && <OwnerPanel listing={listing} onChanged={onChanged} />}
        </div>
      </div>

      {similarListings && similarListings.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold">{t('Similar items')}</h2>
          <ProductGrid listings={similarListings} />
        </section>
      )}
    </div>
  )
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl glass p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-carmin to-burdeos">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-white/60">{label}</p>
        <p className="truncate font-semibold">{value}</p>
      </div>
    </div>
  )
}

export default ProductPage
