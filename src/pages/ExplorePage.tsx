import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { Search } from 'lucide-react'
import { categories } from '../data/categories'
import { fetchListings } from '../lib/listings'
import type { Sort } from '../lib/listings'
import { useAuth } from '../lib/auth'
import { useQuery } from '../lib/useQuery'
import ProductGrid from '../components/ProductGrid'
import LoginPrompt from '../components/LoginPrompt'

// Todo el estado de la búsqueda vive en la URL (?q=...&category=...&sort=...),
// así un enlace a una búsqueda se puede compartir por WhatsApp.
function ExplorePage() {
  const { session } = useAuth()
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const category = params.get('category') ?? ''
  const sort = (params.get('sort') as Sort) ?? 'newest'

  // Se vuelve a pedir a Supabase cada vez que cambia la búsqueda, la categoría o el orden.
  const { data, loading, error } = useQuery(session ? `explore|${query}|${category}|${sort}` : null, () =>
    fetchListings({ query, category, sort }),
  )

  function update(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Explore</h1>

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

      {!session ? (
        <LoginPrompt />
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-white/60">
            <span>{data ? `${data.length} ${data.length === 1 ? 'item' : 'items'}` : ' '}</span>
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

          <ProductGrid
            listings={data}
            loading={loading}
            error={error}
            empty={
              query || category
                ? 'No items found. Try adjusting your search or filters.'
                : 'Nothing here yet. Be the first to list something!'
            }
          />
        </>
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
        active
          ? 'btn-primary text-white'
          : 'glass text-white/80 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}

export default ExplorePage
