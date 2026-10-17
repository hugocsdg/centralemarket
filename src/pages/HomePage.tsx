import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight, Leaf, Search } from 'lucide-react'
import { categories } from '../data/categories'
import ProductGrid from '../components/ProductGrid'
import { LogoFull } from '../components/Logo'
import LoginPrompt from '../components/LoginPrompt'
import { fetchListings } from '../lib/listings'
import { useAuth } from '../lib/auth'
import { useQuery } from '../lib/useQuery'

function HomePage() {
  const navigate = useNavigate()

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = new FormData(event.currentTarget).get('q')?.toString().trim()
    navigate(query ? `/explore?q=${encodeURIComponent(query)}` : '/explore')
  }

  // Los anuncios solo se piden si has iniciado sesión (las reglas de Supabase lo exigen).
  const { session } = useAuth()
  const fresh = useQuery(session ? 'home-fresh' : null, () => fetchListings({ limit: 8 }))
  const cheap = useQuery(session ? 'home-cheap' : null, () => fetchListings({ maxPrice: 20, limit: 4 }))

  return (
    <div className="space-y-12">
      {/* Portada: tu logo en grande sobre el fondo oscuro con ondas */}
      <section className="grid items-center gap-8 pt-2 md:grid-cols-2 md:gap-12 md:pt-8">
        <div className="relative order-first mx-auto w-full max-w-sm md:order-last md:max-w-md">
          <div className="pointer-events-none absolute inset-0 rounded-full bg-rojo/30 blur-3xl" />
          <LogoFull className="relative w-full drop-shadow-[0_10px_30px_rgba(224,21,63,0.35)]" />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Your campus.
            <br />
            <span className="bg-gradient-to-r from-carmin to-morado bg-clip-text text-transparent">Your marketplace.</span>
          </h1>
          <p className="mt-4 text-white/70">
            Buy, sell and discover great deals from fellow CentraleSupélec students. Everything you need, all in one
            place.
          </p>
          <form
            onSubmit={handleSearch}
            className="mt-6 flex items-center gap-2 rounded-full border border-white/15 bg-white/10 p-1.5 pl-4 backdrop-blur-md"
          >
            <Search className="h-4 w-4 shrink-0 text-white/50" />
            <input
              name="q"
              placeholder="What are you looking for?"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/50"
            />
            <button className="rounded-full bg-gradient-to-r from-rojo to-carmin px-4 py-2 text-sm font-semibold text-white">
              Search
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/explore"
              className="rounded-full bg-gradient-to-r from-rojo to-carmin px-5 py-2.5 text-sm font-semibold shadow-lg shadow-rojo/30 hover:brightness-110"
            >
              Explore marketplace
            </Link>
            <Link to="/sell" className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold hover:bg-white/10">
              Start selling
            </Link>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section>
        <h2 className="mb-4 text-2xl font-bold">Categories</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map(({ slug, name, icon: Icon }) => (
            <Link
              key={slug}
              to={`/explore?category=${slug}`}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rojo/20 text-rosa">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-white/85">{name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Lo más nuevo */}
      <section>
        <SectionTitle title="Fresh on CentraleMarket" subtitle="See what your fellow students just listed." />
        {session ? (
          <ProductGrid listings={fresh.data} loading={fresh.loading} error={fresh.error} />
        ) : (
          <LoginPrompt title="See what students are selling" />
        )}
      </section>

      {/* Me voy del campus */}
      <section className="flex flex-col items-start gap-4 rounded-3xl border border-white/10 bg-gradient-to-r from-burdeos/70 to-rojo/40 p-6 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="text-2xl font-bold">Leaving campus soon?</h2>
          <p className="mt-1 text-white/70">Find a new home for the things you no longer need.</p>
        </div>
        <Link
          to="/sell"
          className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-burdeos hover:bg-white/90"
        >
          Sell your items <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Menos de 20 € */}
      {session && cheap.data && cheap.data.length > 0 && (
        <section>
          <SectionTitle title="Great finds under €20" subtitle="Student budget approved." />
          <ProductGrid listings={cheap.data} />
        </section>
      )}

      {/* Sostenibilidad */}
      <section className="flex items-start gap-4 rounded-3xl border border-white/10 bg-morado/10 p-6 backdrop-blur-sm sm:p-8">
        <Leaf className="mt-1 h-6 w-6 shrink-0 text-morado" />
        <div>
          <h2 className="text-xl font-bold">Give your things a second life.</h2>
          <p className="mt-1 text-white/70">
            Every lamp, chair or bike that changes hands on campus is one less thing thrown away and one less thing
            bought new.
          </p>
        </div>
      </section>
    </div>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-white/60">{subtitle}</p>
      </div>
      <Link to="/explore" className="shrink-0 text-sm font-semibold text-rosa hover:underline">
        See all
      </Link>
    </div>
  )
}

export default HomePage
