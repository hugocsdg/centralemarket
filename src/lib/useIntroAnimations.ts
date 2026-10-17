import type { RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Lenis from 'lenis'
import type { Morph } from './particles'

gsap.registerPlugin(ScrollTrigger, useGSAP)
// En el móvil la barra del navegador aparece y desaparece al hacer scroll: que no recalcule todo por eso.
ScrollTrigger.config({ ignoreMobileResize: true })

// Todas las animaciones de la página de introducción.
// Los elementos se marcan en el HTML con atributos "data-…" y aquí se animan.
// Solo se anima transform y opacity, para que vaya a 60 fps.
//
// Escenas fijadas (se quedan quietas mientras el scroll avanza "dentro" de ellas):
//   data-mac-scene      zoom a la pantalla de un MacBook con fotos reales
//   data-phone-scene    el móvil cuenta la historia en 6 pantallas
//   data-journey        los paneles se desplazan en horizontal
export function useIntroAnimations(scope: RefObject<HTMLElement | null>, morphRef: RefObject<Morph>) {
  useGSAP(
    () => {
      const q = gsap.utils.selector(scope)
      const setMorph = (from: number, to: number, t: number) => {
        Object.assign(morphRef.current, { from, to, t })
      }

      // Barra de progreso y cabecera: siempre (no son movimiento que maree).
      gsap.to(q('[data-progress]'), { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } })
      ScrollTrigger.create({
        start: 40,
        end: 'max',
        toggleClass: { targets: q('[data-intro-header]'), className: 'is-scrolled' },
      })

      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const animated = [...q('[data-mac-scene]'), ...q('[data-phone-scene]'), ...q('[data-journey]')]
        animated.forEach((el) => el.classList.add('is-animated'))
        const vh = () => window.innerHeight

        // ---------- Scroll suave (Lenis) conectado con GSAP ----------
        const lenis = new Lenis({ duration: 1.1 })
        lenis.on('scroll', ScrollTrigger.update)
        const tick = (time: number) => lenis.raf(time * 1000)
        gsap.ticker.add(tick)
        gsap.ticker.lagSmoothing(0)

        // ---------- 1. Portada: entrada al cargar ----------
        gsap.from(q('[data-hero-word]'), { yPercent: 110, duration: 1, ease: 'power4.out', stagger: 0.06, delay: 0.3 })
        gsap.from(q('[data-hero-fade]'), { opacity: 0, y: 24, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.7 })

        // ---------- 2. MacBook: aparece, entramos en su pantalla y pasan las fotos ----------
        const macScene = q('[data-mac-scene]')[0]
        const mac = q('[data-mac]')[0]
        const macItems = q('[data-mac-item]')
        const full = q('[data-mac-full]')[0]
        const fullItems = q('[data-mac-full-item]')
        const macCaptions = q('[data-mac-caption]')

        // Al bajar desde la portada, el logo de partículas se deshace en un anillo de fondo.
        ScrollTrigger.create({
          trigger: macScene,
          start: 'top bottom',
          end: 'top top',
          onUpdate: (self) => setMorph(0, 1, self.progress),
        })

        // Cuánto hay que ampliar el Mac para que su pantalla llene la ventana.
        const zoom = () => {
          const screenBox = mac.firstElementChild as HTMLElement
          return Math.max(window.innerWidth / screenBox.offsetWidth, window.innerHeight / (screenBox.offsetHeight * 0.95)) * 1.1
        }

        gsap.set(full, { autoAlpha: 0 })
        const macTl = gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          scrollTrigger: {
            trigger: macScene,
            start: 'top top',
            end: () => `+=${vh() * 6}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
          // Se comprueba con la animación (no con el scroll), así la ficha nunca va por detrás de la foto.
          onUpdate: () => {
            let active = 0
            fullItems.forEach((item, i) => {
              if (Number(gsap.getProperty(item, 'opacity')) > 0.5) active = i
            })
            macCaptions.forEach((el, i) => el.classList.toggle('is-active', i === active))
          },
        })

        macTl
          .from(mac, { y: 120, scale: 0.8, opacity: 0, duration: 0.8, ease: 'power3.out' })
          .to({}, { duration: 0.3 })
          // Entramos en la pantalla
          .to(q('[data-mac-headline]'), { opacity: 0, y: -40, duration: 0.4 })
          .to(mac, { scale: zoom, duration: 1.4, ease: 'power3.in' }, '<')
          .to(q('[data-mac-chrome]'), { opacity: 0, duration: 0.4 }, '<')
          .to(full, { autoAlpha: 1, duration: 0.35, ease: 'none' }, '-=0.35')
          .fromTo(fullItems[0], { scale: 1.25 }, { scale: 1, duration: 1.2, ease: 'power2.out' }, '<')
          .from(q('.mac-captions'), { opacity: 0, y: 40, duration: 0.5 }, '<0.2')

        // Pasan las fotos (cada una entra con un pequeño zoom, como en un vídeo)
        fullItems.forEach((item, i) => {
          if (i === 0) return
          macTl
            .to({}, { duration: 0.6 })
            .to(fullItems[i - 1], { opacity: 0, scale: 0.96, duration: 0.5 })
            .fromTo(item, { opacity: 0, scale: 1.18 }, { opacity: 1, scale: 1, duration: 0.9, ease: 'power2.out' }, '<')
            .set(macItems[i - 1], { opacity: 0 }, '<')
            .set(macItems[i], { opacity: 1 }, '<')
        })

        // Salimos de la pantalla: volvemos a ver el Mac entero
        macTl
          .to({}, { duration: 0.6 })
          .to(q('.mac-captions'), { opacity: 0, y: 30, duration: 0.3 })
          .to(full, { autoAlpha: 0, duration: 0.35, ease: 'none' })
          .to(mac, { scale: 0.9, duration: 1.2, ease: 'power3.out' }, '<')
          .to(q('[data-mac-chrome]'), { opacity: 1, duration: 0.4 }, '<0.6')
          .to({}, { duration: 0.3 })

        // ---------- 3. El móvil ----------
        const phone = q('[data-phone-scene]')[0]
        const screen = (name: string) => q(`[data-screen="${name}"]`)
        const phoneCaptions = q('[data-phone-caption]')
        const labels = ['chaos', 'order', 'login', 'sell', 'chat', 'sold']

        gsap.set(['order', 'login', 'sell', 'chat', 'sold'].map((name) => screen(name)[0]), { autoAlpha: 0 })
        const unread = q('[data-unread]')[0]
        const counter = { value: 12 }

        const tl = gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: {
            trigger: phone,
            start: 'top top',
            end: () => `+=${vh() * 6}`,
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
          },
        })
        // Cambiar de una pantalla del móvil a otra.
        const swap = (from: string, to: string) =>
          tl
            .to(screen(from), { autoAlpha: 0, scale: 0.94, duration: 0.5 })
            .fromTo(screen(to), { autoAlpha: 0, scale: 1.06 }, { autoAlpha: 1, scale: 1, duration: 0.5 }, '<')

        // a) Caos: los mensajes suben sin parar y entierran la lámpara.
        tl.addLabel('chaos')
          .to(q('[data-chat-list]'), { yPercent: -62, ease: 'none', duration: 2 })
          .to(
            counter,
            {
              value: 99,
              ease: 'none',
              duration: 2,
              onUpdate: () => {
                unread.textContent = counter.value >= 99 ? '99+' : String(Math.round(counter.value))
              },
            },
            '<',
          )
          .to(q('[data-lamp-msg]'), { opacity: 0.3, duration: 0.6 }, 0.8)
        // b) Orden: aparece CentraleMarket con las tarjetas.
        tl.addLabel('order')
        swap('chaos', 'order')
          .from(q('[data-card]'), { opacity: 0, y: 30, scale: 0.8, stagger: 0.12, duration: 0.5 }, '<0.2')
          .to({}, { duration: 0.8 })
        // c) Login con código.
        tl.addLabel('login')
        swap('order', 'login')
          .from(q('[data-code-digit]'), { opacity: 0, y: -12, stagger: 0.12, duration: 0.3 })
          .from(q('[data-login-ok]'), { opacity: 0, scale: 0.8, duration: 0.3 })
          .to({}, { duration: 0.6 })
        // d) Publicar: foto, título que se escribe, precio, botón.
        tl.addLabel('sell')
        swap('login', 'sell')
          .from(q('[data-sell-photo]'), { scale: 0.6, opacity: 0, duration: 0.4 })
          .fromTo(q('[data-type-mask]'), { scaleX: 1 }, { scaleX: 0, duration: 0.6, ease: 'steps(14)' })
          .from(q('[data-sell-price]'), { opacity: 0, x: -10, duration: 0.3 })
          .to(q('[data-publish]'), { scale: 0.92, duration: 0.15 })
          .to(q('[data-publish]'), { scale: 1, duration: 0.15 })
          .from(q('[data-toast]'), { opacity: 0, y: 10, duration: 0.3 })
          .to({}, { duration: 0.5 })
        // e) Chat: los mensajes van apareciendo.
        tl.addLabel('chat')
        swap('sell', 'chat')
          .from(q('[data-bubble]'), { opacity: 0, y: 14, scale: 0.9, stagger: 0.3, duration: 0.3 })
          .from(q('[data-seen]'), { opacity: 0, duration: 0.2 })
          .to({}, { duration: 0.5 })
        // f) Vendido: el sello cae sobre la tarjeta.
        tl.addLabel('sold')
        swap('chat', 'sold')
          .from(q('[data-stamp]'), { scale: 2.6, opacity: 0, rotation: -30, duration: 0.4, ease: 'back.out(2)' })
          .from(q('[data-sold-note]'), { opacity: 0, y: 8, duration: 0.3 })
          .to({}, { duration: 0.8 })

        // ---------- 4. Un año en el campus (horizontal) ----------
        const journey = q('[data-journey]')[0]
        const track = q('[data-journey-track]')[0]
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth)
        gsap
          .timeline({
            scrollTrigger: {
              trigger: journey,
              start: 'top top',
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          })
          .to(track, { x: () => -distance(), ease: 'none' }, 0)
          .to(q('[data-journey-fill]'), { scaleX: 1, ease: 'none' }, 0)

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
          const value = { n: from }
          element.textContent = `${from}${suffix}`
          gsap.to(value, {
            n: target,
            duration: 1.6,
            ease: 'power2.out',
            scrollTrigger: { trigger: element, start: 'top 85%', once: true },
            onUpdate: () => {
              element.textContent = `${Math.round(value.n)}${suffix}`
            },
          })
        })

        // ---------- 5. Final: el anillo vuelve a ser el logo ----------
        ScrollTrigger.create({
          trigger: q('[data-final-scene]')[0],
          start: 'top bottom',
          end: 'top 15%',
          onUpdate: (self) => setMorph(1, 2, self.progress),
        })

        return () => {
          animated.forEach((el) => el.classList.remove('is-animated'))
          gsap.ticker.remove(tick)
          lenis.destroy()
        }
      })
    },
    { scope },
  )
}
