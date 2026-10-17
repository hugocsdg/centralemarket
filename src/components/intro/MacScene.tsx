import { MapPin, MessageCircle } from 'lucide-react'
import { photo } from '../../data/photos'
import type { PhotoKey } from '../../data/photos'

// Escena del MacBook: aparece el portátil, la cámara "entra" en su pantalla
// y dentro van pasando fotos reales de cosas que se venden en el campus.
// Las animaciones están en lib/useIntroAnimations.ts (busca "data-mac").

// Cada foto tiene dos puntos (en % de la foto):
//   enter: zona oscura desde la que aparece el objeto (la transición "sale" de ahí)
//   exit:  zona oscura en la que la cámara se mete para pasar al siguiente objeto
// Como las dos zonas son casi negras, el paso de una foto a otra parece un solo plano continuo.
type Item = { key: PhotoKey; title: string; price: string; place: string; text: string; enter: string; exit: string }
const ITEMS: Item[] = [
  { key: 'deskLamp', title: 'Desk lamp', price: '8 €', place: 'Gif-sur-Yvette', text: 'Warm light for late-night revision.', enter: '30% 40%', exit: '22% 58%' },
  { key: 'roadBike', title: 'Road bike', price: '280 €', place: 'Palaiseau', text: 'Fast, light, ready for the plateau.', enter: '50% 58%', exit: '32% 74%' },
  { key: 'armchair', title: 'Armchair', price: '45 €', place: 'Moulon', text: 'The comfiest seat in the residence.', enter: '58% 80%', exit: '18% 40%' },
  { key: 'deskSetup', title: 'Desk & monitor', price: '120 €', place: 'Campus', text: 'A full study setup. Moving-out sale.', enter: '28% 62%', exit: '55% 88%' },
  { key: 'headphonesDark', title: 'Headphones', price: '40 €', place: 'Orsay', text: 'Noise cancelling. Library-approved.', enter: '37% 72%', exit: '50% 22%' },
  { key: 'party', title: 'Party ticket', price: '12 €', place: 'Campus', text: 'Friday night, sorted.', enter: '50% 88%', exit: '50% 50%' },
]

function MacScene() {
  return (
    <section data-mac-scene className="relative min-h-[100svh] overflow-hidden py-16">
      {/* Titular de la escena (se desvanece al entrar en la pantalla) */}
      <div data-mac-headline className="relative z-10 mx-auto max-w-3xl px-4 text-center md:absolute md:inset-x-0 md:top-[9vh]">
        <p className="text-xs font-semibold tracking-[0.25em] text-rosa uppercase">Everything changes hands</p>
        <h2 className="mt-3 text-4xl font-bold md:text-5xl">
          Real things. <span className="text-shine">Real students.</span>
        </h2>
      </div>

      {/* El MacBook */}
      <div className="mac-stage mt-10 flex justify-center md:mt-0">
        <div data-mac className="mac relative w-[min(92vw,900px,86svh)] origin-[50%_46%]">
          {/* Tapa con la pantalla */}
          <div className="rounded-[clamp(0.8rem,2vw,1.6rem)] border border-[#3a3a3f] bg-[#0b0b0c] p-[1.4%] shadow-[0_50px_100px_-30px_rgb(0_0_0/0.9)]">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[clamp(0.3rem,0.8vw,0.6rem)] bg-black">
              {/* Muesca de la cámara */}
              <div data-mac-chrome className="absolute top-0 left-1/2 z-20 h-[3.2%] w-[11%] -translate-x-1/2 rounded-b-[0.4rem] bg-[#0b0b0c]" />
              {/* Barra del navegador */}
              <div data-mac-chrome className="absolute inset-x-0 top-0 z-10 flex h-[7%] items-center gap-[0.8%] bg-[#1c1c1f] px-[1.5%]">
                <span className="h-[34%] rounded-full bg-[#ff5f57]" style={{ aspectRatio: 1 }} />
                <span className="h-[34%] rounded-full bg-[#febc2e]" style={{ aspectRatio: 1 }} />
                <span className="h-[34%] rounded-full bg-[#28c840]" style={{ aspectRatio: 1 }} />
                <span className="mx-auto rounded-md bg-white/10 px-[2%] py-[0.3%] text-[clamp(6px,1vw,11px)] text-white/60">
                  centralemarket.vercel.app
                </span>
              </div>
              {/* Contenido de la pantalla: un anuncio por foto */}
              {ITEMS.map((item, i) => (
                <div key={item.key} data-mac-item className={`absolute inset-0 top-[7%] ${i === 0 ? '' : 'opacity-0'}`}>
                  <img src={photo(item.key, 900)} alt="" className="h-full w-full object-cover" />
                  <div className="absolute bottom-[5%] left-[3%] rounded-[clamp(0.3rem,1vw,0.9rem)] bg-black/60 px-[2.5%] py-[1.5%] backdrop-blur-md">
                    <p className="text-[clamp(9px,2vw,22px)] font-bold">{item.price}</p>
                    <p className="text-[clamp(7px,1.2vw,13px)] text-white/70">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Base de aluminio */}
          <div className="relative mx-[-6%] h-[clamp(8px,1.6vw,16px)] rounded-b-[clamp(0.6rem,1.6vw,1.2rem)] bg-gradient-to-b from-[#d4d4d8] via-[#a1a1aa] to-[#52525b]">
            <div className="absolute top-0 left-1/2 h-[45%] w-[14%] -translate-x-1/2 rounded-b-md bg-[#71717a]" />
          </div>
        </div>
      </div>

      {/* Fotos a pantalla completa (aparecen al "entrar" en la pantalla) */}
      <div data-mac-full className="mac-full absolute inset-0 z-20 overflow-hidden bg-black [perspective:1400px]">
        {ITEMS.map((item, i) => (
          <div key={item.key} data-mac-full-item className={`absolute inset-0 ${i === 0 ? '' : 'opacity-0'}`}>
            {/* data-enter / data-exit: puntos de la transición (ver arriba) */}
            <img
              data-mac-full-img
              data-enter={item.enter}
              data-exit={item.exit}
              src={photo(item.key, 1800)}
              alt={item.title}
              className="h-full w-full object-cover will-change-transform"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-noche via-noche/10 to-noche/40" />
          </div>
        ))}

        {/* Ficha del anuncio que va cambiando */}
        <div className="absolute inset-x-4 bottom-[14svh] md:inset-x-auto md:bottom-[10vh] md:left-[8vw] md:w-[26rem]">
          <div className="story-captions mac-captions">
            {ITEMS.map((item, i) => (
              <div key={item.key} data-mac-caption className={`story-caption ${i === 0 ? 'is-active' : ''}`}>
                <div className="glass rounded-[1.75rem] bg-noche/40 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-3xl font-bold md:text-4xl">{item.title}</h3>
                      <p className="mt-1 text-white/60">{item.text}</p>
                    </div>
                    <p className="font-display text-3xl font-bold whitespace-nowrap text-rosa">{item.price}</p>
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1 text-sm text-white/50">
                      <MapPin className="h-4 w-4" /> {item.place}
                    </span>
                    <span className="btn-primary flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold">
                      <MessageCircle className="h-4 w-4" /> Message seller
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default MacScene
