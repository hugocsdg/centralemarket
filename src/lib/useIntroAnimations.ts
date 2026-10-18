import type { RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, useGSAP)
// En el móvil la barra del navegador aparece y desaparece al hacer scroll: que no recalcule todo por eso.
ScrollTrigger.config({ ignoreMobileResize: true })

// El scroll suave activo (si hay animaciones), para poder saltar a un capítulo.
let activeLenis: Lenis | null = null

// Saltar a un capítulo de la intro (índice de la derecha, "Skip intro", "How it works").
export function scrollToSection(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  if (activeLenis) activeLenis.scrollTo(target, { duration: 1.8 })
  else target.scrollIntoView()
}

// Todas las animaciones de la página de introducción.
// Los elementos se marcan en el HTML con atributos "data-…" y aquí se animan.
// Solo se anima transform y opacity, para que vaya a 60 fps.
//
// Escenas fijadas (se quedan quietas mientras el scroll avanza "dentro" de ellas):
//   data-phone-scene    el móvil cuenta los 4 pasos
// La portada, el campus y la galería llevan su propia animación en su componente.
export function useIntroAnimations(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const q = gsap.utils.selector(scope)

      // Barra de progreso y cabecera: siempre (no son movimiento que maree).
      gsap.to(q('[data-progress]'), { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } })
      ScrollTrigger.create({
        start: 40,
        end: 'max',
        toggleClass: { targets: q('[data-intro-header]'), className: 'is-scrolled' },
      })

      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const animated = q('[data-phone-scene]')
        animated.forEach((el) => el.classList.add('is-animated'))
        const vh = () => window.innerHeight

        // ---------- Scroll suave (Lenis) conectado con GSAP ----------
        const lenis = new Lenis({ duration: 1.1 })
        activeLenis = lenis
        lenis.on('scroll', ScrollTrigger.update)
        const tick = (time: number) => lenis.raf(time * 1000)
        gsap.ticker.add(tick)
        gsap.ticker.lagSmoothing(0)

        // ---------- 1. Portada: entrada al cargar ----------
        gsap.from(q('[data-hero-word]'), { yPercent: 110, duration: 1, ease: 'power4.out', stagger: 0.06, delay: 0.3 })
        gsap.from(q('[data-hero-fade]'), {
          opacity: 0,
          y: 24,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.1,
          delay: 0.7,
        })
        gsap.from(q('[data-scroll-hint]'), { opacity: 0, duration: 1, delay: 1.6 })
        // El indicador de scroll se va en cuanto empiezas a bajar.
        gsap.to(q('[data-scroll-hint]'), {
          opacity: 0,
          y: 20,
          ease: 'none',
          scrollTrigger: { start: 0, end: 160, scrub: true },
        })

        // Botones magnéticos (solo con ratón): se acercan un poco al cursor.
        const unbind: (() => void)[] = []
        if (window.matchMedia('(pointer: fine)').matches) {
          q('[data-magnetic]').forEach((button) => {
            const toX = gsap.quickTo(button, 'x', { duration: 0.5, ease: 'power3.out' })
            const toY = gsap.quickTo(button, 'y', { duration: 0.5, ease: 'power3.out' })
            const move = (e: Event) => {
              const event = e as PointerEvent
              // Posición del botón sin el desplazamiento que ya lleva (si no, temblaría).
              const box = button.getBoundingClientRect()
              const left = box.left - Number(gsap.getProperty(button, 'x'))
              const top = box.top - Number(gsap.getProperty(button, 'y'))
              toX((event.clientX - left - box.width / 2) * 0.25)
              toY((event.clientY - top - box.height / 2) * 0.35)
            }
            const leave = () => {
              toX(0)
              toY(0)
            }
            button.addEventListener('pointermove', move)
            button.addEventListener('pointerleave', leave)
            unbind.push(() => {
              button.removeEventListener('pointermove', move)
              button.removeEventListener('pointerleave', leave)
            })
          })
        }
        // En el móvil las escenas fijadas duran menos: el dedo recorre menos pantalla que la rueda.
        const isPhone = window.innerWidth < 768

        // ---------- 2. El móvil: los 4 pasos ----------
        const phone = q('[data-phone-scene]')[0]
        const screen = (name: string) => q(`[data-screen="${name}"]`)
        const phoneCaptions = q('[data-phone-caption]')
        const stepDots = q('[data-step-dot]')
        const labels = ['login', 'sell', 'chat', 'sold']

        gsap.set(
          ['sell', 'chat', 'sold'].map((name) => screen(name)[0]),
          { autoAlpha: 0 },
        )

        const tl = gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: {
            trigger: phone,
            start: 'top top',
            end: () => `+=${vh() * (isPhone ? 2.2 : 2.4)}`,
            pin: true,
            scrub: 0.6,
          },
          // El texto cambia según por dónde va la animación del móvil.
          onUpdate: () => {
            const time = tl.time()
            let active = 0
            labels.forEach((label, i) => {
              if (time >= tl.labels[label] - 0.15) active = i
            })
            phoneCaptions.forEach((el, i) => el.classList.toggle('is-active', i === active))
            stepDots.forEach((el, i) => el.classList.toggle('bg-carmin', i <= active))
          },
        })
        // Cambiar de una pantalla del móvil a otra.
        const swap = (from: string, to: string) =>
          tl
            .to(screen(from), { autoAlpha: 0, scale: 0.94, duration: 0.5 })
            .fromTo(screen(to), { autoAlpha: 0, scale: 1.06 }, { autoAlpha: 1, scale: 1, duration: 0.5 }, '<')

        // a) Login con código.
        tl.addLabel('login')
          .from(q('[data-code-digit]'), { opacity: 0, y: -12, stagger: 0.12, duration: 0.3 })
          .from(q('[data-login-ok]'), { opacity: 0, scale: 0.8, duration: 0.3 })
          .to({}, { duration: 0.6 })
        // b) Publicar: foto, título que se escribe, precio, botón.
        tl.addLabel('sell')
        swap('login', 'sell')
          .from(q('[data-sell-photo]'), { scale: 0.6, opacity: 0, duration: 0.4 })
          .fromTo(q('[data-type-mask]'), { scaleX: 1 }, { scaleX: 0, duration: 0.6, ease: 'steps(14)' })
          .from(q('[data-sell-price]'), { opacity: 0, x: -10, duration: 0.3 })
          .to(q('[data-publish]'), { scale: 0.92, duration: 0.15 })
          .to(q('[data-publish]'), { scale: 1, duration: 0.15 })
          .from(q('[data-toast]'), { opacity: 0, y: 10, duration: 0.3 })
          .to({}, { duration: 0.5 })
        // c) Chat: los mensajes van apareciendo.
        tl.addLabel('chat')
        swap('sell', 'chat')
          .from(q('[data-bubble]'), { opacity: 0, y: 14, scale: 0.9, stagger: 0.3, duration: 0.3 })
          .from(q('[data-seen]'), { opacity: 0, duration: 0.2 })
          .to({}, { duration: 0.5 })
        // d) Vendido: el sello cae sobre la tarjeta.
        tl.addLabel('sold')
        swap('chat', 'sold')
          .from(q('[data-stamp]'), { scale: 2.6, opacity: 0, rotation: -30, duration: 0.4, ease: 'back.out(2)' })
          .from(q('[data-sold-note]'), { opacity: 0, y: 8, duration: 0.3 })
          .to({}, { duration: 0.8 })

        // ---------- Aparecer al entrar en pantalla (escalonado) ----------
        const revealed = q('[data-reveal]')
        gsap.set(revealed, { opacity: 0, y: 40 })
        ScrollTrigger.batch(revealed, {
          start: 'top 88%',
          onEnter: (elements) =>
            gsap.to(elements, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.12, overwrite: true }),
          // Si se salta de golpe por encima, que también aparezcan.
          onLeave: (elements) => gsap.to(elements, { opacity: 1, y: 0, duration: 0.4, overwrite: true }),
        })

        // ---------- Líneas rojas finas que se dibujan solas al llegar ----------
        q('[data-draw]').forEach((line) => {
          gsap.fromTo(
            line,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 1.4,
              ease: 'expo.out',
              scrollTrigger: { trigger: line, start: 'top 85%', once: true },
            },
          )
        })

        // ---------- Imágenes que entran con un ligero zoom ----------
        q('[data-img-reveal]').forEach((img) => {
          gsap.fromTo(
            img,
            { scale: 1.12 },
            {
              scale: 1,
              ease: 'none',
              scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          )
        })

        return () => {
          animated.forEach((el) => el.classList.remove('is-animated'))
          gsap.ticker.remove(tick)
          lenis.destroy()
          activeLenis = null
          unbind.forEach((off) => off())
        }
      })

      // Va después de las escenas fijadas: así las posiciones ya cuentan el espacio que ocupan.
      // Índice de capítulos: aparece al dejar la portada y marca el capítulo que se está viendo.
      const rail = q('[data-chapter-rail]')[0]
      const chapters = q('[data-chapter]')
      ScrollTrigger.create({
        trigger: chapters[0],
        start: 'top 60%',
        end: 'max',
        onToggle: (self) => rail?.classList.toggle('opacity-100', self.isActive),
      })
      // La pastilla "Skip intro" del móvil: solo durante la historia (ni en la portada ni en el final).
      const skipPill = q('[data-skip-pill]')[0]
      ScrollTrigger.create({
        trigger: chapters[0],
        start: 'top 60%',
        endTrigger: q('#join')[0],
        end: 'top 80%',
        onToggle: (self) => {
          skipPill?.classList.toggle('opacity-0', !self.isActive)
          skipPill?.classList.toggle('pointer-events-none', !self.isActive)
        },
      })
      chapters.forEach((chapter) => {
        ScrollTrigger.create({
          trigger: chapter,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => {
            if (!self.isActive) return
            q('[data-chapter-link]').forEach((link) => {
              link.toggleAttribute('data-active', link.dataset.chapterLink === chapter.id)
            })
          },
        })
      })
    },
    { scope },
  )
}
