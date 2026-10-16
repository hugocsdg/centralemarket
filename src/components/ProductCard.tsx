import { Link } from 'react-router'
import { MapPin } from 'lucide-react'
import { formatPrice } from '../data/products'
import type { Product } from '../data/products'

type ProductCardProps = {
  product: Product
}

function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      to={`/item/${product.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          className="aspect-square w-full object-cover transition group-hover:scale-[1.02]"
        />
        {product.price === 0 && (
          <span className="absolute top-2 left-2 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-rojo shadow">
            Free
          </span>
        )}
        {product.movingOut && (
          <span className="absolute bottom-2 left-2 rounded-full bg-burdeos/90 px-2 py-0.5 text-xs font-medium text-white">
            Moving out
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-lg font-bold text-burdeos">{formatPrice(product.price)}</p>
        <h3 className="truncate text-sm font-medium text-gray-800">{product.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
          <span>{product.condition}</span>
          <span>·</span>
          <MapPin className="h-3 w-3" />
          <span className="truncate">{product.location}</span>
        </p>
      </div>
    </Link>
  )
}

export default ProductCard
