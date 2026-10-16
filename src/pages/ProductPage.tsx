import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Clock, MapPin, MessageCircle, Share2, Tag } from 'lucide-react'
import { formatPosted, formatPrice, getProduct, products } from '../data/products'
import { getCategory } from '../data/categories'
import ProductGrid from '../components/ProductGrid'
import NotFoundPage from './NotFoundPage'

function ProductPage() {
  // El número de la URL (/item/3) llega aquí como texto: "3".
  const { id } = useParams()
  const product = getProduct(Number(id))
  const [shareMessage, setShareMessage] = useState('')

  if (!product) return <NotFoundPage />

  const category = getCategory(product.category)
  const similar = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)

  async function handleShare() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: product!.title, url })
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
      <Link to="/explore" className="inline-flex items-center gap-1 text-sm font-medium text-white/60 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to explore
      </Link>

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <img src={product.image} alt={product.title} className="aspect-square w-full rounded-3xl border border-white/10 object-cover shadow-2xl shadow-black/40" />

        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap gap-2">
              {product.movingOut && (
                <span className="rounded-full bg-burdeos px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20">Moving out</span>
              )}
              {product.condition && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                  {product.condition}
                </span>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-bold text-white">{product.title}</h1>
            <p className="mt-1 text-3xl font-bold text-rosa">{formatPrice(product.price, product.priceUnit)}</p>
          </div>

          <ul className="space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-white/40" /> {product.priceUnit ? product.location : `Pickup in ${product.location}`}
            </li>
            {category && (
              <li className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-white/40" />
                <Link to={`/explore?category=${category.slug}`} className="hover:text-rosa hover:underline">
                  {category.name}
                </Link>
              </li>
            )}
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-white/40" /> Listed {formatPosted(product.postedDaysAgo).toLowerCase()}
            </li>
          </ul>

          <p className="leading-relaxed text-white/80">{product.description}</p>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rojo/25 font-bold text-rosa">
              {product.seller[0]}
            </span>
            <div>
              <p className="font-medium text-white">{product.seller}</p>
              <p className="text-xs text-white/50">Seller profiles arrive with student accounts.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              disabled
              title="Available once student accounts are live"
              className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-rojo/40 px-5 py-3 font-semibold text-white/70"
            >
              <MessageCircle className="h-5 w-5" /> Contact seller · soon
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 font-semibold text-white hover:border-white/40"
            >
              <Share2 className="h-5 w-5" /> {shareMessage || 'Share'}
            </button>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold text-white">Similar items</h2>
          <ProductGrid products={similar} />
        </section>
      )}
    </div>
  )
}

export default ProductPage
