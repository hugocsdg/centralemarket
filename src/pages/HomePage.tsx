import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  ChefHat,
  Handshake,
  Leaf,
  MessageCircle,
  Search,
  Sparkles,
  Ticket,
  Truck,
} from 'lucide-react'
import { categories, getCategory } from '../data/categories'
import ProductGrid from '../components/ProductGrid'
import { LogoFull } from '../components/Logo'
import LoginPrompt from '../components/LoginPrompt'
import Reveal from '../components/Reveal'
import { fetchListings } from '../lib/listings'
import { useAuth } from '../lib/auth'
import { useQuery } from '../lib/useQuery'
import { useT } from '../i18n/lang'

// Categorías destacadas en la cuadrícula "bento" (cajas de distintos tamaños).
const BENTO = [
  { slug: 'furniture', blurb: 'Desks, chairs, lamps & everything for your room', className: 'col-span-2 md:row-span-2' },
  { slug: 'electronics', blurb: 'Laptops, headphones, chargers', className: '' },
  { slug: 'kitchen', blurb: 'Pans, kettles, coffee machines', className: '' },
  { slug: 'food', blurb: 'Homemade dishes & treats from around the world', className: 'col-span-2' },
  { slug: 'tickets', blurb: 'Parties, concerts, events', className: '' },
  { slug: 'services', blurb: 'Tutoring, moving help & more', className: '' },
]
const MORE = ['clothing', 'books', 'bikes', 'sports', 'other']

// Entradas y comida tienen su propia pantalla; el resto de categorías van a Explore.
function categoryLink(slug: string) {
  if (slug === 'tickets') return '/events'
  if (slug === 'food') return '/food'
  return `/explore?category=${slug}`
}

// Accesos grandes a las pantallas de eventos y comida.
const SPACE_CARDS = [
  {
    to: '/events',
    icon: Ticket,
    title: "What's on tonight",
    text: 'Parties, galas and concerts — grab a ticket from a fellow student, sorted by date.',
    cta: 'See events',
  },
  {
    to: '/food',
    icon: ChefHat,
    title: 'Cooked on campus',
    text: 'Homemade dishes from students around the world. Pick up a portion tonight.',
    cta: 'See dishes',
  },
]

const STEPS = [
  { icon: Camera, title: 'List in 60 seconds', text: 'Snap a few photos, set a price, done. Straight from your phone.' },
  { icon: MessageCircle, title: 'Chat in the app', text: 'Buyers message you right here. No need to share your number.' },
  { icon: Handshake, title: 'Meet on campus', text: 'Agree on a time, hand it over, mark it as sold. Easy.' },
]

function HomePage() {
  const navigate = useNavigate()
  const t = useT()
  // Los anuncios solo se piden si has iniciado sesión (las reglas de Supabase lo exigen).
  const { session } = useAuth()
  const fresh = useQuery(session ? 'home-fresh' : null, () => fetchListings({ limit: 8 }))
  const cheap = useQuery(session ? 'home-cheap' : null, () => fetchListings({ maxPrice: 20, limit: 4 }))

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = new FormData(event.currentTarget).get('q')?.toString().trim()
    navigate(query ? `/explore?q=${encodeURIComponent(query)}` : '/explore')
  }

  return (
    <div className="space-y-24 md:space-y-32">
      {/* ---------- Portada ---------- */}
      <section className="relative grid items-center gap-8 md:grid-cols-[1.15fr_1fr] md:gap-4">
        <div className="relative order-first mx-auto w-full max-w-[18rem] md:order-last md:max-w-md">
          {/* Anillo de luz girando detrás del logo */}
          <div className="absolute inset-[8%] animate-spin-slow rounded-full bg-[conic-gradient(from_0deg,transparent,rgb(224_21_63/0.55),transparent_40%,rgb(255_255_255/0.22),transparent_75%)] blur-2xl" />
          <LogoFull className="relative w-full animate-float drop-shadow-[0_20px_50px_rgba(224,21,63,0.45)]" />
        </div>

        <div className="text-center md:text-left">
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-white/80">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-carmin opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-carmin" />
            </span>
            {t('Made for CentraleSupélec students')}
          </span>

          <h1 className="mt-6 text-5xl leading-[0.95] font-bold sm:text-6xl lg:text-7xl">
            {t('Your campus.')}
            <span className="text-shine block pb-2">{t('Your marketplace.')}</span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-base text-white/65 md:mx-0 md:text-lg">
            {t('Buy, sell and discover great deals from fellow students. Furniture, tech, tickets, homemade food — all in one place.')}
          </p>

          <form
            onSubmit={handleSearch}
            className="glass group mx-auto mt-8 flex max-w-lg items-center gap-2 rounded-full p-1.5 pl-5 transition focus-within:shadow-[0_0_0_4px_rgb(224_21_63/0.18),0_20px_40px_-20px_rgb(0_0_0/0.6)] md:mx-0"
          >
            <Search className="h-5 w-5 shrink-0 text-white/60 transition group-focus-within:text-rosa" />
            <input
              name="q"
              aria-label={t('Search listings')}
              placeholder={t('What are you looking for?')}
              className="w-full bg-transparent py-2 text-white outline-none placeholder:text-white/50"
            />
            <button className="btn-primary shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold">{t('Search')}</button>
          </form>

          <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
            <Link
              to="/explore"
              className="group flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-noche transition hover:bg-white/90"
            >
              {t('Explore marketplace')}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link to="/sell" className="glass rounded-full px-6 py-3 text-sm font-semibold transition hover:bg-white/10">
              {t('Start selling')}
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Cinta de categorías en movimiento ---------- */}
      <div className="-mx-4 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]">
        <div className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
          {[...categories, ...categories].map(({ slug, name, icon: Icon }, index) => (
            <Link
              key={`${slug}-${index}`}
              to={categoryLink(slug)}
              className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm whitespace-nowrap text-white/75 transition hover:text-white"
            >
              <Icon className="h-4 w-4 text-rosa" />
              {t(name)}
            </Link>
          ))}
        </div>
      </div>

      {/* ---------- Las otras dos pantallas: eventos y comida ---------- */}
      <section className="grid gap-3 md:grid-cols-2 md:gap-4">
        {SPACE_CARDS.map(({ to, icon: Icon, title, text, cta }, index) => (
          <Reveal key={to} delay={index * 90}>
            <Link
              to={to}
              className="glass glow-border group relative flex h-full min-h-56 flex-col justify-between overflow-hidden rounded-[2rem] p-6 transition duration-300 hover:-translate-y-1 md:min-h-64 md:p-8"
            >
              <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-carmin/25 blur-3xl transition duration-500 group-hover:scale-125 group-hover:bg-carmin/40" />
              <Icon className="absolute -right-8 -bottom-10 h-52 w-52 rotate-[-10deg] text-white/[0.05] transition duration-500 group-hover:rotate-0 group-hover:text-white/[0.08]" />
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-carmin to-burdeos shadow-lg shadow-rojo/30">
                <Icon className="h-7 w-7" />
              </span>
              <div className="relative mt-8">
                <h2 className="text-3xl font-bold md:text-4xl">{t(title)}</h2>
                <p className="mt-2 max-w-sm text-white/65">{t(text)}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  {t(cta)} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </section>

      {/* ---------- Categorías en "bento" ---------- */}
      <section>
        <Reveal>
          <SectionTitle eyebrow={t('Browse')} title={t('Everything a student needs')} />
        </Reveal>
        <div className="grid auto-rows-[9.5rem] grid-cols-2 gap-3 md:auto-rows-[11rem] md:grid-cols-4 md:gap-4">
          {BENTO.map(({ slug, blurb, className }, index) => {
            const category = getCategory(slug)!
            const Icon = category.icon
            const big = index === 0
            return (
              <Reveal key={slug} delay={index * 70} className={className}>
                <Link
                  to={categoryLink(slug)}
                  className="glass glow-border group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl p-5 transition duration-300 hover:-translate-y-1"
                >
                  <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-carmin/20 blur-2xl transition duration-500 group-hover:scale-150 group-hover:bg-carmin/35" />
                  {big && (
                    <Icon className="absolute -right-6 -bottom-8 h-56 w-56 rotate-[-12deg] text-white/[0.04] transition duration-500 group-hover:rotate-0 group-hover:text-white/[0.07]" />
                  )}
                  <span
                    className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-carmin to-burdeos shadow-lg shadow-rojo/30 ${
                      big ? 'h-14 w-14' : 'h-11 w-11'
                    }`}
                  >
                    <Icon className={big ? 'h-7 w-7' : 'h-5 w-5'} />
                  </span>
                  <div className="relative">
                    <h3 className={`font-semibold ${big ? 'text-2xl md:text-3xl' : 'text-lg'}`}>{t(category.name)}</h3>
                    <p className={`text-white/55 ${big ? 'mt-1 text-sm md:text-base' : 'line-clamp-1 text-xs'}`}>{t(blurb)}</p>
                  </div>
                  <ArrowUpRight className="absolute top-5 right-5 h-5 w-5 text-white/30 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
                </Link>
              </Reveal>
            )
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {MORE.map((slug) => {
            const category = getCategory(slug)!
            const Icon = category.icon
            return (
              <Link
                key={slug}
                to={categoryLink(slug)}
                className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/75 transition hover:text-white"
              >
                <Icon className="h-4 w-4 text-rosa" /> {t(category.name)}
              </Link>
            )
          })}
        </div>
      </section>

      {/* ---------- Lo más nuevo ---------- */}
      <section>
        <Reveal>
          <SectionTitle eyebrow={t('Just listed')} title={t('Fresh on CentraleMarket')} link />
        </Reveal>
        {session ? (
          <ProductGrid listings={fresh.data} loading={fresh.loading} error={fresh.error} />
        ) : (
          <LoginPrompt title={t('See what students are selling')} />
        )}
      </section>

      {/* ---------- Cómo funciona ---------- */}
      <section>
        <Reveal>
          <SectionTitle eyebrow={t('How it works')} title={t('Sell it in three steps')} />
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <Reveal key={title} delay={index * 100}>
              <div className="glass relative h-full overflow-hidden rounded-3xl p-6">
                <span className="text-shine absolute top-3 right-5 font-display text-6xl font-bold opacity-30">
                  0{index + 1}
                </span>
                <Icon className="h-7 w-7 text-rosa" />
                <h3 className="mt-6 text-xl font-semibold">{t(title)}</h3>
                <p className="mt-2 text-sm text-white/60">{t(text)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Me voy del campus ---------- */}
      <Reveal>
        <section className="relative overflow-hidden rounded-[2rem] p-[1px]">
          {/* Borde de luz animado */}
          <div className="absolute inset-0 animate-gradient bg-[linear-gradient(90deg,#e0153f,#ffffff66,#3f3f46,#e0153f)] bg-[length:300%_100%]" />
          <div className="relative flex flex-col items-start gap-6 rounded-[calc(2rem-1px)] bg-noche/90 p-8 backdrop-blur-xl md:flex-row md:items-center md:justify-between md:p-12">
            <div className="absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-carmin/30 blur-3xl" />
            <div className="relative">
              <Truck className="h-8 w-8 text-rosa" />
              <h2 className="mt-4 text-3xl font-bold md:text-4xl">{t('Leaving campus soon?')}</h2>
              <p className="mt-2 max-w-md text-white/65">
                {t("Don't throw it away and don't stress. List your furniture in minutes and hand it over before you fly home.")}
              </p>
            </div>
            <Link
              to="/sell"
              className="group relative flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-noche transition hover:bg-white/90"
            >
              {t('Sell your items')} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </Reveal>

      {/* ---------- Menos de 20 € ---------- */}
      {session && cheap.data && cheap.data.length > 0 && (
        <section>
          <Reveal>
            <SectionTitle eyebrow={t('Student budget')} title={t('Great finds under €20')} link />
          </Reveal>
          <ProductGrid listings={cheap.data} />
        </section>
      )}

      {/* ---------- Sostenibilidad ---------- */}
      <Reveal>
        <section className="glass flex flex-col items-center gap-4 rounded-[2rem] p-8 text-center md:p-12">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-plata/20">
            <Leaf className="h-7 w-7 text-plata" />
          </span>
          <h2 className="text-3xl font-bold md:text-4xl">
            {t('Give your things a')} <span className="text-shine">{t('second life.')}</span>
          </h2>
          <p className="max-w-xl text-white/60">
            {t('Every lamp, chair or bike that changes hands on campus is one less thing thrown away — and one less thing bought new.')}
          </p>
          <Link to="/sell" className="btn-primary mt-2 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
            <Sparkles className="h-4 w-4" /> {t('List something now')}
          </Link>
        </section>
      </Reveal>
    </div>
  )
}

function SectionTitle({ eyebrow, title, link }: { eyebrow: string; title: string; link?: boolean }) {
  const t = useT()
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-rosa uppercase">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-bold md:text-4xl">{title}</h2>
      </div>
      {link && (
        <Link
          to="/explore"
          className="group flex shrink-0 items-center gap-1 text-sm font-semibold text-white/70 transition hover:text-white"
        >
          {t('See all')} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  )
}

export default HomePage
