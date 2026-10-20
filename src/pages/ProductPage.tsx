import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, CheckCircle2, Clock, ImageOff, MapPin, MessageCircle, Share2, Tag } from 'lucide-react'
import { fetchListing, fetchListings, imageUrl } from '../lib/listings'
import type { Listing } from '../lib/listings'
import OwnerPanel from '../components/OwnerPanel'
import FavoriteButton from '../components/FavoriteButton'
import { formatPosted, formatPrice } from '../lib/format'
import { getCategory } from '../data/categories'
import { useAuth } from '../lib/auth'
import { useQuery } from '../lib/useQuery'
import { startConversation } from '../lib/chat'
import ProductGrid from '../components/ProductGrid'
import LoginPrompt from '../components/LoginPrompt'
import Avatar from '../components/Avatar'
import NotFoundPage from './NotFoundPage'

function ProductPage() {
  // El número de la URL (/item/3) llega aquí como texto: "3".
  const { id } = useParams()
  const [params] = useSearchParams()
  const { session } = useAuth()
  const { data: listing, loading, error, reload } = useQuery(session ? `item|${id}` : null, () =>
    fetchListing(Number(id)),
  )

  // Quien llega por un enlace compartido sin sesión ve la invitación a entrar.
  if (!session) {
    return (
      <div className="mx-auto max-w-md pt-6">
        <LoginPrompt title="Log in to see this listing" />
      </div>
    )
  }
  if (loading) return <p className="py-20 text-center text-white/60">Loading…</p>
  if (error) return <p className="py-20 text-center text-rosa">{error}</p>
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
  const [opening, setOpening] = useState(false)
  const [contactError, setContactError] = useState('')
  const [selected, setSelected] = useState(0)
  const [shareMessage, setShareMessage] = useState('')
  const category = getCategory(listing.category)
  const similar = useQuery(`similar|${listing.id}`, () => fetchListings({ category: listing.category, limit: 5 }))
  const similarListings = similar.data?.filter((item) => item.id !== listing.id).slice(0, 4)

  const image = listing.images[selected] ?? listing.images[0]

  // Abre el chat con el vendedor (o el que ya teníais sobre este anuncio).
  async function contactSeller() {
    setOpening(true)
    setContactError('')
    try {
      const conversationId = await startConversation(listing.id, userId)
      navigate(`/messages/${conversationId}`)
    } catch {
      setOpening(false)
      setContactError('Could not open the chat. Please try again.')
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/item/${listing.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        setShareMessage('Link copied!')
      }
    } catch {
      // El usuario cerró el menú de compartir: no hacemos nada.
    }
  }

  return (
    <div className="space-y-10">
      {justPublished && (
        <p className="flex items-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-r from-burdeos/70 to-rojo/40 px-4 py-3 font-medium">
          <CheckCircle2 className="h-5 w-5 text-rosa" /> Your item is now live on CentraleMarket! Share it in your
          WhatsApp groups.
        </p>
      )}

      <Link to="/explore" className="inline-flex items-center gap-1 text-sm font-medium text-white/60 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to explore
      </Link>

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        {/* Galería */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-3xl glass shadow-2xl shadow-black/40">
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
                  {listing.status}
                </span>
              )}
              {listing.moving_out && (
                <span className="rounded-full bg-burdeos px-3 py-1 text-xs font-medium ring-1 ring-white/20">Moving out</span>
              )}
              {listing.condition && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">{listing.condition}</span>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-bold">{listing.title}</h1>
            <p className="mt-1 text-3xl font-bold text-rosa">{formatPrice(listing.price, listing.price_unit)}</p>
          </div>

          <ul className="space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-white/60" />
              {listing.category === 'services' ? listing.location : `Pickup in ${listing.location}`}
            </li>
            {category && (
              <li className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-white/60" />
                <Link to={`/explore?category=${category.slug}`} className="hover:text-rosa hover:underline">
                  {category.name}
                </Link>
              </li>
            )}
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-white/60" /> Listed {formatPosted(listing.created_at).toLowerCase()}
            </li>
          </ul>

          {listing.description && (
            <p className="leading-relaxed whitespace-pre-line text-white/80">{listing.description}</p>
          )}

          <div className="flex items-center gap-3 rounded-2xl glass p-4">
            <Avatar name={listing.seller?.display_name} url={listing.seller?.avatar_url} className="h-10 w-10 text-base" />
            <div>
              <p className="font-medium">{isOwner ? 'You' : listing.seller?.display_name}</p>
              <p className="text-xs text-white/50">CentraleSupélec student</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {isOwner ? null : (
              <button
                onClick={contactSeller}
                disabled={opening}
                className="flex flex-1 items-center justify-center gap-2 rounded-full btn-primary px-5 py-3 font-semibold  disabled:opacity-60"
              >
                <MessageCircle className="h-5 w-5" /> {opening ? 'Opening chat…' : 'Message seller'}
              </button>
            )}
            {!isOwner && <FavoriteButton listingId={listing.id} title={listing.title} variant="page" />}
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 font-semibold hover:border-white/40"
            >
              <Share2 className="h-5 w-5" /> {shareMessage || 'Share'}
            </button>
          </div>
          {contactError && <p className="text-sm text-rosa">{contactError}</p>}

          {isOwner && <OwnerPanel listing={listing} onChanged={onChanged} />}
        </div>
      </div>

      {similarListings && similarListings.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold">Similar items</h2>
          <ProductGrid listings={similarListings} />
        </section>
      )}
    </div>
  )
}

export default ProductPage
