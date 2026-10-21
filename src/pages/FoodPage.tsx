import { Link, useSearchParams } from 'react-router'
import { ChefHat, Plus } from 'lucide-react'
import { DIETARY, fetchListings } from '../lib/listings'
import type { Dietary } from '../lib/listings'
import { startOfDay } from '../lib/format'
import { useAuth } from '../lib/auth'
import { useQuery } from '../lib/useQuery'
import SpaceTabs from '../components/SpaceTabs'
import FoodCard from '../components/FoodCard'
import LoginPrompt from '../components/LoginPrompt'
import { Pill } from '../components/FilterSheet'
import { useT } from '../i18n/lang'

// Comida casera de estudiantes. Los filtros (vegano, halal…, "listo hoy") viven en la URL.
function FoodPage() {
  const { session } = useAuth()
  const [params, setParams] = useSearchParams()
  const diet = (params.get('diet')?.split(',') ?? []).filter((d): d is Dietary => DIETARY.some((tag) => tag.value === d))
  const today = params.has('today')
  const t = useT()

  const { data, loading, error } = useQuery(session ? `food|${diet.join(',')}` : null, () =>
    fetchListings({ category: 'food', dietary: diet }),
  )
  // "Listo hoy": lo filtramos aquí, porque depende de la hora del móvil.
  const shown = today ? data?.filter((dish) => !dish.ready_at || new Date(dish.ready_at) < startOfDay(1)) : data

  function set(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  function toggleDiet(tag: Dietary) {
    set('diet', (diet.includes(tag) ? diet.filter((d) => d !== tag) : [...diet, tag]).join(','))
  }

  return (
    <div className="space-y-6">
      <SpaceTabs />

      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">{t('Food')}</h1>
          <p className="mt-1 text-sm text-white/60">{t('Home-cooked by students, picked up on campus.')}</p>
        </div>
        <Link
          to="/sell?category=food"
          className="btn-primary flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> <span className="sm:hidden">{t('Sell')}</span>
          <span className="hidden sm:inline">{t('Sell a dish')}</span>
        </Link>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Pill active={today} onClick={() => set('today', today ? '' : '1')}>
          🕒 {t('Ready today')}
        </Pill>
        {DIETARY.map((tag) => (
          <Pill key={tag.value} active={diet.includes(tag.value)} onClick={() => toggleDiet(tag.value)}>
            <span className="whitespace-nowrap">
              {tag.emoji} {t(tag.label)}
            </span>
          </Pill>
        ))}
      </div>

      {!session ? (
        <LoginPrompt title={t("See what's cooking on campus")} />
      ) : error ? (
        <p className="rounded-2xl border border-rojo/40 bg-rojo/10 p-6 text-center text-rosa">{t(error)}</p>
      ) : loading || !shown ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="glass aspect-[4/4.6] animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center">
          <ChefHat className="mx-auto h-9 w-9 text-rosa" />
          <h2 className="mt-3 text-xl font-bold">
            {t(diet.length || today ? 'No dishes match these filters' : 'The kitchen is empty (for now)')}
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-white/60">
            {t('Cooked too much? Share your best dish from home — a few euros a portion is a great deal for everyone.')}
          </p>
          <Link to="/sell?category=food" className="btn-primary mt-5 inline-block rounded-full px-5 py-2.5 text-sm font-semibold">
            {t('Sell a dish')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((dish) => (
            <FoodCard key={dish.id} listing={dish} />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-white/60">
        {t("Dishes are cooked by students, not professional kitchens. Check the allergens and ask the cook if you're unsure.")}
      </p>
    </div>
  )
}

export default FoodPage
