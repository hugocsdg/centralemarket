import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ArrowLeft, LayoutGrid, Search, SlidersHorizontal, X } from 'lucide-react'
import { categories, getCategory } from '../data/categories'
import type { Category } from '../data/categories'
import { fetchListings } from '../lib/listings'
import { useAuth } from '../lib/auth'
import { useQuery } from '../lib/useQuery'
import ProductGrid from '../components/ProductGrid'
import LoginPrompt from '../components/LoginPrompt'
import SpaceTabs from '../components/SpaceTabs'
import FilterSheet from '../components/FilterSheet'
import { countFilters, readFilters } from '../lib/filters'

// Market tiene dos vistas:
// - Sin búsqueda, categoría ni filtros: la cuadrícula de categorías con sus dibujos (como Vinted).
// - Con categoría (?category=…), «All items» (?all=1), algo escrito o algún filtro: los anuncios.
// Todo el estado de la búsqueda vive en la URL (?q=...&category=...&max=20&cond=Good…),
// así un enlace a una búsqueda se puede compartir por WhatsApp.
function ExplorePage() {
  const { session } = useAuth()
  const [params, setParams] = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)
  const query = params.get('q') ?? ''
  const category = params.get('category') ?? ''
  const filters = readFilters(params)
  const activeCount = countFilters(filters)
  const browsing = !query && !category && !params.has('all') && activeCount === 0
  const toNumber = (value: string) => (value && !Number.isNaN(Number(value)) ? Number(value) : undefined)

  // Se vuelve a pedir a Supabase cada vez que cambia algo de la búsqueda (la URL entera es la "clave").
  const { data, loading, error } = useQuery(session && !browsing ? `explore|${params.toString()}` : null, () =>
    fetchListings({
      query,
      category,
      sort: filters.sort,
      priceFrom: filters.free ? undefined : toNumber(filters.min),
      priceTo: filters.free ? undefined : toNumber(filters.max),
      freeOnly: filters.free,
      conditions: filters.conditions,
      location: filters.location,
      hideReserved: filters.available,
      movingOut: filters.movingOut,
      priceDrop: filters.priceDrop,
    }),
  )

  const update = useCallback(
    (changes: Record<string, string>) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value)
            else next.delete(key)
          }
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const closeSheet = useCallback(() => setSheetOpen(false), [])

  // Quita todos los filtros del panel, pero deja la búsqueda y la categoría.
  function clearFilters() {
    update({ sort: '', min: '', max: '', cond: '', loc: '', free: '', avail: '', moving: '', drop: '' })
  }

  // Las "etiquetas" de los filtros puestos, cada una con su ✕ para quitarla.
  const active: { label: string; clear: Record<string, string> }[] = []
  if (filters.free) active.push({ label: 'Free', clear: { free: '' } })
  else if (filters.min || filters.max) {
    const label =
      filters.min && filters.max
        ? `${filters.min}–${filters.max} €`
        : filters.max
          ? `Under ${filters.max} €`
          : `From ${filters.min} €`
    active.push({ label, clear: { min: '', max: '' } })
  }
  for (const condition of filters.conditions) {
    active.push({ label: condition, clear: { cond: filters.conditions.filter((c) => c !== condition).join(',') } })
  }
  if (filters.location) active.push({ label: filters.location, clear: { loc: '' } })
  if (filters.available) active.push({ label: 'Available now', clear: { avail: '' } })
  if (filters.priceDrop) active.push({ label: 'Price drops', clear: { drop: '' } })
  if (filters.movingOut) active.push({ label: 'Moving out', clear: { moving: '' } })

  const count = data ? `${data.length} ${data.length === 1 ? 'item' : 'items'}` : ''

  return (
    <div className="space-y-5">
      <SpaceTabs />

      {browsing ? (
        <div>
          <h1 className="text-3xl font-bold">Market</h1>
          <p className="mt-1 text-sm text-white/60">Furniture, tech, clothes and everything in between.</p>
        </div>
      ) : (
        <div>
          <Link
            to="/explore"
            className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-white/70 hover:text-white"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /> All categories
          </Link>
          <h1 className="text-3xl font-bold">
            {getCategory(category)?.name ?? (query ? 'Search results' : 'All items')}
          </h1>
        </div>
      )}

      <div className="flex gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm focus-within:border-rosa/60">
          <Search className="h-4 w-4 shrink-0 text-white/50" />
          <input
            value={query}
            onChange={(event) => update({ q: event.target.value })}
            aria-label="Search listings"
            placeholder="Search lamps, bikes, tickets…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-white/50"
          />
          {query && (
            <button
              onClick={() => update({ q: '' })}
              aria-label="Clear search"
              className="-my-2 -mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
        <button
          onClick={() => setSheetOpen(true)}
          aria-label={`Filters${activeCount ? ` (${activeCount} active)` : ''}`}
          className={`relative flex min-h-12 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
            activeCount ? 'btn-primary text-white' : 'glass text-white/85 hover:bg-white/10'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-noche">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {browsing ? (
        <CategoryGrid />
      ) : (
        <>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {/* "All" enseña todos los anuncios (no vuelve a las tarjetas) */}
            <Chip active={!category} onClick={() => update({ category: '', all: '1' })}>
              All
            </Chip>
            {categories.map((item) => (
              <Chip
                key={item.slug}
                active={category === item.slug}
                onClick={() => update({ category: item.slug, all: '' })}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.name}
              </Chip>
            ))}
          </div>

          {active.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {active.map((item) => (
                <button
                  key={item.label}
                  onClick={() => update(item.clear)}
                  aria-label={`Remove filter ${item.label}`}
                  className="flex min-h-9 items-center gap-1.5 rounded-full border border-rosa/40 bg-rojo/15 py-1 pr-2 pl-3 text-xs font-semibold text-white transition hover:bg-rojo/25"
                >
                  {item.label}
                  <X className="h-3.5 w-3.5 text-white/70" />
                </button>
              ))}
              <button
                onClick={clearFilters}
                className="min-h-9 px-2 text-xs font-semibold text-white/60 underline-offset-4 hover:text-white hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          {!session ? (
            <LoginPrompt />
          ) : (
            <>
              <p className="text-sm text-white/60">
                {count}
                {category && data && ` in ${getCategory(category)?.name ?? category}`}
              </p>

              <ProductGrid
                listings={data}
                loading={loading}
                error={error}
                empty={
                  query || category || activeCount
                    ? 'No items found. Try removing a filter or searching for something else.'
                    : 'Nothing here yet. Be the first to list something!'
                }
              />
            </>
          )}
        </>
      )}

      <FilterSheet
        open={sheetOpen}
        filters={filters}
        onChange={update}
        onClear={clearFilters}
        onClose={closeSheet}
        resultLabel={loading || !data ? 'Show results' : `Show ${count}`}
      />
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

// Tarjeta de categoría: el nombre arriba y su dibujo en 3D abajo a la derecha (o el icono si no hay dibujo).
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
      className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active ? 'btn-primary text-white' : 'glass text-white/80 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}

export default ExplorePage
