import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { CONDITIONS, LOCATIONS } from '../lib/listings'
import type { Condition, Sort } from '../lib/listings'
import type { Filters } from '../lib/filters'

const SORTS: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Lowest price' },
  { value: 'price-desc', label: 'Highest price' },
]
const PRICE_PRESETS = [10, 20, 50, 100]

type FilterSheetProps = {
  open: boolean
  filters: Filters
  // Cambia uno o varios parámetros de la URL a la vez ("" lo quita).
  onChange: (changes: Record<string, string>) => void
  onClear: () => void
  onClose: () => void
  resultLabel: string
}

// Panel de filtros: desde abajo en el móvil, ventana centrada en el ordenador.
// Cada cambio se aplica al momento (los resultados se ven detrás).
function FilterSheet({ open, filters, onChange, onClear, onClose, resultLabel }: FilterSheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    // Que la página de detrás no se mueva mientras usas el panel.
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [open, onClose])

  if (!open) return null

  function toggleCondition(condition: Condition) {
    const next = filters.conditions.includes(condition)
      ? filters.conditions.filter((c) => c !== condition)
      : [...filters.conditions, condition]
    onChange({ cond: next.join(',') })
  }

  const presetActive = (amount: number) => filters.max === String(amount) && !filters.min

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label="Filters">
      <button aria-label="Close filters" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative flex max-h-[88dvh] w-full flex-col rounded-t-[2rem] border border-white/10 bg-grafito/95 shadow-2xl backdrop-blur-xl md:max-w-lg md:rounded-[2rem]">
        {/* Asa para que se entienda que es un panel que sube */}
        <span className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-white/20 md:hidden" aria-hidden="true" />

        <div className="flex items-center justify-between px-5 pt-3 pb-2 md:pt-5">
          <h2 className="text-xl font-bold">Filters</h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto px-5 pb-4">
          <Group title="Sort by">
            <div className="grid grid-cols-3 gap-1 rounded-full bg-white/5 p-1">
              {SORTS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onChange({ sort: option.value === 'newest' ? '' : option.value })}
                  className={`min-h-11 rounded-full px-2 text-sm font-medium transition ${
                    filters.sort === option.value ? 'btn-primary text-white' : 'text-white/70 hover:bg-white/10'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Group>

          <Group title="Price">
            <div className="flex items-center gap-2">
              <PriceInput label="Min" value={filters.min} disabled={filters.free} onChange={(v) => onChange({ min: v })} />
              <span className="text-white/40">–</span>
              <PriceInput label="Max" value={filters.max} disabled={filters.free} onChange={(v) => onChange({ max: v })} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {PRICE_PRESETS.map((amount) => (
                <Pill
                  key={amount}
                  active={presetActive(amount)}
                  onClick={() => {
                    onChange({ min: '', max: presetActive(amount) ? '' : String(amount) })
                  }}
                >
                  Under {amount} €
                </Pill>
              ))}
              <Pill active={filters.free} onClick={() => onChange({ free: filters.free ? '' : '1' })}>
                Free only
              </Pill>
            </div>
          </Group>

          <Group title="Condition">
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((condition) => (
                <Pill key={condition} active={filters.conditions.includes(condition)} onClick={() => toggleCondition(condition)}>
                  {condition}
                </Pill>
              ))}
            </div>
          </Group>

          <Group title="Pickup area">
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map((place) => (
                <Pill
                  key={place}
                  active={filters.location === place}
                  onClick={() => onChange({ loc: filters.location === place ? '' : place })}
                >
                  {place}
                </Pill>
              ))}
            </div>
          </Group>

          <Group title="Show only">
            <div className="divide-y divide-white/5 rounded-2xl bg-white/5">
              <Toggle checked={filters.available} onChange={(on) => onChange({ avail: on ? '1' : '' })}>
                Available now <Hint>hide reserved items</Hint>
              </Toggle>
              <Toggle checked={filters.priceDrop} onChange={(on) => onChange({ drop: on ? '1' : '' })}>
                Price drops <Hint>recently reduced</Hint>
              </Toggle>
              <Toggle checked={filters.movingOut} onChange={(on) => onChange({ moving: on ? '1' : '' })}>
                Moving-out sales <Hint>sellers leaving campus</Hint>
              </Toggle>
            </div>
          </Group>
        </div>

        <div className="flex gap-2 border-t border-white/10 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            onClick={onClear}
            className="min-h-12 rounded-full border border-white/20 px-5 text-sm font-semibold text-white/80 hover:border-white/40"
          >
            Clear all
          </button>
          <button onClick={onClose} className="btn-primary min-h-12 flex-1 rounded-full px-5 text-sm font-semibold">
            {resultLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 font-sans text-sm font-semibold text-white/80">{title}</h3>
      {children}
    </section>
  )
}

function Hint({ children }: { children: ReactNode }) {
  return <span className="block text-xs font-normal text-white/60">{children}</span>
}

export function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-medium whitespace-nowrap transition ${
        active ? 'btn-primary text-white' : 'border border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}

function PriceInput({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string
  value: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  return (
    <label className="relative flex-1">
      <span className="sr-only">{label} price</span>
      <input
        inputMode="decimal"
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/[^\d.,]/g, '').replace(',', '.'))}
        placeholder={label}
        className="min-h-12 w-full rounded-xl border border-white/15 bg-white/10 px-4 pr-9 text-white outline-none placeholder:text-white/50 focus:border-rosa disabled:opacity-40"
      />
      <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-white/60">€</span>
    </label>
  )
}

function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (on: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 px-4 py-2.5 text-sm font-medium">
      <span>{children}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
      {/* Interruptor tipo iPhone */}
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full bg-white/15 transition peer-checked:bg-carmin peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-rosa after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
      />
    </label>
  )
}

export default FilterSheet
