import { useEffect, useRef } from 'react'
import type { PointerEvent } from 'react'
import { Link } from 'react-router'
import 'lenis/dist/lenis.css'
import { ArrowRight, Coins, Luggage, MapPin, PlaneLanding, ShieldCheck, SkipForward, Sparkles, Users, Warehouse } from 'lucide-react'
import Background from '../components/Background'
import Logo from '../components/Logo'
import PhoneStory from '../components/intro/PhoneStory'
import MacScene from '../components/intro/MacScene'
import CampusScene from '../components/intro/CampusScene'
import Journey from '../components/intro/Journey'
import { categories } from '../data/categories'
import { photo } from '../data/photos'
import { scrollToSection, useIntroAnimations } from '../lib/useIntroAnimations'
import { ParticleField, buildShapes } from '../lib/particles'
import type { Morph, Pose } from '../lib/particles'
import { useAuth } from '../lib/auth'
import { markIntroSeen } from '../lib/intro'

// Página de presentación: cuenta qué es CentraleMarket mientras haces scroll, como un vídeo.
// - Partículas de luz (lib/particles.ts) que forman el logo.
// - El campus en 3D con arcos entre compradores y vendedores (components/intro/CampusScene.tsx).
// - Un MacBook en cuya pantalla se entra para ver fotos reales (components/intro/MacScene.tsx).
// - Una cinta infinita con las categorías.
// - Un móvil que cuenta la historia (components/intro/PhoneStory.tsx).
// - Tarjetas "bento" para quién es, un viaje horizontal por un año y el final con el logo.
// - Índice de capítulos a la derecha (escritorio) y botón "Skip intro" para ir al final.
// Todas las animaciones de scroll están en lib/useIntroAnimations.ts.

// Capítulos: el id es el del <div> que envuelve cada escena (para el índice y los saltos).
const CHAPTERS = [
  { id: 'campus', label: 'Campus' },
  { id: 'market', label: 'The market' },
  { id: 'how', label: 'How it works' },
  { id: 'for-you', label: 'For you' },
  { id: 'year', label: 'A year' },
  { id: 'join', label: 'Join' },
]

const TRUST = [
  { icon: ShieldCheck, text: 'Verified students only' },
  { icon: Coins, text: '0 € fees' },
  { icon: MapPin, text: 'Paris-Saclay campus' },
]

const AUDIENCE = [
  { icon: Luggage, title: 'Students leaving', text: 'Sell your things before your flight home, not after.' },
  { icon: Users, title: 'Everyone on campus', text: "French, Erasmus, exchange, Master's: one student community." },
  { icon: Sparkles, title: 'Student makers', text: 'Cook, tutor, help with moves — offer your own services.' },
]

const STATS = [
  { count: categories.length, label: 'categories, from desks to party tickets' },
  { count: 60, suffix: 's', label: 'is all it takes to publish an item' },
  { count: 0, from: 100, suffix: '€', label: 'in fees. Selling is free, always' },
  { count: 100, suffix: '%', label: 'verified CentraleSupélec students' },
]

const YEAR = new Date().getFullYear()

const GOALS = ['Keep good things in use.', 'Help students save money.', 'Make arriving and leaving campus easier.']

// Dónde y cómo se colocan las partículas (índices usados en useIntroAnimations):
// 0 logo de portada · 1 anillo de fondo · 2 logo final
const POSES: { desktop: Pose[]; mobile: Pose[] } = {
  desktop: [
    { shape: 0, cx: 0.73, cy: 0.5, size: 0.55, alpha: 1 },
    { shape: 1, cx: 0.5, cy: 0.5, size: 1.3, alpha: 0.35, spin: 1 },
    { shape: 0, cx: 0.5, cy: 0.24, size: 0.34, alpha: 1 },
  ],
  mobile: [
    { shape: 0, cx: 0.5, cy: 0.25, size: 0.62, alpha: 1 },
    { shape: 1, cx: 0.5, cy: 0.5, size: 1.7, alpha: 0.3, spin: 1 },
    { shape: 0, cx: 0.5, cy: 0.2, size: 0.56, alpha: 1 },
  ],
}

function IntroPage() {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  // El scroll escribe aquí y las partículas lo leen en cada fotograma.
  const morph = useRef<Morph>({ from: 0, to: 0, t: 0 })
  const { session } = useAuth()

  useIntroAnimations(root, morph)

  // Recordar que ya se vio la introducción en este dispositivo.
  useEffect(() => markIntroSeen(), [])

  // Crear las partículas.
  useEffect(() => {
    let field: ParticleField | null = null
    let cancelled = false
    const count = window.innerWidth < 768 ? 1100 : 2200
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    buildShapes(count).then((shapes) => {
      if (cancelled || !canvas.current) return
      field = new ParticleField(canvas.current, shapes, POSES, morph.current)
      if (reduced) field.drawStatic()
      else field.start()
    })
    return () => {
      cancelled = true
      field?.stop()
    }
  }, [])

  const cta = session ? { to: '/', label: 'Enter marketplace' } : { to: '/login', label: 'Get started' }

  return (
    <div ref={root} className="relative min-h-screen overflow-x-clip text-white">
      <Background />
      <canvas ref={canvas} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 h-full w-full" />

      {/* Barra de progreso de lectura */}
      <div
        data-progress
        className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-carmin via-rosa to-plata"
      />

      {/* Cabecera: se encoge y se oscurece al bajar */}
      <header data-intro-header className="intro-header fixed inset-x-0 top-0 z-40 px-3 pt-3">
        <div className="intro-bar glass mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full pr-2 pl-4">
          <Logo />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollToSection('join')}
              className="hidden min-h-11 items-center rounded-full px-3 text-sm font-medium whitespace-nowrap text-white/60 transition hover:text-white sm:flex"
            >
              Skip intro
            </button>
            {!session && (
              <Link
                to="/login"
                className="hidden min-h-11 items-center rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap text-white/70 transition hover:text-white sm:flex"
              >
                Log in
              </Link>
            )}
            <Link
              to={cta.to}
              className="btn-primary flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap"
            >
              {cta.label} <ArrowRight className="hidden h-4 w-4 sm:block" />
            </Link>
          </div>
        </div>
      </header>

      {/* Móvil: en la cabecera no cabe, así que "Skip intro" flota abajo (se esconde al llegar al final) */}
      <button
        type="button"
        data-skip-pill
        onClick={() => scrollToSection('join')}
        className="glass fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex min-h-11 items-center gap-1.5 rounded-full bg-noche/60 px-4 text-sm font-medium text-white/80 pointer-events-none opacity-0 transition-opacity duration-300 sm:hidden"
      >
        Skip intro <SkipForward aria-hidden="true" className="h-4 w-4" />
      </button>

      {/* Índice de capítulos (solo escritorio): se ilumina el capítulo actual y se puede saltar */}
      <nav
        data-chapter-rail
        aria-label="Chapters"
        className="fixed top-1/2 right-5 z-30 hidden -translate-y-1/2 flex-col items-end gap-1 opacity-0 transition-opacity duration-500 lg:flex"
      >
        {CHAPTERS.map(({ id, label }, i) => (
          <button
            key={id}
            type="button"
            data-chapter-link={id}
            onClick={() => scrollToSection(id)}
            className="group flex min-h-8 items-center gap-3 rounded-full py-1 pl-3 text-xs font-medium text-white/60 transition hover:text-white data-active:text-white"
          >
            <span className="translate-x-2 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-data-active:translate-x-0 group-data-active:opacity-100">
              <span className="mr-1.5 font-display text-rosa tabular-nums">0{i + 1}</span>
              {label}
            </span>
            <span className="h-px w-5 bg-white/30 transition-all duration-300 group-hover:w-8 group-data-active:w-10 group-data-active:bg-rosa" />
          </button>
        ))}
      </nav>

      <main className="relative z-10">
        {/* ---------- 1. Portada (las partículas forman el logo) ---------- */}
        <section
          data-hero
          className="mx-auto flex min-h-[100svh] max-w-6xl items-end px-4 pt-[42svh] pb-12 md:items-center md:pt-24"
        >
          <div className="w-full text-center md:w-[55%] md:text-left">
            <span
              data-hero-fade
              className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-white/80"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-carmin/70" />
                <span className="relative h-2 w-2 rounded-full bg-carmin" />
              </span>
              For CentraleSupélec students
            </span>
            <h1 className="mt-5 text-[2.6rem] leading-[1.02] font-bold tracking-[-0.035em] sm:text-6xl lg:text-[5.25rem]">
              <HeroWords text="The campus marketplace" />
              <span className="block">
                <HeroWords text="you were waiting for." wordClassName="text-shine" />
              </span>
            </h1>
            <p data-hero-fade className="mx-auto mt-5 max-w-lg text-base text-pretty text-white/65 md:mx-0 md:text-lg">
              Buy, sell and swap everything student life needs — with people from your own school.
            </p>
            <div data-hero-fade className="mt-7 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <Link
                to={cta.to}
                data-magnetic
                className="btn-primary group flex min-h-12 items-center gap-2 rounded-full px-7 py-3.5 font-semibold"
              >
                {cta.label}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <button
                type="button"
                data-magnetic
                onClick={() => scrollToSection('how')}
                className="flex min-h-12 items-center rounded-full border border-white/15 bg-white/[0.04] px-6 py-3.5 font-semibold text-white/85 backdrop-blur-md transition hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
              >
                How it works
              </button>
            </div>
            <ul
              data-hero-fade
              className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/60 md:justify-start"
            >
              {TRUST.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-1.5">
                  <Icon aria-hidden="true" className="h-4 w-4 text-rosa" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Indicador de scroll (ratón con un punto que baja) */}
        <div
          data-scroll-hint
          aria-hidden="true"
          className="pointer-events-none absolute top-[calc(100svh-4.5rem)] left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
        >
          <span className="flex h-9 w-[22px] justify-center rounded-full border border-white/25 pt-2">
            <span className="h-1.5 w-1 animate-scroll-dot rounded-full bg-white/80" />
          </span>
          <span className="text-[11px] tracking-[0.3em] text-white/60 uppercase">Scroll</span>
        </div>

        {/* El div de alrededor de cada escena fijada es necesario: GSAP mete la escena en otro contenedor.
            Además lleva el id del capítulo (índice de la derecha y saltos). */}

        {/* ---------- 2. El campus en 3D con las conexiones entre estudiantes ---------- */}
        <div id="campus" data-chapter>
          <CampusScene />
        </div>

        {/* ---------- 3. MacBook: zoom a la pantalla con fotos reales ---------- */}
        <div id="market" data-chapter>
          <MacScene />
        </div>

        {/* ---------- 4. Cinta infinita con las categorías ---------- */}
        <section aria-label="Categories" className="relative overflow-hidden py-16 md:py-24">
          <div className="flex flex-col gap-3 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)] md:gap-5">
            <Marquee items={categories.map((c) => c.name)} />
            <Marquee items={[...categories].reverse().map((c) => c.name)} outline reverse />
          </div>
        </section>

        {/* ---------- 5. El móvil cuenta la historia ---------- */}
        <div id="how" data-chapter>
          <PhoneStory />
        </div>

        {/* ---------- 6. Para quién (tarjetas bento) ---------- */}
        <section id="for-you" data-chapter className="mx-auto max-w-6xl px-4 py-24 md:py-36">
          <SectionHeading eyebrow="Who it's for" title="Made for every CentraleSupélec student" />
          <div
            onPointerMove={trackSpotlight}
            className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[repeat(2,minmax(15rem,auto))]"
          >
            {/* Tarjeta grande con foto */}
            <article
              data-reveal
              className="group relative min-h-[22rem] overflow-hidden rounded-[2rem] border border-white/10 md:col-span-2 lg:row-span-2"
            >
              <img
                src={photo('armchair', 1000)}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-[70%_60%] transition duration-[1.2s] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-noche via-noche/60 to-noche/10" />
              <div className="relative flex h-full flex-col justify-end p-7 md:p-9">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                  <PlaneLanding aria-hidden="true" className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-3xl font-bold md:text-4xl">New arrivals</h3>
                <p className="mt-2 max-w-sm text-white/70 md:text-lg">
                  Furnish your room in a weekend without paying full price. Picked up on campus, no delivery fees.
                </p>
              </div>
            </article>

            {AUDIENCE.map(({ icon: Icon, title, text }, i) => (
              <article
                key={title}
                data-reveal
                className={`glass spotlight group flex flex-col justify-between rounded-[2rem] p-7 ${i === 0 ? 'lg:col-span-2' : ''}`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-carmin to-burdeos shadow-lg shadow-rojo/30 transition duration-500 group-hover:scale-110 group-hover:rotate-[-6deg]">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <div className="mt-10">
                  <h3 className="text-xl font-semibold md:text-2xl">{title}</h3>
                  <p className="mt-2 text-sm text-white/60 md:text-base">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- 7. Un año en el campus (horizontal) ---------- */}
        <div id="year" data-chapter>
          <Journey />
        </div>

        {/* ---------- 8. En cifras: una sola franja con separadores ---------- */}
        <section className="mx-auto max-w-6xl px-4 py-24 md:py-32">
          <div data-reveal className="glass grid grid-cols-2 overflow-hidden rounded-[2rem] lg:grid-cols-4">
            {STATS.map(({ count, from, suffix, label }, i) => (
              <div
                key={label}
                className={`p-6 md:p-9 ${i % 2 ? 'border-l border-white/10' : ''} ${i >= 2 ? 'border-t border-white/10 lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l' : ''}`}
              >
                <p
                  data-count={count}
                  data-from={from}
                  data-suffix={suffix}
                  className="font-display text-5xl font-bold tracking-tight tabular-nums md:text-6xl"
                >
                  {count}
                  {suffix}
                </p>
                <p className="mt-3 text-sm text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- 9. Nuestro objetivo ---------- */}
        <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p data-reveal className="text-xs font-semibold tracking-[0.25em] text-rosa uppercase">
            Our goal
          </p>
          <div className="mt-6 space-y-2">
            {GOALS.map((goal) => (
              <p
                key={goal}
                data-line
                className="font-display text-4xl leading-tight font-bold tracking-[-0.03em] text-balance sm:text-5xl md:text-6xl"
              >
                {goal}
              </p>
            ))}
          </div>

          <div
            data-reveal
            className="mt-16 flex flex-col gap-6 rounded-[2rem] border border-dashed border-white/15 p-8 md:flex-row md:items-center md:p-10"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-plata/15">
              <Warehouse aria-hidden="true" className="h-7 w-7 text-plata" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-plata uppercase">
                Coming soon · an idea in progress
              </p>
              <h3 className="mt-2 text-2xl font-semibold">Campus Storage</h3>
              <p className="mt-2 max-w-2xl text-white/60">
                Leaving before you've sold your furniture? We'd love to let you leave it in a campus storage space and keep
                selling from home. Not available yet — it depends on the school, and we're working on it.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- 10. Final (las partículas vuelven a ser el logo) ---------- */}
        <section
          id="join"
          data-chapter
          data-final-scene
          className="flex min-h-[100svh] items-end justify-center px-4 pt-[46svh] pb-20 text-center md:pt-[52svh]"
        >
          <div data-reveal>
            <h2 className="text-5xl font-bold tracking-[-0.035em] sm:text-6xl md:text-8xl">
              Ready to <span className="text-shine">join?</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-lg text-white/60">
              It takes 30 seconds. All you need is your <span className="whitespace-nowrap">@student-cs.fr</span> email.
            </p>
            <Link
              to={cta.to}
              data-magnetic
              className="btn-primary group mt-9 inline-flex min-h-14 items-center gap-2 rounded-full px-10 py-4 text-lg font-semibold"
            >
              {cta.label}
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </main>

      {/* Pie con el nombre gigante, cortado por abajo */}
      <footer className="relative z-10 overflow-hidden border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pt-10 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
          <p>An independent student initiative for the CentraleSupélec community.</p>
          <div className="flex items-center gap-5">
            <Link to="/login" className="flex min-h-11 items-center transition hover:text-white">
              Log in
            </Link>
            <span>Photos from Unsplash</span>
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 items-center transition hover:text-white"
            >
              Map © OpenStreetMap contributors
            </a>
            <span>© {YEAR}</span>
          </div>
        </div>
        <p
          aria-hidden="true"
          className="mt-6 -mb-[0.22em] bg-gradient-to-b from-white/[0.14] to-transparent bg-clip-text text-center font-logo text-[12.4vw] leading-none font-extrabold tracking-[-0.05em] whitespace-nowrap text-transparent select-none"
        >
          CentraleMarket
        </p>
      </footer>
    </div>
  )
}

// La luz de las tarjetas sigue al ratón: guardamos su posición en variables CSS de la tarjeta.
function trackSpotlight(event: PointerEvent<HTMLElement>) {
  const card = (event.target as HTMLElement).closest<HTMLElement>('.spotlight')
  if (!card) return
  const box = card.getBoundingClientRect()
  card.style.setProperty('--mx', `${event.clientX - box.left}px`)
  card.style.setProperty('--my', `${event.clientY - box.top}px`)
}

// Cinta infinita: el contenido va dos veces seguido y se desplaza la mitad, así no se nota el salto.
function Marquee({ items, outline = false, reverse = false }: { items: string[]; outline?: boolean; reverse?: boolean }) {
  const row = items.map((item) => (
    <span key={item} className="flex shrink-0 items-center gap-6 pr-6 md:gap-10 md:pr-10">
      <span className={outline ? 'text-outline' : 'text-white/90'}>{item}</span>
      <span className="h-2 w-2 rounded-full bg-carmin shadow-[0_0_14px_rgb(224_21_63)] md:h-3 md:w-3" />
    </span>
  ))
  return (
    <div
      className={`flex w-max animate-marquee font-display text-4xl font-bold tracking-[-0.03em] whitespace-nowrap md:text-7xl ${
        reverse ? '[animation-direction:reverse]' : ''
      }`}
    >
      <div className="flex">{row}</div>
      <div className="flex" aria-hidden="true">
        {row}
      </div>
    </div>
  )
}

// Cada palabra del titular va en su propia "ventana" para poder entrar desde abajo.
// (El degradado va en cada palabra: si fuera en el padre, las palabras que se mueven se volverían invisibles.)
function HeroWords({ text, wordClassName = '' }: { text: string; wordClassName?: string }) {
  return (
    <>
      {text.split(' ').map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <span data-hero-word className={`inline-block ${wordClassName}`}>
            {word}&nbsp;
          </span>
        </span>
      ))}
    </>
  )
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div data-reveal>
      <p className="text-xs font-semibold tracking-[0.25em] text-rosa uppercase">{eyebrow}</p>
      <h2 className="mt-3 max-w-xl text-4xl font-bold tracking-[-0.03em] text-balance md:text-6xl">{title}</h2>
    </div>
  )
}

export default IntroPage
