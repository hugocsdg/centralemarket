import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Camera, Check, CheckCheck, Mail, Search } from 'lucide-react'
import { LogoMark } from '../Logo'
import { photo } from '../../data/photos'
import type { PhotoKey } from '../../data/photos'

// La escena del móvil: se queda fija mientras haces scroll y su pantalla va cambiando.
// Las animaciones están en lib/useIntroAnimations.ts (busca "data-phone").

const PHONE_CAPTIONS = [
  { eyebrow: 'Today', title: 'Everything gets lost in WhatsApp.', text: 'Hundreds of messages a day. That 8 € lamp? Buried in minutes.' },
  { eyebrow: 'With CentraleMarket', title: 'Everything in order.', text: 'Every item with photos, price and category. Searchable, always up to date.' },
  { eyebrow: 'Step 1', title: 'Sign in with your student email.', text: 'Type your @student-cs.fr address and the code we send you. No password.' },
  { eyebrow: 'Step 2', title: 'List it in under a minute.', text: 'A few photos, a title, a price. Published.' },
  { eyebrow: 'Step 3', title: 'Chat inside the app.', text: 'Buyers message you right here. Your number stays private.' },
  { eyebrow: 'Step 4', title: 'Meet on campus. Sold.', text: 'Hand it over and mark it as sold. Done.' },
]

const CHAOS = [
  { who: 'Léa', text: 'Selling desk lamp 8€ 💡 DM me', lamp: true },
  { who: 'Tom', text: 'anyone has a printer??' },
  { who: 'Inès', text: 'Party tickets for Friday 🎉 12€' },
  { who: 'Marco', text: 'who left a bike at the station' },
  { who: 'Yuki', text: 'Selling chair 25€, pickup tonight' },
  { who: 'Sam', text: 'Free pasta tonight 🍝 come by' },
  { who: 'Pablo', text: 'is the lamp still available?' },
  { who: 'Anna', text: 'Looking for a kettle!!' },
  { who: 'Hugo', text: 'mini fridge 40€ anyone?' },
  { who: 'Chloé', text: 'lost my keys in the gym 😭' },
  { who: 'Ali', text: 'selling calculator, like new' },
  { who: 'Emma', text: 'who is going to Paris tomorrow' },
  { who: 'Noah', text: 'Desk + chair bundle 35€' },
  { who: 'Lina', text: 'ticket for the gala??' },
  { who: 'Max', text: '+1 for the kettle' },
  { who: 'Zoé', text: 'bike for sale, 60€' },
  { who: 'Pablo', text: 'hello?? the lamp??' },
  { who: 'Ravi', text: 'anyone selling a mirror' },
]

const CARDS: { photo: PhotoKey; price: string; name: string }[] = [
  { photo: 'deskLamp', price: '8 €', name: 'Desk lamp' },
  { photo: 'roadBike', price: '280 €', name: 'Road bike' },
  { photo: 'armchair', price: '45 €', name: 'Armchair' },
  { photo: 'party', price: '12 €', name: 'Party ticket' },
  { photo: 'coffee', price: '35 €', name: 'Coffee machine' },
  { photo: 'books', price: 'Free', name: 'Books' },
]

function PhoneStory() {
  return (
    <section data-phone-scene className="relative flex min-h-[100svh] items-center py-16">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-6 px-4 md:grid-cols-[1fr_auto] md:gap-16">
        {/* Textos que van cambiando (debajo del móvil en pantallas pequeñas) */}
        <div className="story-captions phone-captions order-last md:order-first">
          {PHONE_CAPTIONS.map((caption, i) => (
            <div key={caption.title} data-phone-caption className={`story-caption ${i === 0 ? 'is-active' : ''}`}>
              <p className="text-xs font-semibold tracking-[0.25em] text-rosa uppercase">{caption.eyebrow}</p>
              <h3 className="mt-2 text-2xl leading-tight font-bold sm:text-3xl md:text-5xl">{caption.title}</h3>
              <p className="mt-2 max-w-md text-sm text-white/60 md:mt-4 md:text-lg">{caption.text}</p>
            </div>
          ))}
        </div>

        {/* El móvil */}
        <div className="relative mx-auto">
          <div className="absolute -inset-10 rounded-full bg-carmin/20 blur-3xl" />
          <IPhone>
            <ChaosScreen />
            <OrderScreen />
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
    <div
      ref={box}
      className="relative h-[min(60svh,660px)]"
      style={{ aspectRatio: `${DEVICE_W} / ${DEVICE_H}` }}
    >
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
              <div className="relative h-full w-full overflow-hidden rounded-[42px] bg-[#0c0c0e] text-[11px]">
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

function ChaosScreen() {
  return (
    <div data-screen="chaos" className={`${screen} bg-[#0b141a]`}>
      <div className="flex items-center gap-2 bg-[#1f2c34] px-3 pt-11 pb-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-[10px]">🏠</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">Campus buy & sell</p>
          <p className="truncate text-[10px] text-white/50">Léa, Tom, Inès, Marco, Yuki…</p>
        </div>
        <span data-unread className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
          12
        </span>
      </div>
      <div className="relative flex-1 overflow-hidden px-2">
        <div data-chat-list className="space-y-1.5 pt-2">
          {CHAOS.map((message, i) => (
            <div
              key={i}
              {...(message.lamp ? { 'data-lamp-msg': '' } : {})}
              className={`max-w-[85%] rounded-lg px-2 py-1 ${
                i % 3 === 2 ? 'ml-auto bg-[#005c4b]' : 'bg-[#1f2c34]'
              } ${message.lamp ? 'ring-2 ring-rosa' : ''}`}
            >
              <p className="text-[9px] font-semibold text-emerald-300">{message.who}</p>
              <p>{message.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function OrderScreen() {
  return (
    <div data-screen="order" className={`${screen} px-3 pt-11`}>
      <div className="flex items-center gap-1.5">
        <LogoMark className="h-5 w-auto" />
        <span className="font-logo font-bold">
          Centrale<span className="text-carmin">Market</span>
        </span>
      </div>
      <div className="mt-2 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-white/40">
        <Search className="h-3 w-3" /> Search…
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {CARDS.map((card) => (
          <div key={card.name} data-card className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <img src={photo(card.photo, 240, 240)} alt="" loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
            <div className="p-1.5">
              <p className="font-bold">{card.price}</p>
              <p className="truncate text-[10px] text-white/60">{card.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LoginScreen() {
  return (
    <div data-screen="login" className={`${screen} items-center justify-center px-4 text-center`}>
      <LogoMark className="h-10 w-auto" />
      <p className="mt-3 text-sm font-bold">Join CentraleMarket</p>
      <div className="mt-3 flex w-full items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2 py-2 text-left">
        <Mail className="h-3 w-3 text-white/50" /> you@student-cs.fr
      </div>
      <p className="mt-3 text-[10px] text-white/50">Enter the code we emailed you</p>
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
      <p data-login-ok className="mt-3 flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-emerald-300">
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
        <img data-sell-photo src={photo('deskLamp', 240, 240)} alt="" loading="lazy" decoding="async" className="aspect-square w-1/3 rounded-lg object-cover" />
        <div className="flex aspect-square w-1/3 items-center justify-center rounded-lg border border-dashed border-white/20 text-white/40">
          <Camera className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-[10px] text-white/50">Title</p>
      <div className="relative mt-1 overflow-hidden rounded-lg border border-white/15 bg-white/10 px-2 py-1.5">
        Desk lamp
        <span data-type-mask className="absolute inset-y-0 right-0 left-2 origin-right bg-[#202023]" />
      </div>
      <p className="mt-2 text-[10px] text-white/50">Price</p>
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
          <p className="text-[10px] text-white/50">Desk lamp · 8 €</p>
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
        <p data-seen className="flex items-center justify-end gap-1 text-[9px] text-white/40">
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
        <img src={photo('deskLamp', 480, 360)} alt="" loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
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
