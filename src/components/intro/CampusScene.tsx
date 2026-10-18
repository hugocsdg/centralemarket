import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import type { CampusScene as CampusEngine, CampusLabel, CampusState } from '../../lib/campus3d'
import type { IntroCopy } from '../../i18n/intro'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Escena del campus en 3D: el campus REAL de CentraleSupélec (datos de OpenStreetMap) y,
// al bajar, arcos de luz que unen residencias y escuela, como compradores y vendedores.
// El 3D (Three.js) está en lib/campus3d.ts y se descarga solo cuando hace falta.

// Estilo de cada etiqueta: la escuela en rojo, las residencias en gris plata.
const LABEL_STYLE: Record<CampusLabel['kind'], string> = {
  school: 'border-carmin/60 text-white',
  residence: 'border-white/15 text-white/80',
  place: 'border-white/10 text-white/60',
}

function CampusScene({ copy }: { copy: IntroCopy }) {
  const captions = copy.campus
  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const labelsBox = useRef<HTMLDivElement>(null)
  const state = useRef<CampusState>({ progress: 0 })
  const [labels, setLabels] = useState<CampusLabel[]>([])

  // Crear el 3D cuando la escena se acerca a la pantalla, y dibujar solo mientras se ve.
  useEffect(() => {
    let engine: CampusEngine | null = null
    let visible = false
    let cancelled = false
    let cleanupResize = () => {}
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const placeLabels = () => {
      if (!engine || !labelsBox.current) return
      // Las etiquetas van por orden de importancia (escuela, residencias, deporte):
      // si una choca con otra ya colocada, se esconde para que nunca se pisen.
      const placed: { left: number; right: number; top: number; bottom: number }[] = []
      for (const label of engine.labels) {
        const element = labelsBox.current.querySelector<HTMLElement>(`[data-label="${label.id}"]`)
        if (!element) continue
        const { x, y, visible: inFront } = engine.project(label.position)
        // Se esconde si cae en la zona de los textos de abajo (en el móvil se tapaban).
        const overCaptions = y > labelsBox.current.clientHeight * 0.62
        const box = {
          left: x - element.offsetWidth / 2 - 4,
          right: x + element.offsetWidth / 2 + 4,
          top: y - element.offsetHeight - 2,
          bottom: y + 2,
        }
        const collides = placed.some(
          (p) => box.left < p.right && box.right > p.left && box.top < p.bottom && box.bottom > p.top,
        )
        const cut = box.left < 8 || box.right > labelsBox.current.clientWidth - 8 // se saldría por un lado
        const show = inFront && !overCaptions && !collides && !cut
        if (show) placed.push(box)
        element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`
        element.style.opacity = show ? '1' : '0'
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

    // El 3D (Three.js) pesa mucho: se descarga y se prepara solo cuando la escena está cerca,
    // no al abrir la página (en el móvil eso bloqueaba la portada varios segundos).
    const load = () =>
      import('../../lib/campus3d').then(({ CampusScene: Engine }) => {
        if (cancelled || !canvas.current) return
        engine = new Engine(canvas.current, state.current)
        setLabels(engine.labels)
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
          // Las etiquetas aparecen en la página un poco después (React las pinta tras setLabels).
          setTimeout(placeLabels, 150)
        } else if (visible) {
          engine.start(placeLabels)
        }
      })
    // Empieza a descargarse en cuanto la persona empieza a moverse por la página (rueda, dedo, teclado)
    // o cuando la escena aparece. Ojo: no vale el evento "scroll", porque GSAP hace scroll solo al calcular.
    const INPUTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const
    let requested = false
    const request = () => {
      if (requested) return
      requested = true
      INPUTS.forEach((type) => window.removeEventListener(type, request))
      near.disconnect()
      load()
    }
    INPUTS.forEach((type) => window.addEventListener(type, request, { passive: true }))
    // (intersectionRatio > 0: si solo "toca" el borde de la pantalla, aún no cuenta)
    const near = new IntersectionObserver(([entry]) => entry.intersectionRatio > 0 && request(), {
      threshold: [0, 0.01],
    })
    if (section.current) {
      observer.observe(section.current)
      near.observe(section.current)
    }

    return () => {
      cancelled = true
      observer.disconnect()
      near.disconnect()
      INPUTS.forEach((type) => window.removeEventListener(type, request))
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
          end: () => `+=${window.innerHeight * (window.innerWidth < 768 ? 1.4 : 1.6)}`,
          pin: true,
          onUpdate: (self) => {
            state.current.progress = self.progress
            const active = Math.min(captions.length - 1, Math.floor(self.progress * captions.length))
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
      <div className="campus-stage absolute inset-0">
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />

        {/* Etiquetas de los lugares, colocadas encima del 3D */}
        <div ref={labelsBox} aria-hidden="true" className="pointer-events-none absolute inset-0">
          {labels.map(({ id, text, kind }) => (
            <span
              key={id}
              data-label={id}
              className={`absolute top-0 left-0 rounded-full border bg-noche/70 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap opacity-0 backdrop-blur-md transition-opacity md:text-xs ${LABEL_STYLE[kind]}`}
            >
              {text}
            </span>
          ))}
        </div>

        {/* Fundidos arriba y abajo para que el 3D se mezcle con la página */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-noche to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-noche via-noche/70 to-transparent" />

        {/* Sombra detrás de los textos para que se lean sobre los arcos de luz */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-[radial-gradient(ellipse_70%_80%_at_20%_100%,rgb(9_9_11/0.9),transparent_70%)]" />
      </div>

      {/* Textos */}
      <div className="campus-copy absolute inset-x-4 bottom-[8svh] md:inset-x-auto md:bottom-[10vh] md:left-[max(1rem,calc((100vw-72rem)/2+1rem))] md:w-[30rem]">
        <div className="story-captions campus-captions">
          {captions.map((caption, i) => (
            <div key={i} data-campus-caption className={`story-caption ${i === 0 ? 'is-active' : ''}`}>
              <h2 className="text-3xl font-bold md:text-5xl">{caption.title}</h2>
              <p className="mt-2 text-white/75 md:text-lg">{caption.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CampusScene
