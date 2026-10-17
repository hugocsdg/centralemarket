import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import 'lenis/dist/lenis.css'
import { ArrowRight, Luggage, PlaneLanding, Sparkles, Users, Warehouse } from 'lucide-react'
import Background from '../components/Background'
import Logo from '../components/Logo'
import PhoneStory from '../components/intro/PhoneStory'
import MacScene from '../components/intro/MacScene'
import Journey from '../components/intro/Journey'
import { categories } from '../data/categories'
import { useIntroAnimations } from '../lib/useIntroAnimations'
import { ParticleField, buildShapes } from '../lib/particles'
import type { Morph, Pose } from '../lib/particles'
import { useAuth } from '../lib/auth'
import { markIntroSeen } from '../lib/intro'

// Página de presentación: cuenta qué es CentraleMarket mientras haces scroll, como un vídeo.
// - Partículas de luz (lib/particles.ts) que forman el logo.
// - Un MacBook en cuya pantalla se entra para ver fotos reales (components/intro/MacScene.tsx).
// - Un móvil que cuenta la historia (components/intro/PhoneStory.tsx).
// - Un viaje horizontal por un año en el campus (components/intro/Journey.tsx).
// Todas las animaciones de scroll están en lib/useIntroAnimations.ts.

const AUDIENCE = [
  { icon: PlaneLanding, title: 'New arrivals', text: 'Furnish your room in a weekend without paying full price.' },
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

const GOALS = ['Keep good things in use.', 'Help students save money.', 'Make arriving and leaving campus easier.']

// Dónde y cómo se colocan las partículas (índices usados en useIntroAnimations):
// 0 logo de portada · 1 anillo de fondo · 2 logo final
const POSES: { desktop: Pose[]; mobile: Pose[] } = {
  desktop: [
    { shape: 0, cx: 0.73, cy: 0.5, size: 0.55, alpha: 1 },
    { shape: 1, cx: 0.5, cy: 0.5, size: 1.3, alpha: 0.35, spin: 1 },
    { shape: 0, cx: 0.5, cy: 0.34, size: 0.42, alpha: 1 },
  ],
  mobile: [
    { shape: 0, cx: 0.5, cy: 0.25, size: 0.62, alpha: 1 },
    { shape: 1, cx: 0.5, cy: 0.5, size: 1.7, alpha: 0.3, spin: 1 },
    { shape: 0, cx: 0.5, cy: 0.28, size: 0.6, alpha: 1 },
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
        className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-carmin via-rosa to-plata"
      />

      {/* Cabecera: se encoge y se oscurece al bajar */}
      <header data-intro-header className="intro-header fixed inset-x-0 top-0 z-40 px-3 pt-3">
        <div className="intro-bar glass mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full pr-2 pl-4">
          <Logo />
          <div className="flex items-center gap-1">
            {!session && (
              <Link
                to="/login"
                className="hidden rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap text-white/70 transition hover:text-white sm:block"
              >
                Log in
              </Link>
            )}
            <Link
              to={cta.to}
              className="btn-primary flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap"
            >
              {cta.label} <ArrowRight className="hidden h-4 w-4 sm:block" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* ---------- 1. Portada (las partículas forman el logo) ---------- */}
        <section
          data-hero
          className="mx-auto flex min-h-[100svh] max-w-6xl items-end px-4 pt-[44svh] pb-16 md:items-center md:pt-24"
        >
          <div className="w-full text-center md:w-[55%] md:text-left">
            <span
              data-hero-fade
              className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-white/80"
            >
              <span className="h-2 w-2 rounded-full bg-carmin shadow-[0_0_10px_rgb(224_21_63)]" />
              For CentraleSupélec students
            </span>
            <h1 className="mt-5 text-[2.6rem] leading-[1.02] font-bold sm:text-6xl lg:text-7xl">
              <HeroWords text="The campus marketplace" />
              <span className="block">
                <HeroWords text="you were waiting for." wordClassName="text-shine" />
              </span>
            </h1>
            <p data-hero-fade className="mx-auto mt-5 max-w-lg text-base text-white/65 md:mx-0 md:text-lg">
              Buy, sell and swap everything student life needs — with people from your own school.
            </p>
            <div data-hero-fade className="mt-7 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link to={cta.to} className="btn-primary group flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold">
                {cta.label}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            </div>
            <p data-hero-fade className="mt-10 text-xs tracking-[0.25em] text-white/40 uppercase">
              Scroll to discover ↓
            </p>
          </div>
        </section>

        {/* ---------- 2. MacBook: zoom a la pantalla con fotos reales ---------- */}
        <MacScene />

        {/* ---------- 3. El móvil cuenta la historia ---------- */}
        <PhoneStory />

        {/* ---------- 4. Para quién ---------- */}
        <section className="mx-auto max-w-6xl px-4 py-24 md:py-32">
          <SectionHeading eyebrow="Who it's for" title="Made for every CentraleSupélec student" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCE.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                data-reveal
                className="glass glow-border group rounded-3xl p-6 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-25px_rgb(224_21_63/0.5)]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-carmin to-burdeos shadow-lg shadow-rojo/30 transition group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-white/60">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- 5. Un año en el campus (horizontal) ---------- */}
        <Journey />

        {/* ---------- 6. En cifras ---------- */}
        <section className="mx-auto max-w-6xl px-4 py-24 md:py-32">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STATS.map(({ count, from, suffix, label }) => (
              <div key={label} data-reveal className="glass rounded-3xl p-6">
                <p
                  data-count={count}
                  data-from={from}
                  data-suffix={suffix}
                  className="text-shine font-display text-5xl font-bold md:text-6xl"
                >
                  {count}
                  {suffix}
                </p>
                <p className="mt-2 text-sm text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- 7. Nuestro objetivo ---------- */}
        <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p data-reveal className="text-xs font-semibold tracking-[0.25em] text-rosa uppercase">
            Our goal
          </p>
          <div className="mt-6 space-y-2">
            {GOALS.map((goal) => (
              <p key={goal} data-line className="font-display text-4xl leading-tight font-bold sm:text-5xl md:text-6xl">
                {goal}
              </p>
            ))}
          </div>

          <div data-reveal className="glass mt-16 flex flex-col gap-6 rounded-[2rem] p-8 md:flex-row md:items-center md:p-10">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-plata/20">
              <Warehouse className="h-7 w-7 text-plata" />
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

        {/* ---------- 8. Final (las partículas vuelven a ser el logo) ---------- */}
        <section
          data-final-scene
          className="flex min-h-[100svh] items-end justify-center px-4 pt-[52svh] pb-24 text-center md:pt-[58svh]"
        >
          <div data-reveal>
            <h2 className="text-5xl font-bold sm:text-6xl md:text-7xl">
              Ready to <span className="text-shine">join?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-white/60">
              It takes 30 seconds. All you need is your @student-cs.fr email.
            </p>
            <Link
              to={cta.to}
              className="btn-primary group mt-8 inline-flex items-center gap-2 rounded-full px-10 py-4 text-lg font-semibold"
            >
              {cta.label}
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-white/40">
        An independent student initiative for the CentraleSupélec community. · Photos from Unsplash
      </footer>
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
      <h2 className="mt-3 max-w-xl text-4xl font-bold md:text-5xl">{title}</h2>
    </div>
  )
}

export default IntroPage
