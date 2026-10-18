import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import 'lenis/dist/lenis.css'
import { ArrowRight, SkipForward } from 'lucide-react'
import Logo, { LogoMark } from '../components/Logo'
import HeroScene from '../components/intro/HeroScene'
import CampusScene from '../components/intro/CampusScene'
import GalleryScene from '../components/intro/GalleryScene'
import OrderScene from '../components/intro/OrderScene'
import PhoneStory from '../components/intro/PhoneStory'
import LifeSection from '../components/intro/LifeSection'
import { scrollToSection, useIntroAnimations } from '../lib/useIntroAnimations'
import { useAuth } from '../lib/auth'
import { markIntroSeen } from '../lib/intro'
import { useLang } from '../i18n/lang'
import { introCopy } from '../i18n/intro'
import { socialProof } from '../data/socialProof'

// Página de presentación (/welcome): cuenta qué es CentraleMarket mientras haces scroll.
//  1. Portada: "el campus de noche" (vídeo con el scroll; imagen fija en móvil)
//  2. El campus real en 3D (datos de OpenStreetMap) con arcos entre residencias y escuela
//  3. "La galería": de una lámpara de 8 € a una bici de 280 €
//  4. WhatsApp frente a "en orden": el momento interactivo (mantener pulsado)
//  5. Los 4 pasos en un iPhone, y un botón justo después
//  6. Arrive / Stay / Leave + Campus Storage
//  7. Prueba social (oculta hasta tener datos reales: src/data/socialProof.ts)
//  8. Final y pie
// Todas las animaciones de scroll generales están en lib/useIntroAnimations.ts.

const CHAPTERS = ['campus', 'market', 'order', 'how', 'life', 'join'] as const

const YEAR = new Date().getFullYear()

function IntroPage() {
  const root = useRef<HTMLDivElement>(null)
  const { session } = useAuth()
  const { lang } = useLang()
  const copy = introCopy[lang]

  useIntroAnimations(root)

  // Recordar que ya se vio la introducción en este dispositivo.
  useEffect(() => markIntroSeen(), [])

  const cta = session ? { to: '/', label: copy.nav.enter } : { to: '/login', label: copy.nav.getStarted }

  return (
    <div ref={root} className="relative min-h-screen overflow-x-clip bg-noche text-white">
      {/* Barra de progreso de lectura */}
      <div
        data-progress
        className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-rojo via-carmin to-rosa"
      />

      {/* Cabecera: se encoge y se oscurece al bajar */}
      <header data-intro-header className="intro-header fixed inset-x-0 top-0 z-40 px-3 pt-3">
        <div className="intro-bar glass mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full pr-2 pl-4">
          {/* En el móvil solo el símbolo: así caben "Log in" y "Get started" sin pisarse */}
          <span className="hidden sm:block">
            <Logo />
          </span>
          <span className="sm:hidden">
            <LogoMark className="h-8 w-auto" />
            <span className="sr-only">CentraleMarket</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollToSection('join')}
              className="hidden min-h-11 items-center rounded-full px-3 text-sm font-medium whitespace-nowrap text-white/70 transition hover:text-white md:flex"
            >
              {copy.nav.skip}
            </button>
            {!session && (
              <Link
                to="/login"
                className="flex min-h-11 items-center rounded-full px-2.5 text-sm font-medium whitespace-nowrap text-white/75 transition hover:text-white sm:px-3"
              >
                {copy.nav.login}
              </Link>
            )}
            <Link
              to={cta.to}
              className="btn-primary flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap"
            >
              {cta.label} <ArrowRight aria-hidden="true" className="hidden h-4 w-4 sm:block" />
            </Link>
          </div>
        </div>
      </header>

      {/* Móvil: "Skip intro" flota abajo durante la historia */}
      <button
        type="button"
        data-skip-pill
        onClick={() => scrollToSection('join')}
        className="glass pointer-events-none fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex min-h-11 items-center gap-1.5 rounded-full bg-noche/60 px-4 text-sm font-medium text-white/85 opacity-0 transition-opacity duration-300 md:hidden"
      >
        {copy.nav.skip} <SkipForward aria-hidden="true" className="h-4 w-4" />
      </button>

      {/* Índice de capítulos (solo escritorio grande): se ilumina el capítulo actual y se puede saltar */}
      <nav
        data-chapter-rail
        aria-label={copy.nav.chapters}
        className="fixed top-1/2 right-5 z-30 hidden -translate-y-1/2 flex-col items-end gap-1 opacity-0 transition-opacity duration-500 xl:flex"
      >
        {CHAPTERS.map((id) => (
          <button
            key={id}
            type="button"
            data-chapter-link={id}
            onClick={() => scrollToSection(id)}
            className="group flex min-h-8 items-center gap-3 rounded-full py-1 pl-3 text-xs font-medium text-white/60 transition hover:text-white data-active:text-white"
          >
            <span className="translate-x-2 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-data-active:translate-x-0 group-data-active:opacity-100">
              {copy.chapters[id]}
            </span>
            <span className="h-px w-5 bg-white/30 transition-all duration-300 group-hover:w-8 group-data-active:w-10 group-data-active:bg-rosa" />
          </button>
        ))}
      </nav>

      <main className="relative z-10">
        {/* Cada escena fijada (pin) va dentro de su propio <div>: GSAP la mete en otro contenedor
            y, sin este div, React falla al salir de la página. */}
        <div>
          <HeroScene copy={copy} cta={cta} />
        </div>

        <div id="campus" data-chapter>
          <CampusScene copy={copy} />
        </div>

        <div id="market" data-chapter>
          <GalleryScene copy={copy} />
        </div>

        <OrderScene copy={copy} />

        <div id="how" data-chapter>
          <PhoneStory copy={copy} />
        </div>

        {/* Botón justo después de los pasos: quien ya está convencido no tiene que seguir bajando */}
        <section className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 md:flex-row md:items-center md:justify-between md:py-20">
          <div data-reveal>
            <h2 className="font-display text-3xl font-bold tracking-[-0.03em] md:text-5xl">{copy.how.ctaTitle}</h2>
            <p className="mt-3 text-white/70 md:text-lg">{copy.how.ctaText}</p>
          </div>
          <Link
            to={cta.to}
            data-reveal
            data-magnetic
            className="btn-primary group flex min-h-12 items-center gap-2 rounded-full px-7 py-3.5 font-semibold"
          >
            {cta.label}
            <ArrowRight aria-hidden="true" className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
        </section>

        <LifeSection copy={copy} />

        {socialProof.enabled && (
          <SocialProof
            title={copy.proof.title}
            line={socialProof.students ? copy.proof.students(socialProof.students) : null}
          />
        )}

        {/* Final: la ventana encendida del principio, ahora la tuya */}
        <section
          id="join"
          data-chapter
          className="relative isolate flex min-h-[100svh] items-center overflow-hidden px-4 py-24"
        >
          <img
            src="/intro/campus-window-1920.webp"
            alt=""
            loading="lazy"
            decoding="async"
            data-img-reveal
            className="absolute inset-0 -z-10 h-full w-full object-cover object-[65%_50%] opacity-60"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-r from-noche via-noche/80 to-noche/20"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-noche to-transparent"
          />
          <div className="mx-auto w-full max-w-6xl">
            <div data-reveal>
              <LogoMark className="h-12 w-auto md:h-14" />
              <h2 className="mt-8 max-w-[12ch] font-display text-5xl leading-[1.02] font-bold tracking-[-0.035em] text-balance sm:text-6xl md:text-8xl">
                {copy.final.title}
              </h2>
              <p className="mt-6 max-w-md text-lg text-white/75">{copy.final.text}</p>
              <Link
                to={cta.to}
                data-magnetic
                className="btn-primary group mt-9 inline-flex min-h-14 items-center gap-2 rounded-full px-10 py-4 text-lg font-semibold"
              >
                {cta.label}
                <ArrowRight aria-hidden="true" className="h-5 w-5 transition group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Pie con el nombre gigante, cortado por abajo */}
      <footer className="relative z-10 overflow-hidden border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pt-10 text-sm text-white/65 md:flex-row md:items-center md:justify-between">
          <p>{copy.footer.about}</p>
          <div className="flex flex-wrap items-center gap-x-5">
            <Link to="/login" className="flex min-h-11 items-center transition hover:text-white">
              {copy.nav.login}
            </Link>
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 items-center transition hover:text-white"
            >
              {copy.footer.osm}
            </a>
            <span>© {YEAR}</span>
          </div>
        </div>
        <p
          aria-hidden="true"
          className="mt-6 -mb-[0.22em] text-center font-logo text-[12.4vw] leading-none font-extrabold tracking-[-0.05em] whitespace-nowrap text-white/[0.06] select-none"
        >
          CentraleMarket
        </p>
      </footer>
    </div>
  )
}

// Prueba social real (solo se ve con datos de verdad en src/data/socialProof.ts).
function SocialProof({ title, line }: { title: string; line: string | null }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <h2 data-reveal className="font-display text-3xl font-bold tracking-[-0.03em] md:text-5xl">
        {title}
      </h2>
      {line && (
        <p data-reveal className="mt-4 text-lg text-white/75">
          {line}
        </p>
      )}
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {socialProof.quotes.map((quote) => (
          <figure key={quote.text} data-reveal className="rounded-[1.5rem] border border-white/10 p-6">
            <blockquote className="text-lg">“{quote.text}”</blockquote>
            <figcaption className="mt-4 text-sm text-white/65">
              {quote.name} · {quote.detail}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

export default IntroPage
