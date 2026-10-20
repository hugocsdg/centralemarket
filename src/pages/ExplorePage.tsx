import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ArrowLeft, LayoutGrid, Search } from 'lucide-react'
import type { Category } from '../data/categories'
import { categories, getCategory } from '../data/categories'
import { fetchListings } from '../lib/listings'
import type { Sort } from '../lib/listings'
import { useAuth } from '../lib/auth'
import { useQuery } from '../lib/useQuery'
import ProductGrid from '../components/ProductGrid'
import LoginPrompt from '../components/LoginPrompt'

// Explore tiene dos vistas:
// - Sin búsqueda ni categoría: la cuadrícula de categorías (como Vinted).
// - Con categoría (?category=…), "All items" (?all=1) o algo escrito (?q=…): los anuncios.
// Todo el estado vive en la URL, así un enlace a una búsqueda se puede compartir.
function ExplorePage() {
  const { session } = useAuth()
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const category = params.get('category') ?? ''
  const sort = (params.get('sort') as Sort) ?? 'newest'
  const browsing = !query && !category && !params.has('all')

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

  // Elegir categoría desde las pastillas: "All" muestra todos los anuncios (no vuelve a las tarjetas).
  function pickCategory(slug: string) {
    const next = new URLSearchParams(params)
    if (slug) {
      next.set('category', slug)
      next.delete('all')
    } else {
      next.delete('category')
      next.set('all', '1')
    }
    setParams(next, { replace: true })
  }

  const current = getCategory(category)

  return (
    <div className="space-y-5">
      {browsing ? (
        <h1 className="text-3xl font-bold">Explore</h1>
      ) : (
        <div>
          <Link
            to="/explore"
            className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-white/70 hover:text-white"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /> All categories
          </Link>
          <h1 className="text-3xl font-bold">{current?.name ?? (query ? 'Search results' : 'All items')}</h1>
        </div>
      )}

      <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
        <Search className="h-4 w-4 text-white/50" />
        <input
          value={query}
          onChange={(event) => update('q', event.target.value)}
          aria-label="Search listings"
          placeholder="Search lamps, bikes, tickets…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-white/50"
        />
      </label>

      {browsing ? (
        <CategoryGrid />
      ) : (
        <>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            <Chip active={!category} onClick={() => pickCategory('')}>
              All
            </Chip>
            {categories.map((item) => (
              <Chip key={item.slug} active={category === item.slug} onClick={() => pickCategory(item.slug)}>
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
                  aria-label="Sort by"
                  value={sort}
                  onChange={(event) => update('sort', event.target.value === 'newest' ? '' : event.target.value)}
                  className="min-h-11 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-white [&>option]:bg-noche"
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
        </>
      )}
    </div>
  )
}

// La cuadrícula de categorías: dos columnas en el móvil, más en pantallas grandes.
function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      <Link
        to="/explore?all=1"
        className="group relative col-span-2 flex min-h-28 items-center justify-between overflow-hidden rounded-3xl btn-primary p-5 md:col-span-3 lg:col-span-4"
      >
        <span>
          <span className="block text-xl font-bold">All items</span>
          <span className="text-sm text-white/85">Everything for sale on campus, newest first</span>
        </span>
        <LayoutGrid aria-hidden="true" className="h-10 w-10 shrink-0 transition duration-300 group-hover:scale-110" />
      </Link>
      {categories.map((item) => (
        <CategoryCard key={item.slug} category={item} />
      ))}
    </div>
  )
}

function CategoryCard({ category }: { category: Category }) {
  const Icon = category.icon
  return (
    <Link
      to={`/explore?category=${category.slug}`}
      className="group relative flex aspect-[4/3.2] flex-col justify-between overflow-hidden rounded-3xl glass p-4 transition duration-300 hover:-translate-y-1 hover:bg-white/10 sm:p-5"
    >
      <span className="relative z-10 text-base leading-snug font-semibold text-balance sm:text-lg">
        {category.name}
      </span>
      {category.image ? (
        <img
          src={category.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute right-2 bottom-2 h-[64%] max-w-[70%] object-contain object-right-bottom drop-shadow-[0_12px_18px_rgb(0_0_0/0.45)] transition duration-500 group-hover:scale-105 group-hover:-rotate-3"
        />
      ) : (
        <span className="absolute right-3 bottom-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-carmin to-burdeos shadow-lg shadow-rojo/30 transition duration-500 group-hover:scale-105 group-hover:-rotate-6 sm:h-20 sm:w-20">
          <Icon aria-hidden="true" className="h-8 w-8 sm:h-10 sm:w-10" />
        </span>
      )}
    </Link>
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
      className={`flex min-h-11 shrink-0 items-center rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active ? 'btn-primary text-white' : 'glass text-white/80 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}

export default ExplorePage
