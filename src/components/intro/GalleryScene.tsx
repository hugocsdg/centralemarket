import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import ScrubVideo from './ScrubVideo'
import { STATIC_QUERY } from '../../lib/scrub'
import type { ScrubHandle } from './ScrubVideo'
import type { IntroCopy } from '../../i18n/intro'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// "La galería": la cámara avanza por una galería oscura donde cada objeto está en un pedestal,
// como una obra de arte. Al bajar aparecen las tarjetas y el precio sube: 8 € → 40 € → 280 €.
// En móvil o con "reducir movimiento": imagen fija y las tres tarjetas debajo.

const VIDEO: string | undefined = undefined // public/intro/gallery.mp4 cuando esté aprobado
const POSTER = {
  src: '/intro/gallery-1920.webp',
  srcSet: '/intro/gallery-1280.webp 1280w, /intro/gallery-1920.webp 1920w',
  mobile: '/intro/gallery-mobile.webp',
}
const THUMBS = ['/intro/item-lamp.webp', '/intro/item-headphones.webp', '/intro/item-bike.webp']

function GalleryScene({ copy }: { copy: IntroCopy }) {
  const section = useRef<HTMLElement>(null)
  const video = useRef<ScrubHandle>(null)
  const t = copy.market

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
        const cards = q('[data-gallery-card]')
        const price = q('[data-gallery-price]')[0]
        const shown = { value: t.items[0].price }
        let last = ''
        const writePrice = () => {
          const text = `${Math.round(shown.value)}\u00a0€`
          if (text !== last) price.textContent = last = text
        }
        writePrice()

        gsap.set(cards, { opacity: 0, y: 40 })
        const tl = gsap.timeline({
          defaults: { ease: 'power3.out' },
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: () => `+=${window.innerHeight * 1.3}`,
            pin: true,
            scrub: true,
            onUpdate: (self) => video.current?.seek(self.progress),
          },
        })
        tl.from(q('[data-gallery-head]'), { opacity: 0, y: 30, duration: 0.2 }, 0)
        // Cada tarjeta entra en su tramo y el precio grande sube hasta el suyo.
        cards.forEach((card, i) => {
          const at = 0.12 + i * 0.28
          tl.to(card, { opacity: 1, y: 0, duration: 0.14 }, at)
          if (i > 0)
            tl.to(shown, { value: t.items[i].price, duration: 0.18, ease: 'power2.inOut', onUpdate: writePrice }, at)
        })
        tl.to({}, { duration: 0.1 })
        return () => {
          tl.scrollTrigger?.kill()
          gsap.set(cards, { clearProps: 'all' })
          price.textContent = `${t.items[2].price}\u00a0€`
          el.classList.remove('is-scrubbing')
        }
      })
    },
    { scope: section, dependencies: [t] },
  )

  return (
    <section ref={section} data-gallery-scene className="gallery-scene relative isolate overflow-hidden">
      <div className="gallery-stage">
        <ScrubVideo ref={video} src={VIDEO} poster={POSTER} className="-z-10" />
        <div aria-hidden="true" className="gallery-scrim pointer-events-none absolute inset-0 -z-10" />
      </div>

      <div className="gallery-copy mx-auto w-full max-w-6xl px-4">
        <div data-gallery-head>
          <h2 className="font-display text-4xl leading-[1.05] font-bold tracking-[-0.03em] text-balance md:text-5xl">
            {t.title}
          </h2>
          <p className="mt-4 max-w-sm text-white/75 md:text-lg">{t.text}</p>
        </div>

        {/* El precio grande que va subiendo (solo en modo vídeo) */}
        <p
          aria-hidden="true"
          data-gallery-price
          className="gallery-price font-display text-7xl font-bold tracking-[-0.04em] tabular-nums md:text-8xl"
        >
          {t.items[2].price}&nbsp;€
        </p>

        <ul aria-label={t.example} className="gallery-cards mt-8 grid gap-3">
          {t.items.map((item, i) => (
            <li
              key={item.name}
              data-gallery-card
              className="flex items-center gap-4 rounded-2xl border border-white/12 bg-noche/70 p-3 pr-5 backdrop-blur-md"
            >
              <img
                src={THUMBS[i]}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-16 w-16 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-white/65">{item.where}</p>
              </div>
              <p className="font-display text-2xl font-bold tabular-nums">{item.price}&nbsp;€</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-white/60">{t.example}</p>
      </div>
    </section>
  )
}

export default GalleryScene
