import { useRef } from 'react'
import { Link } from 'react-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { ArrowRight, Coins, MapPin, ShieldCheck } from 'lucide-react'
import ScrubVideo from './ScrubVideo'
import { STATIC_QUERY } from '../../lib/scrub'
import type { ScrubHandle } from './ScrubVideo'
import { scrollToSection } from '../../lib/useIntroAnimations'
import type { IntroCopy } from '../../i18n/intro'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Portada: "El campus de noche". La cámara baja desde el cielo hacia el campus y, al bajar,
// se encienden las ventanas de las residencias (cada luz, un anuncio nuevo).
// En escritorio la portada se queda fija y el scroll mueve el vídeo; el titular vive en el cielo.
// En móvil o con "reducir movimiento" se ve la imagen fija, con el titular arriba.

const VIDEO = '/intro/campus-night.mp4'
const POSTER = {
  src: '/intro/campus-night-1920.webp',
  srcSet: '/intro/campus-night-1280.webp 1280w, /intro/campus-night-1920.webp 1920w',
  mobile: '/intro/campus-night-mobile.webp',
}
const TRUST_ICONS = [ShieldCheck, Coins, MapPin]

type Props = { copy: IntroCopy; cta: { to: string; label: string } }

function HeroScene({ copy, cta }: Props) {
  const section = useRef<HTMLElement>(null)
  const video = useRef<ScrubHandle>(null)
  const t = copy.hero

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      // "always: 'all'" hace que se ejecute siempre (y otra vez si cambia isStatic, p. ej. al girar la tablet).
      mm.add({ isStatic: STATIC_QUERY, always: 'all' }, (context) => {
        if (context.conditions?.isStatic) return
        const el = section.current!
        el.classList.add('is-scrubbing')
        video.current?.enable()
        const q = gsap.utils.selector(el)
        // Al bajar: el titular se aleja hacia el cielo y aparece la frase de las ventanas.
        const tl = gsap
          .timeline({
            scrollTrigger: {
              trigger: el,
              start: 'top top',
              end: () => `+=${window.innerHeight * 1.1}`,
              pin: true,
              scrub: true,
              onUpdate: (self) => video.current?.seek(self.progress),
            },
          })
          .to(q('[data-hero-copy]'), { yPercent: -18, opacity: 0, ease: 'power1.in', duration: 0.45 }, 0.1)
          .fromTo(
            q('[data-hero-windows]'),
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, ease: 'power2.out', duration: 0.3 },
            0.55,
          )
          .to({}, { duration: 0.15 })
        return () => {
          tl.scrollTrigger?.kill()
          el.classList.remove('is-scrubbing')
        }
      })
    },
    { scope: section },
  )

  return (
    <section ref={section} data-hero className="hero-scene relative isolate overflow-hidden">
      <ScrubVideo ref={video} src={VIDEO} poster={POSTER} priority className="-z-10" />
      {/* Sombra suave detrás de los textos: siempre se leen, sea cual sea el fotograma */}
      <div aria-hidden="true" className="hero-scrim pointer-events-none absolute inset-0 -z-10" />

      {/* Arriba, en el cielo: el titular. Abajo, sobre el campus en sombra: el resto. */}
      <div data-hero-copy className="hero-copy mx-auto w-full max-w-6xl px-4">
        <div>
          <p
            data-hero-fade
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-noche/50 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-carmin/70" />
              <span className="relative h-2 w-2 rounded-full bg-carmin" />
            </span>
            {t.badge}
          </p>
          <h1 className="mt-5 max-w-4xl text-[2.55rem] leading-[1.02] font-bold tracking-[-0.035em] text-balance sm:text-6xl lg:text-[5rem]">
            <HeroWords text={t.titleTop} />
            <HeroWords text={t.titleBottom} wordClassName="text-rosa" />
          </h1>
        </div>
        <div>
          <p data-hero-fade className="max-w-md text-base text-pretty text-white/80 md:text-lg">
            {t.sub}
          </p>
          <div data-hero-fade className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to={cta.to}
              data-magnetic
              className="btn-primary group flex min-h-12 items-center gap-2 rounded-full px-7 py-3.5 font-semibold"
            >
              {cta.label}
              <ArrowRight aria-hidden="true" className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <button
              type="button"
              data-magnetic
              onClick={() => scrollToSection('how')}
              className="flex min-h-12 items-center rounded-full border border-white/20 bg-noche/40 px-6 py-3.5 font-semibold text-white/90 backdrop-blur-md transition hover:border-white/40 hover:text-white"
            >
              {t.how}
            </button>
          </div>
          <ul data-hero-fade className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/75">
            {t.trust.map((text, i) => {
              const Icon = TRUST_ICONS[i]
              return (
                <li key={text} className="flex items-center gap-1.5">
                  <Icon aria-hidden="true" className="h-4 w-4 text-rosa" />
                  {text}
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* Frase final del vídeo, cuando ya se ven las ventanas encendidas (solo en modo vídeo) */}
      <p
        data-hero-windows
        aria-hidden="true"
        className="hero-windows pointer-events-none absolute inset-x-0 bottom-[12vh] mx-auto max-w-6xl px-4 font-display text-3xl leading-tight font-bold tracking-[-0.02em] text-balance opacity-0 md:text-5xl"
      >
        <span className="block max-w-[22ch]">{t.windows}</span>
      </p>

      {/* Indicador de scroll */}
      <div
        data-scroll-hint
        aria-hidden="true"
        className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
      >
        <span className="flex h-9 w-[22px] justify-center rounded-full border border-white/30 pt-2">
          <span className="h-1.5 w-1 animate-scroll-dot rounded-full bg-white/80" />
        </span>
        <span className="text-[11px] tracking-[0.3em] text-white/70 uppercase">{t.scroll}</span>
      </div>
    </section>
  )
}

// Cada palabra del titular va en su propia "ventana" para poder entrar desde abajo.
function HeroWords({ text, wordClassName = '' }: { text: string; wordClassName?: string }) {
  return (
    <span className="block">
      {text.split(' ').map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.1em] align-bottom">
          <span data-hero-word className={`inline-block ${wordClassName}`}>
            {word}&nbsp;
          </span>
        </span>
      ))}
    </span>
  )
}

export default HeroScene
