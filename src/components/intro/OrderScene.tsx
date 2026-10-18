import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { RotateCcw, Search, Ticket, Users } from 'lucide-react'
import { LogoMark } from '../Logo'
import type { IntroCopy } from '../../i18n/intro'

// El momento interactivo de la intro: "WhatsApp" frente a "en orden".
// Mantienes pulsado el botón (o la barra espaciadora) y el chat caótico se ordena en tarjetas.
// - El progreso sube mientras pulsas; si sueltas antes, baja suave (nunca de golpe).
// - Al completarlo, los mensajes se van y entran las tarjetas una a una.
// - Con "reducir movimiento" basta un clic, sin mantener.
// El progreso se escribe directamente en una variable CSS (--hold), sin repintar React a cada fotograma.

const HOLD_MS = 1100
const THUMBS = ['/intro/item-lamp.webp', '/intro/item-headphones.webp', '/intro/item-bike.webp']

function OrderScene({ copy }: { copy: IntroCopy }) {
  const t = copy.order
  const [done, setDone] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const hold = useRef({ value: 0, pressing: false, raf: 0, last: 0 })
  const reduced = useRef(false)

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const h = hold.current
    return () => cancelAnimationFrame(h.raf)
  }, [])

  const paint = () => button.current?.style.setProperty('--hold', String(hold.current.value))

  const step = (now: number) => {
    const h = hold.current
    const dt = Math.min(64, now - (h.last || now))
    h.last = now
    // Pulsando sube; soltando baja al doble de velocidad, con suavidad.
    h.value = h.pressing ? Math.min(1, h.value + dt / HOLD_MS) : Math.max(0, h.value - (dt / HOLD_MS) * 2)
    paint()
    if (h.value >= 1) {
      h.raf = 0
      h.last = 0
      h.pressing = false
      setDone(true)
      return
    }
    if (h.value <= 0 && !h.pressing) {
      h.raf = 0
      h.last = 0
      return
    }
    h.raf = requestAnimationFrame(step)
  }

  const start = () => {
    if (done) return
    if (reduced.current) {
      setDone(true)
      return
    }
    hold.current.pressing = true
    if (!hold.current.raf) hold.current.raf = requestAnimationFrame(step)
  }
  const stop = () => {
    hold.current.pressing = false
  }
  const reset = () => {
    hold.current.value = 0
    paint()
    setDone(false)
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
      event.preventDefault()
      start()
    }
  }
  const onKeyUp = (event: KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') stop()
  }

  const cards = [
    ...copy.market.items.map((item, i) => ({ ...item, thumb: THUMBS[i] as string | null })),
    { ...t.ticket, where: '', thumb: null },
  ]

  return (
    <section
      id="order"
      data-chapter
      data-state={done ? 'order' : 'chaos'}
      className="order-scene relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-24 md:grid-cols-[1fr_minmax(0,26rem)] md:gap-16 md:py-32"
    >
      <div>
        {/* Los dos titulares ocupan el mismo sitio y se cruzan */}
        <div className="order-titles grid">
          <div className="order-title-chaos [grid-area:1/1]" aria-hidden={done}>
            <h2 className="font-display text-4xl leading-[1.05] font-bold tracking-[-0.03em] text-balance md:text-6xl">
              {t.chaosTitle}
            </h2>
            <p className="mt-4 max-w-md text-white/75 md:text-lg">{t.chaosText}</p>
          </div>
          <div className="order-title-order [grid-area:1/1]" aria-hidden={!done}>
            <h2 className="font-display text-4xl leading-[1.05] font-bold tracking-[-0.03em] text-balance md:text-6xl">
              {t.orderTitle}
            </h2>
            <p className="mt-4 max-w-md text-white/75 md:text-lg">{t.orderText}</p>
          </div>
        </div>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          {!done ? (
            <button
              ref={button}
              type="button"
              aria-describedby="order-hint"
              onPointerDown={(e) => {
                // Para que soltar fuera del botón también cuente como soltar.
                try {
                  e.currentTarget.setPointerCapture(e.pointerId)
                } catch {
                  // Algunos navegadores no lo permiten: no pasa nada.
                }
                start()
              }}
              onPointerUp={stop}
              onPointerCancel={stop}
              onLostPointerCapture={stop}
              onKeyDown={onKeyDown}
              onKeyUp={onKeyUp}
              onBlur={stop}
              onContextMenu={(e) => e.preventDefault()}
              className="hold-button group relative flex min-h-14 touch-none items-center gap-3 overflow-hidden rounded-full border border-white/20 bg-white/[0.04] py-2 pr-6 pl-2 font-semibold select-none"
            >
              {/* Relleno rojo que avanza mientras pulsas */}
              <span
                aria-hidden="true"
                className="hold-fill absolute inset-0 origin-left bg-gradient-to-r from-rojo to-carmin"
              />
              <span
                aria-hidden="true"
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
              >
                <span className="hold-dot h-3 w-3 rounded-full bg-white" />
              </span>
              <span className="relative">{t.hold}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={reset}
              className="flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-white/70 transition hover:text-white"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              {t.replay}
            </button>
          )}
        </div>
        <p id="order-hint" className="mt-3 text-sm text-white/60">
          {!done && t.holdHint}
        </p>
        <p className="sr-only" aria-live="polite">
          {done ? t.done : ''}
        </p>
      </div>

      {/* La "pantalla": el chat caótico y, encima, las tarjetas ordenadas */}
      <div className="order-panel relative mx-auto aspect-[4/5] w-full max-w-[26rem] overflow-hidden rounded-[2rem] border border-white/12 bg-[#0b141a] shadow-[0_40px_90px_-30px_rgb(0_0_0/0.9)]">
        <div className="order-chaos absolute inset-0 flex flex-col" aria-hidden={done}>
          <div className="flex items-center gap-3 bg-[#1f2c34] px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800">
              <Users aria-hidden="true" className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{t.group}</p>
              <p className="truncate text-xs text-white/60">{t.members}</p>
            </div>
            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-black">99+</span>
          </div>
          <div className="relative flex-1 overflow-hidden px-3">
            <div className="order-chat space-y-2 pt-3">
              {[...t.messages, ...t.messages].map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-xl px-3 py-1.5 text-sm ${i % 3 === 2 ? 'ml-auto bg-[#005c4b]' : 'bg-[#1f2c34]'} ${
                    'lamp' in m && m.lamp ? 'ring-2 ring-rosa' : ''
                  }`}
                >
                  <p className="text-xs font-semibold text-emerald-300">{m.who}</p>
                  <p>{m.text}</p>
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0b141a] to-transparent" />
          </div>
        </div>

        <div className="order-tidy absolute inset-0 flex flex-col bg-noche p-4" aria-hidden={!done}>
          <div className="flex items-center gap-2">
            <LogoMark className="h-6 w-auto" />
            <span className="font-logo font-bold">
              Centrale<span className="text-carmin">Market</span>
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-2 text-sm text-white/60">
            <Search aria-hidden="true" className="h-4 w-4" /> {t.search}
          </div>
          <ul className="mt-3 grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2.5">
            {cards.map((card, i) => (
              <li
                key={card.name}
                style={{ '--i': i } as CSSProperties}
                className="order-card flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
              >
                {card.thumb ? (
                  <img
                    src={card.thumb}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="min-h-0 w-full flex-1 object-cover"
                  />
                ) : (
                  <span className="flex min-h-0 flex-1 items-center justify-center bg-gradient-to-br from-burdeos to-rojo">
                    <Ticket aria-hidden="true" className="h-8 w-8" />
                  </span>
                )}
                <div className="p-2.5">
                  <p className="font-display text-lg font-bold tabular-nums">{card.price}&nbsp;€</p>
                  <p className="truncate text-xs text-white/65">{card.name}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default OrderScene
