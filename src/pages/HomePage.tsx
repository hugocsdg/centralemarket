import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight, Leaf, Search } from 'lucide-react'
import { categories } from '../data/categories'
import { products } from '../data/products'
import ProductGrid from '../components/ProductGrid'
import SampleDataNotice from '../components/SampleDataNotice'

function HomePage() {
  const navigate = useNavigate()

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = new FormData(event.currentTarget).get('q')?.toString().trim()
    navigate(query ? `/explore?q=${encodeURIComponent(query)}` : '/explore')
  }

  const freshProducts = [...products].sort((a, b) => a.postedDaysAgo - b.postedDaysAgo).slice(0, 8)
  const underTwenty = products.filter((product) => product.price < 20).slice(0, 4)

  return (
    <div className="space-y-12">
      {/* Portada, inspirada en el fondo del logo */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a0010] via-burdeos to-rojo px-6 py-12 text-white sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-rojo/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-morado/30 blur-3xl" />
        <div className="relative max-w-xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Your campus. Your marketplace.</h1>
          <p className="mt-4 text-white/80">
            Buy, sell and discover great deals from fellow CentraleSupélec students. Everything you need, all in one
            place.
          </p>
          <form onSubmit={handleSearch} className="mt-6 flex items-center gap-2 rounded-full bg-white p-1.5 pl-4 text-gray-800">
            <Search className="h-4 w-4 shrink-0 text-gray-500" />
            <input
              name="q"
              placeholder="What are you looking for?"
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-500"
            />
            <button className="rounded-full bg-rojo px-4 py-2 text-sm font-semibold text-white">Search</button>
          </form>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/explore" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-burdeos">
              Explore marketplace
            </Link>
            <Link to="/sell" className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold">
              Start selling
            </Link>
          </div>
        </div>
      </section>

      <SampleDataNotice />

      {/* Categorías */}
      <section>
        <h2 className="mb-4 text-2xl font-bold text-burdeos">Categories</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map(({ slug, name, icon: Icon }) => (
            <Link
              key={slug}
              to={`/explore?category=${slug}`}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavanda text-burdeos">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-gray-800">{name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Lo más nuevo */}
      <section>
        <SectionTitle title="Fresh on CentraleMarket" subtitle="See what your fellow students just listed." />
        <ProductGrid products={freshProducts} />
      </section>

      {/* Me voy del campus */}
      <section className="flex flex-col items-start gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="text-2xl font-bold text-burdeos">Leaving campus soon?</h2>
          <p className="mt-1 text-gray-600">Find a new home for the things you no longer need.</p>
        </div>
        <Link
          to="/sell"
          className="flex items-center gap-2 rounded-full bg-rojo px-5 py-2.5 text-sm font-semibold text-white"
        >
          Sell your items <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Menos de 20 € */}
      <section>
        <SectionTitle title="Great finds under €20" subtitle="Student budget approved." />
        <ProductGrid products={underTwenty} />
      </section>

      {/* Sostenibilidad */}
      <section className="flex items-start gap-4 rounded-3xl bg-morado/15 p-6 sm:p-8">
        <Leaf className="mt-1 h-6 w-6 shrink-0 text-burdeos" />
        <div>
          <h2 className="text-xl font-bold text-burdeos">Give your things a second life.</h2>
          <p className="mt-1 text-gray-700">
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
        <h2 className="text-2xl font-bold text-burdeos">{title}</h2>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>
      <Link to="/explore" className="shrink-0 text-sm font-semibold text-rojo hover:underline">
        See all
      </Link>
    </div>
  )
}

export default HomePage
