import { LampDesk, Luggage, PlaneLanding, RefreshCw, Sparkles } from 'lucide-react'

// Viaje horizontal: al bajar, los paneles se desplazan de lado, como pasar las páginas de un año en el campus.

const STOPS = [
  { icon: PlaneLanding, when: 'September', title: 'You arrive with an empty room.', text: 'No desk, no lamp, no kettle. And a student budget.' },
  { icon: LampDesk, when: 'Week one', title: 'You furnish it from other students.', text: 'A desk for 15 €, a lamp for 8 €. Picked up on campus.' },
  { icon: Sparkles, when: 'All year', title: 'You buy, sell and swap.', text: 'Party tickets, homemade food, tutoring, bikes.' },
  { icon: Luggage, when: 'June', title: 'Leaving? List it all in minutes.', text: 'No more panic-selling the night before your flight.' },
  { icon: RefreshCw, when: 'September again', title: 'The next student starts with your things.', text: 'Nothing wasted. The circle keeps turning.' },
]

function Journey() {
  return (
    <section data-journey className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden py-16">
      <div className="mx-auto w-full max-w-6xl px-4">
        <p className="text-xs font-semibold tracking-[0.25em] text-rosa uppercase">A year on campus</p>
        <h2 className="mt-2 text-3xl font-bold md:text-5xl">Things change hands. Life goes on.</h2>
      </div>

      <div data-journey-track className="journey-track mt-8 flex gap-4 pr-[10vw] pl-4 md:mt-12 md:gap-6 md:pl-[max(1rem,calc((100vw-72rem)/2+1rem))]">
        {STOPS.map(({ icon: Icon, when, title, text }, i) => (
          <article
            key={when}
            className="glass relative flex h-[44svh] w-[78vw] shrink-0 flex-col justify-between overflow-hidden rounded-[2rem] p-6 md:h-[52svh] md:w-[40vw] md:p-10"
          >
            <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-carmin/20 blur-3xl" />
            <div className="relative flex items-start justify-between">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-carmin to-burdeos shadow-lg shadow-rojo/40 md:h-16 md:w-16">
                <Icon className="h-7 w-7 md:h-8 md:w-8" />
              </span>
              <span className="text-shine font-display text-6xl leading-none font-bold opacity-30 md:text-8xl">
                {i + 1}
              </span>
            </div>
            <div className="relative">
              <p className="text-sm font-semibold text-rosa">{when}</p>
              <h3 className="mt-2 text-2xl leading-tight font-bold md:text-4xl">{title}</h3>
              <p className="mt-3 text-white/60 md:text-lg">{text}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mx-auto mt-8 w-full max-w-6xl px-4">
        <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
          <div data-journey-fill className="h-full origin-left scale-x-0 bg-gradient-to-r from-carmin to-plata" />
        </div>
      </div>
    </section>
  )
}

export default Journey
