type ProductCardProps = {
  title: string
  price: number
  condition: string
  location: string
  image: string
}

function ProductCard({ title, price, condition, location, image }: ProductCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <img src={image} alt={title} className="aspect-square w-full object-cover" />
      <div className="p-3">
        <p className="text-lg font-bold text-burdeos">{price} €</p>
        <h3 className="truncate text-sm font-medium text-gray-800">{title}</h3>
        <p className="text-xs text-gray-500">
          {condition} · {location}
        </p>
      </div>
    </div>
  )
}

export default ProductCard
