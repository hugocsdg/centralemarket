import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Camera, Check, CheckCheck, Mail } from 'lucide-react'
import { LogoMark } from '../Logo'
import type { IntroCopy } from '../../i18n/intro'

// Los 4 pasos en un iPhone: se queda fijo mientras haces scroll y su pantalla va cambiando
// (email de estudiante → publicar → chat → quedar en el campus).
// Las animaciones están en lib/useIntroAnimations.ts (busca "data-phone").

const LAMP = '/intro/item-lamp.webp'

function PhoneStory({ copy }: { copy: IntroCopy }) {
  const t = copy.how
  return (
    <section data-phone-scene className="relative flex min-h-[100svh] items-center py-16">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-6 px-4 md:grid-cols-[1fr_auto] md:gap-16">
        {/* Textos que van cambiando (debajo del móvil en pantallas pequeñas) */}
        <div className="order-last md:order-first">
          {/* Puntos de progreso: en qué paso estás */}
          <ol aria-hidden="true" className="mb-5 flex gap-2">
            {t.steps.map((step) => (
              <li
                key={step.title}
                data-step-dot
                className="h-1 w-8 rounded-full bg-white/15 transition-colors duration-500"
              />
            ))}
          </ol>
          <div className="story-captions phone-captions">
            {t.steps.map((step, i) => (
              <div key={step.title} data-phone-caption className={`story-caption ${i === 0 ? 'is-active' : ''}`}>
                <p className="font-display text-sm font-semibold text-rosa tabular-nums">
                  {t.stepLabel} {i + 1}/{t.steps.length}
                </p>
                <h3 className="mt-2 text-2xl leading-tight font-bold sm:text-3xl md:text-5xl">{step.title}</h3>
                <p className="mt-2 max-w-md text-sm text-white/70 md:mt-4 md:text-lg">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* El móvil */}
        <div className="relative mx-auto">
          <div className="absolute -inset-10 rounded-full bg-carmin/20 blur-3xl" />
          <IPhone>
            <LoginScreen />
            <SellScreen />
            <ChatScreen />
            <SoldScreen />
          </IPhone>
        </div>
      </div>
    </section>
  )
}

// Tamaño "real" al que se dibuja el iPhone. Luego se escala entero (como una imagen)
// para que quepa en la pantalla sin deformarse: siempre con proporciones de iPhone.
const DEVICE_W = 300
const DEVICE_H = 650

// iPhone estilo Pro actual: marco de titanio, bordes de pantalla muy finos,
// isla dinámica, botón de acción, volumen, encendido y Camera Control.
function IPhone({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const element = box.current
    if (!element) return
    const update = () => setScale(element.clientHeight / DEVICE_H)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={box} className="relative h-[min(60svh,660px)]" style={{ aspectRatio: `${DEVICE_W} / ${DEVICE_H}` }}>
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: DEVICE_W, height: DEVICE_H, transform: `scale(${scale})` }}
      >
        {/* Botones laterales */}
        <span className="absolute top-[118px] -left-[3px] h-[30px] w-[4px] rounded-l-sm bg-gradient-to-r from-[#5c5c60] to-[#9a9a9f]" />
        <span className="absolute top-[170px] -left-[3px] h-[56px] w-[4px] rounded-l-sm bg-gradient-to-r from-[#5c5c60] to-[#9a9a9f]" />
        <span className="absolute top-[238px] -left-[3px] h-[56px] w-[4px] rounded-l-sm bg-gradient-to-r from-[#5c5c60] to-[#9a9a9f]" />
        <span className="absolute top-[190px] -right-[3px] h-[86px] w-[4px] rounded-r-sm bg-gradient-to-l from-[#5c5c60] to-[#9a9a9f]" />
        <span className="absolute top-[370px] -right-[2px] h-[52px] w-[3px] rounded-r-sm bg-[#6e6e73]" />

        {/* Marco de titanio */}
        <div className="absolute inset-0 rounded-[52px] bg-gradient-to-br from-[#b4b4b9] via-[#4a4a4e] to-[#8e8e93] p-[3px] shadow-[0_60px_120px_-30px_rgb(0_0_0/0.95),0_0_80px_-30px_rgb(224_21_63/0.35)]">
          <div className="h-full w-full rounded-[49px] bg-[#1c1c1e] p-[2px]">
            {/* Borde negro de la pantalla, muy fino */}
            <div className="relative h-full w-full rounded-[47px] bg-black p-[5px]">
              <div className="relative h-full w-full overflow-hidden rounded-[42px] bg-[#0c0c0e] text-[12px]">
                {children}
                {/* Isla dinámica */}
                <div className="absolute top-[10px] left-1/2 z-30 flex h-[26px] w-[86px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-[9px]">
                  <span className="h-[8px] w-[8px] rounded-full bg-[#141428] ring-1 ring-[#2a2a40]" />
                </div>
                {/* Reflejo del cristal */}
                <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(115deg,rgb(255_255_255/0.07)_0%,transparent_32%)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const screen = 'absolute inset-0 flex flex-col'

function LoginScreen() {
  return (
    <div data-screen="login" className={`${screen} items-center justify-center px-4 text-center`}>
      <LogoMark className="h-10 w-auto" />
      <p className="mt-3 text-sm font-bold">Join CentraleMarket</p>
      <div className="mt-3 flex w-full items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2 py-2 text-left">
        <Mail className="h-3 w-3 text-white/60" /> you@student-cs.fr
      </div>
      <p className="mt-3 text-[11px] text-white/60">Enter the code we emailed you</p>
      <div className="mt-2 flex gap-1">
        {'482916'.split('').map((digit, i) => (
          <span
            key={i}
            className="flex h-8 w-6 items-center justify-center rounded-md border border-white/15 bg-white/10 text-sm font-bold"
          >
            <span data-code-digit>{digit}</span>
          </span>
        ))}
      </div>
      <p
        data-login-ok
        className="mt-3 flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-emerald-300"
      >
        <Check className="h-3 w-3" /> You're in!
      </p>
    </div>
  )
}

function SellScreen() {
  return (
    <div data-screen="sell" className={`${screen} px-3 pt-12`}>
      <p className="text-sm font-bold">Sell an item</p>
      <div className="mt-2 flex gap-1.5">
        <img
          data-sell-photo
          src={LAMP}
          alt=""
          loading="lazy"
          decoding="async"
          className="aspect-square w-1/3 rounded-lg object-cover"
        />
        <div className="flex aspect-square w-1/3 items-center justify-center rounded-lg border border-dashed border-white/20 text-white/60">
          <Camera className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-[11px] text-white/60">Title</p>
      <div className="relative mt-1 overflow-hidden rounded-lg border border-white/15 bg-white/10 px-2 py-1.5">
        Desk lamp
        <span data-type-mask className="absolute inset-y-0 right-0 left-2 origin-right bg-[#202023]" />
      </div>
      <p className="mt-2 text-[11px] text-white/60">Price</p>
      <div data-sell-price className="mt-1 rounded-lg border border-white/15 bg-white/10 px-2 py-1.5 font-bold">
        8 €
      </div>
      <div data-publish className="btn-primary mt-3 rounded-full py-2 text-center font-semibold">
        Publish listing
      </div>
      <p data-toast className="mt-2 rounded-lg bg-emerald-500/20 px-2 py-1.5 text-center text-emerald-300">
        Your item is now live! 🎉
      </p>
    </div>
  )
}

function ChatScreen() {
  const bubbles = [
    { mine: false, text: 'Hi! Is the lamp still available?' },
    { mine: true, text: 'Yes! 8 € 💡' },
    { mine: false, text: 'Perfect. Tomorrow after class?' },
    { mine: true, text: 'Deal, see you at 6 🙌' },
  ]
  return (
    <div data-screen="chat" className={`${screen} pt-11`}>
      <div className="flex items-center gap-2 border-b border-white/10 px-3 pb-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-carmin to-burdeos font-bold">
          P
        </span>
        <div>
          <p className="font-semibold">Pablo</p>
          <p className="text-[11px] text-white/60">Desk lamp · 8 €</p>
        </div>
      </div>
      <div className="flex-1 space-y-1.5 px-3 pt-3">
        {bubbles.map((bubble) => (
          <div key={bubble.text} data-bubble className={`flex ${bubble.mine ? 'justify-end' : ''}`}>
            <p
              className={`max-w-[80%] rounded-2xl px-2.5 py-1.5 ${
                bubble.mine ? 'rounded-br-sm bg-gradient-to-br from-rojo to-carmin' : 'rounded-bl-sm bg-white/10'
              }`}
            >
              {bubble.text}
            </p>
          </div>
        ))}
        <p data-seen className="flex items-center justify-end gap-1 text-[11px] text-white/60">
          <CheckCheck className="h-3 w-3" /> Seen
        </p>
      </div>
    </div>
  )
}

function SoldScreen() {
  return (
    <div data-screen="sold" className={`${screen} items-center justify-center px-4`}>
      <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <img src={LAMP} alt="" loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
        <div className="p-2.5">
          <p className="text-base font-bold">8 €</p>
          <p className="text-white/60">Desk lamp</p>
        </div>
        <span
          data-stamp
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-xl border-4 border-emerald-400 px-3 py-1 font-display text-2xl font-bold text-emerald-400"
        >
          SOLD
        </span>
      </div>
      <p data-sold-note className="mt-3 flex items-center gap-1 text-emerald-300">
        <Check className="h-3.5 w-3.5" /> Marked as sold
      </p>
    </div>
  )
}

export default PhoneStory
