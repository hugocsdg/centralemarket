import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { Search } from 'lucide-react'
import { categories } from '../data/categories'
import { products } from '../data/products'
import ProductGrid from '../components/ProductGrid'

type Sort = 'newest' | 'price-asc' | 'price-desc'

// Todo el estado de la búsqueda vive en la URL (?q=...&category=...&sort=...),
// así un enlace a una búsqueda se puede compartir por WhatsApp.
function ExplorePage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const category = params.get('category') ?? ''
  const sort = (params.get('sort') as Sort) ?? 'newest'

  function update(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const text = query.trim().toLowerCase()
  const results = products
    .filter((product) => !category || product.category === category)
    .filter(
      (product) =>
        !text || product.title.toLowerCase().includes(text) || product.description.toLowerCase().includes(text),
    )
    .sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      return a.postedDaysAgo - b.postedDaysAgo
    })

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold text-white">Explore</h1>

      <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
        <Search className="h-4 w-4 text-white/50" />
        <input
          value={query}
          onChange={(event) => update('q', event.target.value)}
          placeholder="Search lamps, bikes, tickets…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-white/50"
        />
      </label>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={!category} onClick={() => update('category', '')}>
          All
        </Chip>
        {categories.map((item) => (
          <Chip key={item.slug} active={category === item.slug} onClick={() => update('category', item.slug)}>
            {item.name}
          </Chip>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-white/60">
        <span>
          {results.length} {results.length === 1 ? 'item' : 'items'}
        </span>
        <select
          value={sort}
          onChange={(event) => update('sort', event.target.value === 'newest' ? '' : event.target.value)}
          className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-white [&>option]:bg-noche"
        >
          <option value="newest">Newest first</option>
          <option value="price-asc">Lowest price</option>
          <option value="price-desc">Highest price</option>
        </select>
      </div>

      {results.length > 0 ? (
        <ProductGrid products={results} />
      ) : (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-white/60">
          No items found. Try adjusting your search or filters.
        </p>
      )}
    </div>
  )
}

type ChipProps = {
  active: boolean
  onClick: () => void
  children: ReactNode
}

function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active ? 'bg-gradient-to-r from-rojo to-carmin text-white' : 'border border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}

export default ExplorePage
