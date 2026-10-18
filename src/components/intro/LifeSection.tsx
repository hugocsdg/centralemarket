import { Warehouse } from 'lucide-react'
import type { IntroCopy } from '../../i18n/intro'

// "Arrive. Stay. Leave.": un año en el campus en tres columnas, separadas por líneas rojas finas
// que se dibujan solas al llegar (data-draw, en lib/useIntroAnimations.ts).
// Debajo, Campus Storage como idea en camino (aún no existe, y se dice claramente).

function LifeSection({ copy }: { copy: IntroCopy }) {
  const t = copy.life
  return (
    <section id="life" data-chapter className="mx-auto max-w-6xl px-4 py-24 md:py-32">
      <h2
        data-reveal
        className="max-w-[18ch] font-display text-4xl leading-[1.05] font-bold tracking-[-0.03em] text-balance md:text-6xl"
      >
        {t.title}
      </h2>

      <div className="mt-14 grid gap-10 md:mt-20 md:grid-cols-3 md:gap-8">
        {t.moments.map((moment, i) => (
          <article key={i} data-reveal>
            <span
              aria-hidden="true"
              data-draw
              className="block h-px origin-left bg-gradient-to-r from-carmin via-carmin/60 to-transparent"
            />
            <h3 className="mt-6 font-display text-5xl font-bold tracking-[-0.035em] md:text-6xl">{moment.title}</h3>
            <p className="mt-4 max-w-xs text-white/75 md:text-lg">{moment.text}</p>
          </article>
        ))}
      </div>

      <div
        data-reveal
        className="mt-20 flex flex-col gap-5 rounded-[1.75rem] border border-dashed border-white/15 p-7 md:flex-row md:items-center md:p-9"
      >
        <Warehouse aria-hidden="true" className="h-8 w-8 shrink-0 text-plata" />
        <div>
          <h3 className="text-xl font-semibold md:text-2xl">{t.storageTitle}</h3>
          <p className="mt-2 max-w-2xl text-white/70">{t.storageText}</p>
        </div>
      </div>
    </section>
  )
}

export default LifeSection
