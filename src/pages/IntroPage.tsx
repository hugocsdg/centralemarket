import { useRef } from 'react'
import { Link } from 'react-router'
import 'lenis/dist/lenis.css'
import {
  ArrowRight,
  Camera,
  Handshake,
  Luggage,
  Mail,
  MessageCircle,
  PlaneLanding,
  Search,
  Sparkles,
  Users,
  Warehouse,
} from 'lucide-react'
import Background from '../components/Background'
import Logo, { LogoFull } from '../components/Logo'
import { categories } from '../data/categories'
import { useIntroAnimations } from '../lib/useIntroAnimations'

// Página de presentación: explica qué es CentraleMarket a quien aún no ha entrado.
// Las animaciones están en lib/useIntroAnimations.ts; aquí solo marcamos los elementos con data-….

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

const STEPS = [
  {
    icon: Mail,
    title: 'Sign in with your student email',
    text: 'Type your @student-cs.fr address and the code we email you. No password to remember.',
  },
  { icon: Camera, title: 'List in under a minute', text: 'Snap a few photos, pick a category, set a price. Done — straight from your phone.' },
  {
    icon: MessageCircle,
    title: 'Chat inside the app',
    text: 'Buyers message you right on CentraleMarket. Your phone number stays private.',
  },
  { icon: Handshake, title: 'Meet on campus', text: 'Agree on a time, hand it over, mark it as sold. That’s it.' },
]

const PROBLEM =
  'Right now, everything is sold in WhatsApp groups. Great deals get buried under hundreds of messages, nobody knows what is still available, and students leave campus without ever finding a buyer.'

const GOALS = ['Keep good things in use.', 'Help students save money.', 'Make arriving and leaving campus easier.']

function IntroPage() {
  const root = useRef<HTMLDivElement>(null)
  useIntroAnimations(root)

  return (
    <div ref={root} className="relative min-h-screen overflow-x-clip text-white">
      <Background />

      {/* Barra de progreso de lectura */}
      <div
        data-progress
        className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-carmin via-rosa to-morado"
      />

      {/* Cabecera: se encoge y se oscurece al bajar (clase is-scrolled) */}
      <header data-intro-header className="intro-header fixed inset-x-0 top-0 z-40 px-3 pt-3">
        <div className="intro-bar glass mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full pr-2 pl-4">
          <Logo />
          <div className="flex items-center gap-1">
            <Link
              to="/login"
              className="hidden rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap text-white/70 transition hover:text-white sm:block"
            >
              Log in
            </Link>
            <Link
              to="/login"
              className="btn-primary flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap"
            >
              Get started <ArrowRight className="hidden h-4 w-4 sm:block" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        {/* ---------- 1. Portada ---------- */}
        <section data-hero className="grid min-h-[100svh] items-center gap-6 pt-28 pb-16 md:grid-cols-[1.2fr_1fr]">
          <div className="text-center md:text-left">
            <span
              data-hero-fade
              className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-white/80"
            >
              <span className="h-2 w-2 rounded-full bg-carmin shadow-[0_0_10px_rgb(224_21_63)]" />
              For CentraleSupélec students
            </span>
            <h1 className="mt-6 text-5xl leading-[1.02] font-bold sm:text-6xl lg:text-7xl">
              <HeroWords text="The campus marketplace" />
              <span className="block">
                <HeroWords text="you were waiting for." wordClassName="text-shine" />
              </span>
            </h1>
            <p data-hero-fade className="mx-auto mt-6 max-w-lg text-lg text-white/65 md:mx-0">
              Buy, sell and swap everything student life needs — furniture, tech, tickets, homemade food and services —
              with people from your own school.
            </p>
            <div data-hero-fade className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link to="/login" className="btn-primary group flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold">
                Get started
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <button
                onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
                className="glass rounded-full px-7 py-3.5 font-semibold transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                How it works
              </button>
            </div>
          </div>

          <div data-hero-parallax className="relative order-first mx-auto w-full max-w-[17rem] md:order-last md:max-w-md">
            <div data-hero-logo className="relative">
              <div className="absolute inset-[8%] animate-spin-slow rounded-full bg-[conic-gradient(from_0deg,transparent,rgb(224_21_63/0.55),transparent_40%,rgb(155_128_178/0.45),transparent_75%)] blur-2xl" />
              <LogoFull className="relative w-full animate-float drop-shadow-[0_20px_50px_rgba(224,21,63,0.45)]" />
            </div>
          </div>
        </section>

        {/* ---------- 2. El problema ---------- */}
        <section className="py-24 md:py-40">
          <p data-reveal className="text-xs font-semibold tracking-[0.25em] text-rosa uppercase">
            The problem
          </p>
          <p data-scrub-words className="mt-6 font-display text-3xl leading-tight font-semibold sm:text-4xl md:text-5xl">
            {PROBLEM.split(' ').map((word, i) => (
              <span key={i} data-word>
                {word}{' '}
              </span>
            ))}
          </p>
        </section>

        {/* ---------- 3. Para quién ---------- */}
        <section className="py-16 md:py-24">
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

        {/* ---------- 4. En cifras ---------- */}
        <section className="py-16 md:py-24">
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

        {/* ---------- 5. Cómo funciona (fijada en escritorio) ---------- */}
        <section id="how" data-steps className="py-16 md:flex md:min-h-screen md:items-center md:py-0">
          <div className="grid w-full gap-10 md:grid-cols-[1fr_1.2fr] md:items-center">
            <div>
              <SectionHeading eyebrow="How it works" title="From your room to someone else's, in four steps" />
              {/* Indicador de progreso de los pasos (escritorio) */}
              <div className="mt-10 hidden items-stretch gap-4 md:flex">
                <div className="relative w-[3px] overflow-hidden rounded-full bg-white/10">
                  <div data-steps-fill className="absolute inset-0 origin-top bg-gradient-to-b from-carmin to-morado" />
                </div>
                <ol className="space-y-4">
                  {STEPS.map((step, i) => (
                    <li
                      key={step.title}
                      data-step-dot
                      className={`step-dot text-sm font-medium text-white/35 transition-colors duration-300 ${i === 0 ? 'is-active' : ''}`}
                    >
                      0{i + 1} — {step.title}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div data-steps-stage className="steps-stage relative space-y-4 md:h-[22rem] md:space-y-0">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <div key={title} data-step data-reveal className="glass flex flex-col justify-between rounded-[2rem] p-8 md:h-full md:p-10">
                  <div className="flex items-start justify-between">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-carmin to-burdeos shadow-lg shadow-rojo/30">
                      <Icon className="h-7 w-7" />
                    </span>
                    <span className="text-shine font-display text-7xl leading-none font-bold opacity-40">0{i + 1}</span>
                  </div>
                  <div className="mt-10">
                    <h3 className="text-2xl font-semibold md:text-3xl">{title}</h3>
                    <p className="mt-3 text-white/65 md:text-lg">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- 6. Vista de la app (zoom con el scroll) ---------- */}
        <section className="py-24 md:py-40">
          <SectionHeading eyebrow="All in one place" title="Your whole campus market, organised" center />
          <div data-zoom className="glass mt-12 overflow-hidden rounded-[2.5rem] p-4 will-change-transform md:p-8">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-white/40">
              <Search className="h-5 w-5" /> Search lamps, bikes, tickets…
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {categories.slice(0, 8).map(({ slug, name, icon: Icon }) => (
                <div key={slug} className="relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-carmin/20 blur-2xl" />
                  <Icon className="relative h-6 w-6 text-rosa" />
                  <p className="relative text-sm font-semibold md:text-base">{name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- 7. Nuestro objetivo ---------- */}
        <section className="py-16 md:py-24">
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
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-morado/20">
              <Warehouse className="h-7 w-7 text-morado" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-morado uppercase">Coming soon · an idea in progress</p>
              <h3 className="mt-2 text-2xl font-semibold">Campus Storage</h3>
              <p className="mt-2 max-w-2xl text-white/60">
                Leaving before you've sold your furniture? We'd love to let you leave it in a campus storage space and keep
                selling from home. Not available yet — it depends on the school, and we're working on it.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- 8. Final ---------- */}
        <section className="py-24 text-center md:py-40">
          <div data-reveal>
            <h2 className="text-5xl font-bold sm:text-6xl md:text-7xl">
              Ready to <span className="text-shine">join?</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-lg text-white/60">
              It takes 30 seconds. All you need is your @student-cs.fr email.
            </p>
            <Link
              to="/login"
              className="btn-primary group mt-10 inline-flex items-center gap-2 rounded-full px-10 py-4 text-lg font-semibold"
            >
              Get started
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/40">
        An independent student initiative for the CentraleSupélec community.
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

function SectionHeading({ eyebrow, title, center }: { eyebrow: string; title: string; center?: boolean }) {
  return (
    <div data-reveal className={center ? 'text-center' : ''}>
      <p className="text-xs font-semibold tracking-[0.25em] text-rosa uppercase">{eyebrow}</p>
      <h2 className={`mt-3 text-4xl font-bold md:text-5xl ${center ? 'mx-auto max-w-2xl' : 'max-w-xl'}`}>{title}</h2>
    </div>
  )
}

export default IntroPage
