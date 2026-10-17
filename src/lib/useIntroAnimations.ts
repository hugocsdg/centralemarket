import type { RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Todas las animaciones de la página de introducción.
// Los elementos se marcan en el HTML con atributos "data-…" y aquí se animan:
//   data-progress      barra de progreso de lectura
//   data-intro-header  cabecera que cambia al bajar
//   data-hero-word     palabras del titular (entran al cargar)
//   data-hero-fade     resto de la portada (entra al cargar)
//   data-hero-logo     logo de la portada (entra al cargar)
//   data-hero-parallax logo que se aleja más despacio al hacer scroll (solo escritorio)
//   data-reveal        aparece al entrar en pantalla (escalonado si hay varios juntos)
//   data-scrub-words   frase que se "enciende" palabra a palabra con el scroll
//   data-line          líneas que se revelan con el scroll
//   data-count         contador que sube al aparecer (data-from, data-suffix)
//   data-zoom          panel que se acerca con el scroll
//   data-steps         sección fijada con pasos (solo escritorio)
//
// Solo se anima transform y opacity, para que vaya a 60 fps.
export function useIntroAnimations(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const q = gsap.utils.selector(scope)

      // Barra de progreso y cabecera: siempre (no son "movimiento" que maree).
      gsap.to(q('[data-progress]'), {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
      })
      ScrollTrigger.create({
        start: 40,
        end: 'max',
        toggleClass: { targets: q('[data-intro-header]'), className: 'is-scrolled' },
      })

      const mm = gsap.matchMedia()
      mm.add(
        { motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 768px)' },
        (context) => {
          const { motion, desktop } = context.conditions as { motion: boolean; desktop: boolean }
          // "Reducir movimiento" activado: todo se queda quieto y visible.
          if (!motion) return

          // ---------- Scroll suave (Lenis) conectado con GSAP ----------
          const lenis = new Lenis({ duration: 1.1 })
          lenis.on('scroll', ScrollTrigger.update)
          const tick = (time: number) => lenis.raf(time * 1000)
          gsap.ticker.add(tick)
          gsap.ticker.lagSmoothing(0)

          // ---------- Portada: entrada al cargar ----------
          gsap.from(q('[data-hero-word]'), { yPercent: 110, duration: 1, ease: 'power4.out', stagger: 0.06, delay: 0.1 })
          gsap.from(q('[data-hero-fade]'), { opacity: 0, y: 24, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.5 })
          gsap.from(q('[data-hero-logo]'), { opacity: 0, scale: 0.85, duration: 1.2, ease: 'power3.out', delay: 0.2 })

          // ---------- Aparecer al entrar en pantalla (escalonado) ----------
          // (En escritorio, los pasos fijados se animan aparte, más abajo.)
          const revealed = q('[data-reveal]').filter((el) => !(desktop && el.hasAttribute('data-step')))
          gsap.set(revealed, { opacity: 0, y: 40 })
          ScrollTrigger.batch(revealed, {
            start: 'top 88%',
            onEnter: (elements) =>
              gsap.to(elements, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.12, overwrite: true }),
            // Si se salta de golpe por encima (p. ej. un enlace), que también aparezcan.
            onLeave: (elements) => gsap.to(elements, { opacity: 1, y: 0, duration: 0.4, overwrite: true }),
          })

          // ---------- Frase que se enciende palabra a palabra ----------
          q('[data-scrub-words]').forEach((block) => {
            gsap.fromTo(
              block.querySelectorAll('[data-word]'),
              { opacity: 0.12 },
              {
                opacity: 1,
                ease: 'none',
                stagger: 0.05,
                scrollTrigger: { trigger: block, start: 'top 75%', end: 'bottom 45%', scrub: true },
              },
            )
          })

          // ---------- Líneas que se revelan con el scroll ----------
          q('[data-line]').forEach((line) => {
            gsap.fromTo(
              line,
              { opacity: 0.1, y: 30 },
              { opacity: 1, y: 0, ease: 'none', scrollTrigger: { trigger: line, start: 'top 90%', end: 'top 60%', scrub: true } },
            )
          })

          // ---------- Contadores ----------
          q('[data-count]').forEach((element) => {
            const target = Number(element.dataset.count)
            const from = Number(element.dataset.from ?? 0)
            const suffix = element.dataset.suffix ?? ''
            const counter = { value: from }
            element.textContent = `${from}${suffix}`
            gsap.to(counter, {
              value: target,
              duration: 1.6,
              ease: 'power2.out',
              scrollTrigger: { trigger: element, start: 'top 85%', once: true },
              onUpdate: () => {
                element.textContent = `${Math.round(counter.value)}${suffix}`
              },
            })
          })

          // ---------- Panel que se acerca ----------
          gsap.fromTo(
            q('[data-zoom]'),
            { scale: 0.82, opacity: 0.5 },
            {
              scale: 1,
              opacity: 1,
              ease: 'none',
              scrollTrigger: { trigger: q('[data-zoom]')[0], start: 'top 95%', end: 'top 30%', scrub: true },
            },
          )

          // ---------- Solo en escritorio: parallax y sección fijada ----------
          let cleanupSteps = () => {}
          if (desktop) {
            const hero = q('[data-hero]')[0]
            gsap.to(q('[data-hero-parallax]'), {
              yPercent: 35,
              scale: 0.9,
              opacity: 0.35,
              ease: 'none',
              scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
            })

            const section = q('[data-steps]')[0]
            const stage = q('[data-steps-stage]')[0]
            const steps = q('[data-step]')
            const dots = q('[data-step-dot]')
            if (section && stage && steps.length > 1) {
              // Los pasos se apilan uno encima de otro y se van sustituyendo.
              stage.classList.add('is-pinned')
              gsap.set(steps.slice(1), { opacity: 0, y: 40 })

              const timeline = gsap.timeline({
                scrollTrigger: {
                  trigger: section,
                  start: 'top top',
                  end: () => `+=${window.innerHeight * steps.length}`,
                  pin: true,
                  scrub: 0.6,
                  onUpdate: (self) => {
                    const active = Math.min(steps.length - 1, Math.round(self.progress * (steps.length - 1)))
                    dots.forEach((dot, i) => dot.classList.toggle('is-active', i <= active))
                  },
                },
              })
              // Cada paso: pausa para leerlo, sale, y entra el siguiente (sin que se solapen).
              steps.forEach((step, i) => {
                if (i === 0) return
                timeline
                  .to({}, { duration: 0.6 })
                  .to(steps[i - 1], { opacity: 0, y: -40, duration: 0.4, ease: 'power2.in' })
                  .to(step, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
              })
              timeline.to({}, { duration: 0.6 })
              timeline.fromTo(
                q('[data-steps-fill]'),
                { scaleY: 1 / steps.length },
                { scaleY: 1, ease: 'none', duration: timeline.duration() },
                0,
              )
              cleanupSteps = () => stage.classList.remove('is-pinned')
            }
          }

          return () => {
            cleanupSteps()
            gsap.ticker.remove(tick)
            lenis.destroy()
          }
        },
      )
    },
    { scope },
  )
}
