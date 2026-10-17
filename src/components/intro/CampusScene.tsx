import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import type { CampusScene as CampusEngine, CampusState } from '../../lib/campus3d'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Escena del campus en 3D: la cámara gira sobre una recreación futurista del campus
// y, al bajar, aparecen estudiantes y arcos de luz que unen a compradores y vendedores.
// El 3D (Three.js) está en lib/campus3d.ts y se descarga solo cuando hace falta.

const CAPTIONS = [
  { eyebrow: 'Paris-Saclay campus', title: 'Your whole campus.', text: 'From Bâtiment Eiffel to the Moulon residences and the sports field.' },
  { eyebrow: 'Connections', title: 'Buy and sell with anyone.', text: 'Every student can be a buyer and a seller. Right next door.' },
  { eyebrow: 'Any time', title: 'Day and night.', text: 'A lamp at 9 am, a party ticket at midnight. The market never closes.' },
]

const LABELS: Record<string, string> = {
  eiffel: 'Bâtiment Eiffel',
  moulon: 'Moulon',
  sports: 'Sports field',
}

function CampusScene() {
  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const labelsBox = useRef<HTMLDivElement>(null)
  const state = useRef<CampusState>({ progress: 0 })

  // Crear el 3D cuando la escena se acerca a la pantalla, y dibujar solo mientras se ve.
  useEffect(() => {
    let engine: CampusEngine | null = null
    let visible = false
    let cancelled = false
    let cleanupResize = () => {}
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const placeLabels = () => {
      if (!engine || !labelsBox.current) return
      for (const label of engine.labels) {
        const element = labelsBox.current.querySelector<HTMLElement>(`[data-label="${label.id}"]`)
        if (!element) continue
        const { x, y, visible: inFront } = engine.project(label.position)
        element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`
        element.style.opacity = inFront ? '1' : '0'
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (!engine) return
        if (visible && !reduced) engine.start(placeLabels)
        else engine.stop()
      },
      { rootMargin: '200px 0px' },
    )

    import('../../lib/campus3d').then(({ CampusScene: Engine }) => {
      if (cancelled || !canvas.current) return
      engine = new Engine(canvas.current, state.current)
      const onResize = () => {
        engine?.resize()
        if (reduced) {
          engine?.render(0, false)
          placeLabels()
        }
      }
      window.addEventListener('resize', onResize)
      cleanupResize = () => window.removeEventListener('resize', onResize)
      if (reduced) {
        state.current.progress = 0.8 // quieto, pero con las conexiones dibujadas
        engine.render(0, false)
        placeLabels()
      } else if (visible) {
        engine.start(placeLabels)
      }
    })
    if (section.current) observer.observe(section.current)

    return () => {
      cancelled = true
      observer.disconnect()
      cleanupResize()
      engine?.dispose()
    }
  }, [])

  // Fijar la escena mientras el scroll avanza "dentro" de ella.
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const el = section.current!
        el.classList.add('is-animated')
        const captions = el.querySelectorAll('[data-campus-caption]')
        ScrollTrigger.create({
          trigger: el,
          start: 'top top',
          end: () => `+=${window.innerHeight * 3}`,
          pin: true,
          onUpdate: (self) => {
            state.current.progress = self.progress
            const active = Math.min(CAPTIONS.length - 1, Math.floor(self.progress * CAPTIONS.length))
            captions.forEach((caption, i) => caption.classList.toggle('is-active', i === active))
          },
        })
        return () => el.classList.remove('is-animated')
      })
    },
    { scope: section },
  )

  return (
    <section ref={section} data-campus-scene className="relative h-[100svh] overflow-hidden">
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />

      {/* Etiquetas de los lugares, colocadas encima del 3D */}
      <div ref={labelsBox} aria-hidden="true" className="pointer-events-none absolute inset-0">
        {Object.entries(LABELS).map(([id, text]) => (
          <span
            key={id}
            data-label={id}
            className="absolute top-0 left-0 rounded-full border border-white/15 bg-noche/70 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-white/80 opacity-0 backdrop-blur-md transition-opacity md:text-xs"
          >
            {text}
          </span>
        ))}
      </div>

      {/* Fundidos arriba y abajo para que el 3D se mezcle con la página */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-noche to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-noche via-noche/70 to-transparent" />

      {/* Textos */}
      <div className="absolute inset-x-4 bottom-[8svh] md:inset-x-auto md:bottom-[10vh] md:left-[max(1rem,calc((100vw-72rem)/2+1rem))] md:w-[30rem]">
        <div className="story-captions campus-captions">
          {CAPTIONS.map((caption, i) => (
            <div key={caption.title} data-campus-caption className={`story-caption ${i === 0 ? 'is-active' : ''}`}>
              <p className="text-xs font-semibold tracking-[0.25em] text-rosa uppercase">{caption.eyebrow}</p>
              <h2 className="mt-2 text-3xl font-bold md:text-5xl">{caption.title}</h2>
              <p className="mt-2 text-white/65 md:text-lg">{caption.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CampusScene
